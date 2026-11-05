import assert from "node:assert/strict";
import test from "node:test";
import { eventPhotoSchema, eventSchema, expenseSchema, isModerator, notificationAudience, profileSchema, publicAuthor, publicMember, publicMemberSelect, responseSchema, splitExpense, stripPrivateVerification, verificationSchema } from "../src/policy";

test("verification accepts only SSC 2013 and validates private board identifiers", () => {
  const valid = { board: "Dhaka", roll: "123456", registration: "1234567890", school: "Example High School", passingYear: 2013 };
  assert.equal(verificationSchema.parse(valid).passingYear, 2013);
  assert.equal(verificationSchema.safeParse({ ...valid, passingYear: 2014 }).success, false);
  assert.equal(verificationSchema.safeParse({ ...valid, roll: "abc123" }).success, false);
  assert.equal(verificationSchema.safeParse({ ...valid, board: "Unknown" }).success, false);
});

test("public member projection never includes board identifiers, login email, or contact data", () => {
  for (const key of ["email", "roll", "registration", "contactEmail", "contactPhone", "verifications", "role"]) assert.equal(key in publicMemberSelect, false);
});

test("nullable profiles have safe display values without inventing professional qualifications", () => {
  const source = { id: "m1", name: null, district: null, profession: null, organization: null, bio: null, bloodGroup: null, image: null, batchVerified: true, email: "private@example.com", roll: "123456" };
  const member = publicMember(source);
  assert.equal(member.name, "Batchmate");
  assert.equal(member.district, "District not shared");
  assert.equal(member.profession, "Profession not shared");
  assert.equal("email" in member, false);
  assert.equal("roll" in member, false);
  assert.equal(publicAuthor(source).name, "Batchmate");
});

test("owner verification status omits board roll and registration", () => {
  const result = stripPrivateVerification({ id: "v1", status: "PENDING", school: "Example High School", passingYear: 2013, createdAt: new Date(), reviewNote: null, board: "Dhaka", roll: "123456", registration: "1234567890" });
  assert.equal("roll" in result, false);
  assert.equal("registration" in result, false);
  assert.equal(result.status, "PENDING");
});

test("SOS notifications target verified matching district and profession only", () => {
  const post = { authorId: "author", district: "Dhaka", targetProfession: "Doctor" };
  const where = notificationAudience(post);
  assert.deepEqual(where, { batchVerified: true, district: "Dhaka", profession: "Doctor", id: { not: "author" } });
  assert.equal("profession" in notificationAudience({ ...post, targetProfession: undefined }), false);
});

test("only moderator and admin roles authorize verification review", () => {
  assert.equal(isModerator("MEMBER"), false);
  assert.equal(isModerator("MODERATOR"), true);
  assert.equal(isModerator("ADMIN"), true);
  assert.equal(isModerator("moderator"), false);
});

test("profile input cannot promote roles or approve identity", () => {
  const parsed = profileSchema.parse({ name: "Test Person", district: "Dhaka", profession: "Doctor", directoryVisible: true, role: "ADMIN", batchVerified: true });
  assert.equal("role" in parsed, false);
  assert.equal("batchVerified" in parsed, false);
});

test("expense splits conserve paisa exactly, including remainders", () => {
  const result = splitExpense(10000, 3);
  assert.deepEqual(result, { perPersonPaisa: 3333, remainderPaisa: 1 });
  assert.equal(result.perPersonPaisa * 3 + result.remainderPaisa, 10000);
  assert.throws(() => splitExpense(100, 0));
  assert.equal(expenseSchema.safeParse({ title: "Dinner", totalPaisa: 10.5, participants: 3 }).success, false);
  assert.equal(expenseSchema.safeParse({ title: "Dinner", totalPaisa: -10, participants: 3 }).success, false);
});

test("events reject past dates and invalid capacity", () => {
  const event = { title: "Batch meetup", description: "A small gathering for our batchmates", location: "Dhanmondi", district: "Dhaka", startsAt: "2020-01-01T10:00:00.000Z", capacity: 20 };
  assert.equal(eventSchema.safeParse(event).success, false);
  assert.equal(eventSchema.safeParse({ ...event, startsAt: "2099-01-01T10:00:00.000Z", capacity: 0 }).success, false);
  assert.equal(eventSchema.safeParse({ ...event, startsAt: "2099-01-01T10:00:00.000Z" }).success, true);
});

test("photo sharing requires credential-free HTTPS URLs and captions", () => {
  assert.equal(eventPhotoSchema.safeParse({ url: "https://images.example.com/reunion.jpg", caption: "Our batch reunion" }).success, true);
  for (const url of ["http://images.example.com/photo.jpg", "javascript:alert(1)", "https://secret:password@example.com/photo.jpg"]) assert.equal(eventPhotoSchema.safeParse({ url, caption: "Batch reunion" }).success, false);
});

test("help offers require a substantive message and reject oversized content", () => {
  assert.equal(responseSchema.safeParse({ message: "I can help; please share more details here." }).success, true);
  assert.equal(responseSchema.safeParse({ message: "hi" }).success, false);
  assert.equal(responseSchema.safeParse({ message: "a".repeat(1501) }).success, false);
});
