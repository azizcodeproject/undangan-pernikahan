# 02 — Auth, Role, Dashboard

## Tujuan

Ganti login satu-password dengan akun sungguhan, tambahkan role, dan siapkan kerangka area owner serta superadmin.

## Baca dulu

- `lib/auth.ts`, `app/api/cms/login/route.ts`, `app/api/cms/session/route.ts`
- `components/admin/AdminApp.tsx` (struktur tab)
- `docs/RENCANA.md` §4, §8, §14

## Scope

Termasuk:

- Auth: email + password, plus magic link untuk hasil pembelian.
- Tabel `users`, `sessions` (atau Auth.js) dengan role `superadmin`/`owner`.
- Middleware proteksi `/dashboard/*` dan `/admin/*`; `superadmin` hanya untuk role yang sesuai.
- Shell dashboard: sidebar, header, pemilih undangan, status publish.
- Halaman `/login`, `/register`, `/forgot`, `/reset/[token]`.
- Logout, sesi kedaluwarsa, redirect setelah login.
- Rate limit login (mis. 5 percobaan/menit/IP).
- Admin awal dibuat lewat seed dari env (`SUPERADMIN_EMAIL`), bukan hardcode.

Tidak termasuk:

- Wizard, pembayaran, WhatsApp, AI.

## Kontrak

- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, umur 30 hari.
- Helper: `requireUser()`, `requireSuperadmin()`, `getActor()`.
- Setiap server action/route memanggil helper ini; jangan hanya mengandalkan middleware.
- Redirect: belum login → `/login?next=...`; role salah → 403.

## Langkah

1. Pakai **Auth.js** (sudah diputuskan). Jangan membangun session sendiri. Konfigurasi provider Credentials + Email (magic link).
2. Skema user + migrasi.
3. Halaman auth + form (Zod, pesan error Indonesia).
4. Middleware + helper otorisasi.
5. Shell dashboard kosong (belum wizard) + `/admin` ringkasan kosong.
6. Test: login sukses/gagal, akses lintas role, expiry sesi.

## Acceptance criteria

- [ ] `CMS_PASSWORD` tidak lagi dipakai untuk login.
- [ ] Owner tidak bisa membuka `/admin` maupun data owner lain.
- [ ] Sesi tetap valid setelah refresh; logout menghapus cookie.
- [ ] Password disimpan sebagai hash (argon2/bcrypt), bukan plaintext.
- [ ] Tidak ada bocoran email user di pesan error login.
- [ ] Semua route dashboard mengembalikan 401/403 yang benar saat diuji tanpa sesi.

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: login → dashboard → logout → akses `/admin` sebagai owner (harus 403).

## Serahkan

Ringkasan skema auth, daftar route, dan hasil uji otorisasi.
