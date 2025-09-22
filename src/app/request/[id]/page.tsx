import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SubmitToSmartlingPopup from "@/lib/components/SubmitToSmartlingPopup";
import ManageRequestActions from "@/lib/components/ManageRequestActions";
import { ActionBar, IconButton } from "@/lib/components/IconButton";
import SmartlingIconTrigger from "@/lib/components/SmartlingIconTrigger";
import { Plus, History, Eye } from "lucide-react";
import StatusCell from "@/lib/components/StatusCell";
import EditRequestDetails from "@/lib/components/EditRequestDetails";
import type { SubmissionStatus } from "@prisma/client";
import "../../globals.css";

// tiny helper, server-safe
function formatBytes(n: number | null | undefined) {
  if (!n || n <= 0) return "—";
  const kb = 1024,
    mb = kb * 1024;
  if (n >= mb) return `${(n / mb).toFixed(1)} MB`;
  if (n >= kb) return `${(n / kb).toFixed(0)} KB`;
  return `${n} B`;
}

// (optional) handy date helper near the top of the file
function fmtDate(d?: string | Date | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function fmtDateTime(d?: string | Date | null) {
  return d ? new Date(d).toLocaleString() : "—";
}

function fmtDateYMD(d?: string | Date | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

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
      emailRequest: {
      include: {
        markets: true,
        cultures: true,
        assets: { orderBy: { orderIndex: "asc" } },
      },
    },
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          products: {
            where: { isCurrent: true },
            orderBy: [{ sku: "asc" }],
            include: {
              accessories: true,
              cultures: true,
              recommendations: true,
              markets: true,
            },
          },
        },
      },
      promoUploads: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          kind: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
          _count: { select: { lines: true } },
        },
      },
      coupons: {
        orderBy: { createdAt: "desc" },
        include: {
          cultures: true,
          markets: true,
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
    id: number; // product id (row key)
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

    submissionId: number; // for display
    submissionNote: string; // for display
    submissionTime: string; // for display
    submissionIdRaw: number; // for URLs (same as product.submissionId)

    status: SubmissionStatus;
    statusNote: string | null;
  };

  type MarketRow = Product["markets"][number];
  type MarketCode = MarketRow["market"]; // "US" | "CA" | "MX" | "DE" | ...

  const DEFAULT_CURRENCY: Record<string, string> = {
    US: "USD",
    CA: "CAD",
    MX: "MXN",
    GB: "GBP",
    IE: "EUR",
    NL: "EUR",
    DE: "EUR",
    PL: "PLN",
    LT: "EUR",
  };

  // Values to seed the editor (all serializable)
const initialDetails = {
  requesterName:  req.requesterName ?? "",
  requesterEmail: req.requesterEmail ?? "",
  // editor expects YYYY-MM-DD or "", not a Date
  dueDate:        req.dueDate ? new Date(req.dueDate).toISOString().slice(0, 10) : "",
  adoId:          req.adoId ?? "",
  userStory:      req.userStory ?? "",
  notes:          req.notes ?? "",
};


  function findMarket(p: Product, code: MarketCode) {
    return p.markets?.find((m) => m.market === code);
  }

  function fmtMoney(
    amount: unknown,
    market: MarketCode,
    currencyOverride?: string | null | undefined
  ) {
    if (amount == null) return "—";
    const n = Number(amount as any);
    if (!Number.isFinite(n)) return "—";
    const code = currencyOverride || DEFAULT_CURRENCY[market] || "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return n.toFixed(2);
    }
  }

  function fmtUom(m?: MarketRow) {
    if (!m) return "—";
    const { uomValue, uomTitle } = m;
    if (uomValue && uomTitle) return `${uomValue} ${uomTitle}`;
    if (uomValue) return String(uomValue);
    if (uomTitle) return String(uomTitle);
    return "—";
  }

  function pickPrimaryForDates(p: Product): MarketRow | undefined {
    // Prefer US → CA → first market
    return findMarket(p, "US") || findMarket(p, "CA") || p.markets?.[0];
  }

  // Flatten all current products into table rows
  const rows: Row[] = req.submissions.flatMap((s: Submission) =>
    s.products.map((p: Product): Row => {
      const mUS = findMarket(p, "US");
      const mCA = findMarket(p, "CA");
      const primary = pickPrimaryForDates(p);

      const savingsUS = mUS?.noSavings
        ? "—"
        : mUS?.savings != null
        ? fmtMoney(mUS.savings, "US", mUS?.currency)
        : "—";

      const savingsCA = mCA?.noSavings
        ? "—"
        : mCA?.savings != null
        ? fmtMoney(mCA.savings, "CA", mCA?.currency)
        : "—";

      const onSaleDate = primary?.onSaleDate
        ? new Date(primary.onSaleDate).toLocaleDateString()
        : "—";

      const offSaleDate = primary?.noEndDate
        ? "No end"
        : primary?.offSaleDate
        ? new Date(primary.offSaleDate).toLocaleDateString()
        : "—";

      return {
        id: p.id,
        sku: p.sku,
        productName: p.productName,
        shortDescription: p.shortDescription ?? "",
        version: p.version,
        isCurrent: p.isCurrent,

        // Derive from per-market rows (keeps your existing columns)
        uomUS: fmtUom(mUS),
        uomCA: fmtUom(mCA),
        savingsUS,
        savingsCA,
        onSaleDate,
        offSaleDate,

        submissionId: s.id,
        submissionNote: s.note ?? "—",
        submissionTime: new Date(s.createdAt).toLocaleString(),
        submissionIdRaw: p.submissionId,

        status: p.status as SubmissionStatus,
        statusNote: p.statusNote ?? null,
      };
    })
  );

  return (
  <div className="mx-auto max-w-7xl p-6 space-y-6">
    {/* Header */}
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold dark:text-gray-200">
        Manage Request #{req.id}
      </h1>
      <ManageRequestActions requestId={req.id} />
    </header>

    {/* Request details (full width) */}
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Request details</h2>
        <EditRequestDetails requestId={req.id} initial={initialDetails} />
      </div>

      {/* Responsive 2–3 column grid of fields */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div className="rounded-lg shadow-sm bg-gray-50 p-3">
          <dt className="text-gray-500">Requester</dt>
          <dd className="mt-0.5 text-gray-900">{req.requesterName || "—"}</dd>
        </div>

        <div className="rounded-lg shadow-sm bg-gray-50 p-3">
          <dt className="text-gray-500">Email</dt>
          <dd className="mt-0.5">
            {req.requesterEmail ? (
              <a
                href={`mailto:${req.requesterEmail}`}
                className="text-blue-700 hover:underline"
              >
                {req.requesterEmail}
              </a>
            ) : (
              <span className="text-gray-900">—</span>
            )}
          </dd>
        </div>

        <div className="rounded-lg shadow-sm bg-gray-50 p-3">
          <dt className="text-gray-500">Due</dt>
          <dd className="mt-0.5 text-gray-900">{fmtDate(req.dueDate)}</dd>
        </div>

        <div className="rounded-lg shadow-sm bg-gray-50 p-3">
          <dt className="text-gray-500">Created</dt>
          <dd className="mt-0.5 text-gray-900">{fmtDateTime(req.createdAt)}</dd>
        </div>

        {!!req.adoId && (
          <div className="rounded-lg shadow-sm bg-gray-50 p-3">
            <dt className="text-gray-500">ADO Work Req</dt>
            <dd className="mt-0.5 text-gray-900">{req.adoId}</dd>
          </div>
        )}

        {!!req.userStory && (
          <div className="rounded-lg shadow-sm bg-gray-50 p-3">
            <dt className="text-gray-500">ADO User Story</dt>
            <dd className="mt-0.5 text-gray-900">{req.userStory}</dd>
          </div>
        )}
      </dl>
    </section>

    {/* Notes (full width, beneath details) */}
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-medium">Notes</h2>
      {req.notes && req.notes.trim().length ? (
        <p className="whitespace-pre-wrap text-sm text-gray-700">{req.notes}</p>
      ) : (
        <p className="text-sm text-gray-500">No notes added.</p>
      )}
    </section>


    {/* Email Request block (only for EMAIL_REQUEST) */}
{req.type === "EMAIL_REQUEST" && req.emailRequest && (
  <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="font-medium">Email Request</h2>
      {/* Optional: link or button to edit later */}
      {/* <Link href={`/request/${req.id}/email/edit`} className="text-sm text-blue-700 hover:underline">Edit</Link> */}
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="text-gray-500">Name of Email</div>
        <div className="mt-0.5 text-gray-900">{req.emailRequest.emailName}</div>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <div className="text-gray-500">Send Date</div>
        <div className="mt-0.5 text-gray-900">
          {fmtDateYMD(req.emailRequest.sendDate)}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2 lg:col-span-1">
        <div className="text-gray-500">Subject Line</div>
        <div className="mt-0.5 text-gray-900">{req.emailRequest.subject}</div>
      </div>

      {req.emailRequest.preheader && (
        <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2 lg:col-span-1">
          <div className="text-gray-500">Pre-header</div>
          <div className="mt-0.5 text-gray-900">{req.emailRequest.preheader}</div>
        </div>
      )}

      {req.emailRequest.bodyCopy && (
        <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
          <div className="text-gray-500">Body Copy</div>
          <pre className="mt-0.5 whitespace-pre-wrap text-gray-900">
            {req.emailRequest.bodyCopy}
          </pre>
        </div>
      )}
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {/* Countries / Markets */}
      <div>
        <div className="text-sm font-medium mb-1">Countries</div>
        <div className="flex flex-wrap gap-2">
          {req.emailRequest.markets.length
            ? req.emailRequest.markets.map((m) => (
                <span key={m.id} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs">
                  {m.market}
                </span>
              ))
            : <span className="text-sm text-gray-500">—</span>}
        </div>
      </div>

      {/* Languages / Cultures */}
      <div>
        <div className="text-sm font-medium mb-1">Languages</div>
        <div className="flex flex-wrap gap-2">
          {req.emailRequest.cultures.length
            ? req.emailRequest.cultures.map((c) => (
                <span key={c.id} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs">
                  {c.cultureCode}
                </span>
              ))
            : <span className="text-sm text-gray-500">—</span>}
        </div>
      </div>
    </div>

    {/* Assets */}
    <div className="mt-2">
      <div className="text-sm font-medium mb-1">Assets</div>
      {req.emailRequest.assets.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">Image Path</th>
                <th className="p-2">Link To</th>
              </tr>
            </thead>
            <tbody>
              {req.emailRequest.assets.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 font-mono">{a.imagePath || "—"}</td>
                  <td className="p-2">
                    {a.linkTo ? (
                      <a className="text-blue-700 hover:underline break-all" href={a.linkTo}>
                        {a.linkTo}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No assets added.</p>
      )}
    </div>
  </section>
)}

{/* SKUs */}
{req.type === "EMAIL_REQUEST" ? (
  <section className="rounded-xl bg-white p-4 shadow-sm">
    <h2 className="mb-2 font-medium">SKUs</h2>
    <p className="text-sm text-gray-500">
      Email Requests don’t include SKU submissions.
    </p>
  </section>
) : (
  <section className="rounded-xl bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-medium">SKUs in this Request</h2>
      <span className="text-xs text-gray-500">{rows.length} total</span>
    </div>

    {!rows.length ? (
      <p className="text-sm text-gray-500">
        No SKUs yet. Use “Add SKU to this Request”.
      </p>
    ) : (
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left">
              <th className="p-3 w-[120px]">SKU</th>
              <th className="p-3">Product</th>
              <th className="p-3 w-[90px]">Version</th>
              <th className="p-3 w-[140px]">Status</th>
              <th className="p-3 w-[140px]">Download</th>
              <th className="p-3 w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top hover:bg-gray-50/60">
                {/* SKU */}
                <td className="p-3 font-mono text-gray-900 whitespace-nowrap">
                  {r.sku}
                </td>

                {/* Product + meta */}
                <td className="p-3">
                  <div className="font-medium text-gray-900">{r.productName}</div>
                  <div className="text-xs text-gray-500">
                    Submission #{r.submissionId} · {r.submissionTime}
                    {r.submissionNote !== "—" ? ` · ${r.submissionNote}` : ""}
                  </div>
                </td>

                {/* Version */}
                <td className="p-3">
                  <span
                    title={`Version ${r.version}${r.isCurrent ? " (current)" : ""}`}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    v{r.version}
                  </span>
                </td>

                {/* Status */}
                <td className="p-3 relative">
                  <StatusCell
                    submissionId={r.submissionId}
                    productId={r.id}
                    value={r.status}
                    note={r.statusNote ?? undefined}
                  />
                </td>

                {/* Download */}
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/submissions/${r.submissionIdRaw}/products/${r.id}/export?format=docx`}
                      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={`Download DOCX for ${r.productName}`}
                    >
                      DOCX
                    </a>
                    <a
                      href={`/api/submissions/${r.submissionIdRaw}/products/${r.id}/export?format=pdf`}
                      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                      aria-label={`Download PDF for ${r.productName}`}
                    >
                      PDF
                    </a>
                  </div>
                </td>

                {/* Actions */}
                <td className="p-3 text-center">
                  <ActionBar>
                    <IconButton
                      className="inline-flex h-9 w-24 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition focus:outline-none"
                      href={`/request/skuInfo/${r.id}`}
                      title="View SKU information"
                    >
                      <p className="font-bold">View details</p>
                    </IconButton>
                  </ActionBar>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
)}




      {/* Promotions (uploads + manual coupons) */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Promotions</h2>
          <Link
            href={`/coupons/new?requestId=${req.id}`}
            className="text-sm text-blue-700 hover:underline"
          >
            Add Coupon
          </Link>
        </div>

        {(() => {
          // Normalize both sources into a single list
          type PromoRow =
            | {
                id: string;
                kind: "INCREMENTAL_PROMO" | "COUPON_PROMO";
                label: "Incremental" | "Coupon";
                source: "upload";
                fileName: string;
                mimeType: string | null;
                sizeBytes: number;
                count: number; // lines
                date: Date;
                hrefDownload: string;
              }
            | {
                id: string;
                kind: "COUPON_PROMO";
                label: "Coupon";
                source: "manual";
                code: string;
                cultures: string[];
                isActive: boolean;
                date: Date;
                hrefManage: string;
              };

          const uploads: PromoRow[] = (req.promoUploads ?? []).map((u) => ({
            id: `upload:${u.id}`,
            kind: u.kind,
            label: u.kind === "INCREMENTAL_PROMO" ? "Incremental" : "Coupon",
            source: "upload",
            fileName: u.fileName,
            mimeType: u.mimeType ?? null,
            sizeBytes: u.sizeBytes,
            count: u._count?.lines ?? 0,
            date: new Date(u.uploadedAt),
            hrefDownload: `/api/requests/${req.id}/promotions/${u.id}/download`,
          }));

          const coupons: PromoRow[] = (req.coupons ?? []).map((c) => ({
            id: `coupon:${c.id}`,
            kind: "COUPON_PROMO",
            label: "Coupon",
            source: "manual",
            code: c.couponCode,
            cultures: (c.cultures ?? []).map((cc) => cc.cultureCode),
            isActive: true,
            date: new Date(c.createdAt),
            hrefManage: `/coupons/${c.id}`, // or `/coupons/${c.id}/edit` if you have an edit route
          }));

          const promos = [...uploads, ...coupons].sort(
            (a, b) => b.date.getTime() - a.date.getTime()
          );

          if (!promos.length) {
            return <p className="text-sm text-gray-500">No promotions yet.</p>;
          }

          return (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="p-3">Type</th>
                    <th className="p-3">Identifier</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((row) => {
                    const typeBadge =
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                      (row.label === "Coupon"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700");

                    return (
                      <tr key={row.id} className="border-t">
                        {/* Type */}
                        <td className="p-3">
                          <span className={typeBadge}>{row.label}</span>
                          {row.source === "upload" && (
                            <span className="ml-2 text-[11px] text-gray-500">
                              (upload)
                            </span>
                          )}
                        </td>

                        {/* Identifier (file or code) */}
                        <td className="p-3">
                          {row.source === "upload" ? (
                            <>
                              <div className="font-medium">{row.fileName}</div>
                              <div className="text-xs text-gray-500">
                                {row.mimeType || "—"}
                              </div>
                            </>
                          ) : (
                            <div className="font-mono">{row.code}</div>
                          )}
                        </td>

                        {/* Items (rows vs cultures) */}
                        <td className="p-3">
                          {row.source === "upload" ? (
                            <span title="Rows in file">{row.count} rows</span>
                          ) : (
                            <span title="Cultures">
                              {row.cultures.join(", ") || "—"}
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="p-3">{row.date.toLocaleString()}</td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {row.source === "upload" ? (
                              <Link
                                href={row.hrefDownload}
                                className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                              >
                                Download
                              </Link>
                            ) : (
                              <>
                                <Link
                                  href={row.hrefManage}
                                  className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                                >
                                  Manage
                                </Link>
                                <span className="text-xs text-gray-500">
                                  {row.isActive ? "Active" : "Inactive"}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
