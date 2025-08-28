import Link from "next/link";
import { Settings, PlusCircle, Package, ChevronDown, Percent, Ticket } from "lucide-react";

export type PromoSummary = {
  id: number;
  kind: "INCREMENTAL_PROMO" | "COUPON_PROMO";
  uploadedAt: string | Date;
  rows?: number;          // optional: requires PromotionLine
  fileName?: string;      // optional
};

export type RequestRow = {
  id: number;
  requesterName: string | null;
  requesterEmail: string | null;
  dueDate: string | Date | null;
  createdAt: string | Date;

  // existing SKU info
  skuCount: number;
  sampleProducts: { id: number; sku: string; productName: string }[];

  // NEW (all optional for compatibility)
  promoUploadCount?: number;      // total promo files for this request
  promoRowCount?: number;         // total parsed rows (if PromotionLine exists)
  lastPromoAt?: string | Date | null;
  promoSummaries?: PromoSummary[]; // recent uploads (e.g., last 3)
};

export default function RequestTable({ requests }: { requests: RequestRow[] }) {
  if (!requests.length) {
    return (
      <div className="rounded-xl shadow-md bg-white p-6 text-center text-gray-500">
        No requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-md bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Requester</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">SKUs</th>
            <th className="p-3 text-left">Includes</th>
            {/* NEW */}
            <th className="p-3 text-left">Promos</th>
            <th className="p-3 text-left">Due</th>
            <th className="p-3 text-left">Created</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const previewCount = 3;
            const previews = r.sampleProducts.slice(0, previewCount);
            const remaining = Math.max(0, r.skuCount - previews.length);

            // promo helpers (all optional-safe)
            const promoCount = r.promoUploadCount ?? 0;
            const promoRows = r.promoRowCount ?? undefined;
            const lastAt = r.lastPromoAt ? new Date(r.lastPromoAt).toLocaleDateString() : null;

            return (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">#{r.id}</td>
                <td className="p-3">{r.requesterName || "—"}</td>
                <td className="p-3">{r.requesterEmail || "—"}</td>
                <td className="p-3">{r.skuCount}</td>

                {/* SKUs Includes (unchanged) */}
                <td className="p-3">
                  {r.skuCount === 0 ? (
                    <span className="text-gray-500">None</span>
                  ) : (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer select-none text-gray-800">
                        <Package className="h-4 w-4" aria-hidden />
                        <span className="font-medium">
                          {r.skuCount} SKU{r.skuCount !== 1 ? "s" : ""}
                        </span>
                        {previews.length > 0 && (
                          <span className="flex flex-wrap items-center gap-1 text-gray-600">
                            <span className="mx-1 text-gray-400">•</span>
                            {previews.map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono"
                                title={p.productName}
                              >
                                {p.sku}
                              </span>
                            ))}
                            {remaining > 0 && (
                              <span className="text-gray-500">+{remaining} more</span>
                            )}
                          </span>
                        )}
                        <ChevronDown className="ml-1 h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>

                      <div className="mt-2 pl-6">
                        {r.sampleProducts.length ? (
                          <ul className="list-inside list-disc space-y-1">
                            {r.sampleProducts.map((p) => (
                              <li key={p.id}>
                                <span className="font-mono">{p.sku}</span>{" "}
                                <span className="text-gray-600">— {p.productName}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">No preview items provided.</p>
                        )}
                        <div className="mt-2">
                          <Link href={`/request/${r.id}`} className="text-blue-600 hover:underline">
                            View all SKUs on Manage →
                          </Link>
                        </div>
                      </div>
                    </details>
                  )}
                </td>

                {/* NEW: Promos column */}
                <td className="p-3">
                  {promoCount === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer select-none text-gray-800">
                        {/* Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {promoCount} upload{promoCount !== 1 ? "s" : ""}
                        </span>
                        {/* optional rows */}
                        {typeof promoRows === "number" && (
                          <span className="text-gray-500 text-xs">• {promoRows} rows</span>
                        )}
                        {lastAt && (
                          <span className="text-gray-500 text-xs">• Last: {lastAt}</span>
                        )}
                        <ChevronDown className="ml-1 h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>

                      {/* Recent uploads (lightweight) */}
                      <div className="mt-2 pl-6">
                        {!r.promoSummaries?.length ? (
                          <p className="text-gray-500 text-sm">No details available.</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {r.promoSummaries.slice(0, 3).map((u) => (
                              <li key={u.id} className="flex items-center gap-2">
                                {u.kind === "COUPON_PROMO" ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700">
                                    <Ticket className="h-3.5 w-3.5" /> Coupon
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700">
                                    <Percent className="h-3.5 w-3.5" /> Incremental
                                  </span>
                                )}
                                <span className="text-gray-700">
                                  {new Date(u.uploadedAt).toLocaleDateString()}
                                </span>
                                {typeof u.rows === "number" && (
                                  <span className="text-gray-500">· {u.rows} rows</span>
                                )}
                                {u.fileName && (
                                  <span className="truncate text-gray-500" title={u.fileName}>
                                    · {u.fileName}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2">
                          <Link href={`/request/${r.id}`} className="text-blue-600 hover:underline">
                            View promo uploads on Manage →
                          </Link>
                        </div>
                      </div>
                    </details>
                  )}
                </td>

                <td className="p-3">
                  {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>

                <td className="p-3 flex items-center gap-4">
                  <Link href={`/request/${r.id}`} className="inline-flex items-center text-blue-600 hover:underline">
                    <Settings className="w-4 h-4 mr-1" /> Manage
                  </Link>
                  <Link
                    href={`/new?requestId=${r.id}`}
                    className="inline-flex items-center text-green-600 hover:underline"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Add SKU
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
