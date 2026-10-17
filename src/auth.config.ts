import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/** Edge-safe part of the auth config (used by the proxy). */
export const authConfig = {
  pages: { signIn: "/signin", newUser: "/onboarding", error: "/signin" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: googleEnabled ? [Google({ allowDangerousEmailAccountLinking: true })] : [],
  callbacks: {
    authorized({ auth, request }) {
      const isAuthed = !!auth?.user;
      const { pathname } = request.nextUrl;
      const protectedPaths = ["/paper", "/archive", "/onboarding", "/settings", "/saved"];
      if (protectedPaths.some((p) => pathname.startsWith(p))) return isAuthed;
      if (isAuthed && (pathname === "/signin" || pathname === "/signup")) {
        return Response.redirect(new URL("/paper", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
