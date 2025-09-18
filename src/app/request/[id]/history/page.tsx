import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { formatDateAsUTC } from "@/lib/dates";

// --- Type Definitions ---

interface MarketData {
  id: number;
  market: string;
  noSavings: boolean;
  savings: Decimal | null;
  currency: string | null;
  uomValue: string | null;
  uomTitle: string | null;
  onSaleDate: Date | null;
  offSaleDate: Date | null;
  noEndDate: boolean;
  productId: number;
}

interface ProductWithRelations {
  id: number;
  sku: string;
  version: number;
  productName: string;
  shortDescription: string | null;
  longDescription: string | null;
  stamp: string | null;
  offSaleMessage: string | null;
  isPdpRequested: boolean;
  pdpWorkRequest: string | null;
  includeTranslations: boolean;
  requestedCulturesJson: any; // Prisma.JsonValue
  createdAt: Date;
  updatedAt: Date;
  submissionId: number;
  isCurrent: boolean;
  markets: MarketData[];
  accessories: Array<{ id: number; accessorySku: string | null; accessoryLabel: string | null }>;
  recommendations: Array<{ id: number; recommendedSku: string | null }>;
  cultures: Array<{ id: number; cultureCode: string; translatedName: string | null }>;
  [key: string]: any; // Index signature for dynamic access
}

interface HistoryPageProps {
  searchParams: { sku?: string; submissionId?: string };
}

// --- Helper Functions ---

