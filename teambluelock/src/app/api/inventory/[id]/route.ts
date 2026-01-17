import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { InventoryItem } from "@/models/inventory";
import { auth } from "@/lib/auth";
import { Types } from 'mongoose';

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
        category: body.category,
        subCategory: body.subCategory,
        supplier: body.supplier,
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