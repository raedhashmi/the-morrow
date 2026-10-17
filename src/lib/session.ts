import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireReader() {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  return user;
}
