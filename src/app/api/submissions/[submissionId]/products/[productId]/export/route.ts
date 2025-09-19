import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// --- helpers ---
function fmtDate(d?: Date | string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function fmtMoney(n: any, currency = "USD") {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v);
  } catch {
    return v.toFixed(2);
  }
}

async function buildDocxBuffer(prod: any) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } =
    await import("docx");

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: `SKU ${prod.sku} — ${prod.productName}`,
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Submission #", bold: true }),
              new TextRun(String(prod.submission?.id ?? "—")),
              new TextRun("   "),
              new TextRun({ text: "Request #", bold: true }),
              new TextRun(String(prod.submission?.requestId ?? "—")),
            ],
          }),

          new Paragraph({ text: "" }),

          // Core
          new Paragraph({ text: "Core Details", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `SKU: ${prod.sku}` }),
          new Paragraph({ text: `Product Name: ${prod.productName}` }),
          new Paragraph({ text: `Stamp: ${prod.stamp ?? "—"}` }),
          new Paragraph({ text: `Off-Sale Message: ${prod.offSaleMessage ?? "—"}` }),
          new Paragraph({ text: "" }),

          // Descriptions
          new Paragraph({ text: "Descriptions", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Short: ${prod.shortDescription ?? "—"}` }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Long:", spacing: { after: 120 } }),
          new Paragraph({ text: (prod.longDescription ?? "").replace(/\s+/g, " ").slice(0, 4000) || "—" }),
          new Paragraph({ text: "" }),

          // Markets table
          new Paragraph({ text: "Markets", heading: HeadingLevel.HEADING_2 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Market", "UOM", "Currency", "Savings", "On Sale", "Off Sale", "No End?"].map(
                  (h) => new TableCell({ children: [new Paragraph({ text: h })] })
                ),
              }),
              ...(prod.markets ?? []).map((m: any) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(String(m.market))] }),
                    new TableCell({
                      children: [
                        new Paragraph([m.uomValue, m.uomTitle].filter(Boolean).join(" ") || "—"),
                      ],
                    }),
                    new TableCell({ children: [new Paragraph(m.currency ?? "—")] }),
                    new TableCell({
                      children: [new Paragraph(m.noSavings ? "—" : fmtMoney(m.savings, m.currency ?? "USD"))],
                    }),
                    new TableCell({ children: [new Paragraph(fmtDate(m.onSaleDate))] }),
                    new TableCell({ children: [new Paragraph(fmtDate(m.offSaleDate))] }),
                    new TableCell({ children: [new Paragraph(m.noEndDate ? "Yes" : "No")] }),
                  ],
                })
              ),
            ],
          }),
          new Paragraph({ text: "" }),

          // Translations
          new Paragraph({ text: "Translations", heading: HeadingLevel.HEADING_2 }),
          ...(prod.cultures?.length
            ? prod.cultures.map(
                (c: any) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${c.cultureCode}: `, bold: true }),
                      new TextRun(`${c.translatedName ?? "—"} | `),
                      new TextRun(`${c.translatedShort ?? "—"}`),
                    ],
                  })
              )
            : [new Paragraph({ text: "—" })]),

          new Paragraph({ text: "" }),

          // Accessories
          new Paragraph({ text: "Accessories", heading: HeadingLevel.HEADING_2 }),
          ...(prod.accessories?.length
            ? prod.accessories.map(
                (a: any) => new Paragraph({ text: [a.accessorySku, a.accessoryLabel].filter(Boolean).join(" — ") })
              )
            : [new Paragraph({ text: "—" })]),

          new Paragraph({ text: "" }),

          // Recommendations
          new Paragraph({ text: "Recommended Products", heading: HeadingLevel.HEADING_2 }),
          ...(prod.recommendations?.length
            ? prod.recommendations.map((r: any) => new Paragraph({ text: r.recommendedSku ?? "—" }))
            : [new Paragraph({ text: "—" })]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

async function buildPdfBuffer(prod: any) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 760;
  const left = 40;
  const line = (text: string, bold = false, dy = 16) => {
    y -= dy;
    page.drawText(text, {
      x: left,
      y,
      size: 11,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
      maxWidth: 532,
    });
  };

  line(`SKU ${prod.sku} — ${prod.productName}`, true, 0);
  line(`Submission #${prod.submission?.id ?? "—"}  |  Request #${prod.submission?.requestId ?? "—"}`);

  y -= 8;
  line("Core Details", true, 22);
  line(`SKU: ${prod.sku}`);
  line(`Stamp: ${prod.stamp ?? "—"}`);
  line(`Off-Sale Message: ${prod.offSaleMessage ?? "—"}`);

  y -= 8;
  line("Short Description", true, 22);
  line(`${prod.shortDescription ?? "—"}`);

  y -= 8;
  line("Long Description", true, 22);
  (prod.longDescription ?? "—")
  .replace(/\s+/g, " ")
  .split(/(.{1,90})(?:\s|$)/g)
  .filter(Boolean)
  .forEach((row: string) => line(row));

  y -= 8;
  line("Markets", true, 22);
  (prod.markets ?? []).forEach((m: any) => {
    const uom = [m.uomValue, m.uomTitle].filter(Boolean).join(" ") || "—";
    line(
      `${m.market} | UOM: ${uom} | ${m.currency ?? "USD"} | Savings: ${
        m.noSavings ? "—" : fmtMoney(m.savings, m.currency ?? "USD")
      } | On: ${fmtDate(m.onSaleDate)} | Off: ${m.noEndDate ? "No end" : fmtDate(m.offSaleDate)}`
    );
  });
  if (!(prod.markets ?? []).length) line("—");

  y -= 8;
  line("Translations", true, 22);
  (prod.cultures ?? []).forEach((c: any) =>
    line(`${c.cultureCode}: ${c.translatedName ?? "—"} | ${c.translatedShort ?? "—"}`)
  );
  if (!(prod.cultures ?? []).length) line("—");

  y -= 8;
  line("Accessories", true, 22);
  (prod.accessories ?? []).forEach((a: any) =>
    line([a.accessorySku, a.accessoryLabel].filter(Boolean).join(" — "))
  );
  if (!(prod.accessories ?? []).length) line("—");

  y -= 8;
  line("Recommended Products", true, 22);
  (prod.recommendations ?? []).forEach((r: any) => line(r.recommendedSku ?? "—"));
  if (!(prod.recommendations ?? []).length) line("—");

  const pdf = await doc.save();
  return Buffer.from(pdf);
}

