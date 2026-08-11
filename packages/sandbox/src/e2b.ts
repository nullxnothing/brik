import { CommandExitError, Sandbox } from "e2b";
import type {
  ExecOptions,
  ExecResult,
  PortForward,
  SandboxProvider,
  Workspace,
  WorkspaceSpec,
} from "./types.js";

/**
 * E2B provider.
 *
 * Chosen because it is the only candidate that runs the workspace unmodified.
 * Verified against a stock sandbox rather than a kernel config: the Agave 3.1.9
 * `solana-test-validator`, the binary that asserts `io_uring_supported()` and
 * panics without it, booted in 2s and answered JSON-RPC, on kernel 6.1.158+
 * with `Seccomp: 0`. A sandbox is a real Firecracker microVM with its own
 * kernel, so guest syscalls never meet a host seccomp profile and none of the
 * `seccomp=unconfined` compromise the Docker baseline needs applies here.
 *
 * Two spec fields do not survive the trip. E2B sizes CPU, memory, and disk per
 * template and plan, not per sandbox, so `cpu`, `memoryMib`, and `diskMib` are
 * decided when the template is built. They are ignored here rather than
 * silently approximated.
 */

const DEFAULT_TEMPLATE = process.env.E2B_TEMPLATE ?? "base";

function elapsed(startedAt: number): number {
  return Date.now() - startedAt;
}

class E2BWorkspace implements Workspace {
  status: Workspace["status"] = "starting";

  constructor(
    public readonly id: string,
    public readonly provider: string,
    private sandbox: Sandbox,
  ) {}

  /**
   * E2B throws on a non-zero exit; the rest of BRIK expects a result carrying
   * the code, because a failed `anchor build` is an outcome to stream, not an
   * exception to unwind.
   */
  async exec(command: string, opts?: ExecOptions): Promise<ExecResult> {
    const started = Date.now();
    try {
      const result = await this.sandbox.commands.run(command, {
        cwd: opts?.cwd,
        envs: opts?.env,
        timeoutMs: opts?.timeoutMs,
        onStdout: opts?.onStdout,
        onStderr: opts?.onStderr,
      });
      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: elapsed(started),
      };
    } catch (error) {
      if (error instanceof CommandExitError) {
        return {
          exitCode: error.exitCode,
          stdout: error.stdout,
          stderr: error.stderr,
          durationMs: elapsed(started),
        };
      }
      // A timeout or a sandbox that went away mid-command. Reported the way a
      // killed container is, so callers have one shape to handle.
      return {
        exitCode: -1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        durationMs: elapsed(started),
      };
    }
  }

  async readFile(path: string): Promise<string> {
    return this.sandbox.files.read(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.sandbox.files.write(path, content);
  }

  async listFiles(path: string): Promise<string[]> {
    const entries = await this.sandbox.files.list(path);
    return entries.map((entry) => entry.name);
  }

  async forwardPort(port: number): Promise<PortForward> {
    return { port, url: `https://${this.sandbox.getHost(port)}` };
  }

  /** Pause and reconnect are wired but not used by the product yet, and are
   *  the one part of this adapter the workspace flow does not exercise. */
  async hibernate(): Promise<void> {
    await this.sandbox.betaPause();
    this.status = "hibernated";
  }

  async resume(): Promise<void> {
    this.sandbox = await Sandbox.connect(this.id);
    this.status = "ready";
  }

  async destroy(): Promise<void> {
    await this.sandbox.kill();
    this.status = "destroyed";
  }
}

export class E2BProvider implements SandboxProvider {
  readonly name = "e2b";
  private workspaces = new Map<string, E2BWorkspace>();

  constructor(private readonly apiKey = process.env.E2B_API_KEY) {}

  async createWorkspace(spec: WorkspaceSpec): Promise<Workspace> {
    if (!this.apiKey) {
      throw new Error("E2B_API_KEY is not set");
    }
    const sandbox = await Sandbox.create({
      apiKey: this.apiKey,
      template: spec.image === "" ? DEFAULT_TEMPLATE : spec.image,
      timeoutMs: spec.ttlSeconds * 1000,
      // The workspace builds and deploys against its own validator, so the
      // anonymous tier never needs to reach the internet.
      allowInternetAccess: spec.egress !== "locked",
      metadata: { brik: "workspace" },
    });
    const workspace = new E2BWorkspace(sandbox.sandboxId, this.name, sandbox);
    workspace.status = "ready";
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) ?? null;
  }

  async forget(id: string): Promise<void> {
    this.workspaces.delete(id);
  }
}
