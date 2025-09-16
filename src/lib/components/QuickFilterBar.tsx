"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  emails: string[];
  selectedEmail?: string;
  selectedSprint?: string; // "YYYY-MM"
  /** Optional: pass a data-driven list of months from the server (YYYY-MM).
   *  If provided, we’ll use these as chips instead of the generic window. */
  sprints?: string[];
};

/* ---------- Sprint helpers (UTC-based) ---------- */
function toKeyUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function addMonthsToKey(key: string | undefined, delta: number) {
  const base = key
    ? new Date(`${key}-01T00:00:00.000Z`)
    : new Date(); // now, local time is fine for reading but we create UTC below
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1));
  return toKeyUTC(d);
}
function labelFor(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}
function recentWindow({ past = 5, future = 2 }: { past?: number; future?: number }) {
  const now = new Date();
  const cur = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const keys: string[] = [];
  for (let i = -past; i <= future; i++) {
    const d = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + i, 1));
    keys.push(toKeyUTC(d));
  }
  return keys;
}

export default function QuickFilterBar({
  emails,
  selectedEmail,
  selectedSprint,
  sprints, // optional, server-provided
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentKey = useMemo(() => toKeyUTC(new Date()), []);
  const chips = useMemo(
    () => (sprints && sprints.length ? sprints : recentWindow({ past: 5, future: 2 })),
    [sprints]
  );

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value && value.length) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // if pagination exists, reset it
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(sp.toString());
    params.delete("email");
    params.delete("sprint");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const prevKey = addMonthsToKey(selectedSprint ?? currentKey, -1);
  const nextKey = addMonthsToKey(selectedSprint ?? currentKey, +1);

  return (
    <div className="rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-gray-200 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        {/* Email filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Email:</label>
          <select
            className="min-w-[16rem] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
            value={selectedEmail ?? ""}
            onChange={(e) => setParam("email", e.target.value || undefined)}
          >
            <option value="">All requesters</option>
            {emails.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Sprint controls */}
        <div className="mx-2 h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sprint:</span>

          {/* Prev */}
          <button
            type="button"
            onClick={() => setParam("sprint", prevKey)}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm hover:bg-gray-50"
            title={`Go to ${labelFor(prevKey)}`}
          >
            ‹
          </button>

          {/* Current */}
          <button
            type="button"
            onClick={() => setParam("sprint", currentKey)}
            className={`rounded-md px-2.5 py-1 text-sm ring-1 ${
              (selectedSprint ?? currentKey) === currentKey
                ? "bg-black text-white ring-black"
                : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
            }`}
            title={`This sprint: ${labelFor(currentKey)}`}
          >
            {labelFor(currentKey)}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={() => setParam("sprint", nextKey)}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm hover:bg-gray-50"
            title={`Go to ${labelFor(nextKey)}`}
          >
            ›
          </button>

          {/* Jump to (native month picker) */}
          <input
            type="month"
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
            value={selectedSprint ?? ""}
            onChange={(e) => setParam("sprint", e.currentTarget.value || undefined)}
          />

          {/* Quick chips */}
          <div className="hidden md:flex flex-wrap items-center gap-1">
            {chips.map((ym) => {
              const active = selectedSprint === ym;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => setParam("sprint", active ? undefined : ym)}
                  className={`rounded-md px-2 py-0.5 text-xs ring-1 ${
                    active
                      ? "bg-black text-white ring-black"
                      : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
                  }`}
                  title={labelFor(ym)}
                >
                  {labelFor(ym)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear */}
        {(selectedEmail || selectedSprint) && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm text-gray-800 hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
