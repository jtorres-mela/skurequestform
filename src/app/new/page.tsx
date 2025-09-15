"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PreviewPane from "@/lib/components/PreviewPane";
import { FormField, CurrencyInput } from "@/lib/components/Form";
import { AccessoryChips } from "../../lib/components/AccessoryChips";
import { SkuChips } from "../../lib/components/SkuChips";
import RichTextEditorQuill from "../../lib/components/RichTextEditorQuill";
import dynamic from "next/dynamic";
import { ArrowRightLeft, Eraser } from "lucide-react";
import { IconButton } from "@/lib/components/IconButton";


/* =============================================================================
   Types
============================================================================= */

type MarketCode = "US" | "CA" | "MX" | "GB" | "IE" | "NL" | "DE" | "PL" | "LT";
// Optional, if you want stricter currency typing:
type CurrencyCode = "USD" | "CAD" | "MXN" | "EUR" | "GBP" | "PLN";

type MarketRowDraft = {
  market: MarketCode;
  currency?: CurrencyCode | string | null; // keep string to be flexible if needed
  // Savings
  noSavings?: boolean;
  savings?: string | null;       // keep as string in UI; server coerces to Decimal
  // UOM
  uomValue?: string | null;
  uomTitle?: string | null;
  // Dates
  onSaleDate?: string | null;    // "YYYY-MM-DD"
  offSaleDate?: string | null;
  noEndDate?: boolean;
};

type CultureRow = {
  cultureCode?: string;
  translatedName?: string;
  translatedShort?: string;
  translatedLong?: string;
};

type AccessoryRow = { accessorySku?: string; accessoryLabel?: string };
type RecommendationRow = { sku: string };

type ProductForm = {
  sku: string;
  productName: string;
  shortDescription?: string;
  longDescription?: string;
  stamp?: string | null;
  offSaleMessage?: string | null;

  // Per-market values live here now
  markets?: MarketRowDraft[];

  // Translations & extras
  includeTranslations?: boolean;
  requestedCultures?: string[];

  isPdpRequested?: boolean;
  pdpWorkRequest?: string | null;

  accessories: AccessoryRow[];
  cultures: CultureRow[];
  recommendations?: RecommendationRow[];
};

type ProductFormUI = ProductForm & {
  recommendationsCsv?: string;
  accessoriesCsv?: string;
};

/* =============================================================================
   Constants
============================================================================= */


const EMPTY_PRODUCT: ProductFormUI = {
  sku: "",
  productName: "",
  accessories: [],
  cultures: [],
  markets: [],                 // per-market container
  requestedCultures: [],       // helps decide which market cards to render
  includeTranslations: false,
  isPdpRequested: false,
  pdpWorkRequest: null,
  recommendationsCsv: "",
  accessoriesCsv: "",
};


const STAMP_OPTIONS = [
  "", // blank allowed
  "New",
  "Limited Time",
  "While Supplies Last",
  "Limited Shelf Life",
  "Black Friday",
  "Summer Sale",
  "Savings Pack",
];

const OFFSALE_OPTIONS = [
  "",
  "Sold Out",
  "Available Again Soon",
  "Temporarily Unavailable",
];

const UNIT_OF_MEASURE_TITLE = [
  "product(s)",
  "g",
  "oz",
  "fl oz",
  "ml",
  "kg",
  "softgels",
  "capsules",
  "tablets",
  "chewables",
  "servings"
]

// Parse a simple comma-separated list into trimmed non-empty strings
const parseCsv = (s: string): string[] =>
  (s || "").split(",").map((x: string) => x.trim()).filter(Boolean);

// --- Preview helpers ---
type CultureCode = "en-US" | "en-CA" | "fr-CA" | "es-MX" | string;

// derive translated fields for the chosen culture, or fall back to base
function pickCulture<T extends ProductForm>(
  p: T,
  culture: CultureCode
) {
  const row =
    p.cultures?.find(
      (c) => (c.cultureCode || "").toLowerCase() === culture.toLowerCase()
    ) || null;

  return {
    name: row?.translatedName || p.productName || "",
    short: row?.translatedShort || p.shortDescription || "",
    long: row?.translatedLong || p.longDescription || "",
  };
}

