import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfitAnalysisPage from "@/app/dashboard/profit-analysis/page";

// Mock recharts so chart rendering works in Jest/jsdom.
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock UI card components.
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock badge and skeleton UI helpers.
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: (props: any) => <div data-testid="skeleton" {...props} />,
}));

// Mock Tabs so tests can actually switch between Overview and Table.
jest.mock("@/components/ui/tabs", () => {
  const React = require("react");
  const TabsContext = React.createContext<any>(null);

  function Tabs({ children, defaultValue }: any) {
    const [value, setValue] = React.useState(defaultValue);
    return (
      <TabsContext.Provider value={{ value, setValue }}>
        <div>{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabsList({ children }: any) {
    return <div>{children}</div>;
  }

  function TabsTrigger({ children, value }: any) {
    const ctx = React.useContext(TabsContext);
    return <button onClick={() => ctx.setValue(value)}>{children}</button>;
  }

  function TabsContent({ children, value }: any) {
    const ctx = React.useContext(TabsContext);
    return ctx.value === value ? <div>{children}</div> : null;
  }

  return { Tabs, TabsList, TabsTrigger, TabsContent };
});

describe("ProfitAnalysisPage", () => {
  // Mock analysis rows returned by the API.
  const analysisData = [
    {
      recipeId: "1",
      name: "Burger",
      category: "Entrees",
      subCategory: "Beef",
      menuPrice: 12,
      computedCost: 5,
      marginAmount: 7,
      marginPct: 58.3333,
      missingIngredients: [],
    },
    {
      recipeId: "2",
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
      recipeId: "3",
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for the page's profit analysis API call.
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/profit-analysis") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: analysisData,
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

  it("renders page heading and recipe count", async () => {
    // Page title and total recipe badge should show after load.
    render(<ProfitAnalysisPage />);
    expect(screen.getByText(/profit analysis/i)).toBeInTheDocument();
    expect(await screen.findByText(/3 recipes/i)).toBeInTheDocument();
  });

  it("shows KPI values after loading", async () => {
    // Confirm overview summary cards show calculated values.
    render(<ProfitAnalysisPage />);

    expect(await screen.findByText("67.2%")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("$7.00")).toBeInTheDocument();
  });

  it("renders chart containers after load", async () => {
    // Make sure the chart sections render after data loads.
    render(<ProfitAnalysisPage />);
    await screen.findByText("67.2%");

    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("responsive-container").length).toBeGreaterThan(0);
  });

  it("shows overview tab by default", async () => {
    // Use a stable text that definitely exists in the default overview state.
    render(<ProfitAnalysisPage />);

    expect(
      await screen.findByText(/track margins, spot low performers, and catch missing inventory links/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /overview/i })).toBeInTheDocument();
  });

  it("switches to table tab and shows rows", async () => {
    // Switch to the Table tab and verify recipe rows appear.
    render(<ProfitAnalysisPage />);
    await screen.findByText("67.2%");
    fireEvent.click(screen.getByRole("button", { name: /table/i }));

    expect(await screen.findByText(/recipe margins/i)).toBeInTheDocument();
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
    expect(screen.getByText("Soda")).toBeInTheDocument();
    expect(screen.getByText("Salt")).toBeInTheDocument();

    const linkedLabels = screen.getAllByText("All ingredients linked");
    expect(linkedLabels).toHaveLength(2);
  });

  it("sorts table rows by menu price", async () => {
    // Click Menu Price header once for ascending, twice for descending.
    render(<ProfitAnalysisPage />);
    await screen.findByText("67.2%");
    fireEvent.click(screen.getByRole("button", { name: /table/i }));

    const table = screen.getByRole("table");
    const headerRow = within(table).getAllByRole("row")[0];
    const menuPriceHeader = within(headerRow).getByText("Menu Price ($)");

    fireEvent.click(menuPriceHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Soda");
      expect(rows[2]).toHaveTextContent("Fries");
      expect(rows[3]).toHaveTextContent("Burger");
    });

    fireEvent.click(menuPriceHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Burger");
      expect(rows[2]).toHaveTextContent("Fries");
      expect(rows[3]).toHaveTextContent("Soda");
    });
  });

  it("sorts table rows by recipe name", async () => {
    // Sort by recipe name alphabetically.
    render(<ProfitAnalysisPage />);
    await screen.findByText("67.2%");
    fireEvent.click(screen.getByRole("button", { name: /table/i }));

    const table = screen.getByRole("table");
    const headerRow = within(table).getAllByRole("row")[0];
    const recipeHeader = within(headerRow).getByText("Recipe");

    fireEvent.click(recipeHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Burger");
      expect(rows[2]).toHaveTextContent("Fries");
      expect(rows[3]).toHaveTextContent("Soda");
    });
  });

  it("sorts table rows by margin percent", async () => {
    // Sort by Margin (%) and confirm low-to-high order.
    render(<ProfitAnalysisPage />);
    await screen.findByText("67.2%");
    fireEvent.click(screen.getByRole("button", { name: /table/i }));

    const table = screen.getByRole("table");
    const headerRow = within(table).getAllByRole("row")[0];
    const marginHeader = within(headerRow).getByText("Margin (%)");

    fireEvent.click(marginHeader);

    await waitFor(() => {
      const rows = within(table).getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Burger");
    });
  });

  it("shows empty state when no analysis rows are returned", async () => {
    // Mock an empty API response and confirm the table empty state appears.
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/profit-analysis") {
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

    render(<ProfitAnalysisPage />);
    fireEvent.click(screen.getByRole("button", { name: /table/i }));

    expect(
      await screen.findByText(/no recipes or inventory data yet/i)
    ).toBeInTheDocument();
  });
});