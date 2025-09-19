"use client";

import Link from "next/link";
import {  FileUp, FileDown, ClipboardClock, ClipboardPlus } from "lucide-react";
import { ReactNode, useState } from "react";
import SubmitToSmartlingPopup from "./SubmitToSmartlingPopup";

type Props = {
  sku: number;
  requestId?: number;
  submissionId?: number;
  fromProductId?: number;
};

type SKUActionProps = {
  children: React.ReactNode;
  title?: string;
};

export default function ManageSKUActions({
  sku,
  requestId,
  submissionId,
  fromProductId,
}: Props) {
  const [showSmartlingPopup, setShowSmartlingPopup] = useState(false);
  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-gray-200 backdrop-blur">
        <SKUActionSection title="History">
          <Link
            href={{
              pathname: `/request/${requestId}/history`,
              query: { sku, submissionId },
            }}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px"
            aria-label="View Change History"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/15">
              <ClipboardClock className="h-4 w-4" />
            </span>
            View Change History
          </Link>

          <Link
            href={{
              pathname: "/new",
              query: { requestId, submissionId, fromProductId },
            }}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px"
            aria-label="Propose new version"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100">
              <ClipboardPlus className="h-4 w-4" />
            </span>
            Propose new version
          </Link>
        </SKUActionSection>
        <SKUActionSection title="Translations">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px hover:cursor-pointer"
            aria-label="Upload strings to Smartling"
            onClick={() => setShowSmartlingPopup(true)}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100">
              <FileUp className="h-4 w-4" />
            </span>
            Upload strings to Smartling
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 active:translate-y-px hover:cursor-pointer"
            aria-label="Retrive Smartling translations"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100">
              <FileDown className="h-4 w-4" />
            </span>
            Retrieve Smartling translations
          </button>
        </SKUActionSection>
      </div>
      {showSmartlingPopup && (
        /// Add the Smartling popup here:
        <SubmitToSmartlingPopup
          sku={sku}
          skuId={fromProductId}
          submissionId={submissionId}
          onClose={() => setShowSmartlingPopup(false)}
        />
      )}
    </>
  );
}

function SKUActionSection({ children, title }: SKUActionProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-md font-bold">{title}</h1>
      {children}
    </div>
  );
}
