"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type AnalysisRow = {
  recipeId: string;
  name: string;
  category: string;
  subCategory: string;
  menuPrice: number;
  computedCost: number;
  marginAmount: number;
  marginPct: number | null;
  missingIngredients: string[];
};

/**
 * Formats a numeric value as a U.S. dollar currency string.
 *
 * This helper converts a number into a localized currency string for display
 * in the profit analysis dashboard. It is used for margin amounts, prices,
 * and other monetary values shown in cards, charts, and tables.
 *
 * @returns A formatted currency string in U.S. dollars.
 *
 * @example
 * // Example output:
 * money(12.5)
 * // "$12.50"
 *
 * @example
 * // Example output:
 * money(1234.56)
 * // "$1,234.56"
 */

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/**
 * Returns a badge component representing the margin performance level.
 *
 * This helper maps a recipe's margin percentage to a styled badge used in
 * the profit analysis dashboard. It labels recipes as "Low", "OK", "Great",
 * or "N/A" depending on the margin percentage value.
 *
 * @returns A badge React element representing the recipe's margin category.
 *
 * @example
 * // Example output:
 * marginBadge(35)
 * // returns a "Low" badge
 *
 * @example
 * // Example output:
 * marginBadge(null)
 * // returns an "N/A" badge
 */

function marginBadge(marginPct: number | null) {
  if (marginPct == null) return <Badge variant="secondary">N/A</Badge>;
  if (marginPct < 40) return <Badge variant="destructive">Low</Badge>;
  if (marginPct < 60) return <Badge variant="secondary" className="bg-amber-100 text-amber-800">OK</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800">Great</Badge>;
}

/**
 * Renders the main profit analysis dashboard page.
 *
 * This page loads recipe profitability data from the profit analysis API,
 * displays KPI summary cards, renders charts for category and margin trends,
 * and provides a sortable table of recipe-level margin details. It helps
 * users identify low-margin recipes, missing ingredient links, and strong
 * performers across categories.
 *
 * @returns A React element representing the profit analysis dashboard.
 *
 * @example
 * // Example behavior:
 * // Loads recipe margin data and displays overview metrics and charts.
 *
 * @example
 * // Example result:
 * // Users can switch between overview and table views to inspect profitability.
 */

