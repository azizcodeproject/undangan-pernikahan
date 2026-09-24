# Undangan Pernikahan Digital — Aisyah & Yusuf

Website undangan pernikahan Muslim yang elegan, hangat, dan mobile-first. Dibangun dengan Next.js (App Router), TypeScript, dan Tailwind CSS. Data pasangan, galeri, RSVP, dan buku tamu disimpan sebagai berkas JSON di folder `data/`.

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

Salin `.env.example` menjadi `.env.local` lalu ganti sandinya sebelum dipakai di produksi.

## Mengganti data pasangan

Hampir semua konten undangan bisa diubah dari satu tempat:

- `data/wedding.json` — nama, orang tua, ayat, cerita, tanggal, tempat, peta, path musik, dan URL YouTube opsional
- `data/gallery.json` — foto momen bersama
- `data/messages.json` — pesan buku tamu (seed + hasil form)
- `data/rsvp.json` — konfirmasi kehadiran (seed + hasil form)

Atau sunting lewat CMS `/admin` (galeri, nama, tanggal, tempat, musik).

Nama tamu di sampul bisa diisi lewat query string:

```
https://domain-anda.com/?to=Keluarga%20Besar%20Rahman
```

## Musik latar

Ada dua sumber, dipilih otomatis:

1. **Berkas lokal (default)** — `public/music/background.mp3`, diatur di `wedding.music.localSrc`
2. **YouTube (opsional)** — isi `wedding.music.youtubeUrl`. Jika terisi, iframe API YouTube dipakai setelah tamu menekan **Buka Undangan**

Berkas `background.mp3` adalah pad ambient prosedural untuk uji coba. Ganti dengan lagu yang Anda miliki lisensinya. Lihat `public/music/README.md`.

## Penyimpanan JSON: lokal vs Vercel

API menulis ke `data/*.json` di filesystem. Perilaku:

- **Lokal / VPS / Node host**: perubahan RSVP, pesan, dan galeri bertahan di disk.
- **Vercel / serverless**: filesystem bersifat ephemeral. Tulisan bisa hilang saat instance berganti. Undangan tetap tampil dari JSON yang sudah di-commit.

Untuk demo yang tahan lama di Vercel:

1. Sunting `data/wedding.json` dan `data/gallery.json` di repo, lalu deploy ulang, atau
2. Jalankan CMS secara lokal, commit berkas JSON yang berubah, lalu push, atau
3. Pindahkan persistensi ke database (Vercel KV / Postgres) jika undangan ini dipakai jangka panjang.

API tulis JSON tetap diimplementasikan sesuai spesifikasi.

## Deploy ke Vercel (situs publik, repo bisa privat)

Repo GitHub yang privat tetap bisa menghasilkan situs publik.

1. Push proyek ini ke GitHub (repo boleh private).
2. Buka [Vercel](https://vercel.com), **Add New Project**, pilih repositori.
3. Framework terdeteksi sebagai Next.js. Build command: `npm run build`.
4. Isi Environment Variable `CMS_PASSWORD` (jangan pakai `change-me` di produksi).
5. Deploy. Domain `*.vercel.app` bersifat publik — tamu tidak perlu akun GitHub.

## Struktur penting

```
app/                 # halaman undangan, /admin, dan API
components/          # UI undangan + CMS
data/                # sumber konten JSON
lib/                 # baca/tulis JSON, auth CMS
public/music/        # berkas audio
public/images/       # aksen SVG dan fallback foto
```

## Desain

Palet jade (`#0F766E`, aksen `#14B8A6`) dan safir (`#1E3A8A`, aksen `#2563EB`) diatur sebagai CSS variable. Latar ivory/cream, heading Playfair Display, body Source Sans 3, ayat memakai Amiri.
