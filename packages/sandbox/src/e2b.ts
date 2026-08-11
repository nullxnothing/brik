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

/**
 * Every command and file operation runs as root, and this is not incidental.
 *
 * An E2B sandbox defaults to uid 1000, `user`, with $HOME at /home/user. That
 * account cannot read /root or write /workspace, which is exactly where the
 * toolchain image keeps everything that makes a build fast: the cargo registry
 * and the SBF platform-tools cache under /root, and the pre-built project at
 * /workspace/project. Run as the default user and `anchor build` cannot see any
 * of it, so the workspace silently pays a cold 40s compile instead of ~3s, or
 * fails outright with egress off.
 *
 * Verified in a sandbox: as `user`, /root is unreadable and /workspace is not
 * writable; with user "root", $HOME is /root and both are available.
 */
const RUN_AS = "root";

/**
 * The environment the image declares but E2B does not carry.
 *
 * E2B's Dockerfile converter drops `ENV` entirely: measured in a template built
 * from a Dockerfile declaring three variables, none reached the sandbox, not in
 * the command's environment, not in pid 1's, not in any shell init file. Since
 * the toolchain image puts cargo, rustup, anchor, and the Solana CLI on PATH
 * through `ENV`, a command that relies on it finds none of them.
 *
 * Supplying it per exec is enough, and is verified: with PATH passed this way a
 * binary that was unreachable a moment earlier resolves. It is duplicated from
 * the Dockerfile rather than derived from it, so the two have to be changed
 * together; the image's own `ENV` line is what this mirrors.
 */
const WORKSPACE_ENV: Record<string, string> = {
  PATH: [
    "/root/.cargo/bin",
    "/root/.local/share/solana/install/active_release/bin",
    "/usr/local/sbin",
    "/usr/local/bin",
    "/usr/sbin",
    "/usr/bin",
    "/sbin",
    "/bin",
  ].join(":"),
  HOME: "/root",
};

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
        user: RUN_AS,
        cwd: opts?.cwd,
        envs: { ...WORKSPACE_ENV, ...opts?.env },
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
    return this.sandbox.files.read(path, { user: RUN_AS });
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.sandbox.files.write(path, content, { user: RUN_AS });
  }

  async listFiles(path: string): Promise<string[]> {
    const entries = await this.sandbox.files.list(path, { user: RUN_AS });
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

  /**
   * A sandbox outlives the process that started it, and the id is enough to
   * reach it again. That matters wherever the control plane is not one
   * long-lived process: a second request can land on an instance that has never
   * heard of this workspace, and without this it would report a perfectly live
   * sandbox as gone and leak it until its own timeout.
   *
   * A failed connect is the honest answer to "is this still there", so it
   * returns null rather than throwing: the id may be expired, killed, or made
   * up.
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    const known = this.workspaces.get(id);
    if (known) return known;
    if (!this.apiKey) return null;

    try {
      const sandbox = await Sandbox.connect(id, { apiKey: this.apiKey });
      const workspace = new E2BWorkspace(id, this.name, sandbox);
      workspace.status = "ready";
      this.workspaces.set(id, workspace);
      return workspace;
    } catch {
      return null;
    }
  }

  async forget(id: string): Promise<void> {
    this.workspaces.delete(id);
  }
}
