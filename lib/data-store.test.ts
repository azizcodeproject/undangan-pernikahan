import { describe, expect, test } from "vitest";
import {
  buildFreshBlobUrl,
  isBlobStorageConfigured,
  isNotFoundError,
  readJsonDocument,
  writeJsonDocument,
  writePublicAsset,
  type DataStoreAdapters,
} from "./data-store";

function createMemoryAdapters(options: {
  token?: string;
  vercel?: string;
  blobValue?: unknown;
  fileValue?: unknown;
}): DataStoreAdapters & {
  blobPuts: Array<{ pathname: string; value: unknown }>;
  fileWrites: Array<{ fileName: string; value: unknown }>;
} {
  const blobPuts: Array<{ pathname: string; value: unknown }> = [];
  const fileWrites: Array<{ fileName: string; value: unknown }> = [];
  const revisions: Array<{
    pathname: string;
    url: string;
    uploadedAtMs: number;
    value: unknown;
  }> = [];
  let legacyValue: unknown = options.blobValue ?? null;
  let revisionClock = 1;
  let fileValue: unknown = options.fileValue;

  return {
    env: {
      BLOB_READ_WRITE_TOKEN: options.token,
      VERCEL: options.vercel,
    },
    blob: {
      async getJson(pathname) {
        const revision = revisions.find((item) => item.pathname === pathname);
        if (revision) {
          return revision.value;
        }
        return legacyValue;
      },
      async putJson(pathname, value) {
        blobPuts.push({ pathname, value });
        if (pathname.startsWith("live/")) {
          revisions.push({
            pathname,
            url: `https://blob.vercel-storage.com/${pathname}`,
            uploadedAtMs: revisionClock,
            value,
          });
          revisionClock += 1;
          return;
        }
        legacyValue = value;
      },
      async putFile(pathname) {
        return `https://blob.vercel-storage.com/${pathname}`;
      },
      async listRevisions(prefix) {
        return revisions
          .filter((item) => item.pathname.startsWith(prefix))
          .map(({ pathname, url, uploadedAtMs }) => ({
            pathname,
            url,
            uploadedAtMs,
          }));
      },
      async deleteBlobs(urls) {
        for (const url of urls) {
          const index = revisions.findIndex((item) => item.url === url);
          if (index >= 0) {
            revisions.splice(index, 1);
          }
        }
      },
    },
    files: {
      async readJson() {
        if (fileValue === undefined) {
          throw new Error("Seed JSON tidak ditemukan.");
        }
        return fileValue;
      },
      async writeJson(fileName, value) {
        fileWrites.push({ fileName, value });
        fileValue = value;
      },
      async writeFile(fileName) {
        return `/uploads/${fileName}`;
      },
    },
    blobPuts,
    fileWrites,
  };
}

describe("isBlobStorageConfigured", () => {
  test("mengembalikan false jika token kosong", () => {
    expect(isBlobStorageConfigured({})).toBe(false);
    expect(isBlobStorageConfigured({ BLOB_READ_WRITE_TOKEN: "   " })).toBe(
      false,
    );
  });

  test("mengembalikan true jika token terisi", () => {
    expect(
      isBlobStorageConfigured({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test" }),
    ).toBe(true);
  });
});

describe("readJsonDocument", () => {
  test("membaca berkas lokal jika Blob belum dikonfigurasi", async () => {
    const adapters = createMemoryAdapters({
      fileValue: [{ id: "seed-1" }],
    });

    await expect(readJsonDocument("messages.json", adapters)).resolves.toEqual([
      { id: "seed-1" },
    ]);
  });

  test("membaca dari Blob jika token ada dan dokumen sudah tersimpan", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      blobValue: [{ id: "blob-1" }],
      fileValue: [{ id: "seed-1" }],
    });

    await expect(readJsonDocument("rsvp.json", adapters)).resolves.toEqual([
      { id: "blob-1" },
    ]);
  });

  test("jatuh ke seed JSON jika Blob belum punya dokumen galeri", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      blobValue: null,
      fileValue: [{ id: "seed-1" }],
    });

    await expect(readJsonDocument("gallery.json", adapters)).resolves.toEqual([
      { id: "seed-1" },
    ]);
  });

  test("pesan dan RSVP kosong jika Blob belum punya dokumen", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      blobValue: null,
      fileValue: [{ id: "seed-1" }],
    });

    await expect(readJsonDocument("messages.json", adapters)).resolves.toEqual(
      [],
    );
    await expect(readJsonDocument("rsvp.json", adapters)).resolves.toEqual([]);
  });

  test("refresh membaca revisi terbaru, bukan salinan lama", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      blobValue: [{ id: "lama" }],
    });

    await writeJsonDocument("messages.json", [{ id: "baru" }], adapters);

    await expect(readJsonDocument("messages.json", adapters)).resolves.toEqual([
      { id: "baru" },
    ]);
  });

  test("array kosong di Blob tidak diganti data contoh", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      blobValue: [],
      fileValue: [{ id: "seed-1" }],
    });

    await expect(readJsonDocument("messages.json", adapters)).resolves.toEqual(
      [],
    );
  });
});

