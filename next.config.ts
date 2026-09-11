import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next 16 global 404 (app/global-not-found.tsx) for unmatched routes.
    globalNotFound: true,
    serverActions: {
      // Quote attachments ride inside the form's FormData (≤5 × 10 MB +
      // multipart overhead).
      bodySizeLimit: "15mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85],
    remotePatterns: [
      // Supabase Storage public URLs (storage.<region>.<project>.supabase.co)
      { protocol: "https", hostname: "*.supabase.co" },
      // S3/Supabase S3-compat endpoint host if media URLs derive from it
      ...(process.env.S3_PUBLIC_URL
        ? [new URL(process.env.S3_PUBLIC_URL).hostname].map((hostname) => ({
            protocol: "https" as const,
            hostname,
          }))
        : []),
    ],
  },
};

export default withPayload(nextConfig);
