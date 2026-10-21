# Rencana Produk — Platform Undangan Digital (Multi-Tenant SaaS)

Status: disetujui sebagian — 21 Okt 2026
Sudah diputuskan: Neon + Drizzle, Auth.js, AI default Google Gemini, WhatsApp Meta Cloud API.
Pemilik: Aziz
Repo: `azizcodeproject/undangan-pernikahan`

---

## 1. Ringkasan

Ubah aplikasi undangan satu-pengantin menjadi **platform SaaS**:

- Pembeli bayar → dapat akses wizard inisialisasi undangan.
- User mengisi konten & desain lewat **wizard** atau **AI agent** (atau manual).
- User melihat **preview**, memilih **alamat undangan** (slug/domain), lalu publish.
- User memasukkan **kontak tamu**, memilih template pesan WhatsApp, dan **menjadwalkan pengiriman** (sekaligus atau per kontak).
- Kamu punya **admin panel** untuk mengelola order, user, undangan, domain, kuota WA, dan pemakaian AI.

Prinsip kerja: **evolusi, bukan tulis ulang**. Komponen undangan, editor admin, dan tool AI yang sudah ada dipertahankan, lalu diberi konteks tenant.

---

## 2. Kondisi saat ini (fakta dari kode)

| Area | Kondisi | File |
| --- | --- | --- |
| Framework | Next.js 16.3.6 (App Router), React 19, TS, Tailwind 4, Zod 4 | `package.json` |
| Konten | Satu pernikahan, tipe `WeddingContent` | `lib/types.ts`, `data/wedding.json` |
| Penyimpanan | JSON file lokal; di Vercel pakai Vercel Blob (termasuk trik revisi untuk tamu) | `lib/data-store.ts`, `lib/store.ts` |
| Auth | Satu password `CMS_PASSWORD`, cookie HMAC, tanpa user/role | `lib/auth.ts` |
| Admin | Satu halaman, tab: galeri, undangan, tamu, AI planner | `components/admin/AdminApp.tsx` (992 baris) |
| Undangan publik | Render langsung dari store, nama tamu via `?to=` | `app/page.tsx`, `components/invitation/InvitationApp.tsx` |
| RSVP & buku tamu | API global, tanpa `invitation_id` | `app/api/rsvp/route.ts`, `app/api/messages/route.ts` |
| AI | Chat streaming, 7 tool, menulis seluruh `wedding.json` | `app/api/ai/route.ts` (644 baris) |
| Yang belum ada | Database, multi-tenant, role, order/pembayaran, WhatsApp, domain, preview, versioning | — |

Konsekuensi: semua asumsi "hanya ada satu undangan" tertanam di store, API, dan AI. Ini yang harus diputus lebih dulu.

---

## 3. Masalah yang harus diselesaikan

1. **Tanpa tenant** — `writeWedding()` menimpa satu dokumen. Dua user akan saling menimpa.
2. **Tanpa identitas** — tidak ada user, sehingga tidak ada kepemilikan data.
3. **Tanpa DB** — Blob cocok untuk aset, buruk untuk query (tamu, jadwal, status kirim, laporan).
4. **Tanpa isolasi** — API RSVP/guestbook/AI tidak memeriksa kepemilikan.
5. **Tanpa antrean** — pengiriman WA terjadwal butuh worker + status + retry.
6. **Tanpa versi** — AI menulis langsung; tidak ada undo/rollback.
7. **Tanpa entitlement** — belum ada konsep paket, kuota, masa aktif.

---

## 4. Target produk

### Peran

| Peran | Akses |
| --- | --- |
| `superadmin` (kamu) | Semua tenant, order, domain, kuota, AI usage, audit log |
| `owner` (pembeli) | Undangan miliknya: wizard, editor, tamu, broadcast, domain, preview |
| `guest` | Undangan publik, RSVP, buku tamu (tanpa akun) |

### Alur utama

```
Landing/paket → Checkout → Pembayaran (webhook) → Akun dibuat + magic link
   → Wizard (tema → mempelai → acara → cerita → galeri → hadiah → musik → tamu → alamat)
   → Preview → Publish → Bagikan link
   → Input kontak tamu → pilih template WA → jadwalkan (semua / per kontak) → kirim → pantau status
```

