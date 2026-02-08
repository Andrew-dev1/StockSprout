import { test, expect } from "@playwright/test";

test.describe("Child Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/child-login");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel("First Name").fill("NonExistent");
    await page.getByLabel("Family Name").fill("FakeFamily");
    await page.getByLabel("6-Digit PIN").fill("000000");

    await page.getByRole("button", { name: "Log In" }).click();

    // Should show error message
    await expect(page.getByText(/Invalid credentials|not found/i)).toBeVisible();
  });

  test("PIN field only accepts 6 digits", async ({ page }) => {
    const pinInput = page.getByLabel("6-Digit PIN");

    // Try typing letters - should be filtered out
    await pinInput.fill("abc123");
    await expect(pinInput).toHaveValue("123");

    // Try typing more than 6 digits - should be truncated
    await pinInput.fill("1234567890");
    await expect(pinInput).toHaveValue("123456");
  });

  test("submit button shows loading state", async ({ page }) => {
    await page.getByLabel("First Name").fill("Test");
    await page.getByLabel("Family Name").fill("Family");
    await page.getByLabel("6-Digit PIN").fill("123456");

    const submitButton = page.getByRole("button", { name: "Log In" });
    await submitButton.click();

    // Button should show loading state briefly
    await expect(page.getByRole("button", { name: "Logging in..." })).toBeVisible();
  });

  test("form requires all fields", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Log In" });

    // Try submitting with empty fields - form validation should prevent
    await submitButton.click();

    // Should still be on login page
    await expect(page).toHaveURL("/child-login");
  });
});
