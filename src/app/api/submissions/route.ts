import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { expandCultures, CULTURE_CODES, type CultureCode } from "@/lib/cultures";

/* =============================================================================
   Zod helpers
============================================================================= */
const CultureCodeEnum = z.enum(Object.values(CULTURE_CODES) as [CultureCode, ...CultureCode[]]);
const strN = z.string().nullable().optional();
const emptyToUndefString = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().optional());

/* =============================================================================
   Inputs
============================================================================= */
const CultureInput = z.object({
  cultureCode: z.union([CultureCodeEnum, z.string().min(2)]), // allow raw strings too
  translatedName: strN,
  translatedShort: strN,
  translatedLong: strN,
});

const RecommendationInput = z.object({ sku: z.string().min(1) });

const AccessoryInput = z
  .object({
    accessorySku: z.string().min(1).optional(),
    accessoryLabel: z.string().optional(),
  })
  .refine((a) => a.accessorySku || a.accessoryLabel, {
    message: "Accessory needs a sku or label",
  });

const MarketEnum = z.enum(["US", "CA", "MX", "GB", "IE", "NL", "DE", "PL", "LT"]);
const dateStrN = z
  .string()
  .datetime({ offset: false })
  .nullable()
  .optional()
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()); // allow YYYY-MM-DD too

const ProductMarketInput = z.object({
  market: MarketEnum,
  noSavings: z.boolean().optional(),
  savings: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().length(3).optional().nullable(), // e.g., USD, CAD, EUR, GBP, PLN, MXN
  uomValue: z.string().optional().nullable(),
  uomTitle: z.string().optional().nullable(),
  onSaleDate: z.string().optional().nullable(), // we'll coerce to Date | null
  offSaleDate: z.string().optional().nullable(),
  noEndDate: z.boolean().optional(),
});

const ProductInput = z.object({
  sku: z.string().min(1),
  productName: z.string().min(1),

  shortDescription: strN,
  longDescription: strN,
  stamp: strN,
  offSaleMessage: strN,

  // ✅ NEW per-market container (replaces legacy per-country fields)
  markets: z.array(ProductMarketInput).optional().default([]),

  // PDP & translations
  isPdpRequested: z.boolean().optional(),
  pdpWorkRequest: strN,
  includeTranslations: z.boolean().optional(),
  requestedCulturesJson: z.any().optional(),

  recommendations: z.array(RecommendationInput).optional().default([]),
  accessories: z.array(AccessoryInput).optional().default([]),
  cultures: z.array(CultureInput).optional().default([]),
});

const SubmissionInput = z.object({
  requestId: z.number().int().positive(),
  requester: emptyToUndefString,
  note: z.string().optional(),
  requestedCultures: z.array(z.string()).optional().default([]),
  products: z.array(ProductInput).min(1),
});

/* =============================================================================
   Helpers
============================================================================= */
function toDecimalString(v: string | number | null | undefined): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2) : null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  // allow "5", "5.0", "5.25" – up to 2 decimals
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

function toDateOrNull(s?: string | null): Date | null {
  if (!s) return null;
  // Accept YYYY-MM-DD or full ISO
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* =============================================================================
   POST /api/submissions
============================================================================= */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = SubmissionInput.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requester, note, requestedCultures = [], requestId, products } = parsed.data;

    // Expand culture presets (US, CA, EU…) → explicit codes
    const expanded = expandCultures(requestedCultures);

    const created = await prisma.submission.create({
      data: {
        requestId,
        note: note || null,
        ...(requester ? { requester } : {}),

        products: {
          create: products.map((p) => {
            // Build translations create list based on gate + explicit cultures
            const inputCultures = p.cultures?.filter(Boolean) ?? [];
            const explicitCodes = new Set(
              inputCultures.map((c) => (c.cultureCode ?? "").trim()).filter(Boolean)
            );

            const finalCodes =
              expanded.length > 0
                ? new Set<string>([...expanded, ...explicitCodes])
                : explicitCodes;

            const cultureCreates =
              p.includeTranslations && finalCodes.size
                ? [...finalCodes].map((code) => {
                    const match = inputCultures.find(
                      (c) => (c.cultureCode ?? "").toLowerCase() === code.toLowerCase()
                    );
                    return {
                      cultureCode: code,
                      translatedName: match?.translatedName ?? null,
                      translatedShort: match?.translatedShort ?? null,
                      translatedLong: match?.translatedLong ?? null,
                    };
                  })
                : [];

            // Per-market rows
            const marketsCreates =
              p.markets && p.markets.length
                ? p.markets.map((m) => ({
                    market: m.market,
                    noSavings: !!m.noSavings,
                    savings: toDecimalString(m.savings),
                    currency: m.currency ?? null,
                    uomValue: m.uomValue ?? null,
                    uomTitle: m.uomTitle ?? null,
                    onSaleDate: toDateOrNull(m.onSaleDate ?? null),
                    offSaleDate: toDateOrNull(m.offSaleDate ?? null),
                    noEndDate: !!m.noEndDate,
                  }))
                : [];

            return {
              // Core
              sku: p.sku,
              productName: p.productName,
              shortDescription: p.shortDescription ?? null,
              longDescription: p.longDescription ?? null,
              stamp: p.stamp ?? null,
              offSaleMessage: p.offSaleMessage ?? null,

              // PDP flags
              isPdpRequested: !!p.isPdpRequested,
              pdpWorkRequest: p.isPdpRequested ? p.pdpWorkRequest ?? null : null,

              // Translations gate + requested cultures (for traceability)
              includeTranslations: !!p.includeTranslations,
              requestedCulturesJson:
                p.requestedCulturesJson ?? (expanded.length ? expanded : undefined),

              // Nested
              accessories:
                p.accessories && p.accessories.length
                  ? {
                      create: p.accessories
                        .filter((a) => a.accessorySku != null || a.accessoryLabel != null)
                        .map((a) => ({
                          accessorySku: a.accessorySku ?? null,
                          accessoryLabel: a.accessoryLabel ?? null,
                        })),
                    }
                  : undefined,

              recommendations:
                p.recommendations && p.recommendations.length
                  ? {
                      create: p.recommendations
                        .filter((r) => typeof r?.sku === "string" && r.sku.trim() !== "")
                        .map((r) => ({ recommendedSku: r.sku.trim() })),
                    }
                  : undefined,

              cultures: cultureCreates.length ? { create: cultureCreates } : undefined,
              markets: marketsCreates.length ? { create: marketsCreates } : undefined,
            };
          }),
        },
      },
      include: {
        products: {
          include: {
            accessories: true,
            cultures: true,
            recommendations: true,
            markets: true, // ← include new per-market rows
          },
        },
      },
    });

    return NextResponse.json(
      { id: created.id, requestId: created.requestId },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/submissions error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* =============================================================================
   GET /api/submissions?culture=&sku=
============================================================================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const culture = searchParams.get("culture");
  const sku = searchParams.get("sku");

  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        ...(sku ? { where: { sku } } : {}),
        include: {
          accessories: true,
          recommendations: true,
          cultures: culture ? { where: { cultureCode: culture } } : true,
          markets: true, // ← make market data visible to callers
        },
      },
    },
  });

  return NextResponse.json(submissions);
}