---

## 5. Keputusan teknis (rekomendasi + alternatif)

| Area | Rekomendasi | Alasan | Alternatif |
| --- | --- | --- | --- |
| Database | **Postgres (Neon) + Drizzle ORM** — diputuskan | Serverless-friendly, migrasi SQL jelas, biaya awal 0 | Supabase, Prisma |
| Auth | **Auth.js** (credentials + magic link) — diputuskan | Butuh role, session, email | Better Auth, Supabase Auth |
| Konten undangan | Kolom `jsonb` + snapshot versi | Bentuk data sudah JSON; wizard autosave gampang; hindari 20 tabel konten | Normalisasi penuh (lebih lambat dibangun) |
| Data yang di-query | Tabel relasional (guest, wa_messages, orders, domains) | Butuh filter, jadwal, laporan | — |
| Aset/media | Tetap Vercel Blob | Sudah jalan, CDN bagus | Supabase Storage, S3/R2 |
| Antrean WA | Tabel `wa_messages` + cron dispatcher (klaim baris `SKIP LOCKED`) | Tidak perlu infra baru; idempoten; mudah diaudit | Upstash QStash (delay presisi), Inngest |
| WhatsApp | **Meta Cloud API** (resmi) — diputuskan; gateway lokal hanya opsi darurat | Aman dari banned, status delivered/read akurat | Gateway QR (murah, risiko nomor diblokir) |
| AI | Abstraksi provider lewat AI SDK; **default Google Gemini free tier** — diputuskan; fallback Groq/OpenRouter free | Butuh jalan tanpa biaya; gampang ganti model | OpenAI saja, atau Ollama/LM Studio lokal |
| Pembayaran | Midtrans Snap (QRIS/VA/e-wallet) | Standar Indonesia, webhook jelas | Xendit, transfer manual + verifikasi admin |
| Domain | Subdomain gratis `slug.domainkita.com`; custom domain berbayar via Vercel Domains API | Naik kelas harga | Semua custom domain |

Catatan domain: wildcard subdomain di Vercel perlu domain dengan nameserver Vercel. Kalau belum mau itu, tahap awal cukup `/[slug]` di satu domain.

---

## 6. Arsitektur

```
Browser
  ├─ /                     landing + paket
  ├─ /[slug]               undangan publik (tenant)
  ├─ /preview/[token]      preview draft (token bertanda tangan)
  ├─ /dashboard/...        area owner
  └─ /admin/...            area superadmin
        │
        ▼
Next.js (Vercel)
  ├─ Route handlers / server actions
  ├─ lib/tenant.ts         resolve host/slug → invitation
  ├─ lib/repos/*           satu-satunya pintu ke DB
  ├─ lib/ai/*              provider + patch executor
  └─ lib/wa/*              provider + queue
        │
        ├─ Postgres (Neon)  ← data
        ├─ Vercel Blob      ← foto/audio
        ├─ Cron (1 menit)   ← dispatch WA, verifikasi domain, expiry
        └─ Webhook          ← Midtrans, WhatsApp status
```

Aturan arsitektur:

1. Semua akses DB lewat `lib/repos/*`. Tidak ada query di komponen.
2. Setiap fungsi repo yang menyentuh data tenant **wajib** menerima `invitationId` + `actorUserId` dan memeriksa kepemilikan.
3. Komponen undangan tetap murni props (`InvitationApp` tidak boleh baca DB).
4. Data publik dibaca dari `published_content`, bukan `content` (draft).

---

## 7. Skema database (inti)

Tipe `uuid` untuk PK, `timestamptz` untuk waktu, uang dalam `integer` rupiah.

