"use client";

import { useState } from "react";

export function Composer({
  disabled,
  onMessage,
}: {
  disabled: boolean;
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
      </div>
    </div>
  );
}
