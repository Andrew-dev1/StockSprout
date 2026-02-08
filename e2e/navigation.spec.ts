import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with parent login options", async ({ page }) => {
    await page.goto("/");

    // Check page title
    await expect(page).toHaveTitle(/Stock Trading Kids/);

    // Check parent login section
    await expect(page.getByText("Parent Login")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();

    // Check child login link
    await expect(page.getByRole("link", { name: "I'm a Kid" })).toBeVisible();
  });

  test("can navigate to child login page", async ({ page }) => {
    await page.goto("/");

    await page.click("text=I'm a Kid");

    await expect(page).toHaveURL("/child-login");
    await expect(page.getByText("Kid Login")).toBeVisible();
  });

  test("child login page has required fields", async ({ page }) => {
    await page.goto("/child-login");

    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Family Name")).toBeVisible();
    await expect(page.getByLabel("6-Digit PIN")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  });

  test("can navigate back to parent login from child login", async ({ page }) => {
    await page.goto("/child-login");

    await page.click("text=I'm a Parent");

    await expect(page).toHaveURL("/");
  });

  test("stocks page is accessible", async ({ page }) => {
    await page.goto("/stocks");

    await expect(page.getByPlaceholder(/Search stocks/)).toBeVisible();
  });
});
