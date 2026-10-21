# 03 — Wizard, Upload, Preview, Publish

## Tujuan

User bisa membuat undangan dari nol lewat wizard, melihat preview, lalu publish — dengan autosave dan riwayat versi.

## Baca dulu

- `components/admin/AdminApp.tsx` (editor konten yang bisa dipakai ulang)
- `components/invitation/*` (harus tetap murni props)
- `lib/types.ts`, `lib/design-tokens.ts`, `app/api/upload/route.ts`
- `docs/RENCANA.md` §9, §14

## Scope

Termasuk:

- Route `/dashboard/[id]/wizard/[step]` dengan 10 step sesuai §9.
- Autosave debounce 800 ms ke `invitations.content` lewat server action.
- Validasi per step (Zod), tombol "Lanjut" nonaktif sampai valid; step boleh dilewati hanya jika opsional.
- Upload media ke `/api/upload` yang ter-scope `invitationId` + kuota paket; simpan metadata di `media`.
- Preview `/preview/[token]` (HMAC + expiry) merender draft, bukan published.
- Publish: snapshot + `invitation_versions` + `revalidateTag`.
- Rollback versi (pilih versi → jadikan draft).
- Halaman `/dashboard` menampilkan daftar undangan + status + tombol lanjutkan wizard.

Tidak termasuk:

- Domain custom, WhatsApp, AI.

## Kontrak

- `content` mengikuti `WeddingContent` di `lib/types.ts`. Jangan ubah bentuk tanpa migrasi + update semua pemakai.
- Step disimpan di URL agar bisa di-refresh. Slug step: `template`, `couple`, `event`, `story`, `gallery`, `gift`, `music`, `guests`, `address`, `review`.
- Publish gagal jika: slug dipakai tenant lain, konten wajib belum lengkap, atau kuota media terlampaui.
- Preview memakai komponen undangan yang sama; tidak boleh ada salinan komponen terpisah.

## Langkah

1. Layout wizard + state machine step (URL-driven).
2. Ekstrak editor konten dari `AdminApp` menjadi komponen per-step yang bisa dipakai ulang.
3. Server action `saveStep(invitationId, step, values)`.
4. Upload + galeri + urutan + hapus.
5. Preview token + halaman review.
6. Publish + versi + rollback.
7. Test: validasi step, slug bentrok, publish, rollback.

## Acceptance criteria

- [ ] Refresh di tengah wizard tidak menghilangkan data.
- [ ] Dua tab berbeda tidak saling menimpa (last-write-wins terdeteksi, tampilkan peringatan).
- [ ] Preview identik dengan hasil publish (pakai komponen yang sama).
- [ ] Publish menaikkan `published_version` dan membuat baris `invitation_versions`.
- [ ] Rollback mengembalikan draft ke versi lama tanpa menghapus versi baru.
- [ ] Upload menolak file > batas, MIME tidak diizinkan, dan melebihi kuota paket.
- [ ] Tenant lain tidak bisa membuka preview milik orang lain.

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: buat undangan → isi 10 step → preview → publish → ubah draft → publish lagi → rollback.

## Serahkan

Peta step → komponen, kontrak server action, dan hasil uji.
