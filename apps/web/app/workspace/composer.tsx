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
      <div className="flex items-center justify-between gap-3 border-t border-hairline px-3 py-2.5">
        <span className="meta-label text-fg-3">Using your own key</span>
        <button
          type="button"
          onClick={() => onKey("")}
          className="btn btn-ghost px-0"
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
    <div className="border-t border-hairline px-3 py-2.5">
      <label htmlFor="model-key" className="meta-label block text-fg-3">
        Your Anthropic API key
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
          className="field field-mono min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="btn btn-secondary btn-compact"
        >
          Use
        </button>
      </div>
      {error ? (
        <p id="model-key-error" className="mt-2 font-mono text-[11.5px] text-err">
          {error}
        </p>
      ) : (
        <p id="model-key-note" className="mt-2 text-body text-fg-3">
          Sent with your requests and kept in this tab only. It is never stored
          on the server.
        </p>
      )}
    </div>
  );
}

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
    <div className="shrink-0 border-t border-line p-3">
      <div className="rounded-panel border border-line bg-sunken focus-within:border-cream">
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
          className="w-full resize-none bg-transparent px-3 pt-2.5 text-body text-fg placeholder:text-fg-3 focus-visible:outline-none"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <span className="meta-label text-fg-3">
            <span className="glyph">⏎</span> to send
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="btn btn-primary btn-compact"
            aria-label="Send to the agent"
          >
            <span className="glyph">→</span>
          </button>
        </div>
        {(offerKey || hasKey) && <KeyField hasKey={hasKey} onKey={onKey} />}
      </div>
    </div>
  );
}
