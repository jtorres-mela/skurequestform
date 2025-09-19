// src/app/api/submissions/[submissionId]/products/[productId]/status/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";

export const runtime = "nodejs";

const Body = z.object({
  status: z.nativeEnum(SubmissionStatus),
  note: z.string().trim().optional(),
});

export async function PATCH(
  req: Request,
  {
    // 👇 In some Next versions, `params` is a Promise in route handlers
    params,
  }: {
    params: Promise<{ submissionId: string; productId: string }> | { submissionId: string; productId: string };
  }
) {
  // Normalize whether params is a Promise or a plain object
  const awaited = (params instanceof Promise ? await params : params) as {
    submissionId: string;
    productId: string;
  };

  const submissionId = Number(awaited.submissionId);
  const productId = Number(awaited.productId);
  if (!Number.isFinite(submissionId) || !Number.isFinite(productId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, note } = parsed.data;

  // Ensure the product belongs to the submission
  const product = await prisma.submissionProduct.findUnique({
    where: { id: productId },
    select: { submissionId: true },
  });
  if (!product || product.submissionId !== submissionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.submissionProduct.update({
    where: { id: productId },
    data: {
      status,
      // If you removed notes from the schema, just delete the next two lines.
      statusNote: note ?? null,
      statusChangedAt: new Date(),
    },
    select: { id: true, status: true, statusNote: true, statusChangedAt: true },
  });

  return NextResponse.json(updated, { status: 200 });
}
