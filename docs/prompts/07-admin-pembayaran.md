# 07 — Admin Panel, Pembayaran, Hardening

## Tujuan

Kamu (superadmin) bisa mengelola bisnis: order, user, undangan, domain, kuota WA, pemakaian AI. Pembeli bisa membayar dan langsung mendapat akses wizard.

## Baca dulu

- `docs/RENCANA.md` §7, §13, §14
- `docs/prompts/02-auth-dashboard.md` (role & helper otorisasi)

## Scope

### Pembayaran

- Halaman paket + checkout (harga **selalu** dari DB, bukan dari client).
- Midtrans Snap: buat transaksi, redirect, halaman selesai/gagal.
- Webhook `/api/webhooks/midtrans`: verifikasi signature SHA512, idempoten via `provider_ref`, state `pending → paid|failed|expired`.
- `paid` → buat user (bila baru) + undangan draft + magic link + aktifkan kuota paket.
- Refund/expired → cabut akses tulis, undangan tetap bisa dibaca sampai `expires_at`.

### Admin panel

- `/admin`: ringkasan (order hari ini, pendapatan, tenant aktif, pesan WA terkirim, biaya AI).
- `/admin/orders`: filter status, detail, verifikasi manual, refund.
- `/admin/users`: daftar user, role, reset password, nonaktifkan.
- `/admin/invitations`: cari tenant, lihat status, perpanjang, arsipkan.
- `/admin/domains`: status verifikasi, paksa cek ulang.
- `/admin/whatsapp`: antrean, pesan gagal + alasan, kirim ulang, atur kuota.
- `/admin/ai`: pemakaian token per tenant, atur kuota.
- `/admin/packages`: CRUD paket.
- `/admin/settings`: konfigurasi global (provider WA, model AI default, jam tenang).
- Impersonate user (read-only) — **wajib** tercatat di `audit_log`.

### Hardening

- Rate limit endpoint publik + Turnstile pada RSVP/guestbook.
- Backup harian DB (dokumentasikan prosedur restore).
- Log terstruktur + alert untuk: webhook gagal, pesan WA gagal > 10%, error 500.
- `robots.txt`/`sitemap.xml`, halaman 404/500 yang ramah.
- Dokumen singkat: `docs/OPERASIONAL.md` (cara refund, cara ganti provider WA, cara restore).

## Kontrak

- Semua aksi admin menulis `audit_log`.
- Webhook selalu idempoten: kirim ulang tidak menggandakan order/kuota.
- Uang tidak pernah dihitung di client.
- Impersonate tidak boleh bisa mengubah data tanpa jejak.

## Langkah

1. Skema order/paket (sudah ada di fase 01) + seed paket.
2. Checkout + Snap + halaman status.
3. Webhook + idempotensi + test signature salah.
4. Panel admin per halaman (mulai dari orders).
5. Kuota WA/AI terhubung ke paket.
6. Rate limit + audit + dokumentasi operasional.

## Acceptance criteria

- [ ] Webhook dengan signature salah ditolak (400) dan tidak mengubah status.
- [ ] Webhook dikirim dua kali tidak menggandakan order/kuota.
- [ ] Harga di client tidak bisa menurunkan total order.
- [ ] Setelah `paid`, user menerima magic link dan wizard terbuka.
- [ ] Owner tidak bisa membuka halaman `/admin/*`.
- [ ] Semua aksi admin tercatat di `audit_log`.
- [ ] Refund mencabut akses tulis tetapi undangan tetap bisa dibaca.
- [ ] Rate limit terbukti menolak (429) saat diuji.

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: checkout sandbox → bayar → cek order `paid` → buka magic link → jalankan wizard. Lalu kirim webhook dua kali.

## Serahkan

Daftar env baru, prosedur refund/restore, dan hasil uji webhook.
