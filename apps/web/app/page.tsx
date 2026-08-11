import { DemoFrame } from "../components/demo-frame";
import { BrikMark } from "../components/logo";
import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import { ButtonLink, ComingSoon } from "../components/ui";
import { TEMPLATES } from "../lib/templates";

function Hero() {
  return (
    <header className="border-b border-hairline">
      <div className="shell pt-20 pb-16 md:pt-28">
        <h1 className="font-display text-display-xl font-semibold">
          From idea to a live Solana app.
          <span className="block text-fg-2">In one tab.</span>
        </h1>
        <p className="mt-7 max-w-[52ch] text-body-lg text-fg-2">
          Describe it or pick a template. Brik builds, tests, and deploys it
          while you watch. No Rust, Anchor, or Solana setup required.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ComingSoon />
          <ButtonLink href="https://x.com/brikbuilders" variant="secondary" external>
            Follow on X <span className="glyph">↗</span>
          </ButtonLink>
        </div>
        <p className="meta-label mt-5 text-fg-3">
          No signup · No local setup · Unlimited test SOL
        </p>
      </div>
      <div className="shell pb-20 md:pb-24">
        <DemoFrame />
      </div>
    </header>
  );
}

const CAPABILITIES = [
  {
    title: "A workspace, not a sandbox",
    body: "Rust, Anchor, the Solana CLI, and Node are installed before the page finishes loading. Your terminal is a real terminal.",
    visual: (
      // Read out of brik/solana-toolchain:dev. Changing the image changes these.
      <div className="font-mono text-code-sm leading-[1.9] text-fg-3">
        <div>
          <span className="text-fg-2">rustc</span> 1.85.0
        </div>
        <div>
          <span className="text-fg-2">solana-cli</span> 3.1.9
        </div>
        <div>
          <span className="text-fg-2">anchor-cli</span> 0.31.1
        </div>
        <div>
          <span className="text-fg-2">node</span> 22.23.2
        </div>
      </div>
    ),
  },
  {
    title: "An agent that runs the project",
    body: "It edits files, runs the build, reads the failure, and tries again. Every claim it makes is backed by a command you can read.",
    visual: (
      <div className="font-mono text-code-sm leading-[1.9]">
        <div className="text-err">error[E0308]: mismatched types</div>
        <div className="text-fg-3">↳ jar.total expects u64, found u32</div>
        <div className="text-fg-2">edit programs/project/src/lib.rs</div>
        <div className="text-ok">retry · build complete</div>
      </div>
    ),
  },
  {
    title: "A chain of your own, then devnet",
    body: "Every workspace runs its own Solana validator, so SOL is unlimited and deploys are instant. Push to devnet when you want a URL to share.",
    visual: (
      <div className="font-mono text-code-sm leading-[1.9] text-fg-3">
        <div className="text-fg-2">brik-localnet start</div>
        <div>Wallet funded · 1000 SOL</div>
        <div>
          <span className="text-ok">Ready</span> · 1.9s
        </div>
      </div>
    ),
  },
  {
    title: "Your code stays yours",
    body: "Git is wired in from the first commit. Push to your own repo, clone it locally, or walk away with the whole project.",
    visual: (
      <div className="font-mono text-code-sm leading-[1.9] text-fg-3">
        <div>
          <span className="text-fg-2">$</span> git remote -v
        </div>
        <div>origin git@github.com:you/tip-jar.git</div>
        <div>
          <span className="text-fg-2">$</span> git push
        </div>
        <div className="text-ok">main → origin/main</div>
      </div>
    ),
  },
];

function Capabilities() {
  return (
    <section id="build" className="border-b border-hairline">
      <div className="shell py-20 md:py-28">
        <h2 className="font-display max-w-[20ch] text-display-md font-semibold text-balance">
          Everything a Solana project needs, already running.
        </h2>
        <div className="seam mt-12 rounded-card border border-line md:grid-cols-2">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="p-7">
              <h3 className="text-heading font-medium">{item.title}</h3>
              <p className="mt-3 max-w-[46ch] text-body text-fg-2">{item.body}</p>
              <div className="mt-6 rounded-panel border border-hairline bg-sunken p-4">
                {item.visual}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const LOOP = [
  { step: "Write", body: "It reads the project first, then edits the files the change actually touches." },
  { step: "Test", body: "Tests run on every change. A red suite stops the loop, it does not get explained away." },
  { step: "Build", body: "anchor build runs for real. The compiler output is the evidence." },
  { step: "Deploy", body: "Instant deploy to the workspace validator, then devnet when you want to share it." },
];

function Workflow() {
  return (
    <section className="border-b border-hairline bg-surface-alt">
      <div className="shell py-20 md:py-24">
        <h2 className="font-display max-w-[22ch] text-display-md font-semibold">
          The agent stops on evidence, not on a claim.
        </h2>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((item, i) => (
            <li key={item.step}>
              <div className="flex h-5 items-center gap-3">
                <BrikMark size={18} className="text-cream" />
                {i < LOOP.length - 1 && (
                  <span className="glyph text-fg-3" aria-hidden>
                    →
                  </span>
                )}
              </div>
              <h3 className="meta-label mt-5 text-fg">{item.step}</h3>
              <p className="mt-2.5 max-w-[34ch] text-body text-fg-2">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Templates() {
  return (
    <section id="templates" className="border-b border-hairline">
      <div className="shell py-20 md:py-28">
        <h2 className="font-display max-w-[20ch] text-display-md font-semibold text-balance">
          Every template starts already building.
        </h2>

        <div className="seam mt-12 rounded-card border border-line sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((template) => (
            <article key={template.slug} className="flex flex-col gap-4 p-6">
              <h3 className="text-heading font-medium">{template.name}</h3>
              <p className="text-body text-fg-2">{template.tagline}</p>
              <div className="meta-label mt-auto border-t border-hairline pt-4 text-fg-3">
                {template.stack}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-hairline bg-sunken">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/social/brik-ascii-field.svg)",
          maskImage:
            "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 25%, #000 100%)",
        }}
        aria-hidden
      />
      <div className="shell relative py-28 text-center md:py-36">
        <BrikMark size={40} className="mx-auto text-cream" />
        <h2 className="font-display mt-8 text-display-md font-semibold">
          Almost open.
        </h2>
        <p className="mx-auto mt-4 max-w-[42ch] text-body-lg text-fg-2">
          No signup, no local setup, and a working app about five minutes after
          you start.
        </p>
        <div className="mt-9 flex justify-center">
          <ComingSoon />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Capabilities />
        <Workflow />
        <Templates />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
