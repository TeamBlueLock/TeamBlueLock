import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { InventoryItem } from "@/models/inventory";
import { auth } from "@/lib/auth";
import { Types } from 'mongoose';
import { convertToBase } from '@/lib/unitConversion';
import { UNITS } from '@/lib/units';


/**
 * Handles a GET request to retrieve a specific inventory item.
 *
 * This endpoint validates the current user session, extracts the inventory item
 * ID from the route parameters, connects to the database, and retrieves the
 * matching inventory item that belongs to the authenticated user. If the item
 * does not exist or does not belong to the current user, the endpoint returns
 * a not found response.
 *
 * @returns A JSON response containing the requested inventory item on success,
 * or an error message if the user is unauthorized, the item is not found, or
 * the request fails.
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
 *     "reorderPoint": 2
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Item not found"
 * }
 */


// GET a specific inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const item = await InventoryItem.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a PUT request to fully update a specific inventory item.
 *
 * This endpoint validates the current user session, reads the inventory item ID
 * from the route parameters, parses the request body, validates the provided
 * unit, recalculates the base unit and cost per base unit, and replaces the
 * editable fields of the matching inventory item. The update only succeeds if
 * the item belongs to the authenticated user.
 *
 * @returns A JSON response containing the updated inventory item on success,
 * or an error message if the user is unauthorized, the unit is invalid, the
 * item is not found, or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "661f2b8e1234567890abcd12",
 *     "name": "Sugar",
 *     "unit": "kg",
 *     "unitCost": 8,
 *     "inStock": 15,
 *     "reorderPoint": 3,
 *     "baseUnit": "g",
 *     "costPerBaseUnit": 0.008,
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


// PUT - Full update of inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = await request.json();
    await connectToDatabase();

        // Validate unit
    const unitDefinition = UNITS[body.unit];
    if (!unitDefinition) {
      return NextResponse.json(
        { success: false, error: "Invalid unit" },
        { status: 400 }
      );
    }

    // Compute baseUnit and costPerBaseUnit
    const { baseAmount, baseUnit } = convertToBase(1, body.unit);
    const costPerBaseUnit = baseAmount > 0 ? (body.unitCost ?? 0) / baseAmount : 0;

    // Find and update the item
    const item = await InventoryItem.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id, // Ensure user owns this item
      },
      {
        name: body.name,
        unit: body.unit,
        unitCost: body.unitCost ?? 0,
        inStock: body.inStock ?? 0,
        reorderPoint: body.reorderPoint ?? 0,
        baseUnit,
        costPerBaseUnit,
        customFields: body.customFields || {},
        },
      {
        new: true, // Return the updated document
        runValidators: true, // Run model validations
      }
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("PUT /api/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}


/**
 * Handles a PATCH request to partially update a specific inventory item.
 *
 * This endpoint validates the current user session, reads the inventory item ID
 * from the route parameters, and updates only the fields provided in the request
 * body. If the unit is updated, the endpoint also validates the new unit and
 * recalculates the base unit and cost per base unit. This is useful for quick
 * edits such as adjusting stock quantity, cost, or selected custom fields
 * without replacing the entire inventory item record.
 *
 * @returns A JSON response containing the updated inventory item on success,
 * or an error message if the user is unauthorized, the unit is invalid, the
 * item is not found, or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "661f2b8e1234567890abcd12",
 *     "name": "Flour",
 *     "inStock": 20,
 *     "unitCost": 5.25
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Item not found or unauthorized"
 * }
 */


// PATCH - Partial update (for quick quantity/cost updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = await request.json();
    await connectToDatabase();

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.unitCost !== undefined) updateData.unitCost = body.unitCost;
    if (body.inStock !== undefined) updateData.inStock = body.inStock;
    if (body.reorderPoint !== undefined) updateData.reorderPoint = body.reorderPoint;

    if (body.customFields !== undefined) {
        updateData.customFields = body.customFields;
    }

    if (body.gramsPerPiece !== undefined)
      updateData.gramsPerPiece = body.gramsPerPiece;

    if (body.gramsPerMl !== undefined)
      updateData.gramsPerMl = body.gramsPerMl;

    if (body.mlPerPiece !== undefined)
      updateData.mlPerPiece = body.mlPerPiece;

    if (body.unit !== undefined) {
      const unitDefinition = UNITS[body.unit];
      if (!unitDefinition) {
        return NextResponse.json(
          { success: false, error: "Invalid unit" },
          { status: 400 }
        );
      }

      const { baseAmount, baseUnit } = convertToBase(1, body.unit);

      updateData.baseUnit = baseUnit;

      const cost = body.unitCost ?? 0;
      updateData.costPerBaseUnit =
        baseAmount > 0 ? cost / baseAmount : 0;
    }



    // Find and update the item
    const item = await InventoryItem.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id, // Ensure user owns this item
      },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run model validations
      }
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("PATCH /api/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handles a DELETE request to remove a specific inventory item.
 *
 * This endpoint validates the current user session, reads the inventory item ID
 * from the route parameters, connects to the database, and deletes the matching
 * inventory item only if it belongs to the authenticated user. If no matching
 * item is found, the endpoint returns a not found response.
 *
 * @returns A JSON response confirming successful deletion, or an error message
 * if the user is unauthorized, the item is not found, or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "message": "Item deleted successfully"
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Item not found or unauthorized"
 * }
 */


// DELETE - Remove inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const result = await InventoryItem.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Item not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Item deleted successfully" 
    });
  } catch (error: any) {
    console.error("DELETE /api/inventory/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}