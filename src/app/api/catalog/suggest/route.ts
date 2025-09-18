// src/app/api/catalog/suggest/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([], { status: 200 });

  const rows = await prisma.catalogIndex.findMany({
    where: {
      OR: [
        { sku:          { contains: q } },
        { productTitle: { contains: q } },
      ],
    },
    select: { sku: true, productTitle: true, imagePath: true, imageId: true },
    take: 20,
    orderBy: [{ sku: "asc" }],
  });

  return NextResponse.json(rows, { status: 200 });
}
