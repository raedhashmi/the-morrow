"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Heart, Loader2, MapPin, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEPTHS, PERSONAS, REGIONS, TOPICS, TOPIC_GROUPS } from "@/lib/topics";
import { cn, hourLabel } from "@/lib/utils";
import { saveOnboarding } from "@/app/onboarding/actions";
import { PrintingPress } from "@/components/paper/printing-press";

type State = {
  name: string;
  persona: string | null;
  topics: { id: string; loved: boolean }[];
  keywords: string[];
  city: string;
  region: string;
  depth: "BRIEF" | "STANDARD" | "DEEP";
  deliveryHour: number;
  emailDaily: boolean;
};

const STEPS = ["You", "Interests", "Specifics", "Rhythm"] as const;

const TZ_REGION: Record<string, string> = {
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Europe/London": "GB",
  "Asia/Dubai": "AE",
  "Australia/Sydney": "AU",
  "America/Toronto": "CA",
};

export function OnboardingWizard({ initial, returning }: { initial: State; returning: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(initial);
  const [kw, setKw] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [pending, start] = useTransition();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    // Detect the browser's timezone after hydration (the server can't know it).
    const id = requestAnimationFrame(() => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setTimezone(tz);
      if (!returning && TZ_REGION[tz]) setS((p) => ({ ...p, region: TZ_REGION[tz] }));
    });
    return () => cancelAnimationFrame(id);
  }, [returning]);

  const selected = useMemo(() => new Map(s.topics.map((t) => [t.id, t])), [s.topics]);

  function cycleTopic(id: string) {
    setS((p) => {
      const cur = p.topics.find((t) => t.id === id);
      if (!cur) return { ...p, topics: [...p.topics, { id, loved: false }] };
      if (!cur.loved) return { ...p, topics: p.topics.map((t) => (t.id === id ? { ...t, loved: true } : t)) };
      return { ...p, topics: p.topics.filter((t) => t.id !== id) };
    });
  }

  function addKeyword() {
    const k = kw.trim();
    if (k.length < 2 || s.keywords.includes(k.toLowerCase()) || s.keywords.length >= 10) return;
    setS((p) => ({ ...p, keywords: [...p.keywords, k.toLowerCase()] }));
    setKw("");
  }

  const canNext = [s.name.trim().length > 0, s.topics.length >= 3, true, true][step];

  function finish() {
    start(async () => {
      const res = await saveOnboarding({ ...s, timezone });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setPrinting(true);
      const r = await fetch("/api/editions", { method: "POST", body: JSON.stringify({ force: returning }) });
      const data = (await r.json()) as { id?: string; error?: string };
      if (data.id) router.push(`/paper/${data.id}`);
      else {
        toast.error(data.error ?? "We'll have your paper ready shortly.");
        router.push("/paper");
      }
    });
  }

  if (printing) return <PrintingPress />;

  return (
    <div className="mx-auto mt-8 max-w-3xl pb-20 sm:mt-14">
      {/* progress */}
      <div className="mb-8 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-wine-400 to-champagne transition-all duration-700"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
            <span className={cn("text-[0.68rem] uppercase tracking-[0.2em]", i <= step ? "text-champagne" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div key={step} className="glass-strong rounded-[2rem] p-6 animate-in fade-in-0 slide-in-from-right-6 duration-500 sm:p-10">
        {step === 0 && (
          <section>
            <div className="kicker">Step one</div>
            <h1 className="masthead mt-3 text-4xl text-cream sm:text-5xl">Who&apos;s reading?</h1>
            <p className="mt-3 text-muted-foreground">Your paper will greet you by name and write for the way you read.</p>
            <div className="mt-8 space-y-2">
              <Label htmlFor="name">What should we call you?</Label>
              <Input id="name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="Your first name" autoFocus className="h-14 text-lg" />
            </div>
            <div className="mt-8">
              <Label>Which describes you best? <span className="text-muted-foreground">(optional)</span></Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setS({ ...s, persona: s.persona === p.label ? null : p.label })}
                    className={cn(
                      "glass glass-hover rounded-2xl p-4 text-left",
                      s.persona === p.label && "border-champagne/60 bg-champagne/10 ring-1 ring-champagne/30",
                    )}
                  >
                    <div className="font-serif text-lg text-cream">{p.label}</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.blurb}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <div className="kicker">Step two</div>
            <h1 className="masthead mt-3 text-4xl text-cream sm:text-5xl">What do you care about?</h1>
            <p className="mt-3 text-muted-foreground">
              Tap to follow. Tap again to <Heart className="inline size-3.5 fill-wine-300 text-wine-300" /> love it — loved topics lead your paper. Choose at least three.
            </p>
            <div className="mt-8 space-y-6">
              {TOPIC_GROUPS.map((g) => (
                <div key={g}>
                  <div className="mb-3 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">{g}</div>
                  <div className="flex flex-wrap gap-2.5">
                    {TOPICS.filter((t) => t.group === g).map((t) => {
                      const sel = selected.get(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => cycleTopic(t.id)}
                          className={cn(
                            "group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all duration-300 active:scale-95",
                            !sel && "border-white/12 bg-white/[0.04] text-cream/80 hover:border-champagne/40 hover:bg-white/[0.08]",
                            sel && !sel.loved && "border-wine-300/60 bg-wine-500/35 text-cream shadow-[0_8px_24px_-12px_rgb(168_58_90)]",
                            sel?.loved && "border-champagne/70 bg-gradient-to-br from-wine-400/60 to-wine-600/60 text-cream shadow-[0_8px_30px_-10px_rgb(227_192_141/0.6)]",
                          )}
                        >
                          <span>{t.emoji}</span>
                          {t.label}
                          {sel?.loved && <Heart className="size-3.5 fill-champagne text-champagne animate-in zoom-in-50" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              {s.topics.length} selected{s.topics.length < 3 ? ` · ${3 - s.topics.length} more to go` : " · looking good"}
            </p>
          </section>
        )}

        {step === 2 && (
          <section>
            <div className="kicker">Step three</div>
            <h1 className="masthead mt-3 text-4xl text-cream sm:text-5xl">Anything specific?</h1>
            <p className="mt-3 text-muted-foreground">
              People, teams, companies, technologies — we&apos;ll watch the whole web for them. Try “solar inverters”, “Rust”, “Babar Azam”.
            </p>
            <div className="mt-8 flex gap-2">
              <Input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Add something to follow…"
                maxLength={40}
              />
              <Button type="button" variant="glass" size="lg" className="rounded-xl" onClick={addKeyword}>
                <Plus /> Add
              </Button>
            </div>
            <div className="mt-4 flex min-h-10 flex-wrap gap-2">
              {s.keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-champagne/10 py-1.5 pr-2 pl-3.5 text-sm text-champagne animate-in zoom-in-90">
                  {k}
                  <button type="button" aria-label={`Remove ${k}`} onClick={() => setS({ ...s, keywords: s.keywords.filter((x) => x !== k) })} className="rounded-full p-0.5 hover:bg-white/10">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Your city, for local news <span className="text-muted-foreground">(optional)</span></Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="city" value={s.city} onChange={(e) => setS({ ...s, city: e.target.value })} placeholder="Islamabad" className="pl-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">News edition</Label>
                <select
                  id="region"
                  value={s.region}
                  onChange={(e) => setS({ ...s, region: e.target.value })}
                  className="h-12 w-full rounded-xl border border-input bg-white/[0.04] px-4 text-cream outline-none focus:border-champagne/50"
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-wine-900">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <div className="kicker">Last step</div>
            <h1 className="masthead mt-3 text-4xl text-cream sm:text-5xl">Your morning rhythm</h1>
            <p className="mt-3 text-muted-foreground">How long do you have with your paper?</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {DEPTHS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setS({ ...s, depth: d.id })}
                  className={cn(
                    "glass glass-hover rounded-2xl p-5 text-left",
                    s.depth === d.id && "border-champagne/60 bg-champagne/10 ring-1 ring-champagne/30",
                  )}
                >
                  <div className="masthead text-2xl text-cream">{d.label}</div>
                  <div className="mt-1 text-sm text-champagne">~{d.minutes} min · {d.count} stories</div>
                  <div className="mt-2 text-xs text-muted-foreground">{d.blurb}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 grid items-end gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hour">Deliver my paper at</Label>
                <select
                  id="hour"
                  value={s.deliveryHour}
                  onChange={(e) => setS({ ...s, deliveryHour: Number(e.target.value) })}
                  className="h-12 w-full rounded-xl border border-input bg-white/[0.04] px-4 text-cream outline-none focus:border-champagne/50"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h} className="bg-wine-900">
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Your time zone: {timezone}</p>
              </div>
              <label className="glass flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4">
                <div>
                  <div className="text-sm text-cream">Email me when it&apos;s ready</div>
                  <div className="text-xs text-muted-foreground">A short note with the top stories</div>
                </div>
                <Switch checked={s.emailDaily} onCheckedChange={(v) => setS({ ...s, emailDaily: v })} />
              </label>
            </div>
          </section>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((x) => x - 1)} disabled={step === 0 || pending} className={cn(step === 0 && "invisible")}>
            <ArrowLeft /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" onClick={() => setStep((x) => x + 1)} disabled={!canNext} className="group">
              Continue <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button type="button" size="lg" variant="champagne" onClick={finish} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {returning ? "Reprint today's paper" : "Print my first edition"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
