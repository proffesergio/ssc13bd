import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
const prisma = new PrismaClient();
try {
  const emails = (process.env.MODERATOR_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) throw new Error("Set MODERATOR_EMAILS to explicitly bootstrap trusted community moderators.");
  for (const email of emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("MODERATOR_EMAILS contains an invalid email address.");
    // Membership approval is deliberately separate from moderator access.
    await prisma.user.upsert({ where: { email }, update: { role: "MODERATOR" }, create: { email, name: "Community moderator", role: "MODERATOR" } });
  }
  console.log(`Configured ${emails.length} moderator account(s). No sample community records were inserted.`);
} finally {
  await prisma.$disconnect();
}
