// src/app/catalog/upload/page.tsx
"use client";

import { useState } from "react";

export default function CatalogUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<null | string>(null);

  async function upload() {
    if (!file) return;
    setStatus("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/catalog/upload", {
      method: "POST",
      headers: { "x-upload-token": token },
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${json?.error || res.statusText}`);
      return;
    }
    setStatus(`Done. Imported: ${json.ok}, Skipped/Invalid: ${json.bad}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Upload Catalog CSV</h1>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input
        type="password"
        placeholder="Upload token"
        className="block w-full rounded border px-3 py-2"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        onClick={upload}
        disabled={!file || !token}
      >
        Upload
      </button>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
