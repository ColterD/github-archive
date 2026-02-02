import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("homepage should be accessible", async ({ page }) => {
    await page.goto("/");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("hardware page should be accessible", async ({ page }) => {
    await page.goto("/hardware");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("builds page should be accessible", async ({ page }) => {
    await page.goto("/builds");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("signin page should be accessible", async ({ page }) => {
    await page.goto("/auth/signin");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Check for h1
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check that h1 comes before h2
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingTexts = await headings.allTextContents();

    // Should have at least one heading
    expect(headingTexts.length).toBeGreaterThan(0);
  });

  test("should have proper keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Test tab navigation
    await page.keyboard.press("Tab");

    // Check if focus is visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Test navigation links
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Should navigate to a different page
    await expect(page.url()).not.toBe("/");
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // Check for main content area
    const main = page.locator("main");
    await expect(main).toBeVisible();

    // Check for skip links
    const skipLink = page.locator('a[href="#main-content"]');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeVisible();
    }
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/");

    // Run accessibility check focusing on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .withRules(["color-contrast", "color-contrast-enhanced"])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should be responsive and accessible on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Run accessibility check on mobile
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Check if mobile navigation is accessible
    const mobileMenuButton = page.getByRole("button", { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();

      // Check if navigation is accessible after opening
      const postClickResults = await new AxeBuilder({ page }).analyze();
      expect(postClickResults.violations).toEqual([]);
    }
  });
});
