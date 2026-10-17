"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Bookmark, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/paper", label: "Today", icon: Newspaper },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/paper" ? path.startsWith("/paper") : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-300",
              active ? "bg-wine-500/70 text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]" : "text-cream/65 hover:text-cream",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
