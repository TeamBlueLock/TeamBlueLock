import { test, expect } from "@playwright/test";

test.describe("ProfitAnalysisPage", () => {
  test("loads profit analysis and renders rows (mocked API)", async ({ page }) => {
    await page.route("**/api/profit-analysis", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              recipeId: "r1",
              name: "Smash Burger",
              menuPrice: 12,
              computedCost: 4.5,
              marginAmount: 7.5,
              marginPct: 62.5,
              missingIngredients: [],
            },
            {
              recipeId: "r2",
              name: "Mystery Burger",
              menuPrice: 10,
              computedCost: 2,
              marginAmount: 8,
              marginPct: 80,
              missingIngredients: ["Secret Sauce", "Gold Leaf"],
            },
          ],
        }),
      });
    });

    await page.goto("/dashboard/profit-analysis");

    await expect(page.getByRole("heading", { level: 2, name: "Profit Analysis" })).toBeVisible();

    // stable anchor for this page
    await expect(page.getByRole("heading", { level: 3, name: "Recipe Margins" })).toBeVisible();

    // totals (this actually exists on this page)
    await expect(page.getByText("Total recipes: 2")).toBeVisible();

    // after load, table exists. scope assertions to tbody to avoid header collisions.
    const tbody = page.locator("tbody");

    // row 1
    await expect(tbody.getByText("Smash Burger", { exact: true })).toBeVisible();
    await expect(tbody.getByText("12.00", { exact: true })).toBeVisible();
    await expect(tbody.getByText("4.50", { exact: true })).toBeVisible();
    await expect(tbody.getByText("7.50", { exact: true })).toBeVisible();
    await expect(tbody.getByText("62.5%", { exact: true })).toBeVisible();
    await expect(tbody.getByText("All ingredients linked", { exact: true })).toBeVisible();

    // row 2
    await expect(tbody.getByText("Mystery Burger", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Secret Sauce, Gold Leaf", { exact: true })).toBeVisible();

    // footer explanation exists
    await expect(page.getByText(/Margin is calculated as/i)).toBeVisible();
  });

  test("shows empty state when API returns zero rows", async ({ page }) => {
    await page.route("**/api/profit-analysis", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto("/dashboard/profit-analysis");

    await expect(page.getByRole("heading", { level: 2, name: "Profit Analysis" })).toBeVisible();
    await expect(page.getByText("Total recipes: 0")).toBeVisible();

    await expect(
      page.getByText(
        /No recipes or inventory data yet\. Add inventory items and recipes to see profit analysis\./i
      )
    ).toBeVisible();
  });
});
