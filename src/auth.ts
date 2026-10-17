import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { sendSignInAlert, sendWelcomeEmail } from "@/server/email";
import { uniqueUsername } from "@/server/users";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_credentials";
}

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(8).max(200),
});

async function requestMeta() {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
    return { ip, agent: h.get("user-agent") };
  } catch {
    return { ip: null, agent: null };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email or username",
      credentials: { identifier: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidLogin();
        const id = parsed.data.identifier.toLowerCase();
        const user = await db.user.findFirst({
          where: id.includes("@") ? { email: id } : { username: id },
        });
        if (!user?.passwordHash) throw new InvalidLogin();
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) throw new InvalidLogin();
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // OAuth sign-ups arrive without a username — give them one.
      if (user.id && user.email) {
        const username = await uniqueUsername(user.name || user.email.split("@")[0]);
        await db.user.update({ where: { id: user.id }, data: { username } });
      }
    },
    async signIn({ user, account, isNewUser }) {
      if (!user?.email) return;
      const record = await db.user.findUnique({ where: { email: user.email } });
      const name = record?.name || record?.username || user.name || "reader";
      const meta = await requestMeta();
      const method = account?.provider === "google" ? "Google" : "Email & password";
      // Sign-up: one welcome email that doubles as the security notice.
      if (isNewUser) {
        await sendWelcomeEmail(user.email, name, { method, when: new Date(), ...meta });
        return;
      }
      // The automatic sign-in straight after a password sign-up is covered by the welcome email.
      const justCreated = record && Date.now() - record.createdAt.getTime() < 20_000;
      if (justCreated) return;
      if (record?.emailSecurity !== false) {
        await sendSignInAlert(user.email, name, { method, when: new Date(), ...meta });
      }
    },
  },
});
