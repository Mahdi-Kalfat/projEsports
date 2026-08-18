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

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const VIDEO_EXTENSION_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
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

// Same local-disk approach as saveUploadedImage, but under public/proof-uploads
// instead of public/uploads — this app rewrites every /uploads/:path* request to
// backoffice's origin (see next.config.ts), since that's where admin-uploaded
// images actually live. A file saved here would 404 through that rewrite (this
// app has no matching one back to itself), so proof-of-payment screenshots use
// a path the rewrite doesn't touch. backoffice/next.config.ts has the mirror
// rewrite pointing /proof-uploads/:path* back at this app, so admins can see
// them too.
export async function saveContactProofImage(file: File): Promise<UploadResult | null> {
  if (file.size === 0) return null;

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Images must be PNG, JPEG, WebP, or GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Images must be under 5MB." };
  }

  const dir = path.join(process.cwd(), "public", "proof-uploads", "contact");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { url: `/proof-uploads/contact/${filename}` };
}

// Same local-disk approach as saveUploadedImage, just a separate allow-list and a
// much bigger size cap — video files are naturally an order of magnitude larger
// than the avatar/banner/item images the rest of the app uploads.
export async function saveUploadedVideo(file: File, subdir: string): Promise<UploadResult | null> {
  if (file.size === 0) return null;

  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    return { error: "Videos must be MP4, WebM, or Ogg." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "Videos must be under 100MB." };
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${VIDEO_EXTENSION_BY_TYPE[file.type]}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { url: `/uploads/${subdir}/${filename}` };
}
