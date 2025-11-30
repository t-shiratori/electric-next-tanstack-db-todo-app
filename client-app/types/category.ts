export interface Category extends Record<string, unknown> {
  id: string;
  name: string;
  color: string;
  description?: string;
}
