import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await db.users.findAll();
    return NextResponse.json(users);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