| Tabel | Kolom penting | Aturan |
| --- | --- | --- |
| `users` | id, email (unik), name, phone, role, password_hash?, created_at | role: `superadmin`/`owner` |
| `sessions` | id, user_id, token_hash, expires_at, ip, user_agent | kalau tidak pakai Auth.js |
| `packages` | id, code (unik), name, price_idr, max_guests, wa_quota, ai_token_quota, allow_custom_domain, active | data paket |
| `orders` | id, user_id, package_id, invitation_id?, provider, provider_ref (unik), amount_idr, status, paid_at, raw jsonb | status: `pending`/`paid`/`failed`/`expired`/`refunded` |
| `invitations` | id, owner_id, slug (unik), template_id, status, content jsonb, theme jsonb, published_content jsonb, published_theme jsonb, published_version, published_at, expires_at, created_at, updated_at | status: `draft`/`published`/`archived` |
| `invitation_versions` | id, invitation_id, version, snapshot jsonb, label, created_by, created_at | unik (invitation_id, version) |
| `media` | id, invitation_id, kind, url, pathname, mime, bytes, width, height | kind: `cover`/`couple`/`gallery`/`music` |
| `guests` | id, invitation_id, name, phone_e164?, group_label, token (unik), rsvp_status, link_opened_at | unik (invitation_id, phone_e164) |
| `rsvp_entries` | id, invitation_id, guest_id?, name, attendance, guest_count, message | attendance: `yes`/`no`/`maybe` |
| `guestbook_messages` | id, invitation_id, guest_id?, name, message, approved | moderasi |
| `wa_templates` | id, invitation_id, name, body, variables jsonb, provider_template_name? | variabel `{{nama}}`, `{{link}}` |
| `wa_batches` | id, invitation_id, name, scheduled_at, status, total, sent, failed | status: `draft`/`scheduled`/`running`/`done`/`paused`/`canceled` |
| `wa_messages` | id, batch_id, invitation_id, guest_id, phone_e164, body, scheduled_at, sent_at, status, provider, provider_message_id, error, attempts | index (status, scheduled_at) |
| `domains` | id, invitation_id, hostname (unik), type, status, vercel_domain_id, verified_at | type: `subdomain`/`custom` |
| `ai_usage` | id, invitation_id, user_id, provider, model, prompt_tokens, completion_tokens, created_at | dasar kuota |
| `audit_log` | id, actor_id, action, target_type, target_id, meta jsonb, created_at | semua aksi tulis admin |
| `app_settings` | key (pk), value jsonb | konfigurasi global |

Index minimum: `invitations(slug)`, `invitations(owner_id)`, `invitations(status, expires_at)`, `guests(invitation_id)`, `wa_messages(status, scheduled_at)`, `orders(provider_ref)`, `domains(hostname)`.

Migrasi tenant #1: salin `data/wedding.json` → `invitations.content`, `data/gallery.json` → `media`, `messages/rsvp` → tabel masing-masing.

---

## 8. Peta route

Publik:

```
/                              landing + paket
/[slug]                        undangan publik
/[slug]/r/rsvp                 (POST) RSVP
/[slug]/r/guestbook            (POST) buku tamu
/preview/[token]               preview draft
```

Owner:

```
/login  /register  /forgot
/dashboard                     daftar undangan
/dashboard/[id]/wizard/[step]  wizard
/dashboard/[id]/edit           editor manual
/dashboard/[id]/ai             AI agent
/dashboard/[id]/guests         tamu + import
/dashboard/[id]/broadcast      template + jadwal WA
/dashboard/[id]/domain         alamat & domain
/dashboard/[id]/billing        order & kuota
```

Superadmin:

```
/admin                          ringkasan
/admin/orders                   order + verifikasi
/admin/users                    user
/admin/invitations              tenant
/admin/domains                  domain
/admin/whatsapp                 antrean + kuota
/admin/ai                       pemakaian AI
/admin/packages                 paket
/admin/settings                 konfigurasi
```

API:

```
POST /api/ai                    chat agen (scoped invitation)
POST /api/upload                upload media (scoped + kuota)
POST /api/webhooks/midtrans     pembayaran
POST /api/webhooks/whatsapp     status kirim
GET  /api/cron/wa-dispatch      dispatcher (tiap menit)
GET  /api/cron/domain-verify    verifikasi domain
GET  /api/cron/expiry           arsip undangan kedaluwarsa
```

