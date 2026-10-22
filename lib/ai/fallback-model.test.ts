import type { LanguageModelV4 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import { createFallbackModel } from "./fallback-model";

function fakeModel(
  modelId: string,
  behavior: "ok" | "fail" = "ok",
): LanguageModelV4 {
  return {
    specificationVersion: "v4",
    provider: "test",
    modelId,
    supportedUrls: {},
    doGenerate: vi.fn(async () => {
      if (behavior === "fail") throw new Error(`gagal: ${modelId}`);
      return { content: [], finishReason: "stop" } as never;
    }),
    doStream: vi.fn(async () => {
      if (behavior === "fail") throw new Error(`gagal: ${modelId}`);
      return { stream: new ReadableStream() } as never;
    }),
  };
}

describe("createFallbackModel", () => {
  it("memakai model pertama jika sehat", async () => {
    const first = fakeModel("satu");
    const second = fakeModel("dua");
    const model = createFallbackModel([first, second]);

    await model.doStream({} as never);
    expect(first.doStream).toHaveBeenCalledTimes(1);
    expect(second.doStream).not.toHaveBeenCalled();
  });

  it("pindah ke model berikutnya saat model pertama gagal", async () => {
    const first = fakeModel("satu", "fail");
    const second = fakeModel("dua", "ok");
    const onFallback = vi.fn();
    const model = createFallbackModel([first, second], onFallback);

    const result = await model.doStream({} as never);
    expect(result).toBeTruthy();
    expect(second.doStream).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(
      expect.objectContaining({ from: "satu", to: "dua" }),
    );
  });

  it("melempar error terakhir jika semua model gagal", async () => {
    const model = createFallbackModel([
      fakeModel("satu", "fail"),
      fakeModel("dua", "fail"),
    ]);

    await expect(model.doStream({} as never)).rejects.toThrow("gagal: dua");
  });

  it("menolak daftar model kosong", () => {
    expect(() => createFallbackModel([])).toThrow("Minimal satu model");
  });
});
