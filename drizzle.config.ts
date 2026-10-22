import { defineConfig } from "drizzle-kit";
import { normalizeConnectionString } from "./lib/db/url";

const url = normalizeConnectionString(
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
);

if (!url) {
  throw new Error(
    "DATABASE_URL_UNPOOLED / DATABASE_URL belum diisi. Jalankan `neon env pull`.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
