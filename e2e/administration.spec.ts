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

  const universityCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: universityName }),
  });
  await universityCard
    .getByRole("link", { name: "Manage organization" })
    .click();

  await expect(page).toHaveURL(/\/en\/admin\/universities\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: universityName })).toBeVisible();

  const campusName = `E2E Main Campus ${uniqueSuffix}`;
  const campusCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New campus" }),
  });
  await campusCard.getByLabel("Unit name").fill(campusName);
  await campusCard.getByLabel("Unit code").fill("MAIN");
  await campusCard.getByLabel("Campus address").fill("Algiers");
  await campusCard.getByRole("button", { name: "Create campus" }).click();
  await expect(
    page.getByText("Organizational unit created successfully."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: campusName })).toBeVisible();

  const facultyName = `E2E Faculty ${uniqueSuffix}`;
  const facultyCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New faculty" }),
  });
  await facultyCard.getByLabel("Unit name").fill(facultyName);
  await facultyCard.getByLabel("Unit code").fill("SCI");
  await facultyCard.getByLabel("Campus").selectOption({ label: campusName });
  await facultyCard.getByRole("button", { name: "Create faculty" }).click();
  await expect(page.getByRole("heading", { name: facultyName })).toBeVisible();

  const departmentName = `E2E Department ${uniqueSuffix}`;
  const departmentCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New department" }),
  });
  await departmentCard.getByLabel("Unit name").fill(departmentName);
  await departmentCard.getByLabel("Unit code").fill("CS");
  await departmentCard
    .getByLabel("Faculty")
    .selectOption({ label: facultyName });
  await departmentCard
    .getByRole("button", { name: "Create department" })
    .click();
  await expect(page.getByRole("heading", { name: departmentName })).toBeVisible();
});
