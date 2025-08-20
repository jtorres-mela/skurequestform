"use client";

import * as React from "react";
import PreviewPane from "@/lib/components/PreviewPane";


/* =============================================================================
   Types
============================================================================= */
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

  
  onSaleDate?: string | null;
  offSaleDate?: string | null;
  noEndDate?: boolean;
  uomTitleUS?: string;
  uomValueUS?: string;
  uomTitleCA?: string;
  uomValueCA?: string;
  savingsUS?: string;
  savingsCA?: string;
  noSavings?: boolean;
  recommendations?: RecommendationRow[];

  requestedCultures?: string[];

  ifPdp?: boolean;
  pdpWorkRequest?: string;

  accessories: AccessoryRow[];
  includeTranslations?: boolean;
  cultures: CultureRow[];
};

/* =============================================================================
   Constants (dropdown choices, helpers)
   - Keep these outside the component so they're not recreated every render.
============================================================================= */
const STAMP_OPTIONS = [
  "", // blank allowed
  "New!",
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

// Parse a simple comma-separated list into trimmed non-empty strings
const parseCsv = (s: string) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);


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


/* =============================================================================
   Primitive UI helpers (Button, Card, Field, Inputs)
============================================================================= */

/** The checkboxes the user sees */
const CULTURE_PRESETS: { key: string; label: string }[] = [
  { key: "US", label: "US" },
  { key: "CA", label: "CA" },
  { key: "MX", label: "MX" },

];

const EU_KEYS = ["GB", "IE", "NL", "DE", "PL", "LT"];

