# kern

A fast, zero-dependency JavaScript library that renders [Typst](https://typst.app) math syntax to HTML/CSS/MathML in the browser. Drop-in alternative to [KaTeX](https://katex.org) for projects that prefer Typst's cleaner math syntax.

```js
kern.render('frac(x^2 + 1, 2 x)', document.getElementById('math'));
kern.render('sum_(i=0)^n i = frac(n(n+1), 2)', el);
```

## Installation

```bash
npm install kern
# or
pnpm add kern
```

## Quick start

### Browser (CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kern/styles/kern.css">
<script src="https://cdn.jsdelivr.net/npm/kern/dist/kern.min.js"></script>

<div id="math"></div>
<script>
  kern.render('frac(a, b)', document.getElementById('math'));
</script>
```

### ESM

```js
import { render, renderToString } from 'kern';
import 'kern/kern.css';  // for HTML output

render('x^2 + y^2 = r^2', el);
const html = renderToString('e^(i pi) + 1 = 0');
```

### Auto-render

Automatically render all math in a page:

```js
import renderMathInElement from 'kern/auto-render';

renderMathInElement(document.body, {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
  ],
});
```

## API

### `kern.render(source, element, options?)`

Renders `source` into `element`, replacing its contents.

### `kern.renderToString(source, options?)`

Returns the rendered HTML string.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `displayMode` | `boolean` | `false` | Display (block) vs inline mode |
| `output` | `'mathml' \| 'html' \| 'htmlAndMathml'` | `'mathml'` | Output format |
| `throwOnError` | `boolean` | `true` | Throw `ParseError` on invalid input |
| `errorColor` | `string` | `'#cc0000'` | Color for error messages when `throwOnError` is false |
| `macros` | `Record<string, string>` | `{}` | Custom macro definitions |
| `strict` | `boolean \| 'ignore' \| 'warn' \| 'error'` | `'warn'` | Strictness level |
| `trust` | `boolean \| function` | `false` | Trust level for security-sensitive features |

## Typst math syntax

Kern implements Typst's math mode syntax. Key differences from LaTeX:

| Feature | LaTeX | Typst |
|---------|-------|-------|
| Fraction | `\frac{a}{b}` | `frac(a, b)` or `a/b` |
| Square root | `\sqrt{x}` | `sqrt(x)` |
| Subscript | `x_{n+1}` | `x_(n+1)` |
| Superscript | `x^{2}` | `x^2` |
| Bold | `\mathbf{x}` | `bold(x)` |
| Calligraphic | `\mathcal{A}` | `cal(A)` |
| Blackboard bold | `\mathbb{R}` | `bb(R)` |
| Vector | `\begin{pmatrix}a\\b\end{pmatrix}` | `vec(a, b)` |
| Matrix | `\begin{pmatrix}1&0\\0&1\end{pmatrix}` | `mat(1,0;0,1)` |
| Text | `\text{hello}` | `"hello"` |

### Symbols

Multi-letter identifiers are rendered as upright operator names (`sin`, `cos`, `lim`), single letters are italic variables (`x`, `y`, `z`).

Named symbols:

```
alpha  beta  gamma  delta  epsilon  pi  omega
infinity  partial  nabla  forall  exists
arrow.r  arrow.l  arrow.r.long  arrow.r.double
eq.not  lt.eq  gt.eq  approx  sim
sum  product  integral
```

Dotted modifiers: `arrow.r.long`, `eq.not`, `lt.eq.not`, etc.

### Math functions

```
frac(a, b)       – fraction
sqrt(x)          – square root
root(3, x)       – nth root
binom(n, k)      – binomial coefficient
vec(a, b, c)     – column vector
mat(1,0; 0,1)    – matrix
cases(x, y)      – case expression
lr((expr))       – auto-sized delimiters
abs(x)           – absolute value |x|
norm(x)          – norm ‖x‖
cal(A)           – calligraphic style
bb(R)            – blackboard bold
frak(g)          – fraktur
bold(x)          – bold
italic(x)        – italic
upright(d)       – upright/roman
```

### Spacing

`thin`, `med`, `thick`, `quad`, `qquad`

## Fonts

By default, kern uses KaTeX's web fonts (loaded from cdnjs). For Typst visual parity, include `kern-newcm.css` instead:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kern/styles/kern-newcm.css">
```

## Migration from KaTeX

The API is intentionally identical to KaTeX's:

```js
// KaTeX
katex.render('\\frac{a}{b}', el);

// kern
kern.render('frac(a, b)', el);
```

Main differences:
- Source syntax is Typst, not LaTeX
- No backslash commands — use function call syntax instead
- Spaces separate atoms (no `{}` grouping required for single-character args)

## License

MIT
