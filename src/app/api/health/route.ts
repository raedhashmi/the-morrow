import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activeProviders } from "@/server/providers";

/** Liveness + readiness check, used by CI smoke tests and the deploy workflow. */
export async function GET() {
  let database = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  return NextResponse.json(
    {
      status: database === "ok" ? "ok" : "degraded",
      database,
      providers: ["rss", "google-news", ...activeProviders()],
      email: process.env.RESEND_API_KEY ? "resend" : "console",
      googleSignIn: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      aiEditor: Boolean(process.env.ANTHROPIC_API_KEY),
      version: process.env.GIT_SHA?.slice(0, 7) ?? "dev",
    },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
