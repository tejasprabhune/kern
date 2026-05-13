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
  | AccentNode
  | UnderOverNode
  | CancelNode
  | OpNode
  | ClassNode
  | SizeNode
  | LimitsNode;

export interface SeqNode {
  type: 'seq';
  nodes: AstNode[];
}

export interface AtomNode {
  type: 'atom';
  text: string;
  italic: boolean;
  // Marks named operators (sin, cos, lim, etc.) so the renderer can apply
  // limit placement and operator spacing.
  operator?: boolean;
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
  // 'auto' (default): under/over in display mode when the base is a large
  // operator or limits operator; otherwise sub/sup.
  // 'limits' / 'scripts': forced by limits()/scripts() functions.
  limits?: 'auto' | 'limits' | 'scripts';
}

export type MatrixKind = 'vec' | 'mat' | 'cases' | 'bmat' | 'pmat' | 'vmat' | 'Vmat';

export interface MatrixNode {
  type: 'matrix';
  kind: MatrixKind;
  rows: AstNode[][];
  // Optional explicit delimiters from `mat(..., delim: "[")` etc.
  delim?: { open: string; close: string };
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

// overbrace / underbrace / overline / underline as a structural construct
// distinct from a single combining accent: these stretch across the body.
export type UnderOverKind =
  | 'overbrace' | 'underbrace'
  | 'overline.stretch' | 'underline.stretch'
  | 'overparen' | 'underparen'
  | 'overbracket' | 'underbracket';

export interface UnderOverNode {
  type: 'underover';
  kind: UnderOverKind;
  body: AstNode;
  // Optional annotation drawn above/below the brace.
  annotation?: AstNode;
}

export type CancelKind = 'cancel' | 'bcancel' | 'xcancel';

export interface CancelNode {
  type: 'cancel';
  kind: CancelKind;
  body: AstNode;
}

// op("text", limits: bool) — declares an operator-name atom.
export interface OpNode {
  type: 'op';
  text: string;
  limits: boolean;
}

export type MathClass = 'normal' | 'op' | 'bin' | 'rel' | 'open' | 'close' | 'punct';

export interface ClassNode {
  type: 'class';
  cls: MathClass;
  body: AstNode;
}

export type MathSize = 'display' | 'inline' | 'script' | 'sscript';

export interface SizeNode {
  type: 'size';
  size: MathSize;
  body: AstNode;
}

// limits(x) / scripts(x): force placement on the wrapped expression's
// next attach.
export interface LimitsNode {
  type: 'limits-hint';
  mode: 'limits' | 'scripts';
  body: AstNode;
}

export function seq(nodes: AstNode[]): AstNode {
  if (nodes.length === 0) return { type: 'seq', nodes: [] };
  if (nodes.length === 1) return nodes[0]!;
  return { type: 'seq', nodes };
}
