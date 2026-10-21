import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const globalForS3 = globalThis as unknown as { neonS3?: S3Client };

export function neonBucket(): string {
  const bucket = process.env.NEON_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error(
      "NEON_STORAGE_BUCKET belum diisi (bucket default: assets).",
    );
  }
  return bucket;
}

export function isNeonStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.NEON_STORAGE_BUCKET,
  );
}

/**
 * Neon Object Storage memakai path-style addressing. Kredensial, endpoint, dan
 * region dibaca otomatis dari env AWS_* hasil `neon deploy`.
 */
export function getS3(): S3Client {
  if (!globalForS3.neonS3) {
    globalForS3.neonS3 = new S3Client({ forcePathStyle: true });
  }
  return globalForS3.neonS3;
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: neonBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObjectText(key: string): Promise<string> {
  const result = await getS3().send(
    new GetObjectCommand({ Bucket: neonBucket(), Key: key }),
  );
  return (await result.Body?.transformToString()) ?? "";
}

export async function deleteObject(key: string): Promise<void> {
  await getS3().send(
    new DeleteObjectCommand({ Bucket: neonBucket(), Key: key }),
  );
}

/**
 * Bucket bersifat private, jadi URL publik harus di-presign dan punya masa
 * berlaku. Simpan `objectKey` di Postgres, presign saat render.
 */
export async function objectUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: neonBucket(), Key: key }),
    { expiresIn: expiresInSeconds },
  );
}
