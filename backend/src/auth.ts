import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createHmac, timingSafeEqual } from "node:crypto";
import { databaseConfigured, db } from "./db";

// NextAuth v4 publishes CJS providers. Normalize the default for both Next's
// bundler and native ESM tooling used by the server-side verification suite.
const credentialsProvider = (CredentialsProvider as unknown as { default?: typeof CredentialsProvider }).default ?? CredentialsProvider;
const facebookProvider = (FacebookProvider as unknown as { default?: typeof FacebookProvider }).default ?? FacebookProvider;

export function otpDigest(email: string, code: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Authentication secret is not configured");
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

export const authOptions: NextAuthOptions = {
  ...(databaseConfigured() ? { adapter: PrismaAdapter(db()) } : {}),
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  logger: {
    error(code) { console.error("SSC13BD authentication failed", code); },
    warn(code) { console.warn("SSC13BD authentication warning", code); },
    debug() {},
  },
  pages: { signIn: "/?login=1", error: "/?login=1" },
  providers: [
    credentialsProvider({
      name: "Email verification code",
      credentials: { email: { label: "Email", type: "email" }, code: { label: "Code", type: "text" } },
      async authorize(credentials) {
        if (!databaseConfigured() || !process.env.NEXTAUTH_SECRET) return null;
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const code = credentials?.code?.trim() ?? "";
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) return null;
        const otp = await db().emailOtp.findFirst({ where: { email, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, orderBy: { createdAt: "desc" } });
        if (!otp) return null;
        // Atomic claim of an attempt prevents concurrent requests bypassing the limit.
        const attempt = await db().emailOtp.updateMany({ where: { id: otp.id, consumedAt: null, attempts: { lt: 5 }, expiresAt: { gt: new Date() } }, data: { attempts: { increment: 1 } } });
        if (attempt.count !== 1) return null;
        const expected = Buffer.from(otp.digest, "hex");
        const supplied = Buffer.from(otpDigest(email, code), "hex");
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
        const used = await db().emailOtp.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: new Date() } });
        if (used.count !== 1) return null;
        return db().user.upsert({ where: { email }, update: { emailVerified: new Date() }, create: { email, name: email.split("@")[0], emailVerified: new Date() } });
      },
    }),
    ...(databaseConfigured() && process.env.NEXTAUTH_SECRET && process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [facebookProvider({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })] : []),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.sub = user.id; return token; },
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as typeof session.user & { id: string }).id = token.sub;
      return session;
    },
  },
};
