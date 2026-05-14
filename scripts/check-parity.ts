// Structural parity check between kern's MathML output and Typst's.
//
// Reads tests/corpus.txt, renders each entry through kern, and (when the
// Typst CLI exposes MathML output via `typst compile --features html
// --format html`) renders it through Typst as well, then runs a structural
// diff on the two MathML trees.
//
// Typst 0.14.2 ships the MathML emitter at
// crates/typst-html/src/mathml.rs but does not yet wire it up to the
// public HTML export (equations are dropped with a warning). Until that
// lands the script runs in kern-only mode: it emits a report listing
// kern's MathML for every corpus entry so a human can audit it against
// Typst's PDF output side by side. The structural-diff codepath stays in
// place so the moment Typst exposes the export, plugging it in is a
// one-line change in `runTypst`.

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import { renderToString } from '../packages/kern/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CORPUS_PATH = resolve(REPO_ROOT, 'tests', 'corpus.txt');
const REPORT_DIR = resolve(REPO_ROOT, 'docs');
const REPORT_PATH = resolve(REPORT_DIR, 'parity-report.html');

interface Entry { src: string; display: boolean; line: number; }

function readCorpus(): Entry[] {
  const text = readFileSync(CORPUS_PATH, 'utf8');
  const entries: Entry[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!.trim();
    if (raw === '' || raw.startsWith('#')) continue;
    let src = raw;
    let display = false;
    const m = src.match(/^(.*?)\s*\[display\]\s*$/);
    if (m) { src = m[1]!.trim(); display = true; }
    entries.push({ src, display, line: i + 1 });
  }
  return entries;
}

function hasTypstMathml(): boolean {
  const probe = spawnSync('typst', ['--version'], { stdio: 'ignore' });
  if (probe.status !== 0) return false;
  try {
    execFileSync('typst', ['compile', '--features', 'html', '--format', 'html',
      '-', '-'], { input: '$x$', stdio: ['pipe', 'pipe', 'pipe'] });
    // Even if it succeeds, the equation is currently dropped with a
    // warning. Detect that by looking for an empty body.
    return false;
  } catch {
    return false;
  }
}

function runTypst(_entry: Entry): string | null {
  // Placeholder. When `typst compile --features html` starts emitting
  // <math>...</math> for equations, render `$<entry.src>$` to HTML,
  // grep out the math element, and return it. Until then we report a
  // missing oracle and the structural diff is skipped.
  return null;
}

// Tiny MathML parser sufficient for structural comparison. We don't want
// to drag in a real XML/HTML parser as a runtime dep; the kern output is
// well-formed XML, and Typst's emitter (when it lands) is too.
interface MNode {
  tag: string;
  attrs: Record<string, string>;
  children: MNode[];
  text: string;
}

function parseMathml(xml: string): MNode {
  let i = 0;
  function skipWs(): void {
    while (i < xml.length && /\s/.test(xml[i]!)) i++;
  }
  function parseNode(): MNode {
    skipWs();
    if (xml[i] !== '<') {
      // text run
      const start = i;
      while (i < xml.length && xml[i] !== '<') i++;
      return { tag: '#text', attrs: {}, children: [], text: xml.slice(start, i) };
    }
    if (xml.startsWith('<!--', i)) {
      const end = xml.indexOf('-->', i);
      i = end < 0 ? xml.length : end + 3;
      return parseNode();
    }
    // tag
    i++; // '<'
    let tag = '';
    while (i < xml.length && /[A-Za-z0-9_-]/.test(xml[i]!)) { tag += xml[i]!; i++; }
    const attrs: Record<string, string> = {};
    while (i < xml.length && xml[i] !== '>' && xml[i] !== '/') {
      skipWs();
      if (xml[i] === '>' || xml[i] === '/') break;
      let name = '';
      while (i < xml.length && xml[i] !== '=' && !/\s/.test(xml[i]!) && xml[i] !== '>' && xml[i] !== '/') {
        name += xml[i]!; i++;
      }
      let value = '';
      if (xml[i] === '=') {
        i++;
        const q = xml[i]!;
        if (q === '"' || q === "'") {
          i++;
          while (i < xml.length && xml[i] !== q) { value += xml[i]!; i++; }
          i++;
        } else {
          while (i < xml.length && !/[\s/>]/.test(xml[i]!)) { value += xml[i]!; i++; }
        }
      }
      if (name) attrs[name] = value;
    }
    if (xml[i] === '/') { i += 2; return { tag, attrs, children: [], text: '' }; }
    i++; // '>'
    const children: MNode[] = [];
    let text = '';
    while (i < xml.length) {
      skipWs();
      if (xml.startsWith('</', i)) {
        i = xml.indexOf('>', i) + 1;
        break;
      }
      const child = parseNode();
      if (child.tag === '#text') {
        text += child.text;
        if (child.text.trim()) children.push(child);
      } else {
        children.push(child);
      }
    }
    return { tag, attrs, children, text: text.trim() };
  }
  return parseNode();
}