// basic chip style for badges
function Badge({ children, kind = "neutral" }: { children: React.ReactNode; kind?: "neutral" | "info" | "warn" | "danger" | "success" }) {
  const color =
    kind === "success" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
    kind === "warn"    ? "bg-amber-50 text-amber-800 ring-amber-200" :
    kind === "danger"  ? "bg-red-50 text-red-700 ring-red-200" :
    kind === "info"    ? "bg-sky-50 text-sky-700 ring-sky-200" :
                         "bg-gray-100 text-gray-800 ring-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${color}`}>
      {children}
    </span>
  );
}


function SavingsPreview({ amount, country }: { amount?: string; country: "US" | "CA" }) {
  if (!amount) return (
    <div className="text-[11px] text-gray-400">No amount set for {country}.</div>
  );
  return (
    <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      {country}: Save ${Number(amount).toFixed(2)}
    </div>
  );
}



/* =============================================================================
   Primitive UI helpers (Button, Card, Field, Inputs)
============================================================================= */


const MARKET_ORDER = ["US","CA","MX","GB","IE","NL","DE","PL","LT"] as const;


function marketsToRender(prod: any): MarketCode[] {
  // Prefer requestedCultures (checkboxes), else whatever is already on the product, else US/CA
  const req = (prod.requestedCultures ?? prod.requestedCulturesJson ?? []) as string[] | undefined;
  const fromRequested = (req ?? []).filter((k): k is MarketCode => (MARKET_ORDER as readonly string[]).includes(k));
  if (fromRequested.length) {
    return Array.from(new Set(fromRequested)).sort(
      (a, b) => MARKET_ORDER.indexOf(a) - MARKET_ORDER.indexOf(b)
    );
  }
  const fromSaved = ((prod.markets ?? []) as Array<{ market: string }>).map(m => m.market)
    .filter((k): k is MarketCode => (MARKET_ORDER as readonly string[]).includes(k));
  return fromSaved.length ? fromSaved : (["US","CA"] as MarketCode[]);
}

function getMarket(prod: any, market: MarketCode) {
  return (prod.markets ?? []).find((m: any) => m.market === market) ?? {};
}

// narrow what can be patched on a market row
type MarketPatch = Partial<
  Pick<
    MarketRowDraft,
    | "uomValue"
    | "uomTitle"
    | "savings"
    | "noSavings"
    | "currency"
    | "onSaleDate"
    | "offSaleDate"
    | "noEndDate"
  >
>;



const UOM_PLACEHOLDER: Record<MarketCode, string> = {
  US: "8 fl oz",
  CA: "237 ml",
  MX: "237 ml",
  GB: "250 ml",
  IE: "250 ml",
  NL: "250 ml",
  DE: "250 ml",
  PL: "250 ml",
  LT: "250 ml",
};

type CurrencyInfo = { sign: string; code: string };

export const MARKET_CURRENCY: Record<MarketCode, CurrencyInfo> = {
  US: { sign: "$", code: "USD" },
  CA: { sign: "$", code: "CAD" },
  MX: { sign: "$", code: "MXN" },
  GB: { sign: "£", code: "GBP" },
  IE: { sign: "€", code: "EUR" },
  NL: { sign: "€", code: "EUR" },
  DE: { sign: "€", code: "EUR" },
  LT: { sign: "€", code: "EUR" },
  PL: { sign: "zł", code: "PLN" },
};

export const currencyForMarket = (m: MarketCode): CurrencyInfo =>
  MARKET_CURRENCY[m];


const CULTURE_PRESETS: { key: string; label: string }[] = [
  { key: "US", label: "US" },
  { key: "CA", label: "CA" },
  { key: "MX", label: "MX" },
  { key: "GB", label: "GB" },
  { key: "IE", label: "IE" },
  { key: "NL", label: "NL" },
  { key: "DE", label: "DE" },
  { key: "PL", label: "PL" },
  { key: "LT", label: "LT" },
];

const EU_KEYS = ["GB", "IE", "NL", "DE", "PL", "LT"] as const;
const ORDER = CULTURE_PRESETS.map((c) => c.key);
const sortByPreset = (a: string, b: string) => ORDER.indexOf(a) - ORDER.indexOf(b);