Slug yang dipesan (tidak boleh dipakai tenant): `admin`, `dashboard`, `api`, `login`, `register`, `preview`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`.

---

## 9. Wizard

| # | Step | Isi | Validasi |
| --- | --- | --- | --- |
| 1 | `template` | pilih tema (6 preset + custom) | wajib |
| 2 | `couple` | nama panggilan, nama lengkap, orang tua, foto | nama wajib |
| 3 | `event` | akad/resepsi: tanggal, jam, venue, alamat, maps | minimal 1 acara |
| 4 | `story` | bab cerita (tanggal, judul, isi) | opsional |
| 5 | `gallery` | upload foto, caption, urutkan | opsional, maks 20 |
| 6 | `gift` | rekening/e-wallet + catatan | opsional |
| 7 | `music` | file atau YouTube | opsional |
| 8 | `guests` | import kontak (CSV/manual), grup | opsional |
| 9 | `address` | slug + cek ketersediaan | wajib, unik |
| 10 | `review` | preview + publish | semua valid |

Aturan:

- Autosave per step (debounce 800 ms) ke `invitations.content`.
- Wizard bisa ditinggalkan; status tetap `draft`.
- `review` menampilkan iframe preview (`/preview/[token]`).
- Publish = snapshot `content`/`theme` → `published_*`, `published_version++`, catat `invitation_versions`, `revalidateTag`.

---

## 10. Alur WhatsApp

### Model kirim

- Satu baris `wa_messages` per tamu per batch → jadwal bisa seragam (bulk) atau berbeda (per kontak).
- User melihat estimasi: jumlah pesan, kuota tersisa, biaya (kalau ada).

### State machine

```
queued → sending → sent → delivered → read
                 ↘ failed (attempts < 3, backoff 1m/5m/30m)
                 ↘ skipped (opt-out / nomor invalid / kuota habis)
