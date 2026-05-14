import type { AstNode, AttachNode, MatrixKind, UnderOverNode, MathClass, MathSize } from '../ast.js';
import { isBigOperator, isIntegralOperator, isLimitsOperator } from '../symbols.js';
import { escapeHtml, mathvariantForStyle, mspaceWidth } from './shared.js';

interface RenderCtx {
  display: boolean;
  // The current script level. 0 is text/inline, +1 is a sub/sup, etc.
  scriptLevel: number;
  // Forced limit placement: 'limits' = under/over, 'scripts' = sub/sup,
  // 'auto' or undefined = decide based on base + display.
  limitsHint?: 'limits' | 'scripts';
}

const BIG_OP_RE = /^[∑∏∐∫∬∭⨌∮∯∰∱∲∳⋃⋂⨆⨅⨀⨁⨂⨃⨄⨊⨋]$/u;

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
    case 'operator': return `<mo>${escapeHtml(node.text)}</mo>`;
    case 'text': return `<mtext>${escapeHtml(node.value)}</mtext>`;
    case 'frac': return renderFrac(node.num, node.den, ctx);
    case 'sqrt': return `<msqrt>${renderNode(node.body, ctx)}</msqrt>`;
    case 'root': return `<mroot>${renderNode(node.body, ctx)}${renderNode(node.index, ctx)}</mroot>`;
    case 'attach': return renderAttach(node, ctx);
    case 'matrix': return renderMatrix(node.kind, node.rows, node.delim, ctx);
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
  const baseHtml = renderBaseForAttach(node.base, ctx);
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

function renderMatrix(
  kind: MatrixKind,
  rows: AstNode[][],
  delim: { open: string; close: string } | undefined,
  ctx: RenderCtx,
): string {
  const { open, close } = delim ?? matrixDelimiters(kind);
  const tableRows = rows.map(row => {
    const cells = row.map(cell => `<mtd>${renderNode(cell, ctx)}</mtd>`).join('');
    return `<mtr>${cells}</mtr>`;
  }).join('');

  // Chromium's <mtable> defaults to zero column/row spacing, so cells
  // collide visually (the identity matrix renders as `100/010/001`).
  // Set explicit values that roughly match Typst's matrix defaults.
  const tableAttrs = ' columnspacing="0.8em" rowspacing="0.4em"';

  if (kind === 'cases') {
    return `<mrow><mo form="prefix" stretchy="true">{</mo><mtable columnalign="left left"${tableAttrs}>${tableRows}</mtable></mrow>`;
  }

  const table = `<mtable${tableAttrs}>${tableRows}</mtable>`;
  if (open || close) {
    const o = open ? `<mo form="prefix" stretchy="true">${escapeHtml(open)}</mo>` : '';
    const c = close ? `<mo form="postfix" stretchy="true">${escapeHtml(close)}</mo>` : '';
    return `<mrow>${o}${table}${c}</mrow>`;
  }
  return table;
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
  const stretchAttr = ` stretchy="${stretchy ? 'true' : 'false'}"`;
  const openMo = open
    ? `<mo${stretchAttr} fence="true">${escapeHtml(open)}</mo>`
    : '';
  const closeMo = close
    ? `<mo${stretchAttr} fence="true">${escapeHtml(close)}</mo>`
    : '';
  return `<mrow>${openMo}${renderNode(body, ctx)}${closeMo}</mrow>`;
}

const ACCENT_CHARS: Record<string, string> = {
  hat: '^',
  tilde: '~',
  dot: '˙',
  'dot.double': '¨',
  'dot.triple': '⃛',
  overline: '‾',
  bar: '‾',
  arrow: '⃗',
  'arrow.l': '⃖',
  'arrow.l.r': '⃡',
  breve: '˘',
  grave: '`',
  acute: '´',
  macron: '¯',
  caron: 'ˇ',
  circle: '˚',
};

function renderAccent(kind: string, body: AstNode, ctx: RenderCtx): string {
  const ch = ACCENT_CHARS[kind] ?? '^';
  return `<mover accent="true">${renderNode(body, ctx)}<mo>${escapeHtml(ch)}</mo></mover>`;
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
