import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = (req.nextUrl.searchParams.get("u") || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return NextResponse.json({ available: false, valid: false });
  const taken = await db.user.findUnique({ where: { username: u }, select: { id: true } });
  return NextResponse.json({ available: !taken, valid: true });
}
