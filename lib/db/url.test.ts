import { describe, expect, it } from "vitest";
import { normalizeConnectionString } from "./url";

describe("normalizeConnectionString", () => {
  it("mengembalikan undefined untuk nilai kosong", () => {
    expect(normalizeConnectionString(undefined)).toBeUndefined();
    expect(normalizeConnectionString("")).toBeUndefined();
    expect(normalizeConnectionString("   ")).toBeUndefined();
  });

  it("membiarkan URL tanpa kutip", () => {
    const url = "postgresql://user:pass@host/db?sslmode=require";
    expect(normalizeConnectionString(url)).toBe(url);
  });

  it("membuang kutip ganda dari Neon CLI", () => {
    const url = "postgresql://user:pass@host/db?sslmode=require&channel_binding=require";
    expect(normalizeConnectionString(`"${url}"`)).toBe(url);
  });

  it("membuang kutip tunggal dan spasi di tepi", () => {
    expect(normalizeConnectionString(`  'postgres://host/db'  `)).toBe(
      "postgres://host/db",
    );
  });

  it("tidak memotong kutip yang tidak berpasangan", () => {
    expect(normalizeConnectionString('"postgres://host/db')).toBe(
      '"postgres://host/db',
    );
  });
});
