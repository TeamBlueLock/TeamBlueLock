import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { auth } from "@/lib/auth";
import { ColumnDefinition } from "@/models/columnDefinition";
import { InventoryItem } from "@/models/inventory";


/**
 * Handles a DELETE request to remove a specific custom column definition.
 *
 * This endpoint validates the current user session, extracts the column key
 * from the route parameters, and deletes the matching column definition that
 * belongs to the authenticated user. After the column definition is removed,
 * the endpoint also removes the corresponding custom field from all inventory
 * items owned by the same user to keep stored inventory data consistent with
 * the updated column configuration.
 *
 * @returns A JSON response confirming successful deletion on success,
 * or an error message if the user is unauthorized, the column is not found,
 * or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "success": false,
 *   "error": "Column not found"
 * }
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { key } = await params;

    // Delete column definition
    const deleted = await ColumnDefinition.findOneAndDelete({
      key,
      userId: session.user.id,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Column not found" },
        { status: 404 }
      );
    }

    // Remove the field from inventory items
    await InventoryItem.updateMany(
      { userId: session.user.id },
      {
        $unset: {
          [`customFields.${key}`]: "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/columns/[key] error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

