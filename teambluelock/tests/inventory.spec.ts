import { test, expect, Page, Locator } from "@playwright/test";

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
  inStock: number;
  reorderPoint: number;
  customFields?: Record<string, string>;
};

type ColumnDef = {
  key: string;
  label: string;
  type: string;
  visible: boolean;
  order: number;
};

type InventoryMockState = {
  getItems: () => InventoryItem[];
  getColumns: () => ColumnDef[];
  lastCreateBody: any | null;
  lastUpdateBody: any | null;
  lastQuickUpdateBody: any | null;
  lastColumnPatchBody: any | null;
};

async function setupInventoryMocks(
  page: Page,
  options?: {
    items?: InventoryItem[];
    columns?: ColumnDef[];
    empty?: boolean;
    failCreate?: boolean;
  }
): Promise<InventoryMockState> {
  let items: InventoryItem[] =
    options?.empty
      ? []
      : options?.items ?? [
          {
            _id: "1",
            name: "Beef Patty",
            unit: "piece",
            unitCost: 2.5,
            inStock: 10,
            reorderPoint: 4,
            customFields: { supplier: "Tyson" },
          },
          {
            _id: "2",
            name: "Milk",
            unit: "gal",
            unitCost: 3,
            inStock: 5,
            reorderPoint: 6,
            customFields: { supplier: "Organic Valley" },
          },
          {
            _id: "3",
            name: "Napkins",
            unit: "piece",
            unitCost: 1,
            inStock: 0,
            reorderPoint: 2,
            customFields: { supplier: "Sysco" },
          },
        ];

  let columns: ColumnDef[] =
    options?.columns ?? [
      {
        key: "supplier",
        label: "Supplier",
        type: "text",
        visible: true,
        order: 1,
      },
    ];

  const state: InventoryMockState = {
    getItems: () => items,
    getColumns: () => columns,
    lastCreateBody: null,
    lastUpdateBody: null,
    lastQuickUpdateBody: null,
    lastColumnPatchBody: null,
  };

  await page.route("**/api/inventory", async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: items,
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
            error: "Failed to save item",
          }),
        });
      }

      const created = {
        _id: `i-${items.length + 1}`,
        ...body,
        customFields: body.customFields ?? {},
      };

      items = [created, ...items];

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: created,
        }),
      });
    }

    return route.fallback();
  });

  await page.route("**/api/inventory/*", async (route) => {
    const req = route.request();
    const method = req.method();
    const id = new URL(req.url()).pathname.split("/").pop()!;

    if (method === "GET") {
      const found = items.find((item) => item._id === id);
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

      const updated = {
        ...items.find((item) => item._id === id),
        ...body,
      };

      items = items.map((item) => (item._id === id ? { ...item, ...updated } : item));

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: updated,
        }),
      });
    }

    if (method === "PATCH") {
      const body = req.postDataJSON() as any;
      state.lastQuickUpdateBody = body;

      const updated = {
        ...items.find((item) => item._id === id),
        ...body,
      };

      items = items.map((item) => (item._id === id ? { ...item, ...updated } : item));

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
      items = items.filter((item) => item._id !== id);

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fallback();
  });

  await page.route("**/api/columns", async (route) => {
    const req = route.request();
    const method = req.method();

    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: columns,
        }),
      });
    }

    if (method === "PATCH") {
      const body = req.postDataJSON() as any;
      state.lastColumnPatchBody = body;

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    if (method === "POST") {
      const body = req.postDataJSON() as any;
      columns = [
        ...columns,
        {
          key: body.key ?? "new_column",
          label: body.label ?? "New Column",
          type: body.type ?? "text",
          visible: true,
          order: columns.length + 1,
        },
      ];

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fallback();
  });

  await page.route("**/api/columns/*", async (route) => {
    const req = route.request();
    const method = req.method();
    const key = new URL(req.url()).pathname.split("/").pop()!;

    if (method === "DELETE") {
      columns = columns.filter((col) => col.key !== key);

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }

    return route.fallback();
  });

  return state;
}

async function gotoInventory(page: Page) {
  await page.goto("/dashboard/inventory");
  await expect(page.getByText(/^inventory$/i).first()).toBeVisible();
}

function inventoryTable(page: Page) {
  return page.getByRole("table");
}

function inventoryRow(page: Page, exactName: string) {
  return page.locator("tbody tr", {
    has: page.getByRole("cell", { name: exactName, exact: true }),
  });
}

async function openCreateForm(page: Page) {
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page.getByText("New Inventory Item")).toBeVisible();
}

