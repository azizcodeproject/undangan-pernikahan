import { describe, expect, test } from "vitest";
import { storageFailureResponse } from "./http-error";

describe("storageFailureResponse", () => {
  test("mengembalikan JSON 503 dengan pesan konfigurasi Blob", async () => {
    const response = storageFailureResponse(
      new Error(
        "Penyimpanan belum dikonfigurasi. Buat Vercel Blob store (Public) lalu isi BLOB_READ_WRITE_TOKEN, kemudian deploy ulang.",
      ),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Penyimpanan belum dikonfigurasi. Buat Vercel Blob store (Public) lalu isi BLOB_READ_WRITE_TOKEN, kemudian deploy ulang.",
    });
  });

  test("menyamarkan error teknis menjadi pesan penyimpanan yang ramah", async () => {
    const response = storageFailureResponse(
      new Error("EROFS: read-only file system, open '/var/task/data/rsvp.json.4.tmp'"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Data belum tersimpan. Penyimpanan sedang bermasalah, coba beberapa saat lagi.",
    });
  });
});
