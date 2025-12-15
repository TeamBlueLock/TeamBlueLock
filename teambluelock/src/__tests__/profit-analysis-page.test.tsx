/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ProfitAnalysisPage from "@/app/dashboard/profit-analysis/page";

describe("ProfitAnalysisPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads profit analysis and renders rows + totals (GET)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
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

    render(<ProfitAnalysisPage />);

    expect(await screen.findByRole("heading", { name: "Profit Analysis" })).toBeInTheDocument();
    expect(await screen.findByText("Total recipes: 2")).toBeInTheDocument();

    // Row 1
    expect(screen.getByText("Smash Burger")).toBeInTheDocument();
    expect(screen.getByText("12.00")).toBeInTheDocument();
    expect(screen.getByText("4.50")).toBeInTheDocument();
    expect(screen.getByText("7.50")).toBeInTheDocument();
    expect(screen.getByText("62.5%")).toBeInTheDocument();
    expect(screen.getByText("All ingredients linked")).toBeInTheDocument();

    // Row 2
    expect(screen.getByText("Mystery Burger")).toBeInTheDocument();
    expect(screen.getByText("Secret Sauce, Gold Leaf")).toBeInTheDocument();

    // Footer
    expect(screen.getByText(/Margin is calculated as/i)).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/profit-analysis",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  test("shows empty state when API returns 0 rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<ProfitAnalysisPage />);

    // ✅ Wait for loading to finish before checking empty-state row
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Total recipes: 0")).toBeInTheDocument();
    expect(
      screen.getByText(
        /No recipes or inventory data yet\. Add inventory items and recipes to see profit analysis\./i
      )
    ).toBeInTheDocument();
  });
});
