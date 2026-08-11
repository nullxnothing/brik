"use client";

import { BrikWordmark } from "../../components/logo";

/**
 * The legend plate in the idle editor.
 *
 * A machine never leaves a surface blank; it fills it with legend. Everything
 * on this plate is either fixed by the toolchain image or read out of the
 * running container, so it is reference that is always true: it never goes
 * stale and never needs dismissing. It leaves as soon as the file has content.
 */

/** The versions baked into brik/solana-toolchain, verified with the image. */
const TOOLCHAIN = ["ANCHOR 0.31.1 · RUST 1.85", "AGAVE 3.1.9 · NODE 22"];

/** Every legend here is a shortcut the shell actually binds. */
const KEYS: [string, string][] = [
  ["B", "files"],
  ["J", "terminal"],
  ["⏎", "build"],
  ["/", "agent"],
];

const UNKNOWN = "--";

function Reading({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="tracking-[0.12em] text-[var(--brik-etch-dim)]">{term}</span>
      <span className="brik-figures truncate text-[#8a8a84]">{value}</span>
    </div>
  );
}

export function Nameplate({
  program,
  wallet,
  balance,
  modifier,
  visible,
  leaving,
}: {
  program?: string;
  wallet?: string;
  balance?: number;
  /** "⌘" on a Mac, "Ctrl" everywhere else. */
  modifier: string;
  visible: boolean;
  /** The plate leaves faster than it arrives: 140ms out, 150ms in. */
  leaving: boolean;
}) {
  return (
    <div
      className="absolute inset-0 grid place-items-center p-6"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${leaving ? 140 : 150}ms linear`,
        pointerEvents: visible ? undefined : "none",
      }}
      aria-hidden={!visible}
    >
      <div
        className="w-full max-w-[520px] px-7 py-6"
        style={{
          background: "linear-gradient(#121212,#0C0C0C)",
          border: "1px solid #1C1C1C",
          borderRadius: 10,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.05), 0 -1px 0 rgba(0,0,0,.9), 0 14px 34px -14px rgba(0,0,0,.9)",
        }}
      >
        <div
          className="flex items-center justify-between gap-4 pb-[18px]"
          style={{ borderBottom: "1px solid #191919" }}
        >
          <span className="brik-stamped" style={{ color: "#E7E1D2" }}>
            <BrikWordmark size={24} />
          </span>
          <span className="brik-etch text-right text-[10px] leading-[1.9] text-[var(--brik-etch-dim)]">
            {TOOLCHAIN[0]}
            <br />
            {TOOLCHAIN[1]}
          </span>
        </div>

        <dl
          className="grid grid-cols-1 gap-x-8 gap-y-[9px] py-[18px] font-mono text-[11.5px] sm:grid-cols-2"
          style={{ borderBottom: "1px solid #191919" }}
        >
          <Reading term="PROGRAM" value={program ? short(program) : UNKNOWN} />
          <Reading term="CLUSTER" value="localnet" />
          <Reading term="WALLET" value={wallet ? short(wallet) : UNKNOWN} />
          <Reading
            term="BALANCE"
            value={balance === undefined ? UNKNOWN : `${balance.toFixed(2)} SOL`}
          />
        </dl>

        <div className="grid grid-cols-1 gap-x-8 gap-y-[11px] pt-[18px] font-mono text-[11.5px] text-[#6f6f6b] sm:grid-cols-2">
          {KEYS.map(([key, action]) => (
            <div key={action} className="flex items-center gap-2.5">
              <kbd
                className="brik-key grid place-items-center px-2 py-1 text-[10.5px]"
                style={{ minWidth: 44, borderRadius: 5, color: "var(--brik-key-fg)" }}
              >
                {modifier}
                {key}
              </kbd>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function short(value: string): string {
  return value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}
