"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { useState } from "react";
import { categoryCollection, todoCollection } from "@/app/db/collections";
import type { Todo } from "@/types/todo";

interface PessimisticTodoItemProps {
  todo: Todo;
}

export function PessimisticTodoItem({ todo }: PessimisticTodoItemProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get all categories for the dropdown
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoryCollection }));

  // Find the current category
  const currentCategory = categories.find((c) => c.id === todo.categoryId);

  // Pessimistic mutation - Toggle completion status
  // This updates the UI ONLY AFTER server confirmation
  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const tx = todoCollection.update(
        todo.id,
        { optimistic: false }, // ← Disable optimistic updates
        (draft) => {
          draft.completed = !draft.completed;
        },
      );

      // Wait for server confirmation
      await tx.isPersisted.promise;
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Pessimistic mutation - Update category
  const handleCategoryChange = async (newCategoryId: string | undefined) => {
    setIsUpdating(true);
    try {
      const tx = todoCollection.update(
        todo.id,
        { optimistic: false }, // ← Disable optimistic updates
        (draft) => {
          draft.categoryId = newCategoryId;
        },
      );

      // Wait for server confirmation
      await tx.isPersisted.promise;
      setIsEditingCategory(false);
    } catch (error) {
      console.error("Failed to update category:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Pessimistic mutation - Delete todo
  // This removes the item from UI ONLY AFTER server confirmation
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const tx = todoCollection.delete(todo.id, { optimistic: false }); // ← Disable optimistic updates

      // Wait for server confirmation
      await tx.isPersisted.promise;
    } catch (error) {
      console.error("Failed to delete todo:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
        isDeleting ? "opacity-50" : ""
      }`}
    >
      {/* Checkbox for completion status */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={isUpdating || isDeleting}
        className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />

      {/* Todo title */}
      <span className={`flex-1 ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}>{todo.title}</span>

      {/* Category badge or dropdown */}
      {isEditingCategory ? (
        <select
          value={todo.categoryId || ""}
          onChange={(e) => handleCategoryChange(e.target.value || undefined)}
          onBlur={() => setIsEditingCategory(false)}
          disabled={isUpdating || isDeleting}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          disabled={isUpdating || isDeleting}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
        disabled={isUpdating || isDeleting}
        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting ? "削除中..." : "削除"}
      </button>
    </div>
  );
}
