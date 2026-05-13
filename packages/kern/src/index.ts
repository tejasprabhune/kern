import { parse } from './parser.js';
import { renderMathML } from './render/mathml.js';
import { renderHTML } from './render/html.js';
import { resolveOptions, type KernOptions } from './options.js';
import { ParseError } from './errors.js';

export { ParseError } from './errors.js';
export type { KernOptions, Delimiter, TrustContext } from './options.js';

/**
 * Renders Typst math `source` into `element`, replacing its contents.
 *
 * @example
 * kern.render('x^2 + y^2 = r^2', document.getElementById('math')!);
 */
export function render(source: string, element: Element, options?: KernOptions): void {
  element.innerHTML = renderToString(source, options);
}

/**
 * Renders Typst math `source` to an HTML string.
 *
 * @example
 * const html = kern.renderToString('frac(a, b)');
 */
export function renderToString(source: string, options?: KernOptions): string {
  const opts = resolveOptions(options);

  try {
    const ast = parse(source);
    const display = opts.displayMode;
    const output = opts.output;

    if (output === 'mathml') {
      return renderMathML(ast, display);
    }
    if (output === 'html') {
      return renderHTML(ast, display);
    }
    // htmlAndMathml: wrap both
    const mathml = renderMathML(ast, display);
    const html = renderHTML(ast, display);
    const cls = display ? 'kern kern-display' : 'kern kern-inline';
    return `<span class="${cls}" aria-hidden="true">${html}</span>${mathml}`;
  } catch (err) {
    if (err instanceof ParseError) {
      if (opts.throwOnError) throw err;
      const msg = escapeHtml(err.message);
      return `<span class="kern-error" style="color:${opts.errorColor}">${msg}</span>`;
    }
    throw err;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
