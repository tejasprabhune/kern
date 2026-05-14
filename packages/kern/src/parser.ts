import { ParseError } from './errors.js';
import { tokenize, TK, Token, isAddOp } from './lexer.js';
import {
  AstNode, AtomNode, SymbolNode,
  FracNode, SqrtNode, RootNode, AttachNode, MatrixNode, StyleNode,
  LRNode, SpacingNode, BinomNode, AccentNode,
  UnderOverNode, CancelNode, OpNode, ClassNode, SizeNode, LimitsNode,
  MatrixKind, StyleKind, LRKind, UnderOverKind, CancelKind, MathClass, MathSize,
  seq,
} from './ast.js';
import {
  lookupSymbol, isSpacing, isNamedOperator, isLimitsOperator,
} from './symbols.js';

const STYLE_FUNCS = new Set<string>(['cal', 'bb', 'frak', 'bold', 'italic', 'upright', 'sans', 'mono']);
const MATRIX_FUNCS = new Set<string>(['vec', 'mat', 'cases', 'bmat', 'pmat', 'vmat', 'Vmat']);

const ACCENT_NAMES = new Set<string>([
  'hat', 'tilde', 'dot', 'overline', 'bar', 'arrow',
  'breve', 'grave', 'acute', 'macron', 'caron', 'circle',
  'dot.double', 'dot.triple', 'arrow.l', 'arrow.l.r',
]);

const UNDEROVER_MAP: Record<string, UnderOverKind> = {
  overbrace: 'overbrace',
  underbrace: 'underbrace',
  overline: 'overline.stretch',
  underline: 'underline.stretch',
  overparen: 'overparen',
  underparen: 'underparen',
  overbracket: 'overbracket',
  underbracket: 'underbracket',
};

const CANCEL_MAP: Record<string, CancelKind> = {
  cancel: 'cancel',
  bcancel: 'bcancel',
  xcancel: 'xcancel',
};

const MATH_CLASS_VALUES = new Set<MathClass>(['normal', 'op', 'bin', 'rel', 'open', 'close', 'punct']);
const SIZE_FUNCS: Record<string, MathSize> = {
  display: 'display',
  inline: 'inline',
  script: 'script',
  sscript: 'sscript',
};

