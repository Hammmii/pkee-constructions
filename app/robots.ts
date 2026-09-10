import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/design-system"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
