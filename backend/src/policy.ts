import { z } from "zod";

export const professions = ["Doctor", "Lawyer", "Police", "Army", "Government", "Corporate"] as const;
export const boards = ["Dhaka", "Chattogram", "Cumilla", "Rajshahi", "Jashore", "Barishal", "Sylhet", "Dinajpur", "Madrasah", "Technical"] as const;
const cleanText = (min: number, max: number) => z.string().trim().min(min).max(max);
export const otpRequestSchema = z.object({ email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()) });
export const verificationSchema = z.object({ board: z.enum(boards), roll: z.string().trim().regex(/^\d{5,10}$/), registration: z.string().trim().regex(/^\d{6,20}$/), school: cleanText(3, 160), passingYear: z.literal(2013).default(2013) });
export const sosSchema = z.object({ title: cleanText(8, 140), description: cleanText(20, 2000), category: z.enum(["Blood", "Medical", "Legal", "Emergency", "Career", "Other"]), district: cleanText(2, 64), targetProfession: z.enum(professions).optional(), urgency: z.enum(["urgent", "normal"]).default("urgent") });
export const eventSchema = z.object({ title: cleanText(5, 160), description: cleanText(20, 4000), location: cleanText(3, 200), district: cleanText(2, 64), startsAt: z.string().datetime().refine((v) => new Date(v) > new Date(), "Event must be in the future"), capacity: z.number().int().min(2).max(10000), category: z.enum(["Meetup", "Reunion", "Workshop", "Volunteering"]).default("Meetup") });
export const expenseSchema = z.object({ title: cleanText(2, 140), totalPaisa: z.number().int().min(1).max(100_000_000), participants: z.number().int().min(1).max(10000) });
export const responseSchema = z.object({ message: cleanText(5, 1500) });
export const eventPhotoSchema = z.object({ url: z.string().trim().url().max(2000).refine((value) => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }, "Use a public HTTPS photo URL without credentials"), caption: cleanText(3, 240) });
export const profileSchema = z.object({ name: cleanText(2, 100), district: cleanText(2, 64), profession: z.enum(professions), organization: cleanText(0, 160).optional(), bio: cleanText(0, 500).optional(), bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).optional(), directoryVisible: z.boolean(), contactEmail: z.string().trim().email().max(254).or(z.literal("")).optional(), contactPhone: z.string().trim().regex(/^[+\d\s()-]{0,24}$/).optional() });
export function isModerator(role: string) { return role === "MODERATOR" || role === "ADMIN"; }
export function notificationAudience(post: { district: string; targetProfession?: string | null; authorId: string }) {
  return { batchVerified: true, district: post.district, id: { not: post.authorId }, ...(post.targetProfession ? { profession: post.targetProfession } : {}) };
}
export function splitExpense(totalPaisa: number, participants: number) {
  if (!Number.isSafeInteger(totalPaisa) || totalPaisa < 1 || !Number.isSafeInteger(participants) || participants < 1) throw new Error("Invalid split");
  return { perPersonPaisa: Math.floor(totalPaisa / participants), remainderPaisa: totalPaisa % participants };
}
export const publicMemberSelect = { id: true, name: true, image: true, district: true, profession: true, organization: true, bio: true, bloodGroup: true, batchVerified: true } as const;
export function publicMember(member: { id: string; name: string | null; image: string | null; district: string | null; profession: string | null; organization: string | null; bio: string | null; bloodGroup: string | null; batchVerified: boolean }) {
  return { id: member.id, name: member.name?.trim() || "Batchmate", image: member.image, district: member.district?.trim() || "District not shared", profession: member.profession?.trim() || "Profession not shared", organization: member.organization || "", bio: member.bio || "", bloodGroup: member.bloodGroup || "", batchVerified: member.batchVerified };
}
export function publicAuthor(author: { id: string; name: string | null; image: string | null }) {
  return { id: author.id, name: author.name?.trim() || "Batchmate", image: author.image };
}
export function stripPrivateVerification<T extends { id: string; status: string; school: string; passingYear: number; createdAt: Date; reviewNote: string | null }>(record: T) {
  return { id: record.id, status: record.status, school: record.school, passingYear: record.passingYear, createdAt: record.createdAt, reviewNote: record.reviewNote };
}
