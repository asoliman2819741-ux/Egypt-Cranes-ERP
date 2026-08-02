import postgres from 'postgres';

const connectionString = (import.meta as any).env?.DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:[YOUR-PASSWORD]@db.thyudheynriuiqvxagnd.supabase.co:5432/postgres';

export const sql = postgres(connectionString);

export default sql;
