export type AstNode =
  | SeqNode
  | AtomNode
  | NumberNode
  | SymbolNode
  | OperatorNode
  | TextNode
  | FracNode
  | SqrtNode
  | RootNode
  | AttachNode
  | MatrixNode
  | StyleNode
  | LRNode
  | SpacingNode
  | AlignNode
  | BinomNode
  | AccentNode;

export interface SeqNode {
  type: 'seq';
  nodes: AstNode[];
}

export interface AtomNode {
  type: 'atom';
  text: string;
  italic: boolean;
}

export interface NumberNode {
  type: 'number';
  value: string;
}

export interface SymbolNode {
  type: 'symbol';
  name: string;
  char: string;
}

export interface OperatorNode {
  type: 'operator';
  text: string;
}

export interface TextNode {
  type: 'text';
  value: string;
}

export interface FracNode {
  type: 'frac';
  num: AstNode;
  den: AstNode;
}

export interface SqrtNode {
  type: 'sqrt';
  body: AstNode;
}

export interface RootNode {
  type: 'root';
  index: AstNode;
  body: AstNode;
}

export interface AttachNode {
  type: 'attach';
  base: AstNode;
  sub?: AstNode;
  sup?: AstNode;
}

export type MatrixKind = 'vec' | 'mat' | 'cases' | 'bmat' | 'pmat' | 'vmat' | 'Vmat';

export interface MatrixNode {
  type: 'matrix';
  kind: MatrixKind;
  rows: AstNode[][];
}

export type StyleKind = 'cal' | 'bb' | 'frak' | 'bold' | 'italic' | 'upright' | 'sans' | 'mono';

export interface StyleNode {
  type: 'style';
  kind: StyleKind;
  body: AstNode;
}

export type LRKind = 'paren' | 'bracket' | 'brace' | 'abs' | 'norm' | 'floor' | 'ceil' | 'angle' | 'custom';

export interface LRNode {
  type: 'lr';
  kind: LRKind;
  open: string;
  close: string;
  body: AstNode;
}

export type SpacingKind = 'thin' | 'med' | 'thick' | 'quad' | 'qquad' | 'space' | 'zws';

export interface SpacingNode {
  type: 'spacing';
  kind: SpacingKind;
}

export interface AlignNode {
  type: 'align';
}

export interface BinomNode {
  type: 'binom';
  top: AstNode;
  bot: AstNode;
}

export interface AccentNode {
  type: 'accent';
  kind: string;
  body: AstNode;
}

export function seq(nodes: AstNode[]): AstNode {
  if (nodes.length === 0) return { type: 'seq', nodes: [] };
  if (nodes.length === 1) return nodes[0]!;
  return { type: 'seq', nodes };
}
