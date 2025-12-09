import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Recipe } from "@/models/recipe";
import { InventoryItem } from "@/models/inventory";


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

    const costMap = new Map<string, number>();
    for (const item of inventoryItems) {
      if (!item.name) continue;
      costMap.set(item.name.toLowerCase(), item.unitCost || 0);
    }

    const analysis = recipes.map((recipe: any) => {
      let computedCost = 0;
      const missingIngredients: string[] = [];

      for (const ing of recipe.ingredients || []) {
        const name = (ing.name || "").trim();
        if (!name) continue;

        const key = name.toLowerCase();

        const inventoryUnitCost = costMap.get(key);
        const qty = ing.quantity || 0;

        if (inventoryUnitCost == null) {
          missingIngredients.push(name);
          continue;
        }

        computedCost += inventoryUnitCost * qty;
      }

      const menuPrice: number = recipe.menuPrice ?? 0;
      const marginAmount = menuPrice - computedCost;
      const marginPct =
        menuPrice > 0 ? (marginAmount / menuPrice) * 100 : null;

      return {
        recipeId: String(recipe._id),
        name: recipe.name,
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
