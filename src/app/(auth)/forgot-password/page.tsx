import Link from "next/link";
import { ForgotForm } from "@/components/auth/reset-forms";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <div className="glass-strong rounded-[1.75rem] p-7 sm:p-9">
      <div className="kicker">Account</div>
      <h1 className="masthead mt-3 text-4xl text-cream">Misplaced the key?</h1>
      <p className="mt-2 mb-7 text-sm text-muted-foreground">We&apos;ll email you a link to choose a new password.</p>
      <ForgotForm />
      <p className="mt-7 text-center text-sm text-muted-foreground">
        <Link href="/signin" className="text-champagne underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
