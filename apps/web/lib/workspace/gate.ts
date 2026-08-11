/**
 * Whether the workspace routes answer at all.
 *
 * A workspace is a container the server starts on request, and there is no
 * per-visitor limit in front of it yet, so an open route on the internet is
 * either a fabricated run or an unbounded bill. It is open where a developer is
 * running this locally and closed everywhere else until a deployment can afford
 * to say yes.
 *
 * Absence means closed in production, so losing the environment fails shut.
 */
export function isWorkspaceOpen(): boolean {
  const flag = process.env.BRIK_WORKSPACE_ENABLED;
  if (flag) return flag === "1" || flag === "true";
  return process.env.NODE_ENV !== "production";
}
