# Typst Math Parity Matrix

This document maps every Typst math construct (sourced from
`typst/crates/typst-library/src/math/` and `typst/crates/typst-html/src/mathml.rs`)
to its support status in **kern**. The oracle for correctness is what
`typst compile` produces, not pixel similarity.

Markers:

- `[ok]` Supported. A test case in `tests/corpus.txt` or `packages/kern/test/`
  verifies the construct renders with the right structural MathML.
- `[partial]` Renders, but diverges from Typst in a documented way.
- `[no]` Not supported. Parser errors out, or no structural representation.
- `[skip]` Out of scope for kern. Requires the full Typst layout engine
  (line breaking, OpenType MATH table lookups, font metrics).

Last reviewed against Typst commit `de6f40097` (0.14.2). Audit run with
`pnpm -C scripts check-parity`.

---

## Atoms & symbols

| Construct | Status | Notes |
| --- | --- | --- |
| Single-letter italic variable (`x`, `n`) | [ok] | Emits `<mi>` |
| Multi-letter upright atom (`sin`, `cos`, `log`) | [ok] | Emits `<mi mathvariant="normal">` with trailing thin space |
| Number (`42`, `3.14`) | [ok] | Emits `<mn>` |
| Greek letter (`alpha` `Sigma` `omega`) | [ok] | From symbol table |
| `dif` / `Dif` (upright differential) | [ok] | Thin space + `<mi mathvariant="normal">d</mi>` |
| `oo`, `nothing`, `diameter`, `partial` | [ok] | From symbol table |
| `plus.minus`, `minus.plus`, `times`, `div` | [ok] | Dotted symbol names |
| `arrow.r`, `arrow.l.r`, `arrow.r.long` | [ok] | Dotted symbol traversal |
| `equiv`, `approx`, `sim`, `prop` | [ok] | From symbol table |
| `<<`, `>>`, `<=`, `>=`, `!=` | [ok] | Shorthand tokens |
| Hex literals (`0xff`) | [no] | Typst parses these in code mode; in math mode they are letter sequences |

## Style / mathvariant

| Construct | Status | Notes |
| --- | --- | --- |
| `cal(A)` | [ok] | `mathvariant="script"` |
| `bb(R)` | [ok] | `mathvariant="double-struck"` |
| `frak(g)` | [ok] | `mathvariant="fraktur"` |
| `bold(x)` | [ok] | `mathvariant="bold-italic"` for single letters |
| `italic(x)` | [ok] | `mathvariant="italic"` |
| `upright(d)` | [ok] | `mathvariant="normal"` |
| `sans(x)` | [ok] | `mathvariant="sans-serif"` |
| `mono(x)` | [ok] | `mathvariant="monospace"` |
| `scr(A)` (separate from `cal`) | [partial] | Aliased to `cal`. Typst maps `cal` to chancery, `scr` to roundhand; MathML has only one `script` variant, so the visual distinction depends on the font |
| `serif(x)` | [no] | Not parsed; this is the implicit default anyway |

## Structure

| Construct | Status | Notes |
| --- | --- | --- |
| `frac(a, b)` | [ok] | `<mfrac>` |
| `a / b` | [ok] | Slash promoted to `<mfrac>` in math mode |
| `binom(n, k)` | [ok] | `<mfrac linethickness="0">` wrapped in stretched parens |
| `x^2`, `x_i`, `x_i^2` | [ok] | `<msup>` / `<msub>` / `<msubsup>` |
| `sqrt(x)` | [ok] | `<msqrt>` |
| `root(n, x)` | [ok] | `<mroot>` |
| Primes (`f'`, `f''`, `f'''`) | [ok] | Rendered as superscript `′` / `″` / `‴` |
| `attach(base, ...)` | [partial] | The parser handles `_`/`^` directly; the explicit `attach()` builtin (with `tl`/`tr`/`bl`/`br` named args) is not yet wired up |
| Pre-scripts (`mmultiscripts`) | [no] | Needed for `attach(base, tl: ...)`. Tracked under the explicit `attach()` gap |
| Variadic `binom(n, k_1, k_2, ...)` | [no] | Only two-arg form supported |
| `stretch(glyph, size: ...)` | [no] | Requires layout-time glyph variant selection |

## Limits & scripts

| Construct | Status | Notes |
| --- | --- | --- |
| `sum_(i=0)^n` in display mode | [ok] | Promotes to `<munderover>` |
| `sum_(i=0)^n` in inline mode | [ok] | Stays `<msubsup>` |
| `integral_0^1` (display) | [ok] | Stays `<msubsup>` per Typst (integrals never move) |
| `lim_(x -> oo)` | [ok] | `<munder>` in display, `<msub>` inline |
| `limits(x)` | [ok] | Forces under/over on the next attach |
| `scripts(x)` | [ok] | Forces sub/sup |
| Custom `op("text", limits: true)` | [ok] | |

