"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Initial = {
  requesterName: string | null;
  requesterEmail: string | null;
  dueDate: string | null; // expect "YYYY-MM-DD" or null
  adoId: string | null;
  userStory: string | null;
  notes: string | null;
};

function toYMD(d?: string | Date | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditRequestDetails({
  requestId,
  initial,
}: {
  requestId: number;
  initial: Initial;
}) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const titleId = React.useId();

  // lock body scroll while modal is open
  React.useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const [form, setForm] = React.useState({
    requesterName: initial.requesterName ?? "",
    requesterEmail: initial.requesterEmail ?? "",
    dueDate: toYMD(initial.dueDate) ?? "",
    adoId: initial.adoId ?? "",
    userStory: initial.userStory ?? "",
    notes: initial.notes ?? "",
  });

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  // optional: guard against double-click submits
  if (saving) return;

  setSaving(true);
  setError(null);

  try {
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // If you only want to send changed fields, we can diff here later.
      body: JSON.stringify({
        requesterName: form.requesterName || null,
        requesterEmail: form.requesterEmail || null,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00.000Z`).toISOString() : null,
        adoId: form.adoId || null,
        userStory: form.userStory || null,
        notes: form.notes || null,
      }),
    });

    if (!res.ok) {
      // 👇 clone before multiple reads to avoid "body stream already read"
      const fallback = res.clone();

      let message = `Save failed (${res.status})`;
      try {
        const j = await res.json();
        // Prefer server-provided error message if present
        if (j && typeof j === "object" && "error" in j && j.error) {
          message = String(j.error);
        }
      } catch {
        try {
          const t = await fallback.text();
          if (t?.startsWith("<!DOCTYPE html")) {
            message += " — API route not found (HTML 404 returned).";
          } else if (t) {
            message += ` — ${t.slice(0, 200)}`;
          }
        } catch {
          // ignore secondary read failure
        }
      }
      throw new Error(message);
    }

    // ✅ No need to read body on success; just refresh the data shown
    setOpen(false);
    router.refresh();
  } catch (err: any) {
    setError(err?.message ?? "Unknown error");
  } finally {
    setSaving(false);
  }
}

  // Reset form when modal opens (keeps inline details fresh if user reopens)
  React.useEffect(() => {
    if (open) {
      setForm({
        requesterName: initial.requesterName ?? "",
        requesterEmail: initial.requesterEmail ?? "",
        dueDate: toYMD(initial.dueDate) ?? "",
        adoId: initial.adoId ?? "",
        userStory: initial.userStory ?? "",
        notes: initial.notes ?? "",
      });
      setError(null);
    }
  }, [open, initial]);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Edit
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          aria-labelledby={titleId}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 id={titleId} className="text-lg font-semibold">
                  Edit Request Details
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[75vh] overflow-auto p-5">
                {error && (
                  <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Requester Name</span>
                      <input
                        name="requesterName"
                        value={form.requesterName}
                        onChange={onChange}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Requester Email</span>
                      <input
                        name="requesterEmail"
                        value={form.requesterEmail}
                        onChange={onChange}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Due Date</span>
                      <input
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={onChange}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium">ADO ID</span>
                      <input
                        name="adoId"
                        value={form.adoId}
                        onChange={onChange}
                        className="rounded-md border px-3 py-2"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">User Story</span>
                    <textarea
                      name="userStory"
                      value={form.userStory}
                      onChange={onChange}
                      rows={3}
                      className="rounded-md border px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Notes</span>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={onChange}
                      rows={4}
                      className="rounded-md border px-3 py-2"
                    />
                  </label>

                  {/* Footer actions */}
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
