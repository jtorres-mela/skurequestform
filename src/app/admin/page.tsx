// app/admin/page.tsx
import { prisma } from "@/lib/prisma";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { sku?: string; culture?: string };
}) {
  const sku = searchParams?.sku || undefined;
  const culture = searchParams?.culture || undefined;

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

  const fmtDate = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Submissions</h1>
          <p className="text-sm text-gray-600">
            Filters via querystring: <code>?sku=SKU123</code>{" "}
            <span className="mx-1">|</span> <code>?culture=en-CA</code>
          </p>
        </div>
        <div className="text-sm text-gray-600">Total: {submissions.length}</div>
      </header>

      {!submissions.length ? (
        <p className="text-gray-500">No submissions found.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <section key={s.id} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-medium">Submission #{s.id}</h2>
                  {s.requester && (
                    <div className="text-sm">Requester: {s.requester}</div>
                  )}
                  {s.note && (
                    <div className="text-sm text-gray-600">Note: {s.note}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Product Name</th>
                      <th className="p-2 text-left">Stamp</th>
                      <th className="p-2 text-left">Off-Sale</th>
                      <th className="p-2 text-left">Cultures</th>
                      <th className="p-2 text-left">Accessories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.products.map((p) => (
                      <tr key={p.id} className="border-t align-top">
                        <td className="p-2 font-mono">{p.sku}</td>
                        <td className="p-2">{p.productName}</td>
                        <td className="p-2">{p.stamp || "—"}</td>
                        <td className="p-2">{p.offSaleMessage || "—"}</td>
                        <td className="p-2">
                          {p.cultures.length ? (
                            <ul className="list-inside list-disc">
                              {p.cultures.map((c) => (
                                <li key={c.id}>
                                  <span className="font-medium">{c.cultureCode}</span>
                                  {c.translatedName ? ` — ${c.translatedName}` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                        <td className="p-2">
                          {p.accessories.length ? (
                            <ul className="list-inside list-disc">
                              {p.accessories.map((a) => (
                                <li key={a.id}>
                                  {a.accessorySku || a.accessoryLabel || "—"}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Details row per product */}
                    {s.products.map((p) => (
                      <tr key={`${p.id}-details`} className="border-t bg-gray-50/60">
                        <td colSpan={6} className="p-3">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <div className="text-xs uppercase text-gray-500">
                                Sale Window
                              </div>
                              <div>
                                <span className="text-gray-700">
                                  {fmtDate(p.onSaleDate)} → {fmtDate(p.offSaleDate)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs uppercase text-gray-500">
                                UOM (US)
                              </div>
                              <div className="text-gray-700">
                                {(p.uomValueUS || "—") + " " + (p.uomTitleUS || "")}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs uppercase text-gray-500">
                                UOM (CA)
                              </div>
                              <div className="text-gray-700">
                                {(p.uomValueCA || "—") + " " + (p.uomTitleCA || "")}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-xs uppercase text-gray-500">
                                Savings
                              </div>
                              <div className="text-gray-700">
                                US: {p.savingsUS || "—"}{" "}
                                <span className="mx-2 text-gray-400">|</span>
                                CA: {p.savingsCA || "—"}
                              </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <div className="text-xs uppercase text-gray-500">
                                Recommendations
                              </div>
                              {p.recommendations.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {p.recommendations.map((r) => (
                                    <span
                                      key={r.id}
                                      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono"
                                    >
                                      {r.sku}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-gray-500">None</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!s.products.length && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500">
                          No products on this submission.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
