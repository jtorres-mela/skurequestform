"use client";
import * as React from "react";
import { Info } from "lucide-react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={
      "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1 " +
      className
    }
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={
      "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-1 " +
      className
    }
    {...props}
  />
));
Textarea.displayName = "Textarea";


export function FormField({
  id,
  label,
  required,
  tooltip,
  description,
  hint,
  error,
  aside,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  tooltip?: string;           // short extra context
  description?: React.ReactNode; // brief sentence under label
  hint?: React.ReactNode;        // micro-hint under control
  error?: React.ReactNode;       // error text under control
  aside?: React.ReactNode;       // right-aligned quick actions / switches
  children: React.ReactNode;     // the input(s)
}) {
  const descId = description ? `${id}-desc` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId  = error ? `${id}-err` : undefined;
  const describedBy = [descId, hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="text-sm font-medium text-gray-900">
            {label}
            {required && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Required
              </span>
            )}
          </label>
          {tooltip && (
            <span title={tooltip} className="text-gray-400 hover:text-gray-600">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
        {aside}
      </div>

      {description && (
        <p id={descId} className="text-xs text-gray-600">
          {description}
        </p>
      )}

      <div aria-describedby={describedBy}>{children}</div>

      {hint && <p id={hintId} className="text-[11px] text-gray-500">{hint}</p>}
      {error && <p id={errId} className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

export function InputShell({
  prefix,
  suffix,
  children,
  disabled,
}: {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center rounded-md border px-2",
        disabled ? "bg-gray-50 text-gray-400" : "bg-white",
      ].join(" ")}
    >
      {prefix && <span className="mr-1 text-gray-500">{prefix}</span>}
      <div className="flex-1">{children}</div>
      {suffix && <span className="ml-1 text-gray-500">{suffix}</span>}
    </div>
  );
}

export function CurrencyInput({
  id,
  value,
  disabled,
  placeholder,
  onChange,
  onValidChange,
  prefix,               // <-- NEW
}: {
  id?: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (next: string) => void;
  onValidChange?: (isValid: boolean) => void;
  prefix?: string;      // <-- NEW
}) {
  const [local, setLocal] = React.useState(value ?? "");
  React.useEffect(() => setLocal(value ?? ""), [value]);

  const isValid = !local || /^\d+(\.\d{0,2})?$/.test(local);
  React.useEffect(() => { onValidChange?.(isValid); }, [isValid, onValidChange]);

  const handleBlur = () => {
    if (!local) return;
    const n = Number(local);
    if (Number.isFinite(n)) {
      const fixed = n.toFixed(2);
      onChange(fixed);
      setLocal(fixed);
    }
  };

  return (
    <InputShell prefix={prefix} disabled={disabled}>
      <input
        id={id}
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-transparent py-2 text-sm outline-none"
        value={local}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
        onBlur={handleBlur}
      />
    </InputShell>
  );
}