import type { AstNode, MatrixKind } from '../ast.js';
import { escapeHtml, mathvariantForStyle, mspaceWidth } from './shared.js';

interface RenderCtx {
  display: boolean;
}

export function renderMathML(node: AstNode, display: boolean): string {
  const ctx: RenderCtx = { display };
  const inner = renderNode(node, ctx);
  const displayAttr = display ? ' display="block"' : '';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${displayAttr}>${inner}</math>`;
}

function renderNode(node: AstNode, ctx: RenderCtx): string {
  switch (node.type) {
    case 'seq': return renderSeq(node.nodes, ctx);
    case 'atom': return renderAtom(node.text, node.italic);
    case 'number': return `<mn>${escapeHtml(node.value)}</mn>`;
    case 'symbol': return renderSymbol(node.char);
    case 'operator': return `<mo>${escapeHtml(node.text)}</mo>`;
    case 'text': return `<mtext>${escapeHtml(node.value)}</mtext>`;
    case 'frac': return renderFrac(node.num, node.den, ctx);
    case 'sqrt': return `<msqrt>${renderNode(node.body, ctx)}</msqrt>`;
    case 'root': return `<mroot>${renderNode(node.body, ctx)}${renderNode(node.index, ctx)}</mroot>`;
    case 'attach': return renderAttach(node, ctx);
    case 'matrix': return renderMatrix(node.kind, node.rows, ctx);
    case 'style': return renderStyle(node.kind, node.body, ctx);
    case 'lr': return renderLR(node.open, node.close, node.body, ctx);
    case 'spacing': return `<mspace width="${mspaceWidth(node.kind)}"/>`;
    case 'align': return `<mo>&#x200B;</mo>`;
    case 'binom': return renderBinom(node.top, node.bot, ctx);
  }
}

function renderSeq(nodes: AstNode[], ctx: RenderCtx): string {
  if (nodes.length === 0) return '<mrow></mrow>';
  const inner = nodes.map(n => renderNode(n, ctx)).join('');
  return `<mrow>${inner}</mrow>`;
}

function renderAtom(text: string, italic: boolean): string {
  const variant = italic ? '' : ' mathvariant="normal"';
  return `<mi${variant}>${escapeHtml(text)}</mi>`;
}

function renderSymbol(char: string): string {
  if (char === '') return '<mspace width="0em"/>';

  // Decide tag: operators vs identifiers vs numbers
  const cp = char.codePointAt(0) ?? 0;

  // Arrows, relations, binary operators → <mo>
  if (isOperatorChar(cp)) return `<mo>${escapeHtml(char)}</mo>`;

  // Letters (Greek, script, etc.) → <mi>
  if (isLetterChar(cp)) return `<mi>${escapeHtml(char)}</mi>`;

  // Default → <mo>
  return `<mo>${escapeHtml(char)}</mo>`;
}

function isOperatorChar(cp: number): boolean {
  // Arrows (U+2190–U+21FF), operators (U+2200–U+22FF), misc (U+2300–U+27FF)
  return (cp >= 0x2190 && cp <= 0x27FF) ||
    cp === 0x00B1 || cp === 0x00D7 || cp === 0x00F7 || // ±×÷
    (cp >= 0x2A00 && cp <= 0x2AFF);
}

function isLetterChar(cp: number): boolean {
  // Greek (U+0391–U+03FF), letterlike (U+2100–U+214F), math alpha (U+1D400–U+1D7FF)
  return (cp >= 0x0391 && cp <= 0x03FF) ||
    (cp >= 0x2100 && cp <= 0x214F) ||
    (cp >= 0x1D400 && cp <= 0x1D7FF);
}

function renderFrac(num: AstNode, den: AstNode, ctx: RenderCtx): string {
  return `<mfrac>${renderNode(num, ctx)}${renderNode(den, ctx)}</mfrac>`;
}

function renderBinom(top: AstNode, bot: AstNode, ctx: RenderCtx): string {
  return `<mrow><mo>(</mo><mfrac linethickness="0">${renderNode(top, ctx)}${renderNode(bot, ctx)}</mfrac><mo>)</mo></mrow>`;
}

function renderAttach(node: { base: AstNode; sub?: AstNode; sup?: AstNode }, ctx: RenderCtx): string {
  const base = renderNode(node.base, ctx);
  if (node.sub !== undefined && node.sup !== undefined) {
    return `<msubsup>${base}${renderNode(node.sub, ctx)}${renderNode(node.sup, ctx)}</msubsup>`;
  }
  if (node.sub !== undefined) {
    return `<msub>${base}${renderNode(node.sub, ctx)}</msub>`;
  }
  if (node.sup !== undefined) {
    return `<msup>${base}${renderNode(node.sup, ctx)}</msup>`;
  }
  return base;
}

function renderMatrix(kind: MatrixKind, rows: AstNode[][], ctx: RenderCtx): string {
  const { open, close } = matrixDelimiters(kind);
  const tableRows = rows.map(row => {
    const cells = row.map(cell => `<mtd>${renderNode(cell, ctx)}</mtd>`).join('');
    return `<mtr>${cells}</mtr>`;
  }).join('');

  let table = `<mtable>${tableRows}</mtable>`;

  if (kind === 'cases') {
    // cases: left brace, right nothing
    return `<mrow><mo>{</mo><mtable columnalign="left left">${tableRows}</mtable></mrow>`;
  }

  if (open || close) {
    return `<mrow><mo>${escapeHtml(open)}</mo>${table}<mo>${escapeHtml(close)}</mo></mrow>`;
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
    case 'cases': return { open: '', close: '' };
    default: return { open: '(', close: ')' };
  }
}

function renderStyle(kind: string, body: AstNode, ctx: RenderCtx): string {
  const variant = mathvariantForStyle(kind);
  const inner = renderNode(body, ctx);

  // Wrap in mstyle with mathvariant
  return `<mstyle mathvariant="${variant}">${inner}</mstyle>`;
}

function renderLR(open: string, close: string, body: AstNode, ctx: RenderCtx): string {
  return `<mrow><mo>${escapeHtml(open)}</mo>${renderNode(body, ctx)}<mo>${escapeHtml(close)}</mo></mrow>`;
}
