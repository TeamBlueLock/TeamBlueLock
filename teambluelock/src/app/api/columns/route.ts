import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { auth } from "@/lib/auth"
import { ColumnDefinition } from '@/models/columnDefinition';


/**
 * Handles a GET request to retrieve column definitions for the authenticated user.
 *
 * This endpoint validates the current user session, connects to the database,
 * and retrieves all column definitions associated with the authenticated user.
 * The results are sorted by the `order` field to maintain the correct display
 * order of columns in the user interface.
 *
 * @returns A JSON response containing a list of column definitions on success,
 * or an error message if the user is unauthorized or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "key": "expirationDate",
 *       "label": "Expiration Date",
 *       "type": "date",
 *       "visible": true,
 *       "order": 1
 *     }
 *   ]
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "error": "Unauthorized"
 * }
 */

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const columns = await ColumnDefinition
    .find({ userId: session.user.id })
    .sort({ order: 1 });

  return NextResponse.json({ success: true, data: columns });
}

/**
 * Handles a POST request to create a new column definition.
 *
 * This endpoint validates the current user session, reads column definition
 * data from the request body, and creates a new column configuration for the
 * authenticated user. Each column includes a unique key, display label, data
 * type, visibility flag, and order index for UI rendering.
 *
 * @returns A JSON response containing the newly created column definition on success,
 * or an error message if the user is unauthorized or the request fails.
 *
 * @example
 * // Example successful response:
 * {
 *   "success": true,
 *   "data": {
 *     "key": "expirationDate",
 *     "label": "Expiration Date",
 *     "type": "date",
 *     "visible": true,
 *     "order": 2
 *   }
 * }
 *
 * @example
 * // Example error response:
 * {
 *   "error": "Unauthorized"
 * }
 */


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

/**
 * Handles a PATCH request to update an existing column definition.
 *
 * This endpoint validates the current user session, reads update data from the
 * request body, and modifies an existing column definition identified by its key.
 * It allows updating visibility and ordering of columns without recreating them.
 *
 * @returns A JSON response confirming the update on success,
 * or an error message if the user is unauthorized or the request fails.
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
 *   "error": "Unauthorized"
 * }
 */

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
