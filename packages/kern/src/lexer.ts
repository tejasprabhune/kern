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
  Under,
  Caret,
  Amp,
  Semicolon,
  Comma,
  Dot,
  Str,
  Prime,
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
  '⟵', '⟶', '⟷', '⟸', '⟹', '⟺',
]);

export function isAddOp(text: string): boolean {
  return OP_CHARS.has(text);
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
      case 95: tokens.push({ kind: TK.Under, text: '_', pos: start }); i++; break;
      case 94: tokens.push({ kind: TK.Caret, text: '^', pos: start }); i++; break;
      case 38: tokens.push({ kind: TK.Amp, text: '&', pos: start }); i++; break;
      case 59: tokens.push({ kind: TK.Semicolon, text: ';', pos: start }); i++; break;
      case 44: tokens.push({ kind: TK.Comma, text: ',', pos: start }); i++; break;
      case 46: tokens.push({ kind: TK.Dot, text: '.', pos: start }); i++; break;
      case 39: tokens.push({ kind: TK.Prime, text: "'", pos: start }); i++; break;
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
