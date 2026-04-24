"use client";

import { useEffect, useState, FormEvent, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UNITS } from "@/lib/units";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

const groupedUnits = Object.entries(UNITS).reduce(
  (acc, [key, unit]) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }
    acc[unit.category].push(key);
    return acc;
  },
  {} as Record<string, string[]>
);

interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
  inStock?: number;
  reorderPoint?: number;

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

/**
 * Renders the column management modal for inventory customization.
 *
 * This component displays all user-defined inventory columns and allows
 * the user to toggle column visibility, delete existing custom columns,
 * and open a form to create new columns. It works together with the
 * parent inventory page by updating the shared column state.
 *
 * @returns A React element representing the column management interface.
 *
 * @example
 * // Example usage:
 * <ManageColumnsModal
 *   columns={columns}
 *   onToggle={toggleColumn}
 *   setColumns={setColumns}
 * />
 *
 * @example
 * // Example behavior:
 * // Displays all custom columns and allows the user to hide, show,
 * // delete, or add new columns.
 */

export function ManageColumnsModal({ columns, onToggle, setColumns }: Props) {
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitFn, setSubmitFn] = useState<() => void>(() => () => {});

    /**
   * Reloads column definitions after a new custom column is created.
   *
   * This function fetches the latest column definitions from the server,
   * updates the parent column state, and closes the add-column form after
   * a successful refresh.
   *
   * @returns A promise that resolves when the column list has been refreshed.
   *
   * @example
   * // Example behavior:
   * // After a user creates a new column, this function refreshes the
   * // visible column list and hides the add-column form.
   *
   * @example
   * // Example result:
   * // The new column appears immediately in the manage columns modal.
   */

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

  /**
   * Deletes a custom column definition after user confirmation.
   *
   * This function prompts the user for confirmation, sends a DELETE request
   * to remove the selected custom column, and updates local state so the UI
   * immediately reflects the change.
   *
   * @returns A promise that resolves when the column has been deleted
   * and removed from local state.
   *
   * @example
   * // Example behavior:
   * // If the user confirms deletion, the selected custom column is
   * // removed from the database and no longer appears in the UI.
   *
   * @example
   * // Example usage:
   * handleDeleteColumn("expiration_date");
   */

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
          <AddColumnForm onAdd={handleAddColumn} setSubmit={setSubmitFn} />
          <div className="flex justify-end gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddColumnForm(false)}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={submitFn}
            >
              Add Column
            </Button>
          </div>
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

/**
 * Renders a form for creating a new custom inventory column.
 *
 * This component allows the user to enter a column label and choose a
 * column type. It generates a normalized key from the label, submits the
 * new column definition to the server, and notifies the parent component
 * after the column has been added successfully.
 *
 * @returns A React element representing the add-column form.
 *
 * @example
 * // Example usage:
 * <AddColumnForm onAdd={handleAddColumn} setSubmit={setSubmitFn} />
 *
 * @example
 * // Example behavior:
 * // A label such as "Expiration Date" becomes the key "expiration_date"
 * // before being submitted to the API.
 */

export function AddColumnForm({ onAdd, setSubmit }: { onAdd: () => void,  setSubmit: (fn: () => void) => void }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");

  /**
   * Submits a new custom column definition to the server.
   *
   * This function generates a normalized key from the user-entered label,
   * sends the new column definition to the columns API, triggers the parent
   * refresh callback, and clears the local form state after submission.
   *
   * @returns A promise that resolves when the new column has been created.
   *
   * @example
   * // Example input:
   * // label = "Expiration Date", type = "date"
   *
   * @example
   * // Example API payload:
   * {
   *   "key": "expiration_date",
   *   "label": "Expiration Date",
   *   "type": "date"
   * }
   */

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

  useEffect(() => {
    setSubmit(() => handleSubmit);
  }, [label, type]);

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
    </div>
  );

}

/**
 * Determines the inventory status label for a given item.
 *
 * This function evaluates the current stock level of an inventory item
 * relative to its reorder point and returns a status string used by the UI.
 * The possible results are "Unavailable", "Reorder", "Low", or "In Stock".
 *
 * @returns A status label representing the item's current stock condition.
 *
 * @example
 * // Example output:
 * // If inStock is 0, returns "Unavailable"
 *
 * @example
 * // Example output:
 * // If inStock is greater than reorderPoint, returns "In Stock"
 */

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

