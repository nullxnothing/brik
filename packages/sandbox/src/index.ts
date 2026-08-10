export * from "./types.js";
export { DockerProvider } from "./docker.js";

// Managed-provider adapters land after the bake-off
// (docs/07_pre_build_research_agenda.md §2). Candidates:
//   - E2B
//   - Modal
//   - Daytona
//   - Fly Machines
// Each becomes a class implementing SandboxProvider in its own module.
