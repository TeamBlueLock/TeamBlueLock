import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Recipe } from "@/models/recipe";
import { auth } from "@/lib/auth";

/**
 * Represents the asynchronous route parameters used by dynamic recipe API routes.
 *
 * This type defines the structure of the `params` object provided by Next.js
 * for routes that include a dynamic recipe ID segment.
 */

type RouteParamsPromise = {
  params: Promise<{ id: string }>;
};

/**
 * Handles a GET request to retrieve a specific recipe.
 *
 * This endpoint validates the current user session, extracts the recipe ID
 * from the route parameters, connects to the database, and retrieves the
 * matching recipe that belongs to the authenticated user. It is primarily
 * used when loading a single recipe for viewing or editing. If the recipe
 * does not exist or does not belong to the current user, the endpoint
 * returns a not found response.
 *
 * @returns A JSON response containing the requested recipe on success,
 * or an error message if the user is unauthorized, the recipe is not found,
 * or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439012",
 *     "userId": "user_123",
 *     "name": "Chocolate Chip Cookies",
 *     "description": "Classic homemade cookies",
 *     "category": "Dessert",
 *     "subCategory": "Cookies",
 *     "yield": 24,
 *     "ingredients": [
 *       {
 *         "name": "Flour",
 *         "quantity": 2.5,
 *         "unit": "cups"
 *       }
 *     ],
 *     "instructions": [
 *       "Preheat oven to 375°F",
 *       "Mix ingredients"
 *     ],
 *     "totalCost": 4.5,
 *     "menuPrice": 12,
 *     "grossMargin": 62.5
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Recipe not found"
 * }
 */


export async function GET(request: NextRequest, { params }: RouteParamsPromise) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await connectToDatabase();

    const recipe = await Recipe.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: recipe });
  } catch (error: any) {
    console.error("GET /api/recipes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a PUT request to update a specific recipe.
 *
 * This endpoint validates the current user session, extracts the recipe ID
 * from the route parameters, reads the updated recipe data from the request
 * body, and updates the matching recipe only if it belongs to the authenticated
 * user. The endpoint replaces the editable recipe fields such as name,
 * description, category, yield, ingredients, instructions, and pricing data.
 *
 * @returns A JSON response containing the updated recipe on success,
 * or an error message if the user is unauthorized, the recipe is not found,
 * or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439012",
 *     "name": "Updated Cookie Recipe",
 *     "description": "Revised chocolate chip cookie recipe",
 *     "category": "Dessert",
 *     "subCategory": "Cookies",
 *     "yield": 30,
 *     "ingredients": [],
 *     "instructions": [],
 *     "totalCost": 5.25,
 *     "menuPrice": 13,
 *     "grossMargin": 59.6
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Recipe not found"
 * }
 */

export async function PUT(request: NextRequest, { params }: RouteParamsPromise) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;          
    await connectToDatabase();
    const body = await request.json();

    const updated = await Recipe.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        name: body.name,
        description: body.description,
        category: body.category,
        subCategory: body.subCategory,
        yield: body.yield,
        ingredients: body.ingredients,
        instructions: body.instructions,
        totalCost: body.totalCost,
        menuPrice: body.menuPrice,
        grossMargin: body.grossMargin,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/recipes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a DELETE request to remove a specific recipe.
 *
 * This endpoint validates the current user session, extracts the recipe ID
 * from the route parameters, connects to the database, and deletes the
 * matching recipe only if it belongs to the authenticated user. If no matching
 * recipe is found, the endpoint returns a not found response.
 *
 * @returns A JSON response containing the deleted recipe on success,
 * or an error message if the user is unauthorized, the recipe is not found,
 * or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439012",
 *     "name": "Chocolate Chip Cookies"
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Recipe not found"
 * }
 */

export async function DELETE(
  request: NextRequest,
  { params }: RouteParamsPromise
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;          
    await connectToDatabase();

    const deleted = await Recipe.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("DELETE /api/recipes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
