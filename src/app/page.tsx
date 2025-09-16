import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Search from "@/lib/components/SearchBar";
import RequestTable, { type RequestRow } from "@/lib/components/RequestTable";
import QuickFilterBar from "@/lib/components/QuickFilterBar";
import type { Prisma } from "@prisma/client";

/** Build the month range for a sprint like "YYYY-MM" */
function sprintRange(sprint?: string) {
  if (!sprint) return undefined;
  const start = new Date(`${sprint}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return undefined;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1); // first day of next month
  return { start, end };
  
}

const monthKeys = await prisma.request.findMany({
  where: { dueDate: { not: null } },
  select: { dueDate: true },
});
const sprintOptions = Array.from(
  new Set(
    monthKeys
      .map(r => r.dueDate!)
      .map(d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`)
  )
).sort();

/** Keep include shape in one place so types & query stay in sync */
const requestInclude = {
  submissions: {
    orderBy: { createdAt: "desc" as const },
    include: {
      products: { select: { id: true, sku: true, productName: true } },
    },
  },
  promoUploads: {
    orderBy: { uploadedAt: "desc" as const },
    select: {
      id: true,
      kind: true,
      fileName: true,
      uploadedAt: true,
      _count: { select: { lines: true } },
    },
    take: 3,
  },
  _count: { select: { promoUploads: true } },
} as const;

type RequestWithRelations = Prisma.RequestGetPayload<{
  include: typeof requestInclude;
}>;

export default async function Dashboard(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;

  const qParam = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (qParam ?? "").trim();

  const emailParam = Array.isArray(sp.email) ? sp.email[0] : sp.email;
  const email = (emailParam ?? "").trim() || undefined;

  const sprintParam = Array.isArray(sp.sprint) ? sp.sprint[0] : sp.sprint;
  const sprint = (sprintParam ?? "").trim() || undefined;
  const range = sprintRange(sprint);

  // Distinct requester emails for the dropdown
  const requesterEmails = await prisma.request.findMany({
    select: { requesterEmail: true },
    distinct: ["requesterEmail"],
    orderBy: { requesterEmail: "asc" },
    take: 500,
  });

  // ---- Build a mutable AND[] to avoid readonly-type errors ----
  const andFilters: Prisma.RequestWhereInput[] = [];

  if (q) {
    andFilters.push({
      OR: [
        { requesterName: { contains: q } },
        { requesterEmail: { contains: q } },
        { notes: { contains: q } },
        {
          submissions: {
            some: {
              products: {
                some: {
                  OR: [
                    { sku: { contains: q } },
                    { productName: { contains: q } },
                  ],
                },
              },
            },
          },
        },
      ],
    });
  }

  if (email) {
    andFilters.push({ requesterEmail: email });
  }

  if (range) {
    andFilters.push({
      dueDate: {
        gte: range.start,
        lt: range.end,
      },
    });
  }

  const where: Prisma.RequestWhereInput =
    andFilters.length > 0 ? { AND: andFilters } : {};

  // ---- Typed query result so relations exist on r.* ----
  const requests: RequestWithRelations[] = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: requestInclude,
  });

  const rows: RequestRow[] = requests.map((r) => {
    const allProducts = r.submissions.flatMap((s) => s.products);
    const recent = r.promoUploads ?? [];
    const promoUploadCount = r._count?.promoUploads ?? 0;
    const promoRowCount = recent.reduce(
      (sum, u) => sum + (u._count?.lines ?? 0),
      0
    );
    const lastPromoAt = recent[0]?.uploadedAt ?? null;

    return {
      id: r.id,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      dueDate: r.dueDate,
      createdAt: r.createdAt,
      skuCount: allProducts.length,
      sampleProducts: allProducts.slice(0, 5),
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

  const emailOptions = requesterEmails
    .map((e) => e.requesterEmail)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold dark:text-gray-300">Dashboard</h1>
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

      

      {/* Quick Filters */}
      <QuickFilterBar
  emails={emailOptions}
  selectedEmail={email}
  selectedSprint={sprint}
  sprints={sprintOptions}
/>

      {/* Search Input */}
      <Search placeholder="Search by requester, email, notes, SKU, or product name…" />

      {/* Requests Table */}
      <RequestTable requests={rows} />
    </div>
  );
}
