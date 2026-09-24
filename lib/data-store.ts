import { promises as fs } from "fs";
import path from "path";

export type DataStoreEnv = {
  BLOB_READ_WRITE_TOKEN?: string;
  VERCEL?: string;
};

export type BlobStorageClient = {
  getJson: (pathname: string) => Promise<unknown | null>;
  putJson: (pathname: string, value: unknown) => Promise<void>;
  putFile: (
    pathname: string,
    body: Uint8Array,
    contentType: string,
  ) => Promise<string>;
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
const missingBlobTokenMessage =
  "Penyimpanan belum dikonfigurasi. Buat Vercel Blob store lalu isi BLOB_READ_WRITE_TOKEN, kemudian deploy ulang.";

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
    const storedValue = await blob.getJson(blobJsonPath(fileName));
    if (storedValue !== null && storedValue !== undefined) {
      return storedValue as T;
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
    await blob.putJson(blobJsonPath(fileName), value);
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

function blobJsonPath(fileName: string): string {
  return `data/${fileName}`;
}

function assertLocalFilesystemWritable(env: DataStoreEnv): void {
  if (env.VERCEL) {
    throw new Error(missingBlobTokenMessage);
  }
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    status?: number;
    statusCode?: number;
    message?: string;
  };

  return (
    maybeError.status === 404 ||
    maybeError.statusCode === 404 ||
    /not found|404/i.test(maybeError.message || "")
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

const defaultBlobClient: BlobStorageClient = {
  async getJson(pathname) {
    const { get } = await import("@vercel/blob");
    try {
      const result = await get(pathname, {
        access: "private",
        useCache: false,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return null;
      }

      const rawContent = await new Response(result.stream).text();
      if (!rawContent.trim()) {
        return null;
      }

      return JSON.parse(rawContent) as unknown;
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
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
  },
  async putFile(pathname, body, contentType) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, Buffer.from(body), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return blob.url;
  },
};
