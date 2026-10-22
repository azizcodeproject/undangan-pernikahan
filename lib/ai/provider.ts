import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import type { LanguageModel } from "ai";
import { createFallbackModel } from "./fallback-model";

export type ProviderId =
  | "google"
  | "openai"
  | "groq"
  | "openrouter"
  | "ollama"
  | "gateway";

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  modelId: string;
  fallbackModelIds: string[];
  apiKeyEnv: string | null;
  configured: boolean;
};

const DEFAULT_MODELS: Record<ProviderId, string> = {
  google: "gemini-3.6-flash",
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  openrouter: "openrouter/auto",
  ollama: "llama3.2",
  gateway: "openai/gpt-4o-mini",
};

/**
 * Urutan cadangan saat model utama sedang sibuk (503 UNAVAILABLE). Model
 * terbaru tidak selalu paling tersedia, jadi yang lebih ringan ditaruh lebih
 * dulu agar pengguna tidak menunggu lama.
 */
const DEFAULT_FALLBACKS: Record<ProviderId, string[]> = {
  google: ["gemini-3.5-flash", "gemini-3.8-flash"],
  openai: [],
  groq: [],
  openrouter: [],
  ollama: [],
  gateway: [],
};

const LABELS: Record<ProviderId, string> = {
  google: "Google Gemini",
  openai: "OpenAI",
  groq: "Groq",
  openrouter: "OpenRouter",
  ollama: "Ollama (lokal)",
  gateway: "Neon AI Gateway",
};

const API_KEY_ENV: Record<ProviderId, string | null> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  ollama: null,
  gateway: "NEON_AI_GATEWAY_TOKEN",
};

export function normalizeProvider(value: string | undefined): ProviderId {
  const candidate = (value ?? "google").trim().toLowerCase();
  return candidate in DEFAULT_MODELS ? (candidate as ProviderId) : "google";
}

function parseFallbacks(
  id: ProviderId,
  value: string | undefined,
): string[] {
  if (!value?.trim()) return DEFAULT_FALLBACKS[id];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveProvider(
  env: Record<string, string | undefined> = process.env,
): ProviderConfig {
  const id = normalizeProvider(env.AI_PROVIDER);
  const apiKeyEnv = API_KEY_ENV[id];

  return {
    id,
    label: LABELS[id],
    modelId: env.AI_MODEL?.trim() || DEFAULT_MODELS[id],
    fallbackModelIds: parseFallbacks(id, env.AI_MODEL_FALLBACKS),
    apiKeyEnv,
    configured:
      id === "ollama"
        ? true
        : Boolean(apiKeyEnv && env[apiKeyEnv]?.trim()),
  };
}

function buildModel(
  id: ProviderId,
  modelId: string,
  env: Record<string, string | undefined>,
  apiKey: string | undefined,
): LanguageModelV4 {
  switch (id) {
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "groq":
      return createOpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      })(modelId);
    case "openrouter":
      return createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          "HTTP-Referer": env.APP_URL ?? "http://localhost:3000",
          "X-Title": "Undangan Digital",
        },
      })(modelId);
    case "ollama":
      return createOpenAI({
        apiKey: "ollama",
        baseURL: env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
      })(modelId);
    case "gateway":
      return createOpenAI({
        apiKey,
        baseURL: env.NEON_AI_GATEWAY_BASE_URL,
      })(modelId);
  }
}

/** Model siap pakai untuk `streamText` / `generateText`, dengan fallback. */
export function getLanguageModel(
  env: Record<string, string | undefined> = process.env,
): LanguageModel {
  const config = resolveProvider(env);
  const apiKey = config.apiKeyEnv ? env[config.apiKeyEnv]?.trim() : undefined;

  const ids = [
    config.modelId,
    ...config.fallbackModelIds.filter((id) => id !== config.modelId),
  ];

  const models = ids.map((id) => buildModel(config.id, id, env, apiKey));
  if (models.length === 1) return models[0];

  return createFallbackModel(models, ({ from, to, error }) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ai] ${from} gagal, pindah ke ${to}: ${message.slice(0, 160)}`);
  });
}

export function missingKeyMessage(config: ProviderConfig): string {
  if (config.id === "gateway") {
    return "NEON_AI_GATEWAY_TOKEN belum diatur. Gateway hanya tersedia pada plan Neon berbayar.";
  }

  return `${config.apiKeyEnv} belum diatur. Tambahkan di .env.local (lokal) atau Environment Variables Vercel (produksi), lalu redeploy.`;
}
