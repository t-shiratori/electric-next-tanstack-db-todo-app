import postgres from "postgres";
import type { Category } from "@/types/category";
import type { Todo } from "@/types/todo";
import type { User } from "@/types/user";

// PostgreSQL接続
const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:password@localhost:54321/electric", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// トランザクション内でtxidを取得するヘルパー関数
async function getTxid(tx: postgres.TransactionSql): Promise<number> {
  const result = await tx`SELECT pg_current_xact_id()::xid::text as txid`;
  return Number.parseInt(result[0].txid, 10);
}

export const db = {
  todos: {
    findAll: async (): Promise<Todo[]> => {
      const result = await sql`
        SELECT id, title, completed, "createdAt", "userId", "categoryId"
        FROM todos
        ORDER BY "createdAt" DESC
      `;
      return result as unknown as Todo[];
    },

    findById: async (id: string): Promise<Todo | undefined> => {
      const result = await sql`
        SELECT id, title, completed, "createdAt", "userId", "categoryId"
        FROM todos
        WHERE id = ${id}
      `;
      return result[0] as unknown as Todo | undefined;
    },

    create: async (data: {
      title: string;
      completed: boolean;
      userId?: string;
      categoryId?: string;
    }): Promise<{ todo: Todo; txid: number }> => {
      let txid = 0;
      const todo = await sql.begin(async (tx) => {
        txid = await getTxid(tx);
        const id = `todo-${Date.now()}`;
        const createdAt = Date.now();

        const result = await tx`
          INSERT INTO todos (id, title, completed, "createdAt", "userId", "categoryId")
          VALUES (${id}, ${data.title}, ${data.completed}, ${createdAt}, ${data.userId || null}, ${data.categoryId || null})
          RETURNING id, title, completed, "createdAt", "userId", "categoryId"
        `;
        return result[0] as unknown as Todo;
      });

      return { todo, txid };
    },

    update: async (
      id: string,
      data: Partial<{
        title: string;
        completed: boolean;
        userId: string;
        categoryId: string;
      }>,
    ): Promise<{ todo: Todo; txid: number } | null> => {
      let txid = 0;
      const todo = await sql.begin(async (tx) => {
        txid = await getTxid(tx);

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramCount = 1;

        if (data.title !== undefined) {
          updates.push(`title = $${paramCount++}`);
          values.push(data.title);
        }
        if (data.completed !== undefined) {
          updates.push(`completed = $${paramCount++}`);
          values.push(data.completed);
        }
        if (data.userId !== undefined) {
          updates.push(`"userId" = $${paramCount++}`);
          values.push(data.userId);
        }
        if (data.categoryId !== undefined) {
          updates.push(`"categoryId" = $${paramCount++}`);
          values.push(data.categoryId);
        }

        if (updates.length === 0) {
          const result = await tx`
            SELECT id, title, completed, "createdAt", "userId", "categoryId"
            FROM todos
            WHERE id = ${id}
          `;
          return result[0] as unknown as Todo;
        }

        values.push(id);
        const query = `
          UPDATE todos
          SET ${updates.join(", ")}
          WHERE id = $${paramCount}
          RETURNING id, title, completed, "createdAt", "userId", "categoryId"
        `;

        const result = await tx.unsafe(query, values as never[]);
        return result[0] as unknown as Todo;
      });

      if (!todo) return null;
      return { todo, txid };
    },

    delete: async (id: string): Promise<{ success: boolean; txid: number }> => {
      let txid = 0;
      const success = await sql.begin(async (tx) => {
        txid = await getTxid(tx);
        const result = await tx`
          DELETE FROM todos
          WHERE id = ${id}
        `;
        return result.count > 0;
      });

      return { success, txid };
    },
  },

  users: {
    findAll: async (): Promise<User[]> => {
      const result = await sql`
        SELECT id, name, email, avatar
        FROM users
        ORDER BY name
      `;
      return result as unknown as User[];
    },

    findById: async (id: string): Promise<User | undefined> => {
      const result = await sql`
        SELECT id, name, email, avatar
        FROM users
        WHERE id = ${id}
      `;
      return result[0] as unknown as User | undefined;
    },
  },

  categories: {
    findAll: async (): Promise<Category[]> => {
      const result = await sql`
        SELECT id, name, color, description
        FROM categories
        ORDER BY name
      `;
      return result as unknown as Category[];
    },

    findById: async (id: string): Promise<Category | undefined> => {
      const result = await sql`
        SELECT id, name, color, description
        FROM categories
        WHERE id = ${id}
      `;
      return result[0] as unknown as Category | undefined;
    },
  },
};
