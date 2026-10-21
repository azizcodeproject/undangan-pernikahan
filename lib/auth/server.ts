import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !secret) {
  throw new Error(
    "NEON_AUTH_BASE_URL dan NEON_AUTH_COOKIE_SECRET wajib diisi. Jalankan `neon env pull` lalu isi cookie secret.",
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});
