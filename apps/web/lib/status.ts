/**
 * The workspace status vocabulary, fixed by PRODUCT.md.
 *
 * It lives here rather than beside StatusBadge because the server speaks it
 * too: the run emits these, and a route handler should not have to reach into
 * a React component module for the type.
 */
export type Status =
  | "ready"
  | "building"
  | "testing"
  | "failed"
  | "deployed"
  | "sleeping";
