import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display signin page", async ({ page }) => {
    await page.goto("/auth/signin");

    // Check page title
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible();

    // Check OAuth buttons
    await expect(
      page.getByRole("button", { name: /Continue with GitHub/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toBeVisible();
  });

  test("should redirect to signin when accessing protected routes", async ({
    page,
  }) => {
    await page.goto("/profile");

    // Should be redirected to signin page
    await expect(page.url()).toMatch(/\/auth\/signin/);

    // Check signin page content
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible();
  });

  test("should show error page for auth errors", async ({ page }) => {
    await page.goto("/auth/error");

    // Check error page content
    await expect(page.getByText(/Authentication Error/i)).toBeVisible();
    await expect(page.getByText(/Try again/i)).toBeVisible();
  });

  test("should handle signout", async ({ page }) => {
    await page.goto("/auth/signout");

    // Check signout page content
    await expect(page.getByText(/Signing out/i)).toBeVisible();
  });

  test("should display appropriate navigation for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // Check if sign in link is visible
    await expect(page.getByRole("link", { name: /Sign In/i })).toBeVisible();

    // Check if user-specific links are not visible
    await expect(
      page.getByRole("link", { name: /Profile/i }),
    ).not.toBeVisible();
    await expect(page.getByRole("link", { name: /Admin/i })).not.toBeVisible();
  });
});