/**
 * Opens the row-level dropdown menu for the given item name.
 * Tries the first button in the row; if a menu/popover doesn't appear within
 * 2 s it falls back to every button in the row until something opens.
 */
async function openRowMenu(page: Page, exactName: string) {
  const row = inventoryRow(page, exactName);
  await expect(row).toBeVisible();

  // Try every button in the row until a dropdown/menu becomes visible.
  const buttons = row.locator("button");
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    await buttons.nth(i).click();

    // Wait briefly to see if any recognisable menu content appears.
    const menuAppeared = await page
      .locator(
        [
          '[role="menu"]',
          '[role="listbox"]',
          '[data-radix-popper-content-wrapper]',
          '.dropdown-content',
          '[data-state="open"]',
        ].join(", ")
      )
      .isVisible()
      .catch(() => false);

    if (menuAppeared) return;

    // Also check whether the specific action text is now visible on the page.
    const actionVisible = await page
      .getByText(/edit item details|update quantity\/cost/i)
      .isVisible()
      .catch(() => false);

    if (actionVisible) return;
  }
}

/**
 * Clicks an action inside an open dropdown menu.
 * Searches by role="menuitem", role="option", plain button, and link text —
 * whichever the app actually renders.
 */
async function clickMenuAction(page: Page, namePattern: RegExp) {
  // Prefer semantic menu roles first, then fall back to any clickable element.
  const candidates = [
    page.getByRole("menuitem", { name: namePattern }),
    page.getByRole("option",   { name: namePattern }),
    page.getByRole("button",   { name: namePattern }),
    page.getByRole("link",     { name: namePattern }),
    page.locator(`[role="menuitem"]`).filter({ hasText: namePattern }),
    page.locator("button, a, li, [tabindex]").filter({ hasText: namePattern }),
  ];

  for (const locator of candidates) {
    const visible = await locator.first().isVisible().catch(() => false);
    if (visible) {
      await locator.first().click();
      return;
    }
  }

  throw new Error(`Menu action matching ${namePattern} was not found or not visible`);
}

async function openEditForm(page: Page, exactName: string) {
  await openRowMenu(page, exactName);
  await clickMenuAction(page, /edit item details/i);

  await expect(page.locator("form")).toBeVisible();
  await expect(page.getByRole("button", { name: /save changes|save item/i })).toBeVisible();
}

async function openQuickUpdate(page: Page, exactName: string) {
  await openRowMenu(page, exactName);
  await clickMenuAction(page, /update quantity\/cost/i);

  const visibleNumberInputs = page.locator('input[type="number"]:visible');
  await expect(visibleNumberInputs).toHaveCount(2);
  await expect(page.getByRole("button", { name: /^update$/i })).toBeVisible();
}

async function setUnitValue(page: Page, value: string) {
  const form = page.locator("form");
  const combo = form.getByRole("combobox").first();

  await expect(combo).toBeVisible();

  const tagName = await combo.evaluate((el) => el.tagName.toLowerCase());

  if (tagName === "select") {
    await combo.selectOption({ value }).catch(async () => {
      await combo.selectOption({ label: value });
    });
    return;
  }

  await combo.fill(value);
  await combo.dispatchEvent("input");
  await combo.dispatchEvent("change");
}

