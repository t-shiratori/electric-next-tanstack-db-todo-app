# TanStack DB Sample - Todo App

TanStack DBの主要機能を学習するためのシンプルなTodoアプリケーションです。

<img width="700" alt="screencapture-localhost-3000-2025-11-02-20_29_16" src="https://github.com/user-attachments/assets/48aa2c5f-461e-4dc9-971c-12df8a78e370" />


## TanStack DBの3つの柱

このサンプルアプリでは、TanStack DBの核となる3つの機能を実装しています:

### 1. Collections (コレクション)
型付けされたデータセットで、自動的にサーバーと同期します。

**実装箇所**: [app/db/collections.ts](app/db/collections.ts)

```typescript
export const todoCollection = createCollection(
  queryCollectionOptions<Todo>({
    queryKey: ['todos'],
    queryFn: async () => { /* データ取得 */ },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => { /* 更新処理 */ },
    onDelete: async ({ transaction }) => { /* 削除処理 */ },
    onInsert: async ({ transaction }) => { /* 作成処理 */ },
  })
)
```

### 2. Live Queries (ライブクエリ)
リアクティブなクエリで、コレクションの変更を自動的に検知してUIを更新します。

**実装箇所**: [app/components/TodoList.tsx](app/components/TodoList.tsx)

```typescript
const { data: todos } = useLiveQuery((q) =>
  q.from({ todo: todoCollection })
   .where(({ todo }) => eq(todo.completed, false))
   .orderBy(({ todo }) => todo.createdAt, 'desc')
)
```

**コレクション間JOIN**: [app/components/TodosWithUserAndCategory.tsx](app/components/TodosWithUserAndCategory.tsx)

```typescript
// INNER JOIN の例
const { data: todosWithUsers } = useLiveQuery((query) =>
  query
    .from({ t: todoCollection })
    .innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
    .select(({ t, u }) => ({
      id: t.id,
      title: t.title,
      userName: u.name,
      userAvatar: u.avatar,
    }))
    .orderBy(({ t }) => t.createdAt, 'desc')
)
```

### 3. Optimistic Mutations (楽観的更新)
UIを即座に更新し、バックグラウンドでサーバーと同期します。エラー時は自動的にロールバックされます。

**実装箇所**: [app/components/TodoItem.tsx](app/components/TodoItem.tsx)

```typescript
// 楽観的更新（デフォルト）- 即座にUI更新
const handleToggle = () => {
  todoCollection.update(todo.id, (draft) => {
    draft.completed = !draft.completed
  })
}
```

**悲観的更新版との比較**: [app/pessimistic/page.tsx](app/pessimistic/page.tsx)

```typescript
// 悲観的更新 - サーバー確認まで待機
const handleToggle = async () => {
  const tx = todoCollection.update(
    todo.id,
    { optimistic: false }, // ← 楽観的更新をオフ
    (draft) => {
      draft.completed = !draft.completed
    }
  )
  await tx.isPersisted.promise // サーバー完了まで待つ
}
```

このサンプルでは、**2つのバージョン**を用意しており、体感の違いを比較できます：
- **楽観的更新版** (`/`) - 即座にUI更新 ⚡
- **悲観的更新版** (`/pessimistic`) - サーバー確認後にUI更新 🐢

## 技術スタック

- **Next.js 16.0.0** - App Router使用
- **React 19.0.0** - 最新のReact機能
- **TypeScript 5.7.2** - 型安全性
- **TanStack DB** - リアクティブなクライアントストア
  - `@tanstack/react-db` 0.1.38 - React統合
  - `@tanstack/query-db-collection` 0.2.39 - TanStack Query連携
- **TanStack Query** - データフェッチング
- **Tailwind CSS** - スタイリング
- **Biome** - リンター・フォーマッター

## セットアップ

### 前提条件