function CulturePicker({
  value,
  onChange,
}: {
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const setHas = (k: string, checked: boolean) => {
    const cur = new Set(value ?? []);
    if (checked) cur.add(k);
    else cur.delete(k);
    onChange([...cur]);
  };

  const toggleGroup = (keys: string[], on = true) => {
    const cur = new Set(value ?? []);
    keys.forEach(k => (on ? cur.add(k) : cur.delete(k)));
    onChange([...cur]);
  };

  const allEUSelected = EU_KEYS.every(k => (value ?? []).includes(k));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
       
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {CULTURE_PRESETS.map(({ key, label }) => {
          const checked = (value ?? []).includes(key);
          return (
            <label key={key} className="inline-flex items-center gap-2 rounded-lg px-3 py-2">
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
   Page component
============================================================================= */
export default function Home() {
  // ---------------------------------------------------------------------------
  // Top-level form state
  // ---------------------------------------------------------------------------
  const [requester, setRequester] = React.useState("");
  const [note, setNote] = React.useState("");
  const [products, setProducts] = React.useState<ProductForm[]>([
    { sku: "", productName: "", accessories: [], cultures: [], includeTranslations: false  },
  ]);

  const [status, setStatus] = React.useState<"idle" | "saving" | "done" | "error">(
    "idle"
  );
  const [err, setErr] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);



  // ---------------------------------------------------------------------------
  // Submit to /api/submissions
  // ---------------------------------------------------------------------------
  async function submit() {
    setStatus("saving");
    setErr(null);
    try {
      const payload = {
        requester,
        note,
        requestedCultures: [], // still supported if you use presets
        products,
      };
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErr(e.message);
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
        {products.map((prod, i) => (
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
                <Field label="SKU">
                  <Input
                    className="font-mono"
                    value={prod.sku}
                    onChange={(e) => {
                      setProducts(prev =>
  prev.map((p, idx) => idx === i ? { ...p, sku: e.target.value } : p)
);
                    }}
                    required
                  />
                </Field>
                <Field label="Product Name">
                  <Input
                    value={prod.productName}
                    onChange={(e) => {
                      setProducts(prev =>
  prev.map((p, idx) => idx === i ? { ...p, productName: e.target.value } : p)
);
                    }}
                    required
                  />
                </Field>
              </div>

              {/* Stamp + Off-Sale Message (dropdowns) */}
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Stamp">
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1"
                    value={prod.stamp ?? ""}
                    onChange={(e) => {
                      setProducts(prev =>
  prev.map((p, idx) => idx === i ? { ...p, sku: e.target.value } : p)
);
                    }}
                  >
                    {STAMP_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o || "—"}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Off-Sale Message">
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1"
                    value={prod.offSaleMessage ?? ""}
                    onChange={(e) => {
                      setProducts(prev =>
  prev.map((p, idx) => idx === i ? { ...p, productName: e.target.value } : p)
);
                    }}
                  >
                    {OFFSALE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o || "—"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Descriptions */}
              <Field label="Short Description">
                <Input
                  value={prod.shortDescription ?? ""}
                  onChange={(e) => {
                    const cp = [...products];
                    cp[i].shortDescription = e.target.value;
                    setProducts(cp);
                  }}
                />
              </Field>

              <Field label="Long Description">
                <Textarea
                  rows={4}
                  value={prod.longDescription ?? ""}
                  onChange={(e) => {
                    const cp = [...products];
                    cp[i].longDescription = e.target.value;
                    setProducts(prev =>
  prev.map((p, idx) => idx === i ? { ...p, longDescription: e.target.value } : p)
);
                  }}
                />
              </Field>

              {/* If PDP requested */}
<div className="mt-4 space-y-2">
  <label className="inline-flex items-center gap-2">
    <input
      type="checkbox"
      className="h-4 w-4"
      checked={prod.ifPdp ?? false}
      onChange={(e) => {
        const cp = [...products];
        cp[i].ifPdp = e.target.checked;
        // reset work request number if unchecked
        if (!e.target.checked) cp[i].pdpWorkRequest = "";
        setProducts(cp);
      }}
    />
    <span className="text-sm">Is a product detail page requested for this SKU?</span>
  </label>

  {prod.ifPdp && (
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


             {/* Dates */}
<div className="space-y-3">
  <Field label="On Sale Date">
    <Input
      type="date"
      value={
        typeof prod.onSaleDate === "string"
          ? prod.onSaleDate.slice(0, 10)
          : ""
      }
      onChange={(e) => {
        const cp = [...products];
        cp[i].onSaleDate = e.target.value
          ? new Date(e.target.value).toISOString()
          : null;
        setProducts(cp);
      }}
    />
  </Field>

  <Field label="Off Sale Date">
    <Input
      type="date"
      disabled={!!prod.noEndDate}
      value={
        prod.noEndDate
          ? "" // show empty when disabled
          : typeof prod.offSaleDate === "string"
            ? prod.offSaleDate.slice(0, 10)
            : ""
      }
      onChange={(e) => {
        const cp = [...products];
        cp[i].offSaleDate = e.target.value
          ? new Date(e.target.value).toISOString()
          : null;
        setProducts(cp);
      }}
    />
    {/* No end date toggle */}
    <div className="mt-2">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={!!prod.noEndDate}
          onChange={(e) => {
            const cp = [...products];
            cp[i].noEndDate = e.target.checked;
            if (e.target.checked) {
              // clear the date so nothing is sent/stored
              cp[i].offSaleDate = null;
            }
            setProducts(cp);
          }}
        />
        <span>No End Date Needed (Open Stock SKU)</span>
      </label>
    </div>
  </Field>
</div>


             {/* Unit of Measure */}
<section className="space-y-3 mt-4">
  <h3 className="text-base font-semibold">Unit of Measure</h3>
  <p className="text-xs text-gray-600">
    Product size information (e.g., <em>2 products</em>, <em>8 fl oz</em>, <em>237 ml</em>, etc.)
  </p>

  {/* US */}
  <div className="grid gap-3 md:grid-cols-2">
    <Field label="Value (US)">
      <Input
        value={prod.uomValueUS ?? ""}
        onChange={(e) => {
          const cp = [...products]; cp[i].uomValueUS = e.target.value; setProducts(cp);
        }}
        placeholder="e.g., 2 products, 8 fl oz"
      />
    </Field>
    <Field label="Title (US)">
      <Input
        value={prod.uomTitleUS ?? ""}
        onChange={(e) => {
          const cp = [...products]; cp[i].uomTitleUS = e.target.value; setProducts(cp);
        }}
        placeholder="e.g., Pack Size, Volume"
      />
    </Field>
  </div>

  {/* CA */}
  <div className="grid gap-3 md:grid-cols-2">
    <Field label="Value (CA)">
      <Input
        value={prod.uomValueCA ?? ""}
        onChange={(e) => {
          const cp = [...products]; cp[i].uomValueCA = e.target.value; setProducts(cp);
        }}
        placeholder="e.g., 237 ml"
      />
    </Field>
    <Field label="Title (CA)">
      <Input
        value={prod.uomTitleCA ?? ""}
        onChange={(e) => {
          const cp = [...products]; cp[i].uomTitleCA = e.target.value; setProducts(cp);
        }}
        placeholder="e.g., Volume"
      />
    </Field>
  </div>
</section>


      {/* Savings Amount */}
<section className="space-y-3 mt-4">
  {/* Heading + description */}
  <div>
    <h3 className="text-base font-semibold">Savings Amount</h3>
    <p className="text-xs text-gray-600">
      The amount to appear on the savings callout. Enter a dollar amount (e.g., <em>5.00</em>), not a percentage.
    </p>
  </div>

  {/* No Savings toggle (now on its own line below heading) */}
  <label className="inline-flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      className="h-4 w-4"
      checked={!!prod.noSavings}
      onChange={(e) => {
        const checked = e.target.checked;
        const cp = [...products];
        cp[i].noSavings = checked;
        if (checked) {
          cp[i].savingsUS = "";
          cp[i].savingsCA = "";
        }
        setProducts(cp);
      }}
    />
    <span>No Savings Amount Needed</span>
  </label>

  {/* Inputs */}
  <div className="grid gap-3 md:grid-cols-2">
    <Field label="Savings (US)">
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="e.g., 5.00"
        disabled={!!prod.noSavings}
        value={prod.noSavings ? "" : (prod.savingsUS ?? "")}
        onChange={(e) => {
          const val = e.target.value;
          if (!val || /^\d+(\.\d{0,2})?$/.test(val)) {
            const cp = [...products];
            cp[i].savingsUS = val;
            setProducts(cp);
          }
        }}
      />
    </Field>

    <Field label="Savings (CA)">
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="e.g., 3.50"
        disabled={!!prod.noSavings}
        value={prod.noSavings ? "" : (prod.savingsCA ?? "")}
        onChange={(e) => {
          const val = e.target.value;
          if (!val || /^\d+(\.\d{0,2})?$/.test(val)) {
            const cp = [...products];
            cp[i].savingsCA = val;
            setProducts(cp);
          }
        }}
      />
    </Field>
  </div>
</section>



              {/* Recommended Products — CSV of SKUs */}
              <Field label="Recommended Products (CSV of SKUs)">
                <Input
                  className="font-mono"
                  placeholder="34038, 7904, 2654, ..."
                  value={(prod.recommendations ?? [])
                    .map((r) => r.sku)
                    .join(", ")}
                  onChange={(e) => {
                    const list = parseCsv(e.target.value).map((sku) => ({ sku }));
                    const cp = [...products];
                    cp[i].recommendations = list;
                    setProducts(cp);
                  }}
                />
              </Field>

              {/* Accessories — CSV of SKUs */}
              <Field label="Accessories (CSV of SKUs)">
                <Input
                  className="font-mono"
                  placeholder="12345, 67890, ..."
                  value={(prod.accessories ?? [])
                    .map((a) => a.accessorySku || "")
                    .filter(Boolean)
                    .join(", ")}
                  onChange={(e) => {
                    const list = parseCsv(e.target.value).map((accessorySku) => ({
                      accessorySku,
                    }));
                    const cp = [...products];
                    cp[i].accessories = list;
                    setProducts(cp);
                  }}
                />
              </Field>

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
                setProducts((p) => [
                  ...p,
                  { sku: "", productName: "", accessories: [], cultures: [] },
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