## Delimiters & fences

| Construct | Status | Notes |
| --- | --- | --- |
| `(x)`, `[x]`, `{x}` (plain) | [ok] | `<mo stretchy="false">` so the fences stay body-height |
| Auto-sized parens around tall content | [ok] | Plain parens around `mfrac`, matrix, root, accent, or under/over auto-promote to stretchy. Mirrors Typst's behavior |
| `lr((... ))`, `lr([... ])` | [ok] | Stretchy fences with `symmetric="true"` for Safari |
| `abs(x)`, `norm(v)` | [ok] | `<mo stretchy="true" symmetric="true">` for `\|` / `‖` |
| `floor(x)`, `ceil(x)` | [ok] | Stretchy `⌊⌋` / `⌈⌉` |
| `round(x)` | [no] | Renders as a generic call. Add as an `LR_MAP` entry next |
| Conditional bar inside `lr()` (`P(A \| B)`) | [ok] | The `\|` becomes a stretchy symmetric fence so Safari sizes it with the parens |
| Mismatched fences (`lr([ x/y \) )`) | [partial] | Parsed: the user must use the explicit `lr()` form. Bare `[ x )` is a parser error because the parser tracks bracket matching |
| `mid(x)` | [partial] | Rendered as a relation class. Typst stretches mid-delimiters to enclosing `lr()` height; our renderer doesn't size mid-delimiters to enclosing fences yet |

## Matrices & multi-line

| Construct | Status | Notes |
| --- | --- | --- |
| `vec(a, b, c)` | [ok] | `<mtable>` wrapped in parens |
| `mat(a, b; c, d)` | [ok] | Comma = column, semicolon = row |
| `cases(x "if" x > 0, -x "otherwise")` | [ok] | `<mtable>` with left brace |
| `mat(..., delim: "[")` | [ok] | Honored for `(`, `[`, `{`, `\|`, `\|\|` |
| `mat(..., augment: ...)` | [no] | Augmented matrices (vline/hline) not rendered |
| `mat(..., gap: 1em)` | [no] | gap/row-gap/column-gap arguments ignored |
| `&` alignment inside `mat` / `vec` / `cases` rows | [partial] | Treated as a cell boundary at the seq level only; cross-row alignment in display equations is not yet implemented |
| Multi-line display equations with `\` | [no] | The parser doesn't recognize `\` as a row separator outside of matrix calls. This is the biggest user-facing gap; see "Known gaps" below |
| `equation` block numbering / supplement | [skip] | Belongs to Typst's layout/figure system |

## Accents

| Construct | Status | Notes |
| --- | --- | --- |
| `hat(x)`, `tilde(x)`, `bar(x)`, `dot(x)`, `ddot(x)` | [ok] | `<mover accent="true">` |
| `acute`, `grave`, `breve`, `caron`, `circle`, `macron` | [ok] | All emit `<mover accent="true">` with the right combining glyph |
| `arrow(x)`, `arrow.l(x)`, `arrow.l.r(x)` | [ok] | Vector accent and harpoons |
| `accent(base, char)` (generic form) | [partial] | Only the named-accent shorthands are recognized; `accent("hat", x)` works but `accent(x, ̂)` (combining-char arg) does not |
| Bottom-attached accents via combining class | [no] | Typst auto-flips combining-Below chars; kern keeps every accent on top |

## Under/over braces & lines

| Construct | Status | Notes |
| --- | --- | --- |
| `overline(x)` / `underline(x)` | [ok] | Stretched line via `<mover accent="true">` |
| `overbrace(x, "label")` / `underbrace` | [ok] | With optional annotation row |
| `overparen` / `underparen` / `overbracket` / `underbracket` | [ok] | |
| `overshell` / `undershell` | [no] | Tortoise-shell brackets not in the table |

## Spacing

| Construct | Status | Notes |
| --- | --- | --- |
| `thin`, `med`, `thick`, `quad`, `qquad` | [ok] | Matches Typst values |
| `space`, `zws` | [ok] | |
| `wide` (2 em) | [no] | Not in the spacing map; falls through to symbol lookup |
| `h(1em)` (parametric spacing) | [no] | Typst's general horizontal-element call not recognized in math mode |

## Math class control

| Construct | Status | Notes |
| --- | --- | --- |
| `class("rel", x)` `"bin"` `"op"` `"open"` `"close"` `"punct"` `"normal"` | [ok] | Wraps a single atom/symbol/operator. For multi-node bodies the class is dropped (parity gap: Typst applies the class to a glyph's spacing context) |
| `display(x)`, `inline(x)`, `script(x)`, `sscript(x)` | [ok] | `<mstyle displaystyle scriptlevel>` |
| `cramped` flag | [no] | Typst's cramped style affects accent positioning above radicals; not represented |

## Cancellation

| Construct | Status | Notes |
| --- | --- | --- |
| `cancel(body)` | [ok] | `<menclose notation="updiagonalstrike">` |
| `bcancel`, `xcancel` | [ok] | |
| `cancel(angle: ...)`, `cancel(inverted: ...)` | [partial] | Argument is parsed but ignored; stroke angle is fixed |

## Text in math

| Construct | Status | Notes |
| --- | --- | --- |
| `"word"` (string literal) | [ok] | `<mtext>` with thin space padding |
| `text("word")` | [partial] | `text` is not a structural function; it falls through to the function-application path and renders the literal `text` followed by a paren group |
| `upright(d)` | [ok] | See style table |

## Differential `dif` (bug-1 detail)

`dif` is Typst's upright differential operator. Source:
`typst/crates/typst-library/src/math/op.rs`. It emits a weak thin space
followed by an `<mi class="Unary">d</mi>`. **kern**'s implementation in
`packages/kern/src/parser.ts` returns a sequence
`[spacing("thin"), atom("d", italic=false)]` from `resolveName`. The
rendered MathML is `<mspace width="0.1667em"/><mi mathvariant="normal">d</mi>`.
`Dif` mirrors with a capital `D`.

The "weak" qualifier in Typst means the space collapses if it'd sit
adjacent to another spacing primitive. kern emits the space
unconditionally; the visual difference is at most 0.1667 em at a single
boundary, which is below the visual-diff floor.

## Known structural gaps

### Multi-line display equations

Typst handles `\\` (escaped line break) inside a math block as a row
separator and `&` as a column-alignment point, emitting
`<mtable class="multiline-equation aligned">`. **kern** only recognizes
`&` inside matrix/vec/cases calls and treats `\\` as a lex error in math
mode. This blocks the common multi-line `align`-style equation:

```typst
$ a &= b + c \
    &= d $