const SPACING_MAP: Record<string, SpacingNode['kind']> = {
  thin: 'thin', med: 'med', thick: 'thick',
  quad: 'quad', qquad: 'qquad', wide: 'wide', space: 'space', zws: 'zws',
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

  // alignExpr := row (LineBreak row)*  where row := addExpr ('&' addExpr)*
  //
  // The single-row case (no `\` line breaks) preserves the old behavior:
  // `&` becomes an inline AlignNode marker inside a sequence, so the
  // construct still works inside subexpressions like fraction
  // numerators or matrix cells.
  //
  // When `\` appears at this level, every row collects its `&`-separated
  // cells into a list and the whole construct becomes an EqArray node,
  // which the renderer emits as a multi-line `<mtable>`. This matches
  // Typst's behavior for display-mode aligned equations like
  // `a &= b + c \ &= d`.
  parseAlign(): AstNode {
    const rows: AstNode[][] = [];
    let row: AstNode[] = [];
    let multiRow = false;

    const cellStop = (kind: TK): boolean =>
      kind === TK.Amp || kind === TK.LineBreak || kind === TK.EOF
      || kind === TK.RParen || kind === TK.RBracket || kind === TK.RBrace
      || kind === TK.Semicolon || kind === TK.Comma;

    const parseCell = (): AstNode => {
      if (cellStop(this.peek().kind)) return { type: 'seq', nodes: [] };
      return this.parseAdd();
    };

    row.push(parseCell());

    while (true) {
      const t = this.peek();
      if (t.kind === TK.Amp) {
        this.consume();
        row.push(parseCell());
      } else if (t.kind === TK.LineBreak) {
        this.consume();
        rows.push(row);
        row = [];
        multiRow = true;
        if (cellStop(this.peek().kind) && this.peek().kind !== TK.Amp) break;
        row.push(parseCell());
      } else {
        break;
      }
    }
    if (row.length > 0) rows.push(row);

    if (multiRow) {
      return { type: 'eqarray', rows };
    }
    const cells = rows[0]!;
    if (cells.length === 1) return cells[0]!;
    const nodes: AstNode[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (i > 0) nodes.push({ type: 'align' });
      nodes.push(cells[i]!);
    }
    return { type: 'seq', nodes };
  }

  // addExpr := fracExpr (ADDOP fracExpr)*
  parseAdd(): AstNode {
    const nodes: AstNode[] = [];
    nodes.push(...this.collectFrac());

    while (
      (this.peek().kind === TK.Op || this.peek().kind === TK.Shorthand) &&
      isAddOpText(this.peek().text)
    ) {
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
      if (t.kind === TK.RBrace) break;
      if (t.kind === TK.Amp) break;
      if (t.kind === TK.Semicolon) break;
      if (t.kind === TK.Comma) break;
      if (t.kind === TK.Slash) break;
      if (t.kind === TK.LineBreak) break;
      // Only stop on addOp when there are already atoms to the left.
      // At the start of a seq (nodes empty), addOp chars like '-' are unary.
      if (nodes.length > 0 && (t.kind === TK.Op || t.kind === TK.Shorthand) && isAddOpText(t.text)) break;

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
      let arg = this.parsePrime();
      // In Typst, ^(expr) and _(expr) use parens as transparent grouping, not delimiters.
      if (arg.type === 'lr' && arg.kind === 'paren') arg = arg.body;
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
      // Use an atom (renders as <mi>) instead of a symbol (<mo>) so Chrome
      // doesn't apply operator-dictionary lspace that overlaps the base.
      const primeNode: AtomNode = { type: 'atom', text: primeChar, italic: false };
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

    if (t.kind === TK.Shorthand) {
      this.consume();
      return { type: 'operator', text: t.text };
    }

    if (t.kind === TK.Bang) {
      this.consume();
      return { type: 'operator', text: '!' };
    }

    if (t.kind === TK.Escape) {
      this.consume();
      return this.resolveName(t.text);
    }

    if (t.kind === TK.LParen) {
      return this.parseGroup('(', ')');
    }

    if (t.kind === TK.LBracket) {
      return this.parseGroup('[', ']');
    }

    if (t.kind === TK.LBrace) {
      return this.parseGroup('{', '}');
    }

    if (t.kind === TK.Ident) {
      return this.parseIdent();
    }

    throw new ParseError(`Unexpected token '${t.text}'`, t.pos, this.src);
  }

  private parseGroup(open: string, close: string): AstNode {
    this.consume(); // consume open
    const closeKind = close === ')' ? TK.RParen : close === ']' ? TK.RBracket : TK.RBrace;

    // Bare paren/bracket/brace groups can contain comma- or semicolon-
    // separated math expressions ((0, sigma^2), [1, 2, 3], {a; b}). We keep
    // the separators in the rendered output as math punctuation.
    const parts: AstNode[] = [];
    if (this.peek().kind !== closeKind) {
      parts.push(this.parseAlign());
      while (this.peek().kind === TK.Comma || this.peek().kind === TK.Semicolon) {
        const sep = this.consume();
        parts.push({ type: 'operator', text: sep.text });
        if (this.peek().kind === closeKind) break;
        parts.push(this.parseAlign());
      }
    }

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
      kind: open === '(' ? 'paren' : open === '[' ? 'bracket' : 'brace',
      open,
      close,
      body: seq(parts),
    };
    return lr;
  }

  private parseIdent(): AstNode {
    const name = this.assembleDottedIdent();
    return this.resolveName(name);
  }

  // Resolves a (possibly dotted) identifier or escape name to a node.
  private resolveName(name: string): AstNode {
    // Check spacing keywords first.
    if (name in SPACING_MAP) {
      const kind = SPACING_MAP[name]!;
      return { type: 'spacing', kind };
    }

    // Upright differential `dif x` / `Dif x`. Typst emits a weak thin space
    // followed by an upright d (or D), classed as Unary so following
    // expressions group as the differential's operand.
    if (name === 'dif' || name === 'Dif') {
      const letter = name === 'dif' ? 'd' : 'D';
      return seq([
        { type: 'spacing', kind: 'thin' },
        { type: 'atom', text: letter, italic: false },
      ]);
    }

    // Only the *structural* names (frac, sqrt, mat, accents, style funcs,
    // limits/scripts/op/class, etc.) take their parens as call syntax.
    // Generic identifiers like `p`, `f`, `Psi`, or `clip` get resolved as
    // symbols/operators/atoms first, and the trailing `(...)` is parsed as
    // a separate paren group (math juxtaposition).
    if (this.peek().kind === TK.LParen && isStructuralFunction(name)) {
      return this.parseCall(name);
    }

    // Symbol table lookup (dotted or plain).
    const symChar = lookupSymbol(name);
    if (symChar !== undefined) {
      if (isSpacing(name)) {
        return { type: 'spacing', kind: name as SpacingNode['kind'] };
      }
      return { type: 'symbol', name, char: symChar };
    }

    // Named operator (sin, cos, lim, ...): upright atom with operator flag.
    if (isNamedOperator(name)) {
      return { type: 'atom', text: name, italic: false, operator: true };
    }

    // Single letter -> italic variable; multi-letter -> upright text.
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

    if (name === 'frac') return this.parseFrac();
    if (name === 'sqrt') return this.parseSqrt();
    if (name === 'root') return this.parseRoot();
    if (name === 'binom') return this.parseBinom();
    if (name === 'lr') return this.parseLr();
    if (name === 'op') return this.parseOp();
    if (name === 'class') return this.parseClass();
    if (name === 'limits') return this.parseLimitsHint('limits');
    if (name === 'scripts') return this.parseLimitsHint('scripts');
    if (name === 'mid') return this.parseMid();
    if (name === 'cancel' || name === 'bcancel' || name === 'xcancel') {
      return this.parseCancel(name);
    }
    if (name in SIZE_FUNCS) return this.parseSize(SIZE_FUNCS[name]!);
    if (name in UNDEROVER_MAP) return this.parseUnderOver(UNDEROVER_MAP[name]!);
    if (name in LR_MAP) return this.parseLrShorthand(name);
    if (ACCENT_NAMES.has(name)) return this.parseAccent(name);
    if (STYLE_FUNCS.has(name)) return this.parseStyle(name as StyleKind);
    if (MATRIX_FUNCS.has(name)) return this.parseMatrix(name as MatrixKind);

    // Fallback: treat as function application (upright name + paren group).
    // Use parseArgs so named/spread arguments still parse.
    const args = this.parseArgs();
    const fnName: AtomNode = { type: 'atom', text: name, italic: false };
    const bodyExpr = argsToSeq(args);
    const arg: LRNode = { type: 'lr', kind: 'paren', open: '(', close: ')', body: bodyExpr };
    return seq([fnName, arg]);
  }

  // Parses a comma-separated argument list, handling named args (k: v) and
  // spread args (..expr). Returns the positional and named pieces; the
  // closing ')' is consumed.
  private parseArgs(): { positional: AstNode[]; named: Record<string, AstNode> } {
    const positional: AstNode[] = [];
    const named: Record<string, AstNode> = {};

    while (this.peek().kind !== TK.RParen && this.peek().kind !== TK.EOF) {
      // Skip leading commas (allows mat(1, 0; 0, 1) inner tokenization that
      // accidentally yields a comma here in some recovery paths).
      if (this.peek().kind === TK.Comma) {
        this.consume();
        continue;
      }

      // Spread: ..expr — we just keep the inner expression for now.
      if (this.peek().kind === TK.DotDot) {
        this.consume();
        positional.push(this.parseAlign());
        if (this.peek().kind === TK.Comma) this.consume();
        continue;
      }

      // Named argument: ident ':' expr
      if (
        this.peek().kind === TK.Ident &&
        this.peek(1).kind === TK.Colon
      ) {
        const key = this.consume().text;
        this.consume(); // ':'
        named[key] = this.parseAlign();
        if (this.peek().kind === TK.Comma) this.consume();
        continue;
      }

      positional.push(this.parseAlign());
      if (this.peek().kind === TK.Comma) this.consume();
    }

    this.expect(TK.RParen);
    return { positional, named };
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
    const body = this.parseAlign();
    this.expect(TK.RParen);

    if (body.type === 'lr') return { ...body, stretchy: true };

    if (body.type === 'seq' && body.nodes.length >= 2) {
      const first = body.nodes[0]!;
      const last = body.nodes[body.nodes.length - 1]!;
      if (first.type === 'operator' && last.type === 'operator') {
        const open = first.text;
        const close = last.text;
        if (mirrorDelimiter(open) === close) {
          const inner = body.nodes.slice(1, -1);
          return { type: 'lr', kind: 'custom', open, close, body: seq(inner), stretchy: true };
        }
      }
    }

    return { type: 'lr', kind: 'custom', open: '', close: '', body, stretchy: true };
  }

  private parseLrShorthand(name: string): LRNode {
    const info = LR_MAP[name]!;
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'lr', kind: info.kind, open: info.open, close: info.close, body, stretchy: true };
  }

  private parseAccent(kind: string): AccentNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'accent', kind, body };
  }

  private parseStyle(kind: StyleKind): StyleNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'style', kind, body };
  }

  private parseUnderOver(kind: UnderOverKind): UnderOverNode {
    const body = this.parseAlign();
    let annotation: AstNode | undefined;
    if (this.peek().kind === TK.Comma) {
      this.consume();
      annotation = this.parseAlign();
    }
    this.expect(TK.RParen);
    const out: UnderOverNode = { type: 'underover', kind, body };
    if (annotation !== undefined) out.annotation = annotation;
    return out;
  }

  private parseCancel(name: string): CancelNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'cancel', kind: CANCEL_MAP[name]!, body };
  }

  private parseOp(): OpNode {
    // op("text") or op("text", limits: true). The text becomes the operator
    // name; missing text falls back to a marker atom.
    let text = '';
    let limits = false;
    if (this.peek().kind === TK.RParen) {
      this.consume();
      return { type: 'op', text: '', limits: false };
    }
    const first = this.parseAlign();
    if (first.type === 'text') {
      text = first.value;
    } else if (first.type === 'atom') {
      text = first.text;
    }
    while (this.peek().kind === TK.Comma) {
      this.consume();
      if (
        this.peek().kind === TK.Ident &&
        this.peek().text === 'limits' &&
        this.peek(1).kind === TK.Colon
      ) {
        this.consume(); // limits
        this.consume(); // :
        const v = this.parseAlign();
        if (v.type === 'atom') limits = v.text === 'true';
      } else {
        // Drop extra positional args.
        this.parseAlign();
      }
    }
    this.expect(TK.RParen);
    return { type: 'op', text, limits };
  }

  private parseClass(): ClassNode {
    // class("name", body)
    const first = this.parseAlign();
    this.expect(TK.Comma);
    const body = this.parseAlign();
    this.expect(TK.RParen);
    let cls: MathClass = 'normal';
    const candidate =
      first.type === 'text' ? first.value :
      first.type === 'atom' ? first.text : '';
    if (MATH_CLASS_VALUES.has(candidate as MathClass)) {
      cls = candidate as MathClass;
    }
    return { type: 'class', cls, body };
  }

  private parseSize(size: MathSize): SizeNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'size', size, body };
  }

  private parseLimitsHint(mode: 'limits' | 'scripts'): LimitsNode {
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'limits-hint', mode, body };
  }

  private parseMid(): AstNode {
    // mid(x): a separator inside lr(), rendered as a stretched relation.
    // For now we wrap as a relation operator.
    const body = this.parseAlign();
    this.expect(TK.RParen);
    return { type: 'class', cls: 'rel', body };
  }

  private parseMatrix(kind: MatrixKind): MatrixNode {
    const rows: AstNode[][] = [];
    let row: AstNode[] = [];
    // For vec/cases, commas separate rows (single-column items).
    // For mat/bmat/pmat/vmat/Vmat, commas separate columns within a row.
    const commaIsRowSep = kind === 'vec' || kind === 'cases';

    let delim: { open: string; close: string } | undefined;
    let augment: { vline: number[]; hline: number[] } | undefined;
    let gap: { row?: string; column?: string } | undefined;

    while (this.peek().kind !== TK.RParen && this.peek().kind !== TK.EOF) {
      const t = this.peek();
      if (t.kind === TK.Semicolon) {
        this.consume();
        rows.push(row);
        row = [];
      } else if (t.kind === TK.Comma) {
        this.consume();
        if (commaIsRowSep) {
          rows.push(row);
          row = [];
        }
      } else if (
        t.kind === TK.Ident
        && (
          this.peek(1).kind === TK.Colon
          || (this.peek(1).kind === TK.Op && this.peek(1).text === '-'
              && this.peek(2).kind === TK.Ident && this.peek(3).kind === TK.Colon)
        )
      ) {
        // Named arg key. Typst allows hyphens in identifiers (e.g.
        // `row-gap`, `column-gap`); the lexer tokenizes those as three
        // tokens, so reassemble before the colon.
        let key = this.consume().text;
        if (this.peek().kind === TK.Op && this.peek().text === '-') {
          this.consume();
          key += '-' + this.consume().text;
        }
        this.consume(); // ':'
        const val = this.parseAlign();
        if (key === 'delim') {
          delim = delimFromValue(val);
        } else if (key === 'augment') {
          augment = augmentFromValue(val);
        } else if (key === 'gap') {
          const em = lengthEm(val);
          if (em !== undefined) gap = { ...(gap ?? {}), row: em, column: em };
        } else if (key === 'row-gap') {
          const em = lengthEm(val);
          if (em !== undefined) gap = { ...(gap ?? {}), row: em };
        } else if (key === 'column-gap') {
          const em = lengthEm(val);
          if (em !== undefined) gap = { ...(gap ?? {}), column: em };
        }
      } else if (t.kind === TK.DotDot) {
        this.consume();
        row.push(this.parseAlign());
      } else {
        row.push(this.parseAlign());
      }
    }

    if (row.length > 0) rows.push(row);
    this.expect(TK.RParen);
    const out: MatrixNode = { type: 'matrix', kind, rows };
    if (delim !== undefined) out.delim = delim;
    if (augment !== undefined) out.augment = augment;
    if (gap !== undefined) out.gap = gap;
    return out;
  }
}

