"use client";
import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "./fields";
import { forgotPasswordAction, resetPasswordAction, type FormState } from "@/app/(auth)/actions";

function Done({ message, cta }: { message: string; cta?: boolean }) {
  return (
    <div className="space-y-5 text-center animate-in fade-in-0 zoom-in-95">
      <CheckCircle2 className="mx-auto size-12 text-champagne" />
      <p className="text-cream/85">{message}</p>
      {cta && (
        <Button asChild size="lg" className="w-full rounded-xl">
          <Link href="/signin">Go to sign in</Link>
        </Button>
      )}
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  if (state.ok) return <Done message={state.message!} />;
  return (
    <form action={action} className="space-y-5">
      <Field name="email" type="email" label="Email" icon={Mail} placeholder="you@example.com" error={state.fieldErrors?.email} required autoFocus />
      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Send reset link
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});
  if (state.ok) return <Done message={state.message!} cta />;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField name="password" label="New password" autoComplete="new-password" showMeter error={state.fieldErrors?.password} required autoFocus />
      {state.error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
