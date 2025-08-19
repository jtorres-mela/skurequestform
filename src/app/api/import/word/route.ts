// app/api/import/word/route.ts
// Accepts: multipart/form-data with field "file" (a .docx)
// Optional text fields: requester, note (will be saved on Submission)

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";
import { prisma } from "@/lib/prisma";
import { parse, isValid } from "date-fns";

// --- helpers ----------------------------------------------------

const PLACEHOLDER = "Click or tap here to enter text.";

function collapseWhitespace(s: string) {
  return s.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}

function cleanField(v?: string | null) {
  if (!v) return null;
  const t = collapseWhitespace(v);
  if (!t || t.toLowerCase() === PLACEHOLDER.toLowerCase()) return null;
  return t;
}

function parseDateMaybe(v?: string | null) {
  const t = cleanField(v || "");
  if (!t) return null;
  // try M/d/yyyy
  const d = parse(t, "M/d/yyyy", new Date());
  return isValid(d) ? d.toISOString() : t; // store ISO if valid, else keep raw string
}

function parseCommaList(v?: string | null) {
  const t = cleanField(v || "");
  if (!t) return [];
  return t
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Extract all content controls across document parts and return alias->value map.
// Titles/aliases are lowercased to make matching easy.
async function extractControlsFromDocx(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);

  const xmlPartNames = Object.keys(zip.files).filter(
    (n) => n.startsWith("word/") && n.endsWith(".xml")
  );

  const mapping: Record<string, string> = {};

  for (const part of xmlPartNames) {
    const xml = await zip.file(part)!.async("string");
    const doc = await parseStringPromise(xml);

    // Walk all w:sdt (content controls)
    const body =
      doc["w:document"]?.["w:body"] ??
      doc["w:hdr"] ??
      doc["w:ftr"] ??
      doc["w:textbox"] ??
      [];

    // Flatten possible arrays
    const sdtNodes = findAllSdt(doc);

    for (const sdt of sdtNodes) {
      const sdtPr = sdt["w:sdtPr"]?.[0];
      const sdtContent = sdt["w:sdtContent"]?.[0];
      if (!sdtPr || !sdtContent) continue;

      const aliasVal =
        sdtPr["w:alias"]?.[0]?.["$"]?.["w:val"] ||
        sdtPr["w:tag"]?.[0]?.["$"]?.["w:val"];

      if (!aliasVal) continue;

      const key = String(aliasVal).toLowerCase();
      const text = extractTextFromSdtContent(sdtContent);
      if (typeof text === "string") {
        // If a key appears multiple times, last one wins (adjust if you prefer arrays)
        mapping[key] = text;
      }
    }
  }

  return mapping;
}

// Recursively find all w:sdt nodes (xml2js object traversal)
function findAllSdt(node: any): any[] {
  const out: any[] = [];
  if (!node || typeof node !== "object") return out;
  for (const [k, v] of Object.entries(node)) {
    if (!Array.isArray(v)) continue;
    if (k === "w:sdt") out.push(...v);
    for (const child of v) {
      out.push(...findAllSdt(child));
    }
  }
  return out;
}

// Extract visible text from sdt content (collect w:t with w:br -> \n)
function extractTextFromSdtContent(sdtContent: any): string {
  const lines: string[] = [];

  function walk(n: any) {
    if (!n || typeof n !== "object") return;
    for (const [k, v] of Object.entries(n)) {
      if (!Array.isArray(v)) continue;
      if (k === "w:t") {
        for (const t of v) {
          const text = typeof t === "string" ? t : t?._ ?? t?.["#"];
          if (typeof text === "string") lines.push(text);
        }
      } else if (k === "w:br") {
        // line break
        lines.push("\n");
      } else {
        for (const child of v) walk(child);
      }
    }
  }

  walk(sdtContent);

  return lines.join("").trim();
}

