# 04 — Routing Multi-Tenant & Domain

## Tujuan

Setiap undangan punya alamat sendiri: subdomain gratis dan/atau custom domain, tanpa bentrok dengan route aplikasi.

## Baca dulu

- `app/page.tsx`, `app/layout.tsx`
- `docs/RENCANA.md` §8, §12

## Scope

Termasuk:

- `app/(site)/[slug]/page.tsx` sebagai halaman undangan, memakai `published_content`.
- `lib/tenant.ts`: resolve `{ host, slug }` → invitation; cache per request.
- `middleware.ts`: host custom domain → rewrite internal ke route undangan; pertahankan path & query (`?to=`).
- Reserved slug: tolak saat pembuatan (daftar di §8).
- Halaman `/dashboard/[id]/domain`: pilih subdomain, tambah custom domain, status verifikasi, instruksi DNS.
- Integrasi Vercel Domains API (tambah/hapus/cek) dengan fallback manual bila env belum diisi.
- Cron `/api/cron/domain-verify` untuk memperbarui status.
- Metadata dinamis (title, description, OG image) per undangan.
- `revalidateTag('invitation:{id}')` saat publish/ubah domain.

Tidak termasuk:

- WhatsApp, AI, pembayaran.

## Kontrak

- `resolveInvitationByHost(host)` mengembalikan `null` untuk host tak dikenal (jangan fallback ke tenant #1).
- Custom domain hanya aktif jika `domains.status='active'` **dan** undangan `status='published'`.
- Slug case-insensitive; simpan lowercase.
- 404 untuk slug tidak ada / draft yang belum publish (kecuali lewat preview token).

## Langkah

1. Pindahkan halaman undangan ke `(site)/[slug]`, parameterkan semua data.
2. Buat resolver + middleware.
3. UI domain + verifikasi.
4. Sitemap/robots dasar untuk halaman publik.
5. Test: resolve host, slug terpesan, draft tidak bisa diakses publik, query `?to=` tetap jalan.

## Acceptance criteria

- [ ] `/[slug]` menampilkan undangan yang benar; dua tenant tidak saling bocor.
- [ ] Draft tidak bisa dibuka publik tanpa token preview.
- [ ] Host custom domain yang `active` menampilkan undangan tanpa redirect yang terlihat.
- [ ] Slug terpesan (`admin`, `api`, `dashboard`, dst.) ditolak saat wizard.
- [ ] Metadata & OG image sesuai tenant.
- [ ] Publish langsung terlihat (tag revalidasi bekerja).

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: buat dua undangan berbeda slug → buka keduanya → cek `?to=` dan metadata.

## Serahkan

Diagram alur resolve host, env baru yang dibutuhkan, dan hasil uji.
