import type {
  AstNode, AttachNode, EqArrayNode, MatrixKind, MatrixAugment, MatrixGap,
  UnderOverNode, MathClass, MathSize,
} from '../ast.js';
import { isBigOperator, isIntegralOperator, isLimitsOperator } from '../symbols.js';
import { escapeHtml, mathvariantForStyle, mspaceWidth } from './shared.js';

interface RenderCtx {
  display: boolean;
  // The current script level. 0 is text/inline, +1 is a sub/sup, etc.
  scriptLevel: number;
  // Forced limit placement: 'limits' = under/over, 'scripts' = sub/sup,
  // 'auto' or undefined = decide based on base + display.
  limitsHint?: 'limits' | 'scripts';
  // True when rendering directly inside the body of a stretchy lr().
  // A `|` or `‖` in this position becomes a stretchy fence so Safari
  // sizes the conditional bar (e.g. P(A | B)) symmetrically with the
  // surrounding parens.
  inStretchyLR?: boolean;
}

const BIG_OP_RE = /^[∑∏∐∫∬∭⨌∮∯∰∱∲∳⋃⋂⨆⨅⨀⨁⨂⨃⨄⨊⨋]$/u;

// Chrome's MathML reads the operator dictionary literally and uses the
// ASCII hyphen-minus (U+002D) for `-`, which is much narrower than the
// proper math minus (U+2212) Firefox and Safari substitute. Map ASCII
// operators to their math counterparts so all three engines agree.
const OPERATOR_GLYPHS: Record<string, string> = {
  '-': '−', // MINUS SIGN
  '*': '∗', // ASTERISK OPERATOR
};

function normalizeOperator(text: string): string {
  return OPERATOR_GLYPHS[text] ?? text;
}

function renderOperator(text: string, ctx: RenderCtx): string {
  const t = normalizeOperator(text);
  if (ctx.inStretchyLR && (t === '|' || t === '‖')) {
    return `<mo stretchy="true" symmetric="true">${escapeHtml(t)}</mo>`;
  }
  return `<mo>${escapeHtml(t)}</mo>`;
}

export function renderMathML(node: AstNode, display: boolean): string {
  const ctx: RenderCtx = { display, scriptLevel: 0 };
  const inner = renderNode(node, ctx);
  const displayAttr = display ? ' display="block"' : '';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${displayAttr}>${inner}</math>`;
}

function renderNode(node: AstNode, ctx: RenderCtx): string {
  switch (node.type) {
    case 'seq': return renderSeq(node.nodes, ctx);
    case 'atom': return renderAtom(node.text, node.italic, node.operator === true);
    case 'number': return `<mn>${escapeHtml(node.value)}</mn>`;
    case 'symbol': return renderSymbol(node.char);
    case 'operator': return renderOperator(node.text, ctx);
    case 'text': return `<mtext>${escapeHtml(node.value)}</mtext>`;
    case 'frac': return renderFrac(node.num, node.den, ctx);
    case 'sqrt': return `<msqrt>${renderNode(node.body, ctx)}</msqrt>`;
    case 'root': return `<mroot>${renderNode(node.body, ctx)}${renderNode(node.index, ctx)}</mroot>`;
    case 'attach': return renderAttach(node, ctx);
    case 'matrix': return renderMatrix(node.kind, node.rows, node.delim, node.augment, node.gap, ctx);
    case 'eqarray': return renderEqArray(node, ctx);
    case 'style': return renderStyle(node.kind, node.body, ctx);
    case 'lr': return renderLR(node.open, node.close, node.body, node.stretchy === true, ctx);
    case 'spacing': return `<mspace width="${mspaceWidth(node.kind)}"/>`;
    case 'align': return `<mo>&#x200B;</mo>`;
    case 'binom': return renderBinom(node.top, node.bot, ctx);
    case 'accent': return renderAccent(node.kind, node.body, ctx);
    case 'underover': return renderUnderOver(node, ctx);
    case 'cancel': return renderCancel(node.kind, renderNode(node.body, ctx));
    case 'op': return renderOpName(node.text, node.limits);
    case 'class': return renderClass(node.cls, node.body, ctx);
    case 'size': return renderSize(node.size, node.body, ctx);
    case 'limits-hint': return renderNode(node.body, { ...ctx, limitsHint: node.mode });
  }
}

