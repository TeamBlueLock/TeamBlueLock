import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Supplier } from '@/models/supplier';

/**
* Creates a new supplier in the database
*
* This endpoint accepts supplier data including name, contact information, 
* and product catalog with pricing. It creates a new supplier document
* in the MongoDB database and returns the created supplier with its
* automatically generated _id and timestamps.
*
* @param {NextRequest} request - The incoming request containing supplier data in JSON format
* @returns {Promise<NextResponse>} Returns the created supplier object or an error message
*
* @example
* // Request body:
* {
*   "name": "Bulk Foods Co.",
*   "contact": {
*     "email": "orders@bulkfoods.com",
*     "phone": "555-0123",
*     "repName": "John Smith"
*   },
*   "products": [
*     {
*       "ingredient": "Flour",
*       "currentCost": 1.50,
*       "unit": "kg",
*       "minOrder": 25,
*       "leadTime": 2
*     }
*   ]
* }
*
* @example
* // Success response (201):
* {
*   "success": true,
*   "data": {
*     "_id": "507f1f77bcf86cd799439011",
*     "name": "Bulk Foods Co.",
*     "contact": {
*       "email": "orders@bulkfoods.com",
*       "phone": "555-0123",
*       "repName": "John Smith"
*     },
*     "products": [...],
*     "createdAt": "2023-10-26T10:00:00.000Z",
*     "updatedAt": "2023-10-26T10:00:00.000Z",
*     "__v": 0
*   }
* }
*
* @example
* // Error response (400):
* {
*   "success": false,
*   "error": "Supplier validation failed: name: Path `name` is required."
* }
*/
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    const supplier = await Supplier.create({
      name: body.name,
      contact: body.contact,
      products: body.products
    });
    
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}