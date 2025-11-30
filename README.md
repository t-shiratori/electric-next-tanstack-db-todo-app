# Electric SQL + TanStack DB Todo App

このプロジェクトは、**Electric SQL** と **TanStack DB** を組み合わせた Todo アプリケーションです。Electric SQL を使用して PostgreSQL からリアルタイムでデータを同期し、TanStack DB の Electric Collection を使用してクライアント側でデータを管理します。

## 主な技術スタック

- **Electric SQL**: PostgreSQL からのリアルタイムデータ同期
- **TanStack DB**: 型安全なデータ管理とライブクエリ
- **Electric Collection**: Electric SQL と TanStack DB の統合
- **Next.js 16**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング

## プロジェクト構造

```
.
├── client-app/              # Next.js アプリケーション
│   ├── app/
│   │   ├── db/
│   │   │   └── collections.ts  # Electric Collection の定義と設定
│   │   └── components/         # React コンポーネント
│   └── package.json
├── db/
│   ├── migrations/         # データベースマイグレーション
│   │   └── 01_create_tables.sql
│   └── setup.sh            # DB セットアップスクリプト
└── docker-compose.yaml    # PostgreSQL と Electric サービス
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd client-app
pnpm install
```

### 2. Docker サービスの起動

PostgreSQL と Electric サービスを起動します：

```bash
docker compose up -d
```

サービスが起動するまで少し待ちます（約 10〜20 秒）。

### 3. データベースのセットアップ

データベーススキーマを作成し、サンプルデータを投入します：

```bash
./db/setup.sh
```

**注意**: このスクリプトはDockerコンテナー経由でマイグレーションを実行します。`psql`コマンドは不要です。

### 4. アプリケーションの起動

```bash
cd client-app
pnpm dev
```

