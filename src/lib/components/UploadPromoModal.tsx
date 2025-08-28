"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, FileDown, Info } from "lucide-react";

type Props = {
  requestId: number;
  kind: "INCREMENTAL_PROMO" | "COUPON_PROMO";
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
};

export default function UploadPromoModal({ requestId, kind, open, onClose, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const title =
    kind === "INCREMENTAL_PROMO" ? "Upload Incremental Promotion" : "Upload Coupon Promotion";

  // Shared template (recommended)
  const sharedTemplateHref = "/templates/sku_promo_template.xlsx";
  // Optional per-kind templates (uncomment if you add distinct files)
  const perKindTemplateHref =
    kind === "INCREMENTAL_PROMO"
      ? "/templates/sku_incremental_template.xlsx"
      : "/templates/sku_coupon_template.xlsx";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose an Excel file.");
      return;
    }

    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);

    try {
      setBusy(true);
      const res = await fetch(`/api/requests/${requestId}/promotions`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
      setDone(true);
      onUploaded?.();
      // setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Help + Template download */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4" />
              <div className="space-y-1">
                <p className="font-medium">Template & tips</p>
                <ul className="list-inside list-disc text-blue-900/90">
                  <li>One row per SKU per Culture (e.g., en-US, fr-CA, fr-FR).</li>
                  <li>
                    <strong>Coupons:</strong> include <em>Savings Amount</em> and <em>Coupon Code</em>.
                  </li>
                  <li>
                    <strong>Quantity / Configurable / BOM:</strong> free text allowed; we store exactly what
                    you provide.
                  </li>
                </ul>

                <div className="flex flex-wrap gap-3 pt-1">
                  {/* Shared template link */}
                  <a
                    href={sharedTemplateHref}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Download template (XLSX)
                  </a>

                  {/* Optional per-kind link (show only if you add those files) */}
                  {/* <a
                    href={perKindTemplateHref}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    <FileDown className="h-4 w-4" />
                    {kind === "INCREMENTAL_PROMO" ? "Incremental template" : "Coupon template"}
                  </a> */}
                </div>
              </div>
            </div>
          </div>

          {/* File chooser */}
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
            <FileSpreadsheet className="h-6 w-6 text-gray-700" />
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Excel file (.xlsx or .xls)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your file will be attached to this Request for processing.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {done && (
            <p className="inline-flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Uploaded successfully
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <UploadCloud className="h-4 w-4" />
              {busy ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
