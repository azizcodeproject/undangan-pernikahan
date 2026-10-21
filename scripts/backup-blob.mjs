#!/usr/bin/env node
/**
 * Backup seluruh dokumen di Vercel Blob ke folder lokal.
 *
 * Kenapa perlu: data produksi (isi undangan, RSVP, buku tamu) TIDAK ada di
 * repo. `data/*.json` hanya seed. Satu-satunya salinan asli ada di Blob.
 *
 * Pakai:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/backup-blob.mjs
 *   BLOB_READ_WRITE_TOKEN=... node scripts/backup-blob.mjs --images
 *
 * Hasil: backups/<timestamp>/... + manifest.json
 * Folder backups/ di-ignore git karena berisi data pribadi tamu.
 */
import { list } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error(
    "BLOB_READ_WRITE_TOKEN kosong. Ambil dari Vercel → Project → Settings → Environment Variables.",
  );
  process.exit(1);
}

const withImages = process.argv.includes("--images");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join("backups", stamp);

const manifest = [];
let cursor;
do {
  const page = await list({ token, cursor, limit: 1000 });
  for (const blob of page.blobs) {
    manifest.push({
      pathname: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    });
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

await mkdir(outDir, { recursive: true });
await writeFile(
  path.join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

let saved = 0;
let skipped = 0;

for (const item of manifest) {
  // Path traversal tidak mungkin dari Blob, tapi tetap dijaga.
  const target = path.join(outDir, item.pathname);
  if (!target.startsWith(outDir + path.sep)) {
    skipped += 1;
    continue;
  }

  const isJson = item.pathname.endsWith(".json");
  if (!isJson && !withImages) {
    skipped += 1;
    continue;
  }

  const response = await fetch(item.url, { cache: "no-store" });
  if (!response.ok) {
    console.warn(`GAGAL ${item.pathname} (HTTP ${response.status})`);
    skipped += 1;
    continue;
  }

  await mkdir(path.dirname(target), { recursive: true });
  if (isJson) {
    await writeFile(target, await response.text(), "utf8");
  } else {
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
  }
  saved += 1;
}

console.log(`Blob terdaftar : ${manifest.length}`);
console.log(`File tersimpan: ${saved}`);
console.log(`Dilewati       : ${skipped}${withImages ? "" : " (pakai --images untuk media)"}`);
console.log(`Lokasi         : ${outDir}`);
