"use client";

import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";

type InventoryItem = {
  _id: string;
  name: string;
  unit: string;
  unitCost: number;
};

type IngredientForm = {
  name: string;
  unit: string;
  quantity: string; // string for input, convert to number on submit
};

type RecipeRow = {
  _id: string;
  name: string;
  menuPrice?: number;
  createdAt?: string;
};

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
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { name: "", unit: "", quantity: "" },
  ]);

  // NEW: track edit vs create
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditMode = !!editingId;

  // Load inventory for ingredient dropdowns
  useEffect(() => {
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

  function handleIngredientChange(
    index: number,
    field: keyof IngredientForm,
    value: string
  ) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: "", unit: "", quantity: "" }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  // NEW: reset form (used when cancel or after save)
  function resetForm() {
    setRecipeName("");
    setMenuPrice("");
    setIngredients([{ name: "", unit: "", quantity: "" }]);
    setFormError(null);
    setEditingId(null);
    setShowForm(false);
  }

  // NEW: start editing a recipe
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
    } catch (err: any) {
      console.error("Failed to load recipe for edit:", err);
      setFormError(err.message || "Failed to load recipe for editing.");
    }
  }

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
    try {
      const payload = {
        name: recipeName.trim(),
        menuPrice: parsedMenuPrice,
        ingredients: cleanedIngredients,
      };

      let res: Response;
      let json: any;

      if (isEditMode && editingId) {
        // UPDATE existing recipe
        res = await fetch(`/api/recipes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE new recipe
        res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save recipe");
      }

      const saved = json.data as any;

      if (isEditMode && editingId) {
        // Replace in existing list
        setRecipes((prev) =>
          prev.map((r) => (r._id === editingId ? saved : r))
        );
      } else {
        // Add new recipe to top
        setRecipes((prev) => [saved, ...prev]);
      }

      resetForm();
    } catch (err: any) {
      console.error("Error saving recipe:", err);
      setFormError(err.message || "Failed to save recipe.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl text-sky-600 font-semibold">Recipes</h2>
        <Button
          onClick={() => {
            if (showForm && !isEditMode) {
              // cancel creating new
              resetForm();
            } else if (showForm && isEditMode) {
              // cancel editing
              resetForm();
            } else {
              // open blank form to create
              setEditingId(null);
              setFormError(null);
              setShowForm(true);
            }
          }}
        >
          {showForm
            ? "Cancel"
            : "Add New Recipe"}
        </Button>
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
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "unit",
                            e.target.value
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="piece, g, kg..."
                      />
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
              </div>

              {/* datalist of inventory names for autocomplete */}
              <datalist id="inventory-names">
                {inventory.map((item) => (
                  <option key={item._id} value={item.name} />
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

      {/* List of recipes */}
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
          <div className="divide-y divide-slate-100">
            {recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="px-6 py-4 bg-white hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {recipe.name}
                    </h4>
                    {recipe.createdAt && (
                      <p className="text-xs text-slate-500">
                        Created{" "}
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-slate-700">
                      <div>Menu Price:</div>
                      <div className="font-semibold">
                        ${recipe.menuPrice?.toFixed(2) ?? "0.00"}
                      </div>
                    </div>
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
                </div>
              </div>
            ))}

            {!loadingRecipes && recipes.length === 0 && (
              <div className="px-6 py-6 text-center text-white">
                No recipes yet. Add your first recipe to get started.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
