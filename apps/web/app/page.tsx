import type { Metadata } from "next";
import Link from "next/link";
import { AutonomousDemo } from "../components/autonomous-demo";
import { DemoFrame } from "../components/demo-frame";
import { Reveal } from "../components/reveal";
import { DitherField } from "../components/dither-field";
import { LightRays } from "../components/light-rays";
import { XLogo } from "../components/icons";
import { HeroStage } from "../components/hero-stage";
import { LandingScroll } from "../components/landing-scroll";
import { BrikMark } from "../components/logo";
import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import { ButtonLink } from "../components/ui";
import { WorkflowSequence } from "../components/workflow-sequence";
import { SITE_URL } from "../lib/site";
import { TEMPLATES } from "../lib/templates";

export const metadata: Metadata = {
  alternates: {
    canonical: `${SITE_URL}/`,
  },
};

/**
 * What the visitor gets, stated the way the product states everything else: a
 * term and the measured value behind it. It replaces a row of claims with the
 * three facts those claims were standing in for.
 */
const HERO_READINGS = [
  { term: "Signup", value: "None" },
  { term: "Local setup", value: "None" },
  { term: "Test SOL", value: "1000 per workspace" },
];

const HERO_STAGES = ["Write", "Test", "Build", "Deploy"];

function Hero() {
  return (
    <HeroStage>
      <div className="brik-landing-frame brik-hero-shell">
        <div className="brik-hero-intro">
          <div className="brik-hero-copy min-w-0">
            <Reveal>
              <h1 className="font-display max-w-[18ch] text-display-xl leading-[0.98] font-medium text-balance">
                From idea to a live Solana app.
                <span className="block text-fg-2">In one tab.</span>
              </h1>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 max-w-[650px] text-body-lg text-fg-2">
                Describe it or pick a template. Brik builds, tests, and deploys it
                while you watch. No Rust, Anchor, or Solana setup required.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/new" variant="primary">
                  Start building
                </ButtonLink>
                <ButtonLink href="https://x.com/brikbuilders" variant="secondary" external>
                  <XLogo size={14} /> Follow on X
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={2} className="brik-hero-telemetry">
            <div className="flex items-center justify-between gap-6">
              <span className="meta-label text-fg-3">Measured workspace run</span>
              <span className="meta-label flex items-center gap-2 text-ok">
                <span className="size-1.5 rounded-[2px] bg-ok" aria-hidden />
                Deployed
              </span>
            </div>
            <dl className="brik-hero-readings">
              {HERO_READINGS.map((item) => (
                <div key={item.term}>
                  <dt className="meta-label text-fg-3">{item.term}</dt>
                  <dd className="mt-1.5 font-mono text-code-sm text-fg tabular-nums">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ol className="brik-hero-stages" aria-label="Workspace run stages">
              {HERO_STAGES.map((stage) => (
                <li key={stage}>
                  <BrikMark size={12} className="text-cream" />
                  <span>{stage}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal delay={2} className="brik-hero-product-reveal min-w-0">
          <div className="brik-hero-product">
            <DemoFrame />
          </div>
        </Reveal>
      </div>
    </HeroStage>
  );
}

function Capabilities() {
  return (
    <section id="build" className="relative">
      <div className="brik-landing-wide brik-proof-band relative">
        <div className="brik-section-head">
          <h2 className="font-display max-w-[20ch] text-display-md font-medium text-balance">
            Everything a Solana project needs, already running.
          </h2>
          <p className="max-w-[52ch] text-body-lg text-fg-2">
            Watch Brik boot a validator, resolve the toolchain, repair a compiler
            error, and prove the build without leaving the workspace.
          </p>
        </div>
        <div className="mt-11 md:mt-12">
          <AutonomousDemo />
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
    <section className="relative">
      <div className="brik-landing-wide brik-workflow-band relative">
        <div className="brik-section-head">
          <Reveal>
            <h2 className="font-display text-display-md font-medium text-balance">
              The agent stops on evidence, not on a claim.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-[48ch] text-body-lg text-fg-2">
              A failing suite sends it back to the file it just edited. Nothing
              is reported as done that a command did not report first.
            </p>
          </Reveal>
        </div>

        <Reveal delay={1} className="mt-10">
          <WorkflowSequence steps={LOOP} />
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The templates as a verification table rather than a row of cards.
 *
 * Every number in it was measured by `pnpm verify-templates`, which drives the
 * same HTTP route the browser does and runs each template twice against one
 * workspace. Showing the result is the strongest thing this section can say,
 * and it is the same term-and-value pattern the rest of the page uses.
 */
function Templates() {
  return (
    <section id="templates" className="relative">
      <div className="shell band relative">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h2 className="font-display max-w-[19ch] text-display-md font-medium text-balance">
              Every template starts already building.
            </h2>
            <p className="max-w-[36ch] font-mono text-code-sm text-fg-3">
              Built, deployed, and tested in a real workspace by{" "}
              <span className="whitespace-nowrap text-fg-2">
                pnpm verify-templates
              </span>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="mt-12 border-t border-line">
            <div className="brik-row meta-label hidden text-fg-off lg:grid">
              <span>Template</span>
              <span>What it does</span>
              <span>Stack</span>
              <span className="text-right">Deployed in</span>
              <span className="text-right">Tests</span>
              <span />
            </div>
            {TEMPLATES.map((template) => (
              <Link
                key={template.slug}
                href={`/workspace?template=${template.slug}`}
                className="brik-row brik-row-link border-t border-hairline"
              >
                <span className="text-body font-medium text-fg">
                  {template.name}
                </span>
                <span className="text-body text-fg-2">{template.tagline}</span>
                <span className="meta-label text-fg-3">{template.stack}</span>
                <span
                  className="brik-cell font-mono text-code-sm text-fg tabular-nums lg:text-right"
                  data-label="Deployed in"
                >
                  {template.verified.seconds.toFixed(1)}s
                </span>
                <span
                  className="brik-cell font-mono text-code-sm text-ok tabular-nums lg:text-right"
                  data-label="Tests"
                >
                  {template.verified.tests} passing
                </span>
                <span className="brik-row-go glyph text-fg-3" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The close. The page has been dense for four bands, so this one is the quiet
 * moment: a full-bleed rule to mark the turn, the mark at size, and one action.
 * The field rings it, so nothing else needs to.
 */
function About() {
  return (
    <section id="about" className="relative">
      <div className="brik-bleed-rule" aria-hidden />
      <div className="shell relative py-24 text-center md:py-32">
        <Reveal>
          <BrikMark size={40} className="mx-auto text-cream" />
          <h2 className="font-display mx-auto mt-8 max-w-[22ch] text-display-md font-medium text-balance">
            Brik is a product of Brik Builders LLC.
          </h2>
          <p className="mx-auto mt-6 max-w-[42ch] text-body text-fg-3">
            No signup, no local setup, and a working app about five minutes
            after you start.
          </p>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/new" variant="primary">
              Start building
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* The field stays continuous across the page. The opening light is
          document-bound so its WebGL loop can stop once the hero is offscreen. */}
      <DitherField className="brik-field-page" variant="page" seed={17} intensity={1.5} />
      <LightRays
        className="brik-rays"
        raysOrigin="top-center"
        raysColor="#f5efe0"
        raysSpeed={0.4}
        lightSpread={0.32}
        rayLength={2.8}
        fadeDistance={1.3}
        saturation={0.8}
      />
      <SiteNav wide />
      <LandingScroll />
      <main className="relative">
        <Hero />
        <Capabilities />
        <Workflow />
        <Templates />
        <About />
      </main>
      <SiteFooter />
    </>
  );
}