/**
 * Returns the Tailwind CSS class string for a given inventory status.
 *
 * This function maps inventory status values to pre-defined style classes
 * so that each status badge is displayed with consistent colors and styling
 * in the inventory table.
 *
 * @returns A string of CSS utility classes for rendering the status badge.
 *
 * @example
 * // Example output:
 * getStatusClasses("Unavailable")
 * // returns red badge classes
 *
 * @example
 * // Example output:
 * getStatusClasses("In Stock")
 * // returns green badge classes
 */

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


/**
 * Returns the value used to sort an inventory item by a given column key.
 *
 * This function supports sorting both built-in inventory fields and
 * user-defined custom fields. It also handles computed values such as
 * total inventory value and stock status priority.
 *
 * @returns A sortable value derived from the provided item and column key.
 *
 * @example
 * // Example output:
 * getSortableValue(item, "totalValue")
 * // returns inStock * unitCost
 *
 * @example
 * // Example output:
 * getSortableValue(item, "status")
 * // returns the numeric priority for the item's status
 */

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

/**
 * Renders the main inventory dashboard page.
 *
 * This page allows users to manage inventory items, including creating,
 * editing, deleting, sorting, and quickly updating stock quantities and
 * costs. It also supports user-defined custom columns and calculates
 * summary values such as estimated total inventory value.
 *
 * @returns A React element representing the inventory dashboard page.
 *
 * @example
 * // Example behavior:
 * // Displays a table of inventory items with sorting, custom columns,
 * // edit controls, and quick update actions.
 *
 * @example
 * // Example result:
 * // Users can add a new item, adjust stock levels, manage custom columns,
 * // and view total inventory value from a single page.
 */


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

  /**
   * Updates the visibility state of a custom column.
   *
   * This function sends a PATCH request to the columns API to persist
   * the new visibility state, then updates local column state so the UI
   * reflects the change immediately.
   *
   * @returns A promise that resolves when the visibility update is complete.
   *
   * @example
   * // Example usage:
   * toggleColumn("supplier", false);
   *
   * @example
   * // Example behavior:
   * // Hides the "supplier" custom column from the inventory table.
   */

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

  /**
   * Updates the current table sort configuration.
   *
   * This function toggles the sort direction when the same column is clicked
   * repeatedly, or applies ascending sorting when a new column is selected.
   *
   * @returns No return value. Updates sort state for the inventory table.
   *
   * @example
   * // Example usage:
   * handleSort("name");
   *
   * @example
   * // Example behavior:
   * // First click sorts by name ascending, second click sorts by name descending.
   */

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

  /**
   * Loads inventory data for the authenticated user.
   *
   * This function fetches the latest inventory items from the inventory API,
   * updates page state with the returned data, and manages the loading state
   * while the request is in progress.
   *
   * @returns A promise that resolves when inventory data has been loaded.
   *
   * @example
   * // Example behavior:
   * // Fetches /api/inventory and stores the result in local state.
   *
   * @example
   * // Example result:
   * // The inventory table updates with the latest saved items.
   */


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

  /**
   * Updates a field in the inventory item form state.
   *
   * This function is used by the create and edit form inputs to keep
   * form state synchronized with the user’s current input.
   *
   * @returns No return value. Updates the inventory item form state.
   *
   * @example
   * // Example usage:
   * handleInputChange("name", "Flour");
   *
   * @example
   * // Example result:
   * // The item form's name field becomes "Flour".
   */
  
  function handleInputChange(field: keyof ItemForm, value: string) {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleQuickUpdateChange(field: keyof QuickUpdateForm, value: string) {
    setQuickUpdateForm((prev) => ({ ...prev, [field]: value }));
  }

  /**
   * Resets all inventory page form state to default values.
   *
   * This function clears the create/edit form, quick update form, error state,
   * and editing state so the page returns to its default interaction state.
   *
   * @returns No return value. Resets local form and modal-related state.
   *
   * @example
   * // Example behavior:
   * // Clears the current form after a successful save.
   *
   * @example
   * // Example behavior:
   * // Cancels edit mode and hides any open quick update form.
   */

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

  /**
   * Loads an inventory item into the form for editing.
   *
   * This function fetches a single inventory item by ID, populates the
   * item form with its existing values, enables edit mode, and scrolls
   * the page to the form so the user can update the item.
   *
   * @returns A promise that resolves when the item has been loaded
   * into the edit form.
   *
   * @example
   * // Example usage:
   * handleEditClick("661f2b8e1234567890abcd12");
   *
   * @example
   * // Example behavior:
   * // Opens the form with the selected item's current values pre-filled.
   */

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

  /**
   * Applies a quick stock and cost update to an inventory item.
   *
   * This function validates the quick update form, calculates the new stock
   * quantity and optional updated unit cost, sends a PATCH request to the
   * inventory API, and updates local state so the table reflects the change
   * immediately.
   *
   * @returns A promise that resolves when the inventory item has been updated.
   *
   * @example
   * // Example usage:
   * handleQuickUpdateSubmit("661f2b8e1234567890abcd12");
   *
   * @example
   * // Example behavior:
   * // Adds or subtracts stock quantity and optionally updates the item's cost.
   */

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

  /**
   * Handles submission of the inventory item form.
   *
   * This function validates user input, builds the request payload, and either
   * creates a new inventory item or updates an existing one depending on whether
   * the page is currently in edit mode. After a successful save, it updates local
   * inventory state and resets the form.
   *
   * @returns A promise that resolves when the inventory item has been saved.
   *
   * @example
   * // Example behavior:
   * // Creates a new inventory item when no editing ID is active.
   *
   * @example
   * // Example behavior:
   * // Updates the selected inventory item when edit mode is enabled.
   */

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

    /**
   * Deletes an inventory item after user confirmation.
   *
   * This function prompts the user for confirmation, sends a DELETE request
   * to the inventory API, removes the deleted item from local state, and
   * resets the edit form if the deleted item was currently being edited.
   *
   * @returns A promise that resolves when the item has been deleted.
   *
   * @example
   * // Example usage:
   * handleDelete("661f2b8e1234567890abcd12");
   *
   * @example
   * // Example behavior:
   * // Removes the selected item from the table after a successful deletion.
   */

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

    /**
   * Renders the quick update form for a selected inventory item.
   *
   * This function conditionally displays an inline form that allows the user
   * to quickly adjust stock quantity and unit cost for a specific item without
   * opening the full edit form.
   *
   * @returns A table row element containing the quick update form, or `null`
   * if the selected item is not currently in quick update mode.
   *
   * @example
   * // Example behavior:
   * // Returns a quick update row when the item is selected for update.
   *
   * @example
   * // Example behavior:
   * // Returns null when the quick update form is closed.
   */
  
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

              <select
                value={itemForm.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="">Select unit</option>

                {["weight", "volume", "count"].map((category) =>
                  groupedUnits[category] ? (
                    <optgroup
                      key={category}
                      label={category.charAt(0).toUpperCase() + category.slice(1)}
                    >
                      {groupedUnits[category].map((unit) => (
                        <option key={unit} value={unit}>
                          {UNITS[unit].name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
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

                    {col.type === "number" ? (
                      <input
                        type="number"
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
                    ) : col.type === "date" ? (
                      <input
                        type="date"
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
                      />
                    ) : col.type === "boolean" ? (
                      <select
                        value={itemForm.customFields?.[col.key] != null ? String(itemForm.customFields[col.key]) : ""}
                        onChange={(e) =>
                          setItemForm(prev => ({
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              [col.key]: e.target.value === "true",
                            },
                          }))
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type="text"
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
                    )}
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
                        <td className="px-6 py-3 text-slate-600">
                          {UNITS[item.unit]?.name || item.unit || "-"}
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

                        {/* 🔹 CUSTOM USER-DEFINED COLUMNS (NEW) */}
                        {visibleCustomColumns.map(col => (
                          <td
                            key={col.key}
                            className="px-6 py-3 text-slate-600"
                          >
                            {typeof item.customFields?.[col.key] === "boolean"
                              ? item.customFields[col.key]
                                ? "Yes"
                                : "No"
                              : item.customFields?.[col.key] ?? "-"}
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
