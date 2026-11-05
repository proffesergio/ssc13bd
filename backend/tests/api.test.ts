import assert from "node:assert/strict";
import test from "node:test";

// These API tests intentionally have no database and cannot touch deployed data.
delete process.env.DATABASE_URL;
delete process.env.NEXTAUTH_URL;
const { handleApiRequest } = await import("../src/index");

test("unconfigured deployment explicitly labels preview data", async () => {
  const response = await handleApiRequest(new Request("http://localhost:3000/api/overview"));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.mode, "demo");
  assert.match(data.notice, /illustrative/);
  assert.equal(data.stats.members, data.members.length);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("preview API never claims a successful persistent mutation", async () => {
  for (const path of ["sos", "events", "expenses", "verification", "events/demo-event-1/rsvp", "otp/request"]) {
    const response = await handleApiRequest(new Request(`http://localhost:3000/api/${path}`, { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify({}) }));
    assert.equal(response.status, 503, path);
    assert.equal((await response.json()).code, "DEMO_READ_ONLY", path);
  }
});

test("cross-origin mutations are rejected before handling input", async () => {
  const response = await handleApiRequest(new Request("http://localhost:3000/api/verification", { method: "POST", headers: { origin: "https://untrusted.example", "content-type": "application/json" }, body: JSON.stringify({}) }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "INVALID_ORIGIN");
});

test("preview moderator queue is protected and directory supports filters", async () => {
  const protectedResponse = await handleApiRequest(new Request("http://localhost:3000/api/verification"));
  assert.equal(protectedResponse.status, 401);
  const response = await handleApiRequest(new Request("http://localhost:3000/api/directory?profession=Doctor&district=Dhaka"));
  const data = await response.json();
  assert.ok(data.members.length > 0);
  assert.ok(data.members.every((member: { profession: string; district: string }) => member.profession === "Doctor" && member.district === "Dhaka"));
  const serialized = JSON.stringify(data);
  assert.equal(serialized.includes('"registration"'), false);
  assert.equal(serialized.includes('"roll"'), false);
  assert.equal(serialized.includes('"email"'), false);
});

test("preview feed filters match selected category, status and event district", async () => {
  const sos = await (await handleApiRequest(new Request("http://localhost:3000/api/sos?category=Legal"))).json();
  assert.ok(sos.sosPosts.length > 0);
  assert.ok(sos.sosPosts.every((post: { category: string }) => post.category === "Legal"));
  const resolved = await (await handleApiRequest(new Request("http://localhost:3000/api/sos?status=RESOLVED"))).json();
  assert.equal(resolved.sosPosts.length, 0);
  const events = await (await handleApiRequest(new Request("http://localhost:3000/api/events?district=Dhaka"))).json();
  assert.ok(events.events.length > 0);
  assert.ok(events.events.every((event: { district: string }) => event.district === "Dhaka"));
});

test("unknown nested routes never fall through to public collections or mutations", async () => {
  for (const path of ["sos/unknown", "sos/unknown/responses/extra", "events/unknown", "events/unknown/photos/extra", "directory/unknown", "verification/unknown"] ) {
    const response = await handleApiRequest(new Request(`http://localhost:3000/api/${path}`));
    assert.equal(response.status, 404, path);
    assert.equal((await response.json()).code, "NOT_FOUND", path);
  }
  const mutation = await handleApiRequest(new Request("http://localhost:3000/api/events/unknown/photos/extra", { method: "POST", headers: { origin: "http://localhost:3000" } }));
  assert.equal(mutation.status, 404);
});

test("route guards reject unknown live endpoints without accessing auth or database", async () => {
  process.env.DATABASE_URL = "postgresql://unused:unused@localhost:1/unused";
  try {
    const response = await handleApiRequest(new Request("http://localhost:3000/api/sos/unknown/unsupported"));
    assert.equal(response.status, 404);
    assert.equal((await response.json()).code, "NOT_FOUND");
  } finally { delete process.env.DATABASE_URL; }
});
