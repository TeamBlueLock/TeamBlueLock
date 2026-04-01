import { test, expect, Page } from "@playwright/test";

type RecipeRow = {
  _id: string;
  name: string;
  category?: string;
  subCategory?: string;
  menuPrice?: number;
  createdAt?: string;
};

type RecipeDetails = RecipeRow & {
  ingredients?: Array<{
    name: string;
    unit: string;
    quantity: number;
  }>;
};

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  baseUnit: string;
  unitCost: number;
  costPerBaseUnit: number;
  gramsPerPiece?: number;
  gramsPerMl?: number;
  mlPerPiece?: number;
};

type MockState = {
  getRecipes: () => RecipeRow[];
  getInventory: () => InventoryItem[];
  lastCreateBody: any | null;
  lastUpdateBody: any | null;
  lastInventoryPatchBody: any | null;
};

async function setupRecipesMocks(
  page: Page,
  options?: {
    recipes?: RecipeRow[];
    recipeDetails?: Record<string, RecipeDetails>;
    inventory?: InventoryItem[];
    failCreate?: boolean;
    emptyRecipes?: boolean;
  }
): Promise<MockState> {
  let recipes: RecipeRow[] =
    options?.emptyRecipes
      ? []
      : options?.recipes ?? [
          {
            _id: "r1",
            name: "Burger",
            category: "Dinner",
            subCategory: "Burgers",
            menuPrice: 12,
            createdAt: new Date().toISOString(),
          },
          {
            _id: "r2",
            name: "Fries",
            category: "Sides",
            subCategory: "Potatoes",
            menuPrice: 5,
            createdAt: new Date().toISOString(),
          },
        ];

  let inventory: InventoryItem[] =
    options?.inventory ?? [
      {
        _id: "i1",
        name: "Beef Patty",
        unit: "lb",
        baseUnit: "g",
        unitCost: 10,
        costPerBaseUnit: 0.01,
      },
      {
        _id: "i2",
        name: "Bun",
        unit: "piece",
        baseUnit: "piece",
        unitCost: 1,
        costPerBaseUnit: 1,
      },
      {
        _id: "i3",
        name: "Potato",
        unit: "kg",
        baseUnit: "g",
        unitCost: 4,
        costPerBaseUnit: 0.004,
      },
    ];

  const recipeDetails: Record<string, RecipeDetails> =
    options?.recipeDetails ?? {
      r1: {
        _id: "r1",
        name: "Burger",
        category: "Dinner",
        subCategory: "Burgers",
        menuPrice: 12,
        createdAt: new Date().toISOString(),
        ingredients: [
          { name: "Beef Patty", unit: "g", quantity: 150 },
          { name: "Bun", unit: "piece", quantity: 1 },
        ],
      },
      r2: {
        _id: "r2",
        name: "Fries",
        category: "Sides",
        subCategory: "Potatoes",
        menuPrice: 5,
        createdAt: new Date().toISOString(),
        ingredients: [{ name: "Potato", unit: "g", quantity: 200 }],
      },
    };

  const state: MockState = {
    getRecipes: () => recipes,
    getInventory: () => inventory,
    lastCreateBody: null,
    lastUpdateBody: null,
    lastInventoryPatchBody: null,
  };

  await page.route("**/api/inventory", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: inventory,
        }),
      });
    }

    return route.fallback();
  });

  await page.route("**/api/inventory/*", async (route) => {
    const req = route.request();
    const method = req.method();
    const id = new URL(req.url()).pathname.split("/").pop()!;

    if (method === "PATCH") {
      const body = req.postDataJSON() as Record<string, number>;
      state.lastInventoryPatchBody = body;

      inventory = inventory.map((item) =>
        item._id === id ? { ...item, ...body } : item
      );

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fallback();
  });

  await page.route("**/api/recipes", async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: recipes,
        }),
      });
    }

    if (method === "POST") {
      const body = req.postDataJSON() as any;
      state.lastCreateBody = body;

      if (options?.failCreate) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "Failed to save recipe",
          }),
        });
      }

      const created: RecipeDetails = {
        _id: `r${recipes.length + 1}`,
        ...body,
        createdAt: new Date().toISOString(),
      };

      recipes = [created, ...recipes];
      recipeDetails[created._id] = created;

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: created,
        }),
      });
    }

    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: "Unhandled /api/recipes",
      }),
    });
  });

  await page.route("**/api/recipes/*", async (route) => {
    const req = route.request();
    const method = req.method();
    const id = new URL(req.url()).pathname.split("/").pop()!;

    if (method === "GET") {
      const found = recipeDetails[id];
      return route.fulfill({
        status: found ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(
          found
            ? { success: true, data: found }
            : { success: false, error: "Not found" }
        ),
      });
    }

    if (method === "PUT") {
      const body = req.postDataJSON() as any;
      state.lastUpdateBody = body;

      const updated: RecipeDetails = {
        _id: id,
        ...body,
        createdAt: recipeDetails[id]?.createdAt ?? new Date().toISOString(),
      };

      recipeDetails[id] = updated;
      recipes = recipes.map((r) => (r._id === id ? { ...r, ...updated } : r));

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: updated,
        }),
      });
    }

    if (method === "DELETE") {
      recipes = recipes.filter((r) => r._id !== id);
      delete recipeDetails[id];

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: `Unhandled /api/recipes/${id} ${method}`,
      }),
    });
  });

  return state;
}

