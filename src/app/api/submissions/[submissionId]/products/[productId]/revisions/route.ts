// src/app/api/submissions/[submissionId]/products/[productId]/revisions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

/* ============================
   Zod input (legacy + new)
============================ */
const strN = z.string().nullable().optional();
const boolO = z.boolean().optional();

// New per-market partial patch
const MarketEnum = z.enum(["US", "CA", "MX", "GB", "IE", "NL", "DE", "PL", "LT"]);
const MarketPatch = z.object({
  market: MarketEnum,
  noSavings: z.boolean().optional(),
  savings: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  uomValue: z.string().nullable().optional(),
  uomTitle: z.string().nullable().optional(),
  onSaleDate: z.string().nullable().optional(),
  offSaleDate: z.string().nullable().optional(),
  noEndDate: z.boolean().optional(),
});

const RevisionInput = z.object({
  // core
  productName: z.string().optional(),
  shortDescription: strN,
  longDescription: strN,
  stamp: strN,
  offSaleMessage: strN,

  // LEGACY (will be mapped to per-market)
  onSaleDate: z.string().nullable().optional(),
  offSaleDate: z.string().nullable().optional(),
  noEndDate: boolO,

  uomTitleUS: strN,
  uomValueUS: strN,
  uomTitleCA: strN,
  uomValueCA: strN,

  savingsUS: strN,
  savingsCA: strN,
  noSavings: boolO,

  // PDP
  isPdpRequested: boolO,
  pdpWorkRequest: strN,

  includeTranslations: boolO,
  requestedCulturesJson: z.any().optional(),

  // Arrays
  accessories: z
    .array(z.object({ accessorySku: strN, accessoryLabel: strN }))
    .optional(),
  recommendations: z.array(z.object({ sku: z.string().min(1) })).optional(),
  cultures: z
    .array(
      z.object({
        cultureCode: z.string().min(2),
        translatedName: strN,
        translatedShort: strN,
        translatedLong: strN,
      })
    )
    .optional(),

  // NEW preferred: per-market patch rows
  markets: z.array(MarketPatch).optional(),
});

