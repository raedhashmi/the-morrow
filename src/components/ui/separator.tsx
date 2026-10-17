import * as React from "react";
import { cn } from "@/lib/utils";

function Separator({ className, label, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  if (!label) return <div role="separator" className={cn("h-px w-full bg-border", className)} {...props} />;
  return (
    <div role="separator" className={cn("flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground", className)} {...props}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
      {label}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

export { Separator };
