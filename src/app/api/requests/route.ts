import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";



// "" -> undefined, "YYYY-MM-DD" -> Date at 00:00, ISO datetime -> Date
const DateFromInput = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // midnight local time; use "Z" for UTC if you prefer UTC storage
    return new Date(`${s}T00:00:00`);
  }
  return new Date(s);
}, z.date().optional());

// Treat "" as undefined for dueDate
const EmptyStringToUndefined = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().datetime().optional());

// Accept number or string for adoId; we'll coerce to string
const AdoId = z.union([z.string(), z.number()]).optional();

const NewRequestInput = z.object({
  requesterName:  z.string().trim().optional(),
  requesterEmail: z.string().trim().email().optional(),
  dueDate:        DateFromInput,     // string ISO datetime or undefined
  adoId:          AdoId,                      // number or string or undefined
  userStory:      z.string().trim().optional(),
  notes:          z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = NewRequestInput.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requesterName, requesterEmail, dueDate, adoId, userStory, notes } =
      parsed.data;

    const created = await prisma.request.create({
      data: {
        requesterName: requesterName || null,
        requesterEmail: requesterEmail || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        adoId: adoId != null ? String(adoId) : null,
        userStory: userStory || null,
        notes: notes || null,
      },
      select: { id: true },
    });

    return NextResponse.json(
      { id: created.id },
      {
        status: 201,
        headers: { Location: `/request/${created.id}` },
      }
    );
  } catch (err: any) {
    console.error("POST /api/requests error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        return NextResponse.json(
          { error: "Invalid id parameter" },
          { status: 400 }
        );
      }

      const row = await prisma.request.findUnique({
        where: { id },
        include: {
          submissions: {
            orderBy: { createdAt: "desc" },
            include: { products: true },
          },
        },
      });

      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(row, { status: 200 });
    }

    // Fallback: list recent
    const rows = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        requesterName: true,
        requesterEmail: true,
        createdAt: true,
        dueDate: true,
      },
      take: 50,
    });

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/requests error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
