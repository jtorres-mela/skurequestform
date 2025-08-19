// app/api/import/word/preview/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { parseStringPromise, processors } from "xml2js";
import { parse, isValid } from "date-fns";

export const runtime = "nodejs";

// ---------- helpers ----------
const PLACEHOLDER = "Click or tap here to enter text.";

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<")
   .replace(/&gt;/g, ">")
   .replace(/&amp;/g, "&")
   .replace(/&quot;/g, '"')
   .replace(/&apos;/g, "'");

const clean = (v?: string | null) => {
  if (!v) return "";
  // remove ALL xml tags first, normalize whitespace, decode entities, drop placeholder
  let t = v.replace(/<[^>]+>/g, "");     // strip tags
  t = decodeXml(t);
  t = t.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
  return t.toLowerCase() === PLACEHOLDER.toLowerCase() ? "" : t;
};

const parseDateMaybe = (v?: string) => {
  const t = clean(v);
  if (!t) return null;
  const d = parse(t, "M/d/yyyy", new Date());
  return isValid(d) ? d.toISOString() : t; // keep string if non-standard
};
const parseCSV = (v?: string) =>
  clean(v).split(",").map((s) => s.trim()).filter(Boolean);

function findAllSdt(node: any): any[] {
  const out: any[] = [];
  if (!node || typeof node !== "object") return out;
  for (const [k, v] of Object.entries(node)) {
    if (Array.isArray(v)) {
      if (k === "w:sdt") out.push(...v);
      for (const child of v) out.push(...findAllSdt(child));
    }
  }
  return out;
}
function extractText(sdtContent: any): string {
  const parts: string[] = [];
  (function walk(n: any) {
    if (!n || typeof n !== "object") return;
    for (const [k, v] of Object.entries(n)) {
      if (!Array.isArray(v)) continue;
      if (k === "w:t") {
        for (const t of v) {
          const text = typeof t === "string" ? t : t?._ ?? t?.["#"];
          if (typeof text === "string") parts.push(text);
        }
      } else if (k === "w:br") {
        parts.push("\n");
      } else {
        for (const c of v) walk(c);
      }
    }
  })(sdtContent);
  return parts.join("").trim();
}

async function extractControlsFast(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")!.async("string");

  const map: Record<string, string> = {};
  const sdtBlocks = [...xml.matchAll(/<w:sdt\b[\s\S]*?<\/w:sdt>/g)];

  for (const m of sdtBlocks) {
    const block = m[0];

    // read title/tag
    const aliasMatch = block.match(/<w:alias[^>]*\bw:val="([^"]+)"/);
    const tagMatch   = block.match(/<w:tag[^>]*\bw:val="([^"]+)"/);
    const key = (aliasMatch?.[1] || tagMatch?.[1] || "").trim();
    if (!key) continue;

    // collect ONLY the inner text of all <w:t> nodes
    const textParts = [...block.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map(g => decodeXml(g[1]));
    const text = textParts.join("").trim();

    map[key.toLowerCase()] = text;
  }

  return map;
}



// ---------- route ----------
export async function POST(req: Request) {
  const debug = new URL(req.url).searchParams.get("debug") === "1";

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "Must be .docx" }, { status: 400 });
  }

  // 1) parse controls
const m = await extractControlsFast(file);
const get = (k: string) => clean(m[k.toLowerCase()]);

  // 2) map known titles from your template -> form
  // Titles present in your doc:
  // sku, productnameus, productnameca, shortdescriptionus, shortdescriptionca,
  // longdescriptionus, longdescriptionca, offsalemessage, onsaledate, offsaledate,
  // recommendedproducts, accessories,
  // unitofmeasuretitleus, unitofmeasurevalueus, unitofmeasuretitleca, unitofmeasurevalueca,
  // savingscalloutus, savingscalloutca

  const sku = get("sku");
  const productNameUS = get("productnameus");
  const productNameCA = get("productnameca");
  const shortUS = get("shortdescriptionus");
  const shortCA = get("shortdescriptionca");
  const longUS = get("longdescriptionus");
  const longCA = get("longdescriptionca");

  // Handle both the "unitofmeasure..." titles and the older "uom..." fallbacks if present
  const uomTitleUS = get("unitofmeasuretitleus") || get("uomtitleus");
  const uomValueUS = get("unitofmeasurevalueus") || get("uomvalueus");
  const uomTitleCA = get("unitofmeasuretitleca") || get("uomtitleca");
  const uomValueCA = get("unitofmeasurevalueca") || get("uomvalueca");

  // 3) build outbound preview payload
  const out = {
    requester: clean((form.get("requester") as string) || ""),
    note: clean((form.get("note") as string) || ""),
    products: [
      {
        sku,
        productName: productNameUS || productNameCA || "",
        size: "",
        shortDescription: "",
        longDescription: "",
        stamp: "", // not supplied by the doc as a separate field
        offSaleMessage: get("offsalemessage") || "",

        onSaleDate: parseDateMaybe(get("onsaledate")),
        offSaleDate: parseDateMaybe(get("offsaledate")),

        uomTitleUS,
        uomValueUS,
        uomTitleCA,
        uomValueCA,

        savingsUS: get("savingscalloutus") || "",
        savingsCA: get("savingscalloutca") || "",

        recommendations: parseCSV(get("recommendedproducts")).map((s) => ({ sku: s })),
        accessories: parseCSV(get("accessories")).map((s) => ({ accessorySku: s })),

        cultures: [
          (productNameUS || shortUS || longUS) && {
            cultureCode: "en-US",
            translatedName: productNameUS || "",
            translatedShort: shortUS || "",
            translatedLong: longUS || "",
          },
          (productNameCA || shortCA || longCA) && {
            cultureCode: "en-CA",
            translatedName: productNameCA || "",
            translatedShort: shortCA || "",
            translatedLong: longCA || "",
          },
        ].filter(Boolean) as any[],
      },
    ],
  };

  // 4) include raw map in debug mode
  const debugData = debug ? { rawMap: m } : undefined;
return NextResponse.json({
  ...out,
  rawMap: m,
  foundKeys: Object.keys(m),
});
}
