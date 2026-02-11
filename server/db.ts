import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const hasDatabase = !!process.env.DATABASE_URL;

if (!hasDatabase) {
  console.warn("[DB] DATABASE_URL is not set. The server will start but database operations will fail.");
  console.warn("[DB] Set DATABASE_URL in your Vercel project settings to connect a PostgreSQL database.");
}

export const pool = hasDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false,
    })
  : (null as any);

if (pool) {
  pool.on("error", (err: Error) => {
    console.error("[DB Pool] Unexpected error on idle client:", err.message);
  });
}

export const db: NodePgDatabase<typeof schema> = hasDatabase
  ? drizzle(pool, { schema })
  : (null as any);

export const isDatabaseConfigured = hasDatabase;
