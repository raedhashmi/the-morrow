import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Set up your paper" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const interests = await db.interest.findMany({ where: { userId: user.id, origin: "ONBOARDING" } });
  return (
    <main className="min-h-dvh px-4 py-6 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Logo href="/paper" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Setting the type</span>
      </header>
      <OnboardingWizard
        initial={{
          name: user.name && user.name !== user.username ? user.name : "",
          persona: user.persona,
          topics: interests.filter((i) => i.kind === "TOPIC").map((i) => ({ id: i.label, loved: i.weight >= 2 })),
          keywords: interests.filter((i) => i.kind === "KEYWORD").map((i) => i.label),
          city: user.city ?? "",
          region: user.region,
          depth: user.readingDepth,
          deliveryHour: user.deliveryHour,
          emailDaily: user.emailDaily,
        }}
        returning={user.onboarded}
      />
    </main>
  );
}
