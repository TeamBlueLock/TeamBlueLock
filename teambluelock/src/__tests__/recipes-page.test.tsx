import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecipesPage from "@/app/dashboard/recipes/page";

// Mock button component so tests focus on behavior.
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock units list used to build unit dropdowns.
jest.mock("@/lib/units", () => ({
  UNITS: {
    lb: { category: "mass" },
    kg: { category: "mass" },
    g: { category: "mass" },
    ml: { category: "volume" },
    liter: { category: "volume" },
    each: { category: "count" },
  },
}));

// Mock unit conversion helpers used during ingredient validation/conversion.
jest.mock("@/lib/unitConversion", () => ({
  convertToBase: (quantity: number, unit: string) => {
    const map: Record<string, string> = {
      lb: "g",
      kg: "g",
      g: "g",
      ml: "ml",
      liter: "ml",
      each: "each",
    };
    return { quantity, baseUnit: map[unit] || unit };
  },
  getUnitCategory: (unit: string) => {
    if (unit === "g") return "mass";
    if (unit === "ml") return "volume";
    if (unit === "each") return "count";
    return "unknown";
  },
}));

describe("RecipesPage", () => {
  // Fake inventory data used to populate ingredient autocomplete and conversion logic.
  const inventoryData = [
    {
      _id: "inv1",
      name: "Beef Patty",
      unit: "lb",
      unitCost: 10,
      baseUnit: "g",
      costPerBaseUnit: 0.01,
    },
    {
      _id: "inv2",
      name: "Bun",
      unit: "each",
      unitCost: 1,
      baseUnit: "each",
      costPerBaseUnit: 1,
    },
  ];

  // Fake recipe table data.
  const recipesData = [
    {
      _id: "r1",
      name: "Burger",
      category: "Dinner",
      subCategory: "Burgers",
      menuPrice: 12,
      createdAt: "2026-03-17T00:00:00.000Z",
    },
    {
      _id: "r2",
      name: "Fries",
      category: "Sides",
      subCategory: "Potatoes",
      menuPrice: 5,
      createdAt: "2026-03-17T00:00:00.000Z",
    },
  ];

  // Helper: get the actual unit <select>, not the datalist-backed input.
  function getUnitSelect(): HTMLSelectElement {
    const comboboxes = screen.getAllByRole("combobox");
    const unitSelect = comboboxes.find(
      (el) => el.tagName.toLowerCase() === "select"
    ) as HTMLSelectElement | undefined;

    if (!unitSelect) {
      throw new Error("Could not find unit select");
    }

    return unitSelect;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
    window.scrollTo = jest.fn();

    // Mock all page API requests.
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url === "/api/inventory" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: inventoryData,
          }),
        } as Response);
      }

      if (url === "/api/recipes" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: recipesData,
          }),
        } as Response);
      }

      if (url === "/api/recipes" && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              _id: "r3",
              name: "Smash Burger",
              category: "Dinner",
              subCategory: "Burgers",
              menuPrice: 14,
            },
          }),
        } as Response);
      }

      if (url === "/api/recipes/r1" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              _id: "r1",
              name: "Burger",
              category: "Dinner",
              subCategory: "Burgers",
              menuPrice: 12,
              ingredients: [
                { name: "Beef Patty", unit: "g", quantity: 150 },
                { name: "Bun", unit: "each", quantity: 1 },
              ],
            },
          }),
        } as Response);
      }

      if (url === "/api/recipes/r1" && method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              _id: "r1",
              name: "Burger Deluxe",
              category: "Dinner",
              subCategory: "Burgers",
              menuPrice: 15,
            },
          }),
        } as Response);
      }

      if (url === "/api/recipes/r1" && method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
          }),
        } as Response);
      }

      if (url === "/api/inventory/inv1" && method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      } as Response);
    }) as jest.Mock;
  });

  it("renders existing recipes after load", async () => {
    // Confirm fetched recipes appear in the table.
    render(<RecipesPage />);

    expect(await screen.findByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
    expect(screen.getByText(/total recipes:\s*2/i)).toBeInTheDocument();
  });

  it("opens and closes the add recipe form", async () => {
    // Open the new recipe form, then close it.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    expect(screen.getByText(/^new recipe$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Use exact heading match so we do not accidentally match the Add New Recipe button.
    expect(screen.queryByText(/^new recipe$/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Smash Burger")).not.toBeInTheDocument();
  });

  it("keeps form visible when save is clicked with missing recipe name", async () => {
    // Save with empty recipe name should not close form.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    fireEvent.click(screen.getByRole("button", { name: /save recipe/i }));

    expect(screen.getByText(/new recipe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Smash Burger")).toBeInTheDocument();
  });

  it("keeps form visible when save is clicked without a valid ingredient", async () => {
    // Save with a recipe name but no usable ingredients should leave form open.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    fireEvent.change(screen.getByPlaceholderText("Smash Burger"), {
      target: { value: "Smash Burger" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save recipe/i }));

    expect(screen.getByText(/new recipe/i)).toBeInTheDocument();
  });

  it("adds another ingredient row", async () => {
    // Clicking + Add Ingredient should create a second ingredient input row.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+ add ingredient/i }));

    const ingredientInputs = screen.getAllByPlaceholderText("Beef Patty");
    expect(ingredientInputs).toHaveLength(2);
  });

  it("removes an ingredient row", async () => {
    // Add a second row, then remove it and confirm only one remains.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+ add ingredient/i }));

    let ingredientInputs = screen.getAllByPlaceholderText("Beef Patty");
    expect(ingredientInputs).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);

    ingredientInputs = screen.getAllByPlaceholderText("Beef Patty");
    expect(ingredientInputs).toHaveLength(1);
  });

  it("creates a new recipe successfully", async () => {
    // Fill in recipe form and submit it successfully.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));

    fireEvent.change(screen.getByPlaceholderText("Smash Burger"), {
      target: { value: "Smash Burger" },
    });

    fireEvent.change(screen.getByPlaceholderText("12.00"), {
      target: { value: "14" },
    });

    fireEvent.change(screen.getByPlaceholderText("Dinner"), {
      target: { value: "Dinner" },
    });

    fireEvent.change(screen.getByPlaceholderText("Burgers"), {
      target: { value: "Burgers" },
    });

    const ingredientNameInputs = screen.getAllByPlaceholderText("Beef Patty");
    fireEvent.change(ingredientNameInputs[0], {
      target: { value: "Beef Patty" },
    });

    fireEvent.change(getUnitSelect(), {
      target: { value: "g" },
    });

    fireEvent.change(screen.getByPlaceholderText("1"), {
      target: { value: "150" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save recipe/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/recipes",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(await screen.findByText("Smash Burger")).toBeInTheDocument();
  });

  it("sorts recipes by menu price", async () => {
    // Sort the recipe table ascending then descending by menu price.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    const table = screen.getByRole("table");
    const headerRow = within(table).getAllByRole("row")[0];
    const menuPriceHeader = within(headerRow).getByText("Menu Price ($)");

    fireEvent.click(menuPriceHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Fries");
      expect(rows[2]).toHaveTextContent("Burger");
    });

    fireEvent.click(menuPriceHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Burger");
      expect(rows[2]).toHaveTextContent("Fries");
    });
  });

  it("loads recipe into form for editing", async () => {
    // Click Edit and confirm existing recipe data loads into the form.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit recipe/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Burger")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
  });

  it("updates a recipe successfully", async () => {
    // Edit recipe fields, save, and confirm PUT request fires.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit recipe/i)).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Burger"), {
      target: { value: "Burger Deluxe" },
    });

    fireEvent.change(screen.getByDisplayValue("12"), {
      target: { value: "15" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/recipes/r1",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(await screen.findByText("Burger Deluxe")).toBeInTheDocument();
  });

  it("deletes a recipe successfully", async () => {
    // Click Delete and confirm DELETE request fires.
    render(<RecipesPage />);
    await screen.findByText("Burger");

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/recipes/r1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  it("opens conversion modal when units mismatch", async () => {
    // Return inventory with baseUnit 'g' so selecting 'each' in the recipe creates a mismatch.
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url === "/api/inventory" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                _id: "inv1",
                name: "Beef Patty",
                unit: "lb",
                unitCost: 10,
                baseUnit: "g",
                costPerBaseUnit: 0.01,
              },
            ],
          }),
        } as Response);
      }

      if (url === "/api/recipes" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: recipesData,
          }),
        } as Response);
      }

      // If modal fails and POST happens, this makes it obvious in the DOM.
      if (url === "/api/recipes" && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              _id: "bad-post",
              name: "__SHOULD_NOT_SAVE__",
              category: "",
              subCategory: "",
              menuPrice: 0,
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);
    });

    render(<RecipesPage />);
    expect(await screen.findByText("Burger")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));

    await waitFor(() => {
      expect(screen.queryByText(/loading inventory/i)).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Smash Burger"), {
      target: { value: "Patty Special" },
    });

    const ingredientNameInputs = screen.getAllByPlaceholderText("Beef Patty");
    fireEvent.change(ingredientNameInputs[0], {
      target: { value: "Beef Patty" },
    });

    fireEvent.change(getUnitSelect(), {
      target: { value: "each" },
    });

    fireEvent.change(screen.getByPlaceholderText("1"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save recipe/i }));

    expect(
      await screen.findByText(/define conversion for beef patty/i)
    ).toBeInTheDocument();

    expect(screen.queryByText("__SHOULD_NOT_SAVE__")).not.toBeInTheDocument();
  });

