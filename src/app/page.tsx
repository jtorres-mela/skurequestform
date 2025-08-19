import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Search from "@/lib/components/SearchBar";
import SubmissionTable from "@/lib/components/SubmissionTable";

export default async function Dashboard(
  props: {
    // Next 15 passes a Promise for server components
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  // ✅ await it
  const sp = await props.searchParams;
  const qParam = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (qParam ?? "").trim();

  // ...use `q` as before
  const submissions = await prisma.submission.findMany({
    where: q
      ? {
          OR: [
            { requester: { contains: q, mode: "insensitive" } },
            { note:      { contains: q, mode: "insensitive" } },
            { products:  { some: { OR: [
              { sku:         { contains: q, mode: "insensitive" } },
              { productName: { contains: q, mode: "insensitive" } },
            ]}}}
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { products: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">Search past submissions or start a new request.</p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          + Add SKU Request
        </Link>
      </div>

      <Search placeholder="Search by SKU, product name, requester, or note…" />

      <SubmissionTable submissions={submissions} />
    </div>
  );
}
