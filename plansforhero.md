# Hero Indicator Animation — Plan

Mobile-responsive tutorial-style animation showing how a technical indicator
moves in response to price action. Drafted for Prism's landing page; not yet
implemented.

---

## 1. Placement

Three options, ranked:

- **A (recommended): replaces or augments the "Understanding the Indicators"
  section** (currently around `src/app/page.tsx:237`). That section is already
  an explainer — turning it from static text into a live demo is a natural
  upgrade and doesn't disturb the 3-card grid above it.
- **B: new hero band between the tagline and the 3-card grid.** More
  prominent, but pushes the call-to-action (ticker search) below the fold on
  mobile.
- **C: subtle background animation behind the title.** Visually cool but
  doesn't teach anything.

**Default to A.**

## 2. What gets animated

Pick **one flagship indicator** for the hero animation; keep the other
indicators as static text cards. RSI is the strongest choice — hard 0–100
scale, named zones (70 / 30), and a clean cause-effect story with price.

Concrete spec: two stacked SVG panels.

- **Top panel**: price line, ~60–90 hand-crafted candles tracing a runup →
  peak → pullback → recovery.
- **Bottom panel**: RSI line, with horizontal bands at 30 and 70 shaded.
- A vertical "playhead" sweeps left → right; both lines draw in behind it via
  `stroke-dashoffset`.
- 4 callout pills fade in/out at key inflection points (see beats below).

## 3. The narrative beats (loop ~12s)

| t       | Price action          | RSI behavior         | Callout                                |
|---------|-----------------------|----------------------|----------------------------------------|
| 0–3s    | Trends up             | Climbs from 50 → 70  | "Strong rally — momentum building"     |
| 3–5s    | Continues up, slowing | Crosses above 70     | "Overbought zone — buyers tiring"      |
| 5–8s    | Peaks, pulls back     | Drops 70 → 40        | "Pullback as momentum cools"           |
| 8–11s   | Bottoms, recovers     | Bounces 40 → 50      | "Reset — back to neutral"              |
| 11–12s  | (fade)                | (fade)               | Loop                                   |

Pause on hover; restart from 0 when scrolled back into view.

## 4. Tech approach

- **Pure SVG, no Recharts.** Recharts is overkill and adds layout thrash.
  Hand-rolled SVG paths animate cheaply via `stroke-dashoffset` + `transform`.
- **Pre-compute the price array and RSI series once at module scope** —
  they're the same every loop, no per-frame math.
- **Single `requestAnimationFrame` loop** keyed off
  `performance.now() % loopDuration` to stay phase-locked.
- **Pause via `IntersectionObserver`** when offscreen — preserves battery on
  mobile and stops the rAF loop entirely.
- **`prefers-reduced-motion: reduce`** → render the final-frame static
  snapshot with all four callouts visible at once.

Estimated ~250 lines of TSX in one self-contained `IndicatorDemo.tsx`.

## 5. Mobile responsiveness

- SVG `viewBox="0 0 400 240"` with `preserveAspectRatio="xMidYMid meet"` —
  scales naturally.
- Below `sm`: stack callouts as a single line of text below the chart instead
  of floating pills (avoids overlap with the line).
- Compress horizontal axis on mobile (fewer ticks) and bump RSI line
  stroke-width slightly so it stays legible at small sizes.
- Animation duration unchanged across breakpoints (mobile users still want
  the same story); only layout reflows.

## 6. Open questions

1. **One indicator or three?** Start with RSI alone for the hero. Three would
   cycle RSI → MACD → Bollinger as separate ~10s segments (~30s total). That's
   longer and harder to land cleanly, and most users won't watch 30s.
2. **Synthetic data or real?** Hand-crafted price path — the story has to be
   clean (real data has noise that obscures the lesson). Tradeoff: it's a
   "demo," not "AAPL last quarter."
3. **Where does the user click?** After the animation ends, a "Try it on your
   own ticker →" button that scrolls to the search. Yes.
4. **Replace or augment the existing 4 text cards?** Keep them and put the
   demo above them — text reinforces the visual.

## 7. File plan (when implementing)

- `src/components/IndicatorDemo.tsx` — self-contained component (SVG, rAF
  loop, IntersectionObserver, reduced-motion handling).
- `src/lib/demoData.ts` — pre-computed price + RSI arrays and beat timings.
- `src/app/page.tsx` — drop `<IndicatorDemo />` above the existing
  "Understanding the Indicators" grid (around line 244).

No new dependencies.
