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
  const [userIdUS, setUserIdUS] = useState("");
  const [userKeyUS, setUserKeyUS] = useState("");
  const [projectIdUS, setProjectIdUS] = useState("");
  const [userIdCA, setUserIdCA] = useState("");
  const [userKeyCA, setUserKeyCA] = useState("");
  const [projectIdCA, setProjectIdCA] = useState("");

  // Load credentials from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserIdUS(localStorage.getItem("smartlingUserIdUS") || "");
      setUserKeyUS(localStorage.getItem("smartlingUserKeyUS") || "");
      setProjectIdUS(localStorage.getItem("smartlingProjectIdUS") || "");
      setUserIdCA(localStorage.getItem("smartlingUserIdCA") || "");
      setUserKeyCA(localStorage.getItem("smartlingUserKeyCA") || "");
      setProjectIdCA(localStorage.getItem("smartlingProjectIdCA") || "");
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
    if (!userIdUS || !userKeyUS || !projectIdUS || !userIdCA || !userKeyCA || !projectIdCA) {
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
        body: JSON.stringify({
          selectedData,
          jobTitle,
          userIdUS,
          userKeyUS,
          projectIdUS,
          userIdCA,
          userKeyCA,
          projectIdCA
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unknown error");
      alert("Smartling jobs created and strings added successfully! US Job UID: " + result.jobUidUS + ", CA Job UID: " + result.jobUidCA);
    } catch (err) {
      alert("Smartling API error: " + (err as Error).message);
    }
    setOpen(false);
  };

  // Save credentials and continue
  const handleSaveCreds = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartlingUserIdUS", userIdUS);
      localStorage.setItem("smartlingUserKeyUS", userKeyUS);
      localStorage.setItem("smartlingProjectIdUS", projectIdUS);
      localStorage.setItem("smartlingUserIdCA", userIdCA);
      localStorage.setItem("smartlingUserKeyCA", userKeyCA);
      localStorage.setItem("smartlingProjectIdCA", projectIdCA);
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
                <label className="block mb-2 text-xs font-semibold text-gray-700">US User ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling US User ID"
                  value={userIdUS}
                  onChange={e => setUserIdUS(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">US User Key</label>
                <input
                  type="password"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling US User Key"
                  value={userKeyUS}
                  onChange={e => setUserKeyUS(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">US Project ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling US Project ID"
                  value={projectIdUS}
                  onChange={e => setProjectIdUS(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">CA User ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling CA User ID"
                  value={userIdCA}
                  onChange={e => setUserIdCA(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">CA User Key</label>
                <input
                  type="password"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling CA User Key"
                  value={userKeyCA}
                  onChange={e => setUserKeyCA(e.target.value)}
                />
                <label className="block mb-2 text-xs font-semibold text-gray-700">CA Project ID</label>
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1 text-xs"
                  placeholder="Smartling CA Project ID"
                  value={projectIdCA}
                  onChange={e => setProjectIdCA(e.target.value)}
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
