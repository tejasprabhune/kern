// Visual-test helpers. Two responsibilities:
//   1. Run the `typst` CLI on a tiny .typ file containing `$<expr>$` and
//      return the resulting PNG as a Buffer.
//   2. Render the same expression through kern's MathML renderer inside a
//      headless Chromium page (via Playwright) and return its PNG screenshot.
//
// Both outputs target the same nominal scale so pixelmatch can compare them.
//
// All heavy deps (playwright) are loaded lazily; this module is safe to import
// even when the optional packages aren't installed.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
export const VISUAL_DIR = dirname(__filename);
export const BASELINE_DIR = resolve(VISUAL_DIR, '__baselines__');
export const OUTPUT_DIR = resolve(VISUAL_DIR, '__output__');
export const REPO_ROOT = resolve(VISUAL_DIR, '..', '..', '..', '..');

// We use the UMD bundle (vite.umd.config.ts → kern.min.js) so the script
// can be inlined into a non-module <script> tag and exposes a global `kern`.
export const KERN_DIST = resolve(VISUAL_DIR, '..', '..', 'dist', 'kern.min.js');

// Target rendering scale. Typst at 12pt 144 PPI produces 24 device-pixel
// nominal x-height. Match it with font-size 12px at deviceScaleFactor 2.
export const TYPST_PPI = 144;
export const KERN_FONT_PX = 12;
export const KERN_SCALE = 2;

const requireFromHere = createRequire(import.meta.url);

export function ensureDir(p: string): void {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

export function hasTypstCli(): boolean {
  const r = spawnSync('typst', ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}

export function hasPlaywright(): boolean {
  try {
    requireFromHere.resolve('playwright');
    return true;
  } catch {
    return false;
  }
}

// Compile a Typst expression to PNG. Returns the PNG bytes.
// `display` controls whether the expression is rendered as block math.
export function compileTypstToPng(expr: string, display: boolean): Buffer {
  const tmp = mkdtempSync(join(tmpdir(), 'kern-visual-'));
  const typFile = join(tmp, 'eq.typ');
  const pngFile = join(tmp, 'eq.png');

  // Minimal preamble: tight page, NewCM Math font, default 12pt body.
  // Use `auto` page size with a small margin so the resulting PNG is roughly
  // the size of the rendered math run.
  const body = display ? `$ ${expr} $` : `$${expr}$`;
  const src = [
    '#set page(width: auto, height: auto, margin: 4pt, fill: white)',
    '#set text(font: "New Computer Modern Math", size: 12pt)',
    body,
    '',
  ].join('\n');

  writeFileSync(typFile, src, 'utf8');

  execFileSync('typst', ['compile', '--format', 'png', '--ppi', String(TYPST_PPI), typFile, pngFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return readFileSync(pngFile);
}

// Build the HTML document for kern. Loads kern from its built bundle and the
// NewCMMath webfont over the network. The page exposes a global `__kern`
// with `renderToString`.
export function buildKernPage(): string {
  const kernJs = readFileSync(KERN_DIST, 'utf8');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/newcomputermodern@1.0.5/fonts/newcmmath-regular-webfont.css" />
<style>
  html, body { margin: 0; padding: 0; background: white; }
  body { font-family: "NewCMMath-Regular", "New Computer Modern Math", serif; }
  #stage {
    display: inline-block;
    padding: 2px;
    background: white;
    font-size: ${KERN_FONT_PX}px;
    line-height: 1.0;
  }
  #stage math {
    font-family: "NewCMMath-Regular", "New Computer Modern Math", serif;
  }
</style>
</head>
<body>
<div id="stage"></div>
<script>
${kernJs}
window.__kern = window.kern;
</script>
</body>
</html>`;
}

export interface KernRunner {
  page: any;
  shutdown: () => Promise<void>;
}

// Boots Playwright once for the suite. Caller must call shutdown when done.
export async function startKernRunner(): Promise<KernRunner> {
  const { chromium } = await import('playwright');

  const tmp = mkdtempSync(join(tmpdir(), 'kern-visual-html-'));
  const htmlFile = join(tmp, 'kern.html');
  writeFileSync(htmlFile, buildKernPage(), 'utf8');
  const htmlUrl = 'file://' + htmlFile;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: KERN_SCALE });
  const page = await ctx.newPage();
  await page.goto(htmlUrl);
  await page.waitForFunction(() => (window as any).__kern !== undefined);
  await page.evaluate(async () => {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  });

  async function shutdown() {
    await ctx.close();
    await browser.close();
  }

  return { page, shutdown };
}

// Render an expression through kern and screenshot it. Returns PNG bytes.
export async function renderKernToPng(
  runner: KernRunner,
  expr: string,
  display: boolean,
): Promise<Buffer> {
  const { page } = runner;

  await page.evaluate(({ src, display }: { src: string; display: boolean }) => {
    const stage = document.getElementById('stage')!;
    const html = (window as any).__kern.renderToString(src, {
      output: 'mathml',
      displayMode: display,
    });
    stage.innerHTML = html;
  }, { src: expr, display });

  await page.evaluate(() => new Promise((r: any) => requestAnimationFrame(() => r(null))));

  const stage = await page.$('#stage');
  if (!stage) throw new Error('stage element vanished');
  return await stage.screenshot({ type: 'png', omitBackground: false });
}
