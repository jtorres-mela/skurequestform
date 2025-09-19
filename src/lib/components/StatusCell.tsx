"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  note?: string | null; // accepted but not shown/used for now
};

export default function StatusCell({ submissionId, productId, value }: Props) {
  const [status, setStatus] = React.useState<SubmissionStatus>(value);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const [coords, setCoords] = React.useState<{ top: number; left: number; maxH: number }>({
    top: 0,
    left: 0,
    maxH: 320,
  });

  const PANEL_W = 256; // ~w-64
  const GAP = 8;

  const recalcPosition = React.useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = b.left;
    if (left + PANEL_W > vw - 8) left = Math.max(8, vw - 8 - PANEL_W);
    const top = Math.min(vh - 8, b.bottom + GAP);
    const maxH = Math.max(200, vh - top - 12);

    setCoords({ top, left, maxH });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    recalcPosition();
    const onScroll = () => recalcPosition();
    const onResize = () => recalcPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, recalcPosition]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function save(next: SubmissionStatus) {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/products/${productId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // No note sent for now
          body: JSON.stringify({ status: next }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setStatus(next);
      setOpen(false);
    } catch {
      alert("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Pill button */}
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLE[status]} hover:opacity-90`}
      >
        {LABEL[status]}
      </button>

      {/* Popover (portal) */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] pointer-events-auto">
            <div
              ref={panelRef}
              role="menu"
              className="fixed w-64 rounded-lg border border-gray-200 bg-white shadow-lg
                         flex flex-col overflow-hidden"
              style={{ top: `${coords.top}px`, left: `${coords.left}px`, maxHeight: `${coords.maxH}px` }}
            >
              <p className="px-3 pt-2 pb-1 text-xs text-gray-500">Set status</p>

              {/* Only the list scrolls */}
              <ul className="flex-1 overflow-auto px-1 pb-2">
                {(Object.keys(LABEL) as SubmissionStatus[]).map((s) => (
                  <li key={s}>
                    <button
                      role="menuitem"
                      disabled={saving}
                      className={`w-full text-left px-2 py-2 rounded hover:bg-gray-50 text-sm ${
                        s === status ? "font-semibold" : ""
                      }`}
                      onClick={() => save(s)}
                    >
                      {LABEL[s]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
