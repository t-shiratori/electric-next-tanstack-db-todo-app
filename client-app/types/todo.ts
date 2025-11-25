export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  userId: string;
  categoryId?: string;
}
