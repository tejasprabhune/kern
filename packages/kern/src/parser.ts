import { ParseError } from './errors.js';
import { tokenize, TK, Token, isAddOp } from './lexer.js';
import {
  AstNode, SeqNode, AtomNode, NumberNode, SymbolNode, OperatorNode,
  FracNode, SqrtNode, RootNode, AttachNode, MatrixNode, StyleNode,
  LRNode, SpacingNode, BinomNode, MatrixKind, StyleKind, LRKind,
  seq,
} from './ast.js';
import { lookupSymbol, isSpacing } from './symbols.js';

const STYLE_FUNCS = new Set<string>(['cal', 'bb', 'frak', 'bold', 'italic', 'upright', 'sans', 'mono']);
const MATRIX_FUNCS = new Set<string>(['vec', 'mat', 'cases', 'bmat', 'pmat', 'vmat', 'Vmat']);

const SPACING_MAP: Record<string, SpacingNode['kind']> = {
  thin: 'thin', med: 'med', thick: 'thick',
  quad: 'quad', qquad: 'qquad', space: 'space', zws: 'zws',
};

const LR_MAP: Record<string, { kind: LRKind; open: string; close: string }> = {
  abs: { kind: 'abs', open: '|', close: '|' },
  norm: { kind: 'norm', open: '‖', close: '‖' },
  floor: { kind: 'floor', open: '⌊', close: '⌋' },
  ceil: { kind: 'ceil', open: '⌈', close: '⌉' },
};

export function parse(src: string): AstNode {
  const tokens = tokenize(src);
  const p = new Parser(tokens, src);
  const node = p.parseAlign();
  if (p.peek().kind !== TK.EOF) {
    throw new ParseError(`Unexpected token '${p.peek().text}'`, p.peek().pos, src);
  }
  return node;
}

class Parser {
  private pos = 0;

  constructor(private tokens: Token[], private src: string) {}

  peek(offset = 0): Token {
    const idx = this.pos + offset;
    return idx < this.tokens.length ? this.tokens[idx]! : this.tokens[this.tokens.length - 1]!;
  }

  consume(): Token {
    const t = this.tokens[this.pos]!;
    if (t.kind !== TK.EOF) this.pos++;
    return t;
  }

  expect(kind: TK): Token {
    const t = this.peek();
    if (t.kind !== kind) {
      throw new ParseError(
        `Expected ${TK[kind as number] ?? kind} but got '${t.text}'`,
        t.pos,
        this.src,
      );
    }
    return this.consume();
  }

  // alignExpr := addExpr ('&' addExpr)*
  parseAlign(): AstNode {
    const first = this.parseAdd();
    if (this.peek().kind !== TK.Amp) return first;

    const nodes: AstNode[] = [first];
    while (this.peek().kind === TK.Amp) {
      this.consume();
      nodes.push({ type: 'align' });
      nodes.push(this.parseAdd());
    }
    return { type: 'seq', nodes };
  }

  // addExpr := fracExpr (ADDOP fracExpr)*
  parseAdd(): AstNode {
    const nodes: AstNode[] = [];
    nodes.push(...this.collectFrac());

    while (this.peek().kind === TK.Op && isAddOp(this.peek().text)) {
      const op = this.consume();
      nodes.push({ type: 'operator', text: op.text });
      nodes.push(...this.collectFrac());
    }

    return seq(nodes);
  }

  // Returns the flat nodes produced by one fracExpr (may be multiple from seq)
  private collectFrac(): AstNode[] {
    const left = this.parseSeq();
    if (this.peek().kind !== TK.Slash) {
      return left.type === 'seq' ? left.nodes : [left];
    }
    this.consume();
    const right = this.parseSeq();
    const frac: FracNode = { type: 'frac', num: left, den: right };
    return [frac];
  }

