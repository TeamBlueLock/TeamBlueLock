import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { InventoryItem } from "@/models/inventory";
import { auth } from "@/lib/auth"
import { convertToBase } from "@/lib/unitConversion";
import { UNITS } from "@/lib/units";


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