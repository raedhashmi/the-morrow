import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordInteraction } from "@/server/learning";
import { todayIn } from "@/lib/utils";

const schema = z.object({
  articleId: z.string().min(1),
  type: z.enum(["OPEN", "LIKE", "DISLIKE", "SKIP", "SAVE", "HIDE_TOPIC", "RECALL_CORRECT", "RECALL_WRONG"]),
  undo: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { articleId, type, undo } = parsed.data;

  if (undo) {
    // Undo removes the record (e.g. un-saving); interest weights settle naturally over time.
    await db.interaction.deleteMany({ where: { userId, articleId, type } });
    return NextResponse.json({ ok: true });
  }

  const article = await recordInteraction(userId, articleId, type);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reading streak: first open of the day counts.
  if (type === "OPEN") {
    const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true, lastReadDate: true, streak: true } });
    if (user) {
      const today = todayIn(user.timezone);
      if (user.lastReadDate !== today) {
        const yesterday = todayIn(user.timezone, new Date(Date.now() - 86_400_000));
        await db.user.update({
          where: { id: userId },
          data: { lastReadDate: today, streak: user.lastReadDate === yesterday ? user.streak + 1 : 1 },
        });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
