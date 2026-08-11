/**
 * Sandbox provider abstraction.
 *
 * BRIK buys workspace orchestration from a managed sandbox provider
 * (docs/02_product_build_spec.md — "buy, don't build"). Everything in the
 * product talks to this interface; the concrete provider (E2B, Modal,
 * Daytona, Fly Machines, or local Docker for development) is an adapter
 * chosen by config, so the bake-off can compare providers and the winner
 * can be swapped or in-sourced later without touching product code.
 */

export interface WorkspaceSpec {
  /** Template or image identifier, e.g. "solana-anchor-0.31". */
  image: string;
  /** CPU cores. */
  cpu: number;
  /** Memory in MiB. Anchor builds want 4096+. */
  memoryMib: number;
  /** Disk in MiB. */
  diskMib: number;
  /**
   * Egress policy. Anonymous-tier workspaces must be "locked" (RPC and
   * package registries only); see docs/07 abuse playbook.
   */
  egress: "locked" | "standard";
  /** Hard TTL after which the workspace is destroyed. */
  ttlSeconds: number;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  /**
   * Terminates the command early. A workspace run is driven by a client that
   * can disconnect mid-build, so every exec has to be interruptible.
   */
  signal?: AbortSignal;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export interface PortForward {
  /** Publicly reachable URL for the forwarded port. */
  url: string;
  port: number;
}

export interface Workspace {
  id: string;
  provider: string;
  status: "starting" | "ready" | "hibernated" | "destroyed";

  exec(command: string, opts?: ExecOptions): Promise<ExecResult>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
  forwardPort(port: number): Promise<PortForward>;
  hibernate(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;
}

/** A sandbox the provider says is running, whether or not anything here
 *  remembers asking for it. */
export interface RunningWorkspace {
  id: string;
  startedAt: Date;
}

export interface SandboxProvider {
  readonly name: string;
  createWorkspace(spec: WorkspaceSpec): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | null>;
  /**
   * Everything this provider is running for us right now.
   *
   * The provider is the only honest answer to "what is actually costing money",
   * because a lease can be lost while the sandbox it named keeps running.
   * Optional: Docker reaps its own exited containers by label instead.
   */
  listWorkspaces?(): Promise<RunningWorkspace[]>;
  /** Drop a workspace from the provider's bookkeeping. Destroying it is the
   *  caller's job; this only stops the provider holding a handle to something
   *  that is gone. */
  forget(id: string): Promise<void>;
}
