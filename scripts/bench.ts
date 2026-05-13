/**
 * Benchmarks kern's render performance against a corpus of expressions.
 * Run: pnpm bench
 */

import { renderToString } from '../packages/kern/src/index.js';

const CORPUS = [
  'x^2 + y^2 = r^2',
  'frac(a, b)',
  'sum_(i=0)^n i^2',
  'sqrt(b^2 - 4 a c)',
  'integral_(0)^(infinity) e^(-x) d x',
  'mat(1, 0; 0, 1)',
  'x = frac(-b plus.minus sqrt(b^2 - 4 a c), 2 a)',
  'frac(d, d x) f(x) = lim_(h arrow.r 0) frac(f(x + h) - f(x), h)',
  'binom(n, k) = frac(n!, k! (n - k)!)',
  'e^(i pi) + 1 = 0',
];

const ITERATIONS = 10_000;

console.log(`Benchmarking kern — ${ITERATIONS.toLocaleString()} iterations per expression\n`);

for (const src of CORPUS) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    renderToString(src, { output: 'mathml' });
  }
  const elapsed = performance.now() - start;
  const perRender = elapsed / ITERATIONS;
  console.log(`${perRender.toFixed(4)}ms/render  ${src.slice(0, 50)}`);
}

console.log('\nDone.');
