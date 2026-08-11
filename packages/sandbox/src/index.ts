export * from "./types.js";
export {
  DockerProvider,
  WORKSPACE_LABEL,
  reapExitedWorkspaces,
} from "./docker.js";
export { E2BProvider } from "./e2b.js";

// E2B is the managed provider (docs/07 §2). It was picked on the one thing that
// eliminates most candidates: a sandbox is a real Firecracker microVM whose own
// kernel supports io_uring, so the Agave validator runs unmodified and with the
// host's seccomp profile left alone. Verified with the real binary, not a
// kernel config; see e2b.ts.
//
// Modal is out, gVisor does not implement io_uring. Railway is out, its seccomp
// blocks it. Fly Machines remain the runner-up on a real guest kernel.
