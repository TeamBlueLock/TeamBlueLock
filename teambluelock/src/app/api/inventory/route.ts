import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { InventoryItem } from "@/models/inventory";
import { auth } from "@/lib/auth"
import { convertToBase } from "@/lib/unitConversion";
import { UNITS } from "@/lib/units";

/**
 * Handles a POST request to create a new inventory item.
 *
 * This endpoint validates the current user session, reads the inventory item
 * data from the request body, verifies that the provided unit exists in the
 * supported unit definitions, converts the unit into its base unit form, and
 * calculates the cost per base unit. It then creates and stores a new inventory
 * item associated with the authenticated user in the database.
 *
 * @returns A JSON response containing the newly created inventory item on success,
 * or an error message if the user is unauthorized, the unit is invalid, or the
 * request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "661f2b8e1234567890abcd12",
 *     "userId": "user_123",
 *     "name": "Flour",
 *     "unit": "lb",
 *     "unitCost": 4.5,
 *     "inStock": 10,
 *     "reorderPoint": 2,
 *     "baseUnit": "oz",
 *     "costPerBaseUnit": 0.28125,
 *     "customFields": {}
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Invalid unit"
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

    const {
      name,
      unit,
      unitCost = 0,
      inStock = 0,
      reorderPoint = 0,
      customFields = {},
    } = body;

    const unitDefinition = UNITS[unit];
    if (!unitDefinition) {
      return NextResponse.json(
        { success: false, error: "Invalid unit" },
        { status: 400 }
      );
    }

    const { baseAmount, baseUnit } =
      convertToBase(1, unit);

    const costPerBaseUnit =
      baseAmount > 0 ? unitCost / baseAmount : 0;

    const item = await InventoryItem.create({
      userId: session.user.id,
      name,
      unit,
      unitCost,
      inStock,
      reorderPoint,

      baseUnit,
      costPerBaseUnit,

      customFields,
    });

    return NextResponse.json(
      { success: true, data: item },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a GET request to retrieve inventory items for the authenticated user.
 *
 * This endpoint validates the current user session, connects to the database,
 * and retrieves all inventory items associated with the authenticated user.
 * The items are sorted by creation date in descending order so that the most
 * recently added items appear first in the response.
 *
 * @returns A JSON response containing a list of inventory items for the authenticated
 * user on success, or an error message if the user is unauthorized or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "661f2b8e1234567890abcd12",
 *       "userId": "user_123",
 *       "name": "Flour",
 *       "unit": "lb",
 *       "unitCost": 4.5,
 *       "inStock": 10,
 *       "reorderPoint": 2,
 *       "baseUnit": "oz",
 *       "costPerBaseUnit": 0.28125,
 *       "customFields": {}
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

    const items = await InventoryItem.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}