export function CulturePicker({
  value,
  onChange,
}: {
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const list = React.useMemo(() => value ?? [], [value]);

  const setHas = (k: string, checked: boolean) => {
    const cur = new Set(list);
    checked ? cur.add(k) : cur.delete(k);
    onChange([...cur].sort(sortByPreset));
  };

  const toggleGroup = (keys: readonly string[], on = true) => {
    const cur = new Set(list);
    keys.forEach((k) => (on ? cur.add(k) : cur.delete(k)));
    onChange([...cur].sort(sortByPreset));
  };

  const selectAll = () => onChange([...ORDER]);
  const clearAll = () => onChange([]);

  const someEUSelected = EU_KEYS.some((k) => list.includes(k));
  const allEUSelected = EU_KEYS.every((k) => list.includes(k));

  // Tri-state checkbox: indeterminate when some but not all EU are selected
  const euRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (euRef.current) euRef.current.indeterminate = someEUSelected && !allEUSelected;
  }, [someEUSelected, allEUSelected]);

  return (
    <div className="space-y-2">
      {/* Quick actions + EU group toggle */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
          onClick={selectAll}
        >
          Select All
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
          onClick={clearAll}
        >
          Clear All
        </button>

        <label className="ml-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50">
          <input
            ref={euRef}
            type="checkbox"
            className="h-4 w-4"
            checked={allEUSelected}
            onChange={(e) => toggleGroup(EU_KEYS, e.target.checked)}
          />
          <span className="font-medium">EU</span>
          <span className="text-[10px] text-gray-500">({EU_KEYS.length})</span>
        </label>
      </div>

      {/* Per-culture checkboxes */}
      <div className="grid gap-2 sm:grid-cols-3">
        {CULTURE_PRESETS.map(({ key, label }) => {
          const checked = list.includes(key);
          return (
            <label
              key={key}
              className={
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 " +
                (checked ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200")
              }
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={(e) => setHas(key, e.target.checked)}
              />
              <span className="text-sm">{label}</span>
            </label>
          );
        })}
      </div>

      {/* Optional: tiny helper line to show which countries are in EU */}
      <p className="text-[11px] text-gray-500">
        EU group: {EU_KEYS.join(", ")}
      </p>
    </div>
  );
}
  

function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "subtle" | "danger";
}) {
  const base =
    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[.99] focus:outline-none";
  const styles =
    {
      primary:
        "bg-black text-white hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-black/60",
      subtle:
        "bg-white text-gray-900 border hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300",
      danger:
        "bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-2 focus-visible:ring-red-500",
    }[variant] || "";
  return (
    <button {...props} className={`${base} ${styles} ${props.className || ""}`} />
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-md">
      <header className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <div className="mt-1">{children}</div>
      {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2",
        "shadow-sm placeholder:text-gray-400",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2",
        "shadow-sm placeholder:text-gray-400",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60",
        props.className || "",
      ].join(" ")}
    />
  );
}


