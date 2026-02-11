import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { reportError } from "./monitoring";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET || "cryptoeats-uploads";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const LOCAL_UPLOAD_DIR = isServerless
  ? path.resolve("/tmp", "uploads")
  : path.resolve(process.cwd(), "uploads");

export function isS3Configured(): boolean {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET);
}

const ALLOWED_CATEGORIES = ["menu_image", "restaurant_logo", "restaurant_photos", "menu_items", "driver_documents", "id_verification", "profile_photos"] as const;
type UploadCategory = typeof ALLOWED_CATEGORIES[number];

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "image/jpeg", "image/png"],
};

const CATEGORY_CONFIG: Record<string, { maxSize: number; allowedTypes: string[] }> = {
  menu_image: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
  restaurant_logo: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
  restaurant_photos: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
  menu_items: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
  driver_documents: { maxSize: 10 * 1024 * 1024, allowedTypes: [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document] },
  id_verification: { maxSize: 10 * 1024 * 1024, allowedTypes: [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document] },
  profile_photos: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
};

export interface CloudUploadResult {
  id: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  storageType: "s3" | "local";
}

export function validateCloudUpload(
  fileSize: number,
  mimeType: string,
  category: string
): { valid: boolean; error?: string } {
  const config = CATEGORY_CONFIG[category];
  if (!config) return { valid: false, error: `Unknown upload category: ${category}. Allowed: ${Object.keys(CATEGORY_CONFIG).join(", ")}` };
  if (fileSize > config.maxSize) return { valid: false, error: `File too large. Max: ${config.maxSize / 1024 / 1024}MB` };
  if (!config.allowedTypes.includes(mimeType)) return { valid: false, error: `File type not allowed: ${mimeType}` };
  return { valid: true };
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return map[mimeType] || ".bin";
}

export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string,
  category: string
): Promise<{ uploadUrl: string; fileKey: string; storageType: "s3" | "local" }> {
  const id = crypto.randomUUID();
  const ext = path.extname(fileName) || mimeToExt(mimeType);
  const fileKey = `${category}/${id}${ext}`;

  if (!isS3Configured()) {
    return {
      uploadUrl: `/api/uploads/${category}`,
      fileKey,
      storageType: "local",
    };
  }

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      uploadUrl: signedUrl,
      fileKey,
      storageType: "s3",
    };
  } catch (error: any) {
    reportError(error, { service: "cloud-storage", action: "getPresignedUploadUrl" });
    return {
      uploadUrl: `/api/uploads/${category}`,
      fileKey,
      storageType: "local",
    };
  }
}

export async function getPresignedDownloadUrl(
  fileKey: string
): Promise<{ downloadUrl: string; storageType: "s3" | "local" }> {
  if (!isS3Configured()) {
    return {
      downloadUrl: `/uploads/${fileKey}`,
      storageType: "local",
    };
  }

  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      downloadUrl: signedUrl,
      storageType: "s3",
    };
  } catch (error: any) {
    reportError(error, { service: "cloud-storage", action: "getPresignedDownloadUrl" });
    return {
      downloadUrl: `/uploads/${fileKey}`,
      storageType: "local",
    };
  }
}

export async function uploadToCloud(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  category: string
): Promise<CloudUploadResult> {
  const id = crypto.randomUUID();
  const ext = path.extname(originalName) || mimeToExt(mimeType);
  const fileKey = `${category}/${id}${ext}`;

  if (!isS3Configured()) {
    const dir = path.join(LOCAL_UPLOAD_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${id}${ext}`;
    fs.writeFileSync(path.join(dir, filename), fileBuffer);

    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `/uploads/${category}/${filename}`,
      category,
      storageType: "local",
    };
  }

  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    }));

    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`,
      category,
      storageType: "s3",
    };
  } catch (error: any) {
    reportError(error, { service: "cloud-storage", action: "uploadToCloud" });
    const dir = path.join(LOCAL_UPLOAD_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${id}${ext}`;
    fs.writeFileSync(path.join(dir, filename), fileBuffer);

    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `/uploads/${category}/${filename}`,
      category,
      storageType: "local",
    };
  }
}

export async function deleteFromCloud(fileKey: string): Promise<boolean> {
  if (!isS3Configured()) {
    const filePath = path.join(LOCAL_UPLOAD_DIR, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
    }));

    return true;
  } catch (error: any) {
    reportError(error, { service: "cloud-storage", action: "deleteFromCloud", fileKey });
    return false;
  }
}

export function getCloudStorageStatus(): {
  configured: boolean;
  provider: string;
  bucket?: string;
  region?: string;
} {
  if (isS3Configured()) {
    return {
      configured: true,
      provider: "aws-s3",
      bucket: S3_BUCKET,
      region: AWS_REGION,
    };
  }
  return {
    configured: false,
    provider: "local",
  };
}
