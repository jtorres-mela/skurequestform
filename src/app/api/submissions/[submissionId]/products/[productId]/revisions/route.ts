// src/app/api/submissions/[submissionId]/products/[productId]/revisions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const RevisionInput = z.object({
  // partial changes from the form; anything omitted reuses old value
  productName: z.string().optional(),
  shortDescription: z.string().nullable().optional(),
  longDescription: z.string().nullable().optional(),
  stamp: z.string().nullable().optional(),
  offSaleMessage: z.string().nullable().optional(),

  onSaleDate: z.string().nullable().optional(),
  offSaleDate: z.string().nullable().optional(),
  noEndDate: z.boolean().optional(),

  uomTitleUS: z.string().nullable().optional(),
  uomValueUS: z.string().nullable().optional(),
  uomTitleCA: z.string().nullable().optional(),
  uomValueCA: z.string().nullable().optional(),

  savingsUS: z.string().nullable().optional(),
  savingsCA: z.string().nullable().optional(),
  noSavings: z.boolean().optional(),

  isPdpRequested: z.boolean().optional(),
  pdpWorkRequest: z.string().nullable().optional(),

  includeTranslations: z.boolean().optional(),
  requestedCulturesJson: z.any().optional(), // will pass through to JSON column

  // optional full replacements for nested arrays
  accessories: z
    .array(
      z.object({
        accessorySku: z.string().nullable().optional(),
        accessoryLabel: z.string().nullable().optional(),
      })
    )
    .optional(),
  recommendations: z.array(z.object({ sku: z.string().min(1) })).optional(),
  cultures: z
    .array(
      z.object({
        cultureCode: z.string().min(2),
        translatedName: z.string().nullable().optional(),
        translatedShort: z.string().nullable().optional(),
        translatedLong: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { submissionId: string; productId: string } }
) {
  const submissionId = Number(params.submissionId);
  const productId = Number(params.productId);
  if (!Number.isFinite(submissionId) || !Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = RevisionInput.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const patch = parsed.data;

    const newRow = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const cur = await tx.submissionProduct.findUnique({
        where: { id: productId }, // PK lookup
        include: { accessories: true, recommendations: true, cultures: true },
      });
      if (!cur || cur.submissionId !== submissionId) {
        throw new Error("Product not found for this submission");
      }

      // Next version for (submissionId, sku)
      const max = await tx.submissionProduct.aggregate({
        where: { submissionId: cur.submissionId, sku: cur.sku },
        _max: { version: true },
      });
      const nextVersion = (max._max.version ?? 1) + 1;

      // Flip current -> false
      await tx.submissionProduct.update({
        where: { id: cur.id },
        data: { isCurrent: false },
      });

      // ----- Build nested inputs with simple local shapes (no map-callback types needed) -----
      type AccessoryCreate = { accessorySku: string | null; accessoryLabel: string | null };
      type RecommendationCreate = { sku: string };
      type CultureCreate = {
        cultureCode: string;
        translatedName: string | null;
        translatedShort: string | null;
        translatedLong: string | null;
      };

      const accessoriesToCreate: AccessoryCreate[] = [];
      const recsToCreate: RecommendationCreate[] = [];
      const culturesToCreate: CultureCreate[] = [];

      // Accessories
      if (patch.accessories && patch.accessories.length) {
        for (const a of patch.accessories) {
          if (!a) continue;
          if (a.accessorySku != null || a.accessoryLabel != null) {
            accessoriesToCreate.push({
              accessorySku: a.accessorySku ?? null,
              accessoryLabel: a.accessoryLabel ?? null,
            });
          }
        }
      } else {
        for (const a of cur.accessories) {
          accessoriesToCreate.push({
            accessorySku: a.accessorySku ?? null,
            accessoryLabel: a.accessoryLabel ?? null,
          });
        }
      }

      // Recommendations
      if (patch.recommendations && patch.recommendations.length) {
        for (const r of patch.recommendations) {
          recsToCreate.push({ sku: r.sku });
        }
      } else {
        for (const r of cur.recommendations) {
          recsToCreate.push({ sku: r.sku });
        }
      }

      // Cultures
      if (patch.cultures && patch.cultures.length) {
        for (const c of patch.cultures) {
          culturesToCreate.push({
            cultureCode: c.cultureCode,
            translatedName: c.translatedName ?? null,
            translatedShort: c.translatedShort ?? null,
            translatedLong: c.translatedLong ?? null,
          });
        }
      } else {
        for (const c of cur.cultures) {
          culturesToCreate.push({
            cultureCode: c.cultureCode,
            translatedName: c.translatedName,
            translatedShort: c.translatedShort,
            translatedLong: c.translatedLong,
          });
        }
      }

      // JSON field — keep typing loose if your client doesn't export Prisma.InputJsonValue
      const requestedCulturesJson =
        (patch.requestedCulturesJson as unknown) ??
        (cur.requestedCulturesJson as unknown) ??
        null;

      // ----- Create new revision row -----
      return tx.submissionProduct.create({
        data: {
          submissionId: cur.submissionId,
          sku: cur.sku,
          version: nextVersion,
          isCurrent: true,

          productName:      patch.productName      ?? cur.productName,
          shortDescription: patch.shortDescription ?? cur.shortDescription,
          longDescription:  patch.longDescription  ?? cur.longDescription,
          stamp:            patch.stamp            ?? cur.stamp,
          offSaleMessage:   patch.offSaleMessage   ?? cur.offSaleMessage,

          onSaleDate:  patch.onSaleDate  ? new Date(patch.onSaleDate)  : cur.onSaleDate,
          offSaleDate: patch.offSaleDate ? new Date(patch.offSaleDate) : cur.offSaleDate,
          noEndDate:   patch.noEndDate   ?? cur.noEndDate,

          uomTitleUS:  patch.uomTitleUS  ?? cur.uomTitleUS,
          uomValueUS:  patch.uomValueUS  ?? cur.uomValueUS,
          uomTitleCA:  patch.uomTitleCA  ?? cur.uomTitleCA,
          uomValueCA:  patch.uomValueCA  ?? cur.uomValueCA,

          savingsUS:   patch.savingsUS   ?? cur.savingsUS,
          savingsCA:   patch.savingsCA   ?? cur.savingsCA,
          noSavings:   patch.noSavings   ?? cur.noSavings,

          isPdpRequested:      patch.isPdpRequested      ?? cur.isPdpRequested,
          pdpWorkRequest:      patch.pdpWorkRequest      ?? cur.pdpWorkRequest,
          includeTranslations: patch.includeTranslations ?? cur.includeTranslations,
          requestedCulturesJson,

          // Nested relations: include only if non-empty
          accessories: accessoriesToCreate.length
            ? { create: accessoriesToCreate }
            : undefined,

          recommendations: recsToCreate.length
            ? { create: recsToCreate }
            : undefined,

          cultures: culturesToCreate.length
            ? { create: culturesToCreate }
            : undefined,
        },
        include: {
          accessories: true,
          recommendations: true,
          cultures: true,
        },
      });
    });

    return NextResponse.json(newRow, { status: 201 });
  } catch (err: any) {
    console.error("Create revision error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
