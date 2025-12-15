import { test, expect } from "@playwright/test";

test.describe("InventoryPage", () => {
  test("loads inventory and shows totals + statuses (mocked API)", async ({ page }) => {
    await page.route("**/api/inventory", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            { _id: "i1", name: "Beef Patty", unit: "piece", unitCost: 2.5, inStock: 0, reorderPoint: 5 },
            { _id: "i2", name: "Buns", unit: "piece", unitCost: 0.5, inStock: 4, reorderPoint: 4 },
            { _id: "i3", name: "Cheese", unit: "slice", unitCost: 0.25, inStock: 10, reorderPoint: 2 },
          ],
        }),
      });
    });

    await page.goto("/dashboard/Inventory");

    await expect(page.getByRole("heading", { level: 2, name: "Inventory" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Inventory Items" })).toBeVisible();

    await expect(page.getByText("Total items: 3")).toBeVisible();
    await expect(page.getByText("$4.50")).toBeVisible();

    // avoid matching table headers (e.g. "Reorder Point")
    const tbody = page.locator("tbody");
    await expect(tbody.getByText("Out of Stock", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Reorder", { exact: true })).toBeVisible();
    await expect(tbody.getByText("OK", { exact: true })).toBeVisible();
  });

  test("creates an item via POST and shows it in the table (mocked API)", async ({ page }) => {
    let items: any[] = [];

    await page.route("**/api/inventory", async (route) => {
      const req = route.request();
      const method = req.method();

      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: items }),
        });
      }

      if (method === "POST") {
        const body = req.postDataJSON() as any;

        // ✅ expect what the form should submit
        expect(body).toMatchObject({
          name: "Beef Patty",
          unit: "piece",
          unitCost: 2.5,
          inStock: 10,
          reorderPoint: 3,
        });

        const created = { _id: "i-new", ...body };
        items = [created, ...items];

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: created }),
        });
      }

      return route.fallback();
    });

    await page.goto("/dashboard/Inventory");

    await expect(page.getByRole("heading", { level: 2, name: "Inventory" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Inventory Items" })).toBeVisible();

    await expect(page.getByText("Total items: 0")).toBeVisible();
    await expect(
      page.getByText(/No inventory items yet\. Add your first item to get started\./i)
    ).toBeVisible();

    // open form
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText("New Inventory Item")).toBeVisible();

    const form = page.locator("form");

    // ✅ these placeholders are unique
    await form.getByPlaceholder("Beef Patty").fill("Beef Patty");
    await form.getByPlaceholder("piece, kg, lb...").fill("piece");
    await form.getByPlaceholder("0.25").fill("2.5");

    // ✅ avoid "0" placeholder collision by selecting numeric inputs by order
    // in your form: [Unit Cost, In Stock, Reorder Point] are number inputs
    const numberInputs = form.locator('input[type="number"]');
    await numberInputs.nth(1).fill("10"); // In Stock
    await numberInputs.nth(2).fill("3");  // Reorder Point

    await form.getByRole("button", { name: "Save Item" }).click();

    // ✅ confirm form closed by button toggle
    await expect(page.getByRole("button", { name: "Add Item" })).toBeVisible();

    // ✅ assert results in table body
    const tbody = page.locator("tbody");
    await expect(tbody.getByText("Beef Patty", { exact: true })).toBeVisible();
    await expect(page.getByText("Total items: 1")).toBeVisible();
    await expect(page.getByText("$25.00")).toBeVisible();
    await expect(tbody.getByText("OK", { exact: true })).toBeVisible();
  });
});
