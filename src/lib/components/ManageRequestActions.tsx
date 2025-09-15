"use client";

import Link from "next/link";
import { Plus, Percent, Ticket } from "lucide-react";
import { useState } from "react";
import UploadPromoModal from "@/lib/components/UploadPromoModal";

type Props = {
  requestId: number;
  showAddSku?: boolean;
};

export default function ManageRequestActions({ requestId, showAddSku = true }: Props) {
  const [openKind, setOpenKind] = useState<null | "INCREMENTAL_PROMO">(null);

  return (
    <>
      {/* Toolbar */}
      <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-gray-200 backdrop-blur">
        {showAddSku && (
          <Link
            href={{ pathname: "/new", query: { requestId } }}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-3.5 py-2 text-sm font-medium text-white shadow hover:bg-black/90 active:translate-y-px"
            aria-label="Add SKU"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/15">
              <Plus className="h-4 w-4" />
            </span>
            Add SKU
          </Link>
        )}

        <Link
          href={{ pathname: "/coupons/new", query: { requestId } }}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px"
          aria-label="Add Coupon"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100">
            <Ticket className="h-4 w-4" />
          </span>
          Add Coupon
        </Link>

        <button
          onClick={() => setOpenKind("INCREMENTAL_PROMO")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px"
          aria-label="Upload Incremental Promo"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100">
            <Percent className="h-4 w-4" />
          </span>
          Upload Incremental Promo
        </button>
      </div>

      {/* Modal */}
      <UploadPromoModal
        requestId={requestId}
        kind="INCREMENTAL_PROMO"
        open={openKind !== null}
        onClose={() => setOpenKind(null)}
      />
    </>
  );
}
