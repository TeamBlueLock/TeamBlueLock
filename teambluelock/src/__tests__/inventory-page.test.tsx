/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryPage from "@/app/dashboard/Inventory/page";

function mockFetchOnce(json: any) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => json,
  } as any);
}

describe("InventoryPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads inventory and renders totals + statuses (GET)", async () => {
    mockFetchOnce({
      success: true,
      data: [
        { _id: "i1", name: "Beef Patty", unit: "piece", unitCost: 2.5, inStock: 0, reorderPoint: 5 },
        { _id: "i2", name: "Buns", unit: "piece", unitCost: 0.5, inStock: 4, reorderPoint: 4 },
        { _id: "i3", name: "Cheese", unit: "slice", unitCost: 0.25, inStock: 10, reorderPoint: 2 },
      ],
    });

    render(<InventoryPage />);

    expect(await screen.findByRole("heading", { name: "Inventory" })).toBeInTheDocument();

    // ✅ wait for GET to finish (your page shows Loading... initially)
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // ✅ text is split across nodes in the DOM -> use regex matchers
    expect(screen.getByText(/Total items:\s*3/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s*4\.50/)).toBeInTheDocument();

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(screen.getByText("Reorder")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();

    expect(screen.getByText("Beef Patty")).toBeInTheDocument();
    expect(screen.getByText("Buns")).toBeInTheDocument();
    expect(screen.getByText("Cheese")).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/inventory",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  test("shows empty state when GET returns []", async () => {
    mockFetchOnce({ success: true, data: [] });

    render(<InventoryPage />);

    expect(await screen.findByRole("heading", { name: "Inventory" })).toBeInTheDocument();

    // ✅ wait for loading to finish before asserting empty state
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Total items:\s*0/i)).toBeInTheDocument();

    expect(
      screen.getByText(/No inventory items yet\. Add your first item to get started\./i)
    ).toBeInTheDocument();
  });

  test("creates an item via POST and updates list/totals", async () => {
    // GET
    mockFetchOnce({ success: true, data: [] });

    // POST
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: "i-new",
          name: "Beef Patty",
          unit: "piece",
          unitCost: 2.5,
          inStock: 10,
          reorderPoint: 3,
        },
      }),
    });

    render(<InventoryPage />);

    expect(await screen.findByRole("heading", { name: "Inventory" })).toBeInTheDocument();

    // ✅ ensure initial GET finished so the UI is stable
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Total items:\s*0/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add item/i }));

    // ✅ correct way to grab the form (no role="form")
    const section = screen.getByText("New Inventory Item").closest("section")!;
    const form = section.querySelector("form")!;
    const scope = within(form);

    const textboxes = scope.getAllByRole("textbox");
    await userEvent.type(textboxes[0], "Beef Patty");
    await userEvent.type(textboxes[1], "piece");

    const nums = scope.getAllByRole("spinbutton");
    await userEvent.type(nums[0], "2.5");
    await userEvent.type(nums[1], "10");
    await userEvent.type(nums[2], "3");

    await userEvent.click(scope.getByRole("button", { name: /save item/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inventory",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Beef Patty",
            unit: "piece",
            unitCost: 2.5,
            inStock: 10,
            reorderPoint: 3,
          }),
        })
      );
    });

    // ✅ totals/value also split across nodes -> use regex
    expect(await screen.findByText(/Total items:\s*1/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s*25\.00/)).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Beef Patty")).toBeInTheDocument();
  });
});
