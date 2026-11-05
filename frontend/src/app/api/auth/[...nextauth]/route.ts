import NextAuth from "next-auth";
import { authOptions } from "@ssc13bd/backend/auth";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 10;
const handler = NextAuth(authOptions);
async function authHandler(request: NextRequest, context: {params: Promise<{nextauth: string[]}>}) {
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    const { nextauth } = await context.params;
    if (request.method === "GET" && nextauth[0] === "session") return Response.json({});
    if (request.method === "GET" && nextauth[0] === "providers") return Response.json({});
    return Response.json({error:"Sign-in is awaiting database and provider configuration."},{status:503});
  }
  return handler(request, context);
}
export { authHandler as GET, authHandler as POST };
