"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import Image from "next/image";
import { categoryCollection, todoCollection, userCollection } from "@/app/db/collections";

/**
 * TodosWithUserAndCategory Component
 *
 * Demonstrates cross-collection JOIN queries using TanStack DB's native join support.
 * This component shows three common JOIN patterns:
 * 1. Many-to-One INNER JOIN (Todo -> User)
 * 2. Many-to-One LEFT JOIN (Todo -> Category, optional)
 * 3. Multi-table JOIN (Todo -> User + Category)
 */
export function TodosWithUserAndCategory() {
  // Example 1: INNER JOIN Todos with Users (Many-to-One)
  // SQL equivalent: SELECT * FROM todos JOIN users ON todos.userId = users.id
  const { data: todosWithUsers = [] } = useLiveQuery((query) =>
    query
      .from({ t: todoCollection })
      .innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
      .select(({ t, u }) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        userName: u.name,
        userEmail: u.email,
        userAvatar: u.avatar,
      }))
      .orderBy(({ t }) => t.createdAt, "desc"),
  );

  // Example 2: LEFT JOIN Todos with Categories (Many-to-One, Optional)
  // SQL equivalent: SELECT * FROM todos LEFT JOIN categories ON todos.categoryId = categories.id
  const { data: todosWithCategories = [] } = useLiveQuery((query) =>
    query
      .from({ t: todoCollection })
      .leftJoin({ c: categoryCollection }, ({ t, c }) => eq(t.categoryId, c.id))
      .select(({ t, c }) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        categoryName: c?.name,
        categoryColor: c?.color,
      }))
      .orderBy(({ t }) => t.createdAt, "desc"),
  );

  // Example 3: Multi-table JOIN (Todo -> User + Category)
  // SQL equivalent:
  // SELECT * FROM todos
  // INNER JOIN users ON todos.userId = users.id
  // LEFT JOIN categories ON todos.categoryId = categories.id
  const { data: todosWithAll = [] } = useLiveQuery((query) =>
    query
      .from({ t: todoCollection })
      .innerJoin({ u: userCollection }, ({ t, u }) => eq(t.userId, u.id))
      .leftJoin({ c: categoryCollection }, ({ t, c }) => eq(t.categoryId, c.id))
      .select(({ t, u, c }) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        userName: u.name,
        userAvatar: u.avatar,
        categoryName: c?.name,
        categoryColor: c?.color,
      }))
      .orderBy(({ t }) => t.createdAt, "desc"),
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">コレクション間 JOIN の例</h2>
        <p className="text-gray-600 mb-6">
          TanStack DB は、リアクティブなライブクエリでネイティブなコレクション間 JOIN をサポートしています。
          以下の例では、
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">.join()</code> メソッドを使用した INNER JOIN、LEFT
          JOIN、および複数テーブル JOIN を実演します。
        </p>
      </div>

      {/* Example 1: Todos with Users */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">例1: Todo とユーザーの結合（多対一 INNER JOIN）</h3>
        <p className="text-sm text-blue-700 mb-4">
          SQL に相当:{" "}
          <code className="bg-blue-100 px-2 py-1 rounded">
            SELECT * FROM todos JOIN users ON todos.userId = users.id
          </code>
        </p>
        <div className="space-y-2">
          {todosWithUsers.map((todo) => (
            <div key={todo.id} className="bg-white p-4 rounded shadow-sm">
              <div className="flex items-center gap-3">
                {todo.userAvatar && (
                  <Image
                    src={todo.userAvatar}
                    alt={todo.userName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{todo.title}</div>
                  <div className="text-sm text-gray-600">作成者: {todo.userName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example 2: Todos with Categories */}
      <div className="border rounded-lg p-6 bg-green-50">
        <h3 className="text-lg font-semibold mb-3 text-green-900">例2: Todo とカテゴリの結合（LEFT JOIN）</h3>
        <p className="text-sm text-green-700 mb-4">
          SQL に相当:{" "}
          <code className="bg-green-100 px-2 py-1 rounded">
            SELECT * FROM todos LEFT JOIN categories ON todos.categoryId = categories.id
          </code>
        </p>
        <div className="space-y-2">
          {todosWithCategories.map((todo) => (
            <div key={todo.id} className="bg-white p-4 rounded shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{todo.title}</div>
                {todo.categoryName && todo.categoryColor ? (
                  <span
                    className="px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: todo.categoryColor }}
                  >
                    {todo.categoryName}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-600">カテゴリなし</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example 3: Full JOIN */}
      <div className="border rounded-lg p-6 bg-purple-50">
        <h3 className="text-lg font-semibold mb-3 text-purple-900">例3: 完全なビュー（複数テーブル JOIN）</h3>
        <p className="text-sm text-purple-700 mb-4">
          SQL に相当:{" "}
          <code className="bg-purple-100 px-2 py-1 rounded text-xs">
            SELECT * FROM todos JOIN users ON todos.userId = users.id LEFT JOIN categories ON todos.categoryId =
            categories.id
          </code>
        </p>
        <div className="space-y-2">
          {todosWithAll.map((todo) => (
            <div key={todo.id} className="bg-white p-4 rounded shadow-sm">
              <div className="flex items-center gap-3">
                {todo.userAvatar && (
                  <Image
                    src={todo.userAvatar}
                    alt={todo.userName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{todo.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        todo.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {todo.completed ? "完了" : "未完了"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    作成者: {todo.userName}
                    {todo.categoryName && todo.categoryColor && (
                      <span
                        className="ml-2 px-2 py-0.5 rounded text-xs text-white"
                        style={{ backgroundColor: todo.categoryColor }}
                      >
                        {todo.categoryName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">コード例</h3>
        <p className="text-sm text-gray-600 mb-3">
          TanStack DB は <code className="bg-gray-700 text-gray-100 px-1 rounded">.join()</code>{" "}
          メソッドを使用してネイティブなコレクション間 JOIN をサポートしています。 名前の競合を避けるため、{" "}
          <code className="bg-gray-700 text-gray-100 px-1 rounded">.select()</code> でエイリアスを使用します。
        </p>
        <pre className="text-xs bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
          {`// Multi-table JOIN with INNER JOIN and LEFT JOIN
const { data: todosWithAll = [] } = useLiveQuery((query) =>
  query
    .from({ t: todoCollection })
    // INNER JOIN with users
    .innerJoin(
      { u: userCollection },
      ({ t, u }) => eq(t.userId, u.id)
    )
    // LEFT JOIN with categories (optional)
    .leftJoin(
      { c: categoryCollection },
      ({ t, c }) => eq(t.categoryId, c.id)
    )
    // Select fields with proper typing
    .select(({ t, u, c }) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      userName: u.name,
      userAvatar: u.avatar,
      categoryName: c?.name,  // Optional due to LEFT JOIN
      categoryColor: c?.color,
    }))
    .orderBy(({ t }) => t.createdAt, "desc")
);`}
        </pre>
      </div>
    </div>
  );
}
