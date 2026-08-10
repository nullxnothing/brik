import Link from "next/link";
import { BrickMark, BrickWordmark } from "../../components/logo";

// Static workspace shell — the panel layout from docs/03_ui_ux_brand_spec.md.
// Editor, terminal, and agent panels are placeholders until the control
// plane and sandbox integration land.

export const metadata = {
  title: "BRICK — Workspace",
};

export default function Workspace() {
  return (
    <div className="ws">
      <div className="ws-top">
        <div className="ws-top-left">
          <Link href="/" className="nav-brand" aria-label="BRICK">
            <BrickMark size={14} />
            <BrickWordmark height={11} />
          </Link>
          <span>tip-jar</span>
          <span>main</span>
          <span className="badge">DEVNET</span>
        </div>
        <div className="ws-top-right">
          <span className="badge badge-ok">READY</span>
          <span>2.41 SOL</span>
          <span className="btn btn-primary" style={{ padding: "6px 14px" }}>
            DEPLOY
          </span>
        </div>
      </div>

      <div className="ws-main">
        <div className="ws-panel">
          <div className="ws-panel-title">FILES</div>
          <div>programs/tip-jar/src/lib.rs</div>
          <div>app/page.tsx</div>
          <div>app/wallet.tsx</div>
          <div>tests/tip-jar.ts</div>
          <div>Anchor.toml</div>
          <div>package.json</div>
        </div>

        <div className="ws-panel frame-editor">
          {`// Editor placeholder — Monaco integration pending.

#[program]
pub mod tip_jar {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.jar.total = 0;
        Ok(())
    }

    pub fn send_tip(ctx: Context<SendTip>, amount: u64) -> Result<()> {
        let jar = &mut ctx.accounts.jar;
        jar.total = jar.total.checked_add(amount).unwrap();
        Ok(())
    }
}`}
        </div>

        <div className="ws-panel frame-agent">
          <div className="ws-panel-title">AGENT</div>
          <div className="step done">Read program structure</div>
          <div className="step done">Add send_tip instruction</div>
          <div className="step done">anchor build — success</div>
          <div className="step done">Tests passing 3/3</div>
          <div className="step">Awaiting next task</div>
        </div>
      </div>

      <div className="ws-bottom">
        <div>$ anchor test</div>
        <div className="status-ok">3 passing (2.4s)</div>
        <div>$ _</div>
      </div>
    </div>
  );
}
