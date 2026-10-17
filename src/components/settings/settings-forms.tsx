"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Brain, Loader2, Minus, Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordField } from "@/components/auth/fields";
import { DEPTHS, topicLabel } from "@/lib/topics";
import { cn, hourLabel } from "@/lib/utils";
import { adjustInterest, changePassword, removeInterest, savePreferences } from "@/app/(app)/settings/actions";

type Interest = { id: string; kind: "TOPIC" | "SOURCE" | "KEYWORD"; label: string; weight: number; origin: "ONBOARDING" | "LEARNED" };

const KIND_LABEL = { TOPIC: "Topics", KEYWORD: "People, things & ideas", SOURCE: "Sources you trust" } as const;

export function InterestBoard({ interests, signals }: { interests: Interest[]; signals: number }) {
  const [pending, start] = useTransition();
  const max = Math.max(2, ...interests.map((i) => i.weight));
  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Brain className="mt-1 size-5 text-champagne" />
          <div>
            <h2 className="masthead text-3xl text-cream">What your paper has learned</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Built from your choices and {signals} reading signals — opens, likes, skips and saves. Nudge anything that looks off.
            </p>
          </div>
        </div>
        <Button asChild variant="glass" size="sm">
          <Link href="/onboarding"><SlidersHorizontal /> Retune from scratch</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {(["TOPIC", "KEYWORD", "SOURCE"] as const).map((kind) => {
          const list = interests.filter((i) => i.kind === kind && i.weight > 0.01);
          return (
            <div key={kind}>
              <div className="kicker mb-3">{KIND_LABEL[kind]}</div>
              {list.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet — keep reading.</p>}
              <ul className="space-y-2.5">
                {list.slice(0, 14).map((i) => (
                  <li key={i.id} className={cn("rounded-xl border border-white/8 bg-white/[0.03] p-3 transition", pending && "opacity-70")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-cream">{kind === "TOPIC" ? topicLabel(i.label) : i.label}</span>
                      <div className="flex items-center gap-1">
                        {i.origin === "LEARNED" && <Badge variant="champagne">Learned</Badge>}
                        <button aria-label="Less" onClick={() => start(() => adjustInterest(i.id, -0.4))} className="grid size-6 place-items-center rounded-full text-cream/60 hover:bg-white/10 hover:text-cream"><Minus className="size-3.5" /></button>
                        <button aria-label="More" onClick={() => start(() => adjustInterest(i.id, 0.4))} className="grid size-6 place-items-center rounded-full text-cream/60 hover:bg-white/10 hover:text-cream"><Plus className="size-3.5" /></button>
                        <button aria-label="Remove" onClick={() => start(() => removeInterest(i.id))} className="grid size-6 place-items-center rounded-full text-cream/60 hover:bg-red-500/20 hover:text-red-200"><Trash2 className="size-3.5" /></button>
                      </div>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-wine-400 to-champagne transition-all duration-500" style={{ width: `${Math.max(4, (i.weight / max) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type Prefs = { deliveryHour: number; readingDepth: "BRIEF" | "STANDARD" | "DEEP"; emailDaily: boolean; emailSecurity: boolean; mutedWords: string; city: string };

export function PreferencesForm({ initial, timezone }: { initial: Prefs; timezone: string }) {
  const [p, setP] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="masthead text-3xl text-cream">Delivery & alerts</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hour">Delivery time ({timezone})</Label>
          <select id="hour" value={p.deliveryHour} onChange={(e) => setP({ ...p, deliveryHour: Number(e.target.value) })} className="h-12 w-full rounded-xl border border-input bg-white/[0.04] px-4 text-cream outline-none">
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h} className="bg-wine-900">{hourLabel(h)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="depth">Paper length</Label>
          <select id="depth" value={p.readingDepth} onChange={(e) => setP({ ...p, readingDepth: e.target.value as Prefs["readingDepth"] })} className="h-12 w-full rounded-xl border border-input bg-white/[0.04] px-4 text-cream outline-none">
            {DEPTHS.map((d) => <option key={d.id} value={d.id} className="bg-wine-900">{d.label} — {d.count} stories</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City for local news</Label>
          <Input id="city" value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} placeholder="Islamabad" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="muted">Never show stories mentioning</Label>
          <Input id="muted" value={p.mutedWords} onChange={(e) => setP({ ...p, mutedWords: e.target.value })} placeholder="celebrity gossip, spoilers" />
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div><div className="text-sm text-cream">Morning paper email</div><div className="text-xs text-muted-foreground">When your edition is ready</div></div>
          <Switch checked={p.emailDaily} onCheckedChange={(v) => setP({ ...p, emailDaily: v })} />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div><div className="text-sm text-cream">Sign-in alerts</div><div className="text-xs text-muted-foreground">Email me on every new sign-in</div></div>
          <Switch checked={p.emailSecurity} onCheckedChange={(v) => setP({ ...p, emailSecurity: v })} />
        </label>
      </div>
      <Button className="mt-6" disabled={pending} onClick={() => start(async () => { await savePreferences(p); toast.success("Preferences saved"); })}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Save preferences
      </Button>
    </section>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(async (prev: { error?: string; ok?: boolean } | undefined, fd: FormData) => {
    const r = await changePassword(prev, fd);
    if (r.ok) toast.success("Password updated — we've emailed you a confirmation.");
    return r;
  }, undefined);
  return (
    <section className="glass rounded-3xl p-6 sm:p-8">
      <h2 className="masthead text-3xl text-cream">{hasPassword ? "Change password" : "Set a password"}</h2>
      {!hasPassword && <p className="mt-1 text-sm text-muted-foreground">You signed up with Google. Add a password to sign in with your username too.</p>}
      <form action={action} className="mt-6 grid max-w-xl gap-5">
        {hasPassword && <PasswordField name="current" label="Current password" autoComplete="current-password" required />}
        <PasswordField name="next" label="New password" autoComplete="new-password" showMeter required />
        {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
        <Button type="submit" variant="glass" className="justify-self-start" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Update password
        </Button>
      </form>
    </section>
  );
}
