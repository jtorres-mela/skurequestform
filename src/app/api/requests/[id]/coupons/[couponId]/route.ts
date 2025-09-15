import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/requests/:id/coupons
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const coupons = await prisma.coupon.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "desc" },
    include: { cultures: true, markets: true },
  });

  return NextResponse.json({ coupons });
}

// POST /api/requests/:id/coupons
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    const couponCode: string | undefined = body?.couponCode?.trim();
    if (!couponCode) {
      return NextResponse.json({ error: "couponCode is required" }, { status: 400 });
    }

    // cultures: [{ cultureCode, name?, shortDescription? }]
    const cultures = Array.isArray(body?.cultures) ? body.cultures : [];
    for (const c of cultures) {
      if (!c.cultureCode) {
        return NextResponse.json({ error: "Each culture needs cultureCode" }, { status: 400 });
      }
    }

    // markets: [{ market, savings?, currency? }]
    const markets = Array.isArray(body?.markets) ? body.markets : [];

    const created = await prisma.coupon.create({
      data: {
        requestId: id,
        couponCode,
        // createdAt/defaults handled by Prisma
        cultures: cultures.length
          ? {
              create: cultures.map((c: any) => ({
                cultureCode: c.cultureCode,
                name: c.name ?? "",
                shortDescription: c.shortDescription ?? null,
              })),
            }
          : undefined,
        markets: markets.length
          ? {
              create: markets.map((m: any) => ({
                market: m.market,                   // must be one of your Market enum values
                savings: m.savings ?? null,         // Decimal accepts string/number
                currency: m.currency ?? null,       // "USD","CAD","MXN","EUR","GBP","PLN"
              })),
            }
          : undefined,
      },
      include: { cultures: true, markets: true },
    });

    return NextResponse.json({ coupon: created }, { status: 201 });
  } catch (err: any) {
    console.error("Create coupon error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
