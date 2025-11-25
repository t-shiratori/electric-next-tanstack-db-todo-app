"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorSimulationProvider } from "../contexts/ErrorSimulationContext";
import { NotificationProvider } from "../contexts/NotificationContext";

// Dynamically import components to ensure they only run on client side
const PessimisticAddTodoForm = dynamic(
  () =>
    import("../components/PessimisticAddTodoForm").then((mod) => ({
      default: mod.PessimisticAddTodoForm,
    })),
  {
    ssr: false,
    loading: () => <div className="text-center py-4 text-gray-500">フォームを読み込み中...</div>,
  },
);

const PessimisticTodoList = dynamic(
  () =>
    import("../components/PessimisticTodoList").then((mod) => ({
      default: mod.PessimisticTodoList,
    })),
  {
    ssr: false,
    loading: () => <div className="text-center py-8 text-gray-500">Todoを読み込み中...</div>,
  },
);

const ErrorSimulationToggle = dynamic(
  () =>
    import("../components/ErrorSimulationToggle").then((mod) => ({
      default: mod.ErrorSimulationToggle,
    })),
  {
    ssr: false,
  },
);

const ToastContainer = dynamic(
  () =>
    import("../components/ToastContainer").then((mod) => ({
      default: mod.ToastContainer,
    })),
  {
    ssr: false,
  },
);

export default function PessimisticPage() {
  return (
    <NotificationProvider>
      <ErrorSimulationProvider>
        <ToastContainer />
        <main className="min-h-screen py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Navigation */}
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                ← 楽観的更新版に戻る
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">TanStack DB Sample - 悲観的更新版</h1>
              <p className="text-gray-600">サーバー確認後にUIが更新される従来型のアプローチ</p>
              <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  コレクション
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  ライブクエリ
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  悲観的更新
                </div>
              </div>
            </div>

            {/* Error Simulation Toggle */}
            <ErrorSimulationToggle />

            {/* Main content */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <Suspense fallback={<div className="text-center py-4 text-gray-500">読み込み中...</div>}>
                <PessimisticAddTodoForm />
                <PessimisticTodoList />
              </Suspense>
            </div>

            {/* Info section */}
            <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
              <h2 className="font-semibold text-orange-900 mb-2">悲観的更新について:</h2>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>
                  • <strong>サーバー確認待ち:</strong> すべての操作でサーバーレスポンスを待ってからUIが更新されます
                </li>
                <li>
                  • <strong>実装方法:</strong> <code className="bg-orange-100 px-1 rounded">optimistic: false</code>{" "}
                  オプションを使用
                </li>
                <li>
                  • <strong>体感:</strong> 操作後、約1.5秒の遅延を感じます（サーバー処理時間）
                </li>
                <li>
                  • <strong>比較:</strong>{" "}
                  <Link href="/" className="text-orange-900 underline hover:text-orange-700">
                    楽観的更新版
                  </Link>
                  と操作感を比較してみてください
                </li>
              </ul>
            </div>

            {/* Comparison section */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">楽観的更新 vs 悲観的更新</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-purple-50 rounded border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">楽観的更新 ⚡</h3>
                  <ul className="text-purple-800 space-y-1">
                    <li>✓ 即座にUI更新</li>
                    <li>✓ UXが良い</li>
                    <li>✓ エラー時ロールバック</li>
                    <li>✗ 実装が複雑</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">悲観的更新 🐢</h3>
                  <ul className="text-orange-800 space-y-1">
                    <li>✓ 実装がシンプル</li>
                    <li>✓ データ整合性が保証</li>
                    <li>✗ UI更新が遅い</li>
                    <li>✗ UXが悪い</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ErrorSimulationProvider>
    </NotificationProvider>
  );
}
