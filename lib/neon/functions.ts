/**
 * Neon Functions dijalankan di samping database dan tidak terkena batas waktu
 * pendek seperti lambda. Helper ini dipakai untuk memanggil function dari app.
 */
export function functionBaseUrl(name: string): string | null {
  const envKey = `NEON_FUNCTION_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_BASE_URL`;
  const value = process.env[envKey]?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export async function callFunction(
  name: string,
  path = "/",
  init?: RequestInit,
): Promise<Response> {
  const base = functionBaseUrl(name);
  if (!base) {
    throw new Error(`URL function ${name} belum tersedia di environment.`);
  }
  return fetch(`${base}${path}`, { ...init, cache: "no-store" });
}
