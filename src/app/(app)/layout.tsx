import { AppHeader } from "@/components/app-header";
import { requireReader } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireReader();
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6">{children}</main>
    </>
  );
}
