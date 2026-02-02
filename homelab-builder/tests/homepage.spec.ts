import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display homepage correctly", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/Homelab Builder/);

    // Check main heading
    await expect(
      page.getByRole("heading", { name: /Build Your Dream Homelab/i }),
    ).toBeVisible();

    // Check navigation
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: /Hardware/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Builds/i })).toBeVisible();
  });

  test("should navigate to hardware page", async ({ page }) => {
    await page.goto("/");

    // Click on hardware link
    await page.getByRole("link", { name: /Hardware/i }).click();

    // Check URL changed
    await expect(page).toHaveURL(/\/hardware/);

    // Check hardware page content
    await expect(
      page.getByRole("heading", { name: /Hardware Database/i }),
    ).toBeVisible();
  });

  test("should navigate to builds page", async ({ page }) => {
    await page.goto("/");

    // Click on builds link
    await page.getByRole("link", { name: /Builds/i }).click();

    // Check URL changed
    await expect(page).toHaveURL(/\/builds/);

    // Check builds page content
    await expect(
      page.getByRole("heading", { name: /Community Builds/i }),
    ).toBeVisible();
  });

  test("should show responsive navigation on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check if mobile menu button is visible
    const mobileMenuButton = page.getByRole("button", { name: /menu/i });
    await expect(mobileMenuButton).toBeVisible();

    // Click mobile menu button
    await mobileMenuButton.click();

    // Check if navigation items are visible
    await expect(page.getByRole("link", { name: /Hardware/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Builds/i })).toBeVisible();
  });
});
