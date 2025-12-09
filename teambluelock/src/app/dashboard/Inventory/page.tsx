"use client";

import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";

interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
  inStock?: number;
  reorderPoint?: number;
  sku?: string;
  category?: string;
}

interface NewItemForm {
  name: string;
  unit: string;
  unitCost: string;     // keep as string for input, convert to number on submit
  inStock: string;
  reorderPoint: string;
}

function getStatus(item: InventoryItem) {
  const stock = item.inStock ?? 0;
  const reorder = item.reorderPoint ?? 0;

  if (stock <= 0) return "Out of Stock";
  if (stock <= reorder) return "Reorder";
  return "OK";
}

function getStatusClasses(status: string) {
  if (status === "Out of Stock") {
    return "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700";
  }
  if (status === "Reorder") {
    return "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700";
  }
  return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700";
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<NewItemForm>({
    name: "",
    unit: "",
    unitCost: "",
    inStock: "",
    reorderPoint: "",
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/inventory", { cache: "no-store" });
        const json = await res.json();

        if (!json.success) throw new Error(json.error);

        setItems(json.data);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalInventoryValue = items.reduce((sum, item) => {
    const stock = item.inStock ?? 0;
    return sum + stock * item.unitCost;
  }, 0);

  function handleInputChange(
    field: keyof NewItemForm,
    value: string
  ) {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!newItem.name.trim() || !newItem.unit.trim()) {
      setFormError("Name and unit are required.");
      return;
    }

    const unitCost = parseFloat(newItem.unitCost || "0");
    const inStock = parseFloat(newItem.inStock || "0");
    const reorderPoint = parseFloat(newItem.reorderPoint || "0");

    if (isNaN(unitCost) || unitCost < 0) {
      setFormError("Unit cost must be a non-negative number.");
      return;
    }

    if (isNaN(inStock) || inStock < 0) {
      setFormError("In stock must be a non-negative number.");
      return;
    }

    if (isNaN(reorderPoint) || reorderPoint < 0) {
      setFormError("Reorder point must be a non-negative number.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItem.name.trim(),
          unit: newItem.unit.trim(),
          unitCost,
          inStock,
          reorderPoint,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save item");
      }

      const created: InventoryItem = json.data;

      // Add new item to list
      setItems((prev) => [created, ...prev]);

      // Reset form
      setNewItem({
        name: "",
        unit: "",
        unitCost: "",
        inStock: "",
        reorderPoint: "",
      });
      setShowForm(false);
    } catch (err: any) {
      console.error("Error creating inventory item:", err);
      setFormError(err.message || "Failed to create item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-4xl font-semibold text-sky-600 tracking-wide drop-shadow-md">
          Inventory
        </h2>

        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancel" : "Add Item"}
        </Button>
      </header>

      {showForm && (
        <section className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            New Inventory Item
          </h3>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Item Name *
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  handleInputChange("name", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Beef Patty"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Unit *
              </label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) =>
                  handleInputChange("unit", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="piece, kg, lb..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItem.unitCost}
                onChange={(e) =>
                  handleInputChange("unitCost", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="0.25"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                In Stock
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={newItem.inStock}
                onChange={(e) =>
                  handleInputChange("inStock", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Reorder Point
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={newItem.reorderPoint}
                onChange={(e) =>
                  handleInputChange("reorderPoint", e.target.value)
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Item"}
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border bg-sky-600 shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Inventory Items
          </h3>
          <div className="flex flex-col items-end gap-1 text-xs text-slate-700">
            <span>Total items: {items.length}</span>
            <span>
              Est. Inventory Value:{" "}
                <span className="font-semibold">
                  ${totalInventoryValue.toFixed(2)}
                </span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-white">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Item</th>
                  <th className="px-6 py-3 text-left font-medium">Unit</th>
                  <th className="px-6 py-3 text-right font-medium">
                    In Stock
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    Unit Cost ($)
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    Total Value ($)
                  </th>
                  <th className="px-6 py-3 text-center font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const status = getStatus(item);
                  const stock = item.inStock ?? 0;
                  const totalValue = stock * item.unitCost;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-800">{item.name}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {item.unit || "-"}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                        {stock}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-600">
                        {item.reorderPoint ?? "-"}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                        {item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                        {totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={getStatusClasses(status)}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-white"
                      colSpan={7}
                    >
                      No inventory items yet. Add your first item to get
                      started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
        </div>
      </section>
    </div>
  );
}
