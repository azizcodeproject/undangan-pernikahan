# 00 — Konteks Wajib (tempel di setiap sesi)

Kamu bekerja di repo `undangan-pernikahan`, sebuah aplikasi undangan pernikahan digital yang sedang diubah dari **single-tenant** menjadi **platform SaaS multi-tenant**.

## Tugasmu

Implementasikan **satu fase** dari rencana. Fase ditentukan oleh prompt setelah ini. Jangan mengerjakan fase lain.

## Baca dulu, sebelum menulis kode

1. `AGENTS.md` — aturan repo.
2. `docs/RENCANA.md` — rencana produk, skema, route, keputusan.
3. `node_modules/next/dist/docs/` — **wajib** untuk API Next.js yang kamu sentuh. Versi Next di repo ini (16.x) berbeda dari yang umum di data latihan. Jangan mengarang API Next.
4. File yang relevan dengan fase (disebut di prompt fase).

Kalau `node_modules` belum ada, jalankan `npm i` lebih dulu.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4
- Zod 4 untuk validasi
- AI SDK 7 (`ai`, `@ai-sdk/openai`, nanti tambah provider lain)
- Vercel Blob untuk media
- Vitest untuk test
- Target DB: **Neon Postgres + Drizzle ORM** (diputuskan)
- Auth: **Auth.js** (diputuskan)
- AI default: **Google Gemini free tier** (diputuskan), via registry provider
- WhatsApp: **Meta Cloud API** (diputuskan), adapter + stub untuk test
- Deploy: Vercel

## Peta repo saat ini

```
app/
  page.tsx                  undangan publik (single tenant)
  admin/page.tsx            CMS satu halaman
  api/{ai,upload,rsvp,messages,gallery,wedding,cms}/route.ts
components/
  invitation/*              komponen undangan (murni props, bisa dipakai ulang)
  admin/AdminApp.tsx        editor konten + galeri + tamu + AI planner
  ai/WeddingChat.tsx        chat AI
lib/
  types.ts                  tipe konten undangan
  store.ts                  baca/tulis dokumen
  data-store.ts             adapter JSON lokal / Vercel Blob
  auth.ts                   cookie HMAC satu password
  design-tokens.ts          token desain
data/*.json                 data seed
```

## Konvensi wajib

- Bahasa kode & nama variabel: **Inggris**. Komentar dan teks UI: **Indonesia**.
- Semua akses database lewat `lib/repos/*`. Komponen tidak boleh query DB.
- Setiap fungsi repo yang menyentuh data tenant menerima `invitationId` dan `actorUserId`, dan memeriksa kepemilikan.
- Validasi input di server dengan Zod, bukan hanya di client.
- Uang: integer rupiah. Waktu: `timestamptz` (UTC), tampilkan dalam `Asia/Jakarta`.
- Jangan menambah dependency baru tanpa menjelaskan alasannya.
- Jangan menghapus atau menimpa `AGENTS.md` bagian `nextjs-agent-rules` (dibuat otomatis oleh `next dev`).
- Pertahankan komponen `components/invitation/*` tetap murni props.

## Definition of Done (setiap fase)

- [ ] `npm run lint` tanpa error baru
- [ ] `npm run test` lulus
- [ ] `npm run build` sukses
- [ ] Acceptance criteria di prompt fase terpenuhi semua
- [ ] Tidak ada regresi pada undangan tenant #1
- [ ] Tidak ada rahasia (API key, password) di kode atau commit
- [ ] Ringkasan perubahan per file diberikan di akhir

## Cara kerja yang diharapkan

1. Ringkas rencana implementasi (maks 10 bullet) sebelum menulis kode.
2. Sebutkan asumsi yang kamu ambil.
3. Implementasi bertahap: skema → repo → route/action → UI.
4. Setelah selesai: daftar file berubah, cara menguji manual, dan risiko yang tersisa.
5. Kalau ada keputusan produk yang belum jelas, **bertanya dulu**. Jangan mengarang.

## Larangan

- Jangan menulis ke database produksi atau menjalankan migrasi destruktif.
- Jangan menyentuh project/deployment Vercel lama milik `yusufsintia` (live, dipakai Januari 2027).
- Jangan mengubah data di `data/*.json` sebagai cara "menyelesaikan" masalah.
- Jangan memakai gateway WhatsApp tidak resmi tanpa persetujuan pemilik.
- Jangan menaruh kredensial di client bundle atau di file yang di-commit.
- Jangan menulis ulang seluruh aplikasi sekaligus.
