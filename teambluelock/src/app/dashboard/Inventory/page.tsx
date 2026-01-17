"use client";

import { useEffect, useState, FormEvent, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";


interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
  inStock?: number;
  reorderPoint?: number;

  // Recommended
  sku?: string;
  category?: string;
  subCategory?: string;
  supplier?: string;

  // Custom
  customFields?: Record<string, string | number | boolean>;

  // Auto
  updatedAt?: string;
}

interface ItemForm {
  name: string;
  unit: string;
  unitCost: string;
  inStock: string;
  reorderPoint: string;

  //category: string;
  //subCategory: string;
  //supplier: string;

  customFields?: Record<string, string | number | boolean>;
}

// Quick Update Form Interface
interface QuickUpdateForm {
  quantityToAdd: string;
  newUnitCost: string;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date";
  visible: boolean;
  order: number;
}

type InventoryStatus =
  | "Unavailable"
  | "Reorder"
  | "Low"
  | "In Stock";

const STATUS_PRIORITY: Record<InventoryStatus, number> = {
  "Unavailable": 0,
  "Reorder": 1,
  "Low": 2,
  "In Stock": 3,
};


interface Props {
  columns: ColumnDefinition[];
  onToggle: (key: string, visible: boolean) => void;
  setColumns: React.Dispatch<React.SetStateAction<ColumnDefinition[]>>;
}

export function ManageColumnsModal({ columns, onToggle, setColumns }: Props) {
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAddColumn() {
    setLoading(true);
    try {
      const res = await fetch("/api/columns");
      const json = await res.json();
      // Update columns state in parent
      setColumns(json.data);
      setShowAddColumnForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteColumn(key: string) {
    const confirmed = window.confirm(
      "Are you sure? This will permanently delete this column and all its data."
    );

    if (!confirmed) return;

    await fetch(`/api/columns/${key}`, {
      method: "DELETE",
    });

    // Remove locally so UI updates immediately
    setColumns(cols => cols.filter(col => col.key !== key));
  }

  return (
    <div className="space-y-3">
      <h4 className="text-med font-bold mb-1">Manage Columns</h4>
        <h5 className="text-sm slate-700 mb-3">We leave this part entirely up to you... Create your own custom columns and toggle their visibility!</h5>
      {columns.map(col => (
        <div
          key={col.key}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle(col.key, !col.visible)}
              title={col.visible ? "Hide column" : "Show column"}
            >
              {col.visible ? (
                <EyeIcon className="w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors" />
              ) : (
                <EyeSlashIcon className="w-5 h-5 text-slate-300 hover:text-slate-500 transition-colors" />
              )}
            </button>
            <span>{col.label}</span>
          </div>

          <button
            onClick={() => handleDeleteColumn(col.key)}
            className="text-red-600 hover:text-red-800 text-sm font-semibold"
            title="Delete column"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add Column Section */}
      {showAddColumnForm ? (
        <div className="p-2 border rounded-md mt-3 bg-white">
          <AddColumnForm onAdd={handleAddColumn} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddColumnForm(false)}
            className="mt-2"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setShowAddColumnForm(true)}
          className="mt-2"
        >
          + Add Column
        </Button>
      )}
      <h5 className="text-sm slate-200 mb-3">Recommended columns: Category, Supplier, SKU</h5>
    </div>
  );
}


export function AddColumnForm({ onAdd }: { onAdd: () => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");

  async function handleSubmit() {
    const key = label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    await fetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label, type }),
    });

    onAdd();
    setLabel("");
  }

  return (
    <div className="space-y-3">
      <input
        className="w-full px-3 py-2 border rounded-md text-sm"
        placeholder="Column name"
        value={label}
        onChange={e => setLabel(e.target.value)}
      />

      <select
        className="w-full px-3 py-2 border rounded-md text-sm"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="date">Date</option>
        <option value="boolean">Yes / No</option>
      </select>

      <Button
        size="sm"
        variant="outline"
        onClick={handleSubmit}
        className="mt-1"
      >
        Add Column
      </Button>
    </div>
  );

}

function getStatus(item: InventoryItem) {
  const stock = item.inStock ?? 0;
  const reorder = item.reorderPoint ?? 0;

  if (stock <= 0) return "Unavailable";
  if (stock <= reorder) return "Reorder";
  const ratio = reorder / stock;
  if (ratio >= 0.85 && ratio < 1) {
      return "Low";
    }
  return "In Stock";
}

function getStatusClasses(status: InventoryStatus) {
  switch (status) {
    case "Unavailable":
      return "inline-flex items-center rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-700";
    case "Low":
      return "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-orange-700";
    case "Reorder":
      return "inline-flex items-center rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-amber-700";
    case "In Stock":
    default:
      return "inline-flex items-center rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700";
  }
}