// Coerces an AST node carrying a numeric or list-of-numbers argument
// (Typst's `1`, `(1, 2)`, or a dict shorthand) into the augment shape.
// Anything we can't make sense of yields an empty augment object, so a
// bad arg silently falls back to no lines rather than crashing the parse.
function augmentFromValue(node: AstNode): { vline: number[]; hline: number[] } {
  const result = { vline: [] as number[], hline: [] as number[] };
  const pushInt = (target: number[], v: AstNode): void => {
    if (v.type === 'number') {
      const n = parseInt(v.value, 10);
      if (Number.isFinite(n)) target.push(n);
    } else if (v.type === 'seq') {
      for (const c of v.nodes) pushInt(target, c);
    } else if (v.type === 'lr' && v.kind === 'paren') {
      pushInt(target, v.body);
    }
  };
  if (node.type === 'number') {
    const n = parseInt(node.value, 10);
    if (Number.isFinite(n)) result.vline.push(n);
    return result;
  }
  // For named-arg dicts like `(vline: 1, hline: 2)`, the parser will have
  // consumed them as a paren-wrapped sequence with named-arg-style atoms
  // we can't recover here. We support the simple integer form and a
  // paren-wrapped integer list `augment: (1, 2)` (all vlines).
  if (node.type === 'lr' && node.kind === 'paren') {
    pushInt(result.vline, node.body);
  }
  return result;
}

