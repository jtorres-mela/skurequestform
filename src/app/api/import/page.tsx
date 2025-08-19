// app/import/page.tsx
"use client";
import { useState } from "react";

export default function ImportWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [requester, setRequester] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle"|"uploading"|"done"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading"); setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (requester) fd.append("requester", requester);
    if (note) fd.append("note", note);
    try {
      const res = await fetch("/api/import/word", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStatus("error");
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Import SKU Request (.docx)</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input type="file" accept=".docx" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        <input className="w-full border rounded p-2" placeholder="Requester (optional)" value={requester} onChange={(e)=>setRequester(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Note (optional)" value={note} onChange={(e)=>setNote(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" disabled={!file || status==="uploading"}>
          {status==="uploading" ? "Uploading..." : "Import"}
        </button>
        {status==="done" && <div className="text-green-600">Imported!</div>}
        {status==="error" && <div className="text-red-600">{error}</div>}
      </form>
    </main>
  );
}
