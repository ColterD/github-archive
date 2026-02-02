import { test, expect } from "@playwright/test";

test.describe("Builds Page", () => {
  test("should display community builds", async ({ page }) => {
    await page.goto("/builds");

    // Check page title
    await expect(
      page.getByRole("heading", { name: /Community Builds/i }),
    ).toBeVisible();

    // Check featured builds section
    await expect(page.getByText(/Featured Builds/i)).toBeVisible();

    // Check build grid
    await expect(page.locator('[data-testid="builds-grid"]')).toBeVisible();

    // Check if build cards are present
    const buildCards = page.locator('[data-testid="build-card"]');
    await expect(buildCards.first()).toBeVisible();
  });

  test("should display build details", async ({ page }) => {
    await page.goto("/builds");

    // Click on first build
    const firstBuild = page.locator('[data-testid="build-card"]').first();
    await firstBuild.click();

    // Check if we're on the build detail page
    await expect(page.url()).toMatch(/\/builds\/[^/]+$/);

    // Check build detail content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Components/i)).toBeVisible();
    await expect(page.getByText(/Total Price/i)).toBeVisible();
  });

  test("should filter builds by category", async ({ page }) => {
    await page.goto("/builds");

    // Check if filter options are available
    const filterButton = page.getByRole("button", { name: /Filter/i });
    await expect(filterButton).toBeVisible();

    // Click filter button
    await filterButton.click();

    // Select a category filter
    await page.getByText(/Home Server/i).click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Check if filtered results are displayed
    const buildCards = page.locator('[data-testid="build-card"]');
    await expect(buildCards.first()).toBeVisible();
  });

  test("should handle pagination", async ({ page }) => {
    await page.goto("/builds");

    // Check if pagination is visible
    const pagination = page.locator('[data-testid="pagination"]');
    await expect(pagination).toBeVisible();

    // Check if next page button exists
    const nextButton = page.getByRole("button", { name: /Next/i });

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Check if URL contains page parameter
      await expect(page.url()).toMatch(/page=2/);
    }
  });

  test("should display build statistics", async ({ page }) => {
    await page.goto("/builds");

    // Check if statistics section is visible
    await expect(page.getByText(/Total Builds/i)).toBeVisible();
    await expect(page.getByText(/Featured/i)).toBeVisible();
    await expect(page.getByText(/Categories/i)).toBeVisible();
  });
});
