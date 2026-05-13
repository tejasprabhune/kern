import { describe, it, expect } from 'vitest';
import { renderToString } from '../src/index.js';

function html(src: string, display = false): string {
  return renderToString(src, { output: 'html', displayMode: display });
}

describe('HTML renderer', () => {
  it('wraps output in .kern span', () => {
    const out = html('x');
    expect(out).toMatch(/^<span class="kern/);
  });

  it('adds kern-display class in display mode', () => {
    const out = html('x', true);
    expect(out).toContain('kern-display');
  });

  it('adds kern-inline class in inline mode', () => {
    const out = html('x', false);
    expect(out).toContain('kern-inline');
  });

  it('renders italic variable', () => {
    const out = html('x');
    expect(out).toContain('kern-mathnormal');
  });

  it('renders upright name', () => {
    const out = html('sin');
    expect(out).toContain('kern-mathrm');
  });

  it('renders number', () => {
    const out = html('42');
    expect(out).toContain('kern-mn');
    expect(out).toContain('42');
  });

  it('renders fraction structure', () => {
    const out = html('frac(a, b)');
    expect(out).toContain('kern-mfrac');
    expect(out).toContain('kern-mfrac-num');
    expect(out).toContain('kern-mfrac-den');
  });

  it('renders sqrt structure', () => {
    const out = html('sqrt(x)');
    expect(out).toContain('kern-sqrt');
    expect(out).toContain('√');
  });

  it('renders subscript', () => {
    const out = html('x_1');
    expect(out).toContain('kern-msub');
  });

  it('renders superscript', () => {
    const out = html('x^2');
    expect(out).toContain('kern-msup');
  });

  it('renders matrix table structure', () => {
    const out = html('mat(1, 2; 3, 4)');
    expect(out).toContain('kern-mtable');
    expect(out).toContain('kern-mtr');
    expect(out).toContain('kern-mtd');
  });

  it('renders cal style', () => {
    const out = html('cal(A)');
    expect(out).toContain('kern-cal');
  });

  it('renders spacing inline style', () => {
    const out = html('quad');
    expect(out).toContain('1em');
  });

  it('escapes HTML entities', () => {
    const out = html('"<b>"');
    expect(out).not.toContain('<b>');
    expect(out).toContain('&lt;b&gt;');
  });
});
