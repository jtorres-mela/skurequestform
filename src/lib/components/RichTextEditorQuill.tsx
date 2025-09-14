"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Wrap the dynamically-loaded editor so we can attach a ref
const ReactQuill = dynamic(async () => {
  const mod = await import("react-quill-new");
  const RQ = mod.default as any;
  return React.forwardRef<any, any>((props, ref) => <RQ ref={ref} {...props} />);
}, {
  ssr: false,
  loading: () => <div className="text-xs text-gray-500">Loading editor…</div>,
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightPx?: number;
};

const formats = ["bold", "italic", "underline", "link", "list", "clean"];


function normalizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  root.querySelectorAll("strong, b").forEach((node) => {
    const text = (node.textContent ?? "").replace(/[\s\u200B]/g, "");
    const onlyBr =
      node.childNodes.length === 1 &&
      node.firstChild &&
      node.firstChild.nodeName === "BR";
    if (text.length === 0 || onlyBr) {
      const parent = node.parentNode!;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    }
  });

  const cleaned = root.innerHTML.trim();
  if (!cleaned || cleaned === "<p><br></p>") return "";
  return cleaned;
}

export default function RichTextEditorQuill({
  value,
  onChange,
  placeholder = "Write the long description…",
  minHeightPx = 140,
}: Props) {
  const quillRef = React.useRef<any>(null);

  const normalizedValue = React.useMemo(
    () => normalizeHtml(value ?? ""),
    [value]
  );

  const handleChange = (html: string) => {
    const clean = normalizeHtml(html);
    if (clean !== (value ?? "")) onChange(clean);
  };

  return (
    <div className="quill-wrapper rte">
      <ReactQuill
  theme="snow"
  value={value ?? ""}
  onChange={onChange}
  modules={{ toolbar: true }}   // 👈 default Snow toolbar
  // formats: omit this prop or expand it (see below)
  placeholder={placeholder}
/>

      {/* Scoped CSS reset to avoid inherited bold/typography from parents */}
      <style jsx global>{`
        .rte .ql-container .ql-editor { min-height: ${minHeightPx}px; }
        .rte .ql-editor {
          font-weight: 400 !important;
          font-style: normal !important;
        }
        .rte .ql-editor strong, .rte .ql-editor b { font-weight: 700 !important; }
        .rte .ql-editor em, .rte .ql-editor i { font-style: italic !important; }
      `}</style>
    </div>
  );
}