describe("isNotFoundError", () => {
  test("mengenali blob yang sudah dihapus", () => {
    expect(
      isNotFoundError(
        new Error("Vercel Blob: The requested blob does not exist"),
      ),
    ).toBe(true);
    expect(isNotFoundError({ name: "BlobNotFoundError" })).toBe(true);
    expect(isNotFoundError(new Error("token invalid"))).toBe(false);
  });
});

describe("buildFreshBlobUrl", () => {
  test("menambah versi agar bacaan tidak memakai salinan cache", () => {
    expect(
      buildFreshBlobUrl(
        "https://example.public.blob.vercel-storage.com/live/messages.json",
        1710000000000,
      ),
    ).toBe(
      "https://example.public.blob.vercel-storage.com/live/messages.json?v=1710000000000",
    );
  });
});

describe("writeJsonDocument", () => {
  test("menulis ke berkas lokal di lingkungan non-Vercel tanpa token", async () => {
    const adapters = createMemoryAdapters({
      fileValue: [],
    });
    const nextValue = [{ id: "local-1" }];

    await writeJsonDocument("messages.json", nextValue, adapters);

    expect(adapters.fileWrites).toEqual([
      { fileName: "messages.json", value: nextValue },
    ]);
    expect(adapters.blobPuts).toEqual([]);
  });

  test("menulis ke Blob jika token ada, bukan ke filesystem", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
      fileValue: [],
    });
    const nextValue = [{ id: "persisted-1" }];

    await writeJsonDocument("rsvp.json", nextValue, adapters);

    expect(adapters.blobPuts).toEqual([
      {
        pathname: expect.stringMatching(/^live\/rsvp\/\d+-[0-9a-f-]+\.json$/),
        value: nextValue,
      },
    ]);
    expect(adapters.fileWrites).toEqual([]);
  });

  test("menolak tulis filesystem-only di Vercel jika token belum ada", async () => {
    const adapters = createMemoryAdapters({
      vercel: "1",
      fileValue: [],
    });

    await expect(
      writeJsonDocument("messages.json", [{ id: "x" }], adapters),
    ).rejects.toThrow(/BLOB_READ_WRITE_TOKEN/);

    expect(adapters.fileWrites).toEqual([]);
    expect(adapters.blobPuts).toEqual([]);
  });
});

describe("writePublicAsset", () => {
  test("mengunggah ke Blob jika token ada", async () => {
    const adapters = createMemoryAdapters({
      token: "vercel_blob_rw_test",
    });

    await expect(
      writePublicAsset("foto.jpg", new Uint8Array([1, 2, 3]), "image/jpeg", adapters),
    ).resolves.toBe("https://blob.vercel-storage.com/uploads/foto.jpg");
  });

  test("menolak unggahan filesystem-only di Vercel tanpa token", async () => {
    const adapters = createMemoryAdapters({
      vercel: "1",
    });

    await expect(
      writePublicAsset("foto.jpg", new Uint8Array([1, 2, 3]), "image/jpeg", adapters),
    ).rejects.toThrow(/BLOB_READ_WRITE_TOKEN/);
  });
});
