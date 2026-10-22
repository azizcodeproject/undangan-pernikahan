import { sql } from "drizzle-orm";
import { resolveProvider } from "@/lib/ai/provider";
import { getDb } from "@/lib/db/client";
import { callFunction } from "@/lib/neon/functions";
import {
  deleteObject,
  getObjectText,
  isNeonStorageConfigured,
  putObject,
} from "@/lib/storage/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail: string };

function redact(value: string): string {
  return value.replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/g, "$1***@");
}

async function checkDatabase(): Promise<Check> {
  try {
    await getDb().execute(sql`select 1`);
    const rows = await getDb().execute<{ count: string }>(
      sql`select count(*)::text as count from invitations`,
    );
    const count = rows.rows[0]?.count ?? "0";
    return { name: "postgres", ok: true, detail: `select 1 ok, invitations=${count}` };
  } catch (error) {
    const err = error as Error & { code?: string; cause?: Error };
    const detail = redact(
      [err.message, err.code ? `code=${err.code}` : "", err.cause?.message ? `cause=${err.cause.message}` : ""]
        .filter(Boolean)
        .join(" | "),
    );
    console.error("Neon health: postgres gagal:", detail);
    return { name: "postgres", ok: false, detail };
  }
}

async function checkStorage(): Promise<Check> {
  if (!isNeonStorageConfigured()) {
    return {
      name: "object-storage",
      ok: false,
      detail: "AWS_* / NEON_STORAGE_BUCKET belum lengkap",
    };
  }

  const key = `health/${Date.now()}-${crypto.randomUUID()}.txt`;
  const payload = `ok ${new Date().toISOString()}`;

  try {
    await putObject(key, new TextEncoder().encode(payload), "text/plain");
    const readBack = await getObjectText(key);
    await deleteObject(key);

    return readBack === payload
      ? { name: "object-storage", ok: true, detail: `put/get/delete ok (${key})` }
      : { name: "object-storage", ok: false, detail: "isi objek tidak cocok" };
  } catch (error) {
    return { name: "object-storage", ok: false, detail: String(error) };
  }
}

async function checkFunctions(): Promise<Check> {
  try {
    const response = await callFunction("hello");
    const text = await response.text();
    return response.ok
      ? { name: "functions", ok: true, detail: `HTTP ${response.status}: ${text.slice(0, 60)}` }
      : { name: "functions", ok: false, detail: `HTTP ${response.status}: ${text.slice(0, 120)}` };
  } catch (error) {
    return { name: "functions", ok: false, detail: String(error) };
  }
}

async function checkAuth(): Promise<Check> {
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!process.env.NEON_AUTH_BASE_URL || !jwksUrl) {
    return { name: "auth", ok: false, detail: "NEON_AUTH_* belum diisi" };
  }

  try {
    const response = await fetch(jwksUrl, { cache: "no-store" });
    const body = (await response.json()) as { keys?: unknown[] };
    return {
      name: "auth",
      ok: response.ok && Array.isArray(body.keys) && body.keys.length > 0,
      detail: `JWKS HTTP ${response.status}, keys=${body.keys?.length ?? 0}`,
    };
  } catch (error) {
    return { name: "auth", ok: false, detail: String(error) };
  }
}

function checkAi(): Check {
  const provider = resolveProvider();
  return {
    name: "ai",
    ok: provider.configured,
    detail: provider.configured
      ? `${provider.label} · ${provider.modelId}`
      : `${provider.label} · ${provider.modelId} · ${provider.apiKeyEnv} belum diisi`,
  };
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkFunctions(),
    checkAuth(),
  ]);
  checks.push(checkAi());

  const ok = checks.every((check) => check.ok);
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
