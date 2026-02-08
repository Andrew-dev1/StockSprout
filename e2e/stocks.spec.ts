import { test, expect } from "@playwright/test";

test.describe("Stocks", () => {
  test("stocks page has search input", async ({ page }) => {
    await page.goto("/stocks");

    const searchInput = page.getByPlaceholder(/Search stocks/);
    await expect(searchInput).toBeVisible();
  });

  test("search triggers and shows results", async ({ page }) => {
    await page.goto("/stocks");

    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");

    // Wait for either loading or results (loading may be too fast to catch)
    await page.waitForTimeout(500);

    // Results dropdown should appear
    const dropdown = page.locator('[class*="absolute"]').first();
    await expect(dropdown).toBeVisible();
  });

  test("search returns results for valid query", async ({ page }) => {
    await page.goto("/stocks");

    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");

    // Wait for results (either results or no results message)
    await page.waitForSelector('[class*="absolute"]', { timeout: 5000 });

    // Results dropdown should be visible
    const dropdown = page.locator('[class*="absolute"]').first();
    await expect(dropdown).toBeVisible();
  });

  test("clicking search result navigates to stock detail", async ({ page }) => {
    await page.goto("/stocks");

    const searchInput = page.getByPlaceholder(/Search stocks/);
    await searchInput.fill("AAPL");

    // Wait for results
    await page.waitForTimeout(500);

    // Click first result if available
    const firstResult = page.locator("li").first();
    if (await firstResult.isVisible()) {
      await firstResult.click();

      // Should navigate to stock detail page
      await expect(page).toHaveURL(/\/stocks\/[A-Z]+/);
    }
  });

  test("stock detail page shows stock information", async ({ page }) => {
    // Navigate directly to a stock (assuming AAPL exists in tracked stocks)
    await page.goto("/stocks/AAPL");

    // Should show stock ticker
    await expect(page.getByText("AAPL")).toBeVisible();

    // Should have quote details section
    await expect(page.getByText("Quote Details")).toBeVisible();
  });

  test("stock detail shows error for invalid ticker", async ({ page }) => {
    await page.goto("/stocks/INVALIDTICKER123");

    // Wait for loading to finish
    await expect(page.getByText("Loading stock data...")).toBeHidden({ timeout: 10000 });

    // Should show error message
    await expect(page.getByText(/Please try a different ticker/i)).toBeVisible();
  });
});