export default function ProfitAnalysisPage() {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    /**
     * Loads profit analysis data for the authenticated user.
     *
     * This function fetches recipe profitability data from the profit analysis
     * API, stores the returned rows in local state, and manages the page loading
     * state while the request is in progress.
     *
     * @returns A promise that resolves when profit analysis data has been loaded.
     *
     * @example
     * // Example behavior:
     * // Fetches /api/profit-analysis and stores the result in local state.
     *
     * @example
     * // Example result:
     * // The dashboard updates with recipe margins, costs, and missing ingredient data.
     */

    async function loadAnalysis() {
      setLoading(true);
      try {
        const res = await fetch("/api/profit-analysis", { cache: "no-store" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setRows(json.data);
      } catch (err) {
        console.error("Failed to load profit analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, []);

  type SortDirection = "asc" | "desc";
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AnalysisRow | null;
    direction: SortDirection;
  }>({ key: null, direction: "asc" });

  /**
   * Updates the sort configuration for the profit analysis table.
   *
   * This function toggles the sort direction when the same column is selected
   * repeatedly, or applies ascending sorting when a new column is chosen.
   * It is used to sort recipe analysis rows by fields such as name, category,
   * computed cost, menu price, or margin values.
   *
   * @returns No return value. Updates the local sort state for the table.
   *
   * @example
   * // Example usage:
   * handleSort("name");
   *
   * @example
   * // Example behavior:
   * // First click sorts by name ascending, second click sorts by name descending.
   */

  function handleSort(key: keyof AnalysisRow) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortConfig.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const dashboard = useMemo(() => {
    const validMarginPct = rows.filter((r) => r.marginPct != null) as Array<
      AnalysisRow & { marginPct: number }
    >;

    const avgMarginPct =
      validMarginPct.length === 0
        ? null
        : validMarginPct.reduce((sum, r) => sum + r.marginPct, 0) /
          validMarginPct.length;

    const below40 = validMarginPct.filter((r) => r.marginPct < 40).length;
    const missingAny = rows.filter((r) => r.missingIngredients.length > 0).length;

    const best = rows
      .filter((r) => typeof r.marginAmount === "number")
      .slice()
      .sort((a, b) => (b.marginAmount ?? 0) - (a.marginAmount ?? 0))[0];

    const topByMargin = rows
      .filter((r) => typeof r.marginAmount === "number")
      .slice()
      .sort((a, b) => (b.marginAmount ?? 0) - (a.marginAmount ?? 0))
      .slice(0, 3)
      .map((r) => ({
        name: r.name,
        marginAmount: Number((r.marginAmount ?? 0).toFixed(2)),
        marginPct: r.marginPct == null ? null : Number(r.marginPct.toFixed(1)),
        menuPrice: Number(r.menuPrice.toFixed(2)),
      }));

    const byCategoryMap = new Map<
      string,
      { sumPct: number; count: number; sumMargin: number; countMargin: number }
    >();

    for (const r of rows) {
      const key = r.category?.trim() ? r.category : "Uncategorized";
      if (!byCategoryMap.has(key)) {
        byCategoryMap.set(key, { sumPct: 0, count: 0, sumMargin: 0, countMargin: 0 });
      }
      const agg = byCategoryMap.get(key)!;

      if (r.marginPct != null) {
        agg.sumPct += r.marginPct;
        agg.count += 1;
      }
      if (typeof r.marginAmount === "number") {
        agg.sumMargin += r.marginAmount;
        agg.countMargin += 1;
      }
    }

    const avgByCategory = Array.from(byCategoryMap.entries())
      .map(([category, agg]) => ({
        category,
        avgMarginPct:
          agg.count === 0 ? null : Number((agg.sumPct / agg.count).toFixed(1)),
      }))
      .sort((a, b) => (b.avgMarginPct ?? -999) - (a.avgMarginPct ?? -999));

    const buckets = [
      { label: "< 20%", min: -Infinity, max: 20 },
      { label: "20–40%", min: 20, max: 40 },
      { label: "40–60%", min: 40, max: 60 },
      { label: "60–80%", min: 60, max: 80 },
      { label: "80%+", min: 80, max: Infinity },
    ];

    const marginDist = buckets.map((b) => ({
      bucket: b.label,
      count: validMarginPct.filter(
        (r) => r.marginPct >= b.min && r.marginPct < b.max
      ).length,
    }));

    return { avgMarginPct, below40, missingAny, best, topByMargin, avgByCategory, marginDist };
  }, [rows]);

  const sortArrow = (key: keyof AnalysisRow) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-sky-600">Profit Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Track margins, spot low performers, and catch missing inventory links.
          </p>
        </div>
        <Badge variant="secondary">{rows.length} recipes</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                  Avg margin %
                </CardTitle>
                <CardDescription className="text-xs">Recipes with margin%</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-semibold text-sky-600">
                    {dashboard.avgMarginPct == null ? "-" : `${dashboard.avgMarginPct.toFixed(1)}%`}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                  Under 40% margin
                </CardTitle>
                <CardDescription className="text-xs">Potential fixes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-semibold text-sky-600">
                    {dashboard.below40}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                  Missing ingredients
                </CardTitle>
                <CardDescription className="text-xs">Costs may be low</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-semibold">
                    {dashboard.missingAny}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                  Best margin $
                </CardTitle>
                <CardDescription className="text-xs">{dashboard.best?.name ?? "—"}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-semibold">
                    {dashboard.best?.marginAmount != null ? money(dashboard.best.marginAmount) : "-"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CHARTS */}
          <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Top recipes by margin $
              </CardTitle>
              <CardDescription>What’s making you money</CardDescription>
            </CardHeader>

            <CardContent className="h-80">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.topByMargin}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />

                    <XAxis
                      dataKey="name"
                      interval={0}
                      height={45}
                      padding={{ left: 20, right: 20 }}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                    />

                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                    />

                    <Tooltip
                      formatter={(value: any) => [money(Number(value)), "Margin ($)"]}
                    />

                    <Bar
                      dataKey="marginAmount"
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                      barSize={52}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">
                Avg margin % by category
              </CardTitle>
              <CardDescription>Which category is strongest</CardDescription>
            </CardHeader>

            <CardContent className="h-80">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.avgByCategory}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />

                    <XAxis
                      dataKey="category"
                      interval={0}
                      height={45}
                      padding={{ left: 20, right: 20 }}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                    />

                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#94a3b8" }}
                      tickLine={{ stroke: "#94a3b8" }}
                    />

                    <Tooltip
                      formatter={(value: any) => {
                        if (value == null) return ["-", "Avg Margin (%)"];
                        return [`${value}%`, "Avg Margin (%)"];
                      }}
                    />

                    <Bar
                      dataKey="avgMarginPct"
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                      barSize={52}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide">Margin % distribution</CardTitle>
                <CardDescription>Are most items low, mid, or high margin?</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.marginDist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Recipes" fill="#0284c7" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TABLE */}
        <TabsContent value="table" className="space-y-4">
          <section className="rounded-xl border bg-sky-600 shadow-sm">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Recipe Margins
              </h3>
              <span className="text-xs text-slate-700">
                Total recipes: {rows.length}
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-slate-700">Loading...</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-sky-300 text-xs uppercase text-slate-600">
                  <tr>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Recipe
                      {sortArrow("name")}
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Category
                      {sortArrow("category")}
                    </th>
                    <th
                      onClick={() => handleSort("subCategory")}
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Sub-Category
                      {sortArrow("subCategory")}
                    </th>
                    <th
                      onClick={() => handleSort("menuPrice")}
                      className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                    >
                      Menu Price ($)
                      {sortArrow("menuPrice")}
                    </th>
                    <th
                      onClick={() => handleSort("computedCost")}
                      className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                    >
                      Cost from Inventory ($)
                      {sortArrow("computedCost")}
                    </th>
                    <th
                      onClick={() => handleSort("marginAmount")}
                      className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                    >
                      Margin ($)
                      {sortArrow("marginAmount")}
                    </th>
                    <th
                      onClick={() => handleSort("marginPct")}
                      className="px-4 py-3 text-right font-medium cursor-pointer select-none"
                    >
                      Margin (%)
                      {sortArrow("marginPct")}
                    </th>
                    <th
                      onClick={() => handleSort("missingIngredients")}
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Missing Ingredients
                      {sortArrow("missingIngredients")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedRows.map((row) => {
                    const marginClass =
                      row.marginPct == null
                        ? ""
                        : row.marginPct < 40
                        ? "text-red-600 font-semibold"
                        : row.marginPct < 60
                        ? "text-amber-600 font-semibold"
                        : "text-emerald-700 font-semibold";

                    return (
                      <tr
                        key={row.recipeId}
                        className="hover:bg-slate-200 odd:bg-white even:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-900">{row.name}</td>
                        <td className="px-4 py-3 text-slate-900">
                          {row.category != null ? row.category : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {row.subCategory != null ? row.subCategory : "-"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                          {row.menuPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                          {row.computedCost != null ? row.computedCost.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                          {row.marginAmount != null ? row.marginAmount.toFixed(2) : "-"}
                        </td>
                        <td className={"px-4 py-3 text-right tabular-nums " + marginClass}>
                          {row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {row.missingIngredients.length > 0 ? (
                            <span>{row.missingIngredients.join(", ")}</span>
                          ) : (
                            <span className="text-emerald-700">
                              All ingredients linked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                        No recipes or inventory data yet. Add inventory items and
                        recipes to see profit analysis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            <div className="px-6 py-3 bg-sky-600 text-xs text-slate-700 rounded-xl">
              Margin is calculated as (Menu Price – Sum of ingredient costs from
              inventory). Ingredients that don&apos;t match any inventory item by
              name are listed under &quot;Missing Ingredients&quot; and treated as
              zero cost in this calculation.
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}