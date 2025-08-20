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
        <header className="sticky top-0 z-20 bg-white border-b">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold">SKU Requests</Link>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Link href="/" className="hover:underline">Dashboard</Link>
              <Link href="/new" className="hover:underline">Add SKU Request</Link>
              <Link href="/admin" className="hover:underline">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-8xl px-20 py-4">{children}</main>
      </body>
    </html>
  );
}