// --- GET /export?format=docx|pdf ---
export async function GET(
  req: Request,
  {
    params,
  }: {
    params:
      | Promise<{ submissionId: string; productId: string }>
      | { submissionId: string; productId: string };
  }
) {
  const awaited = params instanceof Promise ? await params : params;
  const submissionId = Number(awaited.submissionId);
  const productId = Number(awaited.productId);
  if (!Number.isFinite(submissionId) || !Number.isFinite(productId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "docx").toLowerCase();

  // Load the current product + relations
  const prod = await prisma.submissionProduct.findUnique({
    where: { id: productId },
    include: {
      submission: { select: { id: true, requestId: true, note: true, createdAt: true } },
      accessories: true,
      recommendations: true,
      cultures: true,
      markets: true,
    },
  });

  if (!prod || prod.submissionId !== submissionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseName = `sku-${prod.sku}-${productId}`;

  if (format === "pdf") {
    const pdf = await buildPdfBuffer(prod);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

// Helper: normalize any Buffer/ArrayBuffer/View into a Uint8Array
function toUint8Array(input: unknown): Uint8Array {
  // Node Buffer
  // @ts-ignore Buffer exists in node runtime
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    // Reuse underlying memory without copy
    // @ts-ignore Buffer type in node
    const b: Buffer = input as any;
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  }
  // Already a Uint8Array
  if (input instanceof Uint8Array) return input;
  // Any typed array/DataView
  if (ArrayBuffer.isView(input)) {
    const v = input as ArrayBufferView;
    return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  }
  // Raw ArrayBuffer (not SharedArrayBuffer)
  if (input instanceof ArrayBuffer) return new Uint8Array(input);

  throw new Error("Unsupported binary type from buildDocxBuffer()");
}

// … inside your handler where you build the file:

const docxRaw = await buildDocxBuffer(prod); // could be Buffer/Uint8Array/ArrayBuffer
const docxBytes = toUint8Array(docxRaw);     // <- concrete Uint8Array

// normalize -> Uint8Array (use your existing helper if you have one)
const raw = await buildDocxBuffer(prod);
const bytes =
  raw instanceof Uint8Array
    ? raw
    // @ts-ignore Buffer in node
    : (Buffer.isBuffer?.(raw) ? new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength)
                              : new Uint8Array(raw as ArrayBuffer));

// Hand Response a clean ArrayBuffer slice (no extra offset/length issues)
const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

return new Response(ab, {
  status: 200,
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    "Cache-Control": "no-store",
  },
});
}