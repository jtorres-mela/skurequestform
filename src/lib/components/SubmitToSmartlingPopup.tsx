"use client";

import React, { useState, useEffect } from "react";

type SkuRow = Record<string, unknown>;

type SelectedState = Record<string, boolean>;

interface SubmitToSmartlingPopupProps {
  sku: SkuRow;
}

export default function SubmitToSmartlingPopup({ sku }: SubmitToSmartlingPopupProps) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  // Smartling credentials state
  const [showCredsPrompt, setShowCredsPrompt] = useState(false);
  const [userId, setUserId] = useState("");
  const [userKey, setUserKey] = useState("");
  const [projectId, setProjectId] = useState("");

  // Load credentials from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("smartlingUserId") || "");
      setUserKey(localStorage.getItem("smartlingUserKey") || "");
      setProjectId(localStorage.getItem("smartlingProjectId") || "");
    }
  }, []);
  // Exclude these fields from the popup
  const excluded = new Set(["submissionTime", "submissionIdRaw", "submissionNote", "submissionId", "onSaleDate", "offSaleDate", "uomUS", "uomCA", "savingsUS", "savingsCA", "isCurrent"]);
  const displayEntries = Object.entries(sku).filter(([key]) => !excluded.has(key));

  const [selected, setSelected] = useState<SelectedState>(() => {
    const acc: SelectedState = {};
    displayEntries.forEach(([key]) => {
      acc[key] = false;
    });
    return acc;
  });

  const handleToggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    // If credentials are missing, prompt for them
    if (!userId || !userKey || !projectId) {
      setShowCredsPrompt(true);
      return;
    }
    // Collect selected data
    const selectedData = Object.fromEntries(
      displayEntries.filter(([k]) => selected[k])
    );
    try {
      const res = await fetch("/api/smartling-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedData, jobTitle, userId, userKey, projectId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unknown error");
      alert("Smartling job created and strings added successfully! Job UID: " + result.jobUid);
    } catch (err) {
      alert("Smartling API error: " + (err as Error).message);
    }
    setOpen(false);
  };

  // Save credentials and continue
  const handleSaveCreds = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartlingUserId", userId);
      localStorage.setItem("smartlingUserKey", userKey);
      localStorage.setItem("smartlingProjectId", projectId);
    }
    setShowCredsPrompt(false);
    handleSubmit();
  };
  return (
    <>
      <button
        className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
        onClick={() => setOpen(true)}
        type="button"
      >
        Submit translation to Smartling
      </button>
      {open && (
        showCredsPrompt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] relative">
              <h3 className="text-lg font-semibold mb-4">Enter Smartling Credentials</h3>
              <div className="mb-4">
                <label className="block mb-2 text-xs font-semibold text-gray-700">User ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling User ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">User Key</label>
                <input
                  type="password"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling User Key"
                  value={userKey}
                  onChange={e => setUserKey(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">Project ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling Project ID"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition"
                  onClick={handleSaveCreds}
                >
                  Save & Continue
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-800 rounded px-4 py-2 font-medium hover:bg-gray-300 transition"
                  onClick={() => { setShowCredsPrompt(false); setOpen(false); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">Submit to Smartling</h3>
            <div className="mb-4">
              <label className="block mb-2 text-xs font-semibold text-gray-700">Smartling Job Title</label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Enter job title..."
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
              <table className="min-w-full text-xs">
                <tbody>
                  {displayEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td className="pr-2 py-1 align-top text-gray-700 whitespace-nowrap">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected[key]}
                            onChange={() => handleToggle(key)}
                          />
                          <span className="font-semibold">{key}</span>
                        </label>
                      </td>
                      <td className="py-1 align-top text-gray-900 break-all">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition"
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-800 rounded px-4 py-2 font-medium hover:bg-gray-300 transition"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        )
      )}
    </>
  );
}