  // seqExpr := attachExpr+ (atoms, not separated by addOps)
  parseSeq(): AstNode {
    const nodes: AstNode[] = [];

    while (true) {
      const t = this.peek();

      // Stop conditions
      if (t.kind === TK.EOF) break;
      if (t.kind === TK.RParen) break;
      if (t.kind === TK.RBracket) break;
      if (t.kind === TK.Amp) break;
      if (t.kind === TK.Semicolon) break;
      if (t.kind === TK.Comma) break;
      if (t.kind === TK.Slash) break;
      // Only stop on addOp when there are already atoms to the left.
      // At the start of a seq (nodes empty), addOp chars like '-' are unary.
      if (nodes.length > 0 && t.kind === TK.Op && isAddOp(t.text)) break;

      const node = this.parseAttach();
      nodes.push(node);
    }

    if (nodes.length === 0) {
      throw new ParseError('Expected expression', this.peek().pos, this.src);
    }

    return seq(nodes);
  }

  // attachExpr := primeExpr (('_' | '^') primeExpr)*
  parseAttach(): AstNode {
    let base = this.parsePrime();

    let sub: AstNode | undefined;
    let sup: AstNode | undefined;

    while (this.peek().kind === TK.Under || this.peek().kind === TK.Caret) {
      const t = this.consume();
      const arg = this.parsePrime();
      if (t.kind === TK.Under) {
        sub = sub ? seq([sub, arg]) : arg;
      } else {
        sup = sup ? seq([sup, arg]) : arg;
      }
    }

    if (sub !== undefined && sup !== undefined) {
      return { type: 'attach', base, sub, sup };
    }
    if (sub !== undefined) {
      return { type: 'attach', base, sub };
    }
    if (sup !== undefined) {
      return { type: 'attach', base, sup };
    }
    return base;
  }

  // primeExpr := primary ("'")*
  parsePrime(): AstNode {
    let base = this.parsePrimary();

    let primeCount = 0;
    while (this.peek().kind === TK.Prime) {
      this.consume();
      primeCount++;
    }

    if (primeCount > 0) {
      const primeChar = primeCount === 1 ? '′' : primeCount === 2 ? '″' : '‴';
      const primeNode: SymbolNode = { type: 'symbol', name: 'prime', char: primeChar };
      return {
        type: 'attach',
        base,
        sup: primeNode,
      } as AttachNode;
    }

    return base;
  }

  parsePrimary(): AstNode {
    const t = this.peek();

    if (t.kind === TK.Number) {
      this.consume();
      return { type: 'number', value: t.text };
    }

    if (t.kind === TK.Str) {
      this.consume();
      return { type: 'text', value: t.text };
    }

    if (t.kind === TK.Op) {
      this.consume();
      return { type: 'operator', text: t.text };
    }

    if (t.kind === TK.LParen) {
      return this.parseGroup('(', ')');
    }

    if (t.kind === TK.LBracket) {
      return this.parseGroup('[', ']');
    }

    if (t.kind === TK.Ident) {
      return this.parseIdent();
    }

    throw new ParseError(`Unexpected token '${t.text}'`, t.pos, this.src);
  }

  private parseGroup(open: string, close: string): AstNode {
    this.consume(); // consume open
    const closeKind = close === ')' ? TK.RParen : TK.RBracket;

    const body = this.parseAlign();
    if (this.peek().kind !== closeKind) {
      throw new ParseError(
        `Expected '${close}' but got '${this.peek().text}'`,
        this.peek().pos,
        this.src,
      );
    }
    this.consume();

    const lr: LRNode = {
      type: 'lr',
      kind: open === '(' ? 'paren' : 'bracket',
      open,
      close,
      body,
    };
    return lr;
  }

  private parseIdent(): AstNode {
    const name = this.assembleDottedIdent();

    // Check spacing keywords
    if (name in SPACING_MAP) {
      const kind = SPACING_MAP[name]!;
      return { type: 'spacing', kind };
    }

    // Check if it's a function call
    if (this.peek().kind === TK.LParen) {
      return this.parseCall(name);
    }

    // Check symbol table (dotted or plain)
    const symChar = lookupSymbol(name);
    if (symChar !== undefined) {
      // spacing symbols (thin, quad, etc.) stored as empty string
      if (isSpacing(name)) {
        return { type: 'spacing', kind: name as SpacingNode['kind'] };
      }
      return { type: 'symbol', name, char: symChar };
    }

    // Single letter → italic variable; multi-letter → upright operator name
    const italic = name.length === 1 && /[a-zA-Z]/.test(name);
    return { type: 'atom', text: name, italic };
  }

