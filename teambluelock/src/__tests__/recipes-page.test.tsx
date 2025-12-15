/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipesPage from "@/app/dashboard/recipes/page";

describe("Dashboard Recipes page", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads, creates, edits, deletes a recipe (mocked API)", async () => {
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

    (global.fetch as jest.Mock).mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input.url;
      const method = (init?.method || "GET").toUpperCase();

      if (url === "/api/inventory" && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [{ _id: "i1", name: "Beef Patty", unit: "piece", unitCost: 2.5 }],
          }),
        } as any;
      }

      if (url === "/api/recipes" && method === "GET") {
        return { ok: true, json: async () => ({ success: true, data: recipes }) } as any;
      }

      if (url === "/api/recipes" && method === "POST") {
        const body = JSON.parse(init.body);

        const created = {
          _id: "r2",
          ...body,
          createdAt: new Date().toISOString(),
        };

        recipes = [created, ...recipes];
        recipeDetails["r2"] = created;

        return { ok: true, json: async () => ({ success: true, data: created }) } as any;
      }

      const match = url.match(/^\/api\/recipes\/(.+)$/);
      if (match) {
        const id = match[1];

        if (method === "GET") {
          const found = recipeDetails[id];
          return {
            ok: !!found,
            json: async () =>
              found ? { success: true, data: found } : { success: false, error: "Not found" },
          } as any;
        }

        if (method === "PUT") {
          const body = JSON.parse(init.body);
          const updated = {
            _id: id,
            ...body,
            createdAt: recipeDetails[id]?.createdAt ?? new Date().toISOString(),
          };
          recipeDetails[id] = updated;
          recipes = recipes.map((r) => (r._id === id ? { ...r, ...updated } : r));
          return { ok: true, json: async () => ({ success: true, data: updated }) } as any;
        }

        if (method === "DELETE") {
          recipes = recipes.filter((r) => r._id !== id);
          delete recipeDetails[id];
          return { ok: true, json: async () => ({ success: true }) } as any;
        }
      }

      return { ok: false, json: async () => ({ success: false, error: "Unhandled" }) } as any;
    });

    render(<RecipesPage />);

    expect(await screen.findByRole("heading", { name: "Recipes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your Recipes" })).toBeInTheDocument();

    // initial list
    expect(await screen.findByText("Old Recipe")).toBeInTheDocument();

    // open create form
    await userEvent.click(screen.getByRole("button", { name: /add new recipe/i }));
    expect(await screen.findByRole("heading", { name: /new recipe/i })).toBeInTheDocument();

    // get create form reliably
    const newSection = screen.getByText(/new recipe/i).closest("section")!;
    const newForm = newSection.querySelector("form")!;
    const scope = within(newForm);

    // add + remove ingredient row
    await userEvent.click(scope.getByRole("button", { name: /\+ add ingredient/i }));
    expect(scope.getAllByPlaceholderText("Beef Patty")).toHaveLength(2);

    await userEvent.click(scope.getAllByRole("button", { name: /remove/i })[0]);
    expect(scope.getAllByPlaceholderText("Beef Patty")).toHaveLength(1);

    // fill recipe name + menuPrice
    await userEvent.clear(scope.getByPlaceholderText("Smash Burger"));
    await userEvent.type(scope.getByPlaceholderText("Smash Burger"), "Smash Burger");

    await userEvent.clear(scope.getByPlaceholderText("12.00"));
    await userEvent.type(scope.getByPlaceholderText("12.00"), "12");

    // ingredient row
    await userEvent.type(scope.getByPlaceholderText("Beef Patty"), "Beef Patty");
    await userEvent.type(scope.getByPlaceholderText("piece, g, kg..."), "piece");

    // quantity: last spinbutton in the form
    const spinbuttons = scope.getAllByRole("spinbutton");
    const qtyInput = spinbuttons[spinbuttons.length - 1];
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, "1");

    await userEvent.click(scope.getByRole("button", { name: /save recipe/i }));

    // created appears
    expect(await screen.findByText("Smash Burger")).toBeInTheDocument();

    // ✅ FIX: the oldTitle's immediate div only contains title/date.
    // climb to the row wrapper that contains the Edit/Delete buttons.
    const oldTitle = screen.getByRole("heading", { level: 4, name: "Old Recipe" });
    const oldRow = oldTitle.closest(".px-6") as HTMLElement;
    await userEvent.click(within(oldRow).getByRole("button", { name: "Edit" }));

    expect(await screen.findByRole("heading", { name: /edit recipe/i })).toBeInTheDocument();

    // get edit form reliably
    const editSection = screen.getByText(/edit recipe/i).closest("section")!;
    const editForm = editSection.querySelector("form")!;
    const editScope = within(editForm);

    await userEvent.clear(editScope.getByPlaceholderText("Smash Burger"));
    await userEvent.type(editScope.getByPlaceholderText("Smash Burger"), "Edited Recipe");
    await userEvent.click(editScope.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Edited Recipe")).toBeInTheDocument();

    // delete Edited Recipe
    const editedTitle = screen.getByRole("heading", { level: 4, name: "Edited Recipe" });
    const editedRow = editedTitle.closest(".px-6") as HTMLElement;
    await userEvent.click(within(editedRow).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Edited Recipe")).not.toBeInTheDocument();
    });
  });
});
