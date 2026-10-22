# Neon Setup — Status & Wiring

Project: `super-pine-36630145`
Org: `org-gentle-rice-71212676`
Branch: `production` (`br-proud-rain-b4hdf4p8`)
Region: `aws-us-east-2`
Postgres: 18

## Yang sudah aktif

| Service | Status | Bukti |
| --- | --- | --- |
| Postgres | Aktif | 6 tabel hasil migrasi, seed tenant #1 |
| Neon Auth | Aktif | sign-up, sign-in, sign-out, protected route |
| Object Storage | Aktif | upload → presign → download (SHA-256 sama) |
| Functions | Aktif | `hello` mengembalikan `Hello from Neon Functions` |
| AI Gateway | **Tidak aktif** | Plan Free: gateway tidak melayani request |

## Perintah harian

```sh
neon status                 # kondisi branch
neon config plan            # dry-run perubahan neon.ts
neon deploy                 # terapkan neon.ts + tarik env ke .env.local
neon env pull               # tarik env saja
neon checkout dev --create  # branch baru untuk fitur
neon logs query --branch production --source function --since 1h
```

Migrasi:

```sh
npm run db:generate   # setelah mengubah lib/db/schema.ts
npm run db:migrate    # memakai DATABASE_URL_UNPOOLED
npm run db:seed       # idempoten; tidak menimpa konten yang sudah ada
```

## Peta wiring

| Service | File | Catatan |
| --- | --- | --- |
| Postgres | `lib/db/schema.ts`, `lib/db/client.ts` | Drizzle + `pg`; pooled untuk app, direct untuk migrasi; `attachDatabasePool` di Vercel |
| Repositori | `lib/repos/invitations.ts` | Satu pintu akses tenant, cek kepemilikan |
| Auth (server) | `lib/auth/server.ts` | `createNeonAuth` + cookie secret |
| Auth (proxy API) | `app/api/auth/[...path]/route.ts` | `auth.handler()` |
| Auth (UI) | `app/auth/sign-in`, `app/auth/sign-up` | Server actions |
| Dashboard | `app/dashboard` | Session check di server, bukan hanya proxy |
| Storage | `lib/storage/neon.ts` | S3 path-style, bucket private, presigned URL |
| Upload | `app/api/upload/route.ts` | Aktif bila `STORAGE_BACKEND=neon` |
| Functions | `lib/neon/functions.ts` | Baca `NEON_FUNCTION_*_BASE_URL` |
| AI Planner | `lib/ai/provider.ts` | Registry provider; default Gemini |
| Health | `app/api/neon/health/route.ts` | Uji DB, storage, functions, auth, konfigurasi AI |

## Skema saat ini

`invitations`, `invitation_versions`, `media`, `guests`, `rsvp_entries`,
`guestbook_messages`. Semua tabel tenant memakai `invitation_id`; `owner_id`
berisi ID user dari schema `neon_auth` (sengaja tanpa FK).

## AI Planner

Default: **Google Gemini free tier** (`AI_PROVIDER=google`,
`AI_MODEL=gemini-3.8-flash`). Ambil API key di
https://aistudio.google.com/apikey lalu isi `.env.local`:

```sh
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Provider lain tinggal ganti env, tanpa mengubah kode:

| `AI_PROVIDER` | Model default | Env kunci |
| --- | --- | --- |
| `google` | `gemini-3.8-flash` | `GOOGLE_GENERATIVE_AI_API_KEY` |
| `openai` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `groq` | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| `openrouter` | `openrouter/auto` | `OPENROUTER_API_KEY` |
| `ollama` | `llama3.2` | tanpa kunci (`OLLAMA_BASE_URL`) |
| `gateway` | `openai/gpt-4o-mini` | `NEON_AI_GATEWAY_TOKEN` (plan berbayar) |

`GET /api/neon/health` melaporkan `ai` beserta provider/model tanpa memanggil
model (tidak memakai kuota).

## Catatan & jebakan

- **AI Gateway butuh plan berbayar.** Jangan aktifkan `aiGateway` di `neon.ts`
  sebelum upgrade: `neon deploy` akan gagal dan env gateway akan dihapus lagi.
- `NEON_AUTH_COOKIE_SECRET` tidak di-inject Neon. Isi manual (32+ karakter).
- Bucket `assets` bersifat private. Simpan `objectKey` di Postgres, presign saat
  render; jangan simpan URL presigned karena kedaluwarsa 1 jam.
- `neon config plan` masih melaporkan `~ function hello` (metadata function).
  Tidak memengaruhi pemanggilan; jalankan `neon deploy` bila ingin rekonsiliasi.
- `pg` mencetak peringatan `sslmode` (perilaku berubah di pg v9). Aman untuk
  sekarang; saat upgrade, pakai `sslmode=verify-full`.
- Bucket `uploads` ada di branch tetapi tidak dideklarasikan di `neon.ts`.
  Jangan dihapus tanpa konfirmasi; cek dulu isinya.
- Tenant #1 `yusufsintia` di-seed dari `data/*.json` (seed repo), bukan dari
  Blob live. Backup Blob tetap sumber kebenaran produksi.

## Env untuk Vercel

Tambahkan manual di *Project → Settings → Environment Variables*:
`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`,
`NEON_AUTH_JWKS_URL`, `NEON_AUTH_COOKIE_SECRET`, `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`,
`NEON_STORAGE_BUCKET`, `STORAGE_BACKEND`, `AI_PROVIDER`, `AI_MODEL`,
`GOOGLE_GENERATIVE_AI_API_KEY`.

Jangan menyalin `.env.local` ke repo.