function renderSeq(nodes: AstNode[], ctx: RenderCtx): string {
  if (nodes.length === 0) return '<mrow></mrow>';
  const THIN = '<mspace width="0.1667em"/>';
  const parts: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const prev = nodes[i - 1];
    const next = nodes[i + 1];
    // Thin space before/after text nodes that are adjacent to math atoms.
    if (n.type === 'text' && prev !== undefined && prev.type !== 'spacing') {
      parts.push(THIN);
    }
    parts.push(renderNode(n, ctx));
    if (n.type === 'text' && next !== undefined && next.type !== 'spacing') {
      parts.push(THIN);
    }
  }
  return `<mrow>${parts.join('')}</mrow>`;
}

function renderAtom(text: string, italic: boolean, isOperator: boolean): string {
  // Operator names (sin, cos, lim, ...) render upright with a trailing thin
  // space so `sin x` reads as "sin x".
  if (isOperator) {
    return `<mi mathvariant="normal">${escapeHtml(text)}</mi><mspace width="0.1667em"/>`;
  }
  const variant = italic ? '' : ' mathvariant="normal"';
  return `<mi${variant}>${escapeHtml(text)}</mi>`;
}

function renderSymbol(char: string): string {
  if (char === '') return '<mspace width="0em"/>';

  const cp = char.codePointAt(0) ?? 0;

  // Big operators: emit largeop so the browser uses the OpenType MATH
  // table's display variant. movablelimits only applies to sums, products,
  // and similar; integrals keep their bounds on the side in both modes.
  if (isBigOperator(char) || BIG_OP_RE.test(char)) {
    const ml = isIntegralOperator(char) ? 'false' : 'true';
    return `<mo largeop="true" movablelimits="${ml}">${escapeHtml(char)}</mo>`;
  }

  if (isOperatorChar(cp)) return `<mo>${escapeHtml(char)}</mo>`;
  if (isLetterChar(cp)) return `<mi>${escapeHtml(char)}</mi>`;
  return `<mo>${escapeHtml(char)}</mo>`;
}

function isOperatorChar(cp: number): boolean {
  return (cp >= 0x2190 && cp <= 0x27FF) ||
    cp === 0x00B1 || cp === 0x00D7 || cp === 0x00F7 ||
    (cp >= 0x2A00 && cp <= 0x2AFF);
}

function isLetterChar(cp: number): boolean {
  return (cp >= 0x0391 && cp <= 0x03FF) ||
    (cp >= 0x2100 && cp <= 0x214F) ||
    (cp >= 0x1D400 && cp <= 0x1D7FF);
}

function renderFrac(num: AstNode, den: AstNode, ctx: RenderCtx): string {
  // Don't emit displaystyle here: when ctx.display is true, the root
  // <math display="block"> already cascades displaystyle to descendants,
  // and adding it redundantly on <mfrac> can knock script-level scaling
  // off on nested msup/msub in some Chromium builds.
  return `<mfrac>${renderNode(num, ctx)}${renderNode(den, ctx)}</mfrac>`;
}

function renderBinom(top: AstNode, bot: AstNode, ctx: RenderCtx): string {
  return (
    `<mrow>` +
    `<mo form="prefix" stretchy="true">(</mo>` +
    `<mfrac linethickness="0">${renderNode(top, ctx)}${renderNode(bot, ctx)}</mfrac>` +
    `<mo form="postfix" stretchy="true">)</mo>` +
    `</mrow>`
  );
}

