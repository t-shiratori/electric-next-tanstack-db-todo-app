-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "categoryId" TEXT REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS "idx_todos_userId" ON todos("userId");
CREATE INDEX IF NOT EXISTS "idx_todos_categoryId" ON todos("categoryId");
CREATE INDEX IF NOT EXISTS "idx_todos_createdAt" ON todos("createdAt" DESC);

-- Note: Electric SQL 1.2+ doesn't require "ENABLE ELECTRIC" syntax
-- Tables are automatically available for syncing via the Shape Stream API

-- Insert sample data
INSERT INTO users (id, name, email, avatar) VALUES
  ('user-1', 'Alice Johnson', 'alice@example.com', 'https://i.pravatar.cc/150?img=58'),
  ('user-2', 'Bob Smith', 'bob@example.com', 'https://i.pravatar.cc/150?img=10'),
  ('user-3', 'Carol Williams', 'carol@example.com', 'https://i.pravatar.cc/150?img=28')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, color, description) VALUES
  ('cat-1', 'Work', '#3b82f6', 'Work-related tasks'),
  ('cat-2', 'Personal', '#10b981', 'Personal tasks'),
  ('cat-3', 'Learning', '#f59e0b', 'Learning and education')
ON CONFLICT (id) DO NOTHING;

INSERT INTO todos (id, title, completed, "createdAt", "userId", "categoryId") VALUES
  ('todo-1', 'Complete TanStack DB tutorial', false, EXTRACT(EPOCH FROM NOW()) * 1000, 'user-1', 'cat-1'),
  ('todo-2', 'Learn Electric SQL', false, EXTRACT(EPOCH FROM NOW()) * 1000, 'user-1', 'cat-1'),
  ('todo-3', 'Buy groceries', true, EXTRACT(EPOCH FROM NOW()) * 1000 - 86400000, 'user-2', 'cat-3')
ON CONFLICT (id) DO NOTHING;
