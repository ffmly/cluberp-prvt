import { expect, test } from "@playwright/test";

test("negotiates Arabic from the browser language", async ({ browser }) => {
  const context = await browser.newContext({ locale: "ar-DZ" });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "أدِر الأندية الجامعية بوضوح وتحكّم." }),
  ).toBeVisible();

  await context.close();
});

test("renders the English landing page and localizes navigation", async ({ page }) => {
  await page.goto("/en");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", {
      name: "Run university clubs with clarity and control.",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Switch language to Arabic" }).click();
  await expect(page).toHaveURL(/\/ar$/);
});

test("keeps sign-up mode while switching locale", async ({ page }) => {
  await page.goto("/en/login?mode=sign-up");

  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Switch language to Arabic" }).click();

  await expect(page).toHaveURL(/\/ar\/login\?mode=sign-up$/);
  await expect(page.getByRole("heading", { name: "أنشئ حسابك" })).toBeVisible();
  await expect(page.getByLabel("الاسم الكامل")).toBeVisible();
});

test("does not render protected dashboard content without a session", async ({
  page,
}) => {
  await page.goto("/ar/dashboard");

  await expect(page).toHaveURL(/\/ar\/login$/);
  await expect(page.getByRole("heading", { name: "مرحبًا بعودتك" })).toBeVisible();
  await expect(page.getByText("مساحة التشغيل")).toHaveCount(0);
});