// Recovers an em-length string from an arg like `1em`, `0.5em`, or a
// bare number (interpreted as em). Returns undefined for unsupported
// shapes; the matrix renderer falls back to default spacing in that case.
function lengthEm(node: AstNode): string | undefined {
  if (node.type === 'number') return `${node.value}em`;
  if (node.type === 'seq' && node.nodes.length === 2) {
    const [a, b] = node.nodes;
    if (a!.type === 'number' && b!.type === 'atom' && b!.text === 'em') {
      return `${a!.value}em`;
    }
  }
  return undefined;
}

function delimFromValue(node: AstNode): { open: string; close: string } | undefined {
  const s =
    node.type === 'text' ? node.value :
    node.type === 'atom' ? node.text :
    node.type === 'symbol' ? node.char :
    node.type === 'operator' ? node.text : '';
  switch (s) {
    case '(':
      return { open: '(', close: ')' };
    case '[':
      return { open: '[', close: ']' };
    case '{':
      return { open: '{', close: '}' };
    case '|':
      return { open: '|', close: '|' };
    case '||':
      return { open: '‖', close: '‖' };
    default:
      return undefined;
  }
}

function argsToSeq(args: { positional: AstNode[]; named: Record<string, AstNode> }): AstNode {
  // Flatten positional args separated by commas for the "treat as function
  // application" fallback path.
  if (args.positional.length === 0) return { type: 'seq', nodes: [] };
  if (args.positional.length === 1) return args.positional[0]!;
  const nodes: AstNode[] = [];
  for (let i = 0; i < args.positional.length; i++) {
    if (i > 0) nodes.push({ type: 'operator', text: ',' });
    nodes.push(args.positional[i]!);
  }
  return seq(nodes);
}

