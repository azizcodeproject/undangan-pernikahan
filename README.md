# Undangan Pernikahan Digital — Yusuf & Sintia

Website undangan pernikahan yang elegan, hangat, dan mobile-first. Dibangun dengan Next.js (App Router), TypeScript, dan Tailwind CSS agar langsung siap di-deploy ke **Vercel**. Nama produksi yang disarankan: **`yusufsintia`** → [https://yusufsintia.vercel.app](https://yusufsintia.vercel.app).

Data pasangan, galeri, RSVP, dan buku tamu disimpan sebagai berkas JSON di folder `data/`.

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

API menulis ke `data/*.json` di filesystem. Itu memenuhi kebutuhan form RSVP, buku tamu, dan CMS.

- **Lokal**: perubahan bertahan di disk.
- **Vercel (serverless)**: filesystem bersifat *ephemeral*. Tulisan bisa hilang saat instance berganti. **Bacaan** tetap andal dari JSON yang sudah di-commit (seed + suntingan yang di-push).

Pendekatan praktis tanpa layanan berbayar:

1. Isi `data/wedding.json` dan `data/gallery.json` di repo, lalu deploy — undangan tampil utuh.
2. Untuk RSVP/pesan yang ingin disimpan permanen: jalankan form/CMS secara lokal, commit berkas JSON yang berubah, lalu push agar Vercel men-deploy ulang.
3. Vercel KV / Blob / Postgres hanya perlu jika undangan ini dipakai jangka panjang dan tamu menulis terus-menerus. Jangan blokir rilis hanya untuk itu.

API tulis JSON tetap ada. Tamu tetap bisa mengirim RSVP/pesan; data itu hidup selama instance masih sama, lalu kembali ke seed yang di-commit.

## Deploy ke Vercel (situs publik, repo bisa privat)

Repo GitHub yang privat tetap bisa menghasilkan situs publik di `yusufsintia.vercel.app`.

1. Push proyek ini ke GitHub (repo boleh private).
2. Buka [Vercel](https://vercel.com) → **Add New Project** → pilih repositori ini.
3. **Project Name:** `yusufsintia` (menghasilkan `https://yusufsintia.vercel.app`).
4. Framework Preset: **Next.js** (terdeteksi otomatis). Build: `npm run build`. Output: default App Router, tidak perlu `vercel.json`.
5. Environment Variables: `CMS_PASSWORD` (jangan pakai `change-me` di produksi).
6. Deploy. Domain `*.vercel.app` bersifat publik — tamu tidak perlu akun GitHub.

Custom domain (opsional) bisa ditambahkan nanti di Vercel → Project → Domains.

## Struktur penting

```
app/                 # halaman undangan, /admin, dan API
components/          # UI undangan + CMS
data/                # sumber konten JSON
lib/                 # baca/tulis JSON, auth CMS
public/music/        # berkas audio
public/images/       # fallback foto
```

## Desain

Palet jade (`#0F766E`, aksen `#14B8A6`) dan safir (`#1E3A8A`, aksen `#2563EB`) diatur sebagai CSS variable. Latar ivory/cream, heading Playfair Display, body Source Sans 3. Tampilan keseluruhan adalah undangan kontemporer (foto, kartu lembut, banyak ruang kosong) — bukan template religi. Ayat Al-Qur'an hanya muncul di satu bagian khusus, tanpa ornament geometris di sampul atau section lain.
