import { promises as fs } from "fs";
import path from "path";

export type DataStoreEnv = {
  BLOB_READ_WRITE_TOKEN?: string;
  VERCEL?: string;
};

export type BlobRevision = {
  pathname: string;
  url: string;
  uploadedAtMs: number;
};

export type BlobStorageClient = {
  getJson: (pathname: string) => Promise<unknown | null>;
  putJson: (pathname: string, value: unknown) => Promise<void>;
  putFile: (
    pathname: string,
    body: Uint8Array,
    contentType: string,
  ) => Promise<string>;
  listRevisions?: (prefix: string) => Promise<BlobRevision[]>;
  deleteBlobs?: (urls: string[]) => Promise<void>;
  readJsonUrl?: (url: string) => Promise<unknown | null>;
};

export type FileStorageClient = {
  readJson: (fileName: string) => Promise<unknown>;
  writeJson: (fileName: string, value: unknown) => Promise<void>;
  writeFile: (fileName: string, body: Uint8Array) => Promise<string>;
};

export type DataStoreAdapters = {
  env?: DataStoreEnv;
  blob?: BlobStorageClient;
  files?: FileStorageClient;
};

const dataDirectory = path.join(process.cwd(), "data");
const uploadDirectory = path.join(process.cwd(), "public", "uploads");
const blobAccess = "public" as const;
const blobCacheSeconds = 60;
const guestJsonFiles = new Set(["messages.json", "rsvp.json"]);
const missingBlobTokenMessage =
  "Penyimpanan belum dikonfigurasi. Buat Vercel Blob store (Public) lalu isi BLOB_READ_WRITE_TOKEN, kemudian deploy ulang.";

function readProcessEnv(): DataStoreEnv {
  return {
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    VERCEL: process.env.VERCEL,
  };
}

export function isBlobStorageConfigured(env?: DataStoreEnv): boolean {
  const resolvedEnv = env ?? readProcessEnv();
  return Boolean(resolvedEnv.BLOB_READ_WRITE_TOKEN?.trim());
}

function resolveEnv(adapters: DataStoreAdapters): DataStoreEnv {
  return adapters.env ?? readProcessEnv();
}

export async function readJsonDocument<T>(
  fileName: string,
  adapters: DataStoreAdapters = {},
): Promise<T> {
  const env = resolveEnv(adapters);
  const files = adapters.files ?? defaultFileClient;

  if (isBlobStorageConfigured(env)) {
    const blob = adapters.blob ?? defaultBlobClient;
    const storedValue = await readBlobDocument(fileName, blob);
    if (storedValue !== null && storedValue !== undefined) {
      return storedValue as T;
    }

    const guestFallback = emptyGuestDocument<T>(fileName);
    if (guestFallback !== undefined) {
      return guestFallback;
    }
  }

  return (await files.readJson(fileName)) as T;
}

export async function writeJsonDocument(
  fileName: string,
  value: unknown,
  adapters: DataStoreAdapters = {},
): Promise<void> {
  const env = resolveEnv(adapters);

  if (isBlobStorageConfigured(env)) {
    const blob = adapters.blob ?? defaultBlobClient;
    await writeBlobDocument(fileName, value, blob);
    return;
  }

  assertLocalFilesystemWritable(env);
  const files = adapters.files ?? defaultFileClient;
  await files.writeJson(fileName, value);
}

export async function writePublicAsset(
  fileName: string,
  body: Uint8Array,
  contentType: string,
  adapters: DataStoreAdapters = {},
): Promise<string> {
  const env = resolveEnv(adapters);

  if (isBlobStorageConfigured(env)) {
    const blob = adapters.blob ?? defaultBlobClient;
    return blob.putFile(`uploads/${fileName}`, body, contentType);
  }

  assertLocalFilesystemWritable(env);
  const files = adapters.files ?? defaultFileClient;
  return files.writeFile(fileName, body);
}

function isGuestJsonFile(fileName: string): boolean {
  return guestJsonFiles.has(fileName);
}

function emptyGuestDocument<T>(fileName: string): T | undefined {
  if (!isGuestJsonFile(fileName)) {
    return undefined;
  }

  return [] as T;
}

export function buildFreshBlobUrl(blobUrl: string, version: number): string {
  const freshUrl = new URL(blobUrl);
  freshUrl.searchParams.set("v", String(version));
  return freshUrl.toString();
}

function blobJsonPath(fileName: string): string {
  return `data/${fileName}`;
}

function guestRevisionPrefix(fileName: string): string {
  return `live/${fileName.replace(/\.json$/, "")}/`;
}

export function createGuestRevisionPath(
  fileName: string,
  revisionId: string,
): string {
  return `${guestRevisionPrefix(fileName)}${revisionId}.json`;
}

export function pickLatestRevision(
  revisions: BlobRevision[],
): BlobRevision | null {
  return revisions.reduce<BlobRevision | null>((latest, revision) => {
    if (!latest || revision.uploadedAtMs > latest.uploadedAtMs) {
      return revision;
    }
    return latest;
  }, null);
}

