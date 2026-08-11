"use client";

import { useState } from "react";

/**
 * Where the visitor's own model key lives while they are using it: their tab,
 * and nowhere else. It is sent with each agent request and is never written to
 * this server, so closing the tab is all it takes to be rid of it.
 */
const KEY_STORAGE = "brik.anthropic-key";

export function readStoredKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    // Private modes can refuse storage. Nothing here is worth failing over.
    return "";
  }
}

export function storeKey(key: string): void {
  try {
    if (key) window.sessionStorage.setItem(KEY_STORAGE, key);
    else window.sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    // As above: the key still works for this page, it just will not survive
    // a reload.
  }
}

function KeyField({
  hasKey,
  onKey,
}: {
  hasKey: boolean;
  onKey: (key: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (hasKey) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#191919] pt-3">
        <span className="brik-etch text-[10px]">USING YOUR OWN KEY</span>
        <button
          type="button"
          onClick={() => onKey("")}
          className="text-[13px] text-fg-2 transition-colors duration-150 hover:text-fg"
        >
          Remove
        </button>
      </div>
    );
  }

  const submit = () => {
    const key = value.trim();
    if (!key.startsWith("sk-ant-")) {
      setError("An Anthropic key starts with sk-ant-.");
      return;
    }
    setError(null);
    setValue("");
    onKey(key);
  };

  return (
    <div className="mt-3 border-t border-[#191919] pt-3">
      <label htmlFor="model-key" className="brik-etch block text-[10px]">
        YOUR ANTHROPIC API KEY
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="model-key"
          type="password"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="sk-ant-..."
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "model-key-error" : "model-key-note"}
          className="min-w-0 flex-1 rounded-[5px] bg-[#040404] px-3 py-2 font-mono text-[12px] text-fg shadow-[inset_0_2px_5px_rgba(0,0,0,.9)] placeholder:text-[var(--brik-etch-dim)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cream"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="brik-key px-3 text-[13px]"
        >
          Use
        </button>
      </div>
      {error ? (
        <p id="model-key-error" className="mt-2 font-mono text-[11.5px] text-err">
          {error}
        </p>
      ) : (
        <p id="model-key-note" className="mt-2 text-[13px] leading-[1.6] text-[#6f6f6b]">
          Sent with your requests and kept in this tab only. It is never stored
          on the server.
        </p>
      )}
    </div>
  );
}

/**
 * The composer: a well cut into the chassis with one key sitting above it.
 * The key travels 1px on press, which is what the whole shell means by
 * "pressable".
 */
export function Composer({
  disabled,
  offerKey,
  hasKey,
  onKey,
  onMessage,
}: {
  disabled: boolean;
  /** The server said this visitor's metered model time is spent. */
  offerKey: boolean;
  hasKey: boolean;
  onKey: (key: string) => void;
  onMessage: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onMessage(text);
    setValue("");
  };

  return (
    <div className="shrink-0 px-5 pb-5">
      <div className="brik-well px-[15px] py-[13px] focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-cream">
        <label htmlFor="composer" className="sr-only">
          Ask the agent for a change
        </label>
        <textarea
          id="composer"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Ask for a change"
          className="w-full resize-none bg-transparent text-[13.5px] leading-[1.5] text-fg placeholder:text-[var(--brik-etch)] focus-visible:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="brik-etch text-[10.5px] tracking-[0.14em] text-[var(--brik-etch-dim)]">
            ⏎ TO SEND
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="brik-key grid h-[27px] w-8 place-items-center text-[13px]"
            style={{ borderRadius: 6 }}
            aria-label="Send to the agent"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
        {(offerKey || hasKey) && <KeyField hasKey={hasKey} onKey={onKey} />}
      </div>
    </div>
  );
}
