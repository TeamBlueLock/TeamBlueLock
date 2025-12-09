import { getDb } from "./mongo";
import { ObjectId } from "mongodb";

const COLLECTION = "recipes";

export async function getRecipesForUser(userId: string) {
  const db = await getDb();

  return db
    .collection(COLLECTION)
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function createRecipeForUser(
  userId: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    ingredients?: any[];
    sellingPrice?: number;
  }
) {
  const db = await getDb();
  const now = new Date();

  const doc = {
    userId,
    name: data.name,
    description: data.description ?? "",
    category: data.category ?? "",
    ingredients: data.ingredients ?? [],
    sellingPrice: data.sellingPrice ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateRecipeForUser(
  userId: string,
  recipeId: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    ingredients: any[];
    sellingPrice: number;
  }>
) {
  const db = await getDb();

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(recipeId), userId },
    { $set: { ...data, updatedAt: new Date() } }
  );
}

export async function deleteRecipeForUser(userId: string, recipeId: string) {
  const db = await getDb();

  await db.collection(COLLECTION).deleteOne({
    _id: new ObjectId(recipeId),
    userId,
  });
}
