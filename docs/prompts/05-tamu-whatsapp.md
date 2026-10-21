# 05 — Tamu, RSVP Ter-scope, WhatsApp & Penjadwalan

## Tujuan

User bisa mengelola tamu, membagikan link personalisasi, lalu mengirim undangan WhatsApp secara massal atau terjadwal per kontak — dengan status yang bisa dipantau.

## Baca dulu

- `app/api/rsvp/route.ts`, `app/api/messages/route.ts`, `app/api/gallery/route.ts`
- `components/invitation/RsvpSection.tsx`, `GuestbookSection.tsx`
- `docs/RENCANA.md` §7, §10

## Scope

### Tamu

- `/dashboard/[id]/guests`: tambah manual, import CSV (`nama,telepon,grup`), edit, hapus, cari, filter status RSVP.
- Normalisasi nomor ke E.164 (`+62`), validasi duplikat per undangan.
- Token personalisasi unik per tamu → link `https://<domain>/<slug>?to=<nama>&t=<token>`.
- RSVP & buku tamu **wajib** membawa `invitation_id`/token; tolak bila tidak cocok.
- Statistik: total tamu, sudah dibuka, RSVP hadir/tidak/mungkin.

### WhatsApp

- `/dashboard/[id]/broadcast`: pilih tamu (semua/grup/terpilih) → tulis pesan dengan variabel `{{nama}}`, `{{pasangan}}`, `{{tanggal}}`, `{{link}}` → pratinjau → jadwalkan.
- Pilihan jadwal: **kirim sekarang**, **satu waktu untuk semua**, atau **waktu berbeda per tamu**.
- Simpan sebagai `wa_batches` + `wa_messages` (satu baris per tamu).
- Dispatcher `/api/cron/wa-dispatch` tiap menit: klaim baris `queued` `FOR UPDATE SKIP LOCKED`, cek kuota + jam tenang (08:00–21:00 WIB), kirim, perbarui status, retry maks 3 dengan backoff 1m/5m/30m.
- Provider adapter `lib/wa/provider.ts`: `cloud-api` (Meta) sebagai implementasi default, `stub` untuk test/dev (hanya log). Env: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.
- Webhook `/api/webhooks/whatsapp` untuk `delivered`/`read`/`failed`, verifikasi signature.
- Kuota per paket (`packages.wa_quota`), sisa kuota tampil di UI.
- Opt-out per tamu; nomor opt-out selalu di-`skipped`.

Tidak termasuk:

- AI, pembayaran, admin panel global.

## Kontrak

- Status pesan: `queued | sending | sent | delivered | read | failed | skipped`.
- Idempoten: unik `(batch_id, guest_id)`.
- Dispatcher tidak pernah mengirim dua kali untuk baris yang sama.
- Semua akses lewat repo dengan cek kepemilikan.
- Jangan menaruh token provider di client.

## Langkah

1. Skema tamu + migrasi; ubah API RSVP/guestbook lama agar ter-scope (jaga kompatibilitas tenant #1).
2. CRUD tamu + import CSV + statistik.
3. Template pesan + pratinjau variabel.
4. Pembuatan batch: hitung total, validasi kuota, sisipkan baris.
5. Dispatcher + retry + jam tenang + rate limit per tenant.
6. Webhook status.
7. Test: normalisasi nomor, duplikat, klaim baris bersamaan, retry, opt-out, kuota habis.

## Acceptance criteria

- [ ] RSVP dari undangan A tidak masuk ke undangan B.
- [ ] Import CSV menolak baris tanpa nomor valid dan melaporkan baris gagal.
- [ ] Jadwal berbeda per tamu dihormati (uji dengan waktu dipercepat).
- [ ] Dua worker bersamaan tidak mengirim pesan yang sama.
- [ ] Pesan di luar jam tenang ditunda, bukan dibuang.
- [ ] Kuota habis → baris menjadi `skipped` dengan alasan jelas.
- [ ] Status `delivered`/`read` dari webhook terlihat di UI.
- [ ] Tidak ada provider WA sungguhan yang dipanggil saat test (`stub`).

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: import 5 tamu → buat batch "kirim sekarang" dengan provider `stub` → cek status → ubah jadwal satu tamu → jalankan dispatcher.

## Serahkan

Diagram state machine, kontrak provider, dan hasil uji konkurensi.
