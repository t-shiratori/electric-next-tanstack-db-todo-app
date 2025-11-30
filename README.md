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
// Electric SQL設定
const ELECTRIC_URL = process.env.NEXT_PUBLIC_ELECTRIC_URL || "http://localhost:3000";
const electric = { url: ELECTRIC_URL };

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
      if (!mutation) return;

      const { original, modified } = mutation;
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modified),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

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
     - **読み取り**: Electric サービスが PostgreSQL の変更を自動的に検知し、接続中の全クライアントにブロードキャスト
     - **書き込み**: REST API 経由で PostgreSQL に書き込み、txid を使って同期を確認

2. **実装のシンプルさ**
   - **Query Collection**: `queryFn`, `onUpdate`, `onInsert`, `onDelete` を全て実装する必要がある
   - **Electric Collection**:
     - `shapeOptions`を指定すれば読み取りは自動（Shape Stream API経由）
     - 書き込みは`onUpdate`, `onInsert`, `onDelete`を実装し、txidを返す

3. **リアルタイム性**
   - **Query Collection**: クライアント主導のポーリングやフォーカス時の再取得に依存
   - **Electric Collection**: PostgreSQL の変更がサーバーから全クライアントにブロードキャストされ、即座に反映される

4. **txid による同期保証**
   - **Electric Collection**: API が返す txid を使って、Electric がデータを同期するまで待機
   - これにより、楽観的更新が確実にサーバーと同期されたことを確認できる

### データフロー

Electric SQLとTanStack DBの統合には、**読み取り（Read）**と**書き込み（Write）**で異なるフローがあります。

#### 📖 読み取りフロー（リアルタイム同期）

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────────┐
│ PostgreSQL  │  WAL    │ Electric Service│ HTTP/SSE │ Client Browser   │
│   Database  │────────▶│  (Sync Engine)  │─────────▶│ Electric         │
│             │ Repl.   │                 │ Stream   │ Collection       │
└─────────────┘         └─────────────────┘          └──────────────────┘
                                                              │
                                                              │ 自動更新
                                                              ▼
                                                      ┌──────────────────┐
                                                      │ TanStack DB      │
                                                      │ (In-Memory)      │
                                                      └──────────────────┘
                                                              │
                                                              │ リアクティブ
                                                              ▼
                                                      ┌──────────────────┐
                                                      │ React UI         │
                                                      │ (useLiveQuery)   │
                                                      └──────────────────┘
```

**ステップ解説：**

1. **PostgreSQL での変更**: データベースに変更が発生（INSERT/UPDATE/DELETE）
2. **WALレプリケーション**: Electric ServiceがPostgreSQLのWrite-Ahead Logを監視し、変更を検知
3. **Shape Stream API**: Electric ServiceがHTTP/SSE（Server-Sent Events）を通じて変更を接続中の全クライアントにブロードキャスト
4. **Electric Collection**: クライアントが変更を受信し、TanStack DBのインメモリデータを自動更新
5. **Live Queryの再評価**: データ変更により`useLiveQuery`が自動的に再実行される
6. **UIの自動更新**: Reactコンポーネントが新しいデータで再レンダリング

#### ✏️ 書き込みフロー（楽観的更新 + サーバー同期）

```
┌──────────────────┐         ┌─────────────────┐         ┌─────────────┐
│ Client Browser   │  REST   │ Next.js API     │  SQL    │ PostgreSQL  │
│ (User Action)    │────────▶│ Route Handler   │────────▶│  Database   │
│                  │  API    │                 │ Query   │             │
└──────────────────┘         └─────────────────┘         └─────────────┘
       │                              │                          │
       │ 1. Optimistic Update         │ 2. DB Write             │
       │                              │ 3. Return txid          │
       ▼                              ▼                          │
┌──────────────────┐         ┌─────────────────┐              │
│ TanStack DB      │         │ Response:       │              │
│ (即座に更新)       │         │ { txid: "..." } │              │
└──────────────────┘         └─────────────────┘              │
       │                              │                          │
       │ 4. Wait for txid            │                          │
       │    from Electric             │                          │
       ▼                              │                          │
┌──────────────────┐                 │                          │
│ Electric         │◀────────────────┘                          │
│ Collection       │  5. Electric が同期確認                      │
│ (同期完了待機)     │◀────────────────────────────────────────────┘
└──────────────────┘  Shape Stream API 経由でデータ受信
```

**ステップ解説：**

1. **楽観的更新**: ユーザーアクション（例: `todoCollection.update()`）が即座にクライアント側のデータを更新
2. **REST API呼び出し**: `onUpdate`ハンドラーがNext.js API Routeを呼び出し
3. **データベースへの書き込み**: API RouteがPostgreSQLにデータを書き込み、トランザクションID（txid）を取得
4. **txidの返却**: APIが`{ txid: "..." }`をクライアントに返却
5. **同期確認待機**: Electric CollectionがElectric Serviceから同じtxidを持つ変更を受信するまで待機
6. **同期完了**: txidが一致したら、楽観的更新が確定（サーバーと同期済み）

#### 🔄 完全なラウンドトリップの例

ユーザーがTodoを完了状態に変更した場合：

```
1. [UI] ユーザーがチェックボックスをクリック
   ↓
