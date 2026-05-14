// Visual-tester thresholds. Constants committed to the repo and changed
// only by a human with justification. The tester must NEVER mutate these
// values to make a failing case pass.
//
// `DEFAULT_THRESHOLD` is the ratio of diff pixels to non-background
// pixels above which a case is considered a regression. The per-case
// `threshold` field on a CORPUS entry (see corpus.ts) overrides this for
// constructs whose Chromium-MathML vs Typst diff floor is intrinsically
// higher (stretched fences, mtable layout, etc.).
//
// Lowering DEFAULT_THRESHOLD is a one-way ratchet: do it whenever the
// renderer gets better, not because a particular case is noisy (use a
// per-case threshold for that). Raising it requires a comment that
// names the regression that justified the relaxation.

export const DEFAULT_THRESHOLD = 0.45;

// Pixelmatch tolerance per pixel - cranked up so anti-aliasing
// differences between Chromium's MathML engine and Typst's own renderer
// don't dominate. The overall ratio is judged separately above.
export const PIXEL_THRESHOLD = 0.35;

// Blur radius applied to both reference and candidate before pixel
// match. Radius 1 (3x3 average) absorbs one-pixel baseline shifts
// without erasing structural differences like a limit jumping from
// sub/sup to under/over.
export const BLUR_RADIUS = 1;
