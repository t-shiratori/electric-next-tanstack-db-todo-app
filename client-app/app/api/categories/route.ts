import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await db.categories.findAll();
    return NextResponse.json(categories);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
