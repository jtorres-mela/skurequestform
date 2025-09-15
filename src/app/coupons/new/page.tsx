"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormField, CurrencyInput } from "@/lib/components/Form";
import Link from "next/link";

/** Cultures you’re supporting on the form */
type CultureCode = "en-US" | "es-US" | "en-CA" | "fr-CA" | "es-MX";

type CultureRow = {
  cultureCode: CultureCode;
  name: string;
  shortDescription: string;
  savingsAmount: string; // keep as string in UI; server will send as Decimal
};

const DEFAULT_CULTURES: CultureRow[] = [
  { cultureCode: "en-US", name: "", shortDescription: "", savingsAmount: "" },
  { cultureCode: "es-US", name: "", shortDescription: "", savingsAmount: "" },
  { cultureCode: "en-CA", name: "", shortDescription: "", savingsAmount: "" },
  { cultureCode: "fr-CA", name: "", shortDescription: "", savingsAmount: "" },
  { cultureCode: "es-MX", name: "", shortDescription: "", savingsAmount: "" },
];

/** Helper: parse a fetch response safely */
async function readJson(res: Response) {
  const txt = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(txt) as any, status: res.status };
  } catch {
    return { ok: res.ok, data: null, status: res.status, text: txt };
  }
}

export default function NewCouponPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const requestId = React.useMemo(() => {
    const raw = sp.get("requestId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, [sp]);

  const [couponCode, setCouponCode] = React.useState("");
  const [rows, setRows] = React.useState<CultureRow[]>(DEFAULT_CULTURES);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const setRow = (idx: number, patch: Partial<CultureRow>) => {
    setRows((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  /** Build per-market savings from the culture rows */
  function buildMarketsFromCultures(cultures: CultureRow[]) {
    // pick a savings value per market, preferring EN then other locale
    const find = (codes: CultureCode[]) =>
      codes
        .map((c) => cultures.find((r) => r.cultureCode === c)?.savingsAmount?.trim())
        .find((v) => v); // first non-empty

    const us = find(["en-US", "es-US"]);
    const ca = find(["en-CA", "fr-CA"]);
    const mx = find(["es-MX"]);

    const markets: { market: "US" | "CA" | "MX"; savings?: string; currency?: string }[] = [];
    if (us) markets.push({ market: "US", savings: us, currency: "USD" });
    if (ca) markets.push({ market: "CA", savings: ca, currency: "CAD" });
    if (mx) markets.push({ market: "MX", savings: mx, currency: "MXN" });
    return markets;
  }

  const submit = async () => {
    if (!requestId) {
      setErr("Missing requestId");
      return;
    }
    if (!couponCode.trim()) {
      setErr("Coupon Code is required.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      const payload = {
        couponCode: couponCode.trim(),
        cultures: rows.map((r) => ({
          cultureCode: r.cultureCode,
          name: r.name || "",
          shortDescription: r.shortDescription || null,
        })),
        markets: buildMarketsFromCultures(rows),
      };

      const res = await fetch(`/api/requests/${requestId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { ok, data, status, text } = await readJson(res);
      if (!ok) {
        throw new Error(
          (data && data.error) ||
            `HTTP ${status}: ${(typeof text === "string" ? text.slice(0, 200) : "") || "Failed to save"}`
        );
      }

      router.push(`/request/${requestId}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Coupon</h1>
        <div className="text-sm">
          <Link href={requestId ? `/request/${requestId}` : "/"} className="text-blue-700 hover:underline">
            Back to Request
          </Link>
        </div>
      </div>

      {/* Coupon basics */}
      <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <FormField id="coupon-code" label="Coupon Code" required>
          <input
            id="coupon-code"
            className="w-full rounded border px-3 py-2"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g., SAVE5"
          />
        </FormField>

        <p className="text-xs text-gray-600">
          Savings are entered per culture below and will be translated into per-market values (USD, CAD, MXN).
        </p>
      </section>

      {/* Cultures */}
      <section className="rounded-xl bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-base font-semibold">Cultures</h2>
        <p className="text-xs text-gray-600">Provide Name, Short Description, and Savings for each culture.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row, idx) => (
            <div key={row.cultureCode} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <div className="text-sm font-medium">{row.cultureCode}</div>

              <FormField id={`name-${idx}`} label="Name">
                <input
                  id={`name-${idx}`}
                  className="w-full rounded border px-3 py-2"
                  value={row.name}
                  onChange={(e) => setRow(idx, { name: e.target.value })}
                />
              </FormField>

              <FormField id={`short-${idx}`} label="Short Description">
                <input
                  id={`short-${idx}`}
                  className="w-full rounded border px-3 py-2"
                  value={row.shortDescription}
                  onChange={(e) => setRow(idx, { shortDescription: e.target.value })}
                />
              </FormField>

              <FormField id={`save-${idx}`} label="Savings Amount" hint="Use 0.00 format">
                <CurrencyInput
                  id={`save-${idx}`}
                  value={row.savingsAmount}
                  onChange={(v) => setRow(idx, { savingsAmount: v })}
                />
              </FormField>
            </div>
          ))}
        </div>
      </section>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
          onClick={submit}
        >
          {saving ? "Saving…" : "Save Coupon"}
        </button>
        <Link href={requestId ? `/request/${requestId}` : "/"} className="rounded border px-4 py-2 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </div>
  );
}
