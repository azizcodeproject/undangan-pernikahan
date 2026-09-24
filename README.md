# Undangan Pernikahan Digital — Yusuf & Sintia

Website undangan pernikahan yang elegan, hangat, dan mobile-first. Dibangun dengan Next.js (App Router), TypeScript, dan Tailwind CSS agar langsung siap di-deploy ke **Vercel**. Nama produksi yang disarankan: **`yusufsintia`** → [https://yusufsintia.vercel.app](https://yusufsintia.vercel.app).

Data pasangan, galeri, RSVP, dan buku tamu disimpan sebagai dokumen JSON. Secara lokal (tanpa token Blob) sumbernya adalah folder `data/`. Di Vercel, tulisan memakai **Vercel Blob** agar bertahan antar request.

## Menjalankan secara lokal

```bash
npm i
cp .env.example .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). CMS ada di [http://localhost:3000/admin](http://localhost:3000/admin).

Perintah lain:

```bash
npm run lint
npm run build
npm start
```

## Variabel lingkungan

| Nama | Default | Kegunaan |
| --- | --- | --- |
| `CMS_PASSWORD` | `change-me` | Kata sandi halaman `/admin` |
| `BLOB_READ_WRITE_TOKEN` | (kosong) | Token baca/tulis Vercel Blob. Wajib di Production/Preview. Kosongkan di `npm run dev` agar memakai `data/*.json`. |

Salin `.env.example` menjadi `.env.local` lalu ganti sandinya sebelum dipakai di produksi. Di Vercel, isi variabel yang sama di Project Settings → Environment Variables (Production + Preview).

## Mengganti data pasangan

Hampir semua konten undangan bisa diubah dari satu tempat:

- `data/wedding.json` — nama Yusuf & Sintia, orang tua, ayat, cerita, tanggal, tempat, peta, path musik, dan URL YouTube opsional
- `data/gallery.json` — foto momen bersama
- `data/messages.json` — pesan buku tamu (seed + hasil form)
- `data/rsvp.json` — konfirmasi kehadiran (seed + hasil form)

Atau sunting lewat CMS `/admin` (galeri, nama, tanggal, tempat, musik).

Nama tamu di sampul bisa diisi lewat query string:

```
https://yusufsintia.vercel.app/?to=Keluarga%20Besar%20Rahman
```

## Musik latar

Ada dua sumber, dipilih otomatis:

1. **Berkas lokal (default)** — `public/music/background.mp3`, diatur di `wedding.music.localSrc`
2. **YouTube (opsional)** — isi `wedding.music.youtubeUrl`. Jika terisi, iframe API YouTube dipakai setelah tamu menekan **Buka Undangan**

Berkas `background.mp3` adalah pad ambient prosedural untuk uji coba. Ganti dengan lagu yang Anda miliki lisensinya. Lihat `public/music/README.md`.

## Penyimpanan JSON di Vercel (penting)

Filesystem serverless Vercel bersifat *read-only* (`/var/task`). Menulis `data/*.json` di production akan gagal (`EROFS`). RSVP, buku tamu, galeri, dan suntingan CMS **harus** memakai Vercel Blob.

### Lokal (`npm run dev`)

Jika `BLOB_READ_WRITE_TOKEN` kosong, API membaca/menulis `data/*.json` di disk. Berkas seed di repo tetap menjadi fallback awal.

### Produksi / Preview di Vercel

1. Buka [Vercel Dashboard](https://vercel.com) → Storage → **Create Database** → **Blob**.
2. Pilih akses **Public**. Satu store dipakai untuk JSON (RSVP, pesan, galeri, data acara) dan unggahan foto CMS. Store Private tidak dipakai di kode ini.
3. Hubungkan store itu ke project **`yusufsintia`** (Production + Preview).
4. Vercel akan mengisi `BLOB_READ_WRITE_TOKEN`. Cek di Project Settings → Environment Variables. Jika token tidak muncul otomatis, salin dari halaman Blob store lalu tambahkan manual.
5. **Redeploy** production setelah token terpasang. Token baru tidak berlaku pada deployment yang sudah jalan.
6. Uji `POST /api/rsvp` dan `POST /api/messages`. Response harus `200` dan data tetap ada setelah refresh.

Tanpa token di Vercel, API tulis mengembalikan `503` dengan pesan bahwa Blob belum dikonfigurasi — bukan lagi error jaringan yang kabur.

Baca pertama kali: jika Blob belum punya dokumen galeri atau data acara, API memakai seed `data/wedding.json` dan `data/gallery.json`. Pesan dan RSVP di produksi tidak mengambil data contoh itu. Setiap kiriman disimpan sebagai berkas baru di `live/messages/` atau `live/rsvp/`, jadi refresh langsung melihat data terbaru. Menimpa satu berkas publik yang sama membuat Vercel menyajikan salinan lama sampai sekitar satu menit.

## Deploy ke Vercel (situs publik, repo bisa privat)

Repo GitHub yang privat tetap bisa menghasilkan situs publik di `yusufsintia.vercel.app`.

1. Push proyek ini ke GitHub (repo boleh private).
2. Buka [Vercel](https://vercel.com) → **Add New Project** → pilih repositori ini.
3. **Project Name:** `yusufsintia` (menghasilkan `https://yusufsintia.vercel.app`).
4. Framework Preset: **Next.js** (terdeteksi otomatis). Build: `npm run build`. Output: default App Router, tidak perlu `vercel.json`.
5. Environment Variables:
   - `CMS_PASSWORD` (jangan pakai `change-me` di produksi)
   - `BLOB_READ_WRITE_TOKEN` (dari Vercel Blob store yang dihubungkan ke project ini)
6. Deploy. Domain `*.vercel.app` bersifat publik — tamu tidak perlu akun GitHub.

Custom domain (opsional) bisa ditambahkan nanti di Vercel → Project → Domains.

## Struktur penting

```
app/                 # halaman undangan, /admin, dan API
components/          # UI undangan + CMS
data/                # sumber konten JSON
lib/                 # data-store (Blob/FS), auth CMS
public/music/        # berkas audio
public/images/       # fallback foto
```

## Desain

Palet jade (`#0F766E`, aksen `#14B8A6`) dan safir (`#1E3A8A`, aksen `#2563EB`) diatur sebagai CSS variable. Latar ivory/cream, heading Playfair Display, body Source Sans 3. Tampilan keseluruhan adalah undangan kontemporer (foto, kartu lembut, banyak ruang kosong) — bukan template religi. Ayat Al-Qur'an hanya muncul di satu bagian khusus, tanpa ornament geometris di sampul atau section lain.
