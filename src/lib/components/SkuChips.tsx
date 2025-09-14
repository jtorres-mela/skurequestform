"use client";

import * as React from "react";
import { X, Upload, Eraser } from "lucide-react";

export type RecRow = { sku: string };

function parseSkuList(raw: string): string[] {
  return (raw || "")
    .replace(/\s+/g, " ")
    .split(/[, \n\r\t]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SkuChips({
  value,
  onChange,
  placeholder = "Type a SKU and press Enter",
  fetchSuggestions, // optional async suggestions
}: {
  value: RecRow[];
  onChange: (next: RecRow[]) => void;
  placeholder?: string;
  fetchSuggestions?: (q: string) => Promise<Array<{ sku: string; name?: string }>>;
}) {
  const list = value ?? [];
  const [input, setInput] = React.useState("");
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Array<{ sku: string; name?: string }>>([]);

  const addSku = (raw: string) => {
    const sku = (raw || "").trim();
    if (!sku) return;
    const norm = sku.toUpperCase();
    if (list.some((r) => r.sku.toUpperCase() === norm)) return; // dedupe
    onChange([...list, { sku }]);
  };

  const removeSku = (idx: number) => {
    const next = list.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const clearAll = () => onChange([]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addSku(input);
      setInput("");
      setSuggestions([]);
    } else if (e.key === "Backspace" && !input && list.length) {
      removeSku(list.length - 1);
    }
  };

  // optional autosuggest
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!fetchSuggestions) return setSuggestions([]);
      const q = input.trim();
      if (!q) return setSuggestions([]);
      try {
        const res = await fetchSuggestions(q);
        if (!cancelled) setSuggestions(res.slice(0, 8));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [input, fetchSuggestions]);

  const bulkAdd = () => {
    const skus = parseSkuList(bulkText);
    if (!skus.length) return;
    const existing = new Set(list.map((r) => r.sku.toUpperCase()));
    const toAdd: RecRow[] = [];
    for (const s of skus) {
      const norm = s.toUpperCase();
      if (!existing.has(norm)) {
        toAdd.push({ sku: s });
        existing.add(norm);
      }
    }
    if (toAdd.length) onChange([...list, ...toAdd]);
    setBulkText("");
    setBulkOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
              {suggestions.map((s) => (
                <button
                  key={s.sku}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => {
                    addSku(s.sku);
                    setInput("");
                    setSuggestions([]);
                  }}
                >
                  <span className="font-mono">{s.sku}</span>
                  {s.name && (
                    <span className="truncate text-xs text-gray-500">{s.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => setBulkOpen((v) => !v)}
          title="Paste a list of SKUs"
        >
          <Upload className="h-3.5 w-3.5" /> Bulk add
        </button>

        {list.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
            onClick={clearAll}
            title="Remove all"
          >
            <Eraser className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {bulkOpen && (
        <div className="rounded-lg border border-dashed border-gray-300 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Paste SKUs (comma, space, or line separated)
          </label>
          <textarea
            className="w-full rounded border px-2 py-1 text-xs font-mono"
            rows={3}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="e.g. 34038, 7904, 2654"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              onClick={bulkAdd}
            >
              Add SKUs
            </button>
            <span className="text-[11px] text-gray-500">Duplicates are ignored.</span>
          </div>
        </div>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {list.map((r, idx) => (
          <span
            key={`${r.sku}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
          >
            <span className="font-mono">{r.sku}</span>
            <button
              type="button"
              className="inline-flex items-center rounded px-1 hover:bg-white"
              title="Remove"
              onClick={() => removeSku(idx)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {list.length === 0 && (
          <span className="text-xs text-gray-500">No recommended products yet.</span>
        )}
      </div>
    </div>
  );
}
