// Image comparison helpers. Pads both PNGs to a common bounding box (white
// background) and runs pixelmatch over the non-white region. The pngjs and
// pixelmatch packages are loaded lazily so this module is safe to import even
// when the visual deps aren't installed (the suite skip path).

export interface DiffResult {
  width: number;
  height: number;
  totalPixels: number;
  diffPixels: number;
  nonWhiteRefPixels: number;
  // diffPixels / max(nonWhiteRefPixels, 1): the metric used for thresholding.
  ratio: number;
  diffPng: Buffer;
}

const WHITE_THRESHOLD = 250;

let _PNG: any;
let _pixelmatch: any;

async function loadDeps(): Promise<void> {
  if (_PNG && _pixelmatch) return;
  _PNG = (await import('pngjs')).PNG;
  _pixelmatch = ((await import('pixelmatch')) as any).default ?? (await import('pixelmatch'));
}

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
  // and Typst's renderer. The denominator below uses the *original*
  // (pre-blur) ink area so the threshold semantics stay meaningful.
  const aBlur = new _PNG({ width: W, height: H });
  aBlur.data.set(a.data);
  boxBlur(aBlur, 2);
  const bBlur = new _PNG({ width: W, height: H });
  bBlur.data.set(b.data);
  boxBlur(bBlur, 2);

  const diff = new _PNG({ width: W, height: H });
  // High per-pixel threshold so anti-aliasing differences between Chromium's
  // MathML engine and Typst's own renderer don't dominate the diff. The
  // overall ratio is then judged against a separate threshold by the caller.
  const diffPixels: number = _pixelmatch(aBlur.data, bBlur.data, diff.data, W, H, {
    threshold: 0.35,
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
  };
}
