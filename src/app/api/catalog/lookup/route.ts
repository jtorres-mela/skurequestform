// src/app/api/catalog/lookup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const runtime = "nodejs";

const Body = z.object({ skus: z.array(z.string()).max(200) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  // dedupe & normalize (SQLite is case-sensitive)
  const input = Array.from(new Set(parsed.data.skus.map(s => s.trim()))).filter(Boolean);

  if (!input.length) return NextResponse.json([], { status: 200 });

  // If you normalized to upper-case on ingest, upper here too:
  const rows = await prisma.catalogIndex.findMany({
    where: { sku: { in: input } },
    select: {
      sku: true,
      productTitle: true,
      imagePath: true,
      imageId: true,

    },
  });

  // Map for quick access
  const bySku = Object.fromEntries(rows.map(r => [r.sku.toUpperCase(), r]));
  return NextResponse.json(bySku, { status: 200 });
}