// Attributes that are layout-irrelevant for structural comparison.
const IGNORE_ATTRS = new Set([
  'xmlns', 'class', 'style', 'data-source',
  'lspace', 'rspace', 'displaystyle', 'scriptlevel',
]);

interface DiffMsg { path: string; msg: string; }

function diff(a: MNode, b: MNode, path: string, out: DiffMsg[]): void {
  if (a.tag !== b.tag) {
    out.push({ path, msg: `tag ${a.tag} != ${b.tag}` });
    return;
  }
  const text = a.text.replace(/\s+/g, '');
  const otherText = b.text.replace(/\s+/g, '');
  if (text !== otherText) {
    out.push({ path: `${path}/${a.tag}`, msg: `text "${text}" != "${otherText}"` });
  }
  for (const k of Object.keys(a.attrs)) {
    if (IGNORE_ATTRS.has(k)) continue;
    if (a.attrs[k] !== b.attrs[k]) {
      out.push({ path: `${path}/${a.tag}`, msg: `attr ${k}="${a.attrs[k]}" != "${b.attrs[k] ?? ''}"` });
    }
  }
  for (const k of Object.keys(b.attrs)) {
    if (IGNORE_ATTRS.has(k) || k in a.attrs) continue;
    out.push({ path: `${path}/${a.tag}`, msg: `attr ${k} only on rhs` });
  }
  const n = Math.max(a.children.length, b.children.length);
  for (let i = 0; i < n; i++) {
    const ac = a.children[i];
    const bc = b.children[i];
    if (!ac) { out.push({ path, msg: `child[${i}] only on rhs (${bc!.tag})` }); continue; }
    if (!bc) { out.push({ path, msg: `child[${i}] only on lhs (${ac.tag})` }); continue; }
    diff(ac, bc, `${path}/${a.tag}[${i}]`, out);
  }
}

interface Row {
  entry: Entry;
  kernMathml: string;
  typstMathml: string | null;
  status: 'pass' | 'warn' | 'fail' | 'kern-only' | 'error';
  diffs: DiffMsg[];
  error?: string;
}