ブラウザで [http://localhost:3001](http://localhost:3001) を開きます。

## Electric SQL と TanStack DB の仕組み

### Electric Collection の特徴

従来の Query Collection と比較して、Electric Collection には以下の特徴があります：

#### Query Collection（従来）
```typescript
createCollection(
  queryCollectionOptions<Todo>({
    queryClient,
    queryKey: ["todos"],
    queryFn: async () => {
      // REST API からデータを取得
      const response = await fetch("/api/todos");
      return response.json();
    },
    onUpdate: async ({ transaction }) => {
      // 更新時に REST API を呼び出し
      await fetch(`/api/todos/${id}`, { method: "PUT", ... });
    },
    // onInsert, onDelete も同様に実装が必要
  })
);
```

#### Electric Collection（新）
```typescript
createCollection(
  electricCollectionOptions<Todo>({
    // Shape options for Electric sync
    shapeOptions: {
      url: `${electric.url}/v1/shape`,
      params: {
        table: "todos",              // PostgreSQL のテーブル名
      },
    },
    getKey: (item) => item.id,

    // 書き込み操作は API 経由で行い、txid を返す
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const { original, modified } = mutation;
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modified),
      });
      const data = await response.json();
      // txid を返すことで Electric が同期を確認するまで待機
      return { txid: data.txid };
    },
    // onInsert, onDelete も同様
  })
);
```

### 主な違い

1. **データ同期の仕組み**
   - **Query Collection**: REST API を介して手動でデータを取得・更新
   - **Electric Collection**:
     - **読み取り**: Electric サービスが PostgreSQL の変更を自動的に検知してクライアントに同期
     - **書き込み**: REST API 経由で PostgreSQL に書き込み、txid を使って同期を確認

2. **実装のシンプルさ**
   - **Query Collection**: `queryFn`, `onUpdate`, `onInsert`, `onDelete` を全て実装する必要がある
   - **Electric Collection**:
     - `shapeOptions`を指定すれば読み取りは自動（Shape Stream API経由）
     - 書き込みは`onUpdate`, `onInsert`, `onDelete`を実装し、txidを返す

3. **リアルタイム性**
   - **Query Collection**: ポーリングまたは手動リフレッシュが必要
   - **Electric Collection**: PostgreSQL の変更が即座にクライアントに反映される

4. **txid による同期保証**
   - **Electric Collection**: API が返す txid を使って、Electric がデータを同期するまで待機
   - これにより、楽観的更新が確実にサーバーと同期されたことを確認できる

### データフロー

```
PostgreSQL → Electric Service → WebSocket → Client (Electric Collection) → TanStack DB → React UI
```

1. PostgreSQL でデータが変更される
2. Electric サービスが変更を検知（WAL レプリケーション）
3. WebSocket を通じてクライアントに変更を送信
4. Electric Collection が変更を受け取り、TanStack DB を更新
5. Live Query が自動的に再評価され、UI が更新される

## 学習ポイント

### 1. Electric Collectionの定義

[`client-app/app/db/collections.ts`](client-app/app/db/collections.ts)を確認してください。

```typescript
export const todoCollection = createCollection(
  electricCollectionOptions<Todo>({
    shapeOptions: {
      url: `${electric.url}/v1/shape`,
      params: {
        table: "todos",
      },
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      // ... mutation handling ...
      return { txid: data.txid };
    },
  })
);
```

### 2. Live Queryの使用

[`client-app/app/components/TodoList.tsx`](client-app/app/components/TodoList.tsx)を確認してください。

```typescript
const { data: allTodos, isLoading } = useLiveQuery((q) =>
  q.from({ todo: todoCollection }).orderBy(({ todo }) => todo.createdAt, "desc")
);
```

### 3. データの操作

[`client-app/app/components/TodoItem.tsx`](client-app/app/components/TodoItem.tsx)と[`AddTodoForm.tsx`](client-app/app/components/AddTodoForm.tsx)を確認してください。

```typescript
// 追加
todoCollection.insert({ ... });

// 更新
todoCollection.update(todo.id, { completed: !todo.completed });

// 削除
todoCollection.delete(todo.id);
```

## データベース直接操作での確認

PostgreSQLに直接接続して、データを変更し、リアルタイム同期を確認できます。

### 方法1: Dockerコンテナー経由（推奨）

`psql`コマンドのインストールは不要です：

```bash
# PostgreSQLに接続
docker exec -it electric_quickstart-postgres-1 psql -U postgres -d electric

# データを確認
\dt                          # テーブル一覧を表示
SELECT * FROM todos;         # 全てのTodoを表示
SELECT * FROM users;         # 全てのユーザーを表示
SELECT * FROM categories;    # 全てのカテゴリーを表示

# Todoを追加
INSERT INTO todos (id, title, completed, "createdAt", "userId", "categoryId")
VALUES ('todo-new', 'Database test', false, EXTRACT(EPOCH FROM NOW()) * 1000, 'user-1', 'cat-1');

# Todoを更新
UPDATE todos SET completed = true WHERE id = 'todo-1';

# Todoを削除
DELETE FROM todos WHERE id = 'todo-3';

# psqlを終了
\q
```

### 方法2: psqlコマンド経由

**注意**: `psql`コマンドが必要です。macOSの場合は以下でインストールできます：

```bash
brew install postgresql
```

インストール後、以下で接続できます：

```bash
# PostgreSQLに接続
PGPASSWORD=password psql -h localhost -p 54321 -U postgres -d electric

# 以降は方法1と同じSQLコマンドを実行
```

ブラウザのアプリケーションに変更が即座に反映されることを確認できます。

## トラブルシューティング

### Electric サービスに接続できない

```bash
# Electric サービスのログを確認
docker compose logs electric

# Electric サービスが起動しているか確認
curl http://localhost:3000/v1/health
```

### PostgreSQL に接続できない

```bash
# PostgreSQL のログを確認
docker compose logs postgres

# PostgreSQL が起動しているか確認
PGPASSWORD=password psql -h localhost -p 54321 -U postgres -d electric -c "SELECT 1"
```

### データが同期されない

1. ブラウザのコンソールでエラーを確認
2. Electric サービスのログを確認
3. データベースのテーブルが存在するか確認：

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

## 参考リンク

- [Electric SQL Documentation](https://electric-sql.com/docs)
- [TanStack DB Documentation](https://tanstack.com/db/latest)
- [Electric Collection Documentation](https://tanstack.com/db/latest/docs/collections/electric-collection)
- [Electric SQL Quickstart](https://electric-sql.com/docs/quickstart)

## ライセンス

MIT
