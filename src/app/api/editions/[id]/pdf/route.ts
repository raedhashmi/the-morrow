import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderEditionPdf } from "@/server/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const edition = await db.edition.findFirst({
    where: { id, userId: session.user.id },
    include: { articles: { orderBy: { rank: "asc" } }, user: { select: { name: true, username: true, city: true } } },
  });
  if (!edition) return new Response("Not found", { status: 404 });
  const buffer = await renderEditionPdf({
    number: edition.number,
    date: edition.date,
    headline: edition.headline,
    editorNote: edition.editorNote,
    readerName: edition.user.name || edition.user.username || "you",
    city: edition.user.city,
    takeaways: (edition.takeaways as { articleId: string; point: string }[] | null) ?? [],
    articles: edition.articles,
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="the-morrow-${edition.date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
