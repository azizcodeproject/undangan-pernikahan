# Prompt untuk AI Agent

Folder ini berisi prompt per fase. Tujuannya: setiap sesi AI punya konteks yang sama, batas kerja yang jelas, dan kriteria selesai yang bisa diuji.

## Cara pakai

1. Buka satu sesi baru di root repo.
2. Tempel **isi `00-konteks.md`** lebih dulu.
3. Tempel **satu file fase** (mis. `03-wizard.md`). Jangan gabung dua fase.
4. Ikuti urutan fase. Jangan lompat.
5. Setelah agent selesai, jalankan sendiri:

```sh
npm run lint && npm run test && npm run build
```

6. Baru lanjut ke fase berikutnya.

## Urutan fase

| File | Fase | Prasyarat |
| --- | --- | --- |
| `00-konteks.md` | konteks wajib | — |
| `01-pondasi-db.md` | P0–P1: adapter data, skema, migrasi | 00 |
| `02-auth-dashboard.md` | P1: auth, role, shell dashboard | 01 |
| `03-wizard.md` | P2: wizard, upload, preview, publish, versi | 02 |
| `04-domain-routing.md` | P3: slug, custom domain, cache | 03 |
| `05-tamu-whatsapp.md` | P4–P5: tamu, RSVP ter-scope, WA + jadwal | 04 |
| `06-ai-agent.md` | P6: AI provider gratis, patch, undo, kuota | 05 |
| `07-admin-pembayaran.md` | P7: admin panel, order, webhook | 06 |

## Aturan sesi

- Satu sesi = satu fase. Sesi panjang jadi tidak fokus.
- Minta agent **menulis rencana singkat dulu**, lalu implementasi.
- Minta ringkasan perubahan per file di akhir.
- Kalau ada keputusan yang belum pasti, agent harus **bertanya**, bukan mengarang.
- Jangan minta agent menyentuh produksi (Vercel, DB live) tanpa konfirmasi.

## Template tambahan (opsional)

Kalau agent mulai melebar, kirim:

```
Berhenti. Kembali ke acceptance criteria di prompt fase ini.
Sebutkan kriteria mana yang belum terpenuhi, lalu kerjakan hanya itu.
```
