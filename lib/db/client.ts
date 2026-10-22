import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { normalizeConnectionString } from "./url";

/**
 * Satu pool per proses. Di serverless, pool dipakai ulang antar request dan
 * ditutup otomatis oleh Vercel saat instance di-suspend.
 */
const globalForDb = globalThis as unknown as {
  neonPool?: Pool;
  neonDb?: NodePgDatabase<typeof schema>;
};

function createPool(): Pool {
  const connectionString = normalizeConnectionString(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum diisi. Jalankan `neon env pull` atau isi .env.local.",
    );
  }

  const pool = new Pool({ connectionString, max: 5 });

  if (process.env.VERCEL) {
    // Vercel Fluid Compute: tutup koneksi idle sebelum instance di-suspend.
    void import("@vercel/functions")
      .then(({ attachDatabasePool }) => attachDatabasePool(pool))
      .catch(() => undefined);
  }

  return pool;
}

export function getPool(): Pool {
  if (!globalForDb.neonPool) {
    globalForDb.neonPool = createPool();
  }
  return globalForDb.neonPool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.neonDb) {
    globalForDb.neonDb = drizzle(getPool(), { schema });
  }
  return globalForDb.neonDb;
}

export { schema };
