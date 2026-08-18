import { AttachmentBuilder } from "discord.js";

function extensionFromUrl(url: string): string {
  return /\.(png|jpe?g|webp|gif)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase() ?? "png";
}

// Discord's servers can't reach a local dev site to render an embed image
// URL directly (localhost isn't public), so the bot fetches the bytes
// itself — same machine, same network as frontoffice — and re-uploads them
// as a message attachment instead, referenced from the embed via
// "attachment://<name>". That also just works once SITE_URL is a real
// public domain, so there's no special-casing needed between dev and prod.
export async function fetchImageAttachment(url: string | undefined, baseName: string): Promise<AttachmentBuilder | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return new AttachmentBuilder(buffer, { name: `${baseName}.${extensionFromUrl(url)}` });
  } catch (err) {
    console.error(`Could not fetch ${baseName} image:`, err);
    return null;
  }
}
