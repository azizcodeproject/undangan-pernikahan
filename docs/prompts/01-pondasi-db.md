# 01 — Pondasi & Database

## Tujuan

Siapkan lapisan data yang bisa menampung banyak undangan, tanpa mematikan undangan yang sekarang live. Fase ini **belum** membuat UI baru.

## Baca dulu

- `docs/RENCANA.md` §2, §5, §7
- `lib/data-store.ts`, `lib/store.ts`, `lib/types.ts`
- `data/wedding.json`, `data/gallery.json`, `data/messages.json`, `data/rsvp.json`

## Scope

Termasuk:

- Tambah Postgres + Drizzle, konfigurasi env, skrip `db:generate`, `db:migrate`, `db:seed`.
- Neon: `DATABASE_URL` (pooled, host `-pooler`) untuk runtime, `DIRECT_URL` untuk migrasi/drizzle-kit. Jangan pakai koneksi langsung di serverless.
- Skema sesuai `docs/RENCANA.md` §7 (semua tabel inti, enum, index, unique constraint).
- Interface repo: `lib/repos/*` dengan dua implementasi sementara — `json` (bungkus store lama) dan `postgres`.
- Pemilihan implementasi lewat env `DATA_BACKEND=json|postgres`.
- Migrasi data tenant #1 dari `data/*.json` ke DB, idempoten.
- Test unit untuk repo + migrasi.

Tidak termasuk:

- Auth, UI wizard, WhatsApp, AI, domain, pembayaran.

## Kontrak

```ts
// lib/repos/invitations.ts
getById(id, actorUserId): Promise<Invitation>
getBySlug(slug): Promise<Invitation | null>
listByOwner(ownerId): Promise<Invitation[]>
createDraft(input, actorUserId): Promise<Invitation>
updateDraft(id, patch, actorUserId): Promise<Invitation>
publish(id, actorUserId): Promise<Invitation>
```

Aturan:

- Repo **wajib** memeriksa kepemilikan; lempar `ForbiddenError` bila bukan pemilik.
- `publish()` menyalin `content`/`theme` → `published_*`, menaikkan `published_version`, menulis `invitation_versions`.
- Slug divalidasi: huruf kecil, angka, tanda hubung, 3–40 karakter, bukan slug terpesan (§8).

## Langkah

1. Tulis `lib/db/schema.ts` + `drizzle.config.ts`.
2. Buat migrasi awal; pastikan `drift` tidak ada.
3. Tulis interface + dua implementasi repo.
4. Pindahkan pembacaan undangan publik dan API lama ke repo (perilaku tetap sama).
5. Skrip `scripts/migrate-tenant-1.ts` + `scripts/seed.ts`.
6. Test: repo, validasi slug, migrasi idempoten.

## Aturan tenant #1 (`yusufsintia`)

- Undangan ini **sudah live** dan dipakai Januari 2027. Perlakuan sebagai data produksi.
- Migrasi hanya membaca (`read-only`) dari `data/*.json`. Jangan pernah menghapus atau menimpa Blob.
- Data asli ada di Vercel Blob, bukan di repo. Backup dijalankan pemilik dengan token (`npm run backup:blob`).
- Migrasi harus **idempoten** dan bisa diulang setelah backup terbaru.
- Jangan mengubah deployment/domain lama. Kerja hanya di DB baru.
- Uji memakai data salinan, bukan data RSVP produksi.

## Acceptance criteria

- [ ] `npm run build` sukses dengan `DATA_BACKEND=json` **dan** `postgres`.
- [ ] Undangan lama tetap tampil identik setelah pindah ke repo.
- [ ] Migrasi dijalankan dua kali tidak menduplikasi data.
- [ ] `getById` dengan user lain mengembalikan `ForbiddenError`.
- [ ] Tidak ada akses `fs` atau `@vercel/blob` di luar adapter.
- [ ] Semua query punya index yang sesuai untuk filter utama.

## Verifikasi

```sh
npm run lint && npm run test && npm run build
DATA_BACKEND=postgres npm run db:migrate && npm run db:seed
```

## Serahkan

Daftar file berubah, diagram singkat alur repo, hasil test, dan catatan migrasi.
