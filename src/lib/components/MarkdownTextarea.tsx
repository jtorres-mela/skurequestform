"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
};

export default function MarkdownTextarea({
  value,
  onChange,
  rows = 4,
  placeholder = "Write the long description… Use **bold**, *italic*, and line breaks.",
}: Props) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  const setValue = (next: string) => onChange(next);

  const wrapSelection = (before: string, after = before) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const v = value ?? "";
    const sel = v.slice(selectionStart, selectionEnd) || "";
    const next = v.slice(0, selectionStart) + before + sel + after + v.slice(selectionEnd);
    setValue(next);
    // reposition caret after the inserted text
    const newPos = selectionStart + before.length + sel.length + after.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  const insertAtCursor = (text: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const v = value ?? "";
    const next = v.slice(0, selectionStart) + text + v.slice(selectionEnd);
    setValue(next);
    const newPos = selectionStart + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Ctrl/Cmd+B → bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrapSelection("**");
    }
    // Ctrl/Cmd+I → italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrapSelection("*");
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => wrapSelection("**")}
          title="Bold (Ctrl/⌘+B)"
        >
          <span className="font-semibold">B</span>
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 italic"
          onClick={() => wrapSelection("*")}
          title="Italic (Ctrl/⌘+I)"
        >
          I
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => insertAtCursor("\n")}
          title="Line break"
        >
          ⏎
        </button>
        <button
          type="button"
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => insertAtCursor("\n- ")}
          title="Bullet"
        >
          •
        </button>
        <button
          type="button"
          className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => setShowPreview((v) => !v)}
          title="Toggle preview"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview */}
      {!showPreview ? (
        <textarea
          ref={ref}
          rows={rows}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <div className="prose prose-sm max-w-none rounded border bg-white p-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            // treat single newlines as <br/> to simplify line breaks for users
            // (GFM keeps lists, bold, italic, etc.)
            // @ts-expect-error - react-markdown supports this prop
            breaks
          >
            {value || "_Nothing to preview yet._"}
          </ReactMarkdown>
        </div>
      )}

      <p className="text-[11px] text-gray-500">
        Use <strong>**bold**</strong>, <em>*italic*</em>, and line breaks. Bullets start with <code>- </code>.
      </p>
    </div>
  );
}
