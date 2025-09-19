"use client";

import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";
import * as React from "react";

// Reuse Next's own href type so we never drift
type Href = LinkProps["href"];

type Common = {
  title: string;
  "aria-label"?: string;
  className?: string;
  children: React.ReactNode;
};

type AsLink = Common & {
  href: Href; // <— key change
  onClick?: never;
  type?: never;
};

type AsButton = Common & {
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
};

export function IconButton(props: AsLink | AsButton) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";

  const aria = { "aria-label": props["aria-label"] ?? props.title };

  // Explicitly narrow and bind to a local so TS is 100% sure href exists
  if ("href" in props) {
    const p = props as AsLink;
    return (
      <Link
        href={p.href}
        title={p.title}
        className={cn(base, p.className)}
        {...aria}
      >
        {p.children}
      </Link>
    );
  }

  const p = props as AsButton;
  return (
    <button
      type={p.type ?? "button"}
      onClick={p.onClick}
      title={p.title}
      className={cn(base, p.className)}
      {...aria}
    >
      {p.children}
    </button>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
