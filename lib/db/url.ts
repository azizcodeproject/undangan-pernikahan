/**
 * Neon CLI menulis nilai env yang mengandung karakter khusus dengan tanda kutip,
 * misalnya:
 *
 *   DATABASE_URL="postgresql://...?sslmode=require&channel_binding=require"
 *
 * Next.js menghapus kutip itu saat memuat .env.local, tetapi platform lain
 * (Vercel) menyimpannya apa adanya. Tanpa normalisasi, `pg` membaca seluruh
 * string sebagai host dan gagal dengan `getaddrinfo ENOTFOUND`.
 */
export function normalizeConnectionString(
  raw: string | undefined,
): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;

  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  return value;
}
