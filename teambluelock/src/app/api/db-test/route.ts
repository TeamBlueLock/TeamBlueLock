export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongo";

/**
 * Handles a GET request to verify database connectivity.
 *
 * This endpoint attempts to connect to the database and perform a simple `ping`
 * command to confirm that the connection is active. If the ping succeeds,
 * it returns a JSON response with `{ ok: true, result }`.  
 * If the operation fails, it returns `{ ok: false, error }` with a 500 status.
 *
 * @returns A JSON response indicating whether the database connection is healthy.
 *
 * @example
 * // Example successful response:
 * {
 *   "ok": true,
 *   "result": { "ok": 1 }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "ok": false,
 *   "error": "Failed to connect to database"
 * }
 */
export async function GET() {
  try {
    const db = await getDb();
    const result = await db.command({ ping: 1 });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}