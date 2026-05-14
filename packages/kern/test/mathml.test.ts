import { describe, it, expect } from 'vitest';
import { renderToString } from '../src/index.js';

function ml(src: string, display = false): string {
  return renderToString(src, { output: 'mathml', displayMode: display });
}

describe('MathML renderer', () => {
  it('wraps output in <math>', () => {
    const out = ml('x');
    expect(out).toMatch(/^<math/);
    expect(out).toContain('</math>');
  });

  it('adds display="block" in display mode', () => {
    const out = ml('x', true);
    expect(out).toContain('display="block"');
  });

  it('no display attr in inline mode', () => {
    const out = ml('x', false);
    expect(out).not.toContain('display=');
  });

  it('renders single italic variable as <mi>', () => {
    const out = ml('x');
    expect(out).toContain('<mi>x</mi>');
  });

  it('renders upright multi-letter name', () => {
    const out = ml('sin');
    expect(out).toContain('mathvariant="normal"');
  });

  it('renders number as <mn>', () => {
    const out = ml('42');
    expect(out).toContain('<mn>42</mn>');
  });

  it('renders Greek symbol', () => {
    const out = ml('alpha');
    expect(out).toContain('α');
  });

  it('renders fraction', () => {
    const out = ml('frac(a, b)');
    expect(out).toContain('<mfrac>');
    expect(out).toContain('</mfrac>');
  });

  it('renders inline fraction a/b', () => {
    const out = ml('a/b');
    expect(out).toContain('<mfrac>');
  });

  it('renders sqrt', () => {
    const out = ml('sqrt(x)');
    expect(out).toContain('<msqrt>');
  });

  it('renders nth root', () => {
    const out = ml('root(3, x)');
    expect(out).toContain('<mroot>');
  });

  it('renders subscript', () => {
    const out = ml('x_1');
    expect(out).toContain('<msub>');
  });

  it('renders superscript', () => {
    const out = ml('x^2');
    expect(out).toContain('<msup>');
  });

  it('renders sub+sup together', () => {
    const out = ml('x_1^2');
    expect(out).toContain('<msubsup>');
  });

  it('renders matrix', () => {
    const out = ml('mat(1, 2; 3, 4)');
    expect(out).toContain('<mtable>');
    expect(out).toContain('<mtr>');
    expect(out).toContain('<mtd>');
  });

  it('renders vec with parens', () => {
    const out = ml('vec(a, b, c)');
    expect(out).toMatch(/<mo[^>]*>\(<\/mo>/);
  });

  it('renders cal style', () => {
    const out = ml('cal(A)');
    expect(out).toContain('mathvariant="script"');
  });

  it('renders bb style', () => {
    const out = ml('bb(R)');
    expect(out).toContain('mathvariant="double-struck"');
  });

  it('renders text node', () => {
    const out = ml('"hello"');
    expect(out).toContain('<mtext>hello</mtext>');
  });

  it('renders binom', () => {
    const out = ml('binom(n, k)');
    expect(out).toContain('<mfrac linethickness="0">');
  });

  it('renders spacing quad', () => {
    const out = ml('quad');
    expect(out).toContain('<mspace');
    expect(out).toContain('1em');
  });

  it('escapes HTML in text', () => {
    const out = ml('"<script>"');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('renders operator +', () => {
    const out = ml('x + y');
    expect(out).toContain('<mo>+</mo>');
  });

  it('renders prime', () => {
    const out = ml("f'");
    expect(out).toContain('′');
  });

  it('renders lr paren', () => {
    const out = ml('(x + y)');
    expect(out).toMatch(/<mo[^>]*>\(<\/mo>/);
    expect(out).toMatch(/<mo[^>]*>\)<\/mo>/);
  });

  it('renders abs with bars', () => {
    const out = ml('abs(x)');
    expect(out).toMatch(/<mo[^>]*>\|<\/mo>/);
  });

  it('sum with limits', () => {
    const out = ml('sum_(i=0)^n');
    expect(out).toContain('<msubsup>');
    expect(out).toContain('∑');
  });

  it('sum in display mode places limits under and over', () => {
    const out = renderToString('sum_(i=0)^n', { output: 'mathml', displayMode: true });
    expect(out).toContain('<munderover>');
    expect(out).not.toContain('<msubsup>');
  });

  it('integral in display mode keeps bounds as sub/sup', () => {
    const out = renderToString('integral_0^1 x', { output: 'mathml', displayMode: true });
    expect(out).toContain('<msubsup>');
    expect(out).not.toContain('<munderover>');
    expect(out).toMatch(/movablelimits="false"/);
  });

  it('lim in display mode places under', () => {
    const out = renderToString('lim_(n -> oo) f', { output: 'mathml', displayMode: true });
    expect(out).toContain('<munder>');
  });
});

describe('renderToString error handling', () => {
  it('throws ParseError by default', () => {
    expect(() => renderToString('(')).toThrow();
  });

  it('returns error span when throwOnError=false', () => {
    const out = renderToString('(', { throwOnError: false });
    expect(out).toContain('kern-error');
  });

  it('uses custom errorColor', () => {
    const out = renderToString('(', { throwOnError: false, errorColor: '#ff0000' });
    expect(out).toContain('#ff0000');
  });
});
