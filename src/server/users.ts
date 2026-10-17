import "server-only";
import { db } from "@/lib/db";

export function slugUsername(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9_]+/g, "")
      .slice(0, 20) || "reader"
  );
}

export async function uniqueUsername(seed: string) {
  const base = slugUsername(seed);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}${Math.floor(Math.random() * 9000 + 100)}`;
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}
