import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hourIn, todayIn } from "@/lib/utils";
import { buildEdition } from "@/server/edition";
import { sendPaperReadyEmail } from "@/server/email";

export const maxDuration = 300;

/**
 * Run hourly (see deploy/crontab). Prints today's paper for every reader whose
 * chosen delivery hour has arrived in their timezone, then emails them.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") || url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await db.user.findMany({ where: { onboarded: true } });
  const results: { user: string; status: string }[] = [];

  for (const u of users) {
    if (hourIn(u.timezone) < u.deliveryHour) continue;
    const date = todayIn(u.timezone);
    const existing = await db.edition.findUnique({ where: { userId_date: { userId: u.id, date } } });
    if (existing?.emailedAt) continue;
    try {
      const edition = existing ?? (await buildEdition(u.id));
      if (u.emailDaily) {
        const stories = await db.article.findMany({
          where: { editionId: edition.id, serendipity: false },
          orderBy: [{ isLead: "desc" }, { score: "desc" }],
          take: 5,
          select: { title: true, source: true },
        });
        await sendPaperReadyEmail(u.email, u.name || u.username || "reader", { ...edition, stories });
      }
      await db.edition.update({ where: { id: edition.id }, data: { emailedAt: new Date() } });
      results.push({ user: u.id, status: "delivered" });
    } catch (err) {
      console.error("[cron] failed for", u.id, err);
      results.push({ user: u.id, status: "failed" });
    }
  }
  return NextResponse.json({ ran: new Date().toISOString(), results });
}
