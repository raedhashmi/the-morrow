"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendPasswordChangedEmail } from "@/server/email";

async function uid() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthorized");
  return s.user.id;
}

const prefs = z.object({
  deliveryHour: z.coerce.number().int().min(0).max(23),
  readingDepth: z.enum(["BRIEF", "STANDARD", "DEEP"]),
  emailDaily: z.boolean(),
  emailSecurity: z.boolean(),
  mutedWords: z.string().max(500),
  city: z.string().max(60),
});

export async function savePreferences(input: z.input<typeof prefs>) {
  const userId = await uid();
  const d = prefs.parse(input);
  await db.user.update({
    where: { id: userId },
    data: {
      deliveryHour: d.deliveryHour,
      readingDepth: d.readingDepth,
      emailDaily: d.emailDaily,
      emailSecurity: d.emailSecurity,
      city: d.city.trim() || null,
      mutedWords: d.mutedWords.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean).slice(0, 30),
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function adjustInterest(id: string, delta: number) {
  const userId = await uid();
  const i = await db.interest.findFirst({ where: { id, userId } });
  if (!i) return;
  await db.interest.update({ where: { id }, data: { weight: Math.max(0, Math.min(5, i.weight + delta)) } });
  revalidatePath("/settings");
}

export async function removeInterest(id: string) {
  const userId = await uid();
  await db.interest.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
}

const pw = z.string().min(8).max(200).regex(/[A-Za-z]/).regex(/\d/);

export async function changePassword(_: unknown, formData: FormData) {
  const userId = await uid();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const current = String(formData.get("current") || "");
  const next = pw.safeParse(formData.get("next"));
  if (!next.success) return { error: "New password needs 8+ characters with a letter and a number." };
  if (user.passwordHash && !(await bcrypt.compare(current, user.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next.data, 12) } });
  await sendPasswordChangedEmail(user.email);
  return { ok: true };
}