test.describe("InventoryPage", () => {
  let mockState: InventoryMockState;

  test.beforeEach(async ({ page }) => {
    mockState = await setupInventoryMocks(page);
    await gotoInventory(page);
  });

  test("loads inventory and shows totals + statuses", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 3, name: "Inventory Items" })
    ).toBeVisible();

    await expect(page.getByText("Total items: 3")).toBeVisible();
    await expect(page.getByText("$40.00")).toBeVisible();

    const tbody = page.locator("tbody");
    await expect(tbody.getByText("Beef Patty", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Milk", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Napkins", { exact: true })).toBeVisible();
  });

  test("renders inventory rows and custom field values", async ({ page }) => {
    const tbody = page.locator("tbody");

    await expect(tbody.getByText("Beef Patty", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Milk", { exact: true })).toBeVisible();
    await expect(tbody.getByText("Napkins", { exact: true })).toBeVisible();

    await expect(page.getByText("Tyson")).toBeVisible();
    await expect(page.getByText("Organic Valley")).toBeVisible();
    await expect(page.getByText("Sysco")).toBeVisible();
  });

  test("opens and closes the add item form", async ({ page }) => {
    await openCreateForm(page);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("New Inventory Item")).toHaveCount(0);
  });

  test("keeps form visible when save is clicked empty", async ({ page }) => {
    await openCreateForm(page);
    await page.getByRole("button", { name: "Save Item" }).click();

    await expect(page.getByText("New Inventory Item")).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("creates an item via POST and shows it in the table", async ({ page }) => {
    await page.unroute("**/api/inventory");
    mockState = await setupInventoryMocks(page, { empty: true });
    await gotoInventory(page);

    await expect(page.getByText("Total items: 0")).toBeVisible();
    await expect(
      page.getByText(/No inventory items yet\. Add your first item to get started\./i)
    ).toBeVisible();

    await openCreateForm(page);

    const form = page.locator("form");
    await form.getByPlaceholder("Beef Patty").fill("Beef Patty");
    await setUnitValue(page, "piece");
    await form.getByPlaceholder("0.25").fill("2.5");

    const numberInputs = form.locator('input[type="number"]');
    await numberInputs.nth(1).fill("10");
    await numberInputs.nth(2).fill("3");

    await form.getByRole("button", { name: "Save Item" }).click();

    await expect.poll(() => mockState.lastCreateBody?.name).toBe("Beef Patty");
    await expect.poll(() => mockState.lastCreateBody?.unit).toBe("piece");
    await expect.poll(() => mockState.lastCreateBody?.unitCost).toBe(2.5);
    await expect.poll(() => mockState.lastCreateBody?.inStock).toBe(10);
    await expect.poll(() => mockState.lastCreateBody?.reorderPoint).toBe(3);

    const tbody = page.locator("tbody");
    await expect(tbody.getByText("Beef Patty", { exact: true })).toBeVisible();
    await expect(page.getByText("Total items: 1")).toBeVisible();
    await expect(page.getByText("$25.00")).toBeVisible();
  });

  test("sorts inventory rows by total value", async ({ page }) => {
    const table = inventoryTable(page);
    const totalValueHeader = table.getByRole("columnheader", {
      name: /total value/i,
    });

    await totalValueHeader.click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Napkins");
    await expect(rows.nth(2)).toContainText("Milk");
    await expect(rows.nth(3)).toContainText("Beef Patty");
  });

  test("sorts inventory rows by status", async ({ page }) => {
    const table = inventoryTable(page);
    const statusHeader = table.getByRole("columnheader", {
      name: /^status$/i,
    });

    await statusHeader.click();

    const rows = table.getByRole("row");
    await expect(rows.nth(1)).toContainText("Napkins");
  });

  test("opens quick update form", async ({ page }) => {
    await openQuickUpdate(page, "Beef Patty");
  });



  test("cancels quick update form", async ({ page }) => {
    await openQuickUpdate(page, "Beef Patty");

    const cancelButtons = page.getByRole("button", { name: "Cancel" });
    await cancelButtons.last().click();

    await expect(page.getByRole("button", { name: /^update$/i })).toHaveCount(0);
  });

  test("loads item into form for editing", async ({ page }) => {
    await openEditForm(page, "Beef Patty");
    // Use attribute selector instead of getByDisplayValue (not available in this Playwright version).
    await expect(page.locator('input[value="Beef Patty"], textarea[value="Beef Patty"]').first()).toBeVisible();
  });

  test("updates an existing item", async ({ page }) => {
    await openEditForm(page, "Beef Patty");

    // Clear and fill the name field.
    const nameInput = page.locator('input[value="Beef Patty"]').first();
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill("Beef Patty Deluxe");

    // Clear and fill the unit cost field.
    const costInput = page.locator('input[value="2.5"]').first();
    await costInput.click({ clickCount: 3 });
    await costInput.fill("3.25");

    await page.getByRole("button", { name: /save changes|save item/i }).click();

    await expect.poll(() => mockState.lastUpdateBody?.name).toBe("Beef Patty Deluxe");
    await expect.poll(() => mockState.lastUpdateBody?.unitCost).toBe(3.25);
  });

  test("deletes an existing item", async ({ page }) => {
    await openEditForm(page, "Beef Patty");

    // Accept any confirmation dialog the app may show before deleting.
    page.once("dialog", (dialog) => dialog.accept());

    // Wait for the DELETE request to complete before asserting the row is gone.
    const deleteRequest = page.waitForResponse(
      (res) => res.url().includes("/api/inventory/") && res.request().method() === "DELETE",
      { timeout: 10000 }
    );

    await page.getByRole("button", { name: /^delete$/i }).click();
    await deleteRequest;

    await expect(page.getByRole("cell", { name: "Beef Patty", exact: true })).toHaveCount(0);
  });

  test("opens manage columns panel", async ({ page }) => {
    await page.getByRole("button", { name: /manage columns/i }).click();

    await expect(page.getByText(/manage columns/i)).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Supplier", exact: true })).toBeVisible();
  });

  test("toggles a column visibility", async ({ page }) => {
    await page.getByRole("button", { name: /manage columns/i }).click();
    await expect(page.getByText(/manage columns/i)).toBeVisible();

    // Set up the PATCH listener BEFORE clicking anything.
    const patchPromise = page.waitForRequest(
      (req) => req.url().includes("/api/columns") && req.method() === "PATCH",
      { timeout: 15000 }
    );

    // Strategy 1: look for eye icon buttons (eye/eye-slash icons wrapped in a button).
    const eyeButtons = page.locator(
      'button:has(svg), button[aria-label*="isible" i], button[title*="isible" i], button[aria-label*="eye" i]'
    );

    // Strategy 2: look for checkboxes or switches that control visibility.
    const toggleInputs = page.locator('[role="switch"], input[type="checkbox"]');

    // Strategy 3: any SVG inside the panel that looks like an eye icon (click its parent).
    const eyeSvgs = page.locator('svg[data-testid*="eye"], svg[class*="eye"]');

    let triggered = false;

    // Try eye-style buttons first.
    const eyeCount = await eyeButtons.count();
    for (let i = 0; i < eyeCount && !triggered; i++) {
      const el = eyeButtons.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;

      // Skip buttons that are clearly for other actions.
      const text = (await el.innerText().catch(() => "")).toLowerCase();
      const label = (await el.getAttribute("aria-label") ?? "").toLowerCase();
      if (/add|close|delete|cancel|save|manage|column name/i.test(text + label)) continue;

      await el.click().catch(() => {});
      triggered = true;
    }

    // Try toggle inputs if no eye button worked.
    if (!triggered) {
      const toggleCount = await toggleInputs.count();
      for (let i = 0; i < toggleCount && !triggered; i++) {
        const el = toggleInputs.nth(i);
        if (!(await el.isVisible().catch(() => false))) continue;
        await el.click().catch(() => {});
        triggered = true;
      }
    }

    // Try clicking the SVG directly (some frameworks attach click handlers to the SVG).
    if (!triggered) {
      const svgCount = await eyeSvgs.count();
      for (let i = 0; i < svgCount && !triggered; i++) {
        const el = eyeSvgs.nth(i);
        if (!(await el.isVisible().catch(() => false))) continue;
        await el.click().catch(() => {});
        triggered = true;
      }
    }

    expect(triggered, "Could not find a visibility toggle element in the manage columns panel").toBe(true);

    // Wait for the PATCH to arrive (or fail with a clear timeout message).
    await patchPromise;
    await expect.poll(() => mockState.lastColumnPatchBody).not.toBeNull();
  });

  test("opens add column form", async ({ page }) => {
    await page.getByRole("button", { name: /manage columns/i }).click();
    await page.getByRole("button", { name: /\+ add column/i }).click();

    await expect(page.getByPlaceholder(/column name/i)).toBeVisible();
  });

  test("deletes a custom column", async ({ page }) => {
    await page.getByRole("button", { name: /manage columns/i }).click();

    const deleteButtons = page.getByTitle("Delete column");
    await expect(deleteButtons.first()).toBeVisible();
    await deleteButtons.first().click();

    await expect(deleteButtons).toHaveCount(1);
  });

  test("shows empty state when inventory is empty", async ({ page }) => {
    await page.unroute("**/api/inventory");
    await page.unroute("**/api/columns");
    mockState = await setupInventoryMocks(page, { empty: true });
    await gotoInventory(page);

    await expect(
      page.getByText(/no inventory items yet/i)
    ).toBeVisible();
  });

  test("keeps form open when save fails", async ({ page }) => {
    await page.unroute("**/api/inventory");
    mockState = await setupInventoryMocks(page, { empty: true, failCreate: true });
    await gotoInventory(page);

    await openCreateForm(page);

    const form = page.locator("form");
    await form.getByPlaceholder("Beef Patty").fill("Broken Item");
    await setUnitValue(page, "piece");
    await form.getByPlaceholder("0.25").fill("2.5");

    const numberInputs = form.locator('input[type="number"]');
    await numberInputs.nth(1).fill("10");
    await numberInputs.nth(2).fill("3");

    await form.getByRole("button", { name: "Save Item" }).click();

    await expect(page.locator("form")).toBeVisible();
  });
});