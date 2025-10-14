export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongo";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.command({ ping: 1 });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}