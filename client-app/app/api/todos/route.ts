import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/todos - Get all todos
export async function GET() {
  try {
    const todos = await db.todos.findAll();
    return NextResponse.json(todos);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    // Add delay to visualize optimistic updates (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check for error simulation header
    const simulateError = request.headers.get("x-simulate-error") === "true";
    if (simulateError) {
      return NextResponse.json({ error: "Simulated error: Server rejected the request" }, { status: 500 });
    }

    const body = await request.json();
    const { title, userId, categoryId } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newTodo = await db.todos.create({
      title,
      completed: false,
      userId,
      categoryId,
    });

    return NextResponse.json(newTodo, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
