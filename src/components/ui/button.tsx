import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-wine-400 via-wine-500 to-wine-600 text-primary-foreground shadow-[0_10px_30px_-10px_rgb(168_58_90/0.8),inset_0_1px_0_rgb(255_255_255/0.25)] hover:shadow-[0_14px_40px_-10px_rgb(168_58_90/0.95),inset_0_1px_0_rgb(255_255_255/0.3)] hover:brightness-110",
        glass:
          "glass text-foreground hover:bg-white/10 hover:border-champagne/30",
        outline: "border border-border bg-transparent hover:bg-white/5 hover:border-champagne/40",
        ghost: "hover:bg-white/8 text-foreground/80 hover:text-foreground",
        champagne:
          "bg-champagne text-wine-900 hover:brightness-105 shadow-[0_10px_30px_-12px_rgb(227_192_141/0.7)]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-champagne underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
