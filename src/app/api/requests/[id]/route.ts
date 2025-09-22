import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PatchBody = z.object({
  requesterName: z.string().nullable().optional(),
  requesterEmail: z.string().email().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(), // ISO
  adoId: z.string().nullable().optional(),
  userStory: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Optional probe
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;              // 👈 await params
  return NextResponse.json({ ok: true, seen: id });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }      // 👈 params is async
) {
  try {
    const { id: idStr } = await ctx.params;     // 👈 await params
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    if (!json || Object.keys(json).length === 0) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const updated = await prisma.request.update({
      where: { id },
      data: {
        requesterName: data.requesterName ?? undefined,
        requesterEmail: data.requesterEmail ?? undefined,
        dueDate: dueDate ?? undefined,
        adoId: data.adoId ?? undefined,
        userStory: data.userStory ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
