# 404 — Brick Stack

A decorative, endlessly-looping "bricks falling" 404 page. Not a playable game —
a premium hero animation that uses a Tetris-style stacking/row-clear metaphor
for "this page couldn't find its place."

## Install

```bash
npm install framer-motion
# Tailwind + React 19 + TypeScript assumed already set up in your project.
```

Merge `styles/tailwind.config.snippet.js` into your `tailwind.config.js`
(`theme.extend`), and load the two fonts referenced there (Space Grotesk for
display type, Inter for body text) however your project loads fonts.

## Wire it up

Drop `pages/NotFound.tsx` into your router as the catch-all 404 route, e.g.:

```tsx
// React Router
<Route path="*" element={<NotFound />} />
```

## File map

```
components/
  Brick.tsx              single masonry unit, memoized, CSS-only texture
  BrickBoard.tsx          the glass board: grid render + falling piece + dust
  FallingBrick.tsx        framer-motion wrapper for the in-flight piece
  DustParticle.tsx        landing puff / row-clear sweep particles
  FloatingParticles.tsx   ambient background motes
  HeroContent.tsx         404 copy + Go Home / Go Back buttons
hooks/
  useBrickPhysics.ts      grid state, spawn loop, landing, row-clear
  useAnimationLoop.ts     rAF interval, pauses on hidden tab
utils/
  constants.ts            grid size, timing, brick palette
  generateBrick.ts        random piece factory
  collision.ts            landing detection + row-clear grid math
pages/
  NotFound.tsx             composes everything, detects prefers-reduced-motion
```

## Design notes

- **Physics model**: bricks are simple rectangles (1×1, 1×4, 1×6, each
  rotatable), so instead of classic tetromino shapes the board tracks a
  20×10 cell matrix. A piece drops one row per tick, checked against that
  matrix; on landing it's stamped in as individual filled cells. This keeps
  row-clearing exactly like real Tetris (full row removed, everything above
  shifts down) without needing to split brick shapes that straddle a
  cleared row.
- **Rarity**: ~8% limousine (1×6), ~28% linear (1×4), rest traditional (1×1) —
  tuned in `constants.ts`.
- **Performance**: the fall tick runs on `requestAnimationFrame`, pauses when
  the tab is hidden, and stops spawning entirely under
  `prefers-reduced-motion` (pieces settle instantly, no continuous loop).
  `Brick` is memoized since many are on screen at once.
- **Accessibility**: the whole board is a single `role="img"` with a
  descriptive `aria-label`; every internal brick/dust node is
  `aria-hidden`. Buttons use real `<button>` elements with visible focus
  rings (WCAG AA contrast on both button styles against the dark background).
- **Responsive**: `BrickBoard` measures its own width with a
  `ResizeObserver` and derives `cellSize` from it — no per-breakpoint magic
  numbers, so it scales smoothly from a 220px mobile board up to 500px on
  desktop and beyond.
