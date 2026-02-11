import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const UPLOAD_DIR = isServerless
  ? path.resolve("/tmp", "uploads")
  : path.resolve(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "image/jpeg", "image/png"],
};

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
}

function ensureUploadDir(subdir: string) {
  const dir = path.join(UPLOAD_DIR, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getUploadCategories() {
  return {
    restaurant_photos: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.image },
    menu_items: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.image },
    driver_documents: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.document },
    id_verification: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.document },
    profile_photos: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image },
  };
}

export function validateUpload(
  fileSize: number,
  mimeType: string,
  category: keyof ReturnType<typeof getUploadCategories>
): { valid: boolean; error?: string } {
  const config = getUploadCategories()[category];
  if (!config) return { valid: false, error: `Unknown upload category: ${category}` };
  if (fileSize > config.maxSize) return { valid: false, error: `File too large. Max: ${config.maxSize / 1024 / 1024}MB` };
  if (!config.allowedTypes.includes(mimeType)) return { valid: false, error: `File type not allowed: ${mimeType}` };
  return { valid: true };
}

export async function saveUpload(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  category: string
): Promise<UploadResult> {
  const dir = ensureUploadDir(category);
  const ext = path.extname(originalName) || mimeTypeToExt(mimeType);
  const id = crypto.randomUUID();
  const filename = `${id}${ext}`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, fileBuffer);

  return {
    id,
    filename,
    originalName,
    mimeType,
    size: fileBuffer.length,
    url: `/uploads/${category}/${filename}`,
    category,
  };
}

export function deleteUpload(category: string, filename: string): boolean {
  const filePath = path.join(UPLOAD_DIR, category, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function mimeTypeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return map[mimeType] || ".bin";
}

export function getUploadUrl(category: string, filename: string): string {
  return `/uploads/${category}/${filename}`;
}

export function getUploadPath(): string {
  return UPLOAD_DIR;
}
