import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Recipe } from '@/models/recipe';

/**
* Creates a new recipe in the database
*
* This endpoint accepts complete recipe data including name, description, 
* ingredients with costs, instructions, and financial calculations. 
* It creates a new recipe document with embedded ingredient data and 
* automatically calculated timestamps.
*
* @param {NextRequest} request - The incoming request containing recipe data in JSON format
* @returns {Promise<NextResponse>} Returns the created recipe object or an error message
*
* @example
* // Request body:
* {
*   "name": "Chocolate Chip Cookies",
*   "description": "Classic homemade chocolate chip cookies",
*   "ingredients": [
*     {
*       "name": "Flour",
*       "quantity": 2.5,
*       "unit": "cups",
*       "cost": 1.50
*     },
*     {
*       "name": "Chocolate Chips",
*       "quantity": 2,
*       "unit": "cups",
*       "cost": 3.00
*     }
*   ],
*   "instructions": [
*     "Preheat oven to 375°F",
*     "Mix dry ingredients",
*     "Cream butter and sugar"
*   ],
*   "totalCost": 4.50,
*   "menuPrice": 12.00,
*   "grossMargin": 62.5
* }
*
* @example
* // Success response (201):
* {
*   "success": true,
*   "data": {
*     "_id": "507f1f77bcf86cd799439012",
*     "name": "Chocolate Chip Cookies",
*     "description": "Classic homemade chocolate chip cookies",
*     "ingredients": [...],
*     "instructions": [...],
*     "totalCost": 4.50,
*     "menuPrice": 12.00,
*     "grossMargin": 62.5,
*     "createdAt": "2023-10-26T10:00:00.000Z",
*     "updatedAt": "2023-10-26T10:00:00.000Z",
*     "__v": 0
*   }
* }
*
* @example
* // Error response (400):
* {
*   "success": false,
*   "error": "Recipe validation failed: name: Path `name` is required."
* }
*/
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    const recipe = await Recipe.create({
      name: body.name,
      description: body.description,
      ingredients: body.ingredients,
      instructions: body.instructions,
      totalCost: body.totalCost,
      menuPrice: body.menuPrice,
      grossMargin: body.grossMargin
    });
    
    return NextResponse.json({ success: true, data: recipe }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
* Retrieves all recipes from the database
*
* This endpoint fetches all recipe documents from the database, 
* sorted by creation date in descending order (newest first). 
* Returns complete recipe data including embedded ingredients, 
* instructions, and cost calculations.
*
* @returns {Promise<NextResponse>} Returns an array of all recipes or an error message
*
* @example
* // Success response (200):
* {
*   "success": true,
*   "data": [
*     {
*       "_id": "507f1f77bcf86cd799439012",
*       "name": "Chocolate Chip Cookies",
*       "description": "Classic homemade chocolate chip cookies",
*       "ingredients": [
*         {
*           "name": "Flour",
*           "quantity": 2.5,
*           "unit": "cups",
*           "cost": 1.50,
*           "_id": "507f1f77bcf86cd799439013"
*         }
*       ],
*       "instructions": ["Preheat oven to 375°F", ...],
*       "totalCost": 4.50,
*       "menuPrice": 12.00,
*       "grossMargin": 62.5,
*       "createdAt": "2023-10-26T10:00:00.000Z",
*       "updatedAt": "2023-10-26T10:00:00.000Z",
*       "__v": 0
*     },
*     {
*       "_id": "507f1f77bcf86cd799439014",
*       "name": "Veggie Pizza",
*       // ... other recipe fields
*     }
*   ]
* }
*
* @example
* // Error response (400):
* {
*   "success": false,
*   "error": "Database connection failed"
* }
*
* @example
* // Empty response (200):
* {
*   "success": true,
*   "data": []
* }
*/
export async function GET() {
  try {
    await connectToDatabase();
    
    const recipes = await Recipe.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: recipes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}