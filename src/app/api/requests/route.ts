// src/app/api/requests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendRequestCreatedEmail } from "@/lib/email";

// SMTP requires the Node runtime. If you use Resend only, you *can* change this.
// Keeping Node here makes both SMTP and Resend work.
export const runtime = "nodejs";

/** "" -> undefined, "YYYY-MM-DD" -> Date at 00:00 local, ISO datetime -> Date */
const DateFromInput = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // midnight local time; use "Z" if you prefer UTC storage
    return new Date(`${s}T00:00:00`);
  }
  return new Date(s);
}, z.date().optional());

// Accept number or string for adoId; we'll coerce to string
const AdoId = z.union([z.string(), z.number()]).optional();

const NewRequestInput = z.object({
  requesterName:  z.string().trim().optional(),
  requesterEmail: z.string().trim().email().optional(),
  dueDate:        DateFromInput, // Date | undefined
  adoId:          AdoId,
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

    // Create the request
    const created = await prisma.request.create({
      data: {
        requesterName: requesterName || null,
        requesterEmail: requesterEmail || null,
        dueDate: dueDate ?? null, // DateFromInput already returns Date | undefined
        adoId: adoId != null ? String(adoId) : null,
        userStory: userStory || null,
        notes: notes || null,
      },
      // return full row so the email can show details
    });

    // Build base URL for the email link (prefer explicit env; fallback to request origin)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    // Fire-and-forget email (don’t block response if mail fails)
    // Toggle to `await` if you want to surface errors to the client.
    sendRequestCreatedEmail({
      request: created,
      to: created.requesterEmail ?? null,
      baseUrl,
    }).catch((e) => {
      console.error("Request created email failed:", e);
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
