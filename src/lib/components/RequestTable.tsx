import Link from "next/link";
import { Settings, PlusCircle, Package, ChevronDown } from "lucide-react";

export type RequestRow = {
  id: number;
  requesterName: string | null;
  requesterEmail: string | null;
  dueDate: string | Date | null;
  createdAt: string | Date;
  // total SKUs across submissions + a few sample SKUs
  skuCount: number;
  sampleProducts: { id: number; sku: string; productName: string }[];
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

            return (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3">#{r.id}</td>
                <td className="p-3">{r.requesterName || "—"}</td>
                <td className="p-3">{r.requesterEmail || "—"}</td>
                <td className="p-3">{r.skuCount}</td>

                {/* Collapsible “Includes” cell */}
                <td className="p-3">
                  {r.skuCount === 0 ? (
                    <span className="text-gray-500">None</span>
                  ) : (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer select-none text-gray-800">
                        <Package className="h-4 w-4" aria-hidden />
                        <span className="font-medium">{r.skuCount} SKU{r.skuCount !== 1 ? "s" : ""}</span>
                        {/* inline preview chips */}
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

                      {/* Expanded content */}
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
                          <Link
                            href={`/request/${r.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View all SKUs on Manage →
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
                  <Link
                    href={`/request/${r.id}`}
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
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
