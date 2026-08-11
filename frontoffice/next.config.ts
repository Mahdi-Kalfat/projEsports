import type { NextConfig } from "next";

const BACKOFFICE_ORIGIN = process.env.BACKOFFICE_ORIGIN ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // Admin-uploaded images (tournament/event/shop/marketplace backgrounds, logos)
  // are saved to backoffice's own public/uploads by saveUploadedImage — this app
  // has a separate public/ dir, so those URLs 404 without this proxy. A stopgap
  // for local dev (both apps on known ports); backoffice/src/lib/uploads.ts
  // already flags that real object storage (R2/MinIO) is needed before either
  // app runs as more than one instance.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${BACKOFFICE_ORIGIN}/uploads/:path*` }];
  },
  experimental: {
    serverActions: {
      // Default is 1MB — posts-actions.ts submits post video clips through a
      // Server Action, so this has to cover the 100MB cap in lib/uploads.ts
      // (saveUploadedVideo) plus multipart/form-data boundary overhead.
      bodySizeLimit: "105mb",
    },
    // Separate limit from the one above: proxy.ts (Next 16's middleware) buffers
    // a clone of the request body to run the auth gate, capped at 10MB by
    // default — the video upload request was getting silently truncated there
    // before the Server Action ever saw the full body ("Unexpected end of
    // form"), independent of serverActions.bodySizeLimit.
    proxyClientMaxBodySize: "105mb",
  },
};

export default nextConfig;
