import Link from "next/link";
import { BrikBlock, BrikLoader, BrikMark, BrikWordmark } from "../../components/logo";
import { Meter, StatusBadge, WorkflowMarks, type Status } from "../../components/ui";

export const metadata = {
  title: "Brand",
  robots: { index: false, follow: false },
};

// Internal reference: mark, wordmark, and the system components at the sizes
// and on the surfaces that matter. Not linked from public navigation.

const STATUSES: Status[] = [
  "ready",
  "building",
  "testing",
  "failed",
  "deployed",
  "sleeping",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="meta-label mb-6 text-fg-3">{title}</h2>
      {children}
    </section>
  );
}

export default function Brand() {
  return (
    <main className="shell space-y-14 py-14">
      <div className="meta-label text-fg-3">
        <Link href="/" className="hover:text-fg">
          <span className="glyph">←</span> Brik
        </Link>{" "}
        / Brand
      </div>

      <div className="grid gap-4">
        <div className="flex flex-col gap-11 rounded-card border border-line bg-ink p-8 text-cream sm:p-12">
          <BrikWordmark size={120} />
          <div className="flex flex-wrap items-center gap-10">
            <BrikWordmark size={56} />
            <BrikWordmark size={32} />
            <BrikWordmark size={20} />
          </div>
          <div className="flex flex-wrap items-center gap-10">
            <BrikMark size={96} />
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
            <span className="meta-label opacity-55">96 / 64 / 32 / 16 px</span>
          </div>
        </div>

        <div
          className="flex flex-col gap-11 rounded-card border border-line p-8 sm:p-12"
          style={{ background: "var(--brik-cream)", color: "var(--brik-black)" }}
        >
          <BrikWordmark size={120} />
          <div className="flex flex-wrap items-center gap-10">
            <BrikMark size={64} />
            <BrikMark size={32} />
            <BrikMark size={16} />
            <span className="meta-label opacity-55">
              Inverted, near-black on cream
            </span>
          </div>
        </div>
      </div>

      <Section title="Status">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary">
            Deploy to devnet
          </button>
          <button type="button" className="btn btn-secondary">
            Import from GitHub
          </button>
          <button type="button" className="btn btn-ghost">
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled>
            Deploy
          </button>
          <button type="button" className="btn btn-primary">
            <BrikLoader size={13} />
            Building
          </button>
        </div>
      </Section>

      <Section title="Input">
        <div className="max-w-sm">
          <label htmlFor="rpc" className="meta-label block text-fg-2">
            RPC endpoint
          </label>
          <input
            id="rpc"
            className="field field-mono mt-2.5"
            defaultValue="https://api.devnet.solana.com"
          />
        </div>
      </Section>

      <Section title="Progress and meters">
        <div className="space-y-8">
          <WorkflowMarks complete={3} />
          <div className="max-w-xs">
            <Meter filled={4} label="Workspace hours" value="2.0 / 5" />
          </div>
          <div className="flex items-center gap-4 text-fg">
            <BrikLoader size={20} />
            <BrikBlock size={20} className="text-fg-3" />
          </div>
        </div>
      </Section>

      <Section title="Rules">
        <div className="max-w-[70ch] space-y-2 font-mono text-code-sm leading-[1.9] text-fg-2">
          <p>Mark: rounded square, stepped notch cut from the top-right corner.</p>
          <p>Radii: outer 15% of size, concave fillet 10%. Small cut below 32px.</p>
          <p>Wordmark: live Fredoka 600. The mark covers the tittle of the i.</p>
          <p>Color: cream #F5EFE0 on near-black #0C0C0C. Inverts cleanly.</p>
          <p>Minimum: mark 16px. Never letterspace or all-caps the wordmark.</p>
          <p>Never: gradients, glow, shadows, brick texture, rotation, recoloring.</p>
        </div>
      </Section>
    </main>
  );
}
