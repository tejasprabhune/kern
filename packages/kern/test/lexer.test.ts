import { describe, it, expect } from 'vitest';
import { tokenize, TK } from '../src/lexer.js';

describe('tokenize', () => {
  it('tokenizes identifiers', () => {
    const tokens = tokenize('alpha');
    expect(tokens[0]).toMatchObject({ kind: TK.Ident, text: 'alpha' });
    expect(tokens[1]).toMatchObject({ kind: TK.EOF });
  });

  it('tokenizes multi-letter identifiers', () => {
    const tokens = tokenize('sin');
    expect(tokens[0]).toMatchObject({ kind: TK.Ident, text: 'sin' });
  });

  it('tokenizes numbers', () => {
    const tokens = tokenize('3.14');
    expect(tokens[0]).toMatchObject({ kind: TK.Number, text: '3.14' });
  });

  it('tokenizes integers', () => {
    const tokens = tokenize('42');
    expect(tokens[0]).toMatchObject({ kind: TK.Number, text: '42' });
  });

  it('tokenizes string literals', () => {
    const tokens = tokenize('"hello"');
    expect(tokens[0]).toMatchObject({ kind: TK.Str, text: 'hello' });
  });

  it('tokenizes operators', () => {
    const tokens = tokenize('+');
    expect(tokens[0]).toMatchObject({ kind: TK.Op, text: '+' });
  });

  it('tokenizes parentheses', () => {
    const tokens = tokenize('()');
    expect(tokens[0]).toMatchObject({ kind: TK.LParen });
    expect(tokens[1]).toMatchObject({ kind: TK.RParen });
  });

  it('tokenizes subscript/superscript markers', () => {
    const tokens = tokenize('x_1^2');
    expect(tokens[1]).toMatchObject({ kind: TK.Under });
    expect(tokens[3]).toMatchObject({ kind: TK.Caret });
  });

  it('tokenizes prime', () => {
    const tokens = tokenize("f'");
    expect(tokens[0]).toMatchObject({ kind: TK.Ident, text: 'f' });
    expect(tokens[1]).toMatchObject({ kind: TK.Prime });
  });

  it('tokenizes slash separately from operators', () => {
    const tokens = tokenize('a/b');
    expect(tokens[1]).toMatchObject({ kind: TK.Slash });
  });

  it('tokenizes dots', () => {
    const tokens = tokenize('arrow.r');
    expect(tokens[0]).toMatchObject({ kind: TK.Ident, text: 'arrow' });
    expect(tokens[1]).toMatchObject({ kind: TK.Dot });
    expect(tokens[2]).toMatchObject({ kind: TK.Ident, text: 'r' });
  });

  it('skips whitespace', () => {
    const tokens = tokenize('a   b');
    expect(tokens[0]!.text).toBe('a');
    expect(tokens[1]!.text).toBe('b');
    expect(tokens[2]!.kind).toBe(TK.EOF);
  });

  it('tracks positions', () => {
    const tokens = tokenize('ab cd');
    expect(tokens[0]!.pos).toBe(0);
    expect(tokens[1]!.pos).toBe(3);
  });

  it('handles semicolons and commas', () => {
    const tokens = tokenize('1;2,3');
    expect(tokens[1]).toMatchObject({ kind: TK.Semicolon });
    expect(tokens[3]).toMatchObject({ kind: TK.Comma });
  });

  it('throws on unterminated string', () => {
    expect(() => tokenize('"oops')).toThrow();
  });

  it('always ends with EOF', () => {
    const tokens = tokenize('');
    expect(tokens[tokens.length - 1]!.kind).toBe(TK.EOF);
  });
});
