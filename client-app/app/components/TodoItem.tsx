"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useState } from "react";
import { categoryCollection, todoCollection } from "@/app/db/collections";
import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Get all categories for the dropdown
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoryCollection }));

  // Find the current category
  const currentCategory = categories.find((c) => c.id === todo.categoryId);

  // Optimistic mutation - Toggle completion status
  // This updates the UI immediately and syncs with the server in the background
  const handleToggle = () => {
    todoCollection.update(todo.id, (draft) => {
      draft.completed = !draft.completed;
    });
  };

  // Optimistic mutation - Update category
  const handleCategoryChange = (newCategoryId: string | undefined) => {
    todoCollection.update(todo.id, (draft) => {
      draft.categoryId = newCategoryId;
    });
    setIsEditingCategory(false);
  };

  // Optimistic mutation - Delete todo
  // This removes the item from UI immediately and syncs with the server
  const handleDelete = () => {
    todoCollection.delete(todo.id);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Checkbox for completion status */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />

      {/* Todo title */}
      <span className={`flex-1 ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}>{todo.title}</span>

      {/* Category badge or dropdown */}
      {isEditingCategory ? (
        <select
          value={todo.categoryId || ""}
          onChange={(e) => handleCategoryChange(e.target.value || undefined)}
          onBlur={() => setIsEditingCategory(false)}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">カテゴリなし</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditingCategory(true)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            currentCategory ? "text-white hover:opacity-80" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={currentCategory ? { backgroundColor: currentCategory.color } : undefined}
        >
          {currentCategory ? currentCategory.name : "カテゴリなし"}
        </button>
      )}

      {/* Created date */}
      <span className="text-xs text-gray-400">
        {new Date(todo.createdAt).toLocaleString("ja-JP", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        削除
      </button>
    </div>
  );
}
