import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import InventoryPage from "@/app/dashboard/inventory/page";

// Mock the eye icons used in Manage Columns so Jest doesn't fail on SVG imports.
jest.mock("@heroicons/react/24/solid", () => ({
  EyeIcon: (props: any) => <svg data-testid="eye-icon" {...props} />,
  EyeSlashIcon: (props: any) => <svg data-testid="eye-slash-icon" {...props} />,
}));

// Mock your Button component so tests focus on behavior, not styling.
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock dropdown menu components so menu items are always visible/clickable in tests.
jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Mock units so the page can build grouped unit dropdowns.
jest.mock("@/lib/units", () => ({
  UNITS: {
    lb: { category: "weight" },
    kg: { category: "weight" },
    oz: { category: "weight" },
    gal: { category: "volume" },
    liter: { category: "volume" },
    each: { category: "count" },
  },
}));

describe("InventoryPage", () => {
  // Fake inventory data returned from the mocked API.
  const inventoryData = [
    {
      _id: "1",
      name: "Beef Patty",
      unit: "each",
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
      unit: "each",
      unitCost: 1,
      inStock: 0,
      reorderPoint: 2,
      customFields: { supplier: "Sysco" },
    },
  ];

  // Fake custom column data.
  const columnsData = [
    {
      key: "supplier",
      label: "Supplier",
      type: "text",
      visible: true,
      order: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
    window.scrollTo = jest.fn();

    // Mock fetch for all page API calls.
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      // Load inventory list.
      if (url === "/api/inventory" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: inventoryData,
          }),
        } as Response);
      }

      // Load columns list.
      if (url === "/api/columns" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: columnsData,
          }),
        } as Response);
      }

      // Create inventory item.
      if (url === "/api/inventory" && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              _id: "4",
              name: "Cheese",
              unit: "lb",
              unitCost: 4.25,
              inStock: 7,
              reorderPoint: 2,
              customFields: {},
            },
          }),
        } as Response);
      }

      // Load one item for editing.
      if (url === "/api/inventory/1" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: inventoryData[0],
          }),
        } as Response);
      }

      // Update one item.
      if (url === "/api/inventory/1" && method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              ...inventoryData[0],
              name: "Beef Patty Deluxe",
              unitCost: 3.25,
            },
          }),
        } as Response);
      }

      // Quick update patch.
      if (url === "/api/inventory/1" && method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              ...inventoryData[0],
              inStock: 20,
              unitCost: 3.5,
            },
          }),
        } as Response);
      }

      // Delete one item.
      if (url === "/api/inventory/1" && method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
          }),
        } as Response);
      }

      // Toggle column visibility.
      if (url === "/api/columns" && method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      }

      // Add column.
      if (url === "/api/columns" && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      }

      // Delete column.
      if (url === "/api/columns/supplier" && method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
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

  it("renders inventory items after load", async () => {
    // Render the page and wait for fetched data to appear.
    render(<InventoryPage />);

    // Confirm inventory rows and custom field values appear.
    expect(await screen.findByText("Beef Patty")).toBeInTheDocument();
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("Napkins")).toBeInTheDocument();
    expect(screen.getByText("Tyson")).toBeInTheDocument();
    expect(screen.getByText("Organic Valley")).toBeInTheDocument();
  });

  it("shows total items and estimated inventory value", async () => {
    // Confirm summary values at the top of the table are calculated/rendered.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    expect(screen.getByText(/total items:\s*3/i)).toBeInTheDocument();
    expect(screen.getByText("$40.00")).toBeInTheDocument();
  });

  it("opens and closes the add item form", async () => {
    // Open the add-item form, then close it again.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(screen.getByText(/new inventory item/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText(/new inventory item/i)).not.toBeInTheDocument();
  });

  it("keeps form visible when save is clicked empty", async () => {
    // Clicking save with empty fields should not crash or close the form.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    fireEvent.click(screen.getByRole("button", { name: /save item/i }));

    expect(screen.getByText(/new inventory item/i)).toBeInTheDocument();
  });

  it("creates a new inventory item", async () => {
    // Fill in the new item form and submit it.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /add item/i }));

    fireEvent.change(screen.getByPlaceholderText("Beef Patty"), {
      target: { value: "Cheese" },
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "lb" },
    });

    fireEvent.change(screen.getByPlaceholderText("0.25"), {
      target: { value: "4.25" },
    });

    const zeroInputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(zeroInputs[0], { target: { value: "7" } });
    fireEvent.change(zeroInputs[1], { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /save item/i }));

    // Confirm the POST request happened.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inventory",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    // Confirm the newly created item appears in the table.
    expect(await screen.findByText("Cheese")).toBeInTheDocument();
  });

  it("sorts inventory rows by total value", async () => {
    // Click the Total Value header and verify row order changes.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    const table = screen.getByRole("table");
    fireEvent.click(screen.getByText(/total value/i));

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Napkins");
      expect(rows[2]).toHaveTextContent("Milk");
      expect(rows[3]).toHaveTextContent("Beef Patty");
    });
  });

  it("sorts inventory rows by status", async () => {
    // Click the Status header and verify inventory order changes.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    const table = screen.getByRole("table");
    fireEvent.click(screen.getByText(/^status/i));

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Napkins");
    });
  });

  it("opens quick update form", async () => {
    // Open the inline quick-update form for an item.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /update quantity\/cost/i })[0]);

    expect(screen.getByText(/update quantity\/cost for beef patty/i)).toBeInTheDocument();
  });

  it("submits quick update", async () => {
    // Fill out the quick-update form and submit it.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /update quantity\/cost/i })[0]);

    const numberInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(numberInputs[numberInputs.length - 2], {
      target: { value: "10" },
    });
    fireEvent.change(numberInputs[numberInputs.length - 1], {
      target: { value: "3.5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^update$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inventory/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("cancels quick update form", async () => {
    // Open quick update, then cancel it and confirm it disappears.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /update quantity\/cost/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText(/update quantity\/cost for beef patty/i)).not.toBeInTheDocument();
  });

  it("loads item into form for editing", async () => {
    // Click edit details and confirm item data loads into the form.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /edit item details/i })[0]);

    expect(await screen.findByText(/edit inventory item/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beef Patty")).toBeInTheDocument();
  });

  it("updates an existing item", async () => {
    // Change the item name and cost, then save changes.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /edit item details/i })[0]);
    expect(await screen.findByText(/edit inventory item/i)).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Beef Patty"), {
      target: { value: "Beef Patty Deluxe" },
    });

    fireEvent.change(screen.getByDisplayValue("2.5"), {
      target: { value: "3.25" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inventory/1",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(await screen.findByText("Beef Patty Deluxe")).toBeInTheDocument();
  });

  it("deletes an existing item", async () => {
    // Delete the currently edited item and confirm DELETE was called.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getAllByRole("button", { name: /edit item details/i })[0]);
    expect(await screen.findByText(/edit inventory item/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inventory/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  it("opens manage columns panel", async () => {
    // Open the column-management panel and verify current custom column is shown.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /manage columns/i }));

    expect(screen.getByText(/manage columns/i)).toBeInTheDocument();

    // "Supplier" appears both in the manage panel and table header, so use getAllByText.
    const supplierLabels = screen.getAllByText("Supplier");
    expect(supplierLabels.length).toBeGreaterThan(0);
  });

  it("toggles a column visibility", async () => {
    // Click the eye icon and verify visibility PATCH request is made.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /manage columns/i }));
    fireEvent.click(screen.getByTestId("eye-icon"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/columns",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("opens add column form", async () => {
    // Open manage columns and then open the add-column subform.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /manage columns/i }));
    fireEvent.click(screen.getByRole("button", { name: /\+ add column/i }));

    expect(screen.getByPlaceholderText(/column name/i)).toBeInTheDocument();
  });

  it("deletes a custom column", async () => {
    // Delete the Supplier custom column.
    render(<InventoryPage />);
    await screen.findByText("Beef Patty");

    fireEvent.click(screen.getByRole("button", { name: /manage columns/i }));

    const deleteButtons = screen.getAllByTitle("Delete column");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/columns/supplier",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  it("shows empty state when inventory is empty", async () => {
    // Override fetch to return an empty inventory list.
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";

      if (url === "/api/inventory" && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        } as Response);
      }

      if (url === "/api/columns" && method === "GET") {
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

    render(<InventoryPage />);

    expect(
      await screen.findByText(/no inventory items yet/i)
    ).toBeInTheDocument();
  });
});