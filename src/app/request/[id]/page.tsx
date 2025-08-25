// src/app/request/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SubmitToSmartlingPopup from "@/lib/components/SubmitToSmartlingPopup";

export default async function ManageRequest({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) {
    return <div className="mx-auto max-w-5xl p-6">Invalid request id.</div>;
  }

  const req = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          products: {
            where: { isCurrent: true }, // only the current revision per SKU
            orderBy: [{ sku: "asc" }],
            include: {
              accessories: true,
              cultures: true,
              recommendations: true,
            },
          },
        },
      },
    },
  });

  if (!req) {
    return <div className="mx-auto max-w-5xl p-6">Request not found.</div>;
  }

  type Submission = (typeof req.submissions)[number];
  type Product = Submission["products"][number];

  // Strong type for table rows
  type Row = {
    id: number;                // product id (row key)
    sku: string;
    productName: string;
    shortDescription: string;
    version: number;
    isCurrent: boolean;

    uomUS: string;
    uomCA: string;
    savingsUS: string;
    savingsCA: string;
    onSaleDate: string;
    offSaleDate: string;

    submissionId: number;      // for display
    submissionNote: string;    // for display
    submissionTime: string;    // for display
    submissionIdRaw: number;   // for URLs (same as product.submissionId)
  };

  // Flatten all current products into table rows
  const rows: Row[] = req.submissions.flatMap((s: Submission) =>
    s.products.map((p: Product): Row => ({
      id: p.id,
      sku: p.sku,
      productName: p.productName,
      shortDescription: p.shortDescription ?? "",
      version: p.version,
      isCurrent: p.isCurrent,

      uomUS: p.uomTitleUS && p.uomValueUS ? `${p.uomValueUS} ${p.uomTitleUS}` : "—",
      uomCA: p.uomTitleCA && p.uomValueCA ? `${p.uomValueCA} ${p.uomTitleCA}` : "—",
      savingsUS: p.noSavings ? "—" : (p.savingsUS || "—"),
      savingsCA: p.noSavings ? "—" : (p.savingsCA || "—"),
      onSaleDate: p.onSaleDate ? new Date(p.onSaleDate).toLocaleDateString() : "—",
      offSaleDate: p.noEndDate ? "No end" : (p.offSaleDate ? new Date(p.offSaleDate).toLocaleDateString() : "—"),

      submissionId: s.id,
      submissionNote: s.note ?? "—",
      submissionTime: new Date(s.createdAt).toLocaleString(),
      submissionIdRaw: p.submissionId,
    }))
  );

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Request #{req.id}</h1>
          <p className="text-sm text-gray-600">
            {req.requesterName ? `${req.requesterName} · ` : ""}
            {req.requesterEmail || "—"}
            {req.dueDate ? ` · Due ${new Date(req.dueDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <Link
          href={`/new?requestId=${req.id}`}
          className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          + Add SKU to this Request
        </Link>
      </header>

      {/* Notes */}
      {req.notes && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-2">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.notes}</p>
        </div>
      )}

      {/* SKUs table */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-medium mb-3">SKUs in this Request</h2>

        {!rows.length ? (
          <p className="text-sm text-gray-500">
            No SKUs yet. Use “Add SKU to this Request”.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">UOM (US)</th>
                  <th className="p-3">UOM (CA)</th>
                  <th className="p-3">Savings (US)</th>
                  <th className="p-3">Savings (CA)</th>
                  <th className="p-3">On Sale</th>
                  <th className="p-3">Off Sale</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3 font-mono">{r.sku}</td>
                    <td className="p-3">
                      <div className="font-medium">{r.productName}</div>
                      <div className="text-xs text-gray-500">
                        Submission #{r.submissionId} · {r.submissionTime}
                        {r.submissionNote !== "—" ? ` · ${r.submissionNote}` : ""}
                      </div>
                    </td>
                    <td className="p-3">{r.uomUS}</td>
                    <td className="p-3">{r.uomCA}</td>
                    <td className="p-3">{r.savingsUS}</td>
                    <td className="p-3">{r.savingsCA}</td>
                    <td className="p-3">{r.onSaleDate}</td>
                    <td className="p-3">{r.offSaleDate}</td>
                    <td className="p-3">
                      <span
                        title={`Version ${r.version}${r.isCurrent ? " (current)" : ""}`}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        v{r.version}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/new?requestId=${req.id}&fromProductId=${r.id}&submissionId=${r.submissionIdRaw}`}
                          className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Add Revision
                        </Link>
                        <Link
                          href={`/request/${req.id}/history?sku=${encodeURIComponent(r.sku)}&submissionId=${r.submissionIdRaw}`}
                          className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          View History
                        </Link>
                        <SubmitToSmartlingPopup sku={r} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
