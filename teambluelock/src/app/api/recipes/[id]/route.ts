import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Recipe } from "@/models/recipe";
import { auth } from "@/lib/auth";

type RouteParamsPromise = {
  params: Promise<{ id: string }>;
};

// GET one recipe (for edit page)
export async function GET(request: NextRequest, { params }: RouteParamsPromise) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;          // 👈 unwrap the Promise

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

// UPDATE recipe – only if it belongs to this user
export async function PUT(request: NextRequest, { params }: RouteParamsPromise) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;          // 👈 unwrap
    await connectToDatabase();
    const body = await request.json();

    const updated = await Recipe.findOneAndUpdate(
      { _id: id, userId: session.user.id }, // ownership check
      {
        name: body.name,
        description: body.description,
        category: body.category,
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

// DELETE recipe – only if it belongs to this user
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

    const { id } = await params;          // 👈 unwrap
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
