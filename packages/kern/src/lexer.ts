import { ParseError } from './errors.js';

export enum TK {
  Ident,
  Number,
  Op,
  Slash,
  LParen,
  RParen,
  LBracket,
  RBracket,
  LBrace,
  RBrace,
  Under,
  Caret,
  Amp,
  Semicolon,
  Comma,
  Colon,
  Dot,
  DotDot,
  Str,
  Prime,
  Bang,
  Escape,
  Shorthand,
  LineBreak,
  EOF,
}

export interface Token {
  kind: TK;
  text: string;
  pos: number;
}

function isLetter(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function isDigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

function isIdentContinue(c: number): boolean {
  return isLetter(c) || isDigit(c);
}

function isWhitespace(c: number): boolean {
  return c === 32 || c === 9 || c === 10 || c === 13;
}

// Characters that act as binary operator separators (addOp level).
// These terminate a juxtaposition sequence but are still emitted as Op tokens.
// These characters act as binary operator separators (addOp level), splitting
// juxtaposition sequences. '|' is intentionally excluded so it can appear as
// an atom inside sequences (e.g. absolute value bars, lr(|x|)).
const OP_CHARS = new Set([
  '+', '-', '=', '<', '>',
  '~',
  '±', '∓', '×', '÷', '·', '∧', '∨', '⊕', '⊗',
  '≤', '≥', '≠', '≈', '≡', '∈', '∉', '∼', '≃', '≅',
  '⊂', '⊃', '⊆', '⊇', '←', '→', '↔', '⇐', '⇒', '⇔',
  '⟵', '⟶', '⟷', '⟸', '⟹', '⟺', '↦',
]);

export function isAddOp(text: string): boolean {
  return OP_CHARS.has(text);
}

// Typst math shorthands. Multi-char ASCII sequences that map to a single
// Unicode symbol token. Longest match wins.
const SHORTHANDS: Array<[string, string]> = [
  ['<==>', '⟺'],
  ['<-->', '⟷'],
  ['-->', '⟶'],
  ['==>', '⟹'],
  ['<==', '⟸'],
  ['<->', '↔'],
  ['<=>', '⇔'],
  ['->>', '↠'],
  ['|->', '↦'],
  ['::=', '⩴'],
  ['->', '→'],
  ['=>', '⇒'],
  ['<-', '←'],
  ['<=', '≤'],
  ['>=', '≥'],
  ['!=', '≠'],
  [':=', '≔'],
  ['~~', '≈'],
  ['~=', '≅'],
  ['>>', '≫'],
  ['<<', '≪'],
  ['||', '‖'],
  ['...', '…'],
];

function matchShorthand(src: string, i: number): [string, string] | null {
  for (const [seq, sym] of SHORTHANDS) {
    if (src.startsWith(seq, i)) return [seq, sym];
  }
  return null;
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const start = i;
    const c = src.charCodeAt(i);

    if (isWhitespace(c)) {
      i++;
      continue;
    }

    if (isLetter(c)) {
      while (i < len && isIdentContinue(src.charCodeAt(i))) i++;
      tokens.push({ kind: TK.Ident, text: src.slice(start, i), pos: start });
      continue;
    }

    if (isDigit(c)) {
      while (i < len && isDigit(src.charCodeAt(i))) i++;
      if (i < len && src.charCodeAt(i) === 46 && i + 1 < len && isDigit(src.charCodeAt(i + 1))) {
        i++;
        while (i < len && isDigit(src.charCodeAt(i))) i++;
      }
      tokens.push({ kind: TK.Number, text: src.slice(start, i), pos: start });
      continue;
    }

    // Backslash escapes: \alpha, \(, etc. A bare `\` at end of input or
    // followed by whitespace, and the `\\` digraph, are math-mode line
    // breaks (used to split multi-line display equations).
    if (c === 92) { // '\'
      const nextIdx = i + 1;
      if (nextIdx >= len) {
        i++;
        tokens.push({ kind: TK.LineBreak, text: '\\', pos: start });
        continue;
      }
      const nc0 = src.charCodeAt(nextIdx);
      if (isWhitespace(nc0)) {
        i++;
        tokens.push({ kind: TK.LineBreak, text: '\\', pos: start });
        continue;
      }
      if (nc0 === 92) {
        i += 2;
        tokens.push({ kind: TK.LineBreak, text: '\\\\', pos: start });
        continue;
      }
      i++;
      const nc = src.charCodeAt(i);
      if (isLetter(nc)) {
        const idStart = i;
        while (i < len && isIdentContinue(src.charCodeAt(i))) i++;
        let name = src.slice(idStart, i);
        // Optional dotted suffix (\arrow.r.long).
        while (
          i + 1 < len &&
          src.charCodeAt(i) === 46 &&
          isLetter(src.charCodeAt(i + 1))
        ) {
          const dotPos = i;
          i++;
          const partStart = i;
          while (i < len && isIdentContinue(src.charCodeAt(i))) i++;
          name = name + '.' + src.slice(partStart, i);
          void dotPos;
        }
        tokens.push({ kind: TK.Escape, text: name, pos: start });
      } else {
        // Single-char escape (e.g. \( \) \\ \{ \})
        const ch = src[i]!;
        i++;
        tokens.push({ kind: TK.Escape, text: ch, pos: start });
      }
      continue;
    }

    // Shorthand multi-char operators take precedence over single-char ops.
    const sh = matchShorthand(src, i);
    if (sh !== null) {
      const [seq, sym] = sh;
      tokens.push({ kind: TK.Shorthand, text: sym, pos: start });
      i += seq.length;
      continue;
    }

    switch (c) {
      case 34: { // "
        i++;
        while (i < len && src.charCodeAt(i) !== 34) {
          if (src.charCodeAt(i) === 92) i++;
          i++;
        }
        if (i >= len) throw new ParseError('Unterminated string literal', start, src);
        i++;
        tokens.push({ kind: TK.Str, text: src.slice(start + 1, i - 1), pos: start });
        break;
      }
      case 40: tokens.push({ kind: TK.LParen, text: '(', pos: start }); i++; break;
      case 41: tokens.push({ kind: TK.RParen, text: ')', pos: start }); i++; break;
      case 91: tokens.push({ kind: TK.LBracket, text: '[', pos: start }); i++; break;
      case 93: tokens.push({ kind: TK.RBracket, text: ']', pos: start }); i++; break;
      case 123: tokens.push({ kind: TK.LBrace, text: '{', pos: start }); i++; break;
      case 125: tokens.push({ kind: TK.RBrace, text: '}', pos: start }); i++; break;
      case 95: tokens.push({ kind: TK.Under, text: '_', pos: start }); i++; break;
      case 94: tokens.push({ kind: TK.Caret, text: '^', pos: start }); i++; break;
      case 38: tokens.push({ kind: TK.Amp, text: '&', pos: start }); i++; break;
      case 59: tokens.push({ kind: TK.Semicolon, text: ';', pos: start }); i++; break;
      case 44: tokens.push({ kind: TK.Comma, text: ',', pos: start }); i++; break;
      case 58: tokens.push({ kind: TK.Colon, text: ':', pos: start }); i++; break;
      case 46: {
        // '..' (spread) vs single '.' (field access / stop).
        if (i + 1 < len && src.charCodeAt(i + 1) === 46) {
          tokens.push({ kind: TK.DotDot, text: '..', pos: start });
          i += 2;
        } else {
          tokens.push({ kind: TK.Dot, text: '.', pos: start });
          i++;
        }
        break;
      }
      case 39: tokens.push({ kind: TK.Prime, text: "'", pos: start }); i++; break;
      case 33: tokens.push({ kind: TK.Bang, text: '!', pos: start }); i++; break;
      case 47: tokens.push({ kind: TK.Slash, text: '/', pos: start }); i++; break;
      default: {
        const ch = src[i]!;
        i++;
        tokens.push({ kind: TK.Op, text: ch, pos: start });
        break;
      }
    }
  }

  tokens.push({ kind: TK.EOF, text: '', pos: len });
  return tokens;
}
