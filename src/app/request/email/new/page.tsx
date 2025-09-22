"use client";
import { useRouter } from "next/navigation";
import * as React from "react";

type Asset = { imagePath?: string; linkTo?: string };

/** ---------- UI helpers to match SKU input look ---------- */
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-base font-semibold">
          {label} {required && <span className="text-red-600">*</span>}
        </h3>
        {hint && <p className="text-xs text-gray-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-black/10">
      {children}
    </div>
  );
}

const baseInput =
  "w-full border-0 bg-transparent shadow-none focus:ring-0 p-0 outline-none";

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { asDate?: boolean }
) {
  // for <input type="date"> we still want no browser border
  const { className, asDate, ...rest } = props;
  return (
    <input
      {...rest}
      type={asDate ? "date" : props.type ?? "text"}
      className={`${baseInput} ${className ?? ""} appearance-none`}
    />
  );
}

function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${baseInput} ${className ?? ""} resize-y`}
    />
  );
}
/** -------------------------------------------------------- */

export default function NewEmailRequestPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  // Parent Request (optional bits)
  const [requesterName, setRequesterName] = React.useState("");
  const [requesterEmail, setRequesterEmail] = React.useState("");

  // EmailRequest core
  const [emailName, setEmailName] = React.useState("");
  const [sendDate, setSendDate] = React.useState(""); // yyyy-mm-dd
  const [subject, setSubject] = React.useState("");
  const [preheader, setPreheader] = React.useState("");
  const [bodyCopy, setBodyCopy] = React.useState("");

  const [deptBilled, setDeptBilled] = React.useState("");
  const [sendList, setSendList] = React.useState("");
  const [sendFrom, setSendFrom] = React.useState("");

  const [markets, setMarkets] = React.useState<string[]>([]);
  const [cultures, setCultures] = React.useState<string[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([{}]);

  // helpers
const addAsset = () => setAssets((a) => [...a, {}]);
const removeAsset = (idx: number) =>
  setAssets((a) => (a.length > 1 ? a.filter((_, i) => i !== idx) : a));

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/email-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: requesterName || null,
          requesterEmail: requesterEmail || null,

          emailName,
          sendDateYMD: sendDate || null,
          subject,
          preheader: preheader || null,
          bodyCopy: bodyCopy || null,

          deptBilled: deptBilled || null,
          sendList: sendList || null,
          sendFrom: sendFrom || null,

          markets,
          cultures,
          assets: assets
            .filter(
              (a) =>
                (a.imagePath && a.imagePath.trim()) ||
                (a.linkTo && a.linkTo.trim())
            )
            .map((a) => ({
              imagePath: a.imagePath?.trim() || null,
              linkTo: a.linkTo?.trim() || null,
            })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/request/${id}`);
    } catch (e: any) {
      alert(e?.message ?? "Failed to create Email Request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create Email Request</h1>
        <p className="text-sm text-gray-600">
          Fill the details and add assets.
        </p>
      </header>

            {/* Markets & Languages */}
      <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Countries">
            <InputShell>
              <div className="mt-0.5 flex flex-wrap gap-3 text-sm">
                {["US", "CA", "MX"].map(
                  (m) => (
                    <label key={m} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={markets.includes(m)}
                        onChange={() => setMarkets((x) => toggle(x, m))}
                      />
                      {m}
                    </label>
                  )
                )}
              </div>
            </InputShell>
          </Field>

          <Field label="Languages">
            <InputShell>
              <div className="mt-0.5 flex flex-wrap gap-3 text-sm">
                {["en-US", "fr-CA", "es-US"].map((c) => (
                  <label key={c} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cultures.includes(c)}
                      onChange={() => setCultures((x) => toggle(x, c))}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </InputShell>
          </Field>
        </div>
      </section>

      {/* Basics */}
      <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Requestor’s Name">
            <InputShell>
              <TextInput
                placeholder="Jane Doe"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
              />
            </InputShell>
          </Field>

          <Field label="Requestor Email">
            <InputShell>
              <TextInput
                type="email"
                placeholder="jane@company.com"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
              />
            </InputShell>
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Send Date">
            <InputShell>
              <TextInput
                asDate
                value={sendDate}
                onChange={(e) => setSendDate(e.target.value)}
              />
            </InputShell>
          </Field>

          <div className="md:col-span-2">
            <Field label="Name of Email">
              <InputShell>
                <TextInput
                  placeholder=""
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                />
              </InputShell>
            </Field>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Department Billed">
            <InputShell>
              <TextInput
                placeholder=""
                value={deptBilled}
                onChange={(e) => setDeptBilled(e.target.value)}
              />
            </InputShell>
          </Field>

          <Field label="Send List">
            <InputShell>
              <TextInput
                placeholder=""
                value={sendList}
                onChange={(e) => setSendList(e.target.value)}
              />
            </InputShell>
          </Field>

          <Field label="Send From">
            <InputShell>
              <TextInput
                placeholder=""
                value={sendFrom}
                onChange={(e) => setSendFrom(e.target.value)}
              />
            </InputShell>
          </Field>
        </div>
      </section>

      {/* Content */}
      <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <Field label="Subject Line">
          <InputShell>
            <TextInput
              placeholder=""
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </InputShell>
        </Field>

        <Field label="Pre-header">
          <InputShell>
            <TextInput
              placeholder=""
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </InputShell>
        </Field>

        <Field
          label="Body Copy"
          hint=""
        >
          <InputShell>
            <TextArea
              rows={6}
              placeholder=""
              value={bodyCopy}
              onChange={(e) => setBodyCopy(e.target.value)}
            />
          </InputShell>
        </Field>
      </section>



     {/* Assets (Image Path + Link To) */}
<section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="font-medium">Email Copy, Images, and Links</h3>
    <button
      type="button"
      onClick={addAsset}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
    >
      Add Row
    </button>
  </div>

  <div className="space-y-3">
    {assets.map((a, i) => (
      <div key={i} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-start">
        <InputShell>
          <TextInput
            placeholder="Image Path"
            value={a.imagePath ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setAssets((s) => s.map((x, idx) => (idx === i ? { ...x, imagePath: v } : x)));
            }}
          />
        </InputShell>

        <InputShell>
          <TextInput
            placeholder="Link To (full URL)"
            value={a.linkTo ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setAssets((s) => s.map((x, idx) => (idx === i ? { ...x, linkTo: v } : x)));
            }}
          />
        </InputShell>

        <div className="flex">
          <button
            type="button"
            onClick={() => removeAsset(i)}
            disabled={assets.length === 1}
            className="h-10 w-full md:w-auto rounded-md border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50 disabled:opacity-50"
            aria-label={`Remove row ${i + 1}`}
            title={assets.length === 1 ? "Keep at least one row" : "Remove row"}
          >
            Remove
          </button>
        </div>
      </div>
    ))}
  </div>
</section>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-[rgb(48,134,45)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(40,115,38)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Submit Email Request"}
        </button>
      </div>
    </div>
  );
}