async function gotoRecipes(page: Page) {
  await page.goto("/dashboard/recipes");
  await expect(
    page.getByRole("heading", { level: 2, name: "Recipes" })
  ).toBeVisible();
}

function recipeTable(page: Page) {
  return page.getByRole("table");
}

function recipeRow(page: Page, exactName: string) {
  return page.locator("tbody tr", {
    has: page.getByRole("cell", { name: exactName, exact: true }),
  });
}

async function waitForInventoryLoaded(page: Page) {
  await expect(page.getByText("Loading inventory...")).toHaveCount(0);
}

async function openCreateForm(page: Page) {
  await page.getByRole("button", { name: "Add New Recipe" }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: "New Recipe" })
  ).toBeVisible();
  await waitForInventoryLoaded(page);
}

async function openEditForm(page: Page, exactName: string) {
  await recipeRow(page, exactName).getByRole("button", { name: "Edit" }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: "Edit Recipe" })
  ).toBeVisible();
  await waitForInventoryLoaded(page);
}

async function setSelectValue(selectLocator: ReturnType<Page["locator"]>, value: string) {
  await expect(selectLocator).toBeVisible();
  await selectLocator.evaluate((el, targetValue) => {
    const select = el as HTMLSelectElement;
    const option = Array.from(select.options).find(
      (opt) =>
        opt.value === targetValue ||
        opt.label === targetValue ||
        opt.text === targetValue
    );

    if (!option) {
      throw new Error(
        `Option "${String(targetValue)}" not found. Available: ${Array.from(
          select.options
        )
          .map((o) => `${o.text}:${o.value}`)
          .join(", ")}`
      );
    }

    select.value = option.value;
    option.selected = true;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function fillBasicRecipeForm(
  page: Page,
  values?: {
    recipeName?: string;
    menuPrice?: string;
    category?: string;
    subCategory?: string;
    ingredientName?: string;
    unit?: string;
    quantity?: string;
  }
) {
  const form = page.locator("form");

  if (values?.recipeName !== undefined) {
    await form.getByPlaceholder("Smash Burger").fill(values.recipeName);
  }

  if (values?.menuPrice !== undefined) {
    await form.getByPlaceholder("12.00").fill(values.menuPrice);
  }

  if (values?.category !== undefined) {
    await form.getByPlaceholder("Dinner").fill(values.category);
  }

  if (values?.subCategory !== undefined) {
    await form.getByPlaceholder("Burgers").fill(values.subCategory);
  }

  if (values?.ingredientName !== undefined) {
    await form.getByPlaceholder("Beef Patty", { exact: true }).fill(values.ingredientName);
  }

  if (values?.unit !== undefined) {
    const unitSelect = form.locator("select").first();
    await setSelectValue(unitSelect, values.unit);
  }

  if (values?.quantity !== undefined) {
    await form.getByPlaceholder("1", { exact: true }).fill(values.quantity);
  }
}

test.describe("Dashboard Recipes", () => {
  let mockState: MockState;

  test.beforeEach(async ({ page }) => {
    mockState = await setupRecipesMocks(page);
    await gotoRecipes(page);
  });

  test("loads existing recipes", async ({ page }) => {
    await expect(page.getByRole("cell", { name: "Burger", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Fries", exact: true })).toBeVisible();
    await expect(page.getByText("Total recipes: 2")).toBeVisible();
  });

  test("opens and closes add recipe form", async ({ page }) => {
    await openCreateForm(page);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { level: 3, name: "New Recipe" })
    ).toHaveCount(0);
  });

  test("keeps form open when recipe name is missing", async ({ page }) => {
    await openCreateForm(page);
    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(
      page.getByRole("heading", { level: 3, name: "New Recipe" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Smash Burger")).toBeVisible();
  });

  test("keeps form open when no valid ingredient exists", async ({ page }) => {
    await openCreateForm(page);
    await fillBasicRecipeForm(page, { recipeName: "Patty Special" });
    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(
      page.getByRole("heading", { level: 3, name: "New Recipe" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Smash Burger")).toHaveValue("Patty Special");
  });

  test("adds and removes ingredient rows", async ({ page }) => {
    await openCreateForm(page);

    const form = page.locator("form");
    await expect(form.getByPlaceholder("Beef Patty", { exact: true })).toHaveCount(1);

    await page.getByRole("button", { name: "+ Add Ingredient" }).click();
    await expect(form.getByPlaceholder("Beef Patty", { exact: true })).toHaveCount(2);

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(form.getByPlaceholder("Beef Patty", { exact: true })).toHaveCount(1);
  });

  test("creates a new recipe successfully", async ({ page }) => {
    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Smash Burger",
      menuPrice: "14",
      category: "Dinner",
      subCategory: "Burgers",
      ingredientName: "Beef Patty",
      unit: "g",
      quantity: "150",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect.poll(() => mockState.lastCreateBody?.name).toBe("Smash Burger");
    await expect(page.getByRole("cell", { name: "Smash Burger", exact: true })).toBeVisible();
    await expect(page.getByText("Total recipes: 3")).toBeVisible();
  });

  test("sorts recipes by menu price ascending and descending", async ({ page }) => {
    const table = recipeTable(page);
    const header = table.getByRole("columnheader", { name: /menu price/i });

    await header.click();
    let rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Fries");
    await expect(rows.nth(2)).toContainText("Burger");

    await header.click();
    rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Burger");
    await expect(rows.nth(2)).toContainText("Fries");
  });

  test("sorts recipes by name ascending and descending", async ({ page }) => {
    const table = recipeTable(page);
    const header = table.getByRole("columnheader", { name: /recipe name/i });

    await header.click();
    let rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Burger");
    await expect(rows.nth(2)).toContainText("Fries");

    await header.click();
    rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Fries");
    await expect(rows.nth(2)).toContainText("Burger");
  });

  test("sorts recipes by category", async ({ page }) => {
    const table = recipeTable(page);
    const header = table.getByRole("columnheader", { name: "Category", exact: true });

    await header.click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Burger");
    await expect(rows.nth(2)).toContainText("Fries");
  });

  test("loads recipe into form for editing", async ({ page }) => {
    await openEditForm(page, "Burger");

    await expect(page.getByPlaceholder("Smash Burger")).toHaveValue("Burger");
    await expect(page.getByPlaceholder("12.00")).toHaveValue("12");
    await expect(page.getByPlaceholder("Dinner")).toHaveValue("Dinner");
    await expect(page.getByPlaceholder("Burgers")).toHaveValue("Burgers");
  });

  test("updates a recipe successfully", async ({ page }) => {
    await openEditForm(page, "Burger");

    await page.getByPlaceholder("Smash Burger").fill("Burger Deluxe");
    await page.getByPlaceholder("12.00").fill("15");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect.poll(() => mockState.lastUpdateBody?.name).toBe("Burger Deluxe");
    await expect.poll(() => mockState.lastUpdateBody?.menuPrice).toBe(15);
  });

  test("canceling edit closes form and does not change row", async ({ page }) => {
    await openEditForm(page, "Burger");

    await page.getByPlaceholder("Smash Burger").fill("Should Not Save");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("cell", { name: "Burger", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Should Not Save", exact: true })).toHaveCount(0);
  });

  test("deletes a recipe after confirming", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });

    await recipeRow(page, "Burger").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("cell", { name: "Burger", exact: true })).toHaveCount(0);
    await expect(page.getByText("Total recipes: 1")).toBeVisible();
  });

  test("does not delete a recipe when confirm is canceled", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.dismiss();
    });

    await recipeRow(page, "Burger").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("cell", { name: "Burger", exact: true })).toBeVisible();
    await expect(page.getByText("Total recipes: 2")).toBeVisible();
  });

  test("opens conversion modal when units mismatch", async ({ page }) => {
    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Patty Special",
      ingredientName: "Beef Patty",
      unit: "piece",
      quantity: "2",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(page.getByText(/define conversion for beef patty/i)).toBeVisible();
  });

  test("cancels conversion modal", async ({ page }) => {
    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Patty Special",
      ingredientName: "Beef Patty",
      unit: "piece",
      quantity: "2",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    const modal = page.locator(".fixed.inset-0");
    await expect(page.getByText(/define conversion for beef patty/i)).toBeVisible();

    await modal.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText(/define conversion for beef patty/i)).toHaveCount(0);
    await expect(page.getByRole("cell", { name: "Patty Special", exact: true })).toHaveCount(0);
  });

  test("saves conversion and then saves recipe", async ({ page }) => {
    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Patty Special",
      menuPrice: "11",
      category: "Dinner",
      subCategory: "Burgers",
      ingredientName: "Beef Patty",
      unit: "piece",
      quantity: "2",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(page.getByText(/define conversion for beef patty/i)).toBeVisible();

    const modal = page.locator(".fixed.inset-0");
    await modal.locator('input[type="number"]').first().fill("120");
    await modal.getByRole("button", { name: "Save Conversion" }).click();

    await expect.poll(() => mockState.lastInventoryPatchBody?.gramsPerPiece).toBe(120);
    await expect(page.getByRole("cell", { name: "Patty Special", exact: true })).toBeVisible();
    await expect(page.getByText("Total recipes: 3")).toBeVisible();
  });

  test("requires valid conversion value before saving conversion", async ({ page }) => {
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("alert");
      expect(dialog.message()).toContain("Please enter a valid conversion value.");
      await dialog.accept();
    });

    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Patty Special",
      ingredientName: "Beef Patty",
      unit: "piece",
      quantity: "2",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(page.getByText(/define conversion for beef patty/i)).toBeVisible();

    const modal = page.locator(".fixed.inset-0");
    await modal.locator('input[type="number"]').first().fill("0");
    await modal.getByRole("button", { name: "Save Conversion" }).click();

    await expect(page.getByText(/define conversion for beef patty/i)).toBeVisible();
  });

  test("shows empty state when there are no recipes", async ({ page }) => {
    await page.unroute("**/api/recipes");
    mockState = await setupRecipesMocks(page, { emptyRecipes: true });
    await gotoRecipes(page);

    await expect(
      page.getByText("No recipes yet. Add your first recipe to get started.")
    ).toBeVisible();
  });

  test("keeps form open when save fails", async ({ page }) => {
    await page.unroute("**/api/recipes");
    mockState = await setupRecipesMocks(page, { failCreate: true });
    await gotoRecipes(page);

    await openCreateForm(page);

    await fillBasicRecipeForm(page, {
      recipeName: "Broken Recipe",
      ingredientName: "Beef Patty",
      unit: "g",
      quantity: "100",
    });

    await page.getByRole("button", { name: "Save Recipe" }).click();

    await expect(page.getByText("Failed to save recipe")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "New Recipe" })
    ).toBeVisible();
  });
});