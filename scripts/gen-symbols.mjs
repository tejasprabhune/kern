#!/usr/bin/env node
// Regenerates packages/kern/src/symbols.ts from Typst's codex/sym.txt.
//
// Run with:
//   node scripts/gen-symbols.mjs
//
// The pinned revision below should match the one in typst/Cargo.toml so we
// stay aligned with whatever Typst itself ships.

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CODEX_REV = '0426b6a';
const SYM_URL = `https://raw.githubusercontent.com/typst/codex/${CODEX_REV}/src/modules/sym.txt`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'packages/kern/src/symbols.ts');

function unescapeChar(token) {
  // Strip trailing \vs{...} variant selectors; we don't need them.
  token = token.replace(/\\vs\{[^}]*\}/g, '');
  // Replace \u{HHHH} sequences with the actual codepoint.
  return token.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16)),
  );
}

async function fetchSym() {
  const res = await fetch(SYM_URL);
  if (!res.ok) throw new Error(`Failed to fetch sym.txt: ${res.status}`);
  return await res.text();
}

function parseSym(text) {
  const entries = [];
  let parent = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (line.length === 0) continue;
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('@')) continue; // @deprecated and similar

    const indented = line[0] === ' ' || line[0] === '\t';

    if (!indented) {
      // Top-level: `name [char]`. If no char, just becomes a parent module
      // marker.
      const space = trimmed.indexOf(' ');
      if (space === -1) {
        parent = trimmed;
      } else {
        const name = trimmed.slice(0, space);
        const value = unescapeChar(trimmed.slice(space + 1).trim());
        parent = name;
        if (value.length > 0) entries.push([name, value]);
      }
    } else {
      // Variant: `.modifier char` (modifier already starts with '.').
      if (parent === null) continue;
      const space = trimmed.indexOf(' ');
      if (space === -1) continue;
      const modifier = trimmed.slice(0, space);
      const value = unescapeChar(trimmed.slice(space + 1).trim());
      if (value.length === 0) continue;
      entries.push([`${parent}${modifier}`, value]);
    }
  }

  return entries;
}

function emitTs(entries) {
  const lines = [
    '// Auto-generated from typst/codex@' + CODEX_REV + '/src/modules/sym.txt',
    "// To regenerate: `node scripts/gen-symbols.mjs` from the repo root.",
    '// Do not edit by hand; add or override entries in the maintained block',
    '// at the bottom of this file instead.',
    '',
  ];

  lines.push('export const SYMBOLS: Record<string, string> = {');
  for (const [name, value] of entries) {
    const safeName = /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(name)
      ? (name.includes('.') ? `'${name}'` : name)
      : `'${name.replace(/'/g, "\\'")}'`;
    // Encode the value as a JS string literal using escapes for non-ASCII so
    // the file stays UTF-8-clean without depending on editor settings.
    const safeValue = JSON.stringify(value);
    lines.push(`  ${safeName}: ${safeValue},`);
  }
  lines.push('};');
  lines.push('');

  // Maintained block: named operators, limit ops, spacing kinds, big op check.
  lines.push(
    `// Spacing identifiers stored as empty-string symbols. The parser turns
// these into structural <mspace> nodes rather than rendering the character.
const SPACING_KINDS = new Set(['thin', 'med', 'thick', 'quad', 'qquad', 'space', 'zws']);

export function isSpacing(name: string): boolean {
  return SPACING_KINDS.has(name);
}

export function lookupSymbol(name: string): string | undefined {
  const raw = SYMBOLS[name];
  if (raw === undefined) return undefined;
  // Spacing tokens are stored as empty strings; the parser handles them.
  if (raw === '' && SPACING_KINDS.has(name)) return raw;
  return raw;
}

// Named operator functions in Typst's \`op\` module. These render upright with
// thin spacing after, and some of them (LIMITS_OPERATORS) place attachments
// under/over in display style instead of as sub/sup.
export const NAMED_OPERATORS = new Set<string>([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
  'arcsin', 'arccos', 'arctan',
  'log', 'ln', 'lg', 'exp',
  'lim', 'liminf', 'limsup',
  'inf', 'sup',
  'max', 'min',
  'det', 'gcd', 'lcm', 'mod',
  'arg', 'deg', 'dim',
  'hom', 'id', 'im', 'ker', 'tr', 'Pr',
]);

export const LIMITS_OPERATORS = new Set<string>([
  'lim', 'liminf', 'limsup',
  'inf', 'sup',
  'max', 'min',
  'det', 'gcd', 'arg',
]);

export function isNamedOperator(name: string): boolean {
  return NAMED_OPERATORS.has(name);
}

export function isLimitsOperator(name: string): boolean {
  return LIMITS_OPERATORS.has(name);
}

const BIG_OPERATOR_CHARS = new Set<string>([
  '∑', '∏', '∐', '∫', '∬', '∭', '⨌',
  '∮', '∯', '∰', '∱', '∲', '∳',
  '⋃', '⋂', '⨆', '⨅', '⨀', '⨁', '⨂',
  '⨃', '⨄', '⨊', '⨋',
]);

// Integrals keep their bounds as sub/sup even in display mode; sums,
// products, unions, and coproducts move them under/over.
const INTEGRAL_CHARS = new Set<string>([
  '∫', '∬', '∭', '⨌', '∮', '∯', '∰', '∱', '∲', '∳',
]);

export function isBigOperator(ch: string): boolean {
  return BIG_OPERATOR_CHARS.has(ch);
}

export function isIntegralOperator(ch: string): boolean {
  return INTEGRAL_CHARS.has(ch);
}
`,
  );

  return lines.join('\n');
}

// Forced overrides applied after the codex import: things kern needs that
// either aren't in sym.txt (the kern shortcuts `infty`, `nothing`) or that we
// want to display differently (the spacing tokens kept as empty strings so
// the parser routes them through <mspace>).
const OVERRIDES = {
  // Aliases users expect even though Typst's codex uses different names.
  // hbar is the reduced Planck constant (U+210F); codex's `planck` is the
  // bare Latin h-stroke (U+0127), which is shorter and looks different.
  hbar: 'ℏ',
  infty: '∞',
  emptyset: '∅',
  // codex's `dots` module has submodules (dots.h, dots.v, ...) but
  // doesn't export a bare `dots`. Typst's math layer falls back to the
  // module's default character, which for dots is `…` (HORIZONTAL
  // ELLIPSIS). Wire that explicitly so `a, b, dots, n` works.
  dots: '…',
  // angle.l / angle.r are deprecated-but-supported aliases in Typst's
  // runtime (they map to chevron.l / chevron.r). The codex doesn't
  // export them, so add the aliases here so kern accepts the form
  // users still type today.
  'angle.l': '⟨',
  'angle.r': '⟩',
  // Spacing tokens stored as empty strings; the parser turns them into
  // <mspace> nodes.
  thin: '',
  med: '',
  thick: '',
  quad: '',
  qquad: '',
  space: ' ',
  zws: '​',
};

async function main() {
  const text = await fetchSym();
  const entries = parseSym(text);
  // Dedup keys preserving the LAST occurrence; codex sometimes lists multiple
  // aliases that collapse to the same name.
  const map = new Map();
  for (const [k, v] of entries) map.set(k, v);
  for (const [k, v] of Object.entries(OVERRIDES)) map.set(k, v);
  const dedup = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const out = emitTs(dedup);
  writeFileSync(OUT_PATH, out, 'utf8');
  console.log(`Wrote ${dedup.length} symbols to ${OUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
