export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; uploadId: string } }
) {
  const requestId = Number(params.id);
  const uploadId = Number(params.uploadId);
  if (!Number.isFinite(requestId) || !Number.isFinite(uploadId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const upload = await prisma.promotionUpload.findFirst({
    where: { id: uploadId, requestId },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fileStat = await stat(upload.storagePath);
    const stream = createReadStream(upload.storagePath);

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upload.mimeType ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(upload.fileName)}"`
    );
    headers.set("Content-Length", String(fileStat.size));

    // Node Readable → Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(readable, { headers });
  } catch {
    return NextResponse.json({ error: "File missing on server" }, { status: 410 });
  }
}