async function readBlobDocument(
  fileName: string,
  blob: BlobStorageClient,
): Promise<unknown | null> {
  const latestRevision = await readLatestGuestRevision(fileName, blob);
  if (latestRevision) {
    if (blob.readJsonUrl) {
      return blob.readJsonUrl(latestRevision.url);
    }
    return blob.getJson(latestRevision.pathname);
  }

  if (!isGuestJsonFile(fileName)) {
    return blob.getJson(blobJsonPath(fileName));
  }

  return readLegacyGuestDocument(fileName, blob);
}

async function readLatestGuestRevision(
  fileName: string,
  blob: BlobStorageClient,
): Promise<BlobRevision | null> {
  if (!isGuestJsonFile(fileName) || !blob.listRevisions) {
    return null;
  }

  const revisions = await blob.listRevisions(guestRevisionPrefix(fileName));
  return pickLatestRevision(revisions);
}

async function readLegacyGuestDocument(
  fileName: string,
  blob: BlobStorageClient,
): Promise<unknown | null> {
  const liveDocument = await blob.getJson(`live/${fileName}`);
  if (liveDocument !== null && liveDocument !== undefined) {
    return liveDocument;
  }

  return blob.getJson(`data/${fileName}`);
}

async function writeBlobDocument(
  fileName: string,
  value: unknown,
  blob: BlobStorageClient,
): Promise<void> {
  if (!isGuestJsonFile(fileName) || !blob.listRevisions || !blob.deleteBlobs) {
    await blob.putJson(blobJsonPath(fileName), value);
    return;
  }

  const pathname = createGuestRevisionPath(
    fileName,
    `${Date.now()}-${crypto.randomUUID()}`,
  );
  await blob.putJson(pathname, value);
  await removeOlderGuestRevisions(fileName, pathname, blob);
}

async function removeOlderGuestRevisions(
  fileName: string,
  currentPathname: string,
  blob: BlobStorageClient,
): Promise<void> {
  if (!blob.listRevisions || !blob.deleteBlobs) {
    return;
  }

  const revisions = await blob.listRevisions(guestRevisionPrefix(fileName));
  const staleUrls = revisions
    .filter((revision) => revision.pathname !== currentPathname)
    .map((revision) => revision.url);

  if (staleUrls.length === 0) {
    return;
  }

  try {
    await blob.deleteBlobs(staleUrls);
  } catch {
    // Revisi lama boleh tertinggal. Bacaan tetap memakai revisi terbaru.
  }
}

function assertLocalFilesystemWritable(env: DataStoreEnv): void {
  if (env.VERCEL) {
    throw new Error(missingBlobTokenMessage);
  }
}

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    name?: string;
    status?: number;
    statusCode?: number;
    message?: string;
  };

  if (maybeError.name === "BlobNotFoundError") {
    return true;
  }

  return (
    maybeError.status === 404 ||
    maybeError.statusCode === 404 ||
    /not found|does not exist|404/i.test(maybeError.message || "")
  );
}

const defaultFileClient: FileStorageClient = {
  async readJson(fileName) {
    const filePath = path.join(dataDirectory, fileName);
    const rawContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(rawContent) as unknown;
  },
  async writeJson(fileName, value) {
    await fs.mkdir(dataDirectory, { recursive: true });
    const filePath = path.join(dataDirectory, fileName);
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    await fs.writeFile(temporaryPath, serialized, "utf8");
    await fs.rename(temporaryPath, filePath);
  },
  async writeFile(fileName, body) {
    await fs.mkdir(uploadDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadDirectory, fileName), body);
    return `/uploads/${fileName}`;
  },
};

function toBlobRevision(blob: {
  pathname: string;
  url: string;
  uploadedAt: Date;
}): BlobRevision {
  return {
    pathname: blob.pathname,
    url: blob.url,
    uploadedAtMs: blob.uploadedAt.getTime(),
  };
}

function parseStoredJson(rawContent: string): unknown | null {
  if (!rawContent.trim()) {
    return null;
  }

  return JSON.parse(rawContent) as unknown;
}

const defaultBlobClient: BlobStorageClient = {
  async getJson(pathname) {
    const { head } = await import("@vercel/blob");
    try {
      const metadata = await head(pathname);
      if (!metadata?.url) {
        return null;
      }

      const response = await fetch(buildFreshBlobUrl(metadata.url, Date.now()), {
        cache: "no-store",
      });
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Dokumen ${pathname} gagal dibaca.`);
      }

      return parseStoredJson(await response.text());
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  },
  async putJson(pathname, value) {
    const { put } = await import("@vercel/blob");
    await put(pathname, `${JSON.stringify(value, null, 2)}\n`, {
      access: blobAccess,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: blobCacheSeconds,
    });
  },
  async readJsonUrl(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error("Dokumen tamu gagal dibaca.");
    }
    return parseStoredJson(await response.text());
  },
  async listRevisions(prefix) {
    const { list } = await import("@vercel/blob");
    const revisions: BlobRevision[] = [];
    let cursor: string | undefined;

    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      revisions.push(...page.blobs.map(toBlobRevision));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return revisions;
  },
  async deleteBlobs(urls) {
    if (urls.length === 0) {
      return;
    }

    const { del } = await import("@vercel/blob");
    await del(urls);
  },
  async putFile(pathname, body, contentType) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, Buffer.from(body), {
      access: blobAccess,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return blob.url;
  },
};
