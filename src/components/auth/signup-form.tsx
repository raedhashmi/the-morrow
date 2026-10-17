"use client";
import { useActionState, useEffect, useState } from "react";
import { ArrowRight, AtSign, Check, Loader2, Mail, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "./fields";
import { signUpAction, type FormState } from "@/app/(auth)/actions";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const [username, setUsername] = useState("");
  const [checked, setChecked] = useState<{ u: string; available: boolean } | null>(null);
  const u = username.trim().toLowerCase();
  const valid = /^[a-z0-9_]{3,20}$/.test(u);

  useEffect(() => {
    if (!valid) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username?u=${encodeURIComponent(u)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { available: boolean };
        setChecked({ u, available: data.available });
      } catch {
        /* aborted */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [u, valid]);

  const avail: Availability = !u
    ? "idle"
    : !valid
      ? "invalid"
      : checked?.u !== u
        ? "checking"
        : checked.available
          ? "available"
          : "taken";

  const hint =
    avail === "checking" ? (
      <span className="inline-flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Checking…</span>
    ) : avail === "available" ? (
      <span className="inline-flex items-center gap-1.5 text-emerald-300"><Check className="size-3" /> @{username.toLowerCase()} is yours</span>
    ) : avail === "taken" ? (
      <span className="inline-flex items-center gap-1.5 text-red-300"><X className="size-3" /> Already taken</span>
    ) : avail === "invalid" ? (
      "3–20 letters, numbers or underscores"
    ) : (
      "This is how you'll sign in, too"
    );

  return (
    <form action={action} className="space-y-5">
      <Field
        name="username"
        label="Username"
        placeholder="lubna"
        autoComplete="username"
        icon={User}
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
        error={state.fieldErrors?.username}
        hint={hint}
        maxLength={20}
        required
        autoFocus
      />
      <Field
        name="email"
        type="email"
        key={state.values?.email}
        defaultValue={state.values?.email}
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        icon={Mail}
        error={state.fieldErrors?.email}
        required
      />
      <PasswordField
        name="password"
        autoComplete="new-password"
        placeholder="Create a password"
        error={state.fieldErrors?.password}
        showMeter
        required
      />
      {state.error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}
      <Button type="submit" size="lg" className="group w-full rounded-xl" disabled={pending || avail === "taken"}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {pending ? "Setting the type…" : "Create my paper"}
        {!pending && <ArrowRight className="transition-transform group-hover:translate-x-1" />}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <AtSign className="size-3" /> We&apos;ll email you a confirmation and alert you to every sign-in.
      </p>
    </form>
  );
}
