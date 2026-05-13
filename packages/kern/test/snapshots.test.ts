import { describe, it, expect } from 'vitest';
import { renderToString } from '../src/index.js';

const CORPUS: Array<{ name: string; src: string; opts?: Parameters<typeof renderToString>[1] }> = [
  { name: 'variable', src: 'x' },
  { name: 'number', src: '42' },
  { name: 'float', src: '3.14' },
  { name: 'greek-alpha', src: 'alpha' },
  { name: 'greek-sum', src: 'sum' },
  { name: 'greek-pi', src: 'pi' },
  { name: 'greek-omega', src: 'omega' },
  { name: 'infinity', src: 'infinity' },
  { name: 'frac-call', src: 'frac(a, b)' },
  { name: 'frac-inline', src: 'a/b' },
  { name: 'frac-complex', src: 'frac(x^2 + 1, 2 x)' },
  { name: 'sqrt', src: 'sqrt(x)' },
  { name: 'nth-root', src: 'root(3, x)' },
  { name: 'sub', src: 'x_1' },
  { name: 'sup', src: 'x^2' },
  { name: 'subsup', src: 'x_1^2' },
  { name: 'sum-limits', src: 'sum_(i=0)^n i' },
  { name: 'integral', src: 'integral_(0)^(infinity) e^(-x) d x' },
  { name: 'binom', src: 'binom(n, k)' },
  { name: 'vec', src: 'vec(a, b, c)' },
  { name: 'mat-2x2', src: 'mat(1, 0; 0, 1)' },
  { name: 'cases', src: 'cases(x = 1, y = 2)' },
  { name: 'cal', src: 'cal(A)' },
  { name: 'bb', src: 'bb(R)' },
  { name: 'frak', src: 'frak(g)' },
  { name: 'bold', src: 'bold(x)' },
  { name: 'upright', src: 'upright(d)' },
  { name: 'text', src: '"hello world"' },
  { name: 'prime', src: "f'" },
  { name: 'double-prime', src: "f''" },
  { name: 'abs', src: 'abs(x)' },
  { name: 'norm', src: 'norm(x)' },
  { name: 'lr-paren', src: '(x + y)' },
  { name: 'lr-bracket', src: '[x + y]' },
  { name: 'lr-call', src: 'lr((x + y))' },
  { name: 'arrow-r', src: 'arrow.r' },
  { name: 'arrow-r-long', src: 'arrow.r.long' },
  { name: 'eq-not', src: 'eq.not' },
  { name: 'lt-eq', src: 'lt.eq' },
  { name: 'quad-spacing', src: 'x quad y' },
  { name: 'thin-spacing', src: 'x thin y' },
  { name: 'sequence', src: 'a b c' },
  { name: 'binop-seq', src: 'x + y - z' },
  { name: 'equality', src: 'x = y' },
  { name: 'pythagorean', src: 'a^2 + b^2 = c^2' },
  { name: 'quadratic', src: 'x = frac(-b plus.minus sqrt(b^2 - 4 a c), 2 a)' },
  { name: 'euler', src: 'e^(i pi) + 1 = 0' },
  { name: 'display-mode', src: 'frac(x, y)', opts: { displayMode: true } },
  { name: 'html-output', src: 'x^2', opts: { output: 'html' } },
  { name: 'htmlAndMathml', src: 'x^2', opts: { output: 'htmlAndMathml' } },
];

describe('MathML snapshots', () => {
  for (const { name, src, opts } of CORPUS) {
    it(name, () => {
      const out = renderToString(src, { output: 'mathml', ...opts });
      expect(out).toMatchSnapshot();
    });
  }
});

describe('HTML snapshots', () => {
  for (const { name, src } of CORPUS.slice(0, 20)) {
    it(name, () => {
      const out = renderToString(src, { output: 'html' });
      expect(out).toMatchSnapshot();
    });
  }
});