function checkOne(entry: Entry, oracleAvailable: boolean): Row {
  let kernMathml = '';
  try {
    kernMathml = renderToString(entry.src, {
      output: 'mathml', displayMode: entry.display,
    });
  } catch (e) {
    return {
      entry, kernMathml: '', typstMathml: null,
      status: 'error', diffs: [], error: (e as Error).message,
    };
  }
  if (!oracleAvailable) {
    return { entry, kernMathml, typstMathml: null, status: 'kern-only', diffs: [] };
  }
  const typstMathml = runTypst(entry);
  if (typstMathml === null) {
    return { entry, kernMathml, typstMathml: null, status: 'kern-only', diffs: [] };
  }
  const diffs: DiffMsg[] = [];
  try {
    const a = parseMathml(kernMathml);
    const b = parseMathml(typstMathml);
    diff(a, b, '', diffs);
  } catch (e) {
    return {
      entry, kernMathml, typstMathml,
      status: 'error', diffs: [], error: (e as Error).message,
    };
  }
  const status: Row['status'] = diffs.length === 0 ? 'pass' : diffs.length < 4 ? 'warn' : 'fail';
  return { entry, kernMathml, typstMathml, status, diffs };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderReport(rows: Row[], oracleAvailable: boolean): string {
  const counts = { pass: 0, warn: 0, fail: 0, 'kern-only': 0, error: 0 };
  for (const r of rows) counts[r.status]++;
  const tbody = rows.map(r => {
    const diffsHtml = r.diffs.length
      ? `<ul>${r.diffs.slice(0, 8).map(d => `<li><code>${escapeHtml(d.path)}</code> ${escapeHtml(d.msg)}</li>`).join('')}</ul>`
      : r.error ? `<pre class="err">${escapeHtml(r.error)}</pre>` : '';
    return `<tr class="row ${r.status}">
  <td class="src"><code>${escapeHtml(r.entry.src)}${r.entry.display ? ' <span class="badge">display</span>' : ''}</code></td>
  <td class="rendered">${r.kernMathml}</td>
  <td class="status ${r.status}">${r.status}</td>
  <td class="kern-mathml"><pre>${escapeHtml(r.kernMathml)}</pre></td>
  <td class="typst-mathml">${r.typstMathml === null ? '<em>oracle unavailable</em>' : `<pre>${escapeHtml(r.typstMathml)}</pre>`}</td>
  <td class="notes">${diffsHtml}</td>
</tr>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>kern parity report</title>
  <style>
    body { font: 13px/1.5 system-ui, sans-serif; margin: 24px; color: #1a1a1a; }
    h1 { margin: 0 0 8px; }
    .summary { margin-bottom: 16px; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: 600; margin-right: 6px; }
    .pill.pass { background: #d6f5d6; color: #14532d; }
    .pill.warn { background: #fff3cd; color: #714900; }
    .pill.fail { background: #fdd; color: #8a1f1f; }
    .pill.kern-only { background: #e6e6e6; color: #555; }
    .pill.error { background: #fdd; color: #8a1f1f; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; word-break: break-word; }
    th { background: #f7f7f7; text-align: left; }
    td.status { font-weight: 700; }
    td.status.pass { color: #14532d; }
    td.status.warn { color: #714900; }
    td.status.fail, td.status.error { color: #8a1f1f; }
    td.status.kern-only { color: #555; }
    pre { margin: 0; font: 11px/1.4 ui-monospace, monospace; white-space: pre-wrap; }
    .badge { font-size: 10px; background: #ddd; padding: 1px 4px; border-radius: 3px; }
    .rendered { font-size: 16px; }
    code { font: 12px ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>kern parity report</h1>
  <p class="summary">
    <span class="pill pass">${counts.pass} pass</span>
    <span class="pill warn">${counts.warn} warn</span>
    <span class="pill fail">${counts.fail} fail</span>
    <span class="pill kern-only">${counts['kern-only']} kern-only</span>
    <span class="pill error">${counts.error} error</span>
    &nbsp;&nbsp;${oracleAvailable ? 'Typst MathML oracle: <strong>available</strong>' : 'Typst MathML oracle: <strong>unavailable</strong> (Typst 0.14.2 has not yet exposed equation HTML export; see <code>crates/typst-html/src/mathml.rs</code>).'}
  </p>
  <table>
    <thead>
      <tr>
        <th style="width: 16%">Source</th>
        <th style="width: 16%">Kern render</th>
        <th style="width: 8%">Status</th>
        <th style="width: 24%">Kern MathML</th>
        <th style="width: 24%">Typst MathML</th>
        <th style="width: 12%">Diffs</th>
      </tr>
    </thead>
    <tbody>
${tbody}
    </tbody>
  </table>
</body>
</html>
`;
}

function main(): void {
  const entries = readCorpus();
  const oracleAvailable = hasTypstMathml();
  const rows = entries.map(e => checkOne(e, oracleAvailable));

  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, renderReport(rows, oracleAvailable), 'utf8');

  const counts = { pass: 0, warn: 0, fail: 0, 'kern-only': 0, error: 0 };
  for (const r of rows) counts[r.status]++;
  // eslint-disable-next-line no-console
  console.log(
    `parity: pass=${counts.pass} warn=${counts.warn} fail=${counts.fail} ` +
    `kern-only=${counts['kern-only']} error=${counts.error}`,
  );
  // eslint-disable-next-line no-console
  console.log(`wrote ${REPORT_PATH}`);

  if (counts.fail > 0 || counts.error > 0) process.exit(1);
}

main();
