import Link from "next/link";

type Row = {
  id: number;
  requester: string | null;
  note: string | null;
  createdAt: string | Date;
  products: { id: number; sku: string; productName: string }[];
};

export default function SubmissionTable({ submissions }: { submissions: Row[] }) {
  if (!submissions.length) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
        No submissions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Requester</th>
            <th className="p-3 text-left">Note</th>
            <th className="p-3 text-left">Products</th>
            <th className="p-3 text-left">Created</th>
            <th className="p-3 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-t align-top">
              <td className="p-3">#{s.id}</td>
              <td className="p-3">{s.requester || "—"}</td>
              <td className="p-3 max-w-[24ch] truncate" title={s.note || ""}>
                {s.note || "—"}
              </td>
              <td className="p-3">
                {s.products.length ? (
                  <ul className="list-inside list-disc">
                    {s.products.map((p) => (
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
                {new Date(s.createdAt).toLocaleString()}
              </td>
              <td className="p-3">
                {/* If you add a detail page later */}
                <Link href={`/submissions/${s.id}`} className="text-blue-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
