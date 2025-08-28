// src/app/api/requests/[id]/promotions/route.ts
export const runtime = "nodejs"; // we need fs
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    // Expect multipart/form-data: fields "kind" and "file"
    const form = await req.formData();
    const kind = String(form.get("kind") || "");
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!["INCREMENTAL_PROMO", "COUPON_PROMO"].includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    // Save to local disk (adjust path to your liking)
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const ts = Date.now();
    const outName = `${requestId}_${kind}_${ts}_${safeName}`;
    const outPath = path.join(uploadDir, outName);

    await fs.writeFile(outPath, buffer);

    const rec = await prisma.promotionUpload.create({
      data: {
        requestId,
        kind: kind as any,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: buffer.length,
        storagePath: outPath,
      },
    });

    return NextResponse.json({ ok: true, upload: rec }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
