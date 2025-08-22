"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Search({
  placeholder = "Search by requester, email, notes, SKU, or product name…",
  minLength = 2, // don't auto-search until at least 2 chars
  debounceMs = 600,
}: {
  placeholder?: string;
  minLength?: number;
  debounceMs?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // current ?q from URL
  const qParam = params.get("q") ?? "";
  const [value, setValue] = React.useState(qParam);

  // keep input synced with back/forward nav
  React.useEffect(() => {
    setValue(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  // Build URL preserving other params
  const buildUrl = React.useCallback(
    (q: string) => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      const trimmed = q.trim();
      if (trimmed) sp.set("q", trimmed);
      else sp.delete("q");
      const search = sp.toString();
      return search ? `/?${search}` : "/";
    },
    [params]
  );

  // Avoid firing on first render
  const didMountRef = React.useRef(false);

  // Debounced navigation
  React.useEffect(() => {
    // skip first effect run
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const trimmed = value.trim();

    // only auto-search if empty (to clear) or long enough
    const shouldAuto =
      trimmed.length === 0 || trimmed.length >= minLength;

    if (!shouldAuto) return;

    // don't navigate if nothing changed
    if (trimmed === qParam.trim()) return;

    const id = setTimeout(() => {
      router.replace(buildUrl(value));
    }, debounceMs);

    return () => clearTimeout(id);
  }, [value, qParam, buildUrl, router, debounceMs, minLength]);

  // Enter submits immediately
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(buildUrl(value));
    }
  };

  const clear = () => {
    setValue("");
    router.push(buildUrl(""));
  };

  return (
    <div className="rounded-xl shadow-md bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 19-4-4m1-6a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>

        <input
          aria-label="Search requests"
          className="w-full rounded-lg shadow-sm px-3 py-2 focus-visible:ring-2 focus-visible:ring-black/60 outline-none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />

        {value ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        ) : null}
      </div>
     
    </div>
  );
}
