import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildEdition, EditionError } from "@/server/edition";

export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { force } = (await req.json().catch(() => ({}))) as { force?: boolean };
  try {
    const edition = await buildEdition(session.user.id, { force: !!force });
    return NextResponse.json({ id: edition.id });
  } catch (err) {
    const message = err instanceof EditionError ? err.message : "Something went wrong while printing your paper.";
    if (!(err instanceof EditionError)) console.error("[editions] build failed", err);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
