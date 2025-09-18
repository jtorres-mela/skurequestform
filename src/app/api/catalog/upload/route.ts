// src/app/api/catalog/upload/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parse } from "csv-parse";
import { Readable } from "node:stream";

export const runtime = "nodejs";
// optional on Vercel: export const maxDuration = 60;

const RowZ = z.object({
  ImageID: z.string().optional().nullable(),
  SKU: z.string().min(1),
  Path: z.string().optional().nullable(),
  ProductTitle: z.string().optional().nullable(),
});

function normalize(row: z.infer<typeof RowZ>) {
  return {
    sku: row.SKU.trim(),
    imageId: row.ImageID?.toString().trim() || null,
    imagePath: row.Path?.toString().trim() || null,
    productTitle: row.ProductTitle?.toString().trim() || null,
  };
}

export async function POST(req: Request) {
  // simple auth: header must match env token (adjust to your auth later)
  const token = req.headers.get("x-upload-token");
  if (!process.env.CATALOG_UPLOAD_TOKEN || token !== process.env.CATALOG_UPLOAD_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Stream parse CSV (handles large files without loading whole text)
  const buf = Buffer.from(await file.arrayBuffer());
  const records: any[] = [];
  const parser = parse(buf, { columns: true, trim: true, bom: true });

  let ok = 0;
  let bad = 0;
  const batch: any[] = [];
  const BATCH_SIZE = 500;

  const flush = async () => {
    if (!batch.length) return;
    await prisma.$transaction(batch);
    batch.length = 0;
  };

  for await (const rec of Readable.from(parser) as AsyncIterable<any>) {
    const parsed = RowZ.safeParse(rec);
    if (!parsed.success) {
      bad++;
      continue;
    }
    const row = normalize(parsed.data);
    // upsert by SKU (unique)
    batch.push(
      prisma.catalogIndex.upsert({
        where: { sku: row.sku },
        update: {
          imageId: row.imageId,
          imagePath: row.imagePath,
          productTitle: row.productTitle,
          source: "csv-upload",
        },
        create: {
          sku: row.sku,
          imageId: row.imageId,
          imagePath: row.imagePath,
          productTitle: row.productTitle,
          source: "csv-upload",
        },
      })
    );
    ok++;
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  return NextResponse.json({ ok, bad }, { status: 200 });
}
