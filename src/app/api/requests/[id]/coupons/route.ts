import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/requests/:id/coupons
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;               // 👈 await params
  const reqId = Number(id);
  if (!Number.isFinite(reqId)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const coupons = await prisma.coupon.findMany({
    where: { requestId: reqId },
    orderBy: { createdAt: "desc" },
    include: { cultures: true, markets: true },
  });

  return NextResponse.json({ coupons });
}

// POST /api/requests/:id/coupons
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;            // 👈 await params
    const reqId = Number(id);
    if (!Number.isFinite(reqId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    if (!body?.couponCode?.trim()) {
      return NextResponse.json({ error: "couponCode is required" }, { status: 400 });
    }

    const cultures = Array.isArray(body.cultures) ? body.cultures : [];
    const markets  = Array.isArray(body.markets)  ? body.markets  : [];

    const marketsCreate = markets.map((m: any) => ({
      market: m.market,
      savings:
        m.savings == null
          ? null
          : typeof m.savings === "number"
          ? m.savings.toFixed(2)
          : String(m.savings),
      currency: m.currency ?? null,
    }));

    const created = await prisma.coupon.create({
      data: {
        requestId: reqId,
        couponCode: body.couponCode.trim(),
        cultures: cultures.length
          ? {
              create: cultures.map((c: any) => ({
                cultureCode: c.cultureCode,
                name: c.name ?? "",
                shortDescription: c.shortDescription ?? null,
              })),
            }
          : undefined,
        markets: marketsCreate.length ? { create: marketsCreate } : undefined,
      },
      include: { cultures: true, markets: true },
    });

    return NextResponse.json({ coupon: created }, { status: 201 });
  } catch (err) {
    console.error("Create coupon error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}