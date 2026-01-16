import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { auth } from "@/lib/auth";
import { ColumnDefinition } from "@/models/columnDefinition";
import { InventoryItem } from "@/models/inventory";

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

