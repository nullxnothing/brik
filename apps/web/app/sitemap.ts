import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

// /workspace is deliberately absent: it is gated behind BRIK_WORKSPACE_ENABLED
// and 404s when closed, so listing it would advertise a URL the deployment may
// refuse to serve. Its query variants collapse onto one canonical instead.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/new`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
