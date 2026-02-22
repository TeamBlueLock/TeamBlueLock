"use client";

import { useEffect, useState } from "react";

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

export default function ProfitAnalysisPage() {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalysis() {
      setLoading(true);
      try {
        const res = await fetch("/api/profit-analysis", {
          cache: "no-store",
        });
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
  }>({
    key: null,
    direction: "asc",
  });


  function handleSort(key: keyof AnalysisRow) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig.key) return 0; // no sorting

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // handle null/undefined
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // number sort
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    // string sort
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortConfig.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });


  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl text-sky-600 font-semibold">
          Profit Analysis
        </h2>
      </header>

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
                <th onClick={() => handleSort("name")} className="px-4 py-3 text-left font-medium cursor-pointer select-none">
                  Recipe
                  {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("category")} className="px-4 py-3 text-left font-medium cursor-pointer select-none">
                  Category
                  {sortConfig.key === "category" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("subCategory")} className="px-4 py-3 text-left font-medium cursor-pointer select-none">
                  Sub-Category
                  {sortConfig.key === "subCategory" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("menuPrice")} className="px-4 py-3 text-right font-medium cursor-pointer select-none">
                  Menu Price ($)
                  {sortConfig.key === "menuPrice" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("computedCost")} className="px-4 py-3 text-right font-medium cursor-pointer select-none">
                  Cost from Inventory ($)
                  {sortConfig.key === "computedCost" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("marginAmount")} className="px-4 py-3 text-right font-medium cursor-pointer select-none">
                  Margin ($)
                  {sortConfig.key === "marginAmount" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("marginPct")} className="px-4 py-3 text-right font-medium cursor-pointer select-none">
                  Margin (%)
                  {sortConfig.key === "marginPct" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                </th>
                <th onClick={() => handleSort("missingIngredients")} className="px-4 py-3 text-left font-medium cursor-pointer select-none">
                  Missing Ingredients
                  {sortConfig.key === "missingIngredients" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
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
                  <tr key={row.recipeId} className="hover:bg-slate-200 odd:bg-white even:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-900">
                      {row.category != null
                        ? `${row.category}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {row.subCategory != null
                        ? `${row.subCategory}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.menuPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.computedCost != null
                        ? `${row.computedCost.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.marginAmount != null
                        ? `${row.marginAmount.toFixed(2)}`
                        : "-"}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right tabular-nums " + marginClass
                      }
                    >
                      {row.marginPct != null
                        ? `${row.marginPct.toFixed(1)}%`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.missingIngredients.length > 0 ? (
                        <span>
                          {row.missingIngredients.join(", ")}
                        </span>
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
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
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
    </div>
  );
}
