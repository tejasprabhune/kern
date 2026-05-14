export function escapeHtml(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 38) out += '&amp;';
    else if (c === 60) out += '&lt;';
    else if (c === 62) out += '&gt;';
    else if (c === 34) out += '&quot;';
    else out += s[i];
  }
  return out;
}

export function escapeAttr(s: string): string {
  return escapeHtml(s);
}

// Maps a StyleKind to the MathML mathvariant attribute value.
// `bold` resolves to `bold-italic` because Typst's `bold(x)` is a *weight*
// switch that preserves the math italic of single-letter variables; using
// plain `bold` would render `bold(v)` as an upright bold v.
export function mathvariantForStyle(kind: string): string {
  switch (kind) {
    case 'cal': return 'script';
    case 'bb': return 'double-struck';
    case 'frak': return 'fraktur';
    case 'bold': return 'bold-italic';
    case 'italic': return 'italic';
    case 'upright': return 'normal';
    case 'sans': return 'sans-serif';
    case 'mono': return 'monospace';
    default: return 'normal';
  }
}

// Maps a SpacingKind to an MathML mspace width value.
export function mspaceWidth(kind: string): string {
  switch (kind) {
    case 'thin': return '0.1667em';
    case 'med': return '0.2222em';
    case 'thick': return '0.2778em';
    case 'quad': return '1em';
    case 'qquad': return '2em';
    case 'space': return '0.3333em';
    case 'zws': return '0em';
    default: return '0em';
  }
}
