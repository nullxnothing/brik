# DESIGN.md — Brik visual system

Authority: the design-system handoff (tokens + components.md) adopted 2026-08-10, applied here with
the touch-ups listed at the bottom. Dark is the default and only shipped theme for now; the light
map exists in tokens but no toggle is exposed.

## World

Swiss developer-infrastructure: warm cream on near-black, strict grids, 1px seams, rounded display
type. The notched-block mark is the only ornament. Depth is a border and a surface value change,
never a shadow. Quality bar: helius.dev / jup.ag / phantom.com.

## Tokens

All tokens live in `app/globals.css` as `--brik-*` custom properties (dark default,
`[data-theme="light"]` override) and are mapped into Tailwind v4 via `@theme inline`.
Values match the handoff exactly. Fonts: Fredoka 600 (display, marketing only), Space Grotesk
(interface), JetBrains Mono (code, addresses, meta, eyebrows-as-labels where the spec pins them).

- Brand: cream `#F5EFE0` on black `#0C0C0C`. Cream is the brand surface and the primary button
  fill. State colors (`#6FA97A` / `#C79A4A` / `#C7554A`) mark state and nothing else.
- Radii: control 6 / button 8 / panel 10 / card 12 / brand 16. No pills.
- Motion: `cubic-bezier(0.22,1,0.36,1)`; 100–150ms UI, 200ms panels, 300–500ms notch, once per
  event. Nothing loops after it lands. Reduced motion collapses everything.
- Layout: 1240px max, 12 col / 20px gap, 56px gutter (24px under 720px).

## The mark

Official geometry, 640-unit grid (`components/logo.tsx` + `public/logo/*.svg`):

- `brik-mark` — notched block, currentColor. Nav, buttons, inline.
- `brik-mark-small` — tightened radii, for 16–32px rendering.
- `brik-block` — the missing course; nests into the notch. Loaders, progress, bullets.
- Wordmark: live Fredoka 600 "Brik", mark covering the tittle of the i at
  `left 1.055em / bottom 0.665em / width 0.21em` of the wordmark font size.
- Never stretch, rotate, recolor, gradient. Favicon always on its own black tile.

## Components

Build to `components.md` in the handoff (mirrored decisions):
cream primary button (one per view), bordered secondary, ghost tertiary; busy state swaps label to
present participle with the notch loader, never a spinner. Inputs: sunken field, mono uppercase
label above, cream focus border. Status badges use the fixed vocabulary. Meters are ten discrete
blocks. Progress is four small marks (WRITE → TEST → BUILD → DEPLOY). Panels share 1px seams via
`gap:1px` grids on a border-colored background. Glyph set `→ ↗ + × ▾ ⌘ ⏎` in mono; no icon library.

## Surfaces

- `/` landing — Persuade. Dark. Hero (pinned headline) + demo frame that plays once on view,
  building-blocks grid with functional visualizations, workflow strip, template cards, tech proof,
  ascii-field final CTA, minimal footer.
- `/new` — Operate. "What do you want to build?" Describe (primary) · templates · import · blank.
- `/workspace` — Operate. Scripted client-side demo of the real loop. Center pane carries
  `Preview | Code`: Code while the agent writes, auto-switching to Preview on first successful
  deploy unless the visitor has picked a tab themselves. Preview renders the visitor's app in the
  light token map inside browser chrome, because it is their artifact rather than Brik's chrome.
  Right rail is Agent or Solana with a composer pinned below it. Reduced motion renders the
  finished state instead of animating.

  The agent stream stays a task runner, never chat bubbles: an objective with a cream left rule,
  then checked steps. The composer's suggested change runs a real edit, shown as a diff, then a
  rebuild, an added passing test, and a redeploy. Free text is answered honestly, because the
  sandbox is not connected yet, and never with fabricated work.

## Touch-ups applied to the handoff (documented deltas)

Contrast was measured against the surface each token actually sits on. Three handoff values failed
WCAG AA for text and were raised by the smallest amount that passes.

1. `--brik-fg-3` dark `#6F6F6B` → `#7E7D78`. It was 3.82:1 on `#0D0D0D`; it now reads 4.65:1. This
   token carries every meta label, eyebrow, and line number, so it is body text, not decoration.
2. `--brik-err` `#C7554A` → `#CF5E52` (4.46:1 → 4.95:1). Visually the same red; it is used as
   error text, not only as a dot or border.
3. Light map `--brik-fg-2` → `#5A5A56` and `--brik-fg-3` → `#6F6F6B`. The handoff's `#A7A7A1` was
   2.18:1 on `#F4F3EF`. Light is not shipped yet, but the values should not ship broken.
4. Global `:focus-visible` (2px cream outline, 2px offset). The handoff pins input focus and leaves
   buttons and links unspecified. Keyboard focus must be visible everywhere.
5. `::selection` defined as cream on black.
6. `--text-display-xl: clamp(40px, 5.2vw, 60px)` added for the marketing hero, sized so the pinned
   headline sets on two lines at desktop. The fixed 56px display-lg stays for everything else.
7. Responsive gutter: 56px desktop, 24px below 720px. The handoff fixed it at 56, which leaves no
   margin on a 390px screen.
8. Ligatures disabled on `pre`, `code`, and terminal surfaces. JetBrains Mono renders `!==` and
   `>=` as single glyphs; source shown to a stranger has to read literally.
9. Em dashes removed from pinned copy (house rule): "Describe it or pick a template. Brik builds,
   tests, and deploys it to devnet while you watch."
