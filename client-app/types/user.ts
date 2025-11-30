export interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
