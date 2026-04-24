"use client";

import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { UNITS } from "@/lib/units";
import { convertToBase, getUnitCategory } from "@/lib/unitConversion";

const UNIT_OPTIONS = Object.keys(UNITS);

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

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
  baseUnit: string;
  costPerBaseUnit: number;
  gramsPerPiece?: number;
  gramsPerMl?: number;
  mlPerPiece?: number;
};

type IngredientForm = {
  name: string;
  unit: string;
  quantity: string; // string for input, convert to number on submit
};

type RecipeRow = {
  _id: string;
  name: string;
  category?: string;
  subCategory?: string;
  menuPrice?: number;
  createdAt?: string;
};

/**
 * Renders the main recipes dashboard page.
 *
 * This page allows users to create, edit, delete, and sort recipes while
 * pulling ingredient options from inventory. It also validates ingredient
 * units against inventory units and prompts the user for conversion values
 * when a recipe ingredient cannot be directly matched to the inventory item’s
 * base measurement.
 *
 * @returns A React element representing the recipes dashboard page.
 *
 * @example
 * // Example behavior:
 * // Displays a recipe table along with a form for adding or editing recipes.
 *
 * @example
 * // Example result:
 * // Users can save recipes, sort recipe rows, and handle ingredient
 * // conversion mismatches from the same page.
 */

