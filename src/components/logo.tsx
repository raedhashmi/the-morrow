import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a83a5a" />
          <stop offset=".55" stopColor="#7a1a37" />
          <stop offset="1" stopColor="#3d0f1f" />
        </linearGradient>
        <linearGradient id="lm-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dcb2" />
          <stop offset="1" stopColor="#d9a965" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#lm-bg)" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1.2" />
      <path d="M17 35a15 15 0 0 1 30 0z" fill="url(#lm-sun)" />
      <g stroke="#f1d2a3" strokeWidth="2.4" strokeLinecap="round">
        <path d="M32 12.5v4.5" />
        <path d="M16.2 19.2l3.1 3.1" />
        <path d="M47.8 19.2l-3.1 3.1" />
      </g>
      <g stroke="#f8efe4" strokeLinecap="round">
        <path d="M12 39.5h40" strokeWidth="2.6" />
        <path d="M17 45.5h30" strokeWidth="2.2" strokeOpacity=".75" />
        <path d="M22 51h20" strokeWidth="2" strokeOpacity=".5" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
      <span className="masthead hidden text-[1.35rem] leading-none whitespace-nowrap text-cream min-[400px]:inline">The Morrow</span>
    </Link>
  );
}
