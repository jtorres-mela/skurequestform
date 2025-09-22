import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Noon-UTC encoder for date-only strings (prevents off-by-one)
function dateAtNoonUTC(ymd?: string | null) {
  if (!ymd || !ymd.trim()) return null;
  return new Date(`${ymd}T12:00:00.000Z`);
}

// helpers to trim / nullify
const nullifyEmpty = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null) return null;
    const s = v.trim();
    return s.length ? s : null;
  });

// allow http(s), site-relative (/...), anchors (#...), and mailto/tel
// also normalize bare domains to https://
const linkToSchema = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null) return null;
    let s = v.trim();
    if (!s) return null;
    // If bare domain like "example.com" or "www.example.com", normalize to https://
    if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(s) && !/^(https?:|mailto:|tel:|\/|#)/i.test(s)) {
      s = `https://${s}`;
    }
    return s;
  })
  .refine(
    (v) =>
      v === null ||
      /^https?:\/\//i.test(v) ||
      v.startsWith("/") ||
      v.startsWith("#") ||
      /^mailto:|^tel:/i.test(v),
    { message: "Invalid URL" }
  );

const Asset = z.object({
  imagePath: nullifyEmpty, // accept empty → null
  linkTo: linkToSchema,    // relaxed/normalized URL acceptance
});

const Body = z.object({
  // Parent Request bits
  requesterName: nullifyEmpty,
  requesterEmail: z.string().email().optional().nullable(),
  dueDateYMD: nullifyEmpty,
  notes: nullifyEmpty,

  // EmailRequest core
  emailName: z.string().min(1),
  sendDateYMD: nullifyEmpty,
  subject: z.string().min(1),
  preheader: nullifyEmpty,
  bodyCopy: nullifyEmpty,
  deptBilled: nullifyEmpty,
  sendList: nullifyEmpty,
  sendFrom: nullifyEmpty,

  // Arrays (deduped/trimmed)
  markets: z
    .array(z.enum(["US", "CA", "MX", "GB", "IE", "NL", "DE", "PL", "LT"]))
    .default([])
    .transform((arr) => Array.from(new Set(arr))),

  cultures: z
    .array(z.string())
    .default([])
    .transform((arr) =>
      Array.from(new Set(arr.map((s) => s.trim()).filter((s) => s.length)))
    ),

  assets: z.array(Asset).default([]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;

    // Filter out completely empty asset rows (both fields null)
    const cleanedAssets = (d.assets || []).filter(
      (a) => (a.imagePath && a.imagePath.length) || (a.linkTo && a.linkTo.length)
    );

    const created = await prisma.request.create({
      data: {
        type: "EMAIL_REQUEST",
        requesterName: d.requesterName ?? null,
        requesterEmail: d.requesterEmail ?? null,
        dueDate: dateAtNoonUTC(d.dueDateYMD),
        notes: d.notes ?? null,
        emailRequest: {
          create: {
            emailName: d.emailName,
            sendDate: dateAtNoonUTC(d.sendDateYMD),
            subject: d.subject,
            preheader: d.preheader ?? null,
            bodyCopy: d.bodyCopy ?? null,
            deptBilled: d.deptBilled ?? null,
            sendList: d.sendList ?? null,
            sendFrom: d.sendFrom ?? null,
            markets: {
              createMany: { data: d.markets.map((m) => ({ market: m })) },
            },
            cultures: {
              createMany: { data: d.cultures.map((c) => ({ cultureCode: c })) },
            },
            assets: {
              create: cleanedAssets.map((a, i) => ({
                orderIndex: i,
                imagePath: a.imagePath ?? null,
                linkTo: a.linkTo ?? null,
              })),
            },
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
