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

- `/` landing — Persuade. Dark. The hero is a vertical, product-led stage: a compact promise and
  actions share a shallow 55/35 masthead with measured run telemetry, then lead into the workspace
  frame. Navbar, masthead, and workspace use the same 1760px landing frame and gutters. On desktop
  the headline starts 96px from the page top, its copy groups at 24px and 28px, and the workspace
  follows the actions by 48px.
  At 1440px and 1920px the frame dominates the opening screen and continues below the fold; below
  768px it becomes a readable stacked editor → agent → terminal story rather than a scaled-down
  desktop. The next two bands retain a 1680px landing measure: environment proof is one autonomous
  Localnet → Toolchain → Agent run, and the agent loop is a full-width rail. Measured templates, a
  quiet final CTA, and the footer return to the standard reading measure.

  The hero atmosphere extends the page halftone with one restrained radial source, two technical
  axes, edge vignette, a faint live-state reflection, and small scroll parallax between field, glow,
  and frame. The environment run is a time-based GSAP sequence rather than a scroll effect. It types
  workspace creation, resolves the validator and toolchain, repairs a concise type error, and reaches
  `READY · 7.9s`; hover pauses it, replay restarts it, and reduced motion renders the final state.

  The workflow is controlled by scroll position rather than autoplay. Its four stages move through
  queued, running, failed, retried, verified, and deployed states, while the evidence strip names the
  command result that caused each transition. Reduced motion resolves to the verified end state. On
  large screens a narrow five-stop run meter at the viewport edge shows page position without adding
  another decorative animation.

  The demo frame is the one place on this page built to the machined layer below, because it is a
  picture of the workspace and has to be the same machine: the same chassis, wells, lamps, and
  segment meter, from the same components in `components/chassis.tsx`. Its seams are fixed rather
  than draggable, so they carry no knurl. Everything around it keeps the flat 1px border.
- `/new` — Operate. "What do you want to build?" Describe (primary) · templates · import · blank.
  It uses the landing page's continuous halftone field without the spotlight or light-ray layer.
- `/workspace` — Operate. A real container: every file, line of output, address, and balance on this
  surface was read out of it. Center pane carries `Preview | Code`: Code while the run is in flight,
  auto-switching to Preview on a successful deploy unless the visitor has picked a tab themselves.
  Right rail is Agent or Solana with a composer pinned below it. The pacing of a run is the
  toolchain's; the only thing on a clock is the shell assembling itself once, on arrival.

  The agent stream stays a task runner, never chat bubbles: an objective with a knurled left rule,
  then checked steps, each one a command the workspace actually ran. Free text is answered honestly
  and never with fabricated work.

  Two elements wait on capabilities that do not exist yet, and say so rather than standing in for
  them. Preview has no app to frame until deploys produce a URL; it names the state and points at
  the program id. The composer has no suggested-change chip until an agent can make the edit.

  It is built to the machined-depth layer below.

## Machined depth (workspace shell only)

Authority: the workspace-depth handoff adopted 2026-08-11. It **amends one rule** in the base
system: inside the shell a flat 1px `#2A2A2A` border is replaced by a two-tone edge, a light top
line and a black bottom line. Marketing and docs keep the flat border and the rest of the base
system is unchanged. Tokens and recipes live in `app/depth.css`, imported after `globals.css`
declares the base tokens.

1. **One light source** for the whole product: above, slightly left. A raised part catches it on its
   top edge, falls into shadow at its bottom, and casts a 1px contact shadow. Never a second light.
2. **Three planes, three jobs.** Chassis holds things and carries the grain; a well is cut in and
   holds content; a key sits above and is pressable. Raised means pressable, recessed means content,
   flush means structure. A decorative depth cue is a bug.
3. **The chassis has a material.** Non-repeating monochrome noise at 5.5% plus one wide off-axis
   sheen, both on the shell root so they run continuously across every part. Bars inside the shell
   are translucent tints, never opaque fills. Wells are never textured.
4. **Status is lamps, not text.** An LED in a punched socket, latching on in 0ms and decaying off in
   220ms. Current arrives instantly; filaments take a moment to die.
5. **Chassis type is etched.** `FILES`, `TERMINAL`, `AGENT`, `LOCALNET` are markings on the case:
   `#5C5C57` with a 1px black text shadow. The wordmark is stamped, not debossed.
6. **Keys travel** 1px on press, losing their top highlight, in 60ms linear.

Guardrails: shadows stay tight and black, 1 to 2px of contact, never a cloud. Highlights are single
hairlines at 4 to 8% white. The UI is never tilted. No literal objects. Only lamps and screens glow.

Assembly is three moulded parts and three seams, not six bordered boxes. Seams are a 3px black
trough, draggable, knurled with three hairlines, and keyboard-resizable. Radii are concentric,
`inner = outer − wall`: shell 14, wall 5, well 9, key 7. Every number in the shell is tabular.

The boot sequence plays once on arrival and only assembles the case: power-on, the annunciator
self-test, the seams, the wells milled open with `clip-path` (never `scaleY`, which squashes the
content inside as it grows), then the etched markings and the legend plate. Everything with a fact
in it is driven by the run's own events instead, so a step that completes faster than an animation
is never made to wait for one. `prefers-reduced-motion` skips to the assembled state.

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

## Deltas from the machined-depth handoff

Six, each because the handoff's prototype could invent a value this product has to measure.

1. **No slot counter.** The reference foot and legend plate tick a slot number. Nothing in the run
   protocol reports a slot, and a number on this surface that was not read out of the container is
   the one thing this product does not do. The plate reads `BALANCE` instead, and the foot carries
   the meter and the run percentage. The Solana panel carries the lease countdown, which is real
   and does tick.
2. **No unit number, and real toolchain versions.** `UNIT 0x4C` is invented, so it is gone.
   `ANCHOR 0.30 · RUST 1.79 · SOLANA 1.18` becomes the versions the image was verified with:
   Anchor 0.31.1, Rust 1.85, Agave 3.1.9, Node 22.
3. **The key legends are bound.** The plate is reference that is always true, so every legend on it
   answers: `⌘B` files, `⌘J` terminal, `⌘⏎` build, `⌘/` agent. `⌘K` command had no palette behind
   it and was dropped rather than printed. The modifier resolves to `Ctrl` off a Mac.
4. **The editor stays monochrome.** The reference colours Rust keywords amber and strings green.
   Amber is what the annunciator means by BUSY, eighteen pixels above the same screen, so the base
   system's rule holds: state hues mark state and nothing else. Keywords carry emphasis in cream.
5. **The meter measures steps, not time.** Fourteen segments latch against the run's five real
   steps, so it reads 000% before the validator is up and 100% at DEPLOYED, and never fills on a
   timer while the toolchain is still working.
6. **The clip comes off a well once its cut lands.** A `clip-path` left on a scroll container stops
   clipping its composited layer, and scrolled terminal lines then paint outside the well.

Two additions the handoff does not cover, both required by the base system: seams are focusable
separators that resize with the arrow keys, Home, and End, and the annunciator carries a screen
reader status alongside the lamps.
