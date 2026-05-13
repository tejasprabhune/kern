The library is named kern (not tyst). 
Use kern for the package name, and for branded references, and kern- as the CSS class prefix. 
If the npm name kern is unavailable, use kern-typ and note this in the README.

Build "Tyst" — a fast, zero-dependency JavaScript library that renders Typst math 
syntax to HTML/CSS/MathML in the browser. It is a drop-in alternative to KaTeX 
for projects that prefer Typst's cleaner math syntax.

Reference KaTeX (https://github.com/KaTeX/KaTeX) for API shape, project structure, 
and rendering approach. Reference Typst (https://github.com/typst/typst), 
specifically crates/typst-library/src/math/ and crates/typst-syntax/src/, for math 
syntax and the symbol table.

## Constraints
- TypeScript, zero runtime dependencies
- Browser + Node. ESM + CJS + UMD builds
- Bundle target: <50KB min, <20KB gzip for core; symbol table separately importable
- Sub-millisecond render for typical expressions
- No regex in hot paths; hand-written recursive descent parser
- Reuse KaTeX's OFL web fonts via CDN
- Default font stack: KaTeX web fonts (loaded from cdnjs by default). Ship an 
  optional `kern-newcm.css` that swaps to New Computer Modern Math for users 
  who want Typst visual parity.

## Pipeline
Source → Lexer → Parser → AST → Renderer (MathML + HTML/CSS fallback)

## Public API (mirror KaTeX exactly)
- `tyst.render(source, element, options?)`
- `tyst.renderToString(source, options?)` 
- `tyst/auto-render` default export: `renderMathInElement(element, options?)`
- Options: `displayMode`, `throwOnError`, `errorColor`, `macros`, 
  `output: 'mathml' | 'html' | 'htmlAndMathml'`, `trust`, `strict`, `delimiters`
- Throw `ParseError` (subclass of Error) with `position` and `source` fields

## Typst math features to support (v1)
- Identifiers: multi-letter words are upright operator names ("sin", "cos"), 
  single letters are italic variables. Whitespace separates atoms.
- Symbols by name: `alpha`, `beta`, `pi`, `infinity`, etc. (full Unicode mapping)
- Dotted symbol modifiers: `arrow.r`, `arrow.r.long`, `eq.not`, `lt.eq.not`
- Math calls: `frac(a, b)`, `sqrt(x)`, `root(3, x)`, `binom(n, k)`, 
  `vec(a, b, c)`, `mat(1, 2; 3, 4)`, `cases(...)`, `lr((x))`, `abs(x)`, `norm(x)`
- Attachments: `x_1`, `x^2`, `x_1^2`, `sum_(i=1)^n`
- Style functions: `cal(A)`, `bb(R)`, `frak(g)`, `bold(x)`, `italic(x)`, 
  `upright(d)`, `display(...)`, `inline(...)`
- Operators: `+`, `-`, `*`, `/` (fraction in math mode), `=`, `<`, `>`, etc.
- Fractions: `a / b` becomes a displayed fraction in math mode
- Text in math: `"hello"` → upright text
- Alignment: `&` (single column alignment, v1 minimal support)
- Spacing: `quad`, `qquad`, `space`, `thin`, etc.
- Primes: `f'`, `f''`

## Repo structure
tyst/
├── pnpm-workspace.yaml
├── packages/
│   ├── tyst/
│   │   ├── src/
│   │   │   ├── lexer.ts
│   │   │   ├── parser.ts
│   │   │   ├── ast.ts
│   │   │   ├── symbols.ts          # generated; full Typst math symbol table
│   │   │   ├── transformer.ts      # AST → render tree
│   │   │   ├── render/
│   │   │   │   ├── mathml.ts
│   │   │   │   ├── html.ts
│   │   │   │   └── shared.ts
│   │   │   ├── auto-render.ts
│   │   │   ├── errors.ts
│   │   │   ├── options.ts
│   │   │   └── index.ts
│   │   ├── styles/tyst.css         # mirror katex.css for HTML/CSS fallback
│   │   ├── test/
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── tyst-cli/                   # optional: SSR/build-time CLI
├── scripts/
│   ├── gen-symbols.ts              # scrape Typst source for symbol table
│   └── bench.ts                    # vs. KaTeX on identical expressions
├── benchmarks/
├── docs/                           # demo site, drop-in KaTeX comparison
├── README.md
└── LICENSE                         # MIT

## Build steps (do in order)

1. Scaffold the monorepo. pnpm workspaces. TypeScript strict. Vite for the lib 
   build, producing ESM + CJS + UMD. Set up vitest.

2. Write `scripts/gen-symbols.ts`: clone or fetch Typst source, parse its symbol 
   definitions (look in `crates/typst-library/src/math/` — symbols are defined via 
   the `symbols!` macro and similar). Emit `src/symbols.ts` as a typed nested 
   object mapping dotted names to Unicode codepoints. Commit the generated file.

3. Implement the lexer. Tokens: identifier, number, operator, punctuation, 
   string-literal, group-open/close, attachment (`_`/`^`), whitespace, newline, 
   amp (`&`), semicolon. Multi-letter identifiers are one token. Track positions 
   for error reporting.

4. Implement the parser (recursive descent). Produce a typed AST 
   (Expression | Atom | Call | Frac | Attach | Group | Matrix | Text | Symbol | 
   Style). Handle precedence: attachments tightest, then implicit application, 
   then `/`, then binary operators, then `&` alignment. Math calls — `name(args)` — 
   look like function calls; semicolons inside split rows for matrices.

5. Implement transformer + MathML renderer first (smaller surface). Map AST nodes 
   to `<mi>`, `<mn>`, `<mo>`, `<mfrac>`, `<msqrt>`, `<msub>`, `<msup>`, `<msubsup>`, 
   `<munder>`, `<mover>`, `<munderover>`, `<mtable>`, `<mrow>`. Output as a string; 
   never touch DOM directly in the renderer.

6. Implement HTML/CSS renderer. Mirror KaTeX's class names (`tyst`, `tyst-mathnormal`, 
   `tyst-mfrac`, etc.) and structure so that styling stays familiar. Reuse KaTeX's 
   web fonts (KaTeX_Math, KaTeX_Main, etc.) — reference them by CSS family names 
   in tyst.css. The CSS should @import or assume the KaTeX fonts are available 
   from the user's CDN.

7. Wire up the top-level API: `render`, `renderToString`. Implement option merging, 
   `output` mode selection, error rendering (`throwOnError` false → red colored 
   source in output).

8. Port KaTeX's `auto-render` extension. Same `delimiters` array, same DOM walk, 
   same ignored-tags list.

9. Tests:
   - Unit tests for lexer, parser, each renderer node
   - Snapshot tests for ~100 representative expressions covering all v1 features
   - Structural correctness tests: for a curated corpus, render with Kern and 
     with the Typst CLI (via `typst compile` to an intermediate format we can 
     parse, or via `typst query` against the math equation), and compare the 
     structural output — fraction vs division, attachment placement, matrix 
     dimensions, symbol identity. This catches semantic bugs without depending 
     on font metric agreement.
   - Visual regression (Kern vs Kern): commit baseline PNGs of the corpus 
     rendered with the current build. Diff with pixelmatch on every PR. 
     Threshold: 0px difference (any change requires an intentional baseline 
     update).
   - Optional font-parity suite: configure both Typst and Kern to use the same 
     OpenType math font and run a separate pixel diff at a relaxed threshold 
     (<2% pixels differ). This runs nightly, not on every PR. Use this to find 
     systematic layout drift.
   - Performance benchmark against KaTeX on a shared corpus

10. Documentation: README with quickstart, CDN usage, options reference, syntax 
    cheat sheet, KaTeX migration guide. Build a docs site with a live editor 
    side-by-side with KaTeX for comparison.

11. Publish prep:
    - Set up GitHub Actions: lint, typecheck, test, bench, build
    - npm package: `tyst` (verify availability first; fallback `tystmath`)
    - Add `exports` field for proper ESM/CJS dual support
    - Set up unpkg/jsdelivr to work out of the box
    - Add a `tyst.min.js` UMD build for direct script-tag usage

## Non-goals for v1
- Typst markup outside math mode
- Full layout fidelity with Typst's compiler (we approximate; that's the trade)
- Custom fonts shipped with the lib
- WASM-based Typst compiler integration (could be v2)
- Server-side typst integration

## Quality bar
- Every parser branch has a test
- Every renderer node has a snapshot
- No `any` types in src/; library code is fully typed
- Public API has JSDoc with examples
- README has a CodePen link and a "try it" iframe
- Bundle size is enforced in CI with a budget assertion
- Do NOT use em-dashes or banner-style comments anywhere in the codebase.
- 

Start with step 1 and work through sequentially. After each step, run tests and 
report progress. Ask before making non-obvious architectural choices.