function getDiff(prev: ProductWithRelations, curr: ProductWithRelations) {
  const HIDDEN_FIELDS = new Set([
    "id", "submissionId", "version", "isCurrent", "sku", 
    "markets", "accessories", "recommendations", "cultures", // Handled separately
    "createdAt", "updatedAt", "requestedCulturesJson"
  ]);

  const diff: Record<string, { from: unknown; to: unknown }> = {};

  // 1. Compare scalar fields
  for (const key in curr) {
    if (HIDDEN_FIELDS.has(key)) continue;
    if (Object.prototype.hasOwnProperty.call(curr, key)) {
      const currVal = curr[key];
      const prevVal = prev[key];
      if (currVal !== prevVal) {
        diff[key] = { from: prevVal, to: currVal };
      }
    }
  }

  // 2. Compare market data
  const prevMarkets = new Map(prev.markets.map(m => [m.market, m]));
  const currMarkets = new Map(curr.markets.map(m => [m.market, m]));
  const allMarketKeys = new Set([...prevMarkets.keys(), ...currMarkets.keys()]);

  for (const market of allMarketKeys) {
    const p = prevMarkets.get(market);
    const c = currMarkets.get(market);

    if (!p) {
      diff[`Market ${market}`] = { from: 'Not present', to: 'Added' };
      continue;
    }
    if (!c) {
      diff[`Market ${market}`] = { from: 'Present', to: 'Removed' };
      continue;
    }

    const onSaleDateP = p.onSaleDate?.toISOString();
    const onSaleDateC = c.onSaleDate?.toISOString();
    if (onSaleDateP !== onSaleDateC) {
      diff[`${market} On Sale`] = { 
        from: p.onSaleDate ? formatDateAsUTC(p.onSaleDate) : 'None', 
        to: c.onSaleDate ? formatDateAsUTC(c.onSaleDate) : 'None' 
      };
    }

    const offSaleDateP = p.noEndDate ? 'No end date' : (p.offSaleDate ? formatDateAsUTC(p.offSaleDate) : 'None');
    const offSaleDateC = c.noEndDate ? 'No end date' : (c.offSaleDate ? formatDateAsUTC(c.offSaleDate) : 'None');
    if (offSaleDateP !== offSaleDateC) {
      diff[`${market} Off Sale`] = { from: offSaleDateP, to: offSaleDateC };
    }

    const savingsP = p.noSavings ? 'No savings' : `${p.savings} ${p.currency}`;
    const savingsC = c.noSavings ? 'No savings' : `${c.savings} ${c.currency}`;
    if (savingsP !== savingsC) {
      diff[`${market} Savings`] = { from: savingsP, to: savingsC };
    }

    const uomP = `${p.uomValue} ${p.uomTitle}`.trim();
    const uomC = `${c.uomValue} ${c.uomTitle}`.trim();
    if (uomP !== uomC) {
      diff[`${market} UOM`] = { from: uomP, to: uomC };
    }
  }

  // 3. Compare accessories
  const prevAcc = new Set(prev.accessories.map(a => a.accessorySku));
  const currAcc = new Set(curr.accessories.map(a => a.accessorySku));
  if (JSON.stringify([...prevAcc].sort()) !== JSON.stringify([...currAcc].sort())) {
      diff['Accessories'] = { from: [...prevAcc].join(', ') || 'None', to: [...currAcc].join(', ') || 'None' };
  }

  // 4. Compare recommendations
  const prevRec = new Set(prev.recommendations.map(r => r.recommendedSku));
  const currRec = new Set(curr.recommendations.map(r => r.recommendedSku));
  if (JSON.stringify([...prevRec].sort()) !== JSON.stringify([...currRec].sort())) {
      diff['Recommendations'] = { from: [...prevRec].join(', ') || 'None', to: [...currRec].join(', ') || 'None' };
  }

  return diff;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return formatDateAsUTC(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    // Handle date strings
    return formatDateAsUTC(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  if (value === "") return "None";
  return String(value);
}

// --- Page Component ---

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { sku, submissionId: submissionIdStr } = await searchParams;
  const submissionId = Number(submissionIdStr);

  if (!sku || !submissionId) {
    notFound();
  }

  const products = await prisma.submissionProduct.findMany({
    where: { sku, submissionId },
    orderBy: { version: "desc" },
    include: {
      accessories: true,
      recommendations: true,
      cultures: true,
      markets: { orderBy: { market: 'asc' } },
    },
  }) as unknown as ProductWithRelations[];

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { requestId: true },
  });

  if (!products.length) {
    return <main className="p-8">No history found for this SKU.</main>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold dark:text-white">Revision History for SKU: {sku}</h1>
        <Link 
          href={submission?.requestId ? `/request/${submission.requestId}` : "/request"}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:bg-white"
        >
          Back to Request
        </Link>
      </header>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Version History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">Version</th>
                <th className="p-3">Changes</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod, i) => {
                const isLast = i === products.length - 1;
                if (isLast) {
                  const initialValues = [
                    { field: 'Product Name', value: prod.productName },
                    { field: 'Short Description', value: prod.shortDescription },
                    { field: 'Long Description', value: prod.longDescription },
                    ...prod.markets.flatMap(m => [
                        { field: `${m.market} On Sale`, value: m.onSaleDate ? formatDateAsUTC(m.onSaleDate) : 'None' },
                        { field: `${m.market} Off Sale`, value: m.noEndDate ? 'No end date' : (m.offSaleDate ? formatDateAsUTC(m.offSaleDate) : 'None') },
                        { field: `${m.market} Savings`, value: m.noSavings ? 'No savings' : `${m.savings} ${m.currency}` },
                        { field: `${m.market} UOM`, value: `${m.uomValue || ''} ${m.uomTitle || ''}`.trim() },
                    ]),
                    { field: 'Accessories', value: prod.accessories.map(a => a.accessorySku).join(', ') },
                    { field: 'Recommendations', value: prod.recommendations.map(r => r.recommendedSku).join(', ') },
                  ].filter(item => item.value);

                  return (
                    <tr key={prod.id} className="border-t">
                      <td className="p-3 align-top">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          v{prod.version} (Initial)
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-gray-600 text-xs mb-2">Initial values:</div>
                          {initialValues.map(({ field, value }) => (
                            <div key={field} className="text-sm">
                              <span className="font-medium text-gray-900">{field}:</span>{" "}
                              <span className="text-gray-700">{formatValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                }

                const diff = getDiff(products[i + 1], prod);
                return (
                  <tr key={prod.id} className="border-t">
                    <td className="p-3 align-top">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        v{prod.version}
                      </span>
                    </td>
                    <td className="p-3">
                      {Object.keys(diff).length === 0 ? (
                        <span className="text-gray-500 italic">No changes</span>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(diff).map(([field, { from, to }]) => (
                            <div key={field} className="text-sm">
                              <span className="font-medium text-gray-900">{field}:</span>{" "}
                              <span className="text-red-600 line-through">{formatValue(from)}</span>{" "}
                              <span className="text-gray-400">→</span>{" "}
                              <span className="text-green-600">{formatValue(to)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
