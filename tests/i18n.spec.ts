// tests/i18n.spec.ts — Verifies internationalisation works across all built-in languages
// Run: npx playwright test tests/i18n.spec.ts

import { test, expect } from "@playwright/test";

// Sample strings from each locale to verify switching works
const LOCALE_CHECKS: Record<string, { restart: string; share: string; menu: string; language: string }> = {
  en: { restart: "Restart", share: "Share", menu: "Menu", language: "Language" },
  zh: { restart: "重新开始", share: "分享", menu: "菜单", language: "语言" },
  hi: { restart: "फिर से शुरू करें", share: "शेयर करें", menu: "मेनू", language: "भाषा" },
};

test.describe("i18n — Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved language preference
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("lang"));
    await page.reload();
    await page.waitForTimeout(500);
  });

  test("defaults to English", async ({ page }) => {
    // Menu button should have English title
    const menuBtn = page.locator('button[title="Menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole("button", { name: "Restart" })).toBeVisible();
  });

  test("menu button is visible in toolbar", async ({ page }) => {
    const menuBtn = page.locator('button[title="Menu"]');
    await expect(menuBtn).toBeVisible({ timeout: 5000 });
  });

  test("language dropdown opens and shows only supported languages", async ({ page }) => {
    const menuBtn = page.locator('button[title="Menu"]');
    await menuBtn.click();
    await page.getByRole("button", { name: "Language" }).click();

    // Only English, Chinese, and Hindi should be visible
    await expect(page.locator("text=English")).toBeVisible();
    await expect(page.locator("text=中文")).toBeVisible();
    await expect(page.locator("text=हिन्दी")).toBeVisible();
    await expect(page.locator("text=Español")).toHaveCount(0);
    await expect(page.locator("text=Русский")).toHaveCount(0);
    await expect(page.getByText("Other...")).toHaveCount(0);
  });

  for (const [locale, expected] of Object.entries(LOCALE_CHECKS)) {
    test(`switches to ${locale} and verifies UI text`, async ({ page }) => {
      // Open menu then language picker
      const menuBtn = page.locator('button[title="Menu"]');
      await menuBtn.click();
      await page.getByRole("button", { name: expected.language }).click();

      // Get the locale name map
      const names: Record<string, string> = { en: "English", zh: "中文", hi: "हिन्दी" };
      await page.getByText(names[locale]).click();

      // Wait for re-render
      await page.waitForTimeout(300);

      // Check menu items are translated
      const localizedMenuBtn = page.locator(`button[title="${expected.menu}"]`);
      await localizedMenuBtn.click();
      const restartBtn = page.getByRole("button", { name: expected.restart });
      await expect(restartBtn).toBeVisible();

      const shareBtn = page.getByRole("button", { name: expected.share });
      await expect(shareBtn).toBeVisible();
    });
  }

  test("language persists after page reload", async ({ page }) => {
    // Switch to Chinese
    const menuBtn = page.locator('button[title="Menu"]');
    await menuBtn.click();
    await page.getByRole("button", { name: "Language" }).click();
    await page.getByText("中文").click();
    await page.waitForTimeout(300);

    // Verify Chinese menu labels are shown
    await expect(page.locator('button[title="菜单"]')).toBeVisible({ timeout: 3000 });
    await page.locator('button[title="菜单"]').click();
    await expect(page.getByRole("button", { name: "重新开始" })).toBeVisible({ timeout: 3000 });

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Chinese should still be active
    await expect(page.locator('button[title="菜单"]')).toBeVisible({ timeout: 3000 });
  });

  test("current language shows checkmark in dropdown", async ({ page }) => {
    // Default is English, check for checkmark
    const menuBtn = page.locator('button[title="Menu"]');
    await menuBtn.click();
    await page.getByRole("button", { name: "Language" }).click();

    // The English row should have a checkmark
    const englishRow = page.locator("button").filter({ hasText: "English" }).filter({ hasText: "✓" });
    await expect(englishRow).toBeVisible();
  });

  test("dropdown closes on Escape key", async ({ page }) => {
    const menuBtn = page.locator('button[title="Menu"]');
    await menuBtn.click();
    await page.getByRole("button", { name: "Language" }).click();

    // Dropdown should be visible
    await expect(page.locator("text=English")).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    await expect(page.locator("text=English")).not.toBeVisible();
  });
});

test.describe("i18n — Level Complete Modal", () => {
  test("shows translated text in session report modal (Hindi)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("lang", "hi"));
    await page.reload();
    await page.waitForTimeout(500);

    // Play through a quick game using cheat codes
    // Type 198081 to activate autopilot
    for (const key of "198081") {
      await page.keyboard.press(key);
    }

    // Wait for autopilot to complete level 1 (should see the modal)
    const modalHeading = page.locator("text=स्तर 1 पूरा!");
    await expect(modalHeading).toBeVisible({ timeout: 60000 });

    // Check translated labels
    await expect(page.locator("text=स्कोर")).toBeVisible();
    await expect(page.locator("text=सटीकता")).toBeVisible();
    await expect(page.locator("text=अंडे")).toBeVisible();
    await expect(page.locator("text=रिपोर्ट साझा करें")).toBeVisible();
    await expect(page.locator("text=अगला स्तर")).toBeVisible();
  });
});

test.describe("i18n — Email in Chinese", () => {
  test("sends email with Chinese translated strings", async ({ page }) => {
    // Switch to Chinese
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("lang", "zh"));
    await page.reload();
    await page.waitForTimeout(500);

    // Activate autopilot to play through
    for (const key of "198081") {
      await page.keyboard.press(key);
    }

    // Wait for level complete modal with Chinese text
    const modalHeading = page.locator("text=第 1 关完成！");
    await expect(modalHeading).toBeVisible({ timeout: 60000 });

    // The autopilot should type email and send automatically
    // Wait for the success message in Chinese
    const successMsg = page.locator("text=报告已发送至");
    await expect(successMsg).toBeVisible({ timeout: 30000 });
  });
});
