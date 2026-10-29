import { expect, test } from "@playwright/test";

test("platform manager creates a university through the protected workflow", async ({
  page,
}) => {
  const uniqueSuffix = Date.now().toString();
  const universityName = `E2E University ${uniqueSuffix}`;
  const universitySlug = `e2e-university-${uniqueSuffix}`;

  await page.goto("/en/login");
  await page.getByLabel("University email").fill("platform-admin@example.test");
  await page.getByLabel("Password").fill("PlatformTest!2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(
    page.getByText("Platform administration is available"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open administration" }).click();

  await expect(page).toHaveURL(/\/en\/admin$/);
  await expect(
    page.getByRole("heading", { name: "A clear view of every university." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Manage universities" }).click();

  const createSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Create a university" }),
  });
  await createSection.getByLabel("University name").fill(universityName);
  await createSection.getByLabel("URL slug").fill(universitySlug);
  await createSection.getByLabel("Operating status").selectOption("active");
  await createSection.getByRole("button", { name: "Create university" }).click();

  await expect(page.getByText("University created successfully.")).toBeVisible();
  await expect(page.getByRole("heading", { name: universityName })).toBeVisible();
  await expect(page.getByText(universitySlug)).toBeVisible();
});
