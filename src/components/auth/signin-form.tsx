"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, AtSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "./fields";
import { signInAction, type FormState } from "@/app/(auth)/actions";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field
        name="identifier"
        key={state.values?.identifier}
        defaultValue={state.values?.identifier}
        label="Email or username"
        placeholder="you@example.com"
        autoComplete="username"
        icon={AtSign}
        required
        autoFocus
      />
      <PasswordField
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        aside={
          <Link href="/forgot-password" className="text-xs text-champagne/80 transition hover:text-champagne">
            Forgot password?
          </Link>
        }
      />
      {state.error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-in fade-in-0 zoom-in-95">
          {state.error}
        </div>
      )}
      <Button type="submit" size="lg" className="group w-full rounded-xl" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? "Opening your paper…" : "Sign in"}
        {!pending && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
      </Button>
    </form>
  );
}
