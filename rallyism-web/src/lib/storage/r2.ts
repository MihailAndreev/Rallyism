import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

function requireR2Config() {
  if (
    !r2Endpoint ||
    !r2AccessKeyId ||
    !r2SecretAccessKey ||
    !r2BucketName ||
    !r2PublicBaseUrl
  ) {
    throw new Error("Cloudflare R2 storage is not configured.");
  }

  return {
    endpoint: r2Endpoint,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    bucketName: r2BucketName,
    publicBaseUrl: r2PublicBaseUrl.replace(/\/+$/, ""),
  };
}

function getR2Client() {
  const config = requireR2Config();

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function encodeObjectKeyForUrl(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function getR2PublicUrl(key: string) {
  const config = requireR2Config();

  return `${config.publicBaseUrl}/${encodeObjectKeyForUrl(key)}`;
}

export async function uploadR2Object(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  const config = requireR2Config();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl:
        input.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
}

export async function createPresignedR2PutUrl(input: {
  key: string;
  contentType: string;
  cacheControl?: string;
  expiresInSeconds?: number;
}) {
  const config = requireR2Config();
  const client = getR2Client();
  const cacheControl =
    input.cacheControl ?? "public, max-age=31536000, immutable";

  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      ContentType: input.contentType,
      CacheControl: cacheControl,
    }),
    { expiresIn: input.expiresInSeconds ?? 60 * 60 },
  );

  return {
    url,
    headers: {
      "Content-Type": input.contentType,
      "Cache-Control": cacheControl,
    },
  };
}

export async function deleteR2Object(key: string) {
  const config = requireR2Config();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
