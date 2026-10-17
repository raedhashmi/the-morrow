import { db } from "@/lib/db";
import { requireReader } from "@/lib/session";
import { PreferencesForm, InterestBoard, PasswordForm } from "@/components/settings/settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireReader();
  const interests = await db.interest.findMany({ where: { userId: user.id }, orderBy: { weight: "desc" } });
  const signals = await db.interaction.count({ where: { userId: user.id } });
  return (
    <div className="space-y-10">
      <div>
        <div className="kicker">Your paper, your rules</div>
        <h1 className="masthead mt-2 text-5xl text-cream">Settings</h1>
      </div>
      <InterestBoard
        signals={signals}
        interests={interests.map((i) => ({ id: i.id, kind: i.kind, label: i.label, weight: i.weight, origin: i.origin }))}
      />
      <PreferencesForm
        initial={{
          deliveryHour: user.deliveryHour,
          readingDepth: user.readingDepth,
          emailDaily: user.emailDaily,
          emailSecurity: user.emailSecurity,
          mutedWords: user.mutedWords.join(", "),
          city: user.city ?? "",
        }}
        timezone={user.timezone}
      />
      <PasswordForm hasPassword={!!user.passwordHash} />
    </div>
  );
}
