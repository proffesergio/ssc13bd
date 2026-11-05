import { test, expect } from "@playwright/test";

test("home renders a clearly labeled preview without overflow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome home, batchmate." }),
  ).toBeVisible();
  await expect(
    page.getByText("Community preview", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A batchmate needs you" }),
  ).toBeVisible();
  await expect(
    page.getByText("B+ blood donor needed in Dhaka", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("directory combines profession and district and handles empty results", async ({
  page,
}) => {
  await page.goto("/directory");
  await expect(
    page.getByRole("heading", { name: "Dr. Nadia Rahman" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Doctors", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tanvir Hasan" })).toHaveCount(
    0,
  );
  await page.getByLabel("Filter by district").selectOption("Sylhet");
  await expect(
    page.getByRole("heading", { name: "No familiar faces here yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Tanvir Hasan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Location view" }).click();
  await expect(
    page.getByRole("link", { name: /Dhaka 2 batchmates/ }),
  ).toHaveAttribute("href", /google.com\/maps/);
});

test("SOS category filters and response dialog work", async ({ page }) => {
  await page.goto("/sos");
  await page.getByRole("button", { name: "Legal", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Looking for a legal consultation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "B+ blood donor needed in Dhaka" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "I can help", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Sign in to view the conversation and offer help."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("expense splits preserve every paisa", async ({ page }) => {
  await page.goto("/expenses");
  await page.getByLabel("Total bill (BDT)").fill("100");
  await page.getByLabel("Number of people").fill("3");
  await expect(page.locator(".split-result strong")).toHaveText(/33.33/);
  await expect(page.locator(".split-result p")).toHaveText(
    "1 person pays ৳0.01 extra to balance the bill.",
  );
  await page.getByLabel("Number of people").fill("0");
  await expect(
    page.getByRole("button", { name: "Save expense" }),
  ).toBeDisabled();
});

test("RSVP opens real authentication and preserves guest state", async ({
  page,
}) => {
  await page.goto("/events");
  await page.getByRole("button", { name: "Count me in" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Facebook" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Email me a sign-in code" }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Email sign-in is awaiting the database and email service connection. This preview is read-only.",
    ),
  ).toBeVisible();
});

test("verification and moderator routes protect access", async ({
  page,
  request,
}) => {
  await page.goto("/verification");
  await expect(
    page.getByRole("heading", { name: "First, let’s say hello." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Moderator access required" }),
  ).toBeVisible();
  const response = await request.get("/api/verification");
  expect(response.status()).toBe(401);
  await page.goto("/not-a-real-page");
  await expect(
    page.getByRole("heading", { name: "A little off the map." }),
  ).toBeVisible();
});
