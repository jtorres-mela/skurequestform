import { NextPage } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface HistoryPageProps {
  searchParams: { sku?: string; submissionId?: string };
}


const HistoryPage: NextPage<HistoryPageProps> = async (context) => {
  const searchParams = 'then' in context.searchParams ? await context.searchParams : context.searchParams;
  const sku = searchParams.sku;
  console.log(searchParams);
  const submissionId = Number(searchParams.submissionId);

  if (!sku || !submissionId) {
    notFound();
  }


  // Fetch all products with this SKU and submissionId (all revisions)
  const products = await prisma.submissionProduct.findMany({
    where: { sku, submissionId },
    orderBy: { version: "desc" },
    include: {
      accessories: true,
      recommendations: true,
      cultures: true,
    },
  });

  // Fetch the requestId from the Submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { requestId: true },
  });

  if (!products.length) {
    return <main className="p-8">No history found for this SKU.</main>;
  }

  // Compute diffs between versions (simple field-by-field diff)
  // Hide internal meta fields from the breakdown
  function getDiff(prev: any, curr: any) {
    const HIDDEN_FIELDS = new Set([
      "id",
      "submissionId",
      "version",
      "isCurrent",
      "sku",
    ]);

    const diff: Record<string, { from: any; to: any }> = {};
    // Compare scalar fields
    for (const key in curr) {
      if (HIDDEN_FIELDS.has(key)) continue;
      if (
        typeof curr[key] !== "object" &&
        prev[key] !== undefined &&
        curr[key] !== prev[key]
      ) {
        diff[key] = { from: prev[key], to: curr[key] };
      }
    }

    // Compare nested arrays with meaningful values
    if (Array.isArray(prev.accessories) && Array.isArray(curr.accessories)) {
      const aPrev = prev.accessories.map((a: any) => (a.accessorySku || a.accessoryLabel || "")).sort().join(",");
      const aCurr = curr.accessories.map((a: any) => (a.accessorySku || a.accessoryLabel || "")).sort().join(",");
      if (aPrev !== aCurr) {
        diff["Accessories"] = { from: aPrev || "None", to: aCurr || "None" };
      }
    }
    if (Array.isArray(prev.recommendations) && Array.isArray(curr.recommendations)) {
      const rPrev = prev.recommendations.map((r: any) => r.recommendedSku || "").filter(Boolean).sort().join(",");
      const rCurr = curr.recommendations.map((r: any) => r.recommendedSku || "").filter(Boolean).sort().join(",");
      if (rPrev !== rCurr) {
        diff["Recommendations"] = { from: rPrev || "None", to: rCurr || "None" };
      }
    }
    if (Array.isArray(prev.cultures) && Array.isArray(curr.cultures)) {
      const cPrev = prev.cultures.map((c: any) => c.cultureCode).sort().join(",");
      const cCurr = curr.cultures.map((c: any) => c.cultureCode).sort().join(",");
      if (cPrev !== cCurr) {
        diff["Cultures"] = { from: cPrev || "None", to: cCurr || "None" };
      }
    }

    return diff;
  }

  // Safely format any value (including Prisma JsonValue) for display in JSX
  function formatValue(value: any): string {
    if (value === null || value === undefined) return "None";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    if (value === "") return "None";
    return String(value);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold dark:text-white">Revision History for SKU: {sku}</h1>
        <Link 
          href={submission?.requestId ? `/request/${submission.requestId}` : "/request"}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:bg-white"
        >
          Back to Request
        </Link>
      </header>

      {/* History Table */}
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
                const isLast = i === products.length - 1; // oldest
                if (isLast) {
                  // Show initial values for the oldest version (now last row)
                  const initialValues = [
                    { field: 'Product Name', value: prod.productName },
                    { field: 'Short Description', value: prod.shortDescription },
                    { field: 'Long Description', value: prod.longDescription },
                    { field: 'Stamp', value: prod.stamp },
                    { field: 'Off Sale Message', value: prod.offSaleMessage },
                    { field: 'On Sale Date', value: prod.onSaleDate ? new Date(prod.onSaleDate).toLocaleDateString() : null },
                    { field: 'Off Sale Date', value: prod.noEndDate ? 'No end date' : (prod.offSaleDate ? new Date(prod.offSaleDate).toLocaleDateString() : null) },
                    { field: 'UOM US', value: prod.uomTitleUS && prod.uomValueUS ? `${prod.uomValueUS} ${prod.uomTitleUS}` : null },
                    { field: 'UOM CA', value: prod.uomTitleCA && prod.uomValueCA ? `${prod.uomValueCA} ${prod.uomTitleCA}` : null },
                    { field: 'Savings US', value: prod.noSavings ? 'No savings' : prod.savingsUS },
                    { field: 'Savings CA', value: prod.noSavings ? 'No savings' : prod.savingsCA },
                    { field: 'Is PDP Requested', value: prod.isPdpRequested ? 'Yes' : 'No' },
                    { field: 'PDP Work Request', value: prod.pdpWorkRequest },
                    { field: 'Include Translations', value: prod.includeTranslations ? 'Yes' : 'No' },
                    { field: 'Requested Cultures', value: prod.requestedCulturesJson },
                    { field: 'Accessories', value: prod.accessories.length > 0 ? prod.accessories.map(acc => acc.accessoryLabel).join(', ') : 'None' },
                    { field: 'Recommendations', value: prod.recommendations.length > 0 ? prod.recommendations.map(rec => rec.recommendedSku).filter(Boolean).join(', ') : 'None' },
                    { field: 'Cultures', value: prod.cultures.length > 0 ? prod.cultures.map(cult => cult.translatedName).join(', ') : 'None' },
                    { field: 'Created At', value: prod.createdAt.toLocaleString() }
                  ].filter(item => item.value !== null && item.value !== undefined && item.value !== '');

                  return (
                    <tr key={prod.id} className="border-t">
                      <td className="p-3">
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
                    <td className="p-3">
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
                              <span className="text-red-600 line-through">
                                {from === "" || from === null || from === undefined ? "None" : `"${from}"`}
                              </span>{" "}
                              <span className="text-gray-400">→</span>{" "}
                              <span className="text-green-600">
                                {to === "" || to === null || to === undefined ? "None" : `"${to}"`}
                              </span>
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
};

export default HistoryPage;