// --- route ------------------------------------------------------

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const requester = (form.get("requester") as string) || undefined;
  const noteFromForm = (form.get("note") as string) || undefined;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded (field: file)" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "File must be a .docx" }, { status: 400 });
  }

  // 1) Pull alias->value map
  const map = await extractControlsFromDocx(file);

  // 2) Normalize and map to your schema
  const sku = cleanField(map["sku"]);
  if (!sku) {
    return NextResponse.json({ error: "Missing required field: sku" }, { status: 400 });
  }

  // Product base
  const productNameUS = cleanField(map["productnameus"]);
  const productNameCA = cleanField(map["productnameca"]);
  const offSaleMessage = cleanField(map["offsalemessage"]);
  const shortUS = cleanField(map["shortdescriptionus"]);
  const shortCA = cleanField(map["shortdescriptionca"]);
  const longUS = cleanField(map["longdescriptionus"]);
  const longCA = cleanField(map["longdescriptionca"]);

  // Optional meta not in your schema — keep in Submission.note so we don’t lose it
  const onSaleDate = parseDateMaybe(map["onsaledate"]);
  const offSaleDate = parseDateMaybe(map["offsaledate"]);
  const uomTitleUS = cleanField(map["uomtitleus"]);
  const uomValueUS = cleanField(map["uomvalueus"]);
  const uomTitleCA = cleanField(map["uomtitleca"]);
  const uomValueCA = cleanField(map["uomvalueca"]);
  const savingsUS = cleanField(map["savingscalloutus"]);
  const savingsCA = cleanField(map["savingscalloutca"]);

  // Lists -> accessories (combine "recommendedproducts" and "accessories" if you want both)
  const recommended = parseCommaList(map["recommendedproducts"]);
  const accessoriesFreeText = parseCommaList(map["accessories"]);
  const accessoriesCreate = [...recommended, ...accessoriesFreeText].map((sku) => ({
    accessorySku: sku,
  }));

  // Build cultures create
  const culturesCreate: Array<{
    cultureCode: string;
    translatedName?: string | null;
    translatedShort?: string | null;
    translatedLong?: string | null;
  }> = [];

  // en-US
  if (productNameUS || shortUS || longUS) {
    culturesCreate.push({
      cultureCode: "en-US",
      translatedName: productNameUS ?? null,
      translatedShort: shortUS ?? null,
      translatedLong: longUS ?? null,
    });
  }

  // en-CA
  if (productNameCA || shortCA || longCA) {
    culturesCreate.push({
      cultureCode: "en-CA",
      translatedName: productNameCA ?? null,
      translatedShort: shortCA ?? null,
      translatedLong: longCA ?? null,
    });
  }

  // 3) Persist
  // Append meta into note so it’s visible in admin until you add fields to schema
  const metaBits = [
    onSaleDate ? `OnSale: ${onSaleDate}` : null,
    offSaleDate ? `OffSale: ${offSaleDate}` : null,
    uomTitleUS ? `UOM US: ${uomValueUS ?? ""} ${uomTitleUS}`.trim() : null,
    uomTitleCA ? `UOM CA: ${uomValueCA ?? ""} ${uomTitleCA}`.trim() : null,
    savingsUS ? `Savings US: ${savingsUS}` : null,
    savingsCA ? `Savings CA: ${savingsCA}` : null,
  ].filter(Boolean);

  const noteCombined =
    [noteFromForm, metaBits.join(" | ")].filter(Boolean).join(" | ") || undefined;

  const submission = await prisma.submission.create({
    data: {
      ...(requester ? { requester } : {}),
      ...(noteCombined ? { note: noteCombined } : {}),
      products: {
        create: [
          {
            sku,
            productName: productNameUS ?? productNameCA ?? "(Untitled)",
            // map other base fields when you add them to the template
            offSaleMessage: offSaleMessage ?? null,
            accessories: accessoriesCreate.length
              ? { create: accessoriesCreate }
              : undefined,
            cultures: culturesCreate.length
              ? { create: culturesCreate }
              : undefined,
          },
        ],
      },
    },
    include: { products: { include: { accessories: true, cultures: true } } },
  });

  return NextResponse.json(submission, { status: 201 });
}
