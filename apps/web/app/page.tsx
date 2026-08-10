import Link from "next/link";

function Mark() {
  return (
    <span className="mark" aria-hidden>
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          <Mark />
          BRICK
        </Link>
        <div className="nav-links">
          <a href="#build">BUILD</a>
          <a href="#docs">DOCS</a>
          <a href="#examples">EXAMPLES</a>
          <a
            href="https://github.com/nullxnothing/Brick"
            target="_blank"
            rel="noreferrer"
          >
            GITHUB
          </a>
          <Link href="/workspace" className="nav-cta">
            LAUNCH →
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="hero">
      <div className="container">
        <h1>
          From idea to a live Solana app.
          <br />
          In one tab.
        </h1>
        <p>
          Describe it or pick a template — BRICK builds, tests, and deploys it
          to devnet while you watch. No Rust, Anchor or Solana setup required.
        </p>
        <div className="hero-ctas">
          <Link href="/workspace" className="btn btn-primary">
            START BUILDING →
          </Link>
          <a href="#docs" className="btn btn-secondary">
            VIEW DOCUMENTATION
          </a>
        </div>
        <div className="hero-note">NO SIGNUP · NO LOCAL SETUP · DEVNET FREE</div>
      </div>
    </header>
  );
}

function Demo() {
  return (
    <section className="demo" id="build">
      <div className="container">
        <div className="frame">
          <div className="frame-titlebar">
            <span>tip-jar — devnet</span>
            <span className="status-ok">● READY</span>
          </div>
          <div className="frame-grid">
            <div className="frame-col frame-files">
              <div>programs/</div>
              <div className="active">&nbsp;&nbsp;lib.rs</div>
              <div>app/</div>
              <div>&nbsp;&nbsp;page.tsx</div>
              <div>&nbsp;&nbsp;wallet.tsx</div>
              <div>tests/</div>
              <div>&nbsp;&nbsp;tip-jar.ts</div>
              <div>Anchor.toml</div>
            </div>
            <div className="frame-col frame-editor">
              {`#[program]
`}
              <span className="kw">{`pub mod tip_jar `}</span>
              {`{
    pub fn send_tip(
        ctx: Context<SendTip>,
        amount: u64,
    ) -> Result<()> {
        let tip = &mut ctx.accounts.jar;
        tip.total += amount;
        Ok(())
    }
}`}
            </div>
            <div className="frame-col frame-agent">
              <div className="ws-panel-title">AGENT</div>
              <div className="step done">Read program structure</div>
              <div className="step done">Add send_tip instruction</div>
              <div className="step done">anchor build — success</div>
              <div className="step done">Tests passing 3/3</div>
              <div className="step">Deploying to devnet…</div>
            </div>
            <div className="frame-terminal">
              <div>$ anchor build</div>
              <div className="status-ok">BUILD COMPLETE 14.2s</div>
              <div>$ anchor deploy --provider.cluster devnet</div>
              <div className="status-ok">
                DEPLOYED · 7xKX…gAsU · TRANSACTION CONFIRMED
              </div>
            </div>
          </div>
          <div className="statusline">
            <span>DEVNET</span>
            <span>WALLET 2.41 SOL</span>
            <span className="status-ok">PROGRAM LIVE</span>
            <span>PREVIEW ↗</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const MODULES = [
  {
    index: "01",
    title: "BUILD",
    body: "A complete Solana workspace in seconds. Rust, Anchor, Solana CLI, and Node are ready before your coffee is.",
  },
  {
    index: "02",
    title: "TEST",
    body: "The agent runs your builds and tests, reads the failures, and iterates until they pass — with evidence, not claims.",
  },
  {
    index: "03",
    title: "DEPLOY",
    body: "One click to devnet with a funded dev wallet. A live preview URL you can share and anyone can fork.",
  },
  {
    index: "04",
    title: "INSPECT",
    body: "Programs, wallets, transactions, and decoded logs in one panel. Failed transaction → Ask AI to fix.",
  },
];

function Modules() {
  return (
    <section className="modules">
      <div className="container">
        <div className="section-label">
          <Mark /> BUILDING BLOCKS
        </div>
        <div className="module-grid">
          {MODULES.map((m) => (
            <div className="module" key={m.index}>
              <div className="module-index">{m.index}</div>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="workflow">
      <div className="container">
        <div className="section-label">
          <Mark /> WORKFLOW
        </div>
        <div className="workflow-row">
          <span className="workflow-step">WRITE</span>
          <span className="arrow">→</span>
          <span className="workflow-step">TEST</span>
          <span className="arrow">→</span>
          <span className="workflow-step">BUILD</span>
          <span className="arrow">→</span>
          <span className="workflow-step">DEPLOY</span>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container">
        <h2>Start building.</h2>
        <div className="hero-ctas">
          <Link href="/workspace" className="btn btn-primary">
            START BUILDING →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>BRICK — BUILD ON SOLANA. FROM YOUR BROWSER.</span>
        <span>© 2026 BRICK</span>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Demo />
        <Modules />
        <Workflow />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
