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

  // Create doc + fonts
  const doc = await PDFDocument.create();
  let page = doc.addPage([612, 792]); // US Letter (72dpi): 8.5" x 11"
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Layout constants
  const margin = { top: 56, right: 40, bottom: 56, left: 40 };
  const leading = 16;       // line height
  const titleSize = 16;
  const h2Size = 13;
  const bodySize = 11;

  let y = page.getHeight() - margin.top;
  const contentWidth = page.getWidth() - margin.left - margin.right;

  // --- utils ---------------------------------------------------------------
  const stripHtml = (html: string) => {
    return (html || "")
      .replace(/<\/(p|div|h\d|li)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };

  // Split a paragraph into lines that fit contentWidth with current font/size
  function wrapText(text: string, size: number, bold = false): string[] {
    const f = bold ? fontBold : font;
    const lines: string[] = [];

    // Respect explicit newlines (from stripped HTML)
    const paras = (text || "").split(/\r?\n/);
    for (const para of paras) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { lines.push(""); continue; }

      let current = "";
      for (const w of words) {
        const attempt = current ? current + " " + w : w;
        const width = f.widthOfTextAtSize(attempt, size);
        if (width <= contentWidth) {
          current = attempt;
        } else {
          if (current) lines.push(current);
          // Hard-break individual very-long words
          let rest = w;
          while (f.widthOfTextAtSize(rest, size) > contentWidth) {
            // crude proportional cut based on widths
            const ratio = contentWidth / f.widthOfTextAtSize(rest, size);
            const cut = Math.max(1, Math.floor(ratio * rest.length));
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
          current = rest;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }

  function ensureSpace(lineCount: number) {
    if (y - lineCount * leading < margin.bottom) {
      page = doc.addPage([612, 792]);
      y = page.getHeight() - margin.top;
    }
  }

  function drawLines(lines: string[], size: number, bold = false) {
    ensureSpace(lines.length);
    const f = bold ? fontBold : font;
    for (const s of lines) {
      page.drawText(s, {
        x: margin.left,
        y,
        size,
        font: f,
        color: rgb(0, 0, 0),
      });
      y -= leading;
    }
  }

  function heading(text: string) {
    y -= 8; // spacing before headings
    drawLines(wrapText(text, h2Size, true), h2Size, true);
  }

  function para(text: string, opts?: { bold?: boolean; size?: number }) {
    const size = opts?.size ?? bodySize;
    const bold = !!opts?.bold;
    drawLines(wrapText(text, size, bold), size, bold);
  }

  // --- content -------------------------------------------------------------
  para(`SKU ${prod.sku} — ${prod.productName}`, { bold: true, size: titleSize });
  para(`Submission #${prod.submission?.id ?? "—"}  |  Request #${prod.submission?.requestId ?? "—"}`);

  heading("Core Details");
  para(`SKU: ${prod.sku}`);
  para(`Stamp: ${prod.stamp ?? "—"}`);
  para(`Off-Sale Message: ${prod.offSaleMessage ?? "—"}`);

  heading("Short Description");
  para(stripHtml(prod.shortDescription ?? "—"));

  heading("Long Description");
  para(stripHtml(prod.longDescription ?? "—"));

  heading("Markets");
  const markets = prod.markets ?? [];
  if (!markets.length) {
    para("—");
  } else {
    for (const m of markets) {
      const uom = [m.uomValue, m.uomTitle].filter(Boolean).join(" ") || "—";
      para(
        `${m.market} | UOM: ${uom} | ${m.currency ?? "USD"} | ` +
          `Savings: ${m.noSavings ? "—" : fmtMoney(m.savings, m.currency ?? "USD")} | ` +
          `On: ${fmtDate(m.onSaleDate)} | Off: ${m.noEndDate ? "No end" : fmtDate(m.offSaleDate)}`
      );
    }
  }

  heading("Translations");
  const cultures = prod.cultures ?? [];
  if (!cultures.length) {
    para("—");
  } else {
    for (const c of cultures) {
      para(`${c.cultureCode}: ${c.translatedName ?? "—"} | ${c.translatedShort ?? "—"}`);
    }
  }

  heading("Accessories");
  const accs = prod.accessories ?? [];
  if (!accs.length) {
    para("—");
  } else {
    for (const a of accs) para([a.accessorySku, a.accessoryLabel].filter(Boolean).join(" — "));
  }

  heading("Recommended Products");
  const recs = prod.recommendations ?? [];
  if (!recs.length) {
    para("—");
  } else {
    for (const r of recs) para(r.recommendedSku ?? "—");
  }

  const pdfBytes = await doc.save();
  // Return a Node buffer; your handler already sends it with NextResponse
  return Buffer.from(pdfBytes);
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