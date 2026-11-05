import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { randomInt, createHmac } from "node:crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { authOptions, otpDigest } from "./auth";
import { databaseConfigured, db } from "./db";
import { demoEvents, demoMembers, demoSosPosts, demoStats } from "./demo";
import { eventPhotoSchema, eventSchema, expenseSchema, isModerator, notificationAudience, otpRequestSchema, profileSchema, professions, publicAuthor, publicMember, publicMemberSelect, responseSchema, sosSchema, splitExpense, stripPrivateVerification, verificationSchema } from "./policy";
import { supportedRoute } from "./routes";

class ApiError extends Error { constructor(public status: number, message: string, public code = "REQUEST_FAILED") { super(message); } }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const authorSelect = { id: true, name: true, image: true } as const;
const sosInclude = { author: { select: authorSelect } } as const;
const withPublicAuthor = <T extends { author: { id: string; name: string | null; image: string | null } }>(record: T) => ({ ...record, author: publicAuthor(record.author) });

async function body(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "Send a JSON request body.");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) throw new ApiError(413, "Request is too large.");
  // Stream with a hard limit; never buffer an unbounded request body.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20_000) { await reader.cancel(); throw new ApiError(413, "Request is too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400, "Invalid JSON body."); }
}

function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
  if (!origin || origin !== expected) throw new ApiError(403, "Request origin could not be verified.", "INVALID_ORIGIN");
}

async function currentUser(required = false, verified = false) {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  const user = id ? await db().user.findUnique({ where: { id } }) : null;
  if (required && !user) throw new ApiError(401, "Sign in to continue.", "AUTH_REQUIRED");
  if (verified && user && !user.batchVerified) throw new ApiError(403, "Complete SSC 2013 batch verification to use this feature.", "VERIFICATION_REQUIRED");
  return user;
}

async function eventList(userId?: string, district?: string | null) {
  const events = await db().event.findMany({ where: { startsAt: { gte: new Date() }, ...(district && district !== "All" ? { district } : {}) }, orderBy: { startsAt: "asc" }, take: 50, include: { _count: { select: { rsvps: true } }, rsvps: { where: { userId: userId || "__anonymous__" }, select: { id: true } } } });
  return events.map(({ _count, rsvps, ...event }) => ({ ...event, attendeeCount: _count.rsvps, isAttending: Boolean(rsvps?.length) }));
}

async function requestOtp(request: Request) {
  if (!process.env.NEXTAUTH_SECRET || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) throw new ApiError(503, "Email sign-in is not configured yet. Please contact the community team.", "EMAIL_NOT_CONFIGURED");
  const { email } = otpRequestSchema.parse(await body(request));
  const code = randomInt(100000, 1000000).toString();
  // Only trust forwarded IPs behind a trusted deployment proxy. This supplements the email limit.
  const ip = request.headers.get("x-vercel-forwarded-for") || "unknown";
  const ipHash = createHmac("sha256", process.env.NEXTAUTH_SECRET).update(ip).digest("hex");
  const now = new Date();
  const otp = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
    const recent = await tx.emailOtp.count({ where: { email, createdAt: { gt: new Date(now.getTime() - 15 * 60000) } } });
    const lastMinute = await tx.emailOtp.count({ where: { email, createdAt: { gt: new Date(now.getTime() - 60000) } } });
    if (recent >= 5 || lastMinute) throw new ApiError(429, "Please wait before requesting another code.", "RATE_LIMITED");
    if (ip !== "unknown") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ip:${ipHash}`}))`;
      const byIp = await tx.emailOtp.count({ where: { ipHash, createdAt: { gt: new Date(now.getTime() - 15 * 60000) } } });
      if (byIp >= 20) throw new ApiError(429, "Too many code requests. Please try later.", "RATE_LIMITED");
    }
    await tx.emailOtp.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: now } });
    return tx.emailOtp.create({ data: { email, ipHash, digest: otpDigest(email, code), expiresAt: new Date(now.getTime() + 10 * 60000) } });
  });
  try {
    const mail = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    await mail.sendMail({ from: process.env.SMTP_FROM, to: email, subject: "Your SSC13BD sign-in code", text: `Your SSC13BD sign-in code is ${code}. It expires in 10 minutes. Do not share this code. If you did not request it, ignore this message.` });
  } catch {
    await db().emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    throw new ApiError(503, "The code could not be delivered. Please try again later.", "EMAIL_DELIVERY_FAILED");
  }
  return json({ ok: true, message: "Check your email for a six-digit code. It expires in 10 minutes." });
}

export async function handleApiRequest(request: Request, _context?: unknown): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api(?:\/|$)/, "").split("/").filter(Boolean);
    const route = path[0];
    const method = request.method;
    if (method !== "GET") verifyOrigin(request);
    if (!supportedRoute(method, path)) throw new ApiError(404, "Endpoint not found.", "NOT_FOUND");
    if (route === "config" && method === "GET") return json({ mode: databaseConfigured() ? "live" : "demo", emailAuthEnabled: Boolean(databaseConfigured() && process.env.NEXTAUTH_SECRET && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM), facebookAuthEnabled: Boolean(databaseConfigured() && process.env.NEXTAUTH_SECRET && process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) });
    if (!databaseConfigured()) {
      if (method !== "GET") throw new ApiError(503, "This is a read-only preview. Connect the database to save changes.", "DEMO_READ_ONLY");
      const demo = { mode: "demo", notice: "Read-only preview using illustrative community data." };
      if (route === "overview") return json({ ...demo, stats: demoStats, members: demoMembers, sosPosts: demoSosPosts, events: demoEvents });
      if (route === "directory") {
        const q = (url.searchParams.get("q") || "").toLowerCase();
        const profession = url.searchParams.get("profession");
        const district = url.searchParams.get("district");
        return json({ ...demo, professions, members: demoMembers.filter((m) => (!q || `${m.name} ${m.organization} ${m.profession} ${m.district}`.toLowerCase().includes(q)) && (!profession || profession === "All" || m.profession === profession) && (!district || district === "All" || m.district === district)) });
      }
      if (route === "sos" && path[2] === "responses") return json({ ...demo, responses: [] });
      if (route === "sos") {
        const category = url.searchParams.get("category");
        const status = url.searchParams.get("status") || "OPEN";
        return json({ ...demo, sosPosts: demoSosPosts.filter((post) => (!category || category === "All" || category === post.category) && (status === "ALL" || status === "All" || status === post.status)) });
      }
      if (route === "events" && path[2] === "photos") return json({ ...demo, photos: [] });
      if (route === "events") { const district = url.searchParams.get("district"); return json({ ...demo, events: demoEvents.filter((event) => !district || district === "All" || event.district === district) }); }
      if (route === "expenses") return json({ ...demo, expenses: [] });
      if (route === "notifications") return json({ ...demo, notifications: [] });
      if (route === "me") return json({ ...demo, user: null, verification: null });
      if (route === "verification") throw new ApiError(401, "Moderator sign-in is required.", "AUTH_REQUIRED");
      throw new ApiError(404, "Endpoint not found.");
    }
    if (route === "otp" && path[1] === "request" && method === "POST") return await requestOtp(request);
    if (route === "overview" && method === "GET") {
      const [members, sosPosts, events, count, districts, categories, openSos, upcomingEvents] = await Promise.all([
        db().user.findMany({ where: { batchVerified: true, directoryVisible: true }, select: publicMemberSelect, take: 6, orderBy: { createdAt: "desc" } }),
        db().sosPost.findMany({ where: { status: "OPEN" }, include: sosInclude, take: 3, orderBy: { createdAt: "desc" } }), eventList(),
        db().user.count({ where: { batchVerified: true } }),
        db().user.groupBy({ by: ["district"], where: { batchVerified: true, district: { not: null } } }),
        db().user.groupBy({ by: ["profession"], where: { batchVerified: true, profession: { not: null } } }),
        db().sosPost.count({ where: { status: "OPEN" } }),
        db().event.count({ where: { startsAt: { gte: new Date() } } }),
      ]);
      return json({ mode: "live", members: members.map(publicMember), sosPosts: sosPosts.map(withPublicAuthor), events: events.slice(0, 3), stats: { members: count, districts: districts.length, professions: categories.length, openSos, upcomingEvents } });
    }
    if (route === "directory" && method === "GET") {
      const q = (url.searchParams.get("q") || "").slice(0, 100);
      const profession = url.searchParams.get("profession");
      const district = url.searchParams.get("district");
      const members = await db().user.findMany({ where: { batchVerified: true, directoryVisible: true, ...(profession && profession !== "All" ? { profession } : {}), ...(district && district !== "All" ? { district } : {}), ...(q ? { OR: ["name", "organization", "profession", "district"].map((field) => ({ [field]: { contains: q, mode: "insensitive" as const } })) } : {}) }, select: publicMemberSelect, take: 100, orderBy: { name: "asc" } });
      return json({ mode: "live", members: members.map(publicMember), professions });
    }
    if (route === "sos" && !path[1] && method === "GET") {
      const category = url.searchParams.get("category");
      const status = z.enum(["OPEN", "RESOLVED", "ALL", "All"]).parse(url.searchParams.get("status") || "OPEN");
      const sosPosts = await db().sosPost.findMany({ where: { ...(status === "ALL" || status === "All" ? {} : { status }), ...(category && category !== "All" ? { category: sosSchema.shape.category.parse(category) } : {}) }, include: sosInclude, take: 100, orderBy: { createdAt: "desc" } });
      return json({ mode: "live", sosPosts: sosPosts.map(withPublicAuthor) });
    }
    if (route === "events" && !path[1] && method === "GET") { const user = await currentUser(); return json({ mode: "live", events: await eventList(user?.id, url.searchParams.get("district")) }); }
    const user = await currentUser(true, ["sos", "events", "expenses", "notifications"].includes(route));
    if (!user) throw new ApiError(401, "Sign in to continue.", "AUTH_REQUIRED");
    if (route === "me" && method === "GET") {
      const verification = await db().batchVerification.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      return json({ mode: "live", user, verification: verification ? stripPrivateVerification(verification) : null });
    }
    if (route === "me" && method === "PATCH") return json({ mode: "live", user: await db().user.update({ where: { id: user.id }, data: profileSchema.parse(await body(request)) }) });
    if (route === "verification" && !path[1] && method === "POST") {
      if (user.batchVerified) throw new ApiError(409, "Your batch identity is already verified.");
      const input = verificationSchema.parse(await body(request));
      const verification = await db().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`verify:${user.id}`}))`;
        const existing = await tx.batchVerification.findFirst({ where: { userId: user.id, status: "PENDING" } });
        if (existing) throw new ApiError(409, "You already have a verification request awaiting review.");
        // A rejected request with the same board/roll can be corrected and resubmitted by its owner.
        const previous = await tx.batchVerification.findUnique({ where: { board_roll_passingYear: { board: input.board, roll: input.roll, passingYear: 2013 } } });
        if (previous && (previous.userId !== user.id || previous.status !== "REJECTED")) throw new ApiError(409, "These board details already have a verification request. Contact a moderator for help.");
        return previous ? tx.batchVerification.update({ where: { id: previous.id }, data: { ...input, status: "PENDING", reviewNote: null, reviewedAt: null, reviewedById: null } }) : tx.batchVerification.create({ data: { ...input, userId: user.id } });
      });
      return json({ mode: "live", verification: stripPrivateVerification(verification) }, 201);
    }
    if (route === "verification") {
      if (!isModerator(user.role)) throw new ApiError(403, "Moderator access is required.", "MODERATOR_REQUIRED");
      if (method === "GET") return json({ mode: "live", requests: await db().batchVerification.findMany({ where: { status: "PENDING" }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" }, take: 100 }) });
      if (method === "PATCH" && path[1]) {
        const input = z.object({ status: z.enum(["APPROVED", "REJECTED"]), reviewNote: z.string().trim().min(5).max(1000) }).parse(await body(request));
        const verification = await db().$transaction(async (tx) => {
          const existing = await tx.batchVerification.findUnique({ where: { id: path[1] } });
          if (!existing) throw new ApiError(404, "Verification request not found.");
          if (existing.userId === user.id) throw new ApiError(403, "A different moderator must review your request.");
          const changed = await tx.batchVerification.updateMany({ where: { id: existing.id, status: "PENDING" }, data: { ...input, reviewedById: user.id, reviewedAt: new Date() } });
          if (!changed.count) throw new ApiError(409, "This request has already been reviewed.");
          if (input.status === "APPROVED") await tx.user.update({ where: { id: existing.userId }, data: { batchVerified: true } });
          return { id: existing.id, status: input.status };
        });
        return json({ mode: "live", verification });
      }
    }
    if (route === "sos" && !path[1] && method === "POST") {
      const input = sosSchema.parse(await body(request));
      const sosPost = await db().$transaction(async (tx) => {
        const post = await tx.sosPost.create({ data: { ...input, authorId: user.id }, include: sosInclude });
        const targets = await tx.user.findMany({ where: notificationAudience({ ...input, authorId: user.id }), select: { id: true } });
        if (targets.length) await tx.notification.createMany({ data: targets.map((target) => ({ userId: target.id, sosPostId: post.id })), skipDuplicates: true });
        return post;
      });
      return json({ mode: "live", sosPost: withPublicAuthor(sosPost) }, 201);
    }
    if (route === "sos" && path[1] && method === "PATCH") {
      z.object({ status: z.literal("RESOLVED") }).parse(await body(request));
      const result = await db().sosPost.updateMany({ where: { id: path[1], ...(isModerator(user.role) ? {} : { authorId: user.id }) }, data: { status: "RESOLVED" } });
      if (!result.count) throw new ApiError(404, "Request not found or you do not have access.");
      return json({ mode: "live", ok: true });
    }
    if (route === "sos" && path[1] && path[2] === "responses") {
      const post = await db().sosPost.findUnique({ where: { id: path[1] }, select: { id: true, authorId: true, status: true } });
      if (!post) throw new ApiError(404, "Help request not found.");
      if (method === "GET") { const responses = await db().sosResponse.findMany({ where: { sosPostId: post.id }, include: { author: { select: authorSelect } }, orderBy: { createdAt: "asc" }, take: 100 }); return json({ mode: "live", responses: responses.map(withPublicAuthor) }); }
      if (method === "POST") {
        if (post.status !== "OPEN") throw new ApiError(409, "This help request has been resolved.");
        const input = responseSchema.parse(await body(request));
        const response = await db().$transaction(async (tx) => {
          const response = await tx.sosResponse.create({ data: { sosPostId: post.id, authorId: user.id, ...input }, include: { author: { select: authorSelect } } });
          if (post.authorId !== user.id) await tx.notification.upsert({ where: { userId_sosPostId: { userId: post.authorId, sosPostId: post.id } }, create: { userId: post.authorId, sosPostId: post.id, message: `${user.name || "A batchmate"} offered help on your request.` }, update: { readAt: null, createdAt: new Date(), message: `${user.name || "A batchmate"} offered help on your request.` } });
          return response;
        });
        return json({ mode: "live", response: withPublicAuthor(response) }, 201);
      }
    }
    if (route === "notifications" && method === "GET") {
      const notifications = await db().notification.findMany({ where: { userId: user.id }, include: { sosPost: { include: sosInclude } }, take: 100, orderBy: { createdAt: "desc" } });
      return json({ mode: "live", notifications: notifications.map((notification) => ({ ...notification, sosPost: withPublicAuthor(notification.sosPost), title: notification.sosPost.title, body: notification.message || notification.sosPost.description })) });
    }
    if (route === "notifications" && path[1] && method === "PATCH") {
      await db().notification.updateMany({ where: { id: path[1], userId: user.id }, data: { readAt: new Date() } });
      return json({ mode: "live", ok: true });
    }
    if (route === "events" && !path[1] && method === "POST") {
      if (!isModerator(user.role)) throw new ApiError(403, "Trusted community organizers and moderators can create events.", "ORGANIZER_REQUIRED");
      return json({ mode: "live", event: await db().event.create({ data: { ...eventSchema.parse(await body(request)), creatorId: user.id } }) }, 201);
    }
    if (route === "events" && path[1] && path[2] === "photos") {
      const event = await db().event.findUnique({ where: { id: path[1] }, select: { id: true } });
      if (!event) throw new ApiError(404, "Event not found.");
      if (method === "GET") { const photos = await db().eventPhoto.findMany({ where: { eventId: event.id }, include: { uploader: { select: authorSelect } }, orderBy: { createdAt: "desc" }, take: 100 }); return json({ mode: "live", photos: photos.map((photo) => ({ ...photo, uploader: publicAuthor(photo.uploader) })) }); }
      if (method === "POST") {
        const input = eventPhotoSchema.parse(await body(request));
        const attendance = await db().rsvp.findUnique({ where: { eventId_userId: { eventId: event.id, userId: user.id } } });
        if (!attendance && user.role !== "ADMIN") throw new ApiError(403, "RSVP to this event before sharing a photo.", "ATTENDANCE_REQUIRED");
        const photo = await db().eventPhoto.create({ data: { eventId: event.id, uploaderId: user.id, ...input }, include: { uploader: { select: authorSelect } } });
        return json({ mode: "live", photo: { ...photo, uploader: publicAuthor(photo.uploader) } }, 201);
      }
    }
    if (route === "events" && path[1] && path[2] === "rsvp" && ["POST", "DELETE"].includes(method)) {
      const result = await db().$transaction(async (tx) => {
        // Serialize capacity checks for this event across every server instance.
        await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${path[1]} FOR UPDATE`;
        const event = await tx.event.findUnique({ where: { id: path[1] }, include: { _count: { select: { rsvps: true } } } });
        if (!event) throw new ApiError(404, "Event not found.");
        if (event.startsAt <= new Date()) throw new ApiError(409, "This event has already started.");
        if (method === "DELETE") { await tx.rsvp.deleteMany({ where: { eventId: event.id, userId: user.id } }); return { isAttending: false }; }
        const existing = await tx.rsvp.findUnique({ where: { eventId_userId: { eventId: event.id, userId: user.id } } });
        if (existing) return { isAttending: true };
        if (event._count.rsvps >= event.capacity) throw new ApiError(409, "This event is full.", "EVENT_FULL");
        await tx.rsvp.create({ data: { eventId: event.id, userId: user.id } });
        return { isAttending: true };
      });
      return json({ mode: "live", ...result });
    }
    if (route === "expenses" && method === "GET") {
      const expenses = await db().expense.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
      return json({ mode: "live", expenses: expenses.map((expense) => ({ ...expense, ...splitExpense(expense.totalPaisa, expense.participants) })) });
    }
    if (route === "expenses" && method === "POST") {
      const input = expenseSchema.parse(await body(request));
      const expense = await db().expense.create({ data: { ...input, ownerId: user.id } });
      return json({ mode: "live", expense: { ...expense, ...splitExpense(input.totalPaisa, input.participants) } }, 201);
    }
    throw new ApiError(404, "Endpoint not found.");
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message, code: error.code }, error.status);
    if (error instanceof z.ZodError) return json({ error: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "), code: "VALIDATION_FAILED" }, 422);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return json({ error: "This record already exists.", code: "CONFLICT" }, 409);
    // Do not return or log private identity details, query arguments, tokens or database URLs.
    console.error("SSC13BD API request failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "The service is temporarily unavailable. Please try again later.", code: "SERVICE_UNAVAILABLE" }, 503);
  }
}
