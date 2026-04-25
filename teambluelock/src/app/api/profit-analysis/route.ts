import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Recipe } from "@/models/recipe";
import { InventoryItem } from "@/models/inventory";
import { convertToBase, getUnitCategory } from "@/lib/unitConversion";

/**
 * Handles a GET request to generate profit analysis data for the authenticated user.
 *
 * This endpoint validates the current user session, retrieves all recipes and
 * inventory items associated with the authenticated user, and calculates the
 * estimated ingredient cost for each recipe. It matches recipe ingredients to
 * inventory items by name, converts ingredient quantities into compatible base
 * units, and supports additional conversions between count, mass, and volume
 * when conversion helper values such as grams per piece, grams per milliliter,
 * or milliliters per piece are available. The endpoint then calculates each
 * recipe’s computed cost, margin amount, margin percentage, and tracks any
 * missing ingredients that could not be matched in inventory.
 *
 * @returns A JSON response containing an array of profit analysis results for
 * each recipe on success, or an error message if the user is unauthorized or
 * the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "recipeId": "507f1f77bcf86cd799439012",
 *       "name": "Chocolate Chip Cookies",
 *       "category": "Dessert",
 *       "subCategory": "Cookies",
 *       "menuPrice": 12,
 *       "computedCost": 4.5,
 *       "marginAmount": 7.5,
 *       "marginPct": 62.5,
 *       "missingIngredients": []
 *     }
 *   ]
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Unauthorized"
 * }
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const [recipes, inventoryItems] = await Promise.all([
      Recipe.find({ userId: session.user.id }).lean(),
      InventoryItem.find({ userId: session.user.id }).lean(),
    ]);

    // Build inventory map with full info
    const inventoryMap = new Map<string, any>();
    for (const item of inventoryItems) {
      if (!item.name) continue;
      inventoryMap.set(item.name.toLowerCase(), item);
    }

    const analysis = recipes.map((recipe: any) => {
      let computedCost = 0;
      const missingIngredients: string[] = [];

      for (const ing of recipe.ingredients || []) {
        const name = (ing.name || "").trim();
        if (!name) continue;

        const key = name.toLowerCase();
        const inventoryItem = inventoryMap.get(key);

        if (!inventoryItem) {
          missingIngredients.push(name);
          continue;
        }


        const qty = ing.quantity || 0;
        const ingUnit = ing.unit;

        const converted = convertToBase(qty, ingUnit);
        const recipeBaseAmount = converted.baseAmount;
        const recipeBaseUnit = converted.baseUnit;

        let ingBaseAmount: number | null = null;

        // SAME CATEGORY → Already compatible
        if (recipeBaseUnit === inventoryItem.baseUnit) {
          ingBaseAmount = recipeBaseAmount;
        }

        // COUNT ↔ MASS
        else if (
          inventoryItem.gramsPerPiece &&
          getUnitCategory(recipeBaseUnit) === "count" &&
          getUnitCategory(inventoryItem.baseUnit) === "mass"
        ) {
          ingBaseAmount = recipeBaseAmount * inventoryItem.gramsPerPiece;
        }
        else if (
          inventoryItem.gramsPerPiece &&
          getUnitCategory(recipeBaseUnit) === "mass" &&
          getUnitCategory(inventoryItem.baseUnit) === "count"
        ) {
          ingBaseAmount = recipeBaseAmount / inventoryItem.gramsPerPiece;
        }

        // VOLUME ↔ MASS
        else if (
          inventoryItem.gramsPerMl &&
          getUnitCategory(recipeBaseUnit) === "volume" &&
          getUnitCategory(inventoryItem.baseUnit) === "mass"
        ) {
          ingBaseAmount = recipeBaseAmount * inventoryItem.gramsPerMl;
        }
        else if (
          inventoryItem.gramsPerMl &&
          getUnitCategory(recipeBaseUnit) === "mass" &&
          getUnitCategory(inventoryItem.baseUnit) === "volume"
        ) {
          ingBaseAmount = recipeBaseAmount / inventoryItem.gramsPerMl;
        }

        // COUNT ↔ VOLUME
        else if (
          inventoryItem.mlPerPiece &&
          getUnitCategory(recipeBaseUnit) === "count" &&
          getUnitCategory(inventoryItem.baseUnit) === "volume"
        ) {
          ingBaseAmount = recipeBaseAmount * inventoryItem.mlPerPiece;
        }
        else if (
          inventoryItem.mlPerPiece &&
          getUnitCategory(recipeBaseUnit) === "volume" &&
          getUnitCategory(inventoryItem.baseUnit) === "count"
        ) {
          ingBaseAmount = recipeBaseAmount / inventoryItem.mlPerPiece;
        }

        if (ingBaseAmount === null) {
          console.warn(`No conversion for ${ing.name} from ${ingUnit} to ${inventoryItem.baseUnit}`);
          continue;
        }

        const cost = ingBaseAmount * inventoryItem.costPerBaseUnit;
        computedCost += cost;
      }


      const menuPrice: number = recipe.menuPrice ?? 0;
      const marginAmount = menuPrice - computedCost;
      const marginPct =
        menuPrice > 0 ? (marginAmount / menuPrice) * 100 : null;

      return {
        recipeId: String(recipe._id),
        name: recipe.name,
        category: recipe.category,
        subCategory: recipe.subCategory,
        menuPrice,
        computedCost,
        marginAmount,
        marginPct,
        missingIngredients,
      };
    });


    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("GET /api/profit-analysis error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
