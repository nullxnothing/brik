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

export interface SandboxProvider {
  readonly name: string;
  createWorkspace(spec: WorkspaceSpec): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | null>;
}
