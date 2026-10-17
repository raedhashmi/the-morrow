import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass-strong max-w-md rounded-[2rem] p-10 text-center">
        <div className="kicker">Stop the presses</div>
        <h1 className="masthead mt-3 text-5xl text-cream">Page not found</h1>
        <p className="mt-3 text-muted-foreground">This edition seems to have gone out of print.</p>
        <Button asChild className="mt-6"><Link href="/paper">Back to today&apos;s paper</Link></Button>
      </div>
    </main>
  );
}
