import { renderToString } from './index.js';
import type { KernOptions, Delimiter } from './options.js';

const DEFAULT_DELIMITERS: Delimiter[] = [
  { left: '$$', right: '$$', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
  { left: '\\[', right: '\\]', display: true },
];

const DEFAULT_IGNORED_TAGS = new Set([
  'script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option',
]);

export interface AutoRenderOptions extends KernOptions {
  delimiters?: Delimiter[];
  ignoredTags?: string[];
  ignoredClasses?: string[];
  errorCallback?: (message: string, error: Error) => void;
  preProcess?: (math: string) => string;
}

export default function renderMathInElement(
  element: Element,
  options?: AutoRenderOptions,
): void {
  const delimiters = options?.delimiters ?? DEFAULT_DELIMITERS;
  const ignoredTags = new Set(
    (options?.ignoredTags ?? [...DEFAULT_IGNORED_TAGS]).map(t => t.toLowerCase()),
  );
  const ignoredClasses = options?.ignoredClasses ?? [];
  const errorCallback = options?.errorCallback ?? ((msg, err) => console.error(msg, err));

  walkNode(element, delimiters, ignoredTags, ignoredClasses, errorCallback, options);
}

function walkNode(
  node: Node,
  delimiters: Delimiter[],
  ignoredTags: Set<string>,
  ignoredClasses: string[],
  errorCallback: (msg: string, err: Error) => void,
  options?: AutoRenderOptions,
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text.trim()) return;

    const fragments = splitAtDelimiters(text, delimiters);
    if (fragments.length <= 1 && fragments[0]?.type === 'text') return;

    const span = document.createElement('span');
    for (const fragment of fragments) {
      if (fragment.type === 'text') {
        span.appendChild(document.createTextNode(fragment.value));
      } else {
        try {
          const mathStr = options?.preProcess
            ? options.preProcess(fragment.value)
            : fragment.value;
          const html = renderToString(mathStr, {
            ...options,
            displayMode: fragment.display,
          });
          const wrapper = document.createElement('span');
          wrapper.innerHTML = html;
          span.appendChild(wrapper.firstChild ?? wrapper);
        } catch (e) {
          if (e instanceof Error) errorCallback(e.message, e);
          span.appendChild(document.createTextNode(fragment.raw));
        }
      }
    }

    node.parentNode?.replaceChild(span, node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();
  if (ignoredTags.has(tagName)) return;
  if (ignoredClasses.some(cls => el.classList.contains(cls))) return;

  // Walk children in a copy to avoid mutation during iteration
  const children = Array.from(el.childNodes);
  for (const child of children) {
    walkNode(child, delimiters, ignoredTags, ignoredClasses, errorCallback, options);
  }
}

type Fragment =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; raw: string; display: boolean };

function splitAtDelimiters(text: string, delimiters: Delimiter[]): Fragment[] {
  const fragments: Fragment[] = [];
  let remaining = text;
  let pos = 0;

  outer: while (pos < remaining.length) {
    for (const delim of delimiters) {
      const idx = remaining.indexOf(delim.left, pos);
      if (idx === -1) continue;

      // Only act on the nearest delimiter
      const beforeAny = delimiters.reduce((best, d) => {
        const i = remaining.indexOf(d.left, pos);
        return i !== -1 && i < best ? i : best;
      }, Infinity);

      if (idx !== beforeAny) continue;

      if (idx > pos) {
        fragments.push({ type: 'text', value: remaining.slice(pos, idx) });
      }

      const contentStart = idx + delim.left.length;
      const end = remaining.indexOf(delim.right, contentStart);
      if (end === -1) {
        // Unmatched delimiter — treat as text
        fragments.push({ type: 'text', value: remaining.slice(pos) });
        pos = remaining.length;
        continue outer;
      }

      const mathContent = remaining.slice(contentStart, end);
      const rawFull = remaining.slice(idx, end + delim.right.length);
      fragments.push({ type: 'math', value: mathContent, raw: rawFull, display: delim.display });
      pos = end + delim.right.length;
      continue outer;
    }

    // No delimiter found from pos onward
    fragments.push({ type: 'text', value: remaining.slice(pos) });
    break;
  }

  return fragments;
}
