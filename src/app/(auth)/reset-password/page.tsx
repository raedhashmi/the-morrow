import { ResetForm } from "@/components/auth/reset-forms";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="glass-strong rounded-[1.75rem] p-7 sm:p-9">
      <div className="kicker">Account</div>
      <h1 className="masthead mt-3 mb-7 text-4xl text-cream">Choose a new password</h1>
      <ResetForm token={token} />
    </div>
  );
}
