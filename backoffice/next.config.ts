import type { NextConfig } from "next";

const FRONTOFFICE_ORIGIN = process.env.FRONTOFFICE_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Mirror of frontoffice's /uploads/:path* rewrite, in the other direction:
  // proof-of-payment screenshots are uploaded from the front office (a buyer
  // replying to their own purchase report) and saved to that app's own
  // public/proof-uploads (see frontoffice/src/lib/uploads.ts) — this app has
  // no matching local files, so admins reviewing the report need this proxy
  // to actually see them.
  async rewrites() {
    return [{ source: "/proof-uploads/:path*", destination: `${FRONTOFFICE_ORIGIN}/proof-uploads/:path*` }];
  },
  experimental: {
    // Default is 1MB — forms here can carry several files at once (a
    // tournament's background image, logo, and average-rank image all in one
    // submit), each already capped at 5MB by lib/uploads.ts's saveUploadedImage,
    // so this just needs enough headroom for a few of those plus multipart
    // overhead. Set well above that so it stops being a recurring limit.
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Separate limit from the one above: proxy.ts (Next 16's middleware) buffers
    // a clone of the request body to run the auth gate, capped at 10MB by
    // default independent of serverActions.bodySizeLimit — without raising this
    // too, a large-enough upload gets silently truncated before the Server
    // Action ever sees the full body. Mirrors frontoffice/next.config.ts.
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
