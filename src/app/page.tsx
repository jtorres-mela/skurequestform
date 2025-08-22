import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Search from "@/lib/components/SearchBar";
import RequestTable, { type RequestRow } from "@/lib/components/RequestTable";

export default async function Dashboard(
  props: {
    // Next can pass this as a Promise in async server components
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const sp = await props.searchParams;
  const qParam = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (qParam ?? "").trim();

const requests = await prisma.request.findMany({
  where: q
    ? {
        OR: [
          { requesterName:  { contains: q } },
          { requesterEmail: { contains: q } },
          { notes:          { contains: q } },
          {
            submissions: {
              some: {
                products: {
                  some: {
                    OR: [
                      { sku:         { contains: q } },
                      { productName: { contains: q } },
                    ],
                  },
                },
              },
            },
          },
        ],
      }
    : undefined,
  orderBy: { createdAt: "desc" },
  take: 50,
  include: {
    submissions: {
      orderBy: { createdAt: "desc" },
      include: {
        products: { select: { id: true, sku: true, productName: true } },
      },
    },
  },
});


  // Infer the element type from the query result
  type RequestWithSubs = typeof requests[number];

  const rows: RequestRow[] = requests.map((r: RequestWithSubs) => {
    const allProducts = r.submissions.flatMap((s: RequestWithSubs["submissions"][number]) => s.products);

    return {
      id: r.id,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      dueDate: r.dueDate,
      createdAt: r.createdAt,
      skuCount: allProducts.length,
      sampleProducts: allProducts.slice(0, 5),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Search requests or start a new one.
          </p>
        </div>
        <Link
          href="/request/new"
          className="inline-flex items-center rounded-lg bg-[rgb(48,134,45)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(40,115,38)]"
        >
          + Create New Request
        </Link>
      </div>

      {/* Search Input */}
      <Search placeholder="Search by requester, email, notes, SKU, or product name…" />

      {/* Requests Table */}
      <RequestTable requests={rows} />
    </div>
  );
}
