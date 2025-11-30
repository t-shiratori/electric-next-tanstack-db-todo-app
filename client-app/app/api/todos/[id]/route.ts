import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PUT /api/todos/[id] - Todoを更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Optimistic Updatesを可視化するための遅延（1.5秒）
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // エラーシミュレーションヘッダーをチェック
    const simulateError = request.headers.get("x-simulate-error") === "true";
    if (simulateError) {
      return NextResponse.json({ error: "Simulated error: Server rejected the update" }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = await db.todos.update(id, body);

    if (!result) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ ...result.todo, txid: result.txid });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

// DELETE /api/todos/[id] - Todoを削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Optimistic Updatesを可視化するための遅延（1.5秒）
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // エラーシミュレーションヘッダーをチェック
    const simulateError = request.headers.get("x-simulate-error") === "true";
    if (simulateError) {
      return NextResponse.json({ error: "Simulated error: Server rejected the delete" }, { status: 500 });
    }

    const { id } = await params;
    const { success, txid } = await db.todos.delete(id);

    if (!success) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, txid });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