/* ============================
   Helpers
============================ */
function toDecimalString(v: string | number | null | undefined): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2) : null;
  const t = v.trim();
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}
function toDateOrNull(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Merge small patch into a market row object (mutates target)
function applyMarketPatch(
  tgt: any,
  patch: z.infer<typeof MarketPatch>
) {
  if ("noSavings" in patch && typeof patch.noSavings === "boolean") {
    tgt.noSavings = patch.noSavings;
    if (patch.noSavings) {
      tgt.savings = null;
    }
  }
  if ("savings" in patch) {
    const dec = toDecimalString(patch.savings as any);
    tgt.savings = dec;
    if (dec != null) tgt.noSavings = false;
  }
  if ("currency" in patch) tgt.currency = patch.currency ?? null;
  if ("uomValue" in patch) tgt.uomValue = patch.uomValue ?? null;
  if ("uomTitle" in patch) tgt.uomTitle = patch.uomTitle ?? null;

  if ("onSaleDate" in patch) tgt.onSaleDate = toDateOrNull(patch.onSaleDate ?? null);
  if ("offSaleDate" in patch) tgt.offSaleDate = toDateOrNull(patch.offSaleDate ?? null);
  if ("noEndDate" in patch && typeof patch.noEndDate === "boolean") {
    tgt.noEndDate = patch.noEndDate;
    if (tgt.noEndDate) {
      tgt.offSaleDate = null;
    }
  }
}

/* ============================
   POST (create revision)
============================ */
export async function POST(
  req: Request,
  context:
    | { params: { submissionId: string; productId: string } }
    | { params: Promise<{ submissionId: string; productId: string }> }
) {
  // Await params if needed (Next.js app dir nuance)
  const params = "then" in (context as any).params ? await (context as any).params : (context as any).params;
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
        where: { id: productId },
        include: {
          accessories: true,
          recommendations: true,
          cultures: true,
          markets: true, // <- bring current per-market rows
        },
      });
      if (!cur || cur.submissionId !== submissionId) {
        throw new Error("Product not found for this submission");
      }

      // Compute next version
      const max = await tx.submissionProduct.aggregate({
        where: { submissionId: cur.submissionId, sku: cur.sku },
        _max: { version: true },
      });
      const nextVersion = (max._max.version ?? 1) + 1;

      // Mark current as not current
      await tx.submissionProduct.update({
        where: { id: cur.id },
        data: { isCurrent: false },
      });

      // Build arrays to recreate nested rows for new revision
      type AccessoryCreate = { accessorySku: string | null; accessoryLabel: string | null };
      type CultureCreate = {
        cultureCode: string;
        translatedName: string | null;
        translatedShort: string | null;
        translatedLong: string | null;
      };

      const accessoriesToCreate: AccessoryCreate[] = [];
      let recsToCreate: { recommendedSku: string }[] = [];
      const culturesToCreate: CultureCreate[] = [];

      // Accessories: use patch if supplied, else copy current
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
        recsToCreate = patch.recommendations
          .map((r) => (r?.sku || "").trim())
          .filter(Boolean)
          .map((sku) => ({ recommendedSku: sku }));
      } else {
        recsToCreate = cur.recommendations
          .map((r) => r.recommendedSku)
          .filter((s): s is string => !!s)
          .map((sku) => ({ recommendedSku: sku }));
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

      /* ============================
         Markets: merge strategy
         - start from current markets
         - if patch.markets[] → merge by market
         - else apply legacy fields to US/CA (UOM/savings) and dates to all
      ============================ */
      // Start with a dictionary of current markets
      const marketDict: Record<
        z.infer<typeof MarketEnum>,
        {
          market: z.infer<typeof MarketEnum>;
          noSavings: boolean;
          savings: string | null;
          currency: string | null;
          uomValue: string | null;
          uomTitle: string | null;
          onSaleDate: Date | null;
          offSaleDate: Date | null;
          noEndDate: boolean;
        }
      > = {} as any;

      for (const m of cur.markets) {
        marketDict[m.market as z.infer<typeof MarketEnum>] = {
          market: m.market as any,
          noSavings: !!m.noSavings,
          savings: m.savings != null ? String(m.savings) : null,
          currency: m.currency ?? null,
          uomValue: m.uomValue ?? null,
          uomTitle: m.uomTitle ?? null,
          onSaleDate: m.onSaleDate ?? null,
          offSaleDate: m.offSaleDate ?? null,
          noEndDate: !!m.noEndDate,
        };
      }

      const ensureRow = (mk: z.infer<typeof MarketEnum>) => {
        if (!marketDict[mk]) {
          marketDict[mk] = {
            market: mk,
            noSavings: false,
            savings: null,
            currency: null,
            uomValue: null,
            uomTitle: null,
            onSaleDate: null,
            offSaleDate: null,
            noEndDate: false,
          };
        }
        return marketDict[mk];
      };

      if (patch.markets && patch.markets.length) {
        // New-style patch
        for (const pm of patch.markets) {
          const tgt = ensureRow(pm.market);
          applyMarketPatch(tgt, pm);
        }
      } else {
        // Legacy mapping

        // UOM & Savings per US / CA
        const legacyUS: Partial<z.infer<typeof MarketPatch>> = {};
        if ("uomTitleUS" in patch) legacyUS.uomTitle = patch.uomTitleUS ?? null;
        if ("uomValueUS" in patch) legacyUS.uomValue = patch.uomValueUS ?? null;
        if ("noSavings" in patch && typeof patch.noSavings === "boolean") legacyUS.noSavings = patch.noSavings;
        if ("savingsUS" in patch) legacyUS.savings = patch.savingsUS ?? null;
        if (Object.keys(legacyUS).length) applyMarketPatch(ensureRow("US"), legacyUS as any);

        const legacyCA: Partial<z.infer<typeof MarketPatch>> = {};
        if ("uomTitleCA" in patch) legacyCA.uomTitle = patch.uomTitleCA ?? null;
        if ("uomValueCA" in patch) legacyCA.uomValue = patch.uomValueCA ?? null;
        if ("noSavings" in patch && typeof patch.noSavings === "boolean") legacyCA.noSavings = patch.noSavings;
        if ("savingsCA" in patch) legacyCA.savings = patch.savingsCA ?? null;
        if (Object.keys(legacyCA).length) applyMarketPatch(ensureRow("CA"), legacyCA as any);

        // Dates: historically global → apply to all existing rows; if none exist, apply to US
        const datePatch: Partial<z.infer<typeof MarketPatch>> = {};
        if ("onSaleDate" in patch) datePatch.onSaleDate = patch.onSaleDate ?? null;
        if ("offSaleDate" in patch) datePatch.offSaleDate = patch.offSaleDate ?? null;
        if ("noEndDate" in patch && typeof patch.noEndDate === "boolean") datePatch.noEndDate = patch.noEndDate;

        if (Object.keys(datePatch).length) {
          const targets = Object.keys(marketDict) as (keyof typeof marketDict)[];
          if (targets.length === 0) {
            // ensure at least US exists if we only have date info
            const us = ensureRow("US");
            applyMarketPatch(us, { market: "US", ...datePatch } as any);
          } else {
            for (const mk of targets) {
              applyMarketPatch(marketDict[mk], { market: mk, ...datePatch } as any);
            }
          }
        }
      }

      const marketsToCreate = Object.values(marketDict);

      // JSON field
      const requestedCulturesJson =
        (patch.requestedCulturesJson as unknown) ??
        (cur.requestedCulturesJson as unknown) ??
        undefined;

      console.log(cur.submissionId);

      // Create new revision
      return tx.submissionProduct.create({
        data: {
          submissionId: cur.submissionId,
          sku: cur.sku,
          version: nextVersion,
          isCurrent: true,

          productName: patch.productName ?? cur.productName,
          shortDescription: patch.shortDescription ?? cur.shortDescription,
          longDescription: patch.longDescription ?? cur.longDescription,
          stamp: patch.stamp ?? cur.stamp,
          offSaleMessage: patch.offSaleMessage ?? cur.offSaleMessage,

          // PDP / translations gate
          isPdpRequested: patch.isPdpRequested ?? cur.isPdpRequested,
          pdpWorkRequest:
            (patch.isPdpRequested ?? cur.isPdpRequested)
              ? patch.pdpWorkRequest ?? cur.pdpWorkRequest
              : null,
          includeTranslations: patch.includeTranslations ?? cur.includeTranslations,
          requestedCulturesJson,

          // Nested
          accessories: accessoriesToCreate.length ? { create: accessoriesToCreate } : undefined,
          recommendations: recsToCreate.length ? { create: recsToCreate } : undefined,
          cultures: culturesToCreate.length ? { create: culturesToCreate } : undefined,
          markets: marketsToCreate.length ? { create: marketsToCreate } : undefined,
        },
        include: {
          accessories: true,
          recommendations: true,
          cultures: true,
          markets: true,
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