/* =============================================================================
   Page component (ONLY ONE default export; keep all hooks/handlers/JSX inside)
============================================================================= */
export default function Page() {
  const sp = useSearchParams();
  const router = useRouter();

  // ---- state FIRST (so anything below can safely reference them) ----
  const [requester, setRequester] = React.useState("");
  const [note, setNote] = React.useState("");

  // ✅ Initialize with the new shape (no noEndDate/noSavings/savingsUS/savingsCA at top level)
  const [products, setProducts] = React.useState<ProductFormUI[]>([
    { ...EMPTY_PRODUCT },
    // If you want US/CA visible by default, use:
     {
       ...EMPTY_PRODUCT,
       requestedCultures: ["US", "CA"],
       markets: [
         { market: "US", currency: "USD", noSavings: false, savings: null, uomValue: null, uomTitle: null, onSaleDate: null, offSaleDate: null, noEndDate: false },
         { market: "CA", currency: "CAD", noSavings: false, savings: null, uomValue: null, uomTitle: null, onSaleDate: null, offSaleDate: null, noEndDate: false },
       ],
     },
  ]);

  const [status, setStatus] =
    React.useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // ---- now any hooks that depend on state ----
  const updateProduct = React.useCallback(
    (idx: number, patch: Partial<ProductFormUI>) => {
      setProducts((prev: ProductFormUI[]) =>
        prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))
      );
    },
    [setProducts]
  );

  // URL params (memoized)
  const requestId = React.useMemo(() => {
    const raw = sp.get("requestId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, [sp]);

  const fromProductId = React.useMemo(() => {
    const raw = sp.get("fromProductId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, [sp]);

  const submissionId = React.useMemo(() => {
    const raw = sp.get("submissionId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }, [sp]);

// Prefill for revision flow
React.useEffect(() => {
  let cancelled = false;

  const run = async () => {
    if (!fromProductId || !submissionId) return;

    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/products/${fromProductId}`
      );
      if (!res.ok) return;

      const cur = await res.json();
      if (cancelled) return;

      // Map API -> UI shape (per-market model)
      setProducts([
        {
          ...EMPTY_PRODUCT,
          sku: cur.sku ?? "",
          productName: cur.productName ?? "",
          shortDescription: cur.shortDescription ?? undefined,
          longDescription: cur.longDescription ?? undefined,
          stamp: cur.stamp ?? null,
          offSaleMessage: cur.offSaleMessage ?? null,

          includeTranslations: !!cur.includeTranslations,
          requestedCultures: Array.isArray(cur.requestedCulturesJson)
            ? cur.requestedCulturesJson
            : [],

          markets: Array.isArray(cur.markets)
            ? cur.markets.map((m: any) => ({
                market: m.market,
                currency: m.currency ?? null,
                noSavings: !!m.noSavings,
                savings:
                  m.savings != null && m.savings !== "" ? String(m.savings) : null,
                uomValue: m.uomValue ?? null,
                uomTitle: m.uomTitle ?? null,
                onSaleDate: m.onSaleDate
                  ? new Date(m.onSaleDate).toISOString().slice(0, 10)
                  : null,
                offSaleDate: m.offSaleDate
                  ? new Date(m.offSaleDate).toISOString().slice(0, 10)
                  : null,
                noEndDate: !!m.noEndDate,
              }))
            : [],

          cultures: (cur.cultures ?? []).map((c: any) => ({
            cultureCode: c.cultureCode,
            translatedName: c.translatedName ?? undefined,
            translatedShort: c.translatedShort ?? undefined,
            translatedLong: c.translatedLong ?? undefined,
          })),

          // Convert to CSV for your UI helpers (optional)
          recommendationsCsv: (cur.recommendations ?? [])
            .map((r: any) => r.recommendedSku ?? "")
            .filter(Boolean)
            .join(", "),
          accessories: (cur.accessories ?? []).map((a: any) => ({
            accessorySku: a.accessorySku ?? undefined,
            accessoryLabel: a.accessoryLabel ?? undefined,
          })),
          accessoriesCsv: (cur.accessories ?? [])
            .map((a: any) => a.accessorySku ?? "")
            .filter(Boolean)
            .join(", "),
        },
      ]);
    } catch {
      // swallow or setErr(...) if you want
    }
  };

  void run();

  // Proper cleanup (NOT JSX)
  return () => {
    cancelled = true;
  };
}, [fromProductId, submissionId, setProducts]);



  /** Immutable update: add/update the market row on products[rowIndex] */
const updateMarket = React.useCallback(
  (rowIndex: number, market: MarketCode, patch: MarketPatch) => {
    if (!patch || Object.keys(patch).length === 0) return;

    setProducts((prev: ProductFormUI[]) => {
      // bounds check
      if (rowIndex < 0 || rowIndex >= prev.length) return prev;

      const next = prev.slice();
      const p: ProductFormUI = { ...next[rowIndex] };
      const list: MarketRowDraft[] = Array.isArray(p.markets) ? [...p.markets] : [];

      const idx = list.findIndex((m) => m.market === market);

      if (idx >= 0) {
        // merge into existing market row
        list[idx] = { ...list[idx], ...patch };
      } else {
        // create new market row
        list.push({ market, ...patch });
      }

      p.markets = list;
      next[rowIndex] = p;
      return next;
    });
  },
  [setProducts]
);


  // ---------------------------------------------------------------------------
  // Submit to /api/submissions
  // ---------------------------------------------------------------------------
async function submit() {
  setStatus("saving");
  setErr(null);

  try {
    if (!requestId || !Number.isFinite(requestId)) {
      throw new Error("Missing requestId — open this page from a Request.");
    }

    const payloadProducts = products.map(({ recommendationsCsv, accessoriesCsv, markets = [], ...base }) => {
  const recs =
    base.recommendations?.length
      ? base.recommendations
      : (recommendationsCsv ? parseCsv(recommendationsCsv).map(sku => ({ sku })) : []);

  const accs =
    base.accessories?.length
      ? base.accessories
      : (accessoriesCsv ? parseCsv(accessoriesCsv).map(accessorySku => ({ accessorySku })) : []);

  return {
    sku: base.sku,
    productName: base.productName,
    shortDescription: base.shortDescription ?? null,
    longDescription: base.longDescription ?? null,
    stamp: base.stamp ?? null,
    offSaleMessage: base.offSaleMessage ?? null,

    // NEW: per-market shape (server stores into SubmissionProductMarket)
    markets: markets.map(m => ({
      market: m.market,
      currency: m.currency ?? null,
      noSavings: !!m.noSavings,
      savings: m.noSavings ? null : (m.savings != null && m.savings !== "" ? String(m.savings) : null),
      uomValue: m.uomValue ?? null,
      uomTitle: m.uomTitle ?? null,
      onSaleDate: m.onSaleDate ?? null,
      offSaleDate: m.noEndDate ? null : (m.offSaleDate ?? null),
      noEndDate: !!m.noEndDate,
    })),

    isPdpRequested: !!base.isPdpRequested,
    pdpWorkRequest: base.isPdpRequested ? (base.pdpWorkRequest ?? null) : null,

    includeTranslations: !!base.includeTranslations,
    cultures: base.includeTranslations ? (base.cultures ?? []) : [],

    recommendations: recs,
    accessories: accs,
  };
});


    if (fromProductId && submissionId) {
      // Create a revision (single SKU patch)
      const patch = payloadProducts[0]; // assuming single SKU edit
      const res = await fetch(
        `/api/submissions/${submissionId}/products/${fromProductId}/revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) throw new Error(await res.text());
    } else {
      // Create a new submission with one/more products
      const submissionPayload = {
        requestId,
        note,
        requestedCultures: [], // if still supported
        products: payloadProducts,
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });
      if (!res.ok) throw new Error(await res.text());
    }

    setStatus("done");
    router.push(`/request/${requestId}`);
  } catch (e: any) {
    setStatus("error");
    setErr(e.message || "Failed to save");
  }
}




  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen">
  <div className="mx-auto max-w-8xl px-2">
   <div className="flex flex-col xl:flex-row xl:items-start xl:gap-6">


    
      {/* LEFT: form */}
      <div className="flex-1 min-w-2xs space-y-7">
        <h1 className="text-2xl font-semibold">New Product Submission</h1>

       

    
        {/* Product blocks */}
        {products.map((prod: ProductFormUI, i) => (
          <Card
            key={i}
            title={`SKU #${i + 1}`}
            subtitle="Enter product information"
          >
            
            <div className="space-y-4">
              {/* Header row (remove product) */}
              <div className="flex items-center justify-between">
               
                <button
                  type="button"
                  className="text-sm text-red-600 underline"
                  onClick={() =>
                    setProducts((p) => p.filter((_, idx) => idx !== i))
                  }
                >
                  Remove
                </button>
              </div>

              <div className="shadow-sm rounded-xl p-3 bg-gray-50">
  <div className="mb-2 text-sm font-medium">Requested Cultures</div>
  <CulturePicker
    value={prod.requestedCultures}
    onChange={(next) => {
      const cp = [...products];
      cp[i].requestedCultures = next;
      setProducts(cp);
    }}
  />
</div>

              {/* Core details */}
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="SKU Number">
  <Input
    type="number"
    inputMode="numeric"
    pattern="[0-9]*"
    className="font-mono"
    value={prod.sku}
    onChange={(e) => updateProduct(i, { sku: e.target.value.replace(/[^0-9]/g, "") })}
    required
  />
</Field>
<Field label="Product Name">
  <Input
    value={prod.productName}
    onChange={(e) => updateProduct(i, { productName: e.target.value })}
    required
  />
</Field>

              </div>

             <Field label="Stamp">
  <select
    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1"
    value={prod.stamp ?? ""}   // keep "" for “none”
    onChange={(e) => updateProduct(i, { stamp: e.target.value || null })}
  >
    {/* optional empty choice */}
    <option value="">—</option>
    {STAMP_OPTIONS.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
</Field>

 <Field label="Off-Sale Message">
  <select
    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1"
    value={prod.offSaleMessage ?? ""}  // keep "" for “none”
    onChange={(e) => updateProduct(i, { offSaleMessage: e.target.value || null })}
  >
    <option value="">—</option>
    {OFFSALE_OPTIONS.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
</Field>


              {/* Descriptions */}
              <Field label="Short Description">
  <Input
    value={prod.shortDescription ?? ""}
    onChange={(e) => updateProduct(i, { shortDescription: e.target.value })}
  />
</Field>

<Field label="Long Description">
  <RichTextEditorQuill
    value={prod.longDescription ?? ""}
    onChange={(html) => updateProduct(i, { longDescription: html })}
  />
</Field>



              {/* If PDP requested */}
<div className="mt-4 space-y-2">
  <label className="inline-flex items-center gap-2">
    <input
      type="checkbox"
      className="h-4 w-4"
      checked={prod.isPdpRequested ?? false}
      onChange={(e) => {
        const cp = [...products];
        cp[i].isPdpRequested = e.target.checked;
        // reset work request number if unchecked
        if (!e.target.checked) cp[i].pdpWorkRequest = "";
        setProducts(cp);
      }}
    />
    <span className="text-sm">Is a product detail page requested for this SKU?</span>
  </label>

  {prod.isPdpRequested && (
    <label className="block">
      <span className="text-sm">PDP Work Request Number</span>
      <input
        type="text"
        className="mt-1 w-full rounded border p-2"
        value={prod.pdpWorkRequest ?? ""}
        onChange={(e) => {
          const cp = [...products];
          cp[i].pdpWorkRequest = e.target.value;
          setProducts(cp);
        }}
      />
    </label>
  )}
</div>


{/* Dates (per market) */}
<section className="space-y-3">
  <h3 className="text-base font-semibold">Dates</h3>
  <p className="text-xs text-gray-600">Set the on/off sale window per market.</p>

  <div className="grid gap-3 md:grid-cols-2">
    {marketsToRender(prod).map((mkt) => {
      const mv = getMarket(prod, mkt);
      return (
        <div key={mkt} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{mkt}</span>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!mv.noEndDate}
                onChange={(e) => updateMarket(i, mkt, { noEndDate: e.target.checked, offSaleDate: e.target.checked ? null : (mv.offSaleDate ?? null) })}
              />
              <span>No end date</span>
            </label>
          </div>

          <Field label={`On Sale (${mkt})`}>
            <Input
              type="date"
              value={typeof mv.onSaleDate === "string" ? mv.onSaleDate.slice(0,10) : ""}
              onChange={(e) => updateMarket(i, mkt, { onSaleDate: e.target.value || null })}
            />
          </Field>

          <Field label={`Off Sale (${mkt})`}>
            <Input
              type="date"
              disabled={!!mv.noEndDate}
              value={mv.noEndDate ? "" : (typeof mv.offSaleDate === "string" ? mv.offSaleDate.slice(0,10) : "")}
              onChange={(e) => updateMarket(i, mkt, { offSaleDate: e.target.value || null })}
            />
          </Field>
        </div>
      );
    })}
  </div>
</section>


{/* Unit of Measure (per market) */}
<section className="space-y-3 mt-4">
  <h3 className="text-base font-semibold">Unit of Measure</h3>
  <p className="text-xs text-gray-600">
    Product size information (e.g., <em>2 products</em>, <em>8 fl oz</em>, <em>237 ml</em>).
  </p>

  <div className="grid gap-3 md:grid-cols-2">
    {marketsToRender(prod).map((mkt) => {
      const mv = getMarket(prod, mkt);
      return (
        <div key={mkt} className="space-y-3 rounded-lg border border-gray-200 p-3">
          <div className="text-sm font-medium">{mkt}</div>

          <Field label={`Value (${mkt})`}>
            <Input
              value={mv.uomValue ?? ""}
              onChange={(e) => updateMarket(i, mkt, { uomValue: e.target.value || null })}
              placeholder={mkt === "US" ? "8 fl oz" : "237 ml"}
            />
          </Field>

          <Field label={`Title (${mkt})`}>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1"
              value={mv.uomTitle ?? ""}
              onChange={(e) => updateMarket(i, mkt, { uomTitle: e.target.value || null })}
            >
              <option value="">—</option>
              {UNIT_OF_MEASURE_TITLE.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>
      );
    })}
  </div>
</section>


{/* Savings Amount (per market) */}
<section className="space-y-4 mt-6">
  <h3 className="text-base font-semibold">Savings Amount</h3>
  <p className="text-xs text-gray-600">
    Shown on the savings callout; enter a currency amount (e.g., 5.00), not a percentage.
  </p>

  <div className="grid gap-3 md:grid-cols-2">
    {marketsToRender(prod).map((mkt) => {
      const mv = getMarket(prod, mkt);
      const disabled = !!mv.noSavings;
      const { sign, code } = currencyForMarket(mkt);

      return (
        <div key={mkt} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {mkt}
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700" title={code}>
                {sign} · {code}
              </span>
            </span>

            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!mv.noSavings}
                onChange={(e) =>
                  updateMarket(i, mkt, {
                    noSavings: e.target.checked,
                    savings: e.target.checked ? "" : (mv.savings ?? ""),
                    // also keep currency consistent when toggling back on
                    currency: code,
                  })
                }
              />
              <span>No savings</span>
            </label>
          </div>

          <CurrencyInput
            id={`savings-${mkt}-${i}`}
            value={disabled ? "" : (mv.savings ?? "")}
            placeholder={`${sign} 5.00`}
            disabled={disabled}
            // If your CurrencyInput supports a prefix, pass it:
            prefix={sign}
            onChange={(v) =>
              updateMarket(i, mkt, {
                savings: v,
                currency: code, // store the currency code with the value
              })
            }
          />

          <p className="text-[11px] text-gray-500">
            Use up to 2 decimals. Leave blank if not applicable.
          </p>
        </div>
      );
    })}
  </div>
</section>



   {/* Recommended Products */}
<section className="space-y-4 mt-6">
  <div>
    <h3 className="text-base font-semibold">Recommended Products</h3>
    <p className="text-xs text-gray-600">
      Add SKUs to recommend with this product. Type a SKU and press Enter, or paste a list.
    </p>
  </div>

  <div className="rounded-lg border border-gray-200 p-3">
    <SkuChips
      value={prod.recommendations ?? []}
      onChange={(next) => {
        updateProduct(i, {
          recommendations: next,
          // keep CSV in sync if anything else reads it
          recommendationsCsv: next.map(r => r.sku).filter(Boolean).join(", "),
        });
      }}
      // fetchSuggestions={async (q) => ... } // optional autosuggest
    />
    <p className="mt-2 text-[11px] text-gray-500">
      Tip: use <em>Bulk add</em> to paste comma, space, or line separated SKUs. Duplicates are ignored.
    </p>
  </div>
</section>

{/* Accessories */}
<section className="space-y-4 mt-6">
  <div>
    <h3 className="text-base font-semibold">Accessories</h3>
    <p className="text-xs text-gray-600">
      Attach compatible accessories (SKU + optional label) shown alongside this SKU on PDP/placements.
    </p>
  </div>

  <div className="rounded-lg border border-gray-200 p-3">
    <AccessoryChips
      value={prod.accessories ?? []}
      onChange={(next) => {
        updateProduct(i, {
          accessories: next,
          accessoriesCsv: next
            .map(a => a.accessorySku || "")
            .filter(Boolean)
            .join(", "),
        });
      }}
    />
    <p className="mt-2 text-[11px] text-gray-500">
      Tip: use <em>Bulk add</em> to paste a list. You can add labels later.
    </p>
  </div>
</section>


              {/* Cultures */}
              {/* Translations */}
<section className="space-y-2">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium">Translations</h4>
      <label className="mt-1 inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={!!prod.includeTranslations}
          onChange={(e) => {
            const checked = e.target.checked;
            const cp = [...products];
            cp[i].includeTranslations = checked;
            // If turned off, clear any culture rows so we don’t submit stale data
            if (!checked) cp[i].cultures = [];
            setProducts(cp);
          }}
        />
        <span>Include Translations</span>
      </label>
    </div>

    <button
      type="button"
      className={`text-sm underline ${!prod.includeTranslations ? "opacity-40 cursor-not-allowed" : ""}`}
      onClick={() => {
        if (!prod.includeTranslations) return;
        const cp = [...products];
        cp[i].cultures.push({
          cultureCode: "",
          translatedName: "",
          translatedShort: "",
          translatedLong: "",
        });
        setProducts(cp);
      }}
      disabled={!prod.includeTranslations}
    >
      + Add culture
    </button>
  </div>

  {/* When translations are disabled, show a small hint */}
  {!prod.includeTranslations && (
    <p className="text-sm text-gray-500">
      
    </p>
  )}

  {/* Render culture rows only when enabled */}
  {prod.includeTranslations && (
    <>
      {prod.cultures.length ? (
        prod.cultures.map((c, ci) => (
          <div key={ci} className="grid gap-2 md:grid-cols-2 border rounded p-3">
            <Input
              placeholder="cultureCode (e.g., en-US)"
              value={c.cultureCode ?? ""}
              onChange={(e) => {
                const cp = [...products];
                cp[i].cultures[ci].cultureCode = e.target.value;
                setProducts(cp);
              }}
            />
            <Input
              placeholder="Translated Name"
              value={c.translatedName ?? ""}
              onChange={(e) => {
                const cp = [...products];
                cp[i].cultures[ci].translatedName = e.target.value;
                setProducts(cp);
              }}
            />
            <Input
              placeholder="Translated Short Description"
              value={c.translatedShort ?? ""}
              onChange={(e) => {
                const cp = [...products];
                cp[i].cultures[ci].translatedShort = e.target.value;
                setProducts(cp);
              }}
            />
            <Textarea
              placeholder="Translated Long Description"
              rows={3}
              value={c.translatedLong ?? ""}
              onChange={(e) => {
                const cp = [...products];
                cp[i].cultures[ci].translatedLong = e.target.value;
                setProducts(cp);
              }}
            />
            <div className="md:col-span-2 text-right">
              <button
                type="button"
                className="text-sm text-red-600 underline"
                onClick={() => {
                  const cp = [...products];
                  cp[i].cultures = cp[i].cultures.filter((_, idx) => idx !== ci);
                  setProducts(cp);
                }}
              >
                Remove culture
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No culture rows yet.</p>
      )}
    </>
  )}
</section>
</div>
          </Card>
        ))}

        {/* Sticky submit bar */}
        <div className="sticky bottom-0 left-0 right-0 z-10 shadow-xl ring-blue-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto max-w-5xl p-6 flex items-center justify-end gap-3">
            <Button
              variant="subtle"
              onClick={() =>
                setProducts(prev => [
  ...prev,
  { ...EMPTY_PRODUCT },
                ])
              }
            >
              + Add another SKU
            </Button>
            <Button onClick={submit} disabled={status === "saving" || uploading}>
              {status === "saving" ? "Saving…" : uploading ? "Importing…" : "Submit"}
            </Button>
            {status === "done" && (
              <span className="text-green-600 text-sm">Saved!</span>
            )}
            {status === "error" && (
              <span className="text-red-600 text-sm">{err}</span>
            )}
          </div>
        </div>
            </div>{/* /left */}

{/* RIGHT: live Preview */}

  <PreviewPane product={products[0] ?? null} culture="en-US" />

    </div>
  </div>

</main>
  );
}