- [mise](https://mise.jdx.dev/) がインストールされていること

### 1. Node.jsのセットアップ

このプロジェクトはNode.js v22.21.0を使用します。miseを使って自動的にインストールされます。

```bash
mise install
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで以下のURLを開いてください：
- **楽観的更新版**: [http://localhost:3000](http://localhost:3000)
- **悲観的更新版**: [http://localhost:3000/pessimistic](http://localhost:3000/pessimistic)

### その他のコマンド

```bash
# ビルド
pnpm build

# 本番サーバー起動
pnpm start

# Biome チェック
pnpm biome:check

# Biome 自動修正
pnpm biome:fix
```

## プロジェクト構造

```
tanstack-db/
├── app/
│   ├── api/
│   │   ├── todos/              # Todo REST API エンドポイント
│   │   │   ├── route.ts        # GET, POST
│   │   │   └── [id]/route.ts   # PUT, DELETE
│   │   ├── users/              # User API エンドポイント
│   │   │   └── route.ts        # GET
│   │   └── categories/         # Category API エンドポイント
│   │       └── route.ts        # GET
│   ├── components/
│   │   ├── TodoList.tsx                      # ライブクエリでフィルタリング
│   │   ├── TodoItem.tsx                      # 楽観的更新（完了/削除/カテゴリ変更）
│   │   ├── AddTodoForm.tsx                   # Todo作成（カテゴリ選択可能）
│   │   ├── PessimisticTodoList.tsx           # 悲観的更新版リスト
│   │   ├── PessimisticTodoItem.tsx           # 悲観的更新版アイテム
│   │   ├── PessimisticAddTodoForm.tsx        # 悲観的更新版フォーム
│   │   ├── TodosWithUserAndCategory.tsx      # コレクション間JOIN例
│   │   ├── ErrorSimulationToggle.tsx         # エラーシミュレーション切り替え
│   │   └── ToastContainer.tsx                # 通知表示
│   ├── contexts/
│   │   ├── ErrorSimulationContext.tsx        # エラーシミュレーション状態管理
│   │   └── NotificationContext.tsx           # 通知状態管理
│   ├── db/
│   │   └── collections.ts                    # TanStack DBコレクション定義
│   ├── lib/
│   │   └── queryClient.ts                    # TanStack Query設定
│   ├── pessimistic/
│   │   └── page.tsx                          # 悲観的更新版メインページ
│   ├── layout.tsx                            # ルートレイアウト
│   ├── page.tsx                              # 楽観的更新版メインページ
│   └── globals.css                           # グローバルスタイル
├── lib/
│   ├── db.ts                   # インメモリDB (サンプル用)
│   ├── errorSimulation.ts      # エラーシミュレーション機能
│   └── notification.ts         # 通知機能
├── types/
│   ├── todo.ts                 # Todo型定義
│   ├── user.ts                 # User型定義
│   └── category.ts             # Category型定義
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## 主要機能

### 基本機能
- ✅ Todo追加（タイトル入力 + カテゴリ選択）
- ✅ Todo完了/未完了切り替え
- ✅ カテゴリ設定・変更（クリックで選択）
- ✅ Todo削除
- ✅ フィルタリング（すべて/未完了/完了）
- ✅ 日付でソート（新しい順）
- ✅ 楽観的更新による即座のUI反映
- ✅ バックエンドAPIとの自動同期

### 2つのバージョン
- ✅ **楽観的更新版** (`/`) - サーバー確認を待たずに即座にUI更新 ⚡
- ✅ **悲観的更新版** (`/pessimistic`) - サーバー確認後にUI更新 🐢
- ✅ ページ間でナビゲーション可能、体感の違いを比較できる

### 高度な機能
- ✅ **コレクション間JOIN**: TodoとUser、Categoryの関連データ表示
  - INNER JOIN例：Todo → User
  - LEFT JOIN例：Todo → Category（オプショナル）
  - 複数テーブルJOIN例：Todo → User + Category
- ✅ **エラーシミュレーション**: 楽観的更新のロールバック動作を確認可能
- ✅ **リアルタイム通知**: 操作成功/失敗を通知

### データモデル

**Todo**
- id: string
- title: string
- completed: boolean
- createdAt: number
- userId: string（作成者）
- categoryId?: string（カテゴリ、オプショナル）

**User**
- id: string
- name: string
- email: string
- avatar?: string

**Category**
- id: string
- name: string
- color: string
- description?: string

## 学習ポイント

### 1. コレクションの理解

[app/db/collections.ts](app/db/collections.ts) を確認してください。

- `queryFn`: 初期データの取得方法
- `getKey`: 各アイテムの一意なキーの取得
- `onUpdate/onInsert/onDelete`: サーバー同期処理（エラーハンドリング含む）

### 2. ライブクエリの理解

**基本的なクエリ**: [app/components/TodoList.tsx](app/components/TodoList.tsx:15-31)

```typescript
// フィルタリングとソート
const { data: activeTodos } = useLiveQuery((q) =>
  q
    .from({ todo: todoCollection })
    .where(({ todo }) => eq(todo.completed, false))
    .orderBy(({ todo }) => todo.createdAt, 'desc')
)
```

**コレクション間JOIN**: [app/components/TodosWithUserAndCategory.tsx](app/components/TodosWithUserAndCategory.tsx:56-72)

```typescript
// 複数テーブルJOIN
const { data: todosWithAll } = useLiveQuery((query) =>
  query
    .from({ t: todoCollection })
    .innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
    .leftJoin({ c: categoryCollection }, ({ t, c }) => eq(t.categoryId, c.id))
    .select(({ t, u, c }) => ({
      id: t.id,
      title: t.title,
      userName: u.name,
      categoryName: c?.name,  // LEFT JOINのためオプショナル
    }))
    .orderBy(({ t }) => t.createdAt, 'desc')
)
```

### 3. 楽観的更新の理解

**楽観的更新版**: [app/components/TodoItem.tsx](app/components/TodoItem.tsx:23-35)

```typescript
// 完了状態の切り替え（楽観的更新）
const handleToggle = () => {
  todoCollection.update(todo.id, (draft) => {
    draft.completed = !draft.completed
  })
}
```

- `collection.update()`: 即座にUIを更新
- `collection.delete()`: 即座にアイテムを削除
- `collection.insert()`: 即座にアイテムを追加
- エラー時は自動的にロールバック

**悲観的更新版**: [app/components/PessimisticTodoItem.tsx](app/components/PessimisticTodoItem.tsx:23-38)

```typescript
// 完了状態の切り替え（悲観的更新）
const handleToggle = async () => {
  setIsUpdating(true)
  try {
    const tx = todoCollection.update(
      todo.id,
      { optimistic: false }, // ← 楽観的更新をオフ
      (draft) => {
        draft.completed = !draft.completed
      }
    )
    await tx.isPersisted.promise // サーバー確認まで待つ
  } finally {
    setIsUpdating(false)
  }
}
```

- `{ optimistic: false }`: 楽観的更新を無効化
- `tx.isPersisted.promise`: サーバー処理完了まで待機
- UI更新が遅くなるが、データ整合性が保証される
- ローディング状態の管理が必要

### 4. エラーハンドリングとロールバック

エラーシミュレーションモードを有効にすると、すべての更新操作が失敗し、楽観的更新が自動的にロールバックされる様子を確認できます。

[app/components/ErrorSimulationToggle.tsx](app/components/ErrorSimulationToggle.tsx)

## データフロー

```
1. User Action (クリック等)
   ↓
2. Optimistic Mutation (即座にUI更新)
   ↓
3. Backend API Request (非同期でサーバーリクエスト)
   ↓
4. Success → UI維持 / Error → ロールバック + 通知表示
   ↓
5. Live Query (自動的に再レンダリング)
```

## TanStack DBの利点

1. **高速なUI更新** - 楽観的更新により、サーバー応答を待たずにUIが更新されます
2. **リアクティブ** - データ変更時に関連するコンポーネントが自動的に再レンダリングされます
3. **型安全** - TypeScriptによる完全な型サポート
4. **シンプルなAPI** - 直感的で使いやすいAPI設計
5. **コレクション間JOIN** - SQLライクなJOIN構文でリレーショナルデータを扱える
6. **自動エラーハンドリング** - エラー時の自動ロールバック
7. **柔軟性** - `optimistic: false` で悲観的更新にも対応可能

## 楽観的更新 vs 悲観的更新

このサンプルでは、両方のアプローチを実装しており、実際に体感できます。

### 楽観的更新（推奨） ⚡

**メリット:**
- ✅ 即座にUI更新（UXが良い）
- ✅ サーバー遅延の影響を受けない
- ✅ エラー時の自動ロールバック

**デメリット:**
- ❌ 実装がやや複雑
- ❌ エラー時のロールバックが視覚的に見える

**使用例:**
```typescript
// デフォルトで楽観的更新が有効
todoCollection.update(id, (draft) => { draft.completed = true })
```

### 悲観的更新 🐢

**メリット:**
- ✅ 実装がシンプル
- ✅ データ整合性が常に保証される
- ✅ サーバー確認後の更新で安心

**デメリット:**
- ❌ UI更新が遅い（約1.5秒の遅延）
- ❌ UXが悪い
- ❌ ローディング状態の管理が必要

**使用例:**
```typescript
// optimistic: false で悲観的更新
const tx = todoCollection.update(id, { optimistic: false }, (draft) => {
  draft.completed = true
})
await tx.isPersisted.promise
```

### どちらを選ぶべきか？

| シナリオ | 推奨 |
|---------|-----|
| 一般的なCRUD操作 | 楽観的更新 ⚡ |
| サーバー側で複雑な処理がある | 悲観的更新 🐢 |
| バリデーション結果を待つ必要がある | 悲観的更新 🐢 |
| リアルタイム性が重要 | 楽観的更新 ⚡ |
| データ整合性が最重要 | 悲観的更新 🐢 |

**このサンプルアプリで体験してみてください！**
- `/` - 楽観的更新版（即座にUI更新）
- `/pessimistic` - 悲観的更新版（サーバー確認後に更新）

## JOIN機能の詳細

TanStack DBは、複数のコレクション間でSQLライクなJOINをサポートしています。

### INNER JOIN
両方のコレクションにマッチするデータのみ取得
```typescript
.innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
```

### LEFT JOIN
左側のコレクションの全データと、右側のマッチするデータを取得（右側はオプショナル）
```typescript
.leftJoin({ c: categoryCollection }, ({ t, c }) => eq(t.categoryId, c.id))
```

### 複数テーブルJOIN
複数のコレクションを組み合わせることも可能
```typescript
query
  .from({ t: todoCollection })
  .innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
  .leftJoin({ c: categoryCollection }, ({ t, c }) => eq(t.categoryId, c.id))
```

詳細は [app/components/TodosWithUserAndCategory.tsx](app/components/TodosWithUserAndCategory.tsx) を参照してください。

## 参考リンク

- [TanStack DB 公式ドキュメント](https://tanstack.com/db/latest)
- [TanStack Query ドキュメント](https://tanstack.com/query/latest)
- [Next.js ドキュメント](https://nextjs.org/docs)

## ライセンス

MIT