export default function RecipesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [recipeName, setRecipeName] = useState("");
  const [menuPrice, setMenuPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { name: "", unit: "", quantity: "" },
  ]);

  const [pendingConversions, setPendingConversions] = useState<any[]>([]);
  const [activeConversionIndex, setActiveConversionIndex] = useState(0);

  const [conversionValue, setConversionValue] = useState<string>("");
  const [pendingIngredients, setPendingIngredients] = useState<any[] | null>(null);

  /**
   * Validates ingredient-to-inventory unit compatibility before saving a recipe.
   *
   * This function compares each cleaned recipe ingredient against the matching
   * inventory item and checks whether their normalized base units are compatible.
   * If any mismatches are found, it stores the pending ingredients and conversion
   * prompts in state so the user can provide the missing conversion values before
   * the recipe is saved.
   *
   * @returns A promise that resolves to `true` if all ingredients are compatible,
   * or `false` if user input is required for one or more conversions.
   *
   * @example
   * // Example result:
   * // Returns true when all ingredient units match compatible inventory units.
   *
   * @example
   * // Example result:
   * // Returns false and opens the conversion workflow when a recipe ingredient
   * // uses a unit that cannot be directly converted to the inventory base unit.
   */

  async function validateAndCalculateCost(cleanedIngredients: any[]) {
    const mismatches: any[] = [];

    for (const ing of cleanedIngredients) {
      const inventoryItem = inventory.find(
        (item) => item.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (!inventoryItem) continue;

      const { baseUnit } = convertToBase(ing.quantity, ing.unit);

      if (baseUnit !== inventoryItem.baseUnit) {
        mismatches.push({
          inventoryItem,
          ingredientName: ing.name,
          recipeBaseUnit: baseUnit,
          inventoryBaseUnit: inventoryItem.baseUnit,
        });
      }
    }

    if (mismatches.length > 0) {
      setPendingIngredients(cleanedIngredients);
      setPendingConversions(mismatches);
      setActiveConversionIndex(0);
      return false;
    }

    return true;
  }

  // NEW: track edit vs create
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditMode = !!editingId;

  // Load inventory for ingredient dropdowns
  useEffect(() => {

    /**
     * Loads inventory items used as ingredient options in the recipe form.
     *
     * This function fetches inventory data from the API, stores the returned
     * items in local state, and updates loading state while the request is
     * in progress.
     *
     * @returns A promise that resolves when inventory data has been loaded.
     *
     * @example
     * // Example behavior:
     * // Fetches /api/inventory and stores the returned items in state.
     *
     * @example
     * // Example result:
     * // Ingredient dropdowns are populated with inventory item names.
     */

    async function loadInventory() {
      setLoadingInventory(true);
      try {
        const res = await fetch("/api/inventory", { cache: "no-store" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setInventory(json.data);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      } finally {
        setLoadingInventory(false);
      }
    }
    loadInventory();
  }, []);

  // Load existing recipes
  useEffect(() => {
    /**
     * Loads existing recipes for the authenticated user.
     *
     * This function fetches recipe data from the API, stores the returned
     * recipes in local state, and manages loading state for the recipes table.
     *
     * @returns A promise that resolves when recipes have been loaded.
     *
     * @example
     * // Example behavior:
     * // Fetches /api/recipes and stores the result in local state.
     *
     * @example
     * // Example result:
     * // The recipes table is populated with the user's saved recipes.
     */

    async function loadRecipes() {
      setLoadingRecipes(true);
      try {
        const res = await fetch("/api/recipes", { cache: "no-store" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setRecipes(json.data);
      } catch (err) {
        console.error("Failed to load recipes:", err);
      } finally {
        setLoadingRecipes(false);
      }
    }
    loadRecipes();
  }, []);

  /**
   * Updates a field in a specific ingredient row of the recipe form.
   *
   * This function is used to keep the ingredient list synchronized with
   * user input by updating the selected ingredient row and field.
   *
   * @returns No return value. Updates the ingredient form state.
   *
   * @example
   * // Example usage:
   * handleIngredientChange(0, "name", "Flour");
   *
   * @example
   * // Example result:
   * // The first ingredient row now has the name "Flour".
   */

  function handleIngredientChange(
    index: number,
    field: keyof IngredientForm,
    value: string
  ) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  type SortDirection = "asc" | "desc";

  const [sortConfig, setSortConfig] = useState<{
    key: keyof RecipeRow | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "asc",
  });

  /**
   * Updates the recipe table sort configuration.
   *
   * This function toggles the sort direction when the same column is selected
   * repeatedly, or applies ascending sorting when a new column is chosen.
   *
   * @returns No return value. Updates sort state for the recipes table.
   *
   * @example
   * // Example usage:
   * handleSort("name");
   *
   * @example
   * // Example behavior:
   * // First click sorts by name ascending, second click sorts by name descending.
   */

  function handleSort(key: keyof RecipeRow) {
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

  /**
   * Adds a new empty ingredient row to the recipe form.
   *
   * This function appends a blank ingredient entry so the user can add
   * another ingredient to the current recipe.
   *
   * @returns No return value. Updates the ingredient list state.
   *
   * @example
   * // Example behavior:
   * // Adds a new row with empty name, unit, and quantity fields.
   *
   * @example
   * // Example result:
   * // The recipe form displays one additional ingredient input row.
   */

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: "", unit: "", quantity: "" }]);
  }

  /**
   * Removes an ingredient row from the recipe form.
   *
   * This function deletes the ingredient row at the specified index
   * from the current list of recipe ingredients.
   *
   * @returns No return value. Updates the ingredient list state.
   *
   * @example
   * // Example usage:
   * removeIngredientRow(1);
   *
   * @example
   * // Example result:
   * // The second ingredient row is removed from the form.
   */

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Resets the recipe form to its default state.
   *
   * This function clears all recipe form fields, resets validation errors,
   * exits edit mode, and hides the form so the page returns to its default state.
   *
   * @returns No return value. Resets local recipe form state.
   *
   * @example
   * // Example behavior:
   * // Clears the form after a successful recipe save.
   *
   * @example
   * // Example behavior:
   * // Cancels editing and closes the recipe form.
   */

  function resetForm() {
    setRecipeName("");
    setMenuPrice("");
    setCategory("");
    setSubCategory("");
    setIngredients([{ name: "", unit: "", quantity: "" }]);
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  }

  /**
   * Loads an existing recipe into the form for editing.
   *
   * This function fetches a recipe by ID, populates the form fields with
   * its existing values, switches the page into edit mode, and scrolls
   * the user to the top of the page so the form is immediately visible.
   *
   * @returns A promise that resolves when the recipe has been loaded
   * into the edit form.
   *
   * @example
   * // Example usage:
   * handleEditClick("507f1f77bcf86cd799439012");
   *
   * @example
   * // Example behavior:
   * // Opens the form with the selected recipe's values pre-filled.
   */

  async function handleEditClick(id: string) {
    setFormError(null);
    setIsSaving(false);

    try {
      const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load recipe");

      const recipe = json.data as any;

      setEditingId(recipe._id);
      setRecipeName(recipe.name || "");
      setCategory(recipe.category || "");
      setSubCategory(recipe.subCategory || "");
      setMenuPrice(
        recipe.menuPrice != null ? String(recipe.menuPrice) : ""
      );

      const ingForms: IngredientForm[] = (recipe.ingredients || []).map(
        (ing: any) => ({
          name: ing.name || "",
          unit: ing.unit || "",
          quantity:
            ing.quantity != null ? String(ing.quantity) : "",
        })
      );

      setIngredients(
        ingForms.length > 0
          ? ingForms
          : [{ name: "", unit: "", quantity: "" }]
      );

      setShowForm(true);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 0);

      setFormError(null);

    } catch (err: any) {
      console.error("Failed to load recipe for edit:", err);
      setFormError(err.message || "Failed to load recipe for editing.");
    }
  }

  /**
   * Deletes a recipe after user confirmation.
   *
   * This function prompts the user for confirmation, sends a DELETE request
   * for the selected recipe, removes the recipe from local state, and resets
   * the form if the deleted recipe was currently being edited.
   *
   * @returns A promise that resolves when the recipe has been deleted.
   *
   * @example
   * // Example usage:
   * handleDelete("507f1f77bcf86cd799439012");
   *
   * @example
   * // Example behavior:
   * // Removes the selected recipe from the table after successful deletion.
   */

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this recipe? This action cannot be undone."
    );
    if (!confirmDelete) return;
  
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
  
      if (!json.success) throw new Error(json.error || "Failed to delete recipe");
  
      // Remove from UI
      setRecipes((prev) => prev.filter((r) => r._id !== id));
  
      // If user was editing this recipe, reset the form
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe: " + err.message);
    }
  }

  /**
   * Saves a recipe by either creating a new record or updating an existing one.
   *
   * This function builds the request payload from the current form state,
   * determines whether the page is in create or edit mode, sends the
   * appropriate API request, updates the recipes list in local state,
   * and resets the form after a successful save.
   *
   * @returns A promise that resolves when the recipe has been saved.
   *
   * @example
   * // Example behavior:
   * // Sends a POST request when creating a new recipe.
   *
   * @example
   * // Example behavior:
   * // Sends a PUT request when editing an existing recipe.
   */

  async function saveRecipe(cleanedIngredients: any[]) {
    const parsedMenuPrice = parseFloat(menuPrice || "0");

    const payload = {
      name: recipeName.trim(),
      category: category.trim(),
      subCategory: subCategory.trim(),
      menuPrice: parsedMenuPrice,
      ingredients: cleanedIngredients,
    };

    let res: Response;

    if (isEditMode && editingId) {
      res = await fetch(`/api/recipes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to save recipe");
    }

    const saved = json.data;

    if (isEditMode && editingId) {
      setRecipes((prev) =>
        prev.map((r) => (r._id === editingId ? saved : r))
      );
    } else {
      setRecipes((prev) => [saved, ...prev]);
    }

    resetForm();
  }

  /**
   * Handles submission of the recipe form.
   *
   * This function validates the recipe name, menu price, and ingredient list,
   * normalizes ingredient values, checks for required unit conversions, and
   * saves the recipe if all validation steps pass.
   *
   * @returns A promise that resolves when recipe submission has completed.
   *
   * @example
   * // Example behavior:
   * // Prevents submission if the recipe name is empty or invalid.
   *
   * @example
   * // Example behavior:
   * // Starts the conversion workflow if ingredient and inventory units do not match.
   */
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!recipeName.trim()) {
      setFormError("Recipe name is required.");
      return;
    }

    const parsedMenuPrice = parseFloat(menuPrice || "0");
    if (isNaN(parsedMenuPrice) || parsedMenuPrice < 0) {
      setFormError("Menu price must be a non-negative number.");
      return;
    }

    const cleanedIngredients = ingredients
      .map((ing) => ({
        name: ing.name.trim(),
        unit: ing.unit.trim(),
        quantity: parseFloat(ing.quantity || "0"),
      }))
      .filter((ing) => ing.name && ing.quantity > 0);

    if (cleanedIngredients.length === 0) {
      setFormError("Add at least one ingredient with quantity > 0.");
      return;
    }

    setIsSaving(true);

    const isValid = await validateAndCalculateCost(cleanedIngredients);
    if (!isValid) {
      setIsSaving(false);
      return;
    }

    try {
      await saveRecipe(cleanedIngredients);
    } catch (err: any) {
      setFormError(err.message || "Failed to save recipe.");
    } finally {
      setIsSaving(false);
    }
  }

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // Handle undefined/null
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Number sort
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc"
        ? aValue - bValue
        : bValue - aValue;
    }

    // String sort
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (sortConfig.direction === "asc") {
      return aString.localeCompare(bString);
    } else {
      return bString.localeCompare(aString);
    }
  });

  // Determine conversion prompt text
  const activeConversion =
    pendingConversions.length > 0
      ? pendingConversions[activeConversionIndex]
      : null;
    let conversionLabel = "";

  useEffect(() => {
    if (!activeConversion) {
      setConversionValue("");
      return;
    }

    const recipeCategory = getUnitCategory(activeConversion.recipeBaseUnit);
    const inventoryCategory = getUnitCategory(activeConversion.inventoryBaseUnit);

    let existingValue: number | undefined;

    if (
      (recipeCategory === "count" && inventoryCategory === "mass") ||
      (recipeCategory === "mass" && inventoryCategory === "count")
    ){
      existingValue = activeConversion.inventoryItem.gramsPerPiece;
    } 
    else if (
      (recipeCategory === "volume" && inventoryCategory === "mass") ||
      (recipeCategory === "mass" && inventoryCategory === "volume")
    ) {
      existingValue = activeConversion.inventoryItem.gramsPerMl;
    } 
    else if (
      (recipeCategory === "count" && inventoryCategory === "volume") ||
      (recipeCategory === "volume" && inventoryCategory === "count")
    ) {
      existingValue = activeConversion.inventoryItem.mlPerPiece;
    }

    if (existingValue && existingValue > 0) {
      setConversionValue(String(existingValue));
    } else {
      setConversionValue("");
    }
  }, [activeConversion]);

  if (activeConversion) {
    const recipeCategory = getUnitCategory(activeConversion.recipeBaseUnit);
    const inventoryCategory = getUnitCategory(activeConversion.inventoryBaseUnit);

    if (
      (recipeCategory === "count" && inventoryCategory === "mass") ||
      (recipeCategory === "mass" && inventoryCategory === "count")
    ) {
      conversionLabel = `How many grams are in 1 piece of ${activeConversion.ingredientName}?\n
      Tip: Weigh 3 ${activeConversion.ingredientName}s in g and divide the result by 3 to get an average weight per ${activeConversion.ingredientName}.`;
    } else if (
      (recipeCategory === "count" && inventoryCategory === "volume") ||
      (recipeCategory === "volume" && inventoryCategory === "count")
    ) {
      conversionLabel = `How many ml are in 1 piece of ${activeConversion.ingredientName}?\n
      Tip: This is a tricky conversion! We recommend filling a measuring cup partly with water and placing the item to see how much the water changes in ml. Otherwise, see how many ${activeConversion.ingredientName}s fit in a measuring cup and divide 236.5 (the number of ml/cup) by that number.`;
    } else if (
      (recipeCategory === "volume" && inventoryCategory === "mass") ||
      (recipeCategory === "mass" && inventoryCategory === "volume")
    ) {
      conversionLabel = `How many grams are in 1 ml of ${activeConversion.ingredientName}?\n
      Tip: Weigh 5 mls of ${activeConversion.ingredientName} (1 tsp) in g and divide the result by 5 to get the average mass per ml.`;
    } else {
      conversionLabel = "Enter conversion value";
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl text-sky-600 font-semibold">Recipes</h2>
          <div className="flex items-center gap-2">
        <Button
          variant={showForm ? "outline" : "default"}
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setFormError(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add New Recipe"}
        </Button>

        </div>
      </header>

      {showForm && (
        <section className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            {isEditMode ? "Edit Recipe" : "New Recipe"}
          </h3>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Basic recipe info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Smash Burger"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Menu Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="12.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Dinner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Sub-Category
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Burgers"
                />
              </div>
            </div>

            {/* Ingredient list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase">
                  Ingredients
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredientRow}
                >
                  + Add Ingredient
                </Button>
              </div>

              {loadingInventory && (
                <p className="text-xs text-slate-500">
                  Loading inventory...
                </p>
              )}

              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]"
                  >
                    {/* Ingredient name (dropdown + free text) */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Ingredient Name *
                      </label>
                      <input
                        list="inventory-names"
                        value={ing.name}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Beef Patty"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Unit
                      </label>
                      <select
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredientChange(index, "unit", e.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Select unit</option>

                        {Object.entries(groupedUnits).map(([category, units]) => (
                          <optgroup
                            key={category}
                            label={category.charAt(0).toUpperCase() + category.slice(1)}
                          >
                            {units.map((unit) => (
                              <option key={unit} value={unit}>
                                {UNITS[unit].name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ing.quantity}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="1"
                      />
                    </div>

                    <div className="flex items-end">
                      {ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeIngredientRow(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {activeConversion && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-lg">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold">
                          Define Conversion for {activeConversion.ingredientName}
                        </h3>

                        <span className="text-xs text-slate-500 font-medium">
                          {activeConversionIndex + 1}/{pendingConversions.length}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        This ingredient is stored in{" "}
                        <strong>{activeConversion.inventoryBaseUnit}</strong> but
                        used in <strong>{activeConversion.recipeBaseUnit}</strong>.
                      </p>

                      <p className="text-sm text-slate-700 font-medium whitespace-pre-line">{conversionLabel}</p>

                      <input
                        type="number"
                        step="0.01"
                        value={conversionValue}
                        onChange={(e) => setConversionValue(e.target.value)}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder={'100'}
                      />

                      <p className="text-xs text-slate-500">
                        Previous conversion values will appear here, and new values will be saved to this inventory item for future conversions.
                      </p>


                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setPendingConversions([]);
                            setActiveConversionIndex(0);
                            setPendingIngredients(null);
                            setIsSaving(false);
                          }}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              if (!activeConversion) return;

                              const parsed = parseFloat(conversionValue);
                              if (isNaN(parsed) || parsed <= 0) {
                                alert("Please enter a valid conversion value.");
                                return;
                              }

                              const recipeCategory = getUnitCategory(activeConversion.recipeBaseUnit);
                              const inventoryCategory = getUnitCategory(activeConversion.inventoryBaseUnit);

                              let fieldToUpdate: string | null = null;

                              if (
                                (recipeCategory === "count" && inventoryCategory === "mass") ||
                                (recipeCategory === "mass" && inventoryCategory === "count")
                              ) {
                                fieldToUpdate = "gramsPerPiece";
                              }

                              if (
                                (recipeCategory === "volume" && inventoryCategory === "mass") ||
                                (recipeCategory === "mass" && inventoryCategory === "volume")
                              ) {
                                fieldToUpdate = "gramsPerMl";
                              }

                              if (
                                (recipeCategory === "count" && inventoryCategory === "volume") ||
                                (recipeCategory === "volume" && inventoryCategory === "count")
                              ) {
                                fieldToUpdate = "mlPerPiece";
                              }

                              if (!fieldToUpdate) {
                                alert("Unsupported unit conversion.");
                                return;
                              }

                              await fetch(`/api/inventory/${activeConversion.inventoryItem._id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  [fieldToUpdate]: parsed,
                                }),
                              });

                              // Capture values first
                              const nextIndex = activeConversionIndex + 1;

                              // New Method below
                              if (nextIndex < pendingConversions.length) {
                                setActiveConversionIndex(nextIndex);
                                setConversionValue("");
                              } else {
                                // Done with all conversions
                                const finalIngredients = pendingIngredients;

                                setPendingConversions([]);
                                setActiveConversionIndex(0);
                                setPendingIngredients(null);

                                if (finalIngredients) {
                                  try {
                                    await saveRecipe(finalIngredients);
                                  } catch (err: any) {
                                    setFormError(err.message || "Failed to save recipe.");
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }
                              }

                            } catch (err: any) {
                              console.error(err);
                              alert(err.message || "Failed to save conversion.");
                            }
                          }}
                        >
                          Save Conversion
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* datalist of inventory names for autocomplete */}
              <datalist id="inventory-names">
                {inventory.map((item) => (
                  <option key={item._id} value={item.name} />
                ))}
              </datalist>
              {/* datalist of unit options for autocomplete */}
              <datalist id="unit-options">
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? isEditMode
                  ? "Saving Changes..."
                  : "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Save Recipe"}
            </Button>
          </form>
        </section>
      )}


      {/* Recipe Table */}
      <section className="rounded-xl border bg-sky-600 shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Your Recipes
          </h3>
          <span className="text-xs text-slate-700">
            Total recipes: {recipes.length}
          </span>
        </div>

        {loadingRecipes ? (
          <div className="p-6 text-white">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-300 text-xs uppercase text-slate-600">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                  >
                    Recipe Name
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>

                  <th
                    onClick={() => handleSort("category")}
                    className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                  >
                    Category
                    {sortConfig.key === "category" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>

                  <th
                    onClick={() => handleSort("subCategory")}
                    className="px-6 py-3 text-left font-medium cursor-pointer select-none"
                  >
                    SubCategory
                    {sortConfig.key === "subCategory" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>

                  <th
                    onClick={() => handleSort("menuPrice")}
                    className="px-6 py-3 text-right font-medium cursor-pointer select-none"
                  >
                    Menu Price ($)
                    {sortConfig.key === "menuPrice" &&
                      (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </th>

                  <th className="px-6 py-3 text-center font-medium">Manage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedRecipes.map((recipe) => (
                  <tr
                    key={recipe._id}
                    className="hover:bg-slate-200 odd:bg-white even:bg-slate-50"
                  >
                    <td className="px-6 py-3 text-slate-800">
                      {recipe.name}
                    </td>

                    <td className="px-6 py-3 text-slate-600">
                      {recipe.category || "-"}
                    </td>

                    <td className="px-6 py-3 text-slate-600">
                      {recipe.subCategory || "-"}
                    </td>

                    <td className="px-6 py-3 text-right tabular-nums text-slate-800">
                      ${recipe.menuPrice?.toFixed(2) ?? "0.00"}
                    </td>

                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(recipe._id)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(recipe._id)}
                      >
                        Delete
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loadingRecipes && recipes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-6 text-center text-white"
                    >
                      No recipes yet. Add your first recipe to get started.
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
