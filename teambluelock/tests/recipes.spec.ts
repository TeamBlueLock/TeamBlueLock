import { test, expect } from "@playwright/test";

test.describe("Dashboard Recipes", () => {
  test("loads, creates, edits, deletes a recipe (mocked API)", async ({ page }) => {
    // ----------------------------
    // Mock API state
    // ----------------------------
    let recipes: any[] = [
      { _id: "r1", name: "Old Recipe", menuPrice: 5, createdAt: new Date().toISOString() },
    ];

    const recipeDetails: Record<string, any> = {
      r1: {
        _id: "r1",
        name: "Old Recipe",
        menuPrice: 5,
        createdAt: new Date().toISOString(),
        ingredients: [{ name: "Beef Patty", unit: "piece", quantity: 1 }],
      },
    };

    // ----------------------------
    // Mock routes
    // ----------------------------
    await page.route("**/api/inventory", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [{ _id: "i1", name: "Beef Patty", unit: "piece", unitCost: 2.5 }],
        }),
      });
    });

    await page.route("**/api/recipes", async (route) => {
      const req = route.request();
      const method = req.method();

      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: recipes }),
        });
      }

      if (method === "POST") {
        const body = req.postDataJSON() as any;

        expect(body.name).toBe("Smash Burger");
        expect(body.menuPrice).toBe(12);
        expect(body.ingredients?.length).toBe(1);
        expect(body.ingredients[0]).toMatchObject({
          name: "Beef Patty",
          unit: "piece",
          quantity: 1,
        });

        const created = { _id: "r2", ...body, createdAt: new Date().toISOString() };
        recipes = [created, ...recipes];
        recipeDetails["r2"] = created;

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: created }),
        });
      }

      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Unhandled /api/recipes" }),
      });
    });

    await page.route("**/api/recipes/*", async (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());
      const id = url.pathname.split("/").pop()!;

      if (method === "GET") {
        const found = recipeDetails[id];
        return route.fulfill({
          status: found ? 200 : 404,
          contentType: "application/json",
          body: JSON.stringify(found ? { success: true, data: found } : { success: false, error: "Not found" }),
        });
      }

      if (method === "PUT") {
        const body = req.postDataJSON() as any;
        expect(body.name).toBe("Edited Recipe");

        const updated = {
          _id: id,
          ...body,
          createdAt: recipeDetails[id]?.createdAt ?? new Date().toISOString(),
        };

        recipeDetails[id] = updated;
        recipes = recipes.map((r) => (r._id === id ? { ...r, ...updated } : r));

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: updated }),
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
        body: JSON.stringify({ success: false, error: `Unhandled /api/recipes/${id} ${method}` }),
      });
    });

    // ----------------------------
    // Visit
    // ----------------------------
    await page.goto("/dashboard/recipes");

    // ✅ fix strict-mode heading collision
    await expect(page.getByRole("heading", { level: 2, name: "Recipes" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Your Recipes" })).toBeVisible();

    // initial list loaded
    await expect(page.getByText("Old Recipe")).toBeVisible();
    await expect(page.getByText("Total recipes: 1")).toBeVisible();

    // ----------------------------
    // Open form + add/remove ingredient row
    // ----------------------------
    await page.getByRole("button", { name: "Add New Recipe" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "New Recipe" })).toBeVisible();

    await page.getByRole("button", { name: "+ Add Ingredient" }).click();

    const form = page.locator("form");
    await expect(form.getByPlaceholder("Beef Patty", { exact: true })).toHaveCount(2);

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(form.getByPlaceholder("Beef Patty", { exact: true })).toHaveCount(1);

    // ----------------------------
    // Create recipe (POST)
    // ----------------------------
    await form.getByPlaceholder("Smash Burger", { exact: true }).fill("Smash Burger");
    await form.getByPlaceholder("12.00", { exact: true }).fill("12");

    await form.getByPlaceholder("Beef Patty", { exact: true }).fill("Beef Patty");
    await form.getByPlaceholder("piece, g, kg...", { exact: true }).fill("piece");

    // ✅ CRITICAL FIX: exact match so it DOES NOT match "12.00"
    await form.getByPlaceholder("1", { exact: true }).fill("1");

    await form.getByRole("button", { name: "Save Recipe" }).click();

    await expect(page.getByText("Smash Burger")).toBeVisible();
    await expect(page.getByText("Total recipes: 2")).toBeVisible();

    // ----------------------------
    // Edit recipe (GET details + PUT)
    // ----------------------------
    const oldCard = page
      .getByRole("heading", { level: 4, name: "Old Recipe" })
      .locator("..")
      .locator("..");

    await oldCard.getByRole("button", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { level: 3, name: "Edit Recipe" })).toBeVisible();

    const editForm = page.locator("form");
    await expect(editForm.getByPlaceholder("Smash Burger", { exact: true })).toHaveValue("Old Recipe");

    await editForm.getByPlaceholder("Smash Burger", { exact: true }).fill("Edited Recipe");
    await editForm.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Edited Recipe")).toBeVisible();

    // ----------------------------
    // Delete recipe (confirm + DELETE)
    // ----------------------------
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });

    const editedCard = page
      .getByRole("heading", { level: 4, name: "Edited Recipe" })
      .locator("..")
      .locator("..");

    await editedCard.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Edited Recipe")).not.toBeVisible();
  });
});
