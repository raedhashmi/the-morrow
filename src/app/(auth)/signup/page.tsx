import type { Metadata } from "next";
import Link from "next/link";
import { googleEnabled } from "@/auth.config";
import { GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/signup-form";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Create your paper" };

export default function SignUpPage() {
  return (
    <div className="glass-strong rounded-[1.75rem] p-7 sm:p-9">
      <div className="kicker">Begin your subscription · free</div>
      <h1 className="masthead mt-3 text-4xl text-cream">A paper written for one.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Two minutes to set up. A better morning every day after.</p>
      {googleEnabled && (
        <div className="mt-7 space-y-6">
          <GoogleButton label="Sign up with Google" callbackUrl="/onboarding" />
          <Separator label="or with email" />
        </div>
      )}
      <div className="mt-7">
        <SignUpForm />
      </div>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Already a reader?{" "}
        <Link href="/signin" className="font-medium text-champagne underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
