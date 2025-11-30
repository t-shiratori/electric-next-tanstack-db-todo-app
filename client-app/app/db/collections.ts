"use client";

import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { createCollection } from "@tanstack/react-db";
import { errorSimulation } from "@/lib/errorSimulation";
import { notification } from "@/lib/notification";
import type { Category } from "@/types/category";
import type { Todo } from "@/types/todo";
import type { User } from "@/types/user";

// Electric SQL設定
// PostgreSQLからデータを複製するElectric同期サービスに接続
const ELECTRIC_URL = process.env.NEXT_PUBLIC_ELECTRIC_URL || "http://localhost:3000";

const electric = {
  url: ELECTRIC_URL,
};

// TanStack DB Collection と Electric SQL
// Electric SQLとTanStack DBの統合デモ:
// 1. Electric Collection - ElectricサービスからPostgreSQLデータを同期
// 2. Live Queries - コレクション間のリアクティブクエリ
// 3. Optimistic Mutations - サーバー同期による即座のUI更新
// 4. Real-time sync - データベース変更の自動更新

// Electric SQLによるTodoコレクション
// ElectricはPostgreSQLからリアルタイムでデータを自動同期
// 書き込み操作（insert/update/delete）はOptimistic UpdatesとともにREST APIを使用
export const todoCollection = createCollection(
  electricCollectionOptions<Todo>({
    // Electric同期のShapeオプション
    shapeOptions: {
      url: `${electric.url}/v1/shape`,
      params: {
        table: "todos",
      },
    },

    // 各アイテムの一意なキーを取得（追跡に必要）
    getKey: (item) => item.id,

    // アイテムが変更されたときの更新処理
    // この関数はcollection.update()が呼ばれたときに実行される
    // Electricが変更を同期したことを確認するためにtxidを返す
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { original, modified } = mutation;
      // バックエンドAPIに更新を送信
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
        body: JSON.stringify(modified),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to update todo";
        notification.error(`Update failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Electric Collectionが同期を待つためにtxidを返す
      return { txid: data.txid };
    },

    // アイテムが削除されたときの削除処理
    // Electricが変更を同期したことを確認するためにtxidを返す
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { original } = mutation;
      // バックエンドAPIに削除を送信
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "DELETE",
        headers: {
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to delete todo";
        notification.error(`Delete failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Electric Collectionが同期を待つためにtxidを返す
      return { txid: data.txid };
    },

    // 新しいアイテムが追加されたときの挿入処理
    // Electricが変更を同期したことを確認するためにtxidを返す
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { modified } = mutation;

      // バックエンドAPIに作成を送信
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
        body: JSON.stringify({
          title: modified.title,
          completed: modified.completed,
          userId: modified.userId || null,
          categoryId: modified.categoryId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create todo";
        notification.error(`Create failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Electric Collectionが同期を待つためにtxidを返す
      // Electricがデータベースから新しいアイテムを自動的に同期する
      return {
        txid: data.txid,
      };
    },
  }),
);

// Electric SQLによるUserコレクション
export const userCollection = createCollection(
  electricCollectionOptions<User>({
    shapeOptions: {
      url: `${electric.url}/v1/shape`,
      params: {
        table: "users",
      },
    },
    getKey: (item) => item.id,
  }),
);

// Electric SQLによるCategoryコレクション
export const categoryCollection = createCollection(
  electricCollectionOptions<Category>({
    shapeOptions: {
      url: `${electric.url}/v1/shape`,
      params: {
        table: "categories",
      },
    },
    getKey: (item) => item.id,
  }),
);
