import Link from "next/link";
import { ArrowRight, Brain, Download, Layers, Mail, MousePointerClick, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { AuthShowcase } from "@/components/auth/showcase";

const features = [
  { icon: Layers, title: "One paper, every source", body: "Dozens of publishers, newsletters and wires, gathered and set into a single edition each morning." },
  { icon: Brain, title: "It learns as you read", body: "Opens, likes, skips and saves quietly retune tomorrow's paper. See exactly what it has learned." },
  { icon: Sparkles, title: "Beyond your bubble", body: "Two stories a day from outside your interests. Like one and it joins your paper for good." },
  { icon: MousePointerClick, title: "Click through, or skip", body: "Every story links to the original. Skip what doesn't land — no infinite feed, ever." },
  { icon: Download, title: "A real newspaper PDF", body: "Download each edition laid out like a broadsheet: masthead, columns and all. Print it with your coffee." },
  { icon: Mail, title: "At your doorstep", body: "Your edition is printed at the hour you choose, with a short note in your inbox." },
];

export default async function Home() {
  const session = await auth();
  const authed = !!session?.user;
  return (
    <div className="min-h-dvh">
      <header className="px-3 pt-3 sm:px-6">
        <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-4 sm:px-5">
          <Logo />
          <div className="flex items-center gap-2">
            {authed ? (
              <Button asChild><Link href="/paper">Today&apos;s paper <ArrowRight /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/signin">Sign in</Link></Button>
                <Button asChild><Link href="/signup">Get your paper</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <div className="kicker">A personal morning paper</div>
          <h1 className="masthead text-gradient mt-5 text-6xl leading-[0.95] sm:text-7xl lg:text-8xl">
            The news, written for one.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
            News is scattered across a hundred tabs. The Morrow reads them all, keeps what matters to you, and sets it into one beautiful paper every morning — on the web or as a PDF.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="group">
              <Link href={authed ? "/paper" : "/signup"}>
                {authed ? "Read today's paper" : "Start my paper — free"} <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {!authed && (
              <Button asChild size="lg" variant="glass"><Link href="/signin">I already read it</Link></Button>
            )}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Two-minute setup · Sign in with Google · No feed, no ads</p>
        </div>
        <div className="relative hidden h-[560px] lg:block">
          <div className="absolute inset-0 [&>div]:p-0">
            <AuthShowcase />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="mb-10 text-center">
          <div className="kicker">How it works</div>
          <h2 className="masthead mt-3 text-4xl text-cream sm:text-5xl">Less scrolling. More knowing.</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass glass-hover rounded-3xl p-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-wine-400 to-wine-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
                <Icon className="size-5 text-cream" />
              </div>
              <h3 className="mt-5 font-serif text-xl text-cream">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="glass-strong sheen mt-16 rounded-[2rem] p-10 text-center sm:p-14">
          <h2 className="masthead text-4xl text-cream sm:text-5xl">Tomorrow&apos;s paper starts tonight.</h2>
          <p className="mx-auto mt-4 max-w-lg text-cream/70">Tell us what you care about. We&apos;ll take care of the rest — and get better at it every day.</p>
          <Button asChild size="lg" variant="champagne" className="mt-8">
            <Link href={authed ? "/paper" : "/signup"}>{authed ? "Open my paper" : "Create my paper"} <ArrowRight /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Morrow · Built for the NaSCon &apos;26 hackathon
      </footer>
    </div>
  );
}
