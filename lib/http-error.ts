const configuredStoragePrefix = "Penyimpanan";
const genericStorageFailureMessage =
  "Data belum tersimpan. Penyimpanan sedang bermasalah, coba beberapa saat lagi.";

export function storageFailureResponse(error: unknown): Response {
  console.error("Storage write failed", error);
  const message =
    error instanceof Error && error.message.startsWith(configuredStoragePrefix)
      ? error.message
      : genericStorageFailureMessage;

  return Response.json({ error: message }, { status: 503 });
}
