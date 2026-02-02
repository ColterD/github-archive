import { test, expect } from "@playwright/test";

test.describe("Hardware Page", () => {
  test("should display hardware catalog", async ({ page }) => {
    await page.goto("/hardware");

    // Check page title
    await expect(
      page.getByRole("heading", { name: /Hardware Database/i }),
    ).toBeVisible();

    // Check search functionality
    const searchInput = page.getByPlaceholder(/Search hardware/i);
    await expect(searchInput).toBeVisible();

    // Check filter options
    await expect(page.getByText(/Category/i)).toBeVisible();
    await expect(page.getByText(/Price Range/i)).toBeVisible();

    // Check hardware grid
    await expect(page.locator('[data-testid="hardware-grid"]')).toBeVisible();
  });

  test("should search for hardware items", async ({ page }) => {
    await page.goto("/hardware");

    // Search for GPU
    const searchInput = page.getByPlaceholder(/Search hardware/i);
    await searchInput.fill("GPU");
    await searchInput.press("Enter");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Check if results contain GPU items
    const hardwareCards = page.locator('[data-testid="hardware-card"]');
    await expect(hardwareCards.first()).toBeVisible();

    // Check if GPU-related text is present
    await expect(page.getByText(/GPU/i).first()).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/hardware");

    // Click on category filter
    await page.getByRole("button", { name: /Category/i }).click();

    // Select GPU category
    await page.getByText(/GPU/i).click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Check if only GPU items are displayed
    const hardwareCards = page.locator('[data-testid="hardware-card"]');
    await expect(hardwareCards.first()).toBeVisible();
  });

  test("should open hardware item details", async ({ page }) => {
    await page.goto("/hardware");

    // Click on first hardware item
    const firstCard = page.locator('[data-testid="hardware-card"]').first();
    await firstCard.click();

    // Check if we're on the detail page
    await expect(page.url()).toMatch(/\/hardware\/[^/]+$/);

    // Check detail page content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Price/i)).toBeVisible();
    await expect(page.getByText(/Specifications/i)).toBeVisible();
  });

  test("should handle pagination", async ({ page }) => {
    await page.goto("/hardware");

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
});