// Returns true if this base should put attachments under/over instead of
// sub/sup, given current display state and any explicit hint.
function baseUsesLimits(base: AstNode, ctx: RenderCtx): boolean {
  if (ctx.limitsHint === 'limits') return true;
  if (ctx.limitsHint === 'scripts') return false;
  if (!ctx.display) return false;
  if (base.type === 'symbol' && isBigOperator(base.char) && !isIntegralOperator(base.char)) return true;
  if (base.type === 'atom' && base.operator === true && isLimitsOperator(base.text)) return true;
  if (base.type === 'op' && base.limits) return true;
  if (base.type === 'op' && isLimitsOperator(base.text)) return true;
  return false;
}

function renderAttach(node: AttachNode, ctx: RenderCtx): string {
  // Operator-atom bases append a trailing <mspace>; strip that before
  // wrapping so the script attaches to the letterform.
  const baseHtml = withItalicCorrection(renderBaseForAttach(node.base, ctx), node.base);
  const subHtml = node.sub !== undefined ? renderNode(node.sub, ctx) : undefined;
  const supHtml = node.sup !== undefined ? renderNode(node.sup, ctx) : undefined;

  const useLimits = baseUsesLimits(node.base, ctx);

  if (subHtml !== undefined && supHtml !== undefined) {
    return useLimits
      ? `<munderover>${baseHtml}${subHtml}${supHtml}</munderover>`
      : `<msubsup>${baseHtml}${subHtml}${supHtml}</msubsup>`;
  }
  if (subHtml !== undefined) {
    return useLimits
      ? `<munder>${baseHtml}${subHtml}</munder>`
      : `<msub>${baseHtml}${subHtml}</msub>`;
  }
  if (supHtml !== undefined) {
    return useLimits
      ? `<mover>${baseHtml}${supHtml}</mover>`
      : `<msup>${baseHtml}${supHtml}</msup>`;
  }
  return baseHtml;
}

// Render the base of an attach without the trailing operator-name thin space.
function renderBaseForAttach(base: AstNode, ctx: RenderCtx): string {
  if (base.type === 'atom' && base.operator === true) {
    return `<mi mathvariant="normal">${escapeHtml(base.text)}</mi>`;
  }
  if (base.type === 'op') {
    return `<mi mathvariant="normal">${escapeHtml(base.text)}</mi>`;
  }
  return renderNode(base, ctx);
}

// Chrome's MathML doesn't apply italic correction from the font's MATH
// table, so accents and scripts on italic letters drift left. Append a
// small <mspace> after italic single-letter bases so the bounding box
// catches up to the visual right edge. Firefox and Safari were already
// applying this much correction from the font; the mspace is a no-op
// for them.
//
// Per-letter values are calibrated against Computer Modern italic. The
// notable outlier is italic `f`, whose extreme right-lean needs nearly
// twice the default.
const ITALIC_CORRECTION_EM: Record<string, number> = {
  f: 0.16,
  j: 0.10,
  l: 0.08,
  t: 0.08,
  d: 0.06,
  g: 0.06,
  p: 0.06,
  q: 0.06,
  y: 0.06,
  // Capital italics with strong right lean.
  A: 0.08, F: 0.08, J: 0.10, T: 0.08, V: 0.10, W: 0.10, Y: 0.10,
};
const DEFAULT_ITALIC_CORRECTION_EM = 0.04;

function italicCorrectionFor(node: AstNode): number {
  if (node.type === 'atom' && node.italic === true && node.text.length === 1) {
    return ITALIC_CORRECTION_EM[node.text] ?? DEFAULT_ITALIC_CORRECTION_EM;
  }
  if (node.type === 'symbol') {
    const cp = node.char.codePointAt(0) ?? 0;
    // Greek lowercase (α–ω) and the math italic alphanumerics carry a
    // similar slant; a single mid-range value covers them since per-glyph
    // tuning has diminishing returns past the worst Latin offenders.
    if ((cp >= 0x03B1 && cp <= 0x03C9) || (cp >= 0x1D400 && cp <= 0x1D7FF)) {
      return DEFAULT_ITALIC_CORRECTION_EM;
    }
  }
  return 0;
}

