import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { expandCultures, CULTURE_CODES, type CultureCode } from "@/lib/cultures";

const CultureCodeEnum = z.enum(Object.values(CULTURE_CODES) as [CultureCode, ...CultureCode[]]);

const CultureInput = z.object({
  cultureCode: z.union([CultureCodeEnum, z.string().min(2)]).optional(),
  translatedName: z.string().optional(),
  translatedShort: z.string().optional(),
  translatedLong: z.string().optional(),
});

const AccessoryInput = z.object({
  accessorySku: z.string().optional(),
  accessoryLabel: z.string().optional(),
}).refine(a => a.accessorySku || a.accessoryLabel, { message: "Accessory needs a sku or label" });

const RecommendationInput = z.object({
  sku: z.string().min(1),
});

const ProductInput = z.object({
  sku: z.string().min(1),
  productName: z.string().min(1),
  size: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  stamp: z.string().optional(),
  offSaleMessage: z.string().optional(),

  // NEW fields
  onSaleDate: z.string().datetime().or(z.string()).nullable().optional(),
  offSaleDate: z.string().datetime().or(z.string()).nullable().optional(),
  uomTitleUS: z.string().optional(),
  uomValueUS: z.string().optional(),
  uomTitleCA: z.string().optional(),
  uomValueCA: z.string().optional(),
  savingsUS: z.string().optional(),
  savingsCA: z.string().optional(),

  recommendations: z.array(RecommendationInput).optional().default([]),
  accessories: z.array(AccessoryInput).optional().default([]),

  cultures: z.array(CultureInput).optional().default([]),
});

const SubmissionInput = z.object({
  requester: z.string().email().optional(),
  note: z.string().optional(),
  requestedCultures: z.array(z.string()).optional().default([]),
  products: z.array(ProductInput).min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = SubmissionInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { requester, note, requestedCultures, products } = parsed.data;

  const expanded = expandCultures(requestedCultures);

  const create = await prisma.submission.create({
    data: {
      ...(requester ? { requester } : {}),
      ...(note ? { note } : {}),
      products: {
        create: products.map((p) => {
          const cultures = p.cultures?.filter(Boolean) ?? [];

          const explicitCodes = new Set(
            cultures.map((c) => (c.cultureCode ?? "").trim()).filter(Boolean)
          );

          const finalCodes =
            expanded.length
              ? new Set<CultureCode>([...expanded, ...(explicitCodes as unknown as CultureCode[])])
              : (explicitCodes as unknown as Set<CultureCode>);

          const cultureCreates =
            (finalCodes.size ? [...finalCodes] : []).map((code) => {
              const match = cultures.find(
                (c) => (c.cultureCode ?? "").toLowerCase() === code.toLowerCase()
              );
              return {
                cultureCode: code,
                translatedName: match?.translatedName ?? null,
                translatedShort: match?.translatedShort ?? null,
                translatedLong: match?.translatedLong ?? null,
              };
            });

          return {
            sku: p.sku,
            productName: p.productName,
            size: p.size ?? null,
            shortDescription: p.shortDescription ?? null,
            longDescription: p.longDescription ?? null,
            stamp: p.stamp ?? null,
            offSaleMessage: p.offSaleMessage ?? null,

            // NEW fields mapped to DB (null-safe)
            onSaleDate: p.onSaleDate ?? null,
            offSaleDate: p.offSaleDate ?? null,
            uomTitleUS: p.uomTitleUS ?? null,
            uomValueUS: p.uomValueUS ?? null,
            uomTitleCA: p.uomTitleCA ?? null,
            uomValueCA: p.uomValueCA ?? null,
            savingsUS: p.savingsUS ?? null,
            savingsCA: p.savingsCA ?? null,

            accessories: { create: p.accessories ?? [] },
            recommendations: p.recommendations?.length
              ? { create: p.recommendations.map((r) => ({ sku: r.sku })) }
              : undefined,
            cultures: { create: cultureCreates },
          };
        }),
      },
    },
    include: {
      products: { include: { accessories: true, cultures: true, recommendations: true } },
    },
  });

  return NextResponse.json(create, { status: 201 });
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
