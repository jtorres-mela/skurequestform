import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const items = await prisma.submission.findMany({
    where: q
      ? {
          OR: [
            { requester: { contains: q, mode: "insensitive" } },
            { note: { contains: q, mode: "insensitive" } },
            {
              products: {
                some: {
                  OR: [
                    { sku: { contains: q, mode: "insensitive" } },
                    { productName: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      products: { take: 3, select: { id: true, sku: true, productName: true } },
    },
  });

  return NextResponse.json({ items });
}
