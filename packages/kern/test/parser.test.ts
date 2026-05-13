import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser.js';
import type { AstNode, FracNode, AttachNode, MatrixNode, StyleNode } from '../src/ast.js';

function findNode(node: AstNode, type: string): AstNode | undefined {
  if (node.type === type) return node;
  if (node.type === 'seq') {
    for (const n of node.nodes) {
      const found = findNode(n, type);
      if (found) return found;
    }
  }
  if (node.type === 'attach') {
    const b = findNode(node.base, type);
    if (b) return b;
    if (node.sub) { const s = findNode(node.sub, type); if (s) return s; }
    if (node.sup) { const s = findNode(node.sup, type); if (s) return s; }
  }
  return undefined;
}

describe('parser', () => {
  it('parses a single variable', () => {
    const ast = parse('x');
    expect(ast.type).toBe('atom');
    if (ast.type === 'atom') {
      expect(ast.italic).toBe(true);
      expect(ast.text).toBe('x');
    }
  });

  it('single letter is italic', () => {
    const ast = parse('x');
    expect(ast).toMatchObject({ type: 'atom', italic: true, text: 'x' });
  });

  it('multi-letter identifier is upright', () => {
    const ast = parse('sin');
    expect(ast).toMatchObject({ type: 'atom', italic: false, text: 'sin' });
  });

  it('parses a number', () => {
    const ast = parse('42');
    expect(ast).toMatchObject({ type: 'number', value: '42' });
  });

  it('parses a symbol', () => {
    const ast = parse('alpha');
    expect(ast).toMatchObject({ type: 'symbol', name: 'alpha', char: 'α' });
  });

  it('parses dotted symbol', () => {
    const ast = parse('arrow.r');
    expect(ast).toMatchObject({ type: 'symbol', name: 'arrow.r', char: '→' });
  });

  it('parses deeply dotted symbol', () => {
    const ast = parse('arrow.r.long');
    expect(ast).toMatchObject({ type: 'symbol', name: 'arrow.r.long', char: '⟶' });
  });

  it('parses a fraction with frac()', () => {
    const ast = parse('frac(a, b)');
    expect(ast.type).toBe('frac');
    const f = ast as FracNode;
    expect(f.num).toMatchObject({ type: 'atom', text: 'a' });
    expect(f.den).toMatchObject({ type: 'atom', text: 'b' });
  });

  it('parses inline fraction a/b', () => {
    const ast = parse('a/b');
    expect(ast.type).toBe('frac');
    const f = ast as FracNode;
    expect(f.num).toMatchObject({ type: 'atom', text: 'a' });
    expect(f.den).toMatchObject({ type: 'atom', text: 'b' });
  });

  it('inline fraction respects addOp boundaries: a + b/c + d', () => {
    const ast = parse('a + b/c + d');
    expect(ast.type).toBe('seq');
    const frac = findNode(ast, 'frac') as FracNode;
    expect(frac).toBeDefined();
    expect(frac.num).toMatchObject({ type: 'atom', text: 'b' });
    expect(frac.den).toMatchObject({ type: 'atom', text: 'c' });
  });

  it('parses subscript', () => {
    const ast = parse('x_1');
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect(a.base).toMatchObject({ type: 'atom', text: 'x' });
    expect(a.sub).toMatchObject({ type: 'number', value: '1' });
    expect(a.sup).toBeUndefined();
  });

  it('parses superscript', () => {
    const ast = parse('x^2');
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect(a.sup).toMatchObject({ type: 'number', value: '2' });
  });

  it('parses sub and sup together', () => {
    const ast = parse('x_1^2');
    const a = ast as AttachNode;
    expect(a.sub).toBeDefined();
    expect(a.sup).toBeDefined();
  });

  it('parses sqrt', () => {
    const ast = parse('sqrt(x)');
    expect(ast.type).toBe('sqrt');
  });

  it('parses root(3, x)', () => {
    const ast = parse('root(3, x)');
    expect(ast.type).toBe('root');
  });

  it('parses binom(n, k)', () => {
    const ast = parse('binom(n, k)');
    expect(ast.type).toBe('binom');
  });

  it('parses vec(a, b, c)', () => {
    const ast = parse('vec(a, b, c)');
    expect(ast.type).toBe('matrix');
    const m = ast as MatrixNode;
    expect(m.kind).toBe('vec');
    expect(m.rows[0]).toHaveLength(3);
  });

  it('parses mat with semicolons', () => {
    const ast = parse('mat(1, 2; 3, 4)');
    expect(ast.type).toBe('matrix');
    const m = ast as MatrixNode;
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0]).toHaveLength(2);
  });

  it('parses style cal(A)', () => {
    const ast = parse('cal(A)');
    expect(ast.type).toBe('style');
    const s = ast as StyleNode;
    expect(s.kind).toBe('cal');
  });

  it('parses bb(R)', () => {
    const ast = parse('bb(R)');
    expect(ast.type).toBe('style');
    const s = ast as StyleNode;
    expect(s.kind).toBe('bb');
  });

  it('parses quoted text', () => {
    const ast = parse('"hello"');
    expect(ast).toMatchObject({ type: 'text', value: 'hello' });
  });

  it('parses prime f\'', () => {
    const ast = parse("f'");
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect(a.base).toMatchObject({ type: 'atom', text: 'f' });
    expect(a.sup).toMatchObject({ type: 'symbol', name: 'prime' });
  });

  it('parses double prime f\'\'', () => {
    const ast = parse("f''");
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect((a.sup as any).char).toBe('″');
  });

  it('parses paren group', () => {
    const ast = parse('(x + y)');
    expect(ast.type).toBe('lr');
  });

  it('parses group with subscript: (x + y)^2', () => {
    const ast = parse('(x + y)^2');
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect(a.base.type).toBe('lr');
  });

  it('parses a sequence of atoms', () => {
    const ast = parse('a b c');
    expect(ast.type).toBe('seq');
  });

  it('throws ParseError on unmatched paren', () => {
    expect(() => parse('(x + y')).toThrow();
  });

  it('parses spacing: quad', () => {
    const ast = parse('quad');
    expect(ast).toMatchObject({ type: 'spacing', kind: 'quad' });
  });

  it('parses sum with limits: sum_(i=0)^n', () => {
    const ast = parse('sum_(i=0)^n');
    expect(ast.type).toBe('attach');
    const a = ast as AttachNode;
    expect(a.base).toMatchObject({ type: 'symbol', name: 'sum' });
  });

  it('parses lr((x))', () => {
    const ast = parse('lr((x))');
    expect(ast.type).toBe('lr');
  });

  it('parses abs(x)', () => {
    const ast = parse('abs(x)');
    expect(ast).toMatchObject({ type: 'lr', open: '|', close: '|' });
  });

  it('parses norm(x)', () => {
    const ast = parse('norm(x)');
    expect(ast).toMatchObject({ type: 'lr', open: '‖', close: '‖' });
  });

  it('parses cases', () => {
    const ast = parse('cases(x, y)');
    expect(ast.type).toBe('matrix');
    const m = ast as MatrixNode;
    expect(m.kind).toBe('cases');
  });
});