2. [Client] todoCollection.update(id, { completed: true })
   ↓ (即座に UI が更新される - 楽観的更新)
3. [Client] onUpdate ハンドラーが /api/todos/:id へ PUT リクエスト
   ↓
4. [API] PostgreSQL に UPDATE 実行
   ↓
5. [API] txid を取得して返却 { txid: "1234567890" }
   ↓
6. [Electric] PostgreSQL の WAL から変更を検知
   ↓
7. [Electric] Shape Stream API 経由でクライアントに変更を配信
   ↓
8. [Client] Electric Collection が txid: "1234567890" を受信
   ↓
9. [Client] 同期完了！楽観的更新が確定される
   ↓
10. [UI] 同期状態がユーザーに表示される（例: 保存完了アイコン）
```

#### 💡 重要なポイント

- **読み取りは完全に自動**: Shape Stream APIにより、PostgreSQLの変更が全クライアントに自動的にブロードキャスト
- **書き込みは明示的**: REST APIを使用し、`onUpdate`/`onInsert`/`onDelete`で実装
- **txidによる保証**: 楽観的更新がサーバーと確実に同期されたことを確認できる
- **競合解決**: Electricが最新のサーバーデータを全クライアントに配信するため、競合が自動的に解決される

### シーケンス図

Electric SQLとTanStack DBの動作をシーケンス図で詳細に示します。

#### 📖 読み取り（初期ロード）のシーケンス図

```
User          Component      Collection    Electric      PostgreSQL
 │                │              │          Service          │
 │  ページ表示      │              │            │              │
 │───────────────>│              │            │              │
 │                │ mount()      │            │              │
 │                │─────────────>│            │              │
 │                │              │ connect    │              │
 │                │              │───────────>│              │
 │                │              │            │ subscribe    │
 │                │              │            │─────────────>│
 │                │              │            │  (WAL)       │
 │                │              │            │              │
 │                │              │ snapshot   │              │
 │                │              │<───────────│              │
 │                │              │            │              │
 │                │  data        │            │              │
 │                │<─────────────│            │              │
 │                │              │            │              │
 │  render        │              │            │              │
 │<───────────────│              │            │              │
 │                │              │            │              │
 │                │              │ stream     │  changes     │
 │                │              │<───────────│<─────────────│
 │                │              │            │   (real-time)│
 │                │  update      │            │              │
 │                │<─────────────│            │              │
 │  再render      │              │            │              │
 │<───────────────│              │            │              │
```

**解説:**
1. ユーザーがページを表示すると、Reactコンポーネントがマウント
2. CollectionがElectric Serviceに接続し、Shape Stream APIを開始
3. Electric ServiceがPostgreSQLのWALをサブスクライブ
4. 初期データスナップショットがCollectionに送信される
5. Componentが初期データでレンダリング
6. その後、PostgreSQLの変更がリアルタイムで接続中の全クライアントにブロードキャストされる
7. 変更を受信するたびにComponentが自動的に再レンダリング

#### ✏️ 書き込み（楽観的更新）のシーケンス図

```
User     Component  Collection  API Route  PostgreSQL  Electric
 │           │          │           │          │       Service
 │ クリック   │          │           │          │          │
 │──────────>│          │           │          │          │
 │           │ update() │           │          │          │
 │           │─────────>│           │          │          │
 │           │          │           │          │          │
 │           │          │[楽観的更新]│          │          │
 │           │          │ (即座)    │          │          │
 │           │  data    │           │          │          │
 │           │<─────────│           │          │          │
 │  即座にUI  │          │           │          │          │
 │  更新     │          │           │          │          │
 │<──────────│          │           │          │          │
 │           │          │           │          │          │
 │           │          │ onUpdate()│          │          │
 │           │          │──────────>│          │          │
 │           │          │           │ INSERT/  │          │
 │           │          │           │ UPDATE   │          │
 │           │          │           │─────────>│          │
 │           │          │           │          │          │
 │           │          │           │ txid     │          │
 │           │          │           │<─────────│          │
 │           │          │  {txid}   │          │          │
 │           │          │<──────────│          │          │
 │           │          │           │          │          │
 │           │          │[待機中: txid一致を待つ]│          │
 │           │          │           │          │ WAL      │
 │           │          │           │          │─────────>│
 │           │          │           │          │          │
 │           │          │   stream(txid)       │          │
 │           │          │<─────────────────────│          │
 │           │          │           │          │          │
 │           │          │[txid一致確認]         │          │
 │           │          │[同期完了]  │          │          │
 │           │          │           │          │          │
 │           │ confirmed│           │          │          │
 │           │<─────────│           │          │          │
 │  同期完了  │          │           │          │          │
 │  アイコン  │          │           │          │          │
 │<──────────│          │           │          │          │
