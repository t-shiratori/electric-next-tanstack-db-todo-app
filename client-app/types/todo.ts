export interface Todo extends Record<string, unknown> {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  userId: string;
  categoryId?: string;
}
