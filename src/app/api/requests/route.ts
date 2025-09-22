import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateBody = z.object({
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  dueDate: z.string().optional().or(z.literal("")).optional(), // "YYYY-MM-DD" or empty
  adoId: z.string().optional().or(z.literal("")).optional(),
  userStory: z.string().optional().or(z.literal("")).optional(),
  notes: z.string().optional().or(z.literal("")).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = CreateBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requesterName, requesterEmail, dueDate, adoId, userStory, notes } = parsed.data;

    const due = dueDate && dueDate.trim()
  ? new Date(`${dueDate}T12:00:00.000Z`)
  : null;

    const created = await prisma.request.create({
      data: {
        requesterName,
        requesterEmail,
        dueDate: due,
        adoId: adoId?.trim() || null,
        userStory: userStory?.trim() || null,
        notes: notes?.trim() || null,
      },
      select: { id: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// Optional: list endpoint for debugging
export async function GET() {
  const items = await prisma.request.findMany({ take: 25, orderBy: { id: "desc" } });
  return NextResponse.json(items);
}