it("cancels conversion modal", async () => {
  (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url === "/api/inventory" && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              _id: "inv1",
              name: "Beef Patty",
              unit: "lb",
              unitCost: 10,
              baseUnit: "g",
              costPerBaseUnit: 0.01,
            },
          ],
        }),
      } as Response);
    }

    if (url === "/api/recipes" && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: recipesData,
        }),
      } as Response);
    }

    if (url === "/api/recipes" && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            _id: "bad-post",
            name: "__SHOULD_NOT_SAVE__",
            category: "",
            subCategory: "",
            menuPrice: 0,
          },
        }),
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);
  });

  render(<RecipesPage />);
  expect(await screen.findByText("Burger")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /add new recipe/i }));

  await waitFor(() => {
    expect(screen.queryByText(/loading inventory/i)).not.toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText("Smash Burger"), {
    target: { value: "Patty Special" },
  });

  const ingredientNameInputs = screen.getAllByPlaceholderText("Beef Patty");
  fireEvent.change(ingredientNameInputs[0], {
    target: { value: "Beef Patty" },
  });

  fireEvent.change(getUnitSelect(), {
    target: { value: "each" },
  });

  fireEvent.change(screen.getByPlaceholderText("1"), {
    target: { value: "2" },
  });

  fireEvent.click(screen.getByRole("button", { name: /save recipe/i }));

  const modalHeading = await screen.findByText(/define conversion for beef patty/i);
  expect(modalHeading).toBeInTheDocument();

  const modalCard = modalHeading.closest(".bg-white");
  if (!modalCard) {
    throw new Error("Could not find conversion modal container");
  }

  const modalCancelButton = within(modalCard).getByRole("button", { name: /^cancel$/i });
  fireEvent.click(modalCancelButton);

  await waitFor(() => {
    expect(screen.queryByText(/define conversion for beef patty/i)).not.toBeInTheDocument();
  });

  expect(screen.queryByText("__SHOULD_NOT_SAVE__")).not.toBeInTheDocument();
});

  it("shows empty state when there are no recipes", async () => {
    // Return an empty recipes list and verify empty-state message appears.
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url === "/api/inventory" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: inventoryData,
          }),
        } as Response);
      }

      if (url === "/api/recipes" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      } as Response);
    });

    render(<RecipesPage />);

    expect(
      await screen.findByText(/no recipes yet\. add your first recipe to get started/i)
    ).toBeInTheDocument();
  });
});