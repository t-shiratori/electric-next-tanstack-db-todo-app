"use client";

import { useErrorSimulation } from "@/app/contexts/ErrorSimulationContext";

export function ErrorSimulationToggle() {
  const { simulateError, setSimulateError } = useErrorSimulation();

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-yellow-900 mb-1">エラーシミュレーションモード</h3>
          <p className="text-sm text-yellow-700">
            サーバーリクエスト失敗時の楽観的更新のロールバックをテストするために有効化
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={simulateError}
            onChange={(e) => setSimulateError(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
        </label>
      </div>
      {simulateError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ すべての更新、削除、作成操作が失敗します。エラー後にUIが元の状態に戻る様子を確認してください。
        </div>
      )}
    </div>
  );
}
