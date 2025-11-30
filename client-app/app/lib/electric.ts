"use client";

// Electric SQL設定
// PostgreSQLからデータを複製するElectric同期サービスに接続

const ELECTRIC_URL = process.env.NEXT_PUBLIC_ELECTRIC_URL || "http://localhost:3000";

export const electric = {
  url: ELECTRIC_URL,
};
