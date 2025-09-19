"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, Percent, Ticket, ChevronDown } from "lucide-react";
import UploadPromoModal from "@/lib/components/UploadPromoModal";

type Props = {
  requestId: number;
  showAddSku?: boolean;
};

export default function ManageRequestActions({ requestId, showAddSku = true }: Props) {
  const [openKind, setOpenKind] = useState<null | "INCREMENTAL_PROMO">(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const comingSoon = [
    "Grow Request",
    "Riverbend Ranch SKU Request",
    "Logo Gear SKU Request",
    "Bundle SKU Request",
    "VIP Special Request",
    "EU Incremental Request",
  ];

  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-gray-200 backdrop-blur">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3.5 py-2 text-sm font-medium text-white shadow hover:bg-black/90 active:translate-y-px"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/15">
              <Plus className="h-4 w-4" />
            </span>
            Add…
            <ChevronDown className="ml-1 h-4 w-4 opacity-75" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              <div className="px-3 py-2 text-xs font-medium text-gray-500">Create</div>

              {showAddSku && (
                <Link
                  role="menuitem"
                  prefetch={false}
                  href={{ pathname: "/new", query: { requestId } }}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100">
                    <Plus className="h-4 w-4" />
                  </span>
                  Add SKU
                </Link>
              )}

              <Link
                role="menuitem"
                prefetch={false}
                href={{ pathname: "/coupons/new", query: { requestId } }}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100">
                  <Ticket className="h-4 w-4" />
                </span>
                Add Coupon
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setOpenKind("INCREMENTAL_PROMO");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100">
                  <Percent className="h-4 w-4" />
                </span>
                Upload Incremental Promo
              </button>

              <div className="px-3 py-2 text-xs font-medium text-gray-500">Coming soon</div>
              {comingSoon.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="menuitem"
                  disabled
                  aria-disabled="true"
                  title="Not available yet"
                  className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm text-gray-400"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-50">•</span>
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadPromoModal
        requestId={requestId}
        kind="INCREMENTAL_PROMO"
        open={openKind !== null}
        onClose={() => setOpenKind(null)}
      />
    </>
  );
}
