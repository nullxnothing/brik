import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

// /brand carries its own noindex, but it is also unlinked from public
// navigation, so keeping it out of the crawl saves the round trip that would
// only discover the tag.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/brand"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
