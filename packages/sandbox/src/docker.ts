import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  ExecOptions,
  ExecResult,
  PortForward,
  SandboxProvider,
  Workspace,
  WorkspaceSpec,
} from "./types.js";

/**
 * Local Docker provider — for development and as the baseline in the
 * provider bake-off. Not a production path: no real isolation guarantees
 * beyond the container boundary, no hibernation (stop/start only).
 */

function run(
  command: string,
  args: string[],
  opts: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn(command, args, { env: { ...process.env, ...opts.env } });
    let stdout = "";
    let stderr = "";
    const timer = opts.timeoutMs
      ? setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs)
      : null;

    child.stdout.on("data", (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      opts.onStdout?.(s);
    });
    child.stderr.on("data", (d: Buffer) => {
      const s = d.toString();
      stderr += s;
      opts.onStderr?.(s);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({
        exitCode: code ?? -1,
        stdout,
        stderr,
        durationMs: Date.now() - started,
      });
    });
  });
}

class DockerWorkspace implements Workspace {
  status: Workspace["status"] = "starting";

  constructor(
    public readonly id: string,
    public readonly provider: string,
    private readonly containerId: string,
  ) {}

  async exec(command: string, opts?: ExecOptions): Promise<ExecResult> {
    const args = ["exec"];
    if (opts?.cwd) args.push("-w", opts.cwd);
    for (const [k, v] of Object.entries(opts?.env ?? {})) {
      args.push("-e", `${k}=${v}`);
    }
    args.push(this.containerId, "bash", "-lc", command);
    return run("docker", args, opts);
  }

  async readFile(path: string): Promise<string> {
    const res = await this.exec(`cat ${JSON.stringify(path)}`);
    if (res.exitCode !== 0) throw new Error(`readFile failed: ${res.stderr}`);
    return res.stdout;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const b64 = Buffer.from(content, "utf8").toString("base64");
    const res = await this.exec(
      `mkdir -p "$(dirname ${JSON.stringify(path)})" && printf %s ${JSON.stringify(b64)} | base64 -d > ${JSON.stringify(path)}`,
    );
    if (res.exitCode !== 0) throw new Error(`writeFile failed: ${res.stderr}`);
  }

  async listFiles(path: string): Promise<string[]> {
    const res = await this.exec(`ls -1A ${JSON.stringify(path)}`);
    if (res.exitCode !== 0) throw new Error(`listFiles failed: ${res.stderr}`);
    return res.stdout.split("\n").filter(Boolean);
  }

  async forwardPort(port: number): Promise<PortForward> {
    const res = await run("docker", ["port", this.containerId, String(port)]);
    const mapped = res.stdout.trim().split("\n")[0];
    if (!mapped) throw new Error(`port ${port} is not published`);
    return { port, url: `http://${mapped.replace("0.0.0.0", "localhost")}` };
  }

  async hibernate(): Promise<void> {
    await run("docker", ["stop", this.containerId]);
    this.status = "hibernated";
  }

  async resume(): Promise<void> {
    await run("docker", ["start", this.containerId]);
    this.status = "ready";
  }

  async destroy(): Promise<void> {
    await run("docker", ["rm", "-f", this.containerId]);
    this.status = "destroyed";
  }
}

export class DockerProvider implements SandboxProvider {
  readonly name = "docker";
  private workspaces = new Map<string, DockerWorkspace>();

  async createWorkspace(spec: WorkspaceSpec): Promise<Workspace> {
    const id = `brik-${randomUUID().slice(0, 8)}`;
    const args = [
      "run",
      "-d",
      "--name",
      id,
      "--cpus",
      String(spec.cpu),
      "--memory",
      `${spec.memoryMib}m`,
      "-P",
    ];
    if (spec.egress === "locked") {
      // Baseline lockdown for local dev; the production egress policy
      // (allowlisted RPC + registries) lives with the chosen provider.
      args.push("--network", "none");
    }
    args.push(spec.image, "sleep", String(spec.ttlSeconds));

    const res = await run("docker", args);
    if (res.exitCode !== 0) {
      throw new Error(`docker run failed: ${res.stderr}`);
    }
    const ws = new DockerWorkspace(id, this.name, res.stdout.trim());
    ws.status = "ready";
    this.workspaces.set(id, ws);
    return ws;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.get(id) ?? null;
  }
}
