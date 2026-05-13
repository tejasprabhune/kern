# Visual tests

Pixel-level diff between kern's MathML output (rendered in headless Chromium)
and Typst's own SVG/PNG output (rasterized via the `typst` CLI).

The intent is to catch visible regressions when changing the MathML renderer,
the parser, or the symbol table.

## Prerequisites

The suite skips itself when prerequisites are missing.

1. **Typst CLI** on `PATH`. See https://github.com/typst/typst#installation.
   ```sh
   brew install typst         # macOS
   ```
2. **Playwright + Chromium** (devDependencies). From the repo root:
   ```sh
   pnpm install
   pnpm --filter kern-typ exec playwright install chromium
   ```
3. **Built kern bundle** (`packages/kern/dist/kern.js`):
   ```sh
   pnpm --filter kern-typ build
   ```

## Running

From `packages/kern/`:

```sh
pnpm test -- test/visual          # runs the visual suite alongside other tests
pnpm test -- test/visual/visual   # just this file
```

First-time baselines are generated automatically using the `typst` CLI and
written to `__baselines__/`. They are intended to be committed so CI doesn't
need a `typst` install.

## Regenerating baselines

```sh
UPDATE_BASELINES=1 pnpm test -- test/visual
```

Use this whenever Typst's renderer changes or you intentionally update the
corpus. Inspect the resulting `__baselines__/*.png` before committing.

## Tuning thresholds

The default threshold is **5% of non-background pixels may differ**. Override
globally:

```sh
KERN_VISUAL_THRESHOLD=0.10 pnpm test -- test/visual
```

Per-case overrides live in `corpus.ts` as the `threshold` field.

## Output

For each case the suite writes three PNGs:

- `__baselines__/<name>.typst.png` — Typst's render (the reference)
- `__output__/<name>.kern.png`      — kern's render
- `__output__/<name>.diff.png`      — pixelmatch's per-pixel diff overlay

Only `__baselines__/` is git-tracked. `__output__/` is gitignored.

## Caveats

- Browser MathML engines vary. The harness pins Chromium to a single version
  via the installed Playwright build, but expect baselines to need a refresh
  after a Playwright bump.
- The Typst CLI must use the **New Computer Modern Math** font for visual
  parity with the kern stylesheet (`kern-newcm.css`). Both ship with NewCM.
- The harness rasterizes Typst at 144 PPI and runs Chromium at
  `deviceScaleFactor=2`. Adjust both in `setup.ts` if you change font sizes.
