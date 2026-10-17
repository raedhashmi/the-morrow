import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-input bg-white/[0.04] px-4 text-[0.95rem] text-foreground backdrop-blur-md transition-all duration-300 outline-none placeholder:text-muted-foreground/70",
        "focus-visible:border-champagne/50 focus-visible:bg-white/[0.07] focus-visible:ring-4 focus-visible:ring-wine-400/20",
        "aria-invalid:border-destructive/70 aria-invalid:ring-destructive/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
