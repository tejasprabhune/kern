import type { AstNode, MatrixKind, StyleKind } from '../ast.js';
import { escapeHtml, mspaceWidth } from './shared.js';

interface RenderCtx {
  display: boolean;
}

export function renderHTML(node: AstNode, display: boolean): string {
  const ctx: RenderCtx = { display };
  const inner = renderNode(node, ctx);
  const cls = display ? 'kern kern-display' : 'kern kern-inline';
  return `<span class="${cls}">${inner}</span>`;
}

function renderNode(node: AstNode, ctx: RenderCtx): string {
  switch (node.type) {
    case 'seq': return renderSeq(node.nodes, ctx);
    case 'atom': return renderAtom(node.text, node.italic);
    case 'number': return `<span class="kern-mn">${escapeHtml(node.value)}</span>`;
    case 'symbol': return renderSymbol(node.char);
    case 'operator': return `<span class="kern-mo">${escapeHtml(node.text)}</span>`;
    case 'text': return `<span class="kern-mtext">${escapeHtml(node.value)}</span>`;
    case 'frac': return renderFrac(node.num, node.den, ctx);
    case 'sqrt': return renderSqrt(node.body, ctx);
    case 'root': return renderRoot(node.index, node.body, ctx);
    case 'attach': return renderAttach(node, ctx);
    case 'matrix': return renderMatrix(node.kind, node.rows, ctx);
    case 'style': return renderStyle(node.kind, node.body, ctx);
    case 'lr': return renderLR(node.open, node.close, node.body, ctx);
    case 'spacing': return renderSpacing(node.kind);
    case 'align': return `<span class="kern-align"></span>`;
    case 'binom': return renderBinom(node.top, node.bot, ctx);
    case 'accent': return renderAccent(node.kind, node.body, ctx);
  }
}

function renderSeq(nodes: AstNode[], ctx: RenderCtx): string {
  return `<span class="kern-mrow">${nodes.map(n => renderNode(n, ctx)).join('')}</span>`;
}

function renderAtom(text: string, italic: boolean): string {
  const cls = italic ? 'kern-mi kern-mathnormal' : 'kern-mi kern-mathrm';
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

function renderSymbol(char: string): string {
  if (char === '') return '';
  return `<span class="kern-mo">${escapeHtml(char)}</span>`;
}

function renderFrac(num: AstNode, den: AstNode, ctx: RenderCtx): string {
  return (
    `<span class="kern-mfrac">` +
    `<span class="kern-mfrac-num">${renderNode(num, ctx)}</span>` +
    `<span class="kern-mfrac-den">${renderNode(den, ctx)}</span>` +
    `</span>`
  );
}

function renderBinom(top: AstNode, bot: AstNode, ctx: RenderCtx): string {
  return (
    `<span class="kern-mrow">` +
    `<span class="kern-mo">(</span>` +
    `<span class="kern-mfrac kern-mfrac-binom">` +
    `<span class="kern-mfrac-num">${renderNode(top, ctx)}</span>` +
    `<span class="kern-mfrac-den">${renderNode(bot, ctx)}</span>` +
    `</span>` +
    `<span class="kern-mo">)</span>` +
    `</span>`
  );
}

function renderSqrt(body: AstNode, ctx: RenderCtx): string {
  return (
    `<span class="kern-sqrt">` +
    `<span class="kern-sqrt-sign">√</span>` +
    `<span class="kern-sqrt-body">${renderNode(body, ctx)}</span>` +
    `</span>`
  );
}

function renderRoot(index: AstNode, body: AstNode, ctx: RenderCtx): string {
  return (
    `<span class="kern-sqrt kern-nroot">` +
    `<span class="kern-nroot-index">${renderNode(index, ctx)}</span>` +
    `<span class="kern-sqrt-sign">√</span>` +
    `<span class="kern-sqrt-body">${renderNode(body, ctx)}</span>` +
    `</span>`
  );
}

function renderAttach(node: { base: AstNode; sub?: AstNode; sup?: AstNode }, ctx: RenderCtx): string {
  const base = renderNode(node.base, ctx);

  if (node.sub !== undefined && node.sup !== undefined) {
    return (
      `<span class="kern-msubsup">` +
      `<span class="kern-msubsup-base">${base}</span>` +
      `<span class="kern-msubsup-scripts">` +
      `<span class="kern-msup">${renderNode(node.sup, ctx)}</span>` +
      `<span class="kern-msub">${renderNode(node.sub, ctx)}</span>` +
      `</span></span>`
    );
  }
  if (node.sub !== undefined) {
    return `<span class="kern-msub">${base}<span class="kern-msub-script">${renderNode(node.sub, ctx)}</span></span>`;
  }
  if (node.sup !== undefined) {
    return `<span class="kern-msup">${base}<span class="kern-msup-script">${renderNode(node.sup, ctx)}</span></span>`;
  }
  return base;
}

function renderMatrix(kind: MatrixKind, rows: AstNode[][], ctx: RenderCtx): string {
  const { open, close } = matrixDelimiters(kind);
  const rowsHtml = rows.map(row => {
    const cells = row.map(cell =>
      `<span class="kern-mtd">${renderNode(cell, ctx)}</span>`
    ).join('');
    return `<span class="kern-mtr">${cells}</span>`;
  }).join('');

  const table = `<span class="kern-mtable">${rowsHtml}</span>`;

  if (open || close) {
    return (
      `<span class="kern-mrow">` +
      (open ? `<span class="kern-mo kern-delimiter">${escapeHtml(open)}</span>` : '') +
      table +
      (close ? `<span class="kern-mo kern-delimiter">${escapeHtml(close)}</span>` : '') +
      `</span>`
    );
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

const STYLE_CLASS: Record<StyleKind, string> = {
  cal: 'kern-cal',
  bb: 'kern-bb',
  frak: 'kern-frak',
  bold: 'kern-bold',
  italic: 'kern-italic',
  upright: 'kern-upright',
  sans: 'kern-sans',
  mono: 'kern-mono',
};

function renderStyle(kind: StyleKind, body: AstNode, ctx: RenderCtx): string {
  const cls = STYLE_CLASS[kind] ?? 'kern-upright';
  return `<span class="${cls}">${renderNode(body, ctx)}</span>`;
}

function renderLR(open: string, close: string, body: AstNode, ctx: RenderCtx): string {
  return (
    `<span class="kern-mrow">` +
    (open ? `<span class="kern-mo kern-delimiter">${escapeHtml(open)}</span>` : '') +
    renderNode(body, ctx) +
    (close ? `<span class="kern-mo kern-delimiter">${escapeHtml(close)}</span>` : '') +
    `</span>`
  );
}

const ACCENT_CHARS: Record<string, string> = {
  hat: '^', tilde: '~', dot: '˙', overline: '‾', bar: '‾', arrow: '→',
};

function renderAccent(kind: string, body: AstNode, ctx: RenderCtx): string {
  const ch = ACCENT_CHARS[kind] ?? '^';
  return (
    `<span class="kern-mover">` +
    `<span class="kern-mover-body">${renderNode(body, ctx)}</span>` +
    `<span class="kern-mo kern-accent">${escapeHtml(ch)}</span>` +
    `</span>`
  );
}

function renderSpacing(kind: string): string {
  const w = mspaceWidth(kind);
  return `<span class="kern-mspace" style="display:inline-block;width:${w}"></span>`;
}