function withItalicCorrection(html: string, base: AstNode): string {
  const em = italicCorrectionFor(base);
  if (em === 0) return html;
  return `<mrow>${html}<mspace width="${em}em"/></mrow>`;
}

function renderMatrix(
  kind: MatrixKind,
  rows: AstNode[][],
  delim: { open: string; close: string } | undefined,
  augment: MatrixAugment | undefined,
  gap: MatrixGap | undefined,
  ctx: RenderCtx,
): string {
  const { open, close } = delim ?? matrixDelimiters(kind);

  const vlineSet = new Set((augment?.vline ?? []).filter(n => Number.isFinite(n)));
  const hlineSet = new Set((augment?.hline ?? []).filter(n => Number.isFinite(n)));

  const tableRows = rows.map((row, rIdx) => {
    const cells = row.map((cell, cIdx) => {
      const classes: string[] = [];
      if (vlineSet.has(cIdx + 1)) classes.push('kern-augment-right');
      if (hlineSet.has(rIdx + 1)) classes.push('kern-augment-bottom');
      const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
      return `<mtd${cls}>${renderNode(cell, ctx)}</mtd>`;
    }).join('');
    return `<mtr>${cells}</mtr>`;
  }).join('');

  const styleParts: string[] = [];
  if (gap?.row) styleParts.push(`--kern-row-gap:${gap.row}`);
  if (gap?.column) styleParts.push(`--kern-column-gap:${gap.column}`);
  const styleAttr = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
  const gapClass = gap ? ' class="kern-gap"' : '';

  if (kind === 'cases') {
    return `<mrow><mo stretchy="true">{</mo><mtable columnalign="left left"${gapClass}${styleAttr}>${tableRows}</mtable></mrow>`;
  }

  const table = `<mtable${gapClass}${styleAttr}>${tableRows}</mtable>`;
  if (open || close) {
    const o = open ? `<mo stretchy="true" fence="true">${escapeHtml(open)}</mo>` : '';
    const c = close ? `<mo stretchy="true" fence="true">${escapeHtml(close)}</mo>` : '';
    return `<mrow>${o}${table}${c}</mrow>`;
  }
  return table;
}

function renderEqArray(node: EqArrayNode, ctx: RenderCtx): string {
  const childCtx: RenderCtx = { ...ctx, display: true };
  const tableRows = node.rows.map(row => {
    const cells = row.map(cell => `<mtd>${renderNode(cell, childCtx)}</mtd>`).join('');
    return `<mtr>${cells}</mtr>`;
  }).join('');
  return `<mtable class="kern-eqarray kern-aligned">${tableRows}</mtable>`;
}

function matrixDelimiters(kind: MatrixKind): { open: string; close: string } {
  switch (kind) {
    case 'vec': return { open: '(', close: ')' };
    case 'mat': return { open: '(', close: ')' };
    case 'pmat': return { open: '(', close: ')' };
    case 'bmat': return { open: '[', close: ']' };
    case 'vmat': return { open: '|', close: '|' };
    case 'Vmat': return { open: '‖', close: '‖' };
    case 'cases': return { open: '{', close: '' };
    default: return { open: '(', close: ')' };
  }
}

function renderStyle(kind: string, body: AstNode, ctx: RenderCtx): string {
  const variant = mathvariantForStyle(kind);
  const inner = renderNode(body, ctx);
  return `<mstyle mathvariant="${variant}">${inner}</mstyle>`;
}

