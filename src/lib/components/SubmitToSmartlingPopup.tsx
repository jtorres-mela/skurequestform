"use client";

import * as React from "react";

type SkuRow = {
  id: number;                // used when POSTing productId
  [key: string]: unknown;    // remaining fields are dynamic
};

type SelectedState = Record<string, boolean>;
type RegionsState = { US: boolean; CA: boolean; EU: boolean };

interface SubmitToSmartlingPopupProps {
  sku: SkuRow;
  /** Optional icon/text trigger renderer. Calls `open()` to show the dialog. */
  renderTrigger?: (open: () => void) => React.ReactNode;
  /** Optional callback after successful submit (receives server JSON) */
  onSuccess?: (result: any) => void;
  /** Start open (mostly for testing) */
  defaultOpen?: boolean;
}

export default function SubmitToSmartlingPopup({
  sku,
  renderTrigger,
  onSuccess,
  defaultOpen = false,
}: SubmitToSmartlingPopupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [authorizeJobs, setAuthorizeJobs] = React.useState(false);
  const [jobTitle, setJobTitle] = React.useState("");

  // Region + creds state
  const [selectedRegions, setSelectedRegions] = React.useState<RegionsState>({
    US: false,
    CA: false,
    EU: false,
  });

  const [showCredsPrompt, setShowCredsPrompt] = React.useState(false);

  // US
  const [userIdUS, setUserIdUS] = React.useState("");
  const [userKeyUS, setUserKeyUS] = React.useState("");
  const [projectIdUS, setProjectIdUS] = React.useState("");
  // CA
  const [userIdCA, setUserIdCA] = React.useState("");
  const [userKeyCA, setUserKeyCA] = React.useState("");
  const [projectIdCA, setProjectIdCA] = React.useState("");
  // EU
  const [userIdEU, setUserIdEU] = React.useState("");
  const [userKeyEU, setUserKeyEU] = React.useState("");
  const [projectIdEU, setProjectIdEU] = React.useState("");
  const [targetLocalesEU, setTargetLocalesEU] = React.useState<string[]>([]);

  // Load credentials (and EU locales) from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setUserIdUS(localStorage.getItem("smartlingUserIdUS") || "");
    setUserKeyUS(localStorage.getItem("smartlingUserKeyUS") || "");
    setProjectIdUS(localStorage.getItem("smartlingProjectIdUS") || "");
    setUserIdCA(localStorage.getItem("smartlingUserIdCA") || "");
    setUserKeyCA(localStorage.getItem("smartlingUserKeyCA") || "");
    setProjectIdCA(localStorage.getItem("smartlingProjectIdCA") || "");
    setUserIdEU(localStorage.getItem("smartlingUserIdEU") || "");
    setUserKeyEU(localStorage.getItem("smartlingUserKeyEU") || "");
    setProjectIdEU(localStorage.getItem("smartlingProjectIdEU") || "");
    const savedEU = localStorage.getItem("smartlingTargetLocalesEU");
    if (savedEU) {
      try {
        const parsed = JSON.parse(savedEU);
        if (Array.isArray(parsed)) setTargetLocalesEU(parsed as string[]);
      } catch {}
    }
  }, []);

  // Exclude these fields from the selectable list
  const excluded = React.useMemo(
    () =>
      new Set([
        "submissionTime",
        "submissionIdRaw",
        "submissionNote",
        "submissionId",
        "onSaleDate",
        "offSaleDate",
        "uomUS",
        "uomCA",
        "savingsUS",
        "savingsCA",
        "isCurrent",
      ]),
    []
  );

  // Compute display entries (stable) and selected map that resets when SKU changes
  const displayEntries = React.useMemo(
    () => Object.entries(sku).filter(([key]) => !excluded.has(key)),
    [sku, excluded]
  );

  const [selected, setSelected] = React.useState<SelectedState>({});

  React.useEffect(() => {
    // Reset selection whenever sku changes
    const next: SelectedState = {};
    for (const [key] of displayEntries) next[key] = false;
    setSelected(next);
  }, [displayEntries]);

  const handleToggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Esc key to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    // Require at least one region
    if (!selectedRegions.US && !selectedRegions.CA && !selectedRegions.EU) {
      setSubmitError("Please select at least one region to submit.");
      setIsSubmitting(false);
      return;
    }

    // Validate credentials for all selected regions
    const missingUS = selectedRegions.US && (!userIdUS || !userKeyUS || !projectIdUS);
    const missingCA = selectedRegions.CA && (!userIdCA || !userKeyCA || !projectIdCA);
    const missingEU =
      selectedRegions.EU &&
      (!userIdEU || !userKeyEU || !projectIdEU || targetLocalesEU.length === 0);

    if (missingUS || missingCA || missingEU) {
      setShowCredsPrompt(true);
      setIsSubmitting(false);
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
          selectedRegions,
          // US
          userIdUS,
          userKeyUS,
          projectIdUS,
          // CA
          userIdCA,
          userKeyCA,
          projectIdCA,
          // EU
          userIdEU,
          userKeyEU,
          projectIdEU,
          targetLocalesEU,
          authorizeJobs,
          productId: sku.id,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unknown error");

      onSuccess?.(result);
      alert(
        "Smartling jobs created and strings added successfully! " + JSON.stringify(result)
      );
      setOpen(false);
    } catch (err) {
      alert("Smartling API error: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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
      localStorage.setItem("smartlingUserIdEU", userIdEU);
      localStorage.setItem("smartlingUserKeyEU", userKeyEU);
      localStorage.setItem("smartlingProjectIdEU", projectIdEU);
      localStorage.setItem("smartlingTargetLocalesEU", JSON.stringify(targetLocalesEU));
    }
    setShowCredsPrompt(false);
  };

  // Default text trigger (kept for backward compatibility)
  const defaultTrigger = (
    <button
      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50 cursor-pointer"
      onClick={() => setOpen(true)}
      type="button"
    >
      Submit translation to Smartling
    </button>
  );

  return (
    <>
      {renderTrigger ? renderTrigger(() => setOpen(true)) : defaultTrigger}

      {!open ? null : showCredsPrompt ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] relative">
            <h3 className="text-lg font-semibold mb-4">Enter Smartling Credentials</h3>
            <p className="mb-4 text-xs text-gray-600">
              Need help?&nbsp;
              <a
                href="https://help.smartling.com/hc/en-us/articles/115004187694-API-Tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                How to generate your Smartling API keys
              </a>
            </p>

            <div className="mb-4">
              {/* US */}
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                US User ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling US User ID"
                value={userIdUS}
                onChange={(e) => setUserIdUS(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                US User Key
              </label>
              <input
                type="password"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling US User Key"
                value={userKeyUS}
                onChange={(e) => setUserKeyUS(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                US Project ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling US Project ID"
                value={projectIdUS}
                onChange={(e) => setProjectIdUS(e.target.value)}
              />

              {/* CA */}
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                CA User ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling CA User ID"
                value={userIdCA}
                onChange={(e) => setUserIdCA(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                CA User Key
              </label>
              <input
                type="password"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling CA User Key"
                value={userKeyCA}
                onChange={(e) => setUserKeyCA(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                CA Project ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling CA Project ID"
                value={projectIdCA}
                onChange={(e) => setProjectIdCA(e.target.value)}
              />

              {/* EU */}
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                EU User ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling EU User ID"
                value={userIdEU}
                onChange={(e) => setUserIdEU(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                EU User Key
              </label>
              <input
                type="password"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling EU User Key"
                value={userKeyEU}
                onChange={(e) => setUserKeyEU(e.target.value)}
              />
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                EU Project ID
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Smartling EU Project ID"
                value={projectIdEU}
                onChange={(e) => setProjectIdEU(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                Target Locales (EU)
              </label>
              <div className="flex flex-col gap-1">
                {["nl-NL", "de-DE", "lt-LT", "pl-PL"].map((loc) => (
                  <label key={loc} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={targetLocalesEU.includes(loc)}
                      onChange={(e) =>
                        setTargetLocalesEU((prev) =>
                          e.target.checked ? [...prev, loc] : prev.filter((l) => l !== loc)
                        )
                      }
                    />
                    {loc}
                  </label>
                ))}
              </div>
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
                onClick={() => {
                  setShowCredsPrompt(false);
                  setOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold mb-2">Submit to Smartling</h3>

            <div className="mb-4">
              <button
                type="button"
                className="text-xs text-blue-600 underline hover:text-blue-800 cursor-pointer"
                onClick={() => setShowCredsPrompt(true)}
              >
                Edit Smartling Credentials
              </button>
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold text-gray-700">
                Select Regions
              </label>
              <div className="mb-4 flex flex-col gap-1">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRegions.US}
                    onChange={(e) =>
                      setSelectedRegions((r) => ({ ...r, US: e.target.checked }))
                    }
                  />
                  US (enUS → esUS)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRegions.CA}
                    onChange={(e) =>
                      setSelectedRegions((r) => ({ ...r, CA: e.target.checked }))
                    }
                  />
                  CA (enCA → frCA)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRegions.EU}
                    onChange={(e) =>
                      setSelectedRegions((r) => ({ ...r, EU: e.target.checked }))
                    }
                  />
                  EU (enIE → nlNL, deDE, ltLT, plPL)
                </label>
              </div>

              {selectedRegions.EU && (
                <div className="mb-4">
                  <label className="block mb-2 text-xs font-semibold text-gray-700">
                    Target Locales (EU)
                  </label>
                  <div className="flex flex-col gap-1">
                    {["nl-NL", "de-DE", "lt-LT", "pl-PL"].map((loc) => (
                      <label key={loc} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={targetLocalesEU.includes(loc)}
                          onChange={(e) =>
                            setTargetLocalesEU((prev) =>
                              e.target.checked
                                ? [...prev, loc]
                                : prev.filter((l) => l !== loc)
                            )
                          }
                        />
                        {loc}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="text-red-600 text-xs mb-2">{submitError}</div>
              )}

              <label className="block mb-2 text-xs font-semibold text-gray-700">
                Smartling Job Title
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded border px-2 py-1 text-xs"
                placeholder="Enter job title..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />

              <table className="min-w-full text-xs">
                <tbody>
                  {displayEntries.map(([key, value]) => (
                    <tr key={key}>
                      <td className="pr-2 py-1 align-top text-gray-700 whitespace-nowrap">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selected[key]}
                            onChange={() => handleToggle(key)}
                          />
                          <span className="font-semibold">{key}</span>
                        </label>
                      </td>
                      <td className="py-1 align-top text-gray-900 break-all">
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={authorizeJobs}
                  onChange={(e) => setAuthorizeJobs(e.target.checked)}
                />
                Authorize Job(s)
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
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
      )}
    </>
  );
}
