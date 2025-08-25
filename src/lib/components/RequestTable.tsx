import Link from "next/link";
import { Settings, PlusCircle } from "lucide-react";

export type RequestRow = {
  id: number;
  requesterName: string | null;
  requesterEmail: string | null;
  dueDate: string | Date | null;
  createdAt: string | Date;
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
          {requests.map((r) => (
            <tr key={r.id} className="border-t align-top">
              <td className="p-3">#{r.id}</td>
              <td className="p-3">{r.requesterName || "—"}</td>
              <td className="p-3">{r.requesterEmail || "—"}</td>
              <td className="p-3">{r.skuCount}</td>
              <td className="p-3">
                {r.sampleProducts.length ? (
                  <ul className="list-inside list-disc">
                    {r.sampleProducts.map((p) => (
                      <li key={p.id}>
                        <span className="font-mono">{p.sku}</span>{" "}
                        <span className="text-gray-600">— {p.productName}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </td>
              <td className="p-3">
                {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
              </td>
              <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="p-3 space-x-4 flex items-center">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
