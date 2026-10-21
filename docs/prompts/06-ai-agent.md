# 06 — AI Agent per Undangan

## Tujuan

User bisa mengubah isi dan desain undangan dengan bahasa natural, memakai model **gratis** atau murah, dengan hasil yang bisa di-undo dan kuota yang terkendali.

## Baca dulu

- `app/api/ai/route.ts` (644 baris — pahami dulu, jangan langsung hapus)
- `components/ai/WeddingChat.tsx`, `components/ai/DesignPreview.tsx`
- `lib/types.ts`, `lib/design-tokens.ts`
- `docs/RENCANA.md` §11

## Scope

Termasuk:

- `lib/ai/provider.ts`: registry dari env `AI_PROVIDER` (`google|openai|groq|openrouter|ollama`), `AI_MODEL`, `AI_BASE_URL`, `AI_API_KEY`. Default **`google`** (Gemini free tier, sudah diputuskan).
- Ganti 7 tool lama menjadi **satu tool patch**: `applyDraftPatch` dengan operasi whitelist (`set`, `append`, `remove`, `move`) pada path yang diizinkan (`content.*`, `theme.*`).
- Validasi patch dengan Zod; tolak path terlarang (`id`, `owner_id`, `published_*`, `slug`).
- Setiap patch: tulis draft, buat `invitation_versions`, catat `ai_usage`, kembalikan diff untuk UI.
- UI: chat + panel diff (sebelum/sesudah) + tombol "Terapkan"/"Batalkan" + undo ke versi sebelumnya.
- Kuota token per paket; tolak dengan pesan jelas bila habis.
- Fallback: jika model tidak mendukung tool-calling → `generateObject` dengan skema patch.
- Dev tanpa biaya: dukung `ollama`/`lmstudio` lokal.
- Prompt sistem: konteks undangan + aturan patch; **tanpa** data tamu/RSVP.

Tidak termasuk:

- AI untuk membuat gambar, atau mengirim pesan WA otomatis lewat AI.

## Kontrak

```ts
type PatchOp =
  | { op: "set"; path: string; value: unknown }
  | { op: "append"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "move"; path: string; from: number; to: number };
```

- `applyDraftPatch(invitationId, ops, actorUserId)` mengembalikan `{ draft, diff, version }`.
- Patch maksimum: 50 operasi, 20 KB total.
- Tidak ada tulisan langsung ke `published_*` dari AI.

## Langkah

1. Ekstrak logika AI lama menjadi `lib/ai/*` (prompt, schema, patch executor).
2. Implementasi provider registry + pemilihan model.
3. Implementasi patch executor + versioning.
4. Route `/api/ai` baru: auth, scope, kuota, streaming.
5. UI chat + diff + undo.
6. Test: patch valid, path terlarang, ukuran melebihi batas, kuota habis, fallback tanpa tools.

## Acceptance criteria

- [ ] AI hanya bisa mengubah draft undangan milik user yang login.
- [ ] Patch ke `slug`, `published_*`, `owner_id` ditolak.
- [ ] Setiap perubahan bisa di-undo ke versi sebelumnya.
- [ ] Kuota token dihormati dan tercatat di `ai_usage`.
- [ ] Berjalan dengan model gratis tanpa `OPENAI_API_KEY`.
- [ ] Tidak ada nomor tamu atau isi RSVP yang dikirim ke model.
- [ ] Bila model gagal memanggil tool, permintaan tetap menghasilkan patch valid atau pesan error yang jelas.

## Verifikasi

```sh
npm run lint && npm run test && npm run build
```

Manual: pilih model gratis → "ganti nama mempelai dan tema jadi minimal" → cek diff → terapkan → undo.

## Serahkan

Daftar provider + env, contoh patch, dan hasil uji keamanan path.
