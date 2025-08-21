import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKU Requests",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* HEADER */}

<header className="sticky top-0 z-50 bg-white shadow-md h-16 flex items-center">
  <nav className="w-full flex items-center justify-between px-6">
    {/* Brand / Title */}
    <Link href="/" className="font-semibold text-lg">
      <span className="text-[rgb(48,134,45)]">Melaleuca</span>{" "}
      SKU Requests
    </Link>

    {/* Right-side links */}
    <div className="flex items-center gap-6 text-sm">
      <Link href="/" className="hover:underline">
        Dashboard
      </Link>
      <Link href="/admin" className="hover:underline">
        Admin
      </Link>
    </div>
  </nav>
</header>



        {/* MAIN CONTENT */}
        <main className="mx-auto max-w-8xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}

