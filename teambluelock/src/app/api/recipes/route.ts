import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Recipe } from '@/models/recipe';
import { auth } from '@/lib/auth'

/**
 * Handles a POST request to create a new recipe.
 *
 * This endpoint validates the current user session, reads recipe data from the
 * request body, and creates a new recipe associated with the authenticated user.
 * The recipe includes general details such as name, description, category,
 * subcategory, yield, ingredients, instructions, and pricing fields. If some
 * optional financial fields are missing, default values are used.
 *
 * @returns A JSON response containing the newly created recipe on success,
 * or an error message if the user is unauthorized or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "507f1f77bcf86cd799439012",
 *     "userId": "user_123",
 *     "name": "Chocolate Chip Cookies",
 *     "description": "Classic homemade chocolate chip cookies",
 *     "category": "Dessert",
 *     "subCategory": "Cookies",
 *     "yield": 24,
 *     "ingredients": [
 *       {
 *         "name": "Flour",
 *         "quantity": 2.5,
 *         "unit": "cups",
 *         "cost": 1.5
 *       }
 *     ],
 *     "instructions": [
 *       "Preheat oven to 375°F",
 *       "Mix dry ingredients"
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
 *   "error": "Unauthorized"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const body = await request.json();

    const recipe = await Recipe.create({
      userId: session.user.id,
      name: body.name,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory,
      yield: body.yield,
      ingredients: body.ingredients || [],
      instructions: body.instructions || [],
      // For now we let totalCost be 0 – profit analysis will recompute from inventory later.
      totalCost: body.totalCost ?? 0,
      menuPrice: body.menuPrice ?? 0,
      grossMargin: body.grossMargin ?? 0,
    });

    return NextResponse.json({ success: true, data: recipe }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/recipes error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a GET request to retrieve all recipes for the authenticated user.
 *
 * This endpoint validates the current user session, connects to the database,
 * and retrieves all recipes associated with the authenticated user. The recipes
 * are sorted by creation date in descending order so that the most recently
 * created recipes appear first in the response.
 *
 * @returns A JSON response containing a list of recipes for the authenticated
 * user on success, or an error message if the user is unauthorized or the
 * request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "507f1f77bcf86cd799439012",
 *       "userId": "user_123",
 *       "name": "Chocolate Chip Cookies",
 *       "description": "Classic homemade chocolate chip cookies",
 *       "ingredients": [
 *         {
 *           "name": "Flour",
 *           "quantity": 2.5,
 *           "unit": "cups",
 *           "cost": 1.5
 *         }
 *       ],
 *       "instructions": ["Preheat oven to 375°F"],
 *       "totalCost": 4.5,
 *       "menuPrice": 12,
 *       "grossMargin": 62.5
 *     }
 *   ]
 * }
 *
 * @example
 * // Example empty response:
 * {
 *   "success": true,
 *   "data": []
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

    const recipes = await Recipe.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ success: true, data: recipes });
  } catch (error: any) {
    console.error("GET /api/recipes error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}