```

Adding this needs:

1. Lexer: emit a `LineBreak` token for `\` followed by whitespace.
2. Parser: a `multiline` production that collects `LineBreak`-separated
   rows of `align`-expressions when at the top level of a display
   equation.
3. Renderer: emit an `<mtable>` row per alignment row, applying the
   `kern-aligned` CSS class.

Tracked at top of `packages/kern/src/parser.ts` (TODO marker added).

### Pre-scripts via explicit `attach()`

Typst's `attach(base, tl: x, br: y, ...)` emits `<mmultiscripts>` with
both pre- and post-scripts. **kern**'s parser only consumes `_`/`^`
post-attachments; the explicit `attach()` form isn't wired up. Add a
new AST node `mmultiscripts` (base + four optional positions) and a
`parseAttachCall` branch.

### Why kern doesn't use Typst's WASM compiler

The MathML emitter that this audit measures against lives in
`typst/crates/typst-html/src/mathml.rs`. It is Rust code that depends on
Typst's `Engine`, layout, font, and IR crates: end-to-end the full
binary is ~30 MB (~500 KB compressed as WASM, assuming you'd ship only
the math layer, which is not how the crate boundary is drawn). Pulling
this into a browser library would:

- Multiply kern's bundle size by ~25x. The whole pitch of kern is "JS-
  native KaTeX-shaped API for Typst math syntax" - shipping WASM would
  trade that for a near-Typst port.
- Pull in font loading, OpenType MATH table parsing, and shape caching.
  None of that work is needed to emit MathML; modern browsers do
  glyph-level layout themselves from `<mfrac>` / `<msqrt>` / etc.
- Couple kern's release cadence to Typst's. We'd rebuild on every Typst
  point release whether or not the math layer changed.

Instead, we treat Typst's MathML output as the **structural oracle** for
correctness:

- `scripts/check-parity.ts` reads `tests/corpus.txt`, renders each entry
  through kern and (when available) through `typst compile --features
  html --format html`, parses both as MathML trees, and diffs tag /
  attribute / nesting (ignoring `class`, `style`, and presentation-only
  attributes).
- The parity report is generated at `docs/parity-report.html`.
- Once Typst exposes equation HTML export end-to-end (the emitter is
  done but the export isn't wired up as of `0.14.2`), the script picks
  it up automatically.

This keeps the runtime-vs-spec gap measurable without dragging the
spec's implementation into the runtime.

## Visual regression

Visual tests live at `packages/kern/test/visual/`. Pixel-level
correctness with Typst is not achievable (different fonts, hinting,
sub-pixel positioning), so the visual tester is a **regression gate**,
not a correctness oracle. Per-case thresholds live in
`packages/kern/test/visual/corpus.ts`; the run never mutates them.
Failures save three PNGs to `__output__/` (Typst baseline, kern
candidate, pixelmatch diff with the differing pixels highlighted) so
the cause is obvious to a human reader.

For structural correctness, see `scripts/check-parity.ts` and
`docs/parity-report.html`.
