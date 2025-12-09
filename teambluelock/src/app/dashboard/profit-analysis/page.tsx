"use client";

import { useEffect, useState } from "react";

type AnalysisRow = {
  recipeId: string;
  name: string;
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

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl text-sky-600 font-semibold">
          Profit Analysis
        </h2>
      </header>

      <section className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Recipe Margins
          </h3>
          <span className="text-xs text-slate-500">
            Total recipes: {rows.length}
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-slate-700">Loading...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Recipe</th>
                <th className="px-4 py-3 text-right font-medium">
                  Menu Price ($)
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Cost from Inventory ($)
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Margin ($)
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Margin (%)
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Missing Ingredients
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const marginClass =
                  row.marginPct == null
                    ? ""
                    : row.marginPct < 40
                    ? "text-red-600 font-semibold"
                    : row.marginPct < 60
                    ? "text-amber-600 font-semibold"
                    : "text-emerald-700 font-semibold";

                return (
                  <tr key={row.recipeId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.menuPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.computedCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                      {row.marginAmount.toFixed(2)}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right tabular-nums " + marginClass
                      }
                    >
                      {row.marginPct != null
                        ? `${row.marginPct.toFixed(1)}%`
                        : "—"}
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

        <div className="px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
          Margin is calculated as (Menu Price – Sum of ingredient costs from
          inventory). Ingredients that don&apos;t match any inventory item by
          name are listed under &quot;Missing Ingredients&quot; and treated as
          zero cost in this calculation.
        </div>
      </section>
    </div>
  );
}
