"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  icon: Icon,
  aside,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  aside?: React.ReactNode;
}) {
  const id = props.id || props.name;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />}
        <Input id={id} aria-invalid={!!error} className={cn(Icon && "pl-11")} {...props} />
      </div>
      {error ? (
        <p className="text-xs text-red-300 animate-in fade-in-0 slide-in-from-top-1">{error}</p>
      ) : hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label = "Password",
  error,
  showMeter,
  aside,
  ...props
}: React.ComponentProps<"input"> & { label?: string; error?: string; showMeter?: boolean; aside?: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  const [value, setValue] = React.useState("");
  const score = strength(value);
  const id = props.id || props.name;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className="pr-12"
          onChange={(e) => setValue(e.target.value)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-cream"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showMeter && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-white/10 transition-all duration-500",
                  value && i < score && ["bg-red-400", "bg-orange-300", "bg-champagne", "bg-emerald-400"][score - 1],
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {value ? ["Too weak", "Weak", "Good", "Strong", "Excellent"][score] : "8+ characters with a letter and a number"}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return Math.min(s, 4);
}
