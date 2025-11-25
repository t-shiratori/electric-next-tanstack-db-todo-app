"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorSimulationProvider } from "./contexts/ErrorSimulationContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Dynamically import components to ensure they only run on client side
const AddTodoForm = dynamic(
  () =>
    import("./components/AddTodoForm").then((mod) => ({
      default: mod.AddTodoForm,
    })),
  {
    ssr: false,
    loading: () => <div className="text-center py-4 text-gray-500">フォームを読み込み中...</div>,
  },
);

const TodoList = dynamic(() => import("./components/TodoList").then((mod) => ({ default: mod.TodoList })), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-gray-500">Todoを読み込み中...</div>,
});

const ErrorSimulationToggle = dynamic(
  () =>
    import("./components/ErrorSimulationToggle").then((mod) => ({
      default: mod.ErrorSimulationToggle,
    })),
  {
    ssr: false,
  },
);

const ToastContainer = dynamic(
  () =>
    import("./components/ToastContainer").then((mod) => ({
      default: mod.ToastContainer,
    })),
  {
    ssr: false,
  },
);

const TodosWithUserAndCategory = dynamic(
  () =>
    import("./components/TodosWithUserAndCategory").then((mod) => ({
      default: mod.TodosWithUserAndCategory,
    })),
  {
    ssr: false,
    loading: () => <div className="text-center py-8 text-gray-500">JOIN例を読み込み中...</div>,
  },
);

export default function Home() {
  return (
    <NotificationProvider>
      <ErrorSimulationProvider>
        <ToastContainer />
        <main className="min-h-screen py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Navigation */}
            <div className="mb-6 flex justify-end">
              <Link
                href="/pessimistic"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                悲観的更新版を見る →
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">TanStack DB Sample</h1>
              <p className="text-gray-600">TanStack DBの3つの柱を実演するシンプルなTodoアプリ</p>
              <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  コレクション
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  ライブクエリ
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  楽観的更新
                </div>
              </div>
            </div>

            {/* Error Simulation Toggle */}
            <ErrorSimulationToggle />

            {/* Main content */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <Suspense fallback={<div className="text-center py-4 text-gray-500">読み込み中...</div>}>
                <AddTodoForm />
                <TodoList />
              </Suspense>
            </div>

            {/* Info section */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="font-semibold text-blue-900 mb-2">学習ポイント:</h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>コレクション:</strong> 自動同期を備えた型安全なデータストレージ (app/db/collections.ts
                  を参照)
                </li>
                <li>
                  • <strong>ライブクエリ:</strong> フィルタリングとソートを備えたリアクティブクエリ (TodoList.tsx
                  を参照)
                </li>
                <li>
                  • <strong>楽観的更新:</strong> バックグラウンド同期による即座のUI更新 (TodoItem.tsx を参照)
                </li>
                <li>
                  • <strong>エラーハンドリング:</strong>{" "}
                  エラーシミュレーションモードを有効にして、サーバーエラー時に楽観的更新が自動的にロールバックされる様子を確認
                </li>
              </ul>
            </div>

            {/* JOIN Examples section */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
              <Suspense fallback={<div className="text-center py-8 text-gray-500">JOIN例を読み込み中...</div>}>
                <TodosWithUserAndCategory />
              </Suspense>
            </div>
          </div>
        </main>
      </ErrorSimulationProvider>
    </NotificationProvider>
  );
}
