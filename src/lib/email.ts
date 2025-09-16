// src/lib/email.ts
import type { Request } from "@prisma/client";

export type MailProvider = "smtp" | "resend" | "ethereal";

function manageLink(baseUrl: string, id: number) {
  const base = baseUrl || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/request/${id}`;
}

function buildHtml(req: Request, link: string) {
  const fmt = (d?: Date | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin:0 0 8px">Your request has been created</h2>
    <p style="margin:0 0 16px">Thanks${req.requesterName ? `, ${req.requesterName}` : ""}! We opened a request so you can add SKUs and other submissions.</p>

    <table style="border-collapse:collapse;width:100%;max-width:560px">
      <tbody>
        <tr><td style="padding:6px 0;width:140px;color:#555">Request ID</td><td style="padding:6px 0"><strong>#${req.id}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#555">Requester Email</td><td style="padding:6px 0">${req.requesterEmail ?? "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Due Date</td><td style="padding:6px 0">${fmt(req.dueDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#555">ADO #</td><td style="padding:6px 0">${req.adoId ?? "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#555">User Story</td><td style="padding:6px 0">${req.userStory ?? "—"}</td></tr>
      </tbody>
    </table>

    <div style="margin:20px 0">
      <a href="${link}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">
        Manage Request
      </a>
    </div>

    ${req.notes ? `<p style="margin-top:16px"><strong>Notes:</strong><br>${req.notes.replace(/\n/g, "<br>")}</p>` : ""}
  </div>`;
}

function buildText(req: Request, link: string) {
  const fmt = (d?: Date | null) => (d ? new Date(d).toDateString() : "—");
  return [
    `Your request (#${req.id}) has been created.`,
    ``,
    `Requester Email: ${req.requesterEmail ?? "—"}`,
    `Due Date: ${fmt(req.dueDate)}`,
    `ADO #: ${req.adoId ?? "—"}`,
    `User Story: ${req.userStory ?? "—"}`,
    req.notes ? `Notes: ${req.notes}` : "",
    ``,
    `Manage Request: ${link}`,
  ].join("\n");
}

type SendResult = { provider: MailProvider; previewUrl?: string };

export async function sendRequestCreatedEmail(opts: {
  request: Request;
  to: string | null;
  baseUrl: string;
}): Promise<SendResult> {
  const { request, to, baseUrl } = opts;
  if (!to) return { provider: "smtp" }; // nothing to send

  const provider: MailProvider =
    (process.env.EMAIL_PROVIDER as MailProvider) ||
    (process.env.RESEND_API_KEY ? "resend" : (process.env.SMTP_HOST ? "smtp" : "ethereal"));

  const from = process.env.EMAIL_FROM || "noreply@example.com";
  const link = manageLink(baseUrl, request.id);
  const subject = `Request #${request.id} created`;
  const html = buildHtml(request, link);
  const text = buildText(request, link);

  // Resend (API)
  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed: ${res.status} ${body}`);
    }
    return { provider: "resend" };
  }

  // SMTP / Ethereal via Nodemailer
  type NodemailerModule = typeof import("nodemailer");
  let nodemailer: NodemailerModule | null = null;
  try {
    nodemailer = (await import("nodemailer")) as NodemailerModule;
  } catch {
    throw new Error("nodemailer not installed");
  }

  if (provider === "ethereal") {
    const test = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: test.smtp.host,
      port: test.smtp.port,
      secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass },
    });

    const info = await transporter.sendMail({ from, to, subject, html, text });
   // getTestMessageUrl returns string | false; normalize to string | undefined
const testUrl = nodemailer.getTestMessageUrl(info);
const previewUrl = typeof testUrl === "string" ? testUrl : undefined;

console.log("✉️  Ethereal email preview:", previewUrl);
return { provider: "ethereal", previewUrl };
  }

  // Regular SMTP
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) throw new Error("SMTP_* env vars not set");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, html, text });
  return { provider: "smtp" };
}
