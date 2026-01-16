import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { auth } from "@/lib/auth"
import { ColumnDefinition } from '@/models/columnDefinition';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const columns = await ColumnDefinition
    .find({ userId: session.user.id })
    .sort({ order: 1 });

  return NextResponse.json({ success: true, data: columns });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectToDatabase();

  const column = await ColumnDefinition.create({
    userId: session.user.id,
    key: body.key,       // "expirationDate"
    label: body.label,   // "Expiration Date"
    type: body.type,     // "date"
    visible: true,
    order: body.order ?? 0,
  });

  return NextResponse.json({ success: true, data: column });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectToDatabase();

  await ColumnDefinition.findOneAndUpdate(
    { userId: session.user.id, key: body.key },
    {
      visible: body.visible,
      order: body.order,
    }
  );

  return NextResponse.json({ success: true });
}
