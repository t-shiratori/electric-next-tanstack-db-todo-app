"use client";

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient } from "@/app/lib/queryClient";
import { errorSimulation } from "@/lib/errorSimulation";
import { notification } from "@/lib/notification";
import type { Category } from "@/types/category";
import type { Todo } from "@/types/todo";
import type { User } from "@/types/user";

// TanStack DB Collection for Todos
// This demonstrates the three pillars of TanStack DB:
// 1. Collections - typed data sets with sync capabilities
// 2. Live Queries - reactive queries across collections
// 3. Optimistic Mutations - instant UI updates with server sync

export const todoCollection = createCollection(
  queryCollectionOptions<Todo>({
    // QueryClient instance (required for TanStack Query integration)
    queryClient,

    // Query key for TanStack Query integration
    queryKey: ["todos"],

    // Fetch function to load initial data
    queryFn: async () => {
      const response = await fetch("/api/todos");
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      return response.json();
    },

    // Get unique key for each item (required for tracking)
    getKey: (item) => item.id,

    // Handle updates when items are modified
    // This function is called when collection.update() is invoked
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { original, modified } = mutation;
      // Send update to backend API
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
        body: JSON.stringify(modified),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to update todo";
        notification.error(`Update failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response.json();
    },

    // Handle deletes when items are removed
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { original } = mutation;
      // Send delete to backend API
      const response = await fetch(`/api/todos/${original.id}`, {
        method: "DELETE",
        headers: {
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to delete todo";
        notification.error(`Delete failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    },

    // Handle inserts when new items are added
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation) return;

      const { modified } = mutation;
      // Send create to backend API
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(errorSimulation.enabled && { "x-simulate-error": "true" }),
        },
        body: JSON.stringify({
          title: modified.title,
          completed: modified.completed,
          userId: modified.userId,
          categoryId: modified.categoryId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create todo";
        notification.error(`Create failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response.json();
    },
  }),
);

// User Collection
// Demonstrates basic collection setup with minimal configuration
export const userCollection = createCollection(
  queryCollectionOptions<User>({
    queryClient,
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    getKey: (item) => item.id,
  }),
);

// Category Collection
// Demonstrates basic collection setup for taxonomy/reference data
export const categoryCollection = createCollection(
  queryCollectionOptions<Category>({
    queryClient,
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
    getKey: (item) => item.id,
  }),
);
