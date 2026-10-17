import { Logo } from "@/components/logo";
import { AuthShowcase } from "@/components/auth/showcase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/5 lg:block">
        <AuthShowcase />
      </section>
      <section className="relative flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[440px] animate-in fade-in-0 slide-in-from-bottom-4 duration-700">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Morrow · Crafted with care in Islamabad
        </p>
      </section>
    </main>
  );
}
