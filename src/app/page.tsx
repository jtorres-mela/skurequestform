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
      // For SKU count + samples
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          products: { select: { id: true, sku: true, productName: true } },
        },
      },
      // Promo uploads (recent first) + line counts if you have PromotionLine
      promoUploads: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          kind: true,
          fileName: true,
          uploadedAt: true,
          _count: { select: { lines: true } }, // OK even if you later remove PromotionLine
        },
        take: 3,
      },
      // Root-level counts
      _count: {
        select: {
          promoUploads: true,
        },
      },
    },
  });

  // Infer element type
  type RequestWithSubs = typeof requests[number];

  const rows: RequestRow[] = requests.map((r: RequestWithSubs) => {
    const allProducts = r.submissions.flatMap(
      (s: RequestWithSubs["submissions"][number]) => s.products
    );

    const recent = r.promoUploads ?? [];
    const promoUploadCount = r._count?.promoUploads ?? 0;
    const promoRowCount = recent.reduce((sum, u) => sum + (u._count?.lines ?? 0), 0);
    const lastPromoAt = recent[0]?.uploadedAt ?? null;

    return {
      id: r.id,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      dueDate: r.dueDate,
      createdAt: r.createdAt,

      // SKUs
      skuCount: allProducts.length,
      sampleProducts: allProducts.slice(0, 5),

      // Promos (all optional in RequestTable)
      promoUploadCount,
      promoRowCount,
      lastPromoAt,
      promoSummaries: recent.map((u) => ({
        id: u.id,
        kind: u.kind as "INCREMENTAL_PROMO" | "COUPON_PROMO",
        uploadedAt: u.uploadedAt,
        rows: u._count?.lines ?? undefined,
        fileName: u.fileName,
      })),
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