```

**解説:**
1. ユーザーがUI操作（例: チェックボックスをクリック）
2. Collectionが即座に楽観的更新を実行（UIが即座に反応）
3. onUpdateハンドラーがバックグラウンドでAPI Routeを呼び出し
4. API RouteがPostgreSQLにデータを書き込み、txidを取得
5. txidがCollectionに返却される
6. PostgreSQLの変更がWAL経由でElectric Serviceに通知
7. Electric Serviceが同じtxidを持つ変更を接続中の全クライアントにブロードキャスト
8. Collectionがtxid一致を確認し、楽観的更新を「確定」
9. UIに同期完了を表示

#### ⚠️ エラー時のシーケンス図

```
User     Component  Collection  API Route  PostgreSQL
 │           │          │           │          │
 │ クリック   │          │           │          │
 │──────────>│          │           │          │
 │           │ update() │           │          │
 │           │─────────>│           │          │
 │           │          │           │          │
 │           │          │[楽観的更新]│          │
 │           │  data    │           │          │
 │           │<─────────│           │          │
 │  UI更新   │          │           │          │
 │<──────────│          │           │          │
 │           │          │           │          │
 │           │          │ onUpdate()│          │
 │           │          │──────────>│          │
 │           │          │           │ UPDATE   │
 │           │          │           │─────────>│
 │           │          │           │          │
 │           │          │           │ ERROR!   │
 │           │          │           │<─────────│
 │           │          │  Error    │          │
 │           │          │<──────────│          │
 │           │          │           │          │
 │           │          │[自動ロールバック]     │
 │           │          │[元の状態に戻す]       │
 │           │          │           │          │
 │           │ rollback │           │          │
 │           │<─────────│           │          │
 │  UI元に   │          │           │          │
 │  戻る     │          │           │          │
 │<──────────│          │           │          │
 │           │          │           │          │
 │  エラー    │          │           │          │
 │  通知表示  │          │           │          │
 │<──────────│          │           │          │
```

**解説:**
1. ユーザー操作で楽観的更新が即座に実行される
2. API Routeへのリクエストがエラーになる
3. Collectionが自動的にロールバックを実行
4. UIが元の状態に戻る
5. ユーザーにエラー通知が表示される

#### 🔄 複数ユーザー間のリアルタイム同期

```
User A    Component A  Collection  Electric   PostgreSQL  Collection  Component B  User B
 │            │           │        Service        │          │            │          │
 │ 編集       │           │          │            │          │            │          │
 │───────────>│           │          │            │          │            │          │
 │            │ update()  │          │            │          │            │          │
 │            │──────────>│          │            │          │            │          │
 │            │           │          │            │          │            │          │
 │  即座にUI   │           │          │            │          │            │          │
 │  更新      │           │          │            │          │            │          │
 │<───────────│           │          │            │          │            │          │
 │            │           │ API呼び出し            │          │            │          │
 │            │           │─────────────────────>│          │            │          │
 │            │           │          │            │          │            │          │
 │            │           │          │   {txid}   │          │            │          │
 │            │           │<─────────────────────│          │            │          │
 │            │           │          │            │          │            │          │
 │            │           │          │  WAL       │          │            │          │
 │            │           │          │<───────────│          │            │          │
 │            │           │          │            │          │            │          │
 │            │           │  stream(txid)         │          │            │          │
 │            │           │<─────────│            │          │            │          │
 │  同期完了   │           │          │            │          │            │          │
 │<───────────│           │          │            │          │            │          │
 │            │           │          │            │          │            │          │
 │            │           │          │  stream (同じ変更)     │            │          │
 │            │           │          │───────────────────────>│            │          │
 │            │           │          │            │          │ update     │          │
 │            │           │          │            │          │───────────>│          │
 │            │           │          │            │          │            │ 自動的に  │
 │            │           │          │            │          │            │ UI更新   │
 │            │           │          │            │          │            │─────────>│
```

**解説:**
1. User AがデータをA更新
2. Component Aが即座にUIを更新（楽観的更新）
3. PostgreSQLにデータが書き込まれる
4. Electric ServiceがWALから変更を検知
5. **Electric Serviceが変更を全クライアントにブロードキャスト**
6. **User Aには同期完了として通知**
7. **同時にUser Bのブラウザにも同じ変更が自動的に配信される**
8. Component Bが自動的に更新され、User BのUIに反映

これにより、複数ユーザー間でのリアルタイム同期が実現されます！

**ブロードキャストの重要性:**
- Electric Serviceは1つの変更を検知すると、その変更を購読している**すべてのクライアント**に同時配信
- ユーザーAの操作がユーザーB、C、D…のブラウザに即座に反映される
- これにより、Googleドキュメントのような協調編集が可能になる

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
