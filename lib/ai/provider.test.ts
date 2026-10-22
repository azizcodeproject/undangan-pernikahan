import { describe, expect, it } from "vitest";
import {
  getLanguageModel,
  missingKeyMessage,
  normalizeProvider,
  resolveProvider,
} from "./provider";

describe("normalizeProvider", () => {
  it("default ke google", () => {
    expect(normalizeProvider(undefined)).toBe("google");
    expect(normalizeProvider("")).toBe("google");
  });

  it("menerima nama provider yang dikenal, case-insensitive", () => {
    expect(normalizeProvider("GROQ")).toBe("groq");
    expect(normalizeProvider("openrouter")).toBe("openrouter");
  });

  it("jatuh ke google untuk nilai tak dikenal", () => {
    expect(normalizeProvider("anthropic")).toBe("google");
  });
});

describe("resolveProvider", () => {
  it("memakai gemini-2.5-flash sebagai default", () => {
    const config = resolveProvider({});
    expect(config.id).toBe("google");
    expect(config.modelId).toBe("gemini-2.5-flash");
    expect(config.configured).toBe(false);
  });

  it("mendeteksi API key yang terisi", () => {
    const config = resolveProvider({
      AI_PROVIDER: "google",
      GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
    });
    expect(config.configured).toBe(true);
  });

  it("menghormati AI_MODEL", () => {
    const config = resolveProvider({
      AI_PROVIDER: "groq",
      AI_MODEL: "llama-3.1-8b-instant",
      GROQ_API_KEY: "x",
    });
    expect(config.modelId).toBe("llama-3.1-8b-instant");
    expect(config.configured).toBe(true);
  });

  it("ollama dianggap siap tanpa API key", () => {
    const config = resolveProvider({ AI_PROVIDER: "ollama" });
    expect(config.configured).toBe(true);
  });
});

describe("getLanguageModel", () => {
  it("mengembalikan model untuk provider google tanpa memanggil jaringan", () => {
    const model = getLanguageModel({
      AI_PROVIDER: "google",
      GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
    });
    expect(model).toBeTruthy();
    expect(model.modelId).toBe("gemini-2.5-flash");
  });
});

describe("missingKeyMessage", () => {
  it("menyebut env yang kurang", () => {
    const message = missingKeyMessage(resolveProvider({}));
    expect(message).toContain("GOOGLE_GENERATIVE_AI_API_KEY");
  });
});
