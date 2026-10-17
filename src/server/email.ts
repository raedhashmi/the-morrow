import "server-only";
import { Resend } from "resend";
import { APP_NAME, APP_TAGLINE, appUrl, longDate } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;

type SendArgs = { to: string; subject: string; html: string; text: string };

async function send({ to, subject, html, text }: SendArgs) {
  if (!resend) {
    console.info(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return { ok: true as const, dev: true };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
    if (error) {
      console.error("[email] resend error", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false as const };
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(opts: { preheader: string; kicker: string; title: string; body: string; cta?: { label: string; href: string } }) {
  const { preheader, kicker, title, body, cta } = opts;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#12060a;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#12060a;background-image:radial-gradient(circle at 15% 0%,#5a1528 0%,#12060a 60%);padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 8px 22px;text-align:center;">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:-0.5px;color:#f8efe4;">${APP_NAME}</div>
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e3c08d;margin-top:6px;">${APP_TAGLINE}</div>
</td></tr>
<tr><td style="background:#2a0d18;border:1px solid #4d1d2e;border-radius:20px;padding:36px 32px;">
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e3c08d;">${esc(kicker)}</div>
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;color:#f8efe4;margin:12px 0 18px;">${esc(title)}</h1>
  <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#e8d9cc;">${body}</div>
  ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="border-radius:999px;background:#8b1e3f;background-image:linear-gradient(135deg,#a83a5a,#6b1832);">
    <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#fff6ee;text-decoration:none;letter-spacing:.3px;">${esc(cta.label)} &rarr;</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:22px 8px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9c7f86;">
  You're receiving this because you have an account at ${APP_NAME}.<br>
  <a href="${appUrl("/settings")}" style="color:#c9677f;">Manage email preferences</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  meta?: { method: string; when: Date; ip?: string | null; agent?: string | null },
) {
  const first = name.split(" ")[0] || "reader";
  const security = meta
    ? `<p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #4d1d2e;font-size:12px;color:#9c7f86">Account created with ${esc(meta.method)} on ${esc(meta.when.toUTCString())}${meta.ip ? ` from ${esc(meta.ip)}` : ""}. Not you? <a href="${appUrl("/forgot-password")}" style="color:#c9677f">Secure your account</a>.</p>`
    : "";
  return send({
    to,
    subject: `Welcome to ${APP_NAME}, ${first}`,
    html: layout({
      preheader: "Your personal morning paper starts tomorrow — or right now.",
      kicker: "Welcome aboard",
      title: `Good to have you, ${esc(first)}.`,
      body: `<p style="margin:0 0 14px">Every morning we'll gather the stories that matter to <em>you</em> from across the web and set them into one paper — to read here, click through, or download as a PDF.</p>
             <p style="margin:0">The more you read, skip and react, the sharper your paper becomes.</p>${security}`,
      cta: { label: "Set up my paper", href: appUrl("/onboarding") },
    }),
    text: `Welcome to ${APP_NAME}, ${first}. Set up your paper: ${appUrl("/onboarding")}`,
  });
}

export async function sendSignInAlert(
  to: string,
  name: string,
  details: { method: string; when: Date; ip?: string | null; agent?: string | null; isNew?: boolean },
) {
  const when = details.when.toUTCString();
  const rows = [
    ["Method", details.method],
    ["Time", when],
    details.ip ? ["IP address", details.ip] : null,
    details.agent ? ["Device", details.agent.slice(0, 90)] : null,
  ].filter(Boolean) as string[][];
  return send({
    to,
    subject: details.isNew ? `Your ${APP_NAME} account was created` : `New sign-in to ${APP_NAME}`,
    html: layout({
      preheader: `Signed in with ${details.method} at ${when}`,
      kicker: "Security alert",
      title: details.isNew ? "Your account is ready" : `New sign-in, ${esc(name.split(" ")[0] || "reader")}`,
      body: `<p style="margin:0 0 16px">We noticed a ${details.isNew ? "sign-up" : "sign-in"} to your account.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #4d1d2e;">
        ${rows.map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #4d1d2e;color:#9c7f86;font-size:13px;width:110px">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #4d1d2e;color:#f8efe4;font-size:13px">${esc(v)}</td></tr>`).join("")}
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#b9a2a8">If this wasn't you, reset your password straight away.</p>`,
      cta: { label: details.isNew ? "Open my paper" : "Review my account", href: appUrl(details.isNew ? "/paper" : "/settings") },
    }),
    text: `${details.isNew ? "Account created" : "New sign-in"} via ${details.method} at ${when}. Not you? Reset your password: ${appUrl("/forgot-password")}`,
  });
}

export async function sendPaperReadyEmail(
  to: string,
  name: string,
  edition: { id: string; date: string; number: number; headline: string; editorNote: string; stories: { title: string; source: string }[] },
) {
  const list = edition.stories
    .slice(0, 5)
    .map(
      (s) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #4d1d2e;"><div style="font-family:Georgia,serif;font-size:16px;color:#f8efe4;line-height:1.35">${esc(s.title)}</div><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9677f;margin-top:4px">${esc(s.source)}</div></td></tr>`,
    )
    .join("");
  return send({
    to,
    subject: `${edition.headline} — your Morrow for ${longDate(edition.date)}`,
    html: layout({
      preheader: edition.editorNote.slice(0, 120),
      kicker: `No. ${edition.number} · ${longDate(edition.date)}`,
      title: edition.headline,
      body: `<p style="margin:0 0 18px;font-style:italic;color:#e8d9cc">${esc(edition.editorNote)}</p>
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #4d1d2e">${list}</table>`,
      cta: { label: "Read today's paper", href: appUrl(`/paper/${edition.id}`) },
    }),
    text: `Good morning ${name}. Today's paper: ${edition.headline}\n${appUrl(`/paper/${edition.id}`)}`,
  });
}

export async function sendPasswordResetEmail(to: string, link: string) {
  return send({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: layout({
      preheader: "This link expires in 30 minutes.",
      kicker: "Account",
      title: "Reset your password",
      body: `<p style="margin:0">Use the button below to choose a new password. The link expires in 30 minutes and works once. If you didn't ask for this, you can ignore this email.</p>`,
      cta: { label: "Choose a new password", href: link },
    }),
    text: `Reset your password (expires in 30 minutes): ${link}`,
  });
}

export async function sendPasswordChangedEmail(to: string) {
  return send({
    to,
    subject: `Your ${APP_NAME} password was changed`,
    html: layout({
      preheader: "Your password was just changed.",
      kicker: "Security alert",
      title: "Password changed",
      body: `<p style="margin:0">Your password was changed just now. If this wasn't you, reset it immediately.</p>`,
      cta: { label: "Reset password", href: appUrl("/forgot-password") },
    }),
    text: `Your password was changed. Not you? ${appUrl("/forgot-password")}`,
  });
}
