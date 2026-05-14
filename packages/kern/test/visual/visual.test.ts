// Pixel-level visual diff between Typst's rasterized output and kern's MathML
// rendered in headless Chromium. Skips the suite when prerequisites are
// missing (typst CLI, playwright, kern dist bundle) so contributors without
// the full toolchain can still run `pnpm test`.

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CORPUS } from './corpus.js';
import { DEFAULT_THRESHOLD } from './visual.config.js';
import {
  BASELINE_DIR,
  KERN_DIST,
  OUTPUT_DIR,
  compileTypstToPng,
  ensureDir,
  hasPlaywright,
  hasTypstCli,
  renderKernToPng,
  startKernRunner,
  type KernRunner,
} from './setup.js';
import { comparePngs } from './compare.js';

const UPDATE_BASELINES = process.env.UPDATE_BASELINES === '1';
// Threshold lives in visual.config.ts as a committed constant. The
// tester never mutates it; a regression must be investigated and the
// underlying renderer fixed, not papered over by raising the floor.

const havePlaywright = hasPlaywright();
const haveTypst = hasTypstCli();
const haveDist = existsSync(KERN_DIST);

// Reason strings surfaced when the suite is skipped, so it's obvious what
// to install.
function skipReason(): string | null {
  const missing: string[] = [];
  if (!havePlaywright) missing.push('playwright (pnpm i -D playwright && pnpm exec playwright install chromium)');
  if (!haveDist) missing.push(`kern dist bundle at ${KERN_DIST} (run pnpm build first)`);
  return missing.length ? `Skipping visual tests, missing: ${missing.join('; ')}` : null;
}

const reason = skipReason();
const suite = reason ? describe.skip : describe;

suite('visual: kern MathML vs Typst PNG', () => {
  let runner: KernRunner;

  beforeAll(async () => {
    ensureDir(BASELINE_DIR);
    ensureDir(OUTPUT_DIR);
    runner = await startKernRunner();
  }, 60_000);

  afterAll(async () => {
    if (runner) await runner.shutdown();
  });

  for (const tc of CORPUS) {
    const tag = tc.display ? '-display' : '';
    const baselineFile = join(BASELINE_DIR, `${tc.name}${tag}.typst.png`);
    const kernFile = join(OUTPUT_DIR, `${tc.name}${tag}.kern.png`);
    const diffFile = join(OUTPUT_DIR, `${tc.name}${tag}.diff.png`);

    it(tc.name + (tc.display ? ' [display]' : ''), async () => {
      // 1. Baseline (Typst). Use cached file if present, else regenerate via
      //    the CLI. Regeneration is opt-in unless the file is missing.
      let baselinePng: Buffer;
      if (existsSync(baselineFile) && !UPDATE_BASELINES) {
        baselinePng = readFileSync(baselineFile);
      } else {
        if (!haveTypst) {
          // Cannot regenerate; surface a clear skip rather than a false pass.
          // Vitest doesn't have per-test skip from within `it`, so just
          // assert with a descriptive message.
          throw new Error(
            `Baseline ${baselineFile} missing and 'typst' CLI not available to regenerate. ` +
            `Install typst (https://github.com/typst/typst) and re-run with UPDATE_BASELINES=1.`,
          );
        }
        baselinePng = compileTypstToPng(tc.src, tc.display ?? false);
        writeFileSync(baselineFile, baselinePng);
      }

      // 2. Candidate (kern in headless Chromium).
      const candPng = await renderKernToPng(runner, tc.src, tc.display ?? false);
      writeFileSync(kernFile, candPng);

      // 3. Compare.
      const diff = await comparePngs(baselinePng, candPng);
      writeFileSync(diffFile, diff.diffPng);

      const threshold = tc.threshold ?? DEFAULT_THRESHOLD;
      // Always log so we can spot creep in passing cases too.
      // eslint-disable-next-line no-console
      console.log(`${tc.name}${tag}: ratio=${diff.ratio.toFixed(3)} (${diff.diffPixels}/${diff.nonWhiteRefPixels})`);

      if (diff.ratio > threshold) {
        // Print the expression and the top diff regions so a human can
        // start fixing without opening the diff PNG.
        const regions = diff.topRegions
          .map(r => `  [${r.x0},${r.y0}]-[${r.x1},${r.y1}] x${r.count}`)
          .join('\n');
        // eslint-disable-next-line no-console
        console.error(
          `FAIL ${tc.name}${tag}\n` +
          `  expression: ${tc.src}${tc.display ? ' [display]' : ''}\n` +
          `  ratio: ${diff.ratio.toFixed(4)} > ${threshold}\n` +
          `  diff: ${diffFile}\n` +
          `  top regions:\n${regions}`,
        );
      }

      expect(
        diff.ratio,
        `diff ratio=${diff.ratio.toFixed(4)} ` +
          `(${diff.diffPixels}/${diff.nonWhiteRefPixels} non-bg px); ` +
          `see ${diffFile}`,
      ).toBeLessThanOrEqual(threshold);
    }, 30_000);
  }
});

if (reason) {
  // eslint-disable-next-line no-console
  console.warn(reason);
}
