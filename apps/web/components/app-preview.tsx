"use client";

import { BrikLoader, BrikMark } from "./logo";

/** The four template previews. Rendered in the light token map, because this
 *  is the visitor's app rather than Brik's chrome. */
const APPS: Record<string, React.ReactNode> = {
  "tip-jar": (
    <div className="w-full max-w-[360px] rounded-card border border-line bg-surface p-7">
      <p className="meta-label text-fg-3">Support this project</p>
      <p className="font-display mt-4 text-display-md font-semibold">12.4 SOL</p>
      <p className="mt-1 text-body text-fg-2">tipped by 84 people</p>
      <div className="mt-6 flex gap-2">
        {["0.1", "0.5", "1.0"].map((amount, i) => (
          <span
            key={amount}
            className={`flex-1 rounded-control border py-2 text-center text-body ${
              i === 1 ? "border-fg bg-selected text-fg" : "border-line text-fg-2"
            }`}
          >
            {amount}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-button bg-ink py-2.5 text-center text-body font-medium text-cream">
        Send tip
      </div>
      <p className="mt-4 text-center font-mono text-code-sm text-fg-3">Bq4v…7Yhz</p>
    </div>
  ),
  "nft-mint": (
    <div className="w-full max-w-[340px] rounded-card border border-line bg-surface p-7">
      <div
        className="aspect-square w-full rounded-panel border border-line"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #E9E8E3 0 10px, #F1F0EB 10px 20px)",
        }}
      />
      <h3 className="mt-5 text-heading font-medium">Orbital Series</h3>
      <div className="mt-2 flex items-center justify-between text-body text-fg-2">
        <span>412 / 1000 minted</span>
        <span>0.8 SOL</span>
      </div>
      <div className="mt-5 rounded-button bg-ink py-2.5 text-center text-body font-medium text-cream">
        Mint
      </div>
    </div>
  ),
  "token-gate": (
    <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-8">
      <div className="meta-label inline-flex items-center gap-2 rounded-[7px] border border-line px-3 py-[7px] text-fg-2">
        <span className="size-[7px] rounded-[2px] bg-ok" aria-hidden />
        Unlocked
      </div>
      <h3 className="font-display mt-5 text-heading font-semibold">
        Members only
      </h3>
      <p className="mt-3 text-body text-fg-2">
        The full research archive, weekly calls, and the private repo. Your
        wallet holds 250 CLUB, above the 100 required.
      </p>
      <div className="mt-6 space-y-2 border-t border-hairline pt-5">
        {["Q3 research memo", "Recording: liquidity call", "Private repo access"].map(
          (item) => (
            <p key={item} className="text-body text-fg">
              {item}
            </p>
          ),
        )}
      </div>
    </div>
  ),
  "usdc-checkout": (
    <div className="w-full max-w-[360px] rounded-card border border-line bg-surface p-7">
      <p className="meta-label text-fg-3">Order</p>
      <div className="mt-4 space-y-3">
        {[
          ["Pro plan, annual", "45.00"],
          ["Priority support", "4.00"],
        ].map(([label, price]) => (
          <div key={label} className="flex justify-between text-body">
            <span className="text-fg-2">{label}</span>
            <span className="font-mono text-fg">{price}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-hairline pt-4 text-body">
        <span className="font-medium">Total</span>
        <span className="font-mono font-medium">49.00 USDC</span>
      </div>
      <div className="mt-6 rounded-button bg-ink py-2.5 text-center text-body font-medium text-cream">
        Pay 49.00 USDC
      </div>
      <p className="meta-label mt-4 text-center text-fg-3">Solana</p>
    </div>
  ),
};

function BrowserChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col text-fg" data-theme="light">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface-alt px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-[2px] bg-line-strong" />
          <span className="size-2 rounded-[2px] bg-line-strong" />
        </span>
        <span className="truncate rounded-control bg-surface px-3 py-1 font-mono text-code-sm text-fg-2">
          {url}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-canvas p-8">
        {children}
      </div>
      <div className="meta-label shrink-0 border-t border-line bg-surface-alt px-4 py-2 text-center text-fg-3">
        Built with Brik
      </div>
    </div>
  );
}

export function AppPreview({
  slug,
  url,
  isDeployed,
  statusLine,
}: {
  slug: string;
  url: string;
  isDeployed: boolean;
  statusLine: string;
}) {
  if (!isDeployed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 bg-canvas p-8 text-center">
        <BrikLoader size={28} />
        <div>
          <p className="text-body-lg text-fg">Your app will appear here</p>
          <p className="mt-2 text-body text-fg-2">{statusLine}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserChrome url={url}>
      {APPS[slug] ?? (
        <div className="flex items-center gap-3 text-fg-2">
          <BrikMark size={18} />
          <span className="text-body">Preview</span>
        </div>
      )}
    </BrowserChrome>
  );
}
