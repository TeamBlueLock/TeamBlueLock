import { test, expect, Page, Locator } from "@playwright/test";

type ProfitRow = {
  recipeId: string;
  name: string;
  category?: string;
  subCategory?: string;
  menuPrice: number;
  computedCost: number;
  marginAmount: number;
  marginPct: number;
  missingIngredients: string[];
};

const defaultAnalysisData: ProfitRow[] = [
  {
    recipeId: "r1",
    name: "Smash Burger",
    category: "Entrees",
    subCategory: "Beef",
    menuPrice: 12,
    computedCost: 4.5,
    marginAmount: 7.5,
    marginPct: 62.5,
    missingIngredients: [],
  },
  {
    recipeId: "r2",
    name: "Mystery Burger",
    category: "Entrees",
    subCategory: "Special",
    menuPrice: 10,
    computedCost: 2,
    marginAmount: 8,
    marginPct: 80,
    missingIngredients: ["Secret Sauce", "Gold Leaf"],
  },
  {
    recipeId: "r3",
    name: "Fries",
    category: "Sides",
    subCategory: "Potato",
    menuPrice: 5,
    computedCost: 2,
    marginAmount: 3,
    marginPct: 60,
    missingIngredients: ["Salt"],
  },
  {
    recipeId: "r4",
    name: "Soda",
    category: "Drinks",
    subCategory: "Soft Drink",
    menuPrice: 3,
    computedCost: 0.5,
    marginAmount: 2.5,
    marginPct: 83.3333,
    missingIngredients: [],
  },
];

async function setupProfitAnalysisMocks(
  page: Page,
  options?: {
    rows?: ProfitRow[];
    empty?: boolean;
    fail?: boolean;
    delayMs?: number;
  }
) {
  const rows = options?.empty ? [] : options?.rows ?? defaultAnalysisData;

  await page.route("**/api/profit-analysis", async (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }

    if (options?.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    if (options?.fail) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Failed to load profit analysis",
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: rows,
      }),
    });
  });
}

async function gotoProfitAnalysis(page: Page) {
  await page.goto("/dashboard/profit-analysis");
  await expect(
    page.getByRole("heading", { level: 2, name: "Profit Analysis" })
  ).toBeVisible();
}

function profitTable(page: Page) {
  return page.getByRole("table");
}

async function ensureTableVisible(page: Page) {
  const table = profitTable(page);

  if (await table.count()) {
    await expect(table).toBeVisible();
    return table;
  }

  const candidates: Locator[] = [
    page.getByRole("tab", { name: /table/i }),
    page.getByRole("button", { name: /table/i }),
    page.getByText(/^table$/i),
  ];

  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      await candidate.first().click();
      break;
    }
  }

  await expect(table).toBeVisible();
  return table;
}

test.describe("ProfitAnalysisPage", () => {
  test.beforeEach(async ({ page }) => {
    await setupProfitAnalysisMocks(page);
    await gotoProfitAnalysis(page);
  });

  test("loads the page and main overview content", async ({ page }) => {
    await expect(
      page.getByText(/track margins, spot low performers, and catch missing inventory links/i)
    ).toBeVisible();

    await expect(page.getByText(/4 recipes/i)).toBeVisible();
    await expect(page.getByText("71.5%")).toBeVisible();
    await expect(page.getByText("$8.00")).toBeVisible();
  });

  test("shows key overview values after loading", async ({ page }) => {
    await expect(page.getByText("71.5%")).toBeVisible();
    await expect(page.getByText("$8.00")).toBeVisible();
    await expect(page.getByText("4 recipes")).toBeVisible();
  });

  test("shows table rows", async ({ page }) => {
    const table = await ensureTableVisible(page);
    const tbody = table.locator("tbody");

    await expect(tbody.getByText("Smash Burger", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Mystery Burger", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Fries", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Soda", { exact: true })).toBeVisible();
  });

  test("shows linked and missing ingredient text correctly", async ({ page }) => {
    const table = await ensureTableVisible(page);
    const tbody = table.locator("tbody");

    await expect(
      tbody.getByText("Secret Sauce, Gold Leaf", { exact: true })
    ).toBeVisible();

    await expect(
      tbody.getByText("Salt", { exact: true })
    ).toBeVisible();

    await expect(
      tbody.getByText("All ingredients linked", { exact: true })
    ).toHaveCount(2);
  });

  test("sorts rows by menu price ascending and descending", async ({ page }) => {
    const table = await ensureTableVisible(page);
    const menuPriceHeader = table.getByRole("columnheader", {
      name: /menu price/i,
    });

    await menuPriceHeader.click();

    let rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Soda");
    await expect(rows.nth(2)).toContainText("Fries");
    await expect(rows.nth(3)).toContainText("Mystery Burger");
    await expect(rows.nth(4)).toContainText("Smash Burger");

    await menuPriceHeader.click();

    rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Smash Burger");
    await expect(rows.nth(2)).toContainText("Mystery Burger");
    await expect(rows.nth(3)).toContainText("Fries");
    await expect(rows.nth(4)).toContainText("Soda");
  });

  test("sorts rows by recipe name", async ({ page }) => {
    const table = await ensureTableVisible(page);
    const recipeHeader = table.getByRole("columnheader", {
      name: /^recipe$/i,
    });

    await recipeHeader.click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Fries");
    await expect(rows.nth(2)).toContainText("Mystery Burger");
    await expect(rows.nth(3)).toContainText("Smash Burger");
    await expect(rows.nth(4)).toContainText("Soda");
  });

  test("sorts rows by margin percent", async ({ page }) => {
    const table = await ensureTableVisible(page);

    await table.getByRole("columnheader", {
      name: "Margin (%)",
      exact: true,
    }).click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Fries");
    await expect(rows.nth(2)).toContainText("Smash Burger");
    await expect(rows.nth(3)).toContainText("Mystery Burger");
    await expect(rows.nth(4)).toContainText("Soda");
  });

  test("sorts rows by computed cost", async ({ page }) => {
    const table = await ensureTableVisible(page);
    const costHeader = table.getByRole("columnheader", {
      name: /cost/i,
    });

    await costHeader.click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Soda");
    await expect(rows.nth(2)).toContainText("Mystery Burger");
    await expect(rows.nth(3)).toContainText("Fries");
    await expect(rows.nth(4)).toContainText("Smash Burger");
  });

  test("shows empty state when API returns zero rows", async ({ page }) => {
    await page.unroute("**/api/profit-analysis");
    await setupProfitAnalysisMocks(page, { empty: true });
    await gotoProfitAnalysis(page);

    await expect(page.getByText(/0 recipes/i)).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("eventually loads data after a delayed response", async ({ page }) => {
    await page.unroute("**/api/profit-analysis");
    await setupProfitAnalysisMocks(page, { delayMs: 1500 });
    await gotoProfitAnalysis(page);

    await expect(page.getByText(/4 recipes/i)).toBeVisible();
    await expect(page.getByText("71.5%")).toBeVisible();
  });

  test("handles API failure gracefully", async ({ page }) => {
    await page.unroute("**/api/profit-analysis");
    await setupProfitAnalysisMocks(page, { fail: true });
    await gotoProfitAnalysis(page);

    await expect(page.getByText(/0 recipes/i)).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });
});