// Image comparison helpers. Pads both PNGs to a common bounding box (white
// background) and runs pixelmatch over the non-white region. The pngjs and
// pixelmatch packages are loaded lazily so this module is safe to import even
// when the visual deps aren't installed (the suite skip path).

export interface DiffRegion {
  // Bounding box (inclusive) of a contiguous diff cluster.
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  // Number of diff pixels inside the box.
  count: number;
}

export interface DiffResult {
  width: number;
  height: number;
  totalPixels: number;
  diffPixels: number;
  nonWhiteRefPixels: number;
  // diffPixels / max(nonWhiteRefPixels, 1): the metric used for thresholding.
  ratio: number;
  diffPng: Buffer;
  // Top diff clusters, largest first. Helps a human locate which part
  // of the rendering broke (a slipped limit, a mis-sized fence, etc.)
  // without eyeballing the diff PNG.
  topRegions: DiffRegion[];
}

const WHITE_THRESHOLD = 250;

let _PNG: any;
let _pixelmatch: any;

async function loadDeps(): Promise<void> {
  if (_PNG && _pixelmatch) return;
  _PNG = (await import('pngjs')).PNG;
  _pixelmatch = ((await import('pixelmatch')) as any).default ?? (await import('pixelmatch'));
}

import { PIXEL_THRESHOLD, BLUR_RADIUS } from './visual.config.js';

function isWhiteish(data: Uint8Array, idx: number): boolean {
  return data[idx]! >= WHITE_THRESHOLD
    && data[idx + 1]! >= WHITE_THRESHOLD
    && data[idx + 2]! >= WHITE_THRESHOLD;
}

function padOnto(src: any, W: number, H: number): any {
  const out = new _PNG({ width: W, height: H });
  out.data.fill(255);
  const offX = Math.floor((W - src.width) / 2);
  const offY = Math.floor((H - src.height) / 2);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const sIdx = (y * src.width + x) * 4;
      const dIdx = ((y + offY) * W + (x + offX)) * 4;
      out.data[dIdx] = src.data[sIdx];
      out.data[dIdx + 1] = src.data[sIdx + 1];
      out.data[dIdx + 2] = src.data[sIdx + 2];
      out.data[dIdx + 3] = src.data[sIdx + 3];
    }
  }
  return out;
}

// In-place box blur with the given radius. We blur both reference and
// candidate so sub-pixel offsets (caused by font hinting differences) don't
// dominate the pixelmatch diff. A radius of 2 corresponds to roughly a 5x5
// neighborhood average; that's enough to bridge a 1-2 px shift while
// preserving structural strokes.
function boxBlur(img: any, radius: number): void {
  const { width: W, height: H, data } = img;
  const tmp = new Uint8Array(data.length);
  const win = radius * 2 + 1;
  // Horizontal pass.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let k = -radius; k <= radius; k++) {
        const xk = x + k;
        if (xk < 0 || xk >= W) continue;
        const i = (y * W + xk) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
      const j = (y * W + x) * 4;
      tmp[j] = Math.round(r / n);
      tmp[j + 1] = Math.round(g / n);
      tmp[j + 2] = Math.round(b / n);
      tmp[j + 3] = 255;
    }
  }
  // Vertical pass back into data.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let k = -radius; k <= radius; k++) {
        const yk = y + k;
        if (yk < 0 || yk >= H) continue;
        const i = (yk * W + x) * 4;
        r += tmp[i];
        g += tmp[i + 1];
        b += tmp[i + 2];
        n++;
      }
      const j = (y * W + x) * 4;
      data[j] = Math.round(r / n);
      data[j + 1] = Math.round(g / n);
      data[j + 2] = Math.round(b / n);
      data[j + 3] = 255;
    }
  }
  void win;
}

export async function comparePngs(refBuf: Buffer, candBuf: Buffer): Promise<DiffResult> {
  await loadDeps();
  const ref = _PNG.sync.read(refBuf);
  const cand = _PNG.sync.read(candBuf);

  const W = Math.max(ref.width, cand.width);
  const H = Math.max(ref.height, cand.height);

  const a = ref.width === W && ref.height === H ? ref : padOnto(ref, W, H);
  const b = cand.width === W && cand.height === H ? cand : padOnto(cand, W, H);

  // Soften both sides to absorb sub-pixel offsets between Chromium MathML
  // and Typst's renderer. Radius 1 (3x3 average) is enough to forgive
  // hinting jitter and one-pixel baseline shifts without erasing real
  // layout differences like a limit jumping from sub/sup to under/over.
  const aBlur = new _PNG({ width: W, height: H });
  aBlur.data.set(a.data);
  boxBlur(aBlur, BLUR_RADIUS);
  const bBlur = new _PNG({ width: W, height: H });
  bBlur.data.set(b.data);
  boxBlur(bBlur, BLUR_RADIUS);

  const diff = new _PNG({ width: W, height: H });
  // PIXEL_THRESHOLD is cranked up so anti-aliasing differences between
  // Chromium's MathML engine and Typst's own renderer don't dominate the
  // diff. The overall ratio is judged against DEFAULT_THRESHOLD (or a
  // per-case override) by the caller.
  const diffPixels: number = _pixelmatch(aBlur.data, bBlur.data, diff.data, W, H, {
    threshold: PIXEL_THRESHOLD,
    includeAA: true,
    alpha: 0.3,
    diffColor: [255, 0, 0],
  });

  let nonWhiteRef = 0;
  let nonWhiteCand = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (!isWhiteish(a.data, i)) nonWhiteRef++;
    if (!isWhiteish(b.data, i)) nonWhiteCand++;
  }
  // Use the larger non-bg area as the denominator. With the smaller
  // denominator the ratio explodes when the candidate ends up with more ink
  // than the reference (which is the common case for browser MathML vs
  // Typst's tighter renderer).
  const denom = Math.max(nonWhiteRef, nonWhiteCand, 1);

  return {
    width: W,
    height: H,
    totalPixels: W * H,
    diffPixels,
    nonWhiteRefPixels: denom,
    ratio: diffPixels / denom,
    diffPng: _PNG.sync.write(diff),
    topRegions: extractTopRegions(diff.data, W, H, 5),
  };
}

// Group diff pixels into coarse 16-pixel buckets and report the densest
// ones. Avoids a real connected-components pass (which would dominate
// runtime) while still giving a useful spatial hint.
function extractTopRegions(diffData: Uint8Array, W: number, H: number, count: number): DiffRegion[] {
  const BUCKET = 16;
  const bw = Math.ceil(W / BUCKET);
  const bh = Math.ceil(H / BUCKET);
  const buckets = new Int32Array(bw * bh);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // pixelmatch marks diff pixels red with full alpha; ignore the
      // semi-transparent grey AA marks left from `alpha: 0.3`.
      if (diffData[i] === 255 && diffData[i + 1] === 0 && diffData[i + 2] === 0 && diffData[i + 3]! >= 200) {
        const bx = Math.floor(x / BUCKET);
        const by = Math.floor(y / BUCKET);
        buckets[by * bw + bx]!++;
      }
    }
  }
  const ranked: DiffRegion[] = [];
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      const n = buckets[by * bw + bx]!;
      if (n === 0) continue;
      ranked.push({
        x0: bx * BUCKET,
        y0: by * BUCKET,
        x1: Math.min(W - 1, (bx + 1) * BUCKET - 1),
        y1: Math.min(H - 1, (by + 1) * BUCKET - 1),
        count: n,
      });
    }
  }
  ranked.sort((a, b) => b.count - a.count);
  return ranked.slice(0, count);
}
