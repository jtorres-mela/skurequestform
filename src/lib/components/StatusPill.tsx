"use client";

import * as React from "react";
import { SubmissionStatus } from "@prisma/client";

const LABEL: Record<SubmissionStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  READY: "Ready",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
};

const STYLE: Record<SubmissionStatus, string> = {
  NEW:         "bg-gray-100 text-gray-800 ring-gray-300",
  IN_PROGRESS: "bg-sky-100 text-sky-800 ring-sky-300",
  READY:       "bg-indigo-100 text-indigo-800 ring-indigo-300",
  BLOCKED:     "bg-red-100 text-red-800 ring-red-300",
  COMPLETE:    "bg-green-100 text-green-800 ring-green-300",
};

type Props = {
  submissionId: number;
  productId: number;
  value: SubmissionStatus;
  note?: string | null;
  onChanged?: (next: { status: SubmissionStatus; note?: string | null }) => void;
};

export default function StatusPill({ submissionId, productId, value, note, onChanged }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function update(next: SubmissionStatus, noteStr?: string) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/products/${productId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next, note: noteStr ?? note ?? undefined }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      onChanged?.({ status: next, note: noteStr ?? note ?? null });
      setOpen(false);
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLE[value]} hover:opacity-90`}
        onClick={() => setOpen(v => !v)}
        title={note || undefined}
      >
        {LABEL[value]}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <p className="px-2 pb-1 text-xs text-gray-500">Set status</p>
          <ul className="max-h-56 overflow-auto">
            {(Object.keys(LABEL) as SubmissionStatus[]).map(s => (
              <li key={s}>
                <button
                  disabled={saving}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-gray-50 text-sm ${s === value ? "font-semibold" : ""}`}
                  onClick={() => update(s)}
                >
                  {LABEL[s]}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t pt-2">
            <label className="block text-xs text-gray-500 px-1">Note (optional)</label>
            <textarea
              defaultValue={note ?? ""}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              rows={2}
              placeholder="Why blocked? What's next?"
              onBlur={(e) => {
                // Save note without changing status
                const val = e.currentTarget.value.trim();
                if (val !== (note ?? "")) update(value, val);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