function renderLR(open: string, close: string, body: AstNode, stretchy: boolean, ctx: RenderCtx): string {
  // The MathML Core operator dictionary auto-applies stretchy="true" to (,
  // ), [, ], etc. when form="prefix"/"postfix" is set. To keep bare math
  // parens at body height we have to *explicitly* set stretchy="false";
  // dropping the form attribute alone isn't enough since the browser still
  // infers form from position. Stretchy LR (from lr()/abs()/matrix) sets
  // stretchy="true" so the operator can grow to its content.
  //
  // Bare parens around tall content (fractions, matrices, big radicals,
  // limits-style attachments) auto-promote to stretchy to match Typst's
  // lr() output. Typst always wraps fractions in stretchy fences; mirror
  // that so expressions like `softmax((Q K^T) / sqrt(d_k))` look right.
  const effectiveStretchy = stretchy || containsTallContent(body);
  const stretchAttr = ` stretchy="${effectiveStretchy ? 'true' : 'false'}"`;
  // Add symmetric="true" on stretched fences. This nudges Safari (whose
  // MathML implementation otherwise sizes the bar/paren asymmetrically
  // around the math axis) to match Firefox/Chromium.
  const symAttr = effectiveStretchy ? ' symmetric="true"' : '';
  const openMo = open
    ? `<mo${stretchAttr}${symAttr} fence="true">${escapeHtml(open)}</mo>`
    : '';
  const closeMo = close
    ? `<mo${stretchAttr}${symAttr} fence="true">${escapeHtml(close)}</mo>`
    : '';
  const bodyCtx: RenderCtx = { ...ctx, inStretchyLR: effectiveStretchy };
  return `<mrow>${openMo}${renderNode(body, bodyCtx)}${closeMo}</mrow>`;
}

// True if the body should trigger auto-sized fences. Stretchy fences
// matter most for content whose visual height exceeds the body line:
// fractions, matrices/cases, multi-row tables, large radicals, and
// limits-style under/over constructs. Plain attachments (msub/msup)
// don't push the line height enough to need stretching.
function containsTallContent(node: AstNode): boolean {
  switch (node.type) {
    case 'frac':
    case 'binom':
    case 'matrix':
    case 'underover':
      return true;
    case 'sqrt':
    case 'root':
      return true;
    case 'cancel':
      return containsTallContent(node.body);
    case 'seq':
      return node.nodes.some(containsTallContent);
    case 'lr':
      return node.stretchy === true || containsTallContent(node.body);
    case 'style':
    case 'size':
    case 'class':
    case 'accent':
      return containsTallContent(node.body);
    case 'attach':
      return containsTallContent(node.base)
        || (node.sub !== undefined && containsTallContent(node.sub))
        || (node.sup !== undefined && containsTallContent(node.sup));
    default:
      return false;
  }
}

// Accent glyphs. Prefer the modifier-letter / accent-height characters
// (U+02C6 etc.) over the ASCII typewriter versions (^, ~, `) — those sit at
// caret height in most fonts and read as "stray symbol over the letter"
// rather than as a proper math accent.
const ACCENT_CHARS: Record<string, string> = {
  hat: 'ˆ',           // U+02C6 MODIFIER LETTER CIRCUMFLEX ACCENT
  tilde: '˜',         // U+02DC SMALL TILDE
  dot: '˙',           // U+02D9 DOT ABOVE
  'dot.double': '¨',  // U+00A8 DIAERESIS
  'dot.triple': '⃛',  // U+20DB combining three dots above
  overline: '‾',
  bar: 'ˉ',           // U+02C9 MODIFIER LETTER MACRON
  arrow: '⃗',          // U+20D7 combining right arrow above
  'arrow.l': '⃖',
  'arrow.l.r': '⃡',
  breve: '˘',
  grave: 'ˋ',         // U+02CB MODIFIER LETTER GRAVE ACCENT
  acute: 'ˊ',         // U+02CA MODIFIER LETTER ACUTE ACCENT
  macron: 'ˉ',        // U+02C9
  caron: 'ˇ',
  circle: '˚',
};

function renderAccent(kind: string, body: AstNode, ctx: RenderCtx): string {
  const ch = ACCENT_CHARS[kind] ?? '^';
  const bodyHtml = withItalicCorrection(renderNode(body, ctx), body);
  return `<mover accent="true">${bodyHtml}<mo>${escapeHtml(ch)}</mo></mover>`;
}

