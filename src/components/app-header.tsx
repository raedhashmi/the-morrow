import Link from "next/link";
import { Flame } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { NavLinks } from "@/components/nav-links";

export function AppHeader({ user }: { user: { name: string | null; username: string | null; email: string; image: string | null; streak: number } }) {
  return (
    <header className="no-print sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="glass-strong mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 sm:px-5">
        <Logo href="/paper" />
        <NavLinks />
        <div className="flex items-center gap-2">
          {user.streak > 1 && (
            <Link href="/archive" title={`${user.streak}-day reading streak`} className="hidden items-center gap-1 rounded-full border border-champagne/25 bg-champagne/10 px-3 py-1 text-xs text-champagne sm:inline-flex">
              <Flame className="size-3.5" /> {user.streak}
            </Link>
          )}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
