const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brik.builders/";

// Callers join paths onto this directly, and the documented value in
// .env.example carries a trailing slash, so the origin is normalized once here
// rather than at every use site.
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");
