"use client";
import Link from "next/link";
import { LogOut, Settings, SlidersHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(app)/actions";

export function UserMenu({ user }: { user: { name: string | null; username: string | null; email: string; image: string | null } }) {
  const initial = (user.name || user.username || user.email)[0]?.toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-champagne/30 bg-gradient-to-br from-wine-400 to-wine-700 font-serif text-cream outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-champagne/50">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="font-serif text-base text-cream">{user.name || user.username}</div>
          <div className="text-xs text-muted-foreground">@{user.username} · {user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings /> Settings & interests</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding"><SlidersHorizontal /> Retune my paper</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOutAction()} className="text-red-200">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
