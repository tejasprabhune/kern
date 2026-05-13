// Visual-test corpus. Each entry compares kern's MathML render against a Typst
// CLI render of the same source. Keep entries small and self-contained so a
// failure narrows to a single math construct.

export interface VisualCase {
  name: string;
  src: string;
  display?: boolean;
  // Per-case tolerance override (fraction of non-background pixels allowed to
  // differ). Defaults to 0.05 (5%).
  threshold?: number;
}

export const CORPUS: VisualCase[] = [
  // Simple atoms
  { name: 'var-x', src: 'x' },
  { name: 'number-42', src: '42' },
  { name: 'float-pi-approx', src: '3.14' },

  // Greek
  { name: 'greek-alpha', src: 'alpha' },
  { name: 'greek-pi', src: 'pi' },
  { name: 'greek-omega', src: 'omega' },
  { name: 'greek-Sigma', src: 'Sigma' },
  { name: 'greek-Theta', src: 'Theta' },

  // Sequences and binary ops
  { name: 'seq-abc', src: 'a b c' },
  { name: 'add-sub', src: 'a + b - c' },
  { name: 'equality', src: 'x = y' },
  { name: 'pythagorean', src: 'a^2 + b^2 = c^2' },
  { name: 'plus-minus', src: 'a plus.minus b' },

  // Subscripts and superscripts
  { name: 'sub', src: 'x_1' },
  { name: 'sup', src: 'x^2' },
  { name: 'subsup', src: 'x_1^2' },
  { name: 'sup-paren', src: 'e^(i pi)' },
  { name: 'nested-sup', src: 'x^(y^z)' },

  // Primes
  { name: 'prime', src: "f'" },
  { name: 'double-prime', src: "f''" },

  // Fractions
  { name: 'frac-simple', src: 'frac(a, b)' },
  { name: 'frac-complex', src: 'frac(x^2 + 1, 2 x)' },
  { name: 'frac-inline-slash', src: 'a/b' },
  { name: 'frac-display', src: 'frac(n, k)', display: true },

  // Roots
  { name: 'sqrt-x', src: 'sqrt(x)' },
  { name: 'sqrt-poly', src: 'sqrt(x^2 + 1)' },
  { name: 'cube-root', src: 'root(3, x)' },

  // Large operators (display mode triggers limits)
  { name: 'sum-limits', src: 'sum_(i=0)^n i', display: true },
  { name: 'sum-inline', src: 'sum_(i=0)^n i' },
  { name: 'product-limits', src: 'product_(k=1)^n k', display: true },
  { name: 'integral-bounds', src: 'integral_0^1 x d x', display: true },
  { name: 'integral-cont', src: 'integral.cont_C f d z' },

  // Delimiters / lr
  { name: 'paren', src: '(x + y)' },
  { name: 'bracket', src: '[x + y]' },
  { name: 'abs', src: 'abs(x)' },
  { name: 'norm', src: 'norm(v)' },
  { name: 'lr-big', src: 'lr((frac(a, b)))', display: true },

  // Matrices / vectors / cases
  { name: 'mat-identity', src: 'mat(1, 0; 0, 1)', display: true },
  { name: 'mat-3x3', src: 'mat(a, b, c; d, e, f; g, h, i)', display: true },
  { name: 'vec-3', src: 'vec(a, b, c)', display: true },
  { name: 'cases-two', src: 'cases(x "if" x > 0, -x "otherwise")', display: true },

  // Binomial
  { name: 'binom-nk', src: 'binom(n, k)', display: true },

  // Style
  { name: 'cal-A', src: 'cal(A)' },
  { name: 'bb-R', src: 'bb(R)' },
  { name: 'frak-g', src: 'frak(g)' },
  { name: 'bold-x', src: 'bold(x)' },

  // Accents
  { name: 'hat-f', src: 'hat(f)' },
  { name: 'tilde-x', src: 'tilde(x)' },
  { name: 'bar-x', src: 'bar(x)' },

  // Text in math
  { name: 'text-inline', src: 'x "where" x > 0' },

  // Set notation
  { name: 'in-R', src: 'x in RR' },

  // Complex showcase
  { name: 'quadratic', src: 'x = frac(-b plus.minus sqrt(b^2 - 4 a c), 2 a)', display: true },
  { name: 'euler-identity', src: 'e^(i pi) + 1 = 0' },
];