function getSortableValue(item: InventoryItem, key: string) {
  switch (key) {
    case "totalValue":
      return (item.inStock ?? 0) * item.unitCost;
    case "status":
      return STATUS_PRIORITY[getStatus(item)];
    default:
      // core fields OR custom fields
      return key in item
        ? (item as any)[key]
        : item.customFields?.[key];
  }
}


export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  type SortDirection = "asc" | "desc";

  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "asc",
  });



  // State to show/hide Add Column form
  const [showColumnForm, setShowColumnForm] = useState(false);

  // State to show/hide Manage Columns modal
  const [showColumnModal, setShowColumnModal] = useState(false);

  const [columns, setColumns] = useState<ColumnDefinition[]>([]);

  async function toggleColumn(key: string, visible: boolean) {
    await fetch("/api/columns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, visible }),
    });

    setColumns((cols: ColumnDefinition[]) =>
      cols.map(c => (c.key === key ? { ...c, visible } : c))
    );
  }


  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditMode = !!editingId;

  // Quick update states
  const [showQuickUpdate, setShowQuickUpdate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form data
  const [itemForm, setItemForm] = useState<ItemForm>({
    name: "",
    unit: "",
    unitCost: "",
    inStock: "",
    reorderPoint: "",
    //category: "",
    //subCategory: "",
    //supplier: "",
    customFields: {},
  });

  // Quick update form data
  const [quickUpdateForm, setQuickUpdateForm] = useState<QuickUpdateForm>({
    quantityToAdd: "",
    newUnitCost: "",
  });

  const coreColumns = [
    { key: "name", label: "Item" },
    { key: "unitCost", label: "Unit Cost" },
    { key: "inStock", label: "In Stock" },
  ];

  const visibleCustomColumns = columns
  .filter(col => col.visible)
  .sort((a, b) => a.order - b.order);

  useEffect(() => {
    async function init() {
      await loadInventoryData();
      const res = await fetch("/api/columns");
      const json = await res.json();
      setColumns(json.data);
    }
    init();
  }, []);

  function handleSort(key: string) {
    setSortConfig(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }

  async function loadInventoryData() {
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

  const totalInventoryValue = items.reduce((sum, item) => {
    const stock = item.inStock ?? 0;
    return sum + stock * item.unitCost;
  }, 0);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    const sortKey = sortConfig.key;

    return [...items].sort((a, b) => {
      const { key, direction } = sortConfig;

      const aValue = getSortableValue(a, sortKey);
      const bValue = getSortableValue(b, sortKey);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [items, sortConfig]);

  // Form handlers
  function handleInputChange(field: keyof ItemForm, value: string) {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleQuickUpdateChange(field: keyof QuickUpdateForm, value: string) {
    setQuickUpdateForm((prev) => ({ ...prev, [field]: value }));
  }

  // Reset all forms
  function resetForms() {
    setItemForm({
      name: "",
      unit: "",
      unitCost: "",
      inStock: "",
      reorderPoint: "",
      //category: "",
      //subCategory: "",
      //supplier: "",
    });
    setQuickUpdateForm({
      quantityToAdd: "",
      newUnitCost: "",
    });
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
    setShowQuickUpdate(null);
  }

  // Load item for editing
  async function handleEditClick(id: string) {
    try {
      const res = await fetch(`/api/inventory/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const item = json.data as InventoryItem;

      setEditingId(item._id);
      setItemForm({
        name: item.name || "",
        unit: item.unit || "",
        unitCost: item.unitCost?.toString() || "",
        inStock: item.inStock?.toString() || "",
        reorderPoint: item.reorderPoint?.toString() || "",
        //category: item.category || "",
        //subCategory: item.subCategory || "",
        //supplier: item.supplier || "",
        customFields: item.customFields ?? {},
      });
      setShowForm(true);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 0);

      setFormError(null);
    } catch (err: any) {
      console.error("Failed to load item for edit:", err);
      setFormError(err.message || "Failed to load item for editing.");
    }
  }

  // Handle quick update
  async function handleQuickUpdateSubmit(itemId: string) {
    const quantityToAdd = parseFloat(quickUpdateForm.quantityToAdd || "0");
    const newUnitCost = parseFloat(quickUpdateForm.newUnitCost || "0");
    
    if (isNaN(quantityToAdd)) {
      setFormError("Please enter a valid number for quantity.");
      return;
    }

    setIsUpdating(true);
    setFormError(null);

    try {
      // First, get current item
      const currentItem = items.find(item => item._id === itemId);
      if (!currentItem) throw new Error("Item not found");

      const newStock = (currentItem.inStock || 0) + quantityToAdd;
      const updatedUnitCost = newUnitCost > 0 ? newUnitCost : currentItem.unitCost;

      const payload = {
        inStock: newStock,
        unitCost: updatedUnitCost,
      };

      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Update local state
      setItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, ...payload } : item
      ));

      // Reset quick update form
      setQuickUpdateForm({ quantityToAdd: "", newUnitCost: "" });
      setShowQuickUpdate(null);
    } catch (err: any) {
      console.error("Error updating inventory:", err);
      setFormError(err.message || "Failed to update inventory.");
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle full form submit (create or update)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!itemForm.name.trim() || !itemForm.unit.trim()) {
      setFormError("Name and unit are required.");
      return;
    }

    const unitCost = parseFloat(itemForm.unitCost || "0");
    const inStock = parseFloat(itemForm.inStock || "0");
    const reorderPoint = parseFloat(itemForm.reorderPoint || "0");

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
      const payload = {
        name: itemForm.name.trim(),
        unit: itemForm.unit.trim(),
        unitCost,
        inStock,
        reorderPoint,
        //category: itemForm.category || undefined,
        //subCategory: itemForm.subCategory || undefined,
        //supplier: itemForm.supplier || undefined,
        customFields: itemForm.customFields,
      };

      let res: Response;
      let json: any;

      if (isEditMode && editingId) {
        // UPDATE existing item
        res = await fetch(`/api/inventory/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE new item
        res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save item");
      }

      const saved: InventoryItem = json.data;

      if (isEditMode && editingId) {
        // Replace in existing list
        setItems((prev) => prev.map((item) => (item._id === editingId ? saved : item)));
      } else {
        // Add new item to top
        setItems((prev) => [saved, ...prev]);
      }

      resetForms();
    } catch (err: any) {
      console.error("Error saving inventory item:", err);
      setFormError(err.message || "Failed to save item.");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle delete
  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this inventory item? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to delete item");

      // Remove from UI
      setItems((prev) => prev.filter((item) => item._id !== id));

      // If user was editing this item, reset the form
      if (editingId === id) {
        resetForms();
      }
    } catch (err: any) {
      console.error("Error deleting inventory item:", err);
      alert("Failed to delete item: " + err.message);
    }
  }

  // Render quick update form
  function renderQuickUpdateForm(item: InventoryItem) {
    if (showQuickUpdate !== item._id) return null;

    return (
      <tr className="bg-slate-50">
        <td colSpan={99} className="px-6 py-4">
          <div className="rounded-md border bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Update Quantity/Cost for {item.name}
            </h4>
            {formError && (
              <p className="text-sm text-red-600 mb-3">{formError}</p>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Quantity to Add/Subtract
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={quickUpdateForm.quantityToAdd}
                    onChange={(e) => handleQuickUpdateChange("quantityToAdd", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g., 10 to add, -5 to subtract"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Current: {item.inStock || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  New Unit Cost ($)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickUpdateForm.newUnitCost}
                    onChange={(e) => handleQuickUpdateChange("newUnitCost", e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={`Current: ${item.unitCost.toFixed(2)}`}
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Current: ${item.unitCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => handleQuickUpdateSubmit(item._id)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuickUpdate(null);
                    setQuickUpdateForm({ quantityToAdd: "", newUnitCost: "" });
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Tip: Enter positive number to add stock, negative number to subtract.
            </p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl text-sky-600 font-semibold">Inventory</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant={showForm ? "outline" : "default"}
              onClick={() => {
              if (showForm && !isEditMode) {
                resetForms();
              } else if (showForm && isEditMode) {
                resetForms();
              } else {
                resetForms();
                setShowForm(true);
              }
            }}>
              {showForm ? "Cancel" : "Add Item"}
            </Button>

            <Button>
              Upload Reciept
            </Button>

            <Button
              variant={showColumnModal ? "outline" : "default"}
              onClick={() => setShowColumnModal(prev => !prev)}
            >
              {showColumnModal ? "Close" : "Manage Columns"}
            </Button>

          </div>
        </header>

      {/* Edit/Create Form */}
      {showForm && (
        <section 
          className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            {isEditMode ? "Edit Inventory Item" : "New Inventory Item"}
          </h3>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* CORE FIELDS */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Item Name *
              </label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
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
                value={itemForm.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
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
                value={itemForm.unitCost}
                onChange={(e) => handleInputChange("unitCost", e.target.value)}
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
                value={itemForm.inStock}
                onChange={(e) => handleInputChange("inStock", e.target.value)}
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
                value={itemForm.reorderPoint}
                onChange={(e) => handleInputChange("reorderPoint", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            {/* 🔹 CUSTOM FIELDS */}
            {visibleCustomColumns.length > 0 && (
              <>
                <h4 className="col-span-full text-xs font-medium text-slate-700 mt-4">
                  Custom Fields
                </h4>

                {visibleCustomColumns.map(col => (
                  <div key={col.key} className="space-y-1">
                    <label className="text-xs text-slate-600">{col.label}</label>
                    <input
                      type={col.type === "date" ? "date" : "text"}
                      value={itemForm.customFields?.[col.key] != null ? String(itemForm.customFields[col.key]) : ""}
                      onChange={(e) =>
                        setItemForm(prev => ({
                          ...prev,
                          customFields: {
                            ...prev.customFields,
                            [col.key]: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder={`Enter ${col.label}`}
                    />
                  </div>
                ))}
              </>
            )}

            {/* SUBMIT / DELETE BUTTONS */}
            <div className="flex items-end gap-2 col-span-full">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving
                  ? isEditMode
                    ? "Saving Changes..."
                    : "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Save Item"}
              </Button>

              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(editingId!)}
                >
                  Delete
                </Button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Column Management Form */}
      {showColumnModal && (
        <div className="p-4 bg-white border rounded-md mb-4">
          <ManageColumnsModal
            columns={columns}
            onToggle={toggleColumn}
            setColumns={setColumns} // pass setter so AddColumnForm can update parent state
          />
        </div>
      )}



      {/* Inventory Table */}
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
                <thead className="bg-sky-300 text-xs uppercase text-slate-600">
                  <tr>
                    {/* Core columns */}
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Item
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th
                      onClick={() => handleSort("unit")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Unit
                      {sortConfig.key === "unit" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th
                      onClick={() => handleSort("inStock")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      In Stock
                      {sortConfig.key === "inStock" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th
                      onClick={() => handleSort("reorderPoint")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Reorder Point
                      {sortConfig.key === "reorderPoint" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th
                      onClick={() => handleSort("unitCost")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Unit Cost ($)
                      {sortConfig.key === "unitCost" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    {/*<th className="px-6 py-3 text-right font-medium">Total Value ($)</th> */}
                    <th
                      onClick={() => handleSort("totalValue")}
                      className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                    >
                      Total Value ($)
                      {sortConfig.key === "totalValue" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    

                    {/* Dynamic custom columns */}
                    {visibleCustomColumns.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`px-6 py-3 cursor-pointer select-none ${
                          col.type === "number" || col.type === "date"
                            ? "text-right"
                            : "text-left"
                        } font-medium`}
                      >
                        {col.label}
                        {sortConfig.key === col.key &&
                          (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                      </th>
                    ))}

                    <th
                      onClick={() => handleSort("status")}
                      className="px-6 py-3 text-center font-medium cursor-pointer select-none"
                    >
                      Status
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </th>
                    <th className="px-6 py-3 text-center font-medium">Edit</th>
                  </tr>
                </thead>


              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => {
                  const status = getStatus(item);
                  const stock = item.inStock ?? 0;
                  const totalValue = stock * item.unitCost;

                  return (
                    <React.Fragment key={item._id}>
                      <tr className="hover:bg-slate-200 odd:bg-white even:bg-slate-50">
                        {/* CORE COLUMNS */}
                        <td className="px-6 py-3 text-slate-800">{item.name}</td>
                        <td className="px-6 py-3 text-slate-600">{item.unit || "-"}</td>
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

                        {/* 🔹 CUSTOM USER-DEFINED COLUMNS (NEW) */}
                        {visibleCustomColumns.map(col => (
                          <td
                            key={col.key}
                            className="px-6 py-3 text-slate-600"
                          >
                            {item.customFields?.[col.key] ?? "-"}
                          </td>
                        ))}

                        {/* STATUS */}
                        <td className="px-6 py-3 text-center">
                          <span className={getStatusClasses(status)}>
                            {status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end"
                              onCloseAutoFocus={(e) => e.preventDefault()}>
                              <DropdownMenuItem
                                onClick={() => setShowQuickUpdate(item._id)}
                              >
                                Update Quantity/Cost
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(item._id)}
                              >
                                Edit Item Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {/* QUICK UPDATE ROW (unchanged) */}
                      {renderQuickUpdateForm(item)}
                    </React.Fragment>
                  );
                })}

                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-white"
                      colSpan={
                        coreColumns.length +
                        visibleCustomColumns.length +
                        4 /* status + actions */
                      }
                    >
                      No inventory items yet. Add your first item to get started.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}

        <div className="px-6 py-3 bg-sky-600 text-xs text-slate-500 rounded-xl">
          {/* Optional footer content */}
        </div>
      </section>
    </div>
  );
}