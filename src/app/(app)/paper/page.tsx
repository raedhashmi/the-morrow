import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireReader } from "@/lib/session";
import { todayIn } from "@/lib/utils";
import { PrintToday } from "@/components/paper/print-today";

export const metadata = { title: "Today's paper" };

export default async function TodayPage() {
  const user = await requireReader();
  const edition = await db.edition.findUnique({
    where: { userId_date: { userId: user.id, date: todayIn(user.timezone) } },
    select: { id: true },
  });
  if (edition) redirect(`/paper/${edition.id}`);
  return <PrintToday />;
}
