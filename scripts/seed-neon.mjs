#!/usr/bin/env node
/**
 * Seed tenant #1 (`yusufsintia`) dari data/*.json ke Postgres.
 *
 * Aturan:
 * - Idempoten: dijalankan berulang tidak menggandakan baris.
 * - Tidak menimpa konten yang sudah ada (ON CONFLICT DO NOTHING), karena
 *   undangan ini dipakai Januari 2027 dan bisa sudah diedit lewat dashboard.
 * - Sumber: data/wedding.json + data/gallery.json (seed repo), BUKAN Blob live.
 */
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL belum diisi. Jalankan `neon env pull`.");
  process.exit(1);
}

const wedding = JSON.parse(await readFile("data/wedding.json", "utf8"));
const gallery = JSON.parse(await readFile("data/gallery.json", "utf8"));

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("begin");

  const inserted = await client.query(
    `insert into invitations
       (owner_id, slug, template_id, status, content, theme,
        published_content, published_at, published_version)
     values ($1, $2, $3, 'published', $4::jsonb, '{}'::jsonb, $4::jsonb, now(), 1)
     on conflict (slug) do nothing
     returning id`,
    ["seed", "yusufsintia", "elegant", JSON.stringify(wedding)],
  );

  const { rows } = await client.query(
    "select id from invitations where slug = $1",
    ["yusufsintia"],
  );
  const invitationId = rows[0]?.id;

  if (!invitationId) {
    throw new Error("Gagal menemukan undangan yusufsintia setelah insert.");
  }

  const mediaCount = await client.query(
    "select count(*)::int as count from media where invitation_id = $1",
    [invitationId],
  );

  if (mediaCount.rows[0].count === 0) {
    for (const [index, item] of gallery.entries()) {
      await client.query(
        `insert into media
           (invitation_id, kind, object_key, url, caption, sort_order)
         values ($1, 'gallery', $2, $3, $4, $5)`,
        [invitationId, item.src, item.src, item.caption ?? "", index],
      );
    }
  }

  await client.query("commit");

  console.log(
    inserted.rowCount === 1
      ? `Seed: undangan yusufsintia dibuat (id ${invitationId}).`
      : `Seed: undangan yusufsintia sudah ada (id ${invitationId}), tidak diubah.`,
  );
  console.log(`Galeri: ${gallery.length} item dipastikan ada.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
