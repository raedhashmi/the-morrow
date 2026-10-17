"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";
import { headers } from "next/headers";
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/server/email";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
  values?: Record<string, string>;
};

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(20, "At most 20 characters")
  .regex(/^[a-z0-9_]+$/, "Letters, numbers and underscores only");
const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

const signUpSchema = z.object({
  username,
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password,
});

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = { username: String(formData.get("username") || ""), email: String(formData.get("email") || "") };
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { username, email, password } = parsed.data;

  const clash = await db.user.findFirst({ where: { OR: [{ email }, { username }] }, select: { email: true } });
  if (clash) {
    return clash.email === email
      ? { fieldErrors: { email: "An account with this email already exists" }, values }
      : { fieldErrors: { username: "That username is taken" }, values };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({ data: { username, email, passwordHash, name: username } });

  // Send the welcome email ourselves (credentials sign-ups don't trigger isNewUser).
  const h = await headers();
  await sendWelcomeEmail(email, username, {
    method: "Email & password",
    when: new Date(),
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
    agent: h.get("user-agent"),
  });

  try {
    await signIn("credentials", { identifier: email, password, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created — please sign in." };
    throw error;
  }
  return { ok: true };
}

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const identifier = String(formData.get("identifier") || "").trim();
  const pwd = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/paper");
  const values = { identifier };
  if (!identifier || !pwd) return { error: "Enter your email or username and password.", values };
  try {
    await signIn("credentials", {
      identifier,
      password: pwd,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/paper",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That combination didn't match. Check your details and try again.", values };
    }
    throw error;
  }
  return { ok: true };
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") || "/paper");
  await signIn("google", { redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/paper" });
}

const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const generic: FormState = {
    ok: true,
    message: "If an account exists for that address, a reset link is on its way.",
  };
  if (!z.string().email().safeParse(email).success) return { fieldErrors: { email: "Enter a valid email" } };
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return generic;
  const token = crypto.randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expires: new Date(Date.now() + 30 * 60_000) },
  });
  await sendPasswordResetEmail(email, appUrl(`/reset-password?token=${token}`));
  return generic;
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.usedAt || record.expires < new Date()) {
    return { error: "This link has expired. Request a new one." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(parsed.data, 12) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await sendPasswordChangedEmail(record.user.email);
  return { ok: true, message: "Password updated. You can sign in now." };
}