const UNDEROVER_CHARS: Record<UnderOverNode['kind'], { ch: string; over: boolean }> = {
  overbrace: { ch: '⏞', over: true },
  underbrace: { ch: '⏟', over: false },
  'overline.stretch': { ch: '‾', over: true },
  'underline.stretch': { ch: '_', over: false },
  overparen: { ch: '⏜', over: true },
  underparen: { ch: '⏝', over: false },
  overbracket: { ch: '⎴', over: true },
  underbracket: { ch: '⎵', over: false },
};

function renderUnderOver(node: UnderOverNode, ctx: RenderCtx): string {
  const info = UNDEROVER_CHARS[node.kind];
  const tag = info.over ? 'mover' : 'munder';
  const body = renderNode(node.body, ctx);
  const mark = `<mo stretchy="true">${escapeHtml(info.ch)}</mo>`;
  const inner = `<${tag} accent="true">${body}${mark}</${tag}>`;
  if (node.annotation === undefined) return inner;
  const ann = renderNode(node.annotation, ctx);
  // overbrace(body, ann) -> body with brace, with annotation on top of brace.
  // MathML expresses this with a nested mover/munder.
  if (info.over) {
    return `<mover>${inner}${ann}</mover>`;
  }
  return `<munder>${inner}${ann}</munder>`;
}

function renderCancel(kind: string, inner: string): string {
  const notation =
    kind === 'bcancel' ? 'downdiagonalstrike' :
    kind === 'xcancel' ? 'updiagonalstrike downdiagonalstrike' :
    'updiagonalstrike';
  return `<menclose notation="${notation}">${inner}</menclose>`;
}

function renderOpName(text: string, _limits: boolean): string {
  return `<mi mathvariant="normal">${escapeHtml(text)}</mi><mspace width="0.1667em"/>`;
}

function renderClass(cls: MathClass, body: AstNode, ctx: RenderCtx): string {
  // For inline classes we just pass the body through, since MathML doesn't
  // have a first-class "class override" element. For binary/relation/op we
  // could wrap a single character in a tagged <mo>, but the common useful
  // case is wrapping an arbitrary expression. Keep it simple: passthrough.
  if (body.type === 'atom' || body.type === 'symbol' || body.type === 'operator') {
    const text =
      body.type === 'atom' ? body.text :
      body.type === 'symbol' ? body.char :
      body.text;
    if (cls === 'op') {
      return `<mo largeop="true" movablelimits="true">${escapeHtml(text)}</mo>`;
    }
    if (cls === 'bin' || cls === 'rel' || cls === 'punct') {
      return `<mo>${escapeHtml(text)}</mo>`;
    }
    if (cls === 'open') {
      return `<mo form="prefix" stretchy="true">${escapeHtml(text)}</mo>`;
    }
    if (cls === 'close') {
      return `<mo form="postfix" stretchy="true">${escapeHtml(text)}</mo>`;
    }
    if (cls === 'normal') {
      return `<mi mathvariant="normal">${escapeHtml(text)}</mi>`;
    }
  }
  return renderNode(body, ctx);
}

function renderSize(size: MathSize, body: AstNode, ctx: RenderCtx): string {
  const ds = size === 'display' ? 'true' : size === 'inline' ? 'false' : undefined;
  const sl =
    size === 'display' || size === 'inline' ? '0' :
    size === 'script' ? '1' :
    size === 'sscript' ? '2' : undefined;
  const attrs = [
    ds !== undefined ? `displaystyle="${ds}"` : '',
    sl !== undefined ? `scriptlevel="${sl}"` : '',
  ].filter(Boolean).join(' ');
  const next: RenderCtx = {
    ...ctx,
    display: size === 'display' ? true : size === 'inline' ? false : ctx.display,
  };
  return `<mstyle ${attrs}>${renderNode(body, next)}</mstyle>`;
}