```

### Dispatcher (cron tiap menit)

1. Ambil baris `queued` dengan `scheduled_at <= now()`, kunci `FOR UPDATE SKIP LOCKED`, `LIMIT 50`.
2. Lewati yang di luar jam tenang (08:00–21:00 Asia/Jakarta).
3. Cek kuota paket + masa aktif undangan.
4. Kirim via provider → simpan `provider_message_id`.
5. Gagal → `attempts++`, jadwalkan ulang, atau `failed`.
6. Webhook provider memperbarui `delivered`/`read`.

### Guardrail

- Nomor dinormalisasi ke E.164 (`+62...`).
- Opt-out per tamu (`guests.opt_out_at`).
- Idempoten: kunci (batch_id, guest_id).
- Batas laju per tenant (mis. 1 pesan/detik) agar tidak diblokir provider.
- Log setiap kegagalan + alasan yang bisa dibaca user.

---

## 11. AI agent

Tujuan: user bisa menyunting isi & desain dengan bahasa natural, gratis atau murah, tanpa merusak data.

| Aspek | Keputusan |
| --- | --- |
| Provider | Registry `AI_PROVIDER` (openai/google/groq/openrouter/ollama) + `AI_MODEL` + `AI_BASE_URL` |
| Default gratis | **Google Gemini** (`AI_PROVIDER=google`); fallback Groq atau OpenRouter `:free` |
| Pola tulis | AI menghasilkan **patch JSON tervalidasi**, server yang menerapkan ke draft |
| Tool | Satu tool `applyDraftPatch` + `updateTheme`; bukan 7 tool terpisah |
| Undo | Setiap patch membuat `invitation_versions`; user bisa rollback |
| Kuota | Hitung token dari `ai_usage`, tolak bila melewati `ai_token_quota` |
| Privasi | Jangan kirim nomor tamu / data RSVP ke model |
| Fallback | Model tanpa tool-calling → `generateObject` dengan skema Zod |

Alasan patch: model gratis sering gagal memanggil banyak tool; patch tunggal lebih murah token, mudah divalidasi, dan aman.

---

## 12. Domain

1. **Subdomain gratis**: `slug.undangan.id` → wildcard DNS ke Vercel, resolve lewat `lib/tenant.ts`.
2. **Custom domain**: user input domain → `POST` Vercel Domains API → tampilkan instruksi CNAME/A → cron verifikasi → status `active`.
3. Middleware: baca `host`; jika cocok `domains.hostname` status `active`, rewrite ke `/i/[slug]` (internal), jangan tampilkan slug asli.
4. Cache: halaman publik pakai tag `invitation:{id}`; publish/update domain memanggil `revalidateTag`.

---

## 13. Pembayaran & entitlement

- Order dibuat server-side (harga dari DB, jangan dari client).
- Webhook Midtrans: verifikasi signature SHA512(`order_id + status_code + gross_amount + server_key`), idempoten via `provider_ref`.
- `paid` → buat `invitations` draft + kirim magic link + aktifkan kuota dari `packages`.
- Refund/expired → cabut akses tulis, undangan tetap bisa dibaca sampai `expires_at`.

---

## 14. Keamanan & kepatuhan

- Otorisasi di setiap repo call: `assertOwner(invitationId, userId)`; jangan percaya ID dari client.
- Rate limit endpoint publik (RSVP, guestbook, preview) + Cloudflare Turnstile.
- Upload: whitelist MIME, batas ukuran, nama file acak, jangan pernah render SVG user.
- Preview token: HMAC + expiry, tidak bisa ditebak.
- PII tamu: enkripsi nomor? minimal akses terbatas + hapus atas permintaan (UU PDP).
- Audit log untuk aksi admin (impersonate, ubah kuota, refund).
- Rahasia hanya di env Vercel; jangan pernah ke client bundle.

---

## 15. Roadmap

| Fase | Hasil | Estimasi |
| --- | --- | --- |
| P0 | Rapikan repo, branch, env, adapter data-layer (JSON ↔ Postgres) | 1–2 hari |
| P1 | Skema + migrasi + seed; auth + role; shell dashboard | 4–6 hari |
| P2 | Wizard + upload + preview + publish + versi | 6–8 hari |
| P3 | Routing multi-tenant (slug, custom domain) + cache | 3–5 hari |
| P4 | Tamu + link personalisasi + RSVP ter-scope | 3–4 hari |
| P5 | WhatsApp: template, batch, jadwal, dispatcher, webhook, kuota | 7–10 hari |
| P6 | AI agent per tenant (provider gratis, patch, undo, kuota) | 5–7 hari |
| P7 | Admin panel + pembayaran + laporan | 6–8 hari |
| P8 | Hardening: test, rate limit, backup, observability, legal | 4–6 hari |

Total realistis (solo, part-time): **8–11 minggu**.

Gate tiap fase: `npm run lint && npm run test && npm run build` hijau + acceptance criteria terpenuhi + tidak ada regresi pada undangan tenant #1.

---

## 16. Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Gateway WA tidak resmi | Nomor diblokir, pesan gagal massal | Mulai dari Cloud API resmi; kalau pakai gateway, batasi laju + peringatan |
| Model AI gratis | Rate limit, tool-calling buruk | Registry provider + fallback `generateObject` + antrean retry |
| Cron Vercel (plan gratis) | Jadwal tidak presisi | Dispatcher idempoten; pertimbangkan QStash |
| Migrasi data lama | Undangan aktif rusak | Adapter + snapshot sebelum migrasi, tenant #1 diuji lebih dulu |
| Biaya Blob | Membengkak | Kuota media per paket, kompresi gambar |
| Scope melebar | Tidak selesai | Ikuti urutan fase; fitur di luar daftar masuk backlog |

---

## 17. Keputusan

### Sudah diputuskan (21 Okt 2026)

| Topik | Keputusan | Konsekuensi |
| --- | --- | --- |
| Database + auth | Neon Postgres + Drizzle + Auth.js | Fase 1 & 2 tidak perlu menimbang alternatif |
| WhatsApp | Meta Cloud API resmi | Perlu WABA, nomor terverifikasi, dan template disetujui sebelum uji kirim nyata |
| AI default | Google Gemini free tier | Perlu `GOOGLE_GENERATIVE_AI_API_KEY`; provider lain tetap didukung lewat registry |
| Undangan live | `yusufsintia` = **tenant #1**, tidak boleh hilang | Wajib backup + dual-run, lihat §18 |
| Produksi saat acara | **Dual-run** — deployment lama tetap live sampai acara selesai | Sistem baru tidak menggantikan produksi sebelum cutover |

### Menyusul (tidak menghambat fase 1–3)

1. Pembayaran: **Midtrans** sekarang, atau transfer manual + verifikasi admin dulu?
2. Domain utama platform: subdomain gratis, custom domain berbayar, atau keduanya?

---

## 18. Rencana aman untuk `yusufsintia` (dipakai Januari 2027)

### Prinsip

Undangan yang sudah live **bukan tempat eksperimen**. Data tamu, RSVP, dan buku tamu tidak boleh bergantung pada kode yang belum teruji. Jadi: `yusufsintia` menjadi tenant #1 di **data**, tetapi **produksinya tetap di deployment lama** sampai acara selesai.

### Fakta penting

- `data/*.json` di repo hanya **seed**, bukan data produksi.
- Sumber kebenaran saat ini: **Vercel Blob** (`data/wedding.json`, revisi `live/rsvp/`, `live/messages/`, dan `uploads/`).
- Token Blob tidak ada di mesin lokal → backup harus dijalankan dengan token dari Vercel.

### Backup (kerjakan sekarang, sebelum fase 1)

1. Buat `.env.local` di root repo (sudah di-ignore git):

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

2. Jalankan:

```sh
npm i
npm run backup:blob -- --images
```

- Hasil tersimpan di `backups/<timestamp>/`, **simpan di dua tempat** (laptop + cloud pribadi). Jangan hanya di repo (sudah di-ignore).
- Catat angkanya sebagai baseline verifikasi: jumlah tamu RSVP, jumlah pesan buku tamu, jumlah foto galeri.
- Tag kode sebelum migrasi sudah dibuat: `legacy/yusufsintia-pre-saas`.

### Baseline backup 21 Okt 2026

| Item | Nilai |
| --- | --- |
| Tanggal acara | 2027-01-10 09:00 WIB |
| Blob terdaftar / tersimpan | 13 / 13 |
| Acara / cerita / quran / rekening | 2 / 5 / 2 / 1 |
| Galeri | 6 item + 7 file upload |
| Buku tamu | 1 pesan live, 1 disetujui (seed: 2) |
| RSVP | 1 entri, status hadir |
| Arsip | `backups/2026-10-21T16-15-01-382Z/` + zip 2,8 MB |
| SHA-256 zip (24 karakter awal) | `34ab13a7ec0ae193e4b3bacf` |

**Penting:** `data/*.json` di repo adalah seed, bukan data live. Sumber kebenaran ada di revisi `live/rsvp/*.json` dan `live/messages/*.json`. Saat migrasi, revisi `live/` harus menang atas `data/`.

Simpan zip backup di **dua lokasi berbeda**. Backup ini berisi nomor/pesan tamu, jadi jangan di-commit dan jangan dibagikan lewat chat.

### Dual-run

| Jalur | Isi | Status |
| --- | --- | --- |
| Lama (produksi) | Project Vercel sekarang, domain sekarang | **Dibekukan**, tetap melayani tamu |
| Baru (SaaS) | Project Vercel baru + DB Neon, `yusufsintia` di-seed sebagai tenant #1 | Untuk pengembangan & uji |

Aturan:

- Jangan mengarahkan domain ke project baru sebelum acara selesai.
- Jangan menghapus project/deployment lama, walau sudah tidak dipakai.
- Deployment lama tetap menyimpan URL `*.vercel.app` sebagai jalan rollback.

### Freeze window

- **20 Des 2026 – 31 Jan 2027**: tidak ada deploy perubahan besar ke project lama.
- Hanya perbaikan kritis (bug RSVP/undangan rusak), dengan backup sebelum deploy.

### Cutover (setelah acara, Feb 2027)

1. Backup ulang Blob (data terbaru, termasuk RSVP setelah acara).
2. Import ke DB baru sebagai tenant #1.
3. Verifikasi: jumlah tamu, RSVP, pesan, galeri, dan konten identik dengan baseline.
4. Buka undangan baru di URL `*.vercel.app` baru → bandingkan berdampingan dengan yang lama.
5. Baru pindahkan domain.
6. Simpan project lama minimal 3 bulan setelah cutover.

### Larangan

- Jangan menjalankan migrasi destruktif ke data produksi.
- Jangan menimpa `data/*.json` sebagai cara memperbaiki migrasi.
- Jangan memakai RSVP produksi sebagai data uji.
- Jangan mengubah nomor/akun WhatsApp yang dipakai komunikasi keluarga tanpa persetujuan.
