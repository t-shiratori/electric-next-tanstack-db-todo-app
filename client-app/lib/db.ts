import type { Category } from "@/types/category";
import type { Todo } from "@/types/todo";
import type { User } from "@/types/user";

// In-memory database
const users: User[] = [
  {
    id: "user-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar: "https://i.pravatar.cc/150?img=58",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar: "https://i.pravatar.cc/150?img=10",
  },
  {
    id: "user-3",
    name: "Carol Williams",
    email: "carol@example.com",
    avatar: "https://i.pravatar.cc/150?img=28",
  },
];

const categories: Category[] = [
  {
    id: "cat-1",
    name: "Work",
    color: "#3b82f6",
    description: "Work-related tasks",
  },
  {
    id: "cat-2",
    name: "Personal",
    color: "#10b981",
    description: "Personal tasks",
  },
  {
    id: "cat-3",
    name: "Learning",
    color: "#f59e0b",
    description: "Learning and education",
  },
];

const todos: Todo[] = [
  {
    id: "1",
    title: "Learn TanStack DB",
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 5,
    userId: "user-1",
    categoryId: "cat-3",
  },
  {
    id: "2",
    title: "Build a sample app",
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 3,
    userId: "user-1",
    categoryId: "cat-1",
  },
  {
    id: "3",
    title: "Understand live queries",
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 1,
    userId: "user-2",
    categoryId: "cat-3",
  },
];

export const db = {
  todos: {
    findAll: async (): Promise<Todo[]> => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...todos];
    },

    findById: async (id: string): Promise<Todo | undefined> => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return todos.find((todo) => todo.id === id);
    },

    create: async (data: Omit<Todo, "id" | "createdAt">): Promise<Todo> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const newTodo: Todo = {
        ...data,
        id: String(Date.now()),
        createdAt: Date.now(),
      };
      todos.push(newTodo);
      return newTodo;
    },

    update: async (id: string, data: Partial<Omit<Todo, "id" | "createdAt">>): Promise<Todo | null> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const index = todos.findIndex((todo) => todo.id === id);
      if (index === -1) return null;

      todos[index] = { ...todos[index], ...data };
      return todos[index];
    },

    delete: async (id: string): Promise<boolean> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const index = todos.findIndex((todo) => todo.id === id);
      if (index === -1) return false;

      todos.splice(index, 1);
      return true;
    },
  },

  users: {
    findAll: async (): Promise<User[]> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...users];
    },

    findById: async (id: string): Promise<User | undefined> => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return users.find((user) => user.id === id);
    },
  },

  categories: {
    findAll: async (): Promise<Category[]> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [...categories];
    },

    findById: async (id: string): Promise<Category | undefined> => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return categories.find((category) => category.id === id);
    },
  },
};
