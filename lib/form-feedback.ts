export const networkFailureMessage =
  "Tidak terhubung ke server. Periksa koneksi internet, atau coba lagi beberapa saat.";

export const serverParseFailureMessage =
  "Server gagal menyimpan data. Coba lagi beberapa saat.";

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error?.trim() || fallbackMessage;
  } catch {
    return serverParseFailureMessage;
  }
}