function mirrorDelimiter(open: string): string {
  const mirrors: Record<string, string> = {
    '(': ')', '[': ']', '{': '}',
    '|': '|', '‖': '‖',
    '⟨': '⟩', '⌊': '⌋', '⌈': '⌉',
  };
  return mirrors[open] ?? open;
}

function isAddOpText(text: string): boolean {
  return isAddOp(text);
}

// Names that consume their following `(...)` as call syntax. Anything else
// (a generic identifier like `p`, a symbol like `Psi`, or even a named
// operator like `sin`) treats the parens as a math paren group instead.
function isStructuralFunction(name: string): boolean {
  if (name === 'frac' || name === 'sqrt' || name === 'root') return true;
  if (name === 'binom' || name === 'lr' || name === 'mid') return true;
  if (name === 'op' || name === 'class') return true;
  if (name === 'limits' || name === 'scripts') return true;
  if (name === 'cancel' || name === 'bcancel' || name === 'xcancel') return true;
  if (name in SIZE_FUNCS) return true;
  if (name in UNDEROVER_MAP) return true;
  if (name in LR_MAP) return true;
  if (ACCENT_NAMES.has(name)) return true;
  if (STYLE_FUNCS.has(name)) return true;
  if (MATRIX_FUNCS.has(name)) return true;
  return false;
}

// Re-export so the auto-render utility can probe operator names.
export { isLimitsOperator };
