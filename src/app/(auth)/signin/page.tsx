import type { Metadata } from "next";
import Link from "next/link";
import { googleEnabled } from "@/auth.config";
import { GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/signin-form";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already registered with a password. Sign in with it below.",
  AccessDenied: "Access was denied.",
  Configuration: "Sign-in is temporarily unavailable. Please try again shortly.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl = "/paper", error } = await searchParams;
  return (
    <div className="glass-strong rounded-[1.75rem] p-7 sm:p-9">
      <div className="kicker">Welcome back</div>
      <h1 className="masthead mt-3 text-4xl text-cream">Your morning awaits.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to read today&apos;s edition.</p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errors[error] ?? "Something went wrong. Please try again."}
        </div>
      )}

      {googleEnabled && (
        <div className="mt-7 space-y-6">
          <GoogleButton callbackUrl={callbackUrl} />
          <Separator label="or" />
        </div>
      )}
      <div className="mt-7">
        <SignInForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        New to The Morrow?{" "}
        <Link href="/signup" className="font-medium text-champagne underline-offset-4 hover:underline">
          Create your paper
        </Link>
      </p>
    </div>
  );
}
