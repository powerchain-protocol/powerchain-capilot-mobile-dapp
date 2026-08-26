import type { TransactionalSqlClient, SqlExecutor } from '../credits/postgres-store.ts';

export async function createPostgresClient(connectionString: string): Promise<{ client: TransactionalSqlClient; close(): Promise<void> }> {
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString });
  const client: TransactionalSqlClient = {
    async query<Row = Record<string, unknown>>(text: string, values?: unknown[]) {
      const result = await pool.query(text, values);
      return { rows: result.rows as Row[] };
    },
    async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>) {
      const connection = await pool.connect();
      try {
        await connection.query('BEGIN');
        const result = await fn({
          async query<Row = Record<string, unknown>>(text: string, values?: unknown[]) {
            const response = await connection.query(text, values);
            return { rows: response.rows as Row[] };
          },
        });
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
      } finally {
        connection.release();
      }
    },
  };
  return { client, close: () => pool.end() };
}
