import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_TAGLINE } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "The Morrow gathers the stories you care about from across the web and sets them into one personal morning paper — to read online or download as a newspaper PDF.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = { themeColor: "#1d0911" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="ambient" aria-hidden />
        <div className="grain" aria-hidden />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
