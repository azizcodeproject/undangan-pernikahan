import type { LanguageModelV4 } from "@ai-sdk/provider";

export type FallbackEvent = {
  from: string;
  to: string;
  error: unknown;
};

/**
 * Membungkus beberapa model menjadi satu. Jika model pertama gagal **sebelum**
 * stream dimulai (mis. 503 UNAVAILABLE karena lonjakan permintaan), model
 * berikutnya dicoba otomatis.
 *
 * Catatan: kegagalan yang terjadi setelah stream berjalan tidak bisa diganti
 * model, karena sebagian jawaban sudah terkirim ke klien.
 */
export function createFallbackModel(
  models: LanguageModelV4[],
  onFallback?: (event: FallbackEvent) => void,
): LanguageModelV4 {
  if (models.length === 0) {
    throw new Error("Minimal satu model diperlukan.");
  }

  const primary = models[0];

  return {
    specificationVersion: "v4",
    provider: primary.provider,
    modelId: primary.modelId,
    supportedUrls: primary.supportedUrls,

    async doGenerate(options) {
      let lastError: unknown;

      for (let index = 0; index < models.length; index += 1) {
        const model = models[index];
        try {
          return await model.doGenerate(options);
        } catch (error) {
          lastError = error;
          const next = models[index + 1];
          if (next) {
            onFallback?.({ from: model.modelId, to: next.modelId, error });
          }
        }
      }

      throw lastError;
    },

    async doStream(options) {
      let lastError: unknown;

      for (let index = 0; index < models.length; index += 1) {
        const model = models[index];
        try {
          return await model.doStream(options);
        } catch (error) {
          lastError = error;
          const next = models[index + 1];
          if (next) {
            onFallback?.({ from: model.modelId, to: next.modelId, error });
          }
        }
      }

      throw lastError;
    },
  };
}
