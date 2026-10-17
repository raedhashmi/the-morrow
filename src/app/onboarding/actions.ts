"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TOPIC_BY_ID } from "@/lib/topics";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  persona: z.string().max(30).nullable(),
  topics: z.array(z.object({ id: z.string(), loved: z.boolean() })).min(3).max(25),
  keywords: z.array(z.string().trim().min(2).max(40)).max(10),
  city: z.string().trim().max(60).optional().default(""),
  region: z.string().length(2),
  depth: z.enum(["BRIEF", "STANDARD", "DEEP"]),
  deliveryHour: z.number().int().min(0).max(23),
  timezone: z.string().min(2).max(60),
  emailDaily: z.boolean(),
});

export type OnboardingInput = z.input<typeof schema>;

export async function saveOnboarding(input: OnboardingInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in again." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Pick at least three topics to continue." };
  const d = parsed.data;

  let timezone = d.timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    timezone = "UTC";
  }

  await db.$transaction([
    db.interest.deleteMany({ where: { userId, origin: "ONBOARDING" } }),
    db.interest.createMany({
      data: [
        ...d.topics
          .filter((t) => TOPIC_BY_ID.has(t.id))
          .map((t) => ({ userId, kind: "TOPIC" as const, label: t.id, weight: t.loved ? 2 : 1, origin: "ONBOARDING" as const })),
        ...[...new Set(d.keywords.map((k) => k.toLowerCase()))].map((k) => ({
          userId,
          kind: "KEYWORD" as const,
          label: k,
          weight: 1.2,
          origin: "ONBOARDING" as const,
        })),
      ],
      skipDuplicates: true,
    }),
    db.user.update({
      where: { id: userId },
      data: {
        name: d.name,
        persona: d.persona,
        city: d.city || null,
        region: d.region,
        readingDepth: d.depth,
        deliveryHour: d.deliveryHour,
        timezone,
        emailDaily: d.emailDaily,
        onboarded: true,
      },
    }),
  ]);
  return { ok: true };
}
