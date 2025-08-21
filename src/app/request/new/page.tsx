"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60"
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60"
    />
  );
}

export default function NewRequestPage() {
  const router = useRouter();

  const [requesterName, setRequesterName]   = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [dueDate, setDueDate]               = useState<string>("");
  const [adoId, setAdoId]                   = useState("");
  const [userStory, setUserStory]           = useState("");
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);

  

  async function submitRequest() {
    setSaving(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        

        body: JSON.stringify({
          requesterName,
          requesterEmail,
          dueDate, // ISO string from <input type="date"> is yyyy-mm-dd
          adoId,
          userStory,
          notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/request/${id}`); // 👉 go manage this request
    } catch (e: any) {
      alert(e.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create New Request</h1>
        <p className="text-sm text-gray-600">Save the request, then add SKUs.</p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Requester Name">
            <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Requester Email">
            <Input type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} placeholder="jane@company.com" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Due Date (optional)">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="ADO Work Request # (optional)">
            <Input value={adoId} onChange={(e) => setAdoId(e.target.value)} placeholder="WR-12345" />
          </Field>
          <Field label="User Story # (optional)">
            <Input value={userStory} onChange={(e) => setUserStory(e.target.value)} placeholder="US-67890" />
          </Field>
        </div>

        <Field label="Project Notes (optional)">
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context for the content team…" />
        </Field>
      </section>

      <div className="flex justify-end">
        <button
          onClick={submitRequest}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-[rgb(48,134,45)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(40,115,38)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Submit Request"}
        </button>
      </div>
    </div>
  );
}
