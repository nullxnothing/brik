/**
 * A template is the source a workspace starts from.
 *
 * `program` and `test` are written into the container's pre-built Anchor
 * project, replacing its scratch program and suite. Nothing else is written,
 * which is deliberate: the manifests stay exactly as the image compiled them,
 * so cargo reuses the pre-built target directory and the build takes seconds
 * rather than a minute.
 *
 * The consequence is a hard constraint on template authors. A workspace runs
 * with egress off and cannot fetch a crate or an npm package, so a template may
 * only use what the image already carries: anchor-lang (with init-if-needed),
 * anchor-spl (with metadata), and for the suite, @coral-xyz/anchor,
 * @solana/spl-token, chai, and mocha. Reaching for anything else fails the
 * build inside the workspace rather than here.
 *
 * `tools/verify-templates` compiles and runs every template in the image, which
 * is what keeps that constraint honest.
 */
export interface Template {
  slug: string;
  name: string;
  tagline: string;
  /** Shown on the template card. Names what the program actually uses. */
  stack: string;
  /** The objective the workspace opens with. */
  task: string;
  /** The Anchor program, written to programs/project/src/lib.rs. */
  program: string;
  /** The mocha suite, written to tests/project.ts. */
  test: string;
}
