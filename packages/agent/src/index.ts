/**
 * BRIK agent harness — vendor-neutral skeleton.
 *
 * The harness owns tools, context selection, routing, budgets, and task
 * state (docs/02_product_build_spec.md). Models are swappable; the harness
 * is the asset. Core rule: never claim build/test/deploy success without
 * tool evidence — every task step carries the ExecResult that proves it.
 */

import type { ExecResult, Workspace } from "@brik/sandbox";

/** Routing tiers per the AI cost strategy (docs/01 §4). */
export type ModelTier = "cheap" | "default" | "frontier";

export interface TaskBudget {
  maxToolCalls: number;
  maxCostUsd: number;
  maxDurationMs: number;
}

export type StepKind =
  | "plan"
  | "read"
  | "edit"
  | "exec"
  | "build"
  | "test"
  | "deploy";

export interface TaskStep {
  kind: StepKind;
  title: string;
  status: "pending" | "running" | "done" | "failed";
  /** Tool evidence — required for any step reported as done. */
  evidence?: ExecResult;
}

export interface AgentTask {
  id: string;
  objective: string;
  mode: "ask" | "build";
  steps: TaskStep[];
  changedFiles: string[];
  status: "running" | "succeeded" | "failed" | "cancelled";
}

export interface AgentHarness {
  /** Start a task against a workspace; steps stream via onStep. */
  run(
    workspace: Workspace,
    objective: string,
    opts: {
      mode: "ask" | "build";
      budget: TaskBudget;
      onStep?: (step: TaskStep) => void;
    },
  ): Promise<AgentTask>;

  cancel(taskId: string): Promise<void>;
}

export const DEFAULT_BUDGET: TaskBudget = {
  maxToolCalls: 50,
  maxCostUsd: 1.0,
  maxDurationMs: 10 * 60_000,
};

// Implementation lands with the core-loop sprint (days 6-14):
// tool registry over Workspace (read/search/edit/exec/build/test),
// model routing, prompt caching, and the eval-set harness from docs/07.