  private assembleDottedIdent(): string {
    let name = this.consume().text; // consume the first Ident

    // Consume dotted extensions: arrow.r.long etc.
    while (
      this.peek().kind === TK.Dot &&
      this.peek(1).kind === TK.Ident
    ) {
      this.consume(); // dot
      name += '.' + this.consume().text;
    }

    return name;
  }

  private parseCall(name: string): AstNode {
    this.consume(); // consume '('

    // Special-cased functions
    if (name === 'frac') return this.parseFrac();
    if (name === 'sqrt') return this.parseSqrt();
    if (name === 'root') return this.parseRoot();
    if (name === 'binom') return this.parseBinom();
    if (name === 'lr') return this.parseLr();
    if (name in LR_MAP) return this.parseLrShorthand(name);
    if (STYLE_FUNCS.has(name)) return this.parseStyle(name as StyleKind);
    if (MATRIX_FUNCS.has(name)) return this.parseMatrix(name as MatrixKind);

    // Fallback: treat as function application (upright name + paren group)
    const body = this.parseAlign();
    this.expect(TK.RParen);
    const fnName: AtomNode = { type: 'atom', text: name, italic: false };
    const arg: LRNode = { type: 'lr', kind: 'paren', open: '(', close: ')', body };
    return seq([fnName, arg]);
  }

  private parseFrac(): FracNode {
    const num = this.parseAlign();
    this.expect(TK.Comma);
    const den = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'frac', num, den };
  }

  private parseSqrt(): SqrtNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'sqrt', body };
  }

  private parseRoot(): RootNode {
    const index = this.parseAlign();
    this.expect(TK.Comma);
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'root', index, body };
  }

  private parseBinom(): BinomNode {
    const top = this.parseAlign();
    this.expect(TK.Comma);
    const bot = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'binom', top, bot };
  }

  private parseLr(): LRNode {
    // lr(expr) — parse the body as a full expression, then consume the ')' of
    // the lr() call itself. If the body is already an LR node (from a parsed
    // paren or bracket group), return it directly. Otherwise inspect the seq
    // head and tail for matching delimiter characters.
    const body = this.parseAlign();
    this.expect(TK.RParen);

    if (body.type === 'lr') return body;

    if (body.type === 'seq' && body.nodes.length >= 2) {
      const first = body.nodes[0]!;
      const last = body.nodes[body.nodes.length - 1]!;
      if (first.type === 'operator' && last.type === 'operator') {
        const open = first.text;
        const close = last.text;
        if (mirrorDelimiter(open) === close) {
          const inner = body.nodes.slice(1, -1);
          return { type: 'lr', kind: 'custom', open, close, body: seq(inner) };
        }
      }
    }

    return { type: 'lr', kind: 'custom', open: '', close: '', body };
  }

  private parseLrShorthand(name: string): LRNode {
    const info = LR_MAP[name]!;
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'lr', kind: info.kind, open: info.open, close: info.close, body };
  }

  private parseStyle(kind: StyleKind): StyleNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'style', kind, body };
  }

  private parseMatrix(kind: MatrixKind): MatrixNode {
    const rows: AstNode[][] = [];
    let row: AstNode[] = [];

    while (this.peek().kind !== TK.RParen && this.peek().kind !== TK.EOF) {
      if (this.peek().kind === TK.Semicolon) {
        this.consume();
        rows.push(row);
        row = [];
        continue;
      }
      if (this.peek().kind === TK.Comma) {
        this.consume();
        const cell = this.parseAlign();
        row.push(cell);
        continue;
      }
      // First cell in a row
      const cell = this.parseAlign();
      row.push(cell);
    }

    if (row.length > 0) rows.push(row);
    this.expect(TK.RParen);
    return { type: 'matrix', kind, rows };
  }
}

function mirrorDelimiter(open: string): string {
  const mirrors: Record<string, string> = {
    '(': ')', '[': ']', '{': '}',
    '|': '|', '‖': '‖',
    '⟨': '⟩', '⌊': '⌋', '⌈': '⌉',
  };
  return mirrors[open] ?? open;
}
