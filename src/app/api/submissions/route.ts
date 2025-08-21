import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { expandCultures, CULTURE_CODES, type CultureCode } from "@/lib/cultures";

// ----- helpers -----
const CultureCodeEnum = z.enum(Object.values(CULTURE_CODES) as [CultureCode, ...CultureCode[]]);

// string | null | undefined
const strN = z.string().nullable().optional();
// date-string | null | undefined (we'll coerce to Date when writing)
const dateStrN = z.string().nullable().optional();
// "" -> undefined for optional email/back-compat
const emptyToUndefString = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().optional());

const CultureInput = z.object({
  cultureCode: z.union([CultureCodeEnum, z.string().min(2)]).optional(),
  translatedName: strN,
  translatedShort: strN,
  translatedLong: strN,
});

const AccessoryInput = z.object({
  accessorySku: strN,
  accessoryLabel: strN,
}).refine(a => a.accessorySku != null || a.accessoryLabel != null, {
  message: "Accessory needs a sku or label",
});

const RecommendationInput = z.object({
  sku: z.string().min(1),
});

const ProductInput = z.object({
  sku: z.string().min(1),
  productName: z.string().min(1),

  shortDescription: strN,
  longDescription:  strN,
  stamp:            strN,
  offSaleMessage:   strN,

  onSaleDate:  dateStrN,
  offSaleDate: dateStrN,
  noEndDate:   z.boolean().optional(),

  uomTitleUS: strN,
  uomValueUS: strN,
  uomTitleCA: strN,
  uomValueCA: strN,

  savingsUS:  strN,
  savingsCA:  strN,
  noSavings:  z.boolean().optional(),

  // ✅ schema-aligned names
  isPdpRequested: z.boolean().optional(),
  pdpWorkRequest: strN,

  includeTranslations: z.boolean().optional(),

  // If you want to persist the checkbox presets per product:
  requestedCulturesJson: z.any().optional(),

  recommendations: z.array(RecommendationInput).optional().default([]),
  accessories:     z.array(AccessoryInput).optional().default([]),
  cultures:        z.array(CultureInput).optional().default([]),
});

const SubmissionInput = z.object({
  requestId: z.number().int().positive(),
  requester: emptyToUndefString, // no longer enforced as email; send undefined/omit from client
  note: z.string().optional(),
  requestedCultures: z.array(z.string()).optional().default([]), // used to expand presets
  products: z.array(ProductInput).min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = SubmissionInput.safeParse(json);
    if (!parsed.success) {
      // Helpful for debugging which field failed:
      // console.error(parsed.error.issues);
      return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { requester, note, requestedCultures = [], requestId, products } = parsed.data;

    // Expand presets (US, CA, …) into explicit codes like en-US, en-CA
    const expanded = expandCultures(requestedCultures);

    const created = await prisma.submission.create({
      data: {
        requestId,
        note: note || null,
        ...(requester ? { requester } : {}),

        products: {
          create: products.map((p) => {
            // Dates / Savings with boolean gates
            const finalOffSaleDateStr = p.noEndDate ? null : (p.offSaleDate ?? null);
            const finalSavingsUS      = p.noSavings ? null : (p.savingsUS ?? null);
            const finalSavingsCA      = p.noSavings ? null : (p.savingsCA ?? null);

            // Translations: merge presets + explicit culture codes from the product
            const inputCultures = p.cultures?.filter(Boolean) ?? [];
            const explicitCodes = new Set(
              inputCultures
                .map(c => (c.cultureCode ?? "").trim())
                .filter(Boolean)
            );
            const finalCodes =
              expanded.length
                ? new Set<CultureCode>([...expanded, ...(explicitCodes as unknown as CultureCode[])])
                : (explicitCodes as unknown as Set<CultureCode>);

            const cultureCreates =
              p.includeTranslations
                ? (finalCodes.size ? [...finalCodes] : []).map(code => {
                    const match = inputCultures.find(
                      c => (c.cultureCode ?? "").toLowerCase() === code.toLowerCase()
                    );
                    return {
                      cultureCode: code,
                      translatedName:  match?.translatedName  ?? null,
                      translatedShort: match?.translatedShort ?? null,
                      translatedLong:  match?.translatedLong  ?? null,
                    };
                  })
                : [];

            return {
              // ----- REQUIRED -----
              sku: p.sku,
              productName: p.productName,

              // ----- OPTIONAL STRINGS (nullable) -----
              shortDescription: p.shortDescription ?? null,
              longDescription:  p.longDescription  ?? null,
              stamp:            p.stamp            ?? null,
              offSaleMessage:   p.offSaleMessage   ?? null,

              // ----- DATES (coerce to Date) -----
              onSaleDate:  p.onSaleDate  ? new Date(p.onSaleDate)  : null,
              offSaleDate: finalOffSaleDateStr ? new Date(finalOffSaleDateStr) : null,
              noEndDate:   !!p.noEndDate,

              // ----- UOM -----
              uomTitleUS: p.uomTitleUS ?? null,
              uomValueUS: p.uomValueUS ?? null,
              uomTitleCA: p.uomTitleCA ?? null,
              uomValueCA: p.uomValueCA ?? null,

              // ----- SAVINGS -----
              savingsUS: finalSavingsUS,
              savingsCA: finalSavingsCA,
              noSavings: !!p.noSavings,

              // ----- PDP FLAGS (schema names) -----
              isPdpRequested: !!p.isPdpRequested,
              pdpWorkRequest: p.isPdpRequested ? (p.pdpWorkRequest ?? null) : null,

              // ----- TRANSLATIONS GATE -----
              includeTranslations: !!p.includeTranslations,
              requestedCulturesJson: p.requestedCulturesJson ?? undefined,

              // ----- NESTED RELATIONS -----
              accessories: p.accessories && p.accessories.length
                ? {
                    create: p.accessories
                      .filter(a => a.accessorySku != null || a.accessoryLabel != null)
                      .map(a => ({
                        accessorySku:  a.accessorySku  ?? null,
                        accessoryLabel: a.accessoryLabel ?? null,
                      })),
                  }
                : undefined,

              recommendations: p.recommendations && p.recommendations.length
                ? {
                    create: p.recommendations.map(r => ({ sku: r.sku })),
                  }
                : undefined,

              cultures: cultureCreates.length
                ? { create: cultureCreates }
                : undefined,
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
          cultures: {
            ...(culture ? { where: { cultureCode: culture } } : {}),
          },
        },
      },
    },
  });

  return NextResponse.json(submissions);
}
