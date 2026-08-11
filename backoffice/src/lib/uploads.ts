import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadResult = { url: string } | { error: string };

// Saves straight to the local filesystem under public/ — fine for a single-server
// dev/self-hosted setup; swap for an object-storage adapter (R2/MinIO) before
// running more than one app instance, since local disk isn't shared between them.
export async function saveUploadedImage(file: File, subdir: string): Promise<UploadResult | null> {
  if (file.size === 0) return null;

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Images must be PNG, JPEG, WebP, or GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Images must be under 5MB." };
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { url: `/uploads/${subdir}/${filename}` };
}
