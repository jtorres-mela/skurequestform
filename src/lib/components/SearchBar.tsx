"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Search({ placeholder = "Search…" }: { placeholder?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const q = value.trim();
      const url = q ? `/?q=${encodeURIComponent(q)}` : "/";
      router.push(url);
    }, 300);
    return () => clearTimeout(id);
  }, [value, router]);

  return (
    <div className="rounded-xl border bg-white p-3">
      <input
        className="w-full rounded-lg border px-3 py-2 focus-visible:ring-2 focus-visible:ring-black/60 outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
