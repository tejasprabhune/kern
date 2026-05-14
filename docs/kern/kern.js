class k extends Error {
  constructor(r, t, s) {
    super(r), this.name = "ParseError", this.position = t, this.source = s;
  }
}
var o = /* @__PURE__ */ ((e) => (e[e.Ident = 0] = "Ident", e[e.Number = 1] = "Number", e[e.Op = 2] = "Op", e[e.Slash = 3] = "Slash", e[e.LParen = 4] = "LParen", e[e.RParen = 5] = "RParen", e[e.LBracket = 6] = "LBracket", e[e.RBracket = 7] = "RBracket", e[e.LBrace = 8] = "LBrace", e[e.RBrace = 9] = "RBrace", e[e.Under = 10] = "Under", e[e.Caret = 11] = "Caret", e[e.Amp = 12] = "Amp", e[e.Semicolon = 13] = "Semicolon", e[e.Comma = 14] = "Comma", e[e.Colon = 15] = "Colon", e[e.Dot = 16] = "Dot", e[e.DotDot = 17] = "DotDot", e[e.Str = 18] = "Str", e[e.Prime = 19] = "Prime", e[e.Bang = 20] = "Bang", e[e.Escape = 21] = "Escape", e[e.Shorthand = 22] = "Shorthand", e[e.EOF = 23] = "EOF", e))(o || {});
function f(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function b(e) {
  return e >= 48 && e <= 57;
}
function w(e) {
  return f(e) || b(e);
}
function H(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
const I = /* @__PURE__ */ new Set([
  "+",
  "-",
  "=",
  "<",
  ">",
  "~",
  "±",
  "∓",
  "×",
  "÷",
  "·",
  "∧",
  "∨",
  "⊕",
  "⊗",
  "≤",
  "≥",
  "≠",
  "≈",
  "≡",
  "∈",
  "∉",
  "∼",
  "≃",
  "≅",
  "⊂",
  "⊃",
  "⊆",
  "⊇",
  "←",
  "→",
  "↔",
  "⇐",
  "⇒",
  "⇔",
  "⟵",
  "⟶",
  "⟷",
  "⟸",
  "⟹",
  "⟺",
  "↦"
]);
function _(e) {
  return I.has(e);
}
const D = [
  ["<==>", "⟺"],
  ["<-->", "⟷"],
  ["-->", "⟶"],
  ["==>", "⟹"],
  ["<==", "⟸"],
  ["<->", "↔"],
  ["<=>", "⇔"],
  ["->>", "↠"],
  ["|->", "↦"],
  ["::=", "⩴"],
  ["->", "→"],
  ["=>", "⇒"],
  ["<-", "←"],
  ["<=", "≤"],
  [">=", "≥"],
  ["!=", "≠"],
  [":=", "≔"],
  ["~~", "≈"],
  ["~=", "≅"],
  [">>", "≫"],
  ["<<", "≪"],
  ["||", "‖"],
  ["...", "…"]
];
function z(e, r) {
  for (const [t, s] of D)
    if (e.startsWith(t, r)) return [t, s];
  return null;
}
function F(e) {
  const r = [];
  let t = 0;
  const s = e.length;
  for (; t < s; ) {
    const n = t, a = e.charCodeAt(t);
    if (H(a)) {
      t++;
      continue;
    }
    if (f(a)) {
      for (; t < s && w(e.charCodeAt(t)); ) t++;
      r.push({ kind: 0, text: e.slice(n, t), pos: n });
      continue;
    }
    if (b(a)) {
      for (; t < s && b(e.charCodeAt(t)); ) t++;
      if (t < s && e.charCodeAt(t) === 46 && t + 1 < s && b(e.charCodeAt(t + 1)))
        for (t++; t < s && b(e.charCodeAt(t)); ) t++;
      r.push({ kind: 1, text: e.slice(n, t), pos: n });
      continue;
    }
    if (a === 92) {
      if (t++, t >= s)
        throw new k("Unexpected end after backslash", n, e);
      const c = e.charCodeAt(t);
      if (f(c)) {
        const d = t;
        for (; t < s && w(e.charCodeAt(t)); ) t++;
        let h = e.slice(d, t);
        for (; t + 1 < s && e.charCodeAt(t) === 46 && f(e.charCodeAt(t + 1)); ) {
          t++;
          const g = t;
          for (; t < s && w(e.charCodeAt(t)); ) t++;
          h = h + "." + e.slice(g, t);
        }
        r.push({ kind: 21, text: h, pos: n });
      } else {
        const d = e[t];
        t++, r.push({ kind: 21, text: d, pos: n });
      }
      continue;
    }
    const l = z(e, t);
    if (l !== null) {
      const [c, d] = l;
      r.push({ kind: 22, text: d, pos: n }), t += c.length;
      continue;
    }
    switch (a) {
      case 34: {
        for (t++; t < s && e.charCodeAt(t) !== 34; )
          e.charCodeAt(t) === 92 && t++, t++;
        if (t >= s) throw new k("Unterminated string literal", n, e);
        t++, r.push({ kind: 18, text: e.slice(n + 1, t - 1), pos: n });
        break;
      }
      case 40:
        r.push({ kind: 4, text: "(", pos: n }), t++;
        break;
      case 41:
        r.push({ kind: 5, text: ")", pos: n }), t++;
        break;
      case 91:
        r.push({ kind: 6, text: "[", pos: n }), t++;
        break;
      case 93:
        r.push({ kind: 7, text: "]", pos: n }), t++;
        break;
      case 123:
        r.push({ kind: 8, text: "{", pos: n }), t++;
        break;
      case 125:
        r.push({ kind: 9, text: "}", pos: n }), t++;
        break;
      case 95:
        r.push({ kind: 10, text: "_", pos: n }), t++;
        break;
      case 94:
        r.push({ kind: 11, text: "^", pos: n }), t++;
        break;
      case 38:
        r.push({ kind: 12, text: "&", pos: n }), t++;
        break;
      case 59:
        r.push({ kind: 13, text: ";", pos: n }), t++;
        break;
      case 44:
        r.push({ kind: 14, text: ",", pos: n }), t++;
        break;
      case 58:
        r.push({ kind: 15, text: ":", pos: n }), t++;
        break;
      case 46: {
        t + 1 < s && e.charCodeAt(t + 1) === 46 ? (r.push({ kind: 17, text: "..", pos: n }), t += 2) : (r.push({ kind: 16, text: ".", pos: n }), t++);
        break;
      }
      case 39:
        r.push({ kind: 19, text: "'", pos: n }), t++;
        break;
      case 33:
        r.push({ kind: 20, text: "!", pos: n }), t++;
        break;
      case 47:
        r.push({ kind: 3, text: "/", pos: n }), t++;
        break;
      default: {
        const c = e[t];
        t++, r.push({ kind: 2, text: c, pos: n });
        break;
      }
    }
  }
  return r.push({ kind: 23, text: "", pos: s }), r;
}
function m(e) {
  return e.length === 0 ? { type: "seq", nodes: [] } : e.length === 1 ? e[0] : { type: "seq", nodes: e };
}
const U = {
  AA: "𝔸",
  acute: "´",
  "acute.double": "˝",
  afghani: "؋",
  aleph: "א",
  alpha: "α",
  Alpha: "Α",
  amp: "&",
  "amp.inv": "⅋",
  and: "∧",
  "and.big": "⋀",
  "and.curly": "⋏",
  "and.dot": "⟑",
  "and.double": "⩓",
  angle: "∠",
  "angle.acute": "⦟",
  "angle.arc": "∡",
  "angle.arc.rev": "⦛",
  "angle.azimuth": "⍼",
  "angle.obtuse": "⦦",
  "angle.rev": "⦣",
  "angle.right": "∟",
  "angle.right.arc": "⊾",
  "angle.right.dot": "⦝",
  "angle.right.rev": "⯾",
  "angle.right.square": "⦜",
  "angle.s": "⦞",
  "angle.spatial": "⟀",
  "angle.spheric": "∢",
  "angle.spheric.rev": "⦠",
  "angle.spheric.t": "⦡",
  angstrom: "Å",
  angzarr: "⍼",
  approx: "≈",
  "approx.eq": "≊",
  "approx.not": "≉",
  "arrow.b": "↓",
  "arrow.b.bar": "↧",
  "arrow.b.curve": "⤵",
  "arrow.b.dashed": "⇣",
  "arrow.b.double": "⇓",
  "arrow.b.dstruck": "⇟",
  "arrow.b.filled": "⬇",
  "arrow.b.quad": "⟱",
  "arrow.b.stop": "⤓",
  "arrow.b.stroked": "⇩",
  "arrow.b.struck": "⤈",
  "arrow.b.triple": "⤋",
  "arrow.b.turn": "⮏",
  "arrow.b.twohead": "↡",
  "arrow.bl": "↙",
  "arrow.bl.double": "⇙",
  "arrow.bl.filled": "⬋",
  "arrow.bl.hook": "⤦",
  "arrow.bl.stroked": "⬃",
  "arrow.br": "↘",
  "arrow.br.double": "⇘",
  "arrow.br.filled": "⬊",
  "arrow.br.hook": "⤥",
  "arrow.br.stroked": "⬂",
  "arrow.ccw": "↺",
  "arrow.ccw.half": "↶",
  "arrow.cw": "↻",
  "arrow.cw.half": "↷",
  "arrow.l": "←",
  "arrow.l.bar": "↤",
  "arrow.l.curve": "⤶",
  "arrow.l.dashed": "⇠",
  "arrow.l.dotted": "⬸",
  "arrow.l.double": "⇐",
  "arrow.l.double.bar": "⤆",
  "arrow.l.double.long": "⟸",
  "arrow.l.double.long.bar": "⟽",
  "arrow.l.double.not": "⇍",
  "arrow.l.double.struck": "⤂",
  "arrow.l.dstruck": "⇺",
  "arrow.l.filled": "⬅",
  "arrow.l.hook": "↩",
  "arrow.l.long": "⟵",
  "arrow.l.long.bar": "⟻",
  "arrow.l.long.squiggly": "⬳",
  "arrow.l.loop": "↫",
  "arrow.l.not": "↚",
  "arrow.l.open": "⇽",
  "arrow.l.quad": "⭅",
  "arrow.l.r": "↔",
  "arrow.l.r.double": "⇔",
  "arrow.l.r.double.long": "⟺",
  "arrow.l.r.double.not": "⇎",
  "arrow.l.r.double.struck": "⤄",
  "arrow.l.r.dstruck": "⇼",
  "arrow.l.r.filled": "⬌",
  "arrow.l.r.long": "⟷",
  "arrow.l.r.not": "↮",
  "arrow.l.r.open": "⇿",
  "arrow.l.r.stroked": "⬄",
  "arrow.l.r.struck": "⇹",
  "arrow.l.r.wave": "↭",
  "arrow.l.squiggly": "⇜",
  "arrow.l.stop": "⇤",
  "arrow.l.stroked": "⇦",
  "arrow.l.struck": "⇷",
  "arrow.l.tail": "↢",
  "arrow.l.tail.dstruck": "⬺",
  "arrow.l.tail.struck": "⬹",
  "arrow.l.tilde": "⭉",
  "arrow.l.triple": "⇚",
  "arrow.l.turn": "⮌",
  "arrow.l.twohead": "↞",
  "arrow.l.twohead.bar": "⬶",
  "arrow.l.twohead.dstruck": "⬵",
  "arrow.l.twohead.struck": "⬴",
  "arrow.l.twohead.tail": "⬻",
  "arrow.l.twohead.tail.dstruck": "⬽",
  "arrow.l.twohead.tail.struck": "⬼",
  "arrow.l.wave": "↜",
  "arrow.r": "→",
  "arrow.r.bar": "↦",
  "arrow.r.curve": "⤷",
  "arrow.r.dashed": "⇢",
  "arrow.r.dotted": "⤑",
  "arrow.r.double": "⇒",
  "arrow.r.double.bar": "⤇",
  "arrow.r.double.long": "⟹",
  "arrow.r.double.long.bar": "⟾",
  "arrow.r.double.not": "⇏",
  "arrow.r.double.struck": "⤃",
  "arrow.r.dstruck": "⇻",
  "arrow.r.filled": "➡",
  "arrow.r.hook": "↪",
  "arrow.r.long": "⟶",
  "arrow.r.long.bar": "⟼",
  "arrow.r.long.squiggly": "⟿",
  "arrow.r.loop": "↬",
  "arrow.r.not": "↛",
  "arrow.r.open": "⇾",
  "arrow.r.quad": "⭆",
  "arrow.r.squiggly": "⇝",
  "arrow.r.stop": "⇥",
  "arrow.r.stroked": "⇨",
  "arrow.r.struck": "⇸",
  "arrow.r.tail": "↣",
  "arrow.r.tail.dstruck": "⤕",
  "arrow.r.tail.struck": "⤔",
  "arrow.r.tilde": "⥲",
  "arrow.r.triple": "⇛",
  "arrow.r.turn": "⮎",
  "arrow.r.twohead": "↠",
  "arrow.r.twohead.bar": "⤅",
  "arrow.r.twohead.dstruck": "⤁",
  "arrow.r.twohead.struck": "⤀",
  "arrow.r.twohead.tail": "⤖",
  "arrow.r.twohead.tail.dstruck": "⤘",
  "arrow.r.twohead.tail.struck": "⤗",
  "arrow.r.wave": "↝",
  "arrow.t": "↑",
  "arrow.t.b": "↕",
  "arrow.t.b.double": "⇕",
  "arrow.t.b.filled": "⬍",
  "arrow.t.b.stroked": "⇳",
  "arrow.t.bar": "↥",
  "arrow.t.curve": "⤴",
  "arrow.t.dashed": "⇡",
  "arrow.t.double": "⇑",
  "arrow.t.dstruck": "⇞",
  "arrow.t.filled": "⬆",
  "arrow.t.quad": "⟰",
  "arrow.t.stop": "⤒",
  "arrow.t.stroked": "⇧",
  "arrow.t.struck": "⤉",
  "arrow.t.triple": "⤊",
  "arrow.t.turn": "⮍",
  "arrow.t.twohead": "↟",
  "arrow.tl": "↖",
  "arrow.tl.br": "⤡",
  "arrow.tl.double": "⇖",
  "arrow.tl.filled": "⬉",
  "arrow.tl.hook": "⤣",
  "arrow.tl.stroked": "⬁",
  "arrow.tr": "↗",
  "arrow.tr.bl": "⤢",
  "arrow.tr.double": "⇗",
  "arrow.tr.filled": "⬈",
  "arrow.tr.hook": "⤤",
  "arrow.tr.stroked": "⬀",
  "arrow.zigzag": "↯",
  "arrowhead.b": "⌄",
  "arrowhead.t": "⌃",
  "arrows.bb": "⇊",
  "arrows.bt": "⇵",
  "arrows.ll": "⇇",
  "arrows.lll": "⬱",
  "arrows.lr": "⇆",
  "arrows.lr.stop": "↹",
  "arrows.rl": "⇄",
  "arrows.rr": "⇉",
  "arrows.rrr": "⇶",
  "arrows.tb": "⇅",
  "arrows.tt": "⇈",
  "ast.basic": "*",
  "ast.double": "⁑",
  "ast.low": "⁎",
  "ast.op": "∗",
  "ast.op.o": "⊛",
  "ast.square": "⧆",
  "ast.triple": "⁂",
  asymp: "≍",
  "asymp.not": "≭",
  at: "@",
  backslash: "\\",
  "backslash.not": "⧷",
  "backslash.o": "⦸",
  "bag.l": "⟅",
  "bag.r": "⟆",
  baht: "฿",
  ballot: "☐",
  "ballot.check": "☑",
  "ballot.check.heavy": "🗹",
  "ballot.cross": "☒",
  "bar.h": "―",
  "bar.v": "|",
  "bar.v.broken": "¦",
  "bar.v.double": "‖",
  "bar.v.o": "⦶",
  "bar.v.triple": "⦀",
  BB: "𝔹",
  because: "∵",
  beta: "β",
  Beta: "Β",
  "beta.alt": "ϐ",
  beth: "ב",
  bitcoin: "₿",
  bot: "⊥",
  "bowtie.filled": "⧓",
  "bowtie.filled.l": "⧑",
  "bowtie.filled.r": "⧒",
  "bowtie.stroked": "⋈",
  "bowtie.stroked.big": "⨝",
  "bowtie.stroked.big.l": "⟕",
  "bowtie.stroked.big.l.r": "⟗",
  "bowtie.stroked.big.r": "⟖",
  "brace.b": "⏟",
  "brace.l": "{",
  "brace.l.stroked": "⦃",
  "brace.r": "}",
  "brace.r.stroked": "⦄",
  "brace.t": "⏞",
  "bracket.b": "⎵",
  "bracket.l": "[",
  "bracket.l.stroked": "⟦",
  "bracket.l.tick.b": "⦏",
  "bracket.l.tick.t": "⦍",
  "bracket.r": "]",
  "bracket.r.stroked": "⟧",
  "bracket.r.tick.b": "⦎",
  "bracket.r.tick.t": "⦐",
  "bracket.t": "⎴",
  breve: "˘",
  bullet: "•",
  "bullet.hole": "◘",
  "bullet.hyph": "⁃",
  "bullet.l": "⁌",
  "bullet.o": "⦿",
  "bullet.op": "∙",
  "bullet.r": "⁍",
  "bullet.stroked": "◦",
  "bullet.stroked.o": "⦾",
  "bullet.tri": "‣",
  caret: "‸",
  caron: "ˇ",
  cc: "🅭",
  CC: "ℂ",
  "cc.by": "🅯",
  "cc.nc": "🄏",
  "cc.nd": "⊜",
  "cc.public": "🅮",
  "cc.sa": "🄎",
  "cc.zero": "🄍",
  cedi: "₵",
  "ceil.l": "⌈",
  "ceil.r": "⌉",
  cent: "¢",
  checkmark: "✓",
  "checkmark.heavy": "✔",
  "checkmark.light": "🗸",
  "chevron.l": "⟨",
  "chevron.l.closed": "⦉",
  "chevron.l.curly": "⧼",
  "chevron.l.dot": "⦑",
  "chevron.l.double": "⟪",
  "chevron.r": "⟩",
  "chevron.r.closed": "⦊",
  "chevron.r.curly": "⧽",
  "chevron.r.dot": "⦒",
  "chevron.r.double": "⟫",
  chi: "χ",
  Chi: "Χ",
  "circle.dotted": "◌",
  "circle.filled": "●",
  "circle.filled.big": "⬤",
  "circle.filled.small": "∙",
  "circle.filled.tiny": "⦁",
  "circle.stroked": "○",
  "circle.stroked.big": "◯",
  "circle.stroked.small": "⚬",
  "circle.stroked.tiny": "∘",
  co: "℅",
  colon: ":",
  "colon.currency": "₡",
  "colon.double": "∷",
  "colon.double.eq": "⩴",
  "colon.eq": "≔",
  "colon.tri": "⁝",
  "colon.tri.op": "⫶",
  comma: ",",
  "comma.inv": "⸲",
  "comma.rev": "⹁",
  complement: "∁",
  compose: "∘",
  "compose.o": "⊚",
  convolve: "∗",
  "convolve.o": "⊛",
  copyleft: "🄯",
  copyright: "©",
  "copyright.sound": "℗",
  "corner.l.b": "⌞",
  "corner.l.t": "⌜",
  "corner.r.b": "⌟",
  "corner.r.t": "⌝",
  crossmark: "✗",
  "crossmark.heavy": "✘",
  currency: "¤",
  dagger: "†",
  "dagger.double": "‡",
  "dagger.inv": "⸸",
  "dagger.l": "⸶",
  "dagger.r": "⸷",
  "dagger.triple": "⹋",
  daleth: "ד",
  "dash.colon": "∹",
  "dash.em": "—",
  "dash.em.three": "⸻",
  "dash.em.two": "⸺",
  "dash.en": "–",
  "dash.fig": "‒",
  "dash.o": "⊝",
  "dash.wave": "〜",
  "dash.wave.double": "〰",
  DD: "𝔻",
  degree: "°",
  delta: "δ",
  Delta: "Δ",
  diaer: "¨",
  diameter: "⌀",
  "diamond.filled": "◆",
  "diamond.filled.medium": "⬥",
  "diamond.filled.small": "⬩",
  "diamond.stroked": "◇",
  "diamond.stroked.dot": "⟐",
  "diamond.stroked.medium": "⬦",
  "diamond.stroked.small": "⋄",
  "die.five": "⚄",
  "die.four": "⚃",
  "die.one": "⚀",
  "die.six": "⚅",
  "die.three": "⚂",
  "die.two": "⚁",
  digamma: "ϝ",
  Digamma: "Ϝ",
  div: "÷",
  "div.o": "⨸",
  "div.slanted.o": "⦼",
  divides: "∣",
  "divides.not": "∤",
  "divides.not.rev": "⫮",
  "divides.struck": "⟊",
  dollar: "$",
  dong: "₫",
  dorome: "߾",
  "dot.basic": ".",
  "dot.c": "·",
  "dot.double": "¨",
  "dot.o": "⊙",
  "dot.o.big": "⨀",
  "dot.op": "⋅",
  "dot.quad": "⃜",
  "dot.square": "⊡",
  "dot.triple": "⃛",
  "dotless.i": "ı",
  "dotless.j": "ȷ",
  "dots.down": "⋱",
  "dots.h": "…",
  "dots.h.c": "⋯",
  "dots.up": "⋰",
  "dots.v": "⋮",
  dram: "֏",
  earth: "🜨",
  "earth.alt": "♁",
  EE: "𝔼",
  ell: "ℓ",
  "ellipse.filled.h": "⬬",
  "ellipse.filled.v": "⬮",
  "ellipse.stroked.h": "⬭",
  "ellipse.stroked.v": "⬯",
  emptyset: "∅",
  "emptyset.arrow.l": "⦴",
  "emptyset.arrow.r": "⦳",
  "emptyset.bar": "⦱",
  "emptyset.circle": "⦲",
  "emptyset.rev": "⦰",
  "emptyset.zero": "∅",
  epsilon: "ε",
  Epsilon: "Ε",
  "epsilon.alt": "ϵ",
  "epsilon.alt.rev": "϶",
  eq: "=",
  "eq.colon": "≕",
  "eq.def": "≝",
  "eq.delta": "≜",
  "eq.dots": "≑",
  "eq.dots.down": "≒",
  "eq.dots.up": "≓",
  "eq.equi": "≚",
  "eq.est": "≙",
  "eq.gt": "⋝",
  "eq.lt": "⋜",
  "eq.m": "≞",
  "eq.not": "≠",
  "eq.o": "⊜",
  "eq.prec": "⋞",
  "eq.quad": "≣",
  "eq.quest": "≟",
  "eq.star": "≛",
  "eq.succ": "⋟",
  "eq.triple": "≡",
  "eq.triple.not": "≢",
  equiv: "≡",
  "equiv.not": "≢",
  "errorbar.circle.filled": "⧳",
  "errorbar.circle.stroked": "⧲",
  "errorbar.diamond.filled": "⧱",
  "errorbar.diamond.stroked": "⧰",
  "errorbar.square.filled": "⧯",
  "errorbar.square.stroked": "⧮",
  eta: "η",
  Eta: "Η",
  euro: "€",
  excl: "!",
  "excl.double": "‼",
  "excl.inv": "¡",
  "excl.quest": "⁉",
  exists: "∃",
  "exists.not": "∄",
  "fence.dotted": "⦙",
  "fence.l": "⧘",
  "fence.l.double": "⧚",
  "fence.r": "⧙",
  "fence.r.double": "⧛",
  FF: "𝔽",
  flat: "♭",
  "flat.b": "𝄭",
  "flat.double": "𝄫",
  "flat.quarter": "𝄳",
  "flat.t": "𝄬",
  "floor.l": "⌊",
  "floor.r": "⌋",
  floral: "❦",
  "floral.l": "☙",
  "floral.r": "❧",
  forall: "∀",
  forces: "⊩",
  "forces.not": "⊮",
  frown: "⌢",
  gamma: "γ",
  Gamma: "Γ",
  gender: "{",
  "gender.double": "⚣",
  "gender.female": "⚤",
  "gender.male": "⚤",
  "gender.stroke": "⚦",
  "gender.stroke.r": "⚩",
  "gender.stroke.t": "⚨",
  genderfemale: "♀",
  genderintersex: "⚥",
  gendermale: "♂",
  genderneuter: "⚲",
  gendertrans: "⚧",
  GG: "𝔾",
  gimel: "ג",
  gradient: "∇",
  grave: "`",
  gt: ">",
  "gt.approx": "⪆",
  "gt.arc": "⪧",
  "gt.arc.eq": "⪩",
  "gt.closed": "⊳",
  "gt.closed.eq": "⊵",
  "gt.closed.eq.not": "⋭",
  "gt.closed.not": "⋫",
  "gt.dot": "⋗",
  "gt.double": "≫",
  "gt.double.nested": "⪢",
  "gt.eq": "≥",
  "gt.eq.lt": "⋛",
  "gt.eq.not": "≱",
  "gt.eq.slant": "⩾",
  "gt.equiv": "≧",
  "gt.lt": "≷",
  "gt.lt.not": "≹",
  "gt.napprox": "⪊",
  "gt.neq": "⪈",
  "gt.nequiv": "≩",
  "gt.not": "≯",
  "gt.ntilde": "⋧",
  "gt.o": "⧁",
  "gt.tilde": "≳",
  "gt.tilde.not": "≵",
  "gt.tri": "⊳",
  "gt.tri.eq": "⊵",
  "gt.tri.eq.not": "⋭",
  "gt.tri.not": "⋫",
  "gt.triple": "⋙",
  "gt.triple.nested": "⫸",
  guarani: "₲",
  "harpoon.bl": "⇃",
  "harpoon.bl.bar": "⥡",
  "harpoon.bl.stop": "⥙",
  "harpoon.br": "⇂",
  "harpoon.br.bar": "⥝",
  "harpoon.br.stop": "⥕",
  "harpoon.lb": "↽",
  "harpoon.lb.bar": "⥞",
  "harpoon.lb.rb": "⥐",
  "harpoon.lb.rt": "⥋",
  "harpoon.lb.stop": "⥖",
  "harpoon.lt": "↼",
  "harpoon.lt.bar": "⥚",
  "harpoon.lt.rb": "⥊",
  "harpoon.lt.rt": "⥎",
  "harpoon.lt.stop": "⥒",
  "harpoon.rb": "⇁",
  "harpoon.rb.bar": "⥟",
  "harpoon.rb.stop": "⥗",
  "harpoon.rt": "⇀",
  "harpoon.rt.bar": "⥛",
  "harpoon.rt.stop": "⥓",
  "harpoon.tl": "↿",
  "harpoon.tl.bar": "⥠",
  "harpoon.tl.bl": "⥑",
  "harpoon.tl.br": "⥍",
  "harpoon.tl.stop": "⥘",
  "harpoon.tr": "↾",
  "harpoon.tr.bar": "⥜",
  "harpoon.tr.bl": "⥌",
  "harpoon.tr.br": "⥏",
  "harpoon.tr.stop": "⥔",
  "harpoons.blbr": "⥥",
  "harpoons.bltr": "⥯",
  "harpoons.lbrb": "⥧",
  "harpoons.ltlb": "⥢",
  "harpoons.ltrb": "⇋",
  "harpoons.ltrt": "⥦",
  "harpoons.rblb": "⥩",
  "harpoons.rtlb": "⇌",
  "harpoons.rtlt": "⥨",
  "harpoons.rtrb": "⥤",
  "harpoons.tlbr": "⥮",
  "harpoons.tltr": "⥣",
  hash: "#",
  hat: "^",
  hbar: "ℏ",
  "hexa.filled": "⬢",
  "hexa.stroked": "⬡",
  HH: "ℍ",
  "hourglass.filled": "⧗",
  "hourglass.stroked": "⧖",
  hryvnia: "₴",
  hyph: "‐",
  "hyph.minus": "-",
  "hyph.nobreak": "‑",
  "hyph.point": "‧",
  "hyph.soft": "­",
  II: "𝕀",
  Im: "ℑ",
  image: "⊷",
  in: "∈",
  "in.not": "∉",
  "in.rev": "∋",
  "in.rev.not": "∌",
  "in.rev.small": "∍",
  "in.small": "∊",
  infinity: "∞",
  "infinity.bar": "⧞",
  "infinity.incomplete": "⧜",
  "infinity.tie": "⧝",
  infty: "∞",
  integral: "∫",
  "integral.arrow.hook": "⨗",
  "integral.ccw": "⨑",
  "integral.cont": "∮",
  "integral.cont.ccw": "∳",
  "integral.cont.cw": "∲",
  "integral.cw": "∱",
  "integral.dash": "⨍",
  "integral.dash.double": "⨎",
  "integral.double": "∬",
  "integral.inter": "⨙",
  "integral.quad": "⨌",
  "integral.slash": "⨏",
  "integral.square": "⨖",
  "integral.surf": "∯",
  "integral.times": "⨘",
  "integral.triple": "∭",
  "integral.union": "⨚",
  "integral.vol": "∰",
  inter: "∩",
  "inter.and": "⩄",
  "inter.big": "⋂",
  "inter.dot": "⩀",
  "inter.double": "⋒",
  "inter.serif": "∩",
  "inter.sq": "⊓",
  "inter.sq.big": "⨅",
  "inter.sq.double": "⩎",
  "inter.sq.serif": "⊓",
  interleave: "⫴",
  "interleave.big": "⫼",
  "interleave.struck": "⫵",
  interrobang: "‽",
  "interrobang.inv": "⸘",
  iota: "ι",
  Iota: "Ι",
  "iota.inv": "℩",
  JJ: "𝕁",
  join: "⨝",
  "join.l": "⟕",
  "join.l.r": "⟗",
  "join.r": "⟖",
  jupiter: "♃",
  kappa: "κ",
  Kappa: "Κ",
  "kappa.alt": "ϰ",
  kip: "₭",
  KK: "𝕂",
  lambda: "λ",
  Lambda: "Λ",
  laplace: "∆",
  lari: "₾",
  lat: "⪫",
  "lat.eq": "⪭",
  lira: "₺",
  LL: "𝕃",
  "lozenge.filled": "⧫",
  "lozenge.filled.medium": "⬧",
  "lozenge.filled.small": "⬪",
  "lozenge.stroked": "◊",
  "lozenge.stroked.medium": "⬨",
  "lozenge.stroked.small": "⬫",
  lrm: "‎",
  lt: "<",
  "lt.approx": "⪅",
  "lt.arc": "⪦",
  "lt.arc.eq": "⪨",
  "lt.closed": "⊲",
  "lt.closed.eq": "⊴",
  "lt.closed.eq.not": "⋬",
  "lt.closed.not": "⋪",
  "lt.dot": "⋖",
  "lt.double": "≪",
  "lt.double.nested": "⪡",
  "lt.eq": "≤",
  "lt.eq.gt": "⋚",
  "lt.eq.not": "≰",
  "lt.eq.slant": "⩽",
  "lt.equiv": "≦",
  "lt.gt": "≶",
  "lt.gt.not": "≸",
  "lt.napprox": "⪉",
  "lt.neq": "⪇",
  "lt.nequiv": "≨",
  "lt.not": "≮",
  "lt.ntilde": "⋦",
  "lt.o": "⧀",
  "lt.tilde": "≲",
  "lt.tilde.not": "≴",
  "lt.tri": "⊲",
  "lt.tri.eq": "⊴",
  "lt.tri.eq.not": "⋬",
  "lt.tri.not": "⋪",
  "lt.triple": "⋘",
  "lt.triple.nested": "⫷",
  macron: "¯",
  maltese: "✠",
  manat: "₼",
  mapsto: "↦",
  "mapsto.long": "⟼",
  mars: "♂",
  med: "",
  mercury: "☿",
  minus: "−",
  "minus.dot": "∸",
  "minus.o": "⊖",
  "minus.plus": "∓",
  "minus.square": "⊟",
  "minus.tilde": "≂",
  "minus.triangle": "⨺",
  miny: "⧿",
  MM: "𝕄",
  models: "⊧",
  mu: "μ",
  Mu: "Μ",
  multimap: "⊸",
  "multimap.double": "⧟",
  "mustache.l": "⎰",
  "mustache.r": "⎱",
  nabla: "∇",
  naira: "₦",
  natural: "♮",
  "natural.b": "𝄯",
  "natural.t": "𝄮",
  neptune: "♆",
  "neptune.alt": "⯉",
  NN: "ℕ",
  not: "¬",
  "note.down": "🎝",
  "note.eighth": "𝅘𝅥𝅮",
  "note.eighth.alt": "♪",
  "note.eighth.beamed": "♫",
  "note.grace": "𝆕",
  "note.grace.slash": "𝆔",
  "note.half": "𝅗𝅥",
  "note.quarter": "𝅘𝅥",
  "note.quarter.alt": "♩",
  "note.sixteenth": "𝅘𝅥𝅯",
  "note.sixteenth.beamed": "♬",
  "note.up": "🎜",
  "note.whole": "𝅝",
  nothing: "∅",
  "nothing.arrow.l": "⦴",
  "nothing.arrow.r": "⦳",
  "nothing.bar": "⦱",
  "nothing.circle": "⦲",
  "nothing.rev": "⦰",
  "nothing.zero": "∅",
  nu: "ν",
  Nu: "Ν",
  numero: "№",
  omega: "ω",
  Omega: "Ω",
  "Omega.inv": "℧",
  omicron: "ο",
  Omicron: "Ο",
  oo: "∞",
  OO: "𝕆",
  or: "∨",
  "or.big": "⋁",
  "or.curly": "⋎",
  "or.dot": "⟇",
  "or.double": "⩔",
  original: "⊶",
  parallel: "∥",
  "parallel.eq": "⋕",
  "parallel.equiv": "⩨",
  "parallel.not": "∦",
  "parallel.o": "⦷",
  "parallel.slanted.eq": "⧣",
  "parallel.slanted.eq.tilde": "⧤",
  "parallel.slanted.equiv": "⧥",
  "parallel.struck": "⫲",
  "parallel.tilde": "⫳",
  "parallelogram.filled": "▰",
  "parallelogram.stroked": "▱",
  "paren.b": "⏝",
  "paren.l": "(",
  "paren.l.closed": "⦇",
  "paren.l.flat": "⟮",
  "paren.l.stroked": "⦅",
  "paren.r": ")",
  "paren.r.closed": "⦈",
  "paren.r.flat": "⟯",
  "paren.r.stroked": "⦆",
  "paren.t": "⏜",
  partial: "∂",
  pataca: "$",
  pee: "℘",
  "penta.filled": "⬟",
  "penta.stroked": "⬠",
  percent: "%",
  permille: "‰",
  permyriad: "‱",
  perp: "⟂",
  "perp.o": "⦹",
  peso: "$",
  "peso.philippine": "₱",
  phi: "φ",
  Phi: "Φ",
  "phi.alt": "ϕ",
  pi: "π",
  Pi: "Π",
  "pi.alt": "ϖ",
  pilcrow: "¶",
  "pilcrow.rev": "⁋",
  planck: "ħ",
  plus: "+",
  "plus.dot": "∔",
  "plus.double": "⧺",
  "plus.minus": "±",
  "plus.o": "⊕",
  "plus.o.arrow": "⟴",
  "plus.o.big": "⨁",
  "plus.o.l": "⨭",
  "plus.o.r": "⨮",
  "plus.square": "⊞",
  "plus.triangle": "⨹",
  "plus.triple": "⧻",
  pound: "£",
  "power.off": "⭘",
  "power.on": "⏽",
  "power.on.off": "⏼",
  "power.sleep": "⏾",
  "power.standby": "⏻",
  PP: "ℙ",
  prec: "≺",
  "prec.approx": "⪷",
  "prec.curly.eq": "≼",
  "prec.curly.eq.not": "⋠",
  "prec.double": "⪻",
  "prec.eq": "⪯",
  "prec.equiv": "⪳",
  "prec.napprox": "⪹",
  "prec.neq": "⪱",
  "prec.nequiv": "⪵",
  "prec.not": "⊀",
  "prec.ntilde": "⋨",
  "prec.tilde": "≾",
  prime: "′",
  "prime.double": "″",
  "prime.double.rev": "‶",
  "prime.quad": "⁗",
  "prime.rev": "‵",
  "prime.triple": "‴",
  "prime.triple.rev": "‷",
  product: "∏",
  "product.co": "∐",
  prop: "∝",
  psi: "ψ",
  Psi: "Ψ",
  qed: "∎",
  QQ: "ℚ",
  qquad: "",
  quad: "",
  quest: "?",
  "quest.double": "⁇",
  "quest.excl": "⁈",
  "quest.inv": "¿",
  "quote.chevron.l.double": "«",
  "quote.chevron.l.single": "‹",
  "quote.chevron.r.double": "»",
  "quote.chevron.r.single": "›",
  "quote.double": '"',
  "quote.high.double": "‟",
  "quote.high.single": "‛",
  "quote.l.double": "“",
  "quote.l.single": "‘",
  "quote.low.double": "„",
  "quote.low.single": "‚",
  "quote.r.double": "”",
  "quote.r.single": "’",
  "quote.single": "'",
  ratio: "∶",
  Re: "ℜ",
  "rect.filled.h": "▬",
  "rect.filled.v": "▮",
  "rect.stroked.h": "▭",
  "rect.stroked.v": "▯",
  refmark: "※",
  "rest.eighth": "𝄾",
  "rest.half": "𝄼",
  "rest.multiple": "𝄺",
  "rest.multiple.measure": "𝄩",
  "rest.quarter": "𝄽",
  "rest.sixteenth": "𝄿",
  "rest.whole": "𝄻",
  rho: "ρ",
  Rho: "Ρ",
  "rho.alt": "ϱ",
  riel: "៛",
  riyal: "⃁",
  rlm: "‏",
  RR: "ℝ",
  ruble: "₽",
  "rupee.generic": "₨",
  "rupee.indian": "₹",
  "rupee.tamil": "௹",
  "rupee.wancho": "𞋿",
  saturn: "♄",
  section: "§",
  semi: ";",
  "semi.inv": "⸵",
  "semi.rev": "⁏",
  sha: "ш",
  Sha: "Ш",
  sharp: "♯",
  "sharp.b": "𝄱",
  "sharp.double": "𝄪",
  "sharp.quarter": "𝄲",
  "sharp.t": "𝄰",
  shekel: "₪",
  "shell.b": "⏡",
  "shell.l": "❲",
  "shell.l.filled": "⦗",
  "shell.l.stroked": "⟬",
  "shell.r": "❳",
  "shell.r.filled": "⦘",
  "shell.r.stroked": "⟭",
  "shell.t": "⏠",
  sigma: "σ",
  Sigma: "Σ",
  "sigma.alt": "ς",
  slash: "/",
  "slash.big": "⧸",
  "slash.double": "⫽",
  "slash.o": "⊘",
  "slash.triple": "⫻",
  smash: "⨳",
  smile: "⌣",
  smt: "⪪",
  "smt.eq": "⪬",
  som: "⃀",
  space: " ",
  "space.en": " ",
  "space.fig": " ",
  "space.hair": " ",
  "space.med": " ",
  "space.nobreak": " ",
  "space.nobreak.narrow": " ",
  "space.punct": " ",
  "space.quad": " ",
  "space.quarter": " ",
  "space.sixth": " ",
  "space.thin": " ",
  "space.third": " ",
  "square.filled": "■",
  "square.filled.big": "⬛",
  "square.filled.medium": "◼",
  "square.filled.small": "◾",
  "square.filled.tiny": "▪",
  "square.stroked": "□",
  "square.stroked.big": "⬜",
  "square.stroked.dotted": "⬚",
  "square.stroked.medium": "◻",
  "square.stroked.rounded": "▢",
  "square.stroked.small": "◽",
  "square.stroked.tiny": "▫",
  SS: "𝕊",
  "star.filled": "★",
  "star.op": "⋆",
  "star.stroked": "☆",
  subset: "⊂",
  "subset.approx": "⫉",
  "subset.closed": "⫏",
  "subset.closed.eq": "⫑",
  "subset.dot": "⪽",
  "subset.double": "⋐",
  "subset.eq": "⊆",
  "subset.eq.dot": "⫃",
  "subset.eq.not": "⊈",
  "subset.eq.sq": "⊑",
  "subset.eq.sq.not": "⋢",
  "subset.equiv": "⫅",
  "subset.neq": "⊊",
  "subset.nequiv": "⫋",
  "subset.not": "⊄",
  "subset.plus": "⪿",
  "subset.sq": "⊏",
  "subset.sq.neq": "⋤",
  "subset.tilde": "⫇",
  "subset.times": "⫁",
  succ: "≻",
  "succ.approx": "⪸",
  "succ.curly.eq": "≽",
  "succ.curly.eq.not": "⋡",
  "succ.double": "⪼",
  "succ.eq": "⪰",
  "succ.equiv": "⪴",
  "succ.napprox": "⪺",
  "succ.neq": "⪲",
  "succ.nequiv": "⪶",
  "succ.not": "⊁",
  "succ.ntilde": "⋩",
  "succ.tilde": "≿",
  "suit.club.filled": "♣",
  "suit.club.stroked": "♧",
  "suit.diamond.filled": "♦",
  "suit.diamond.stroked": "♢",
  "suit.heart.filled": "♥",
  "suit.heart.stroked": "♡",
  "suit.spade.filled": "♠",
  "suit.spade.stroked": "♤",
  sum: "∑",
  "sum.integral": "⨋",
  sun: "☉",
  supset: "⊃",
  "supset.approx": "⫊",
  "supset.closed": "⫐",
  "supset.closed.eq": "⫒",
  "supset.dot": "⪾",
  "supset.double": "⋑",
  "supset.eq": "⊇",
  "supset.eq.dot": "⫄",
  "supset.eq.not": "⊉",
  "supset.eq.sq": "⊒",
  "supset.eq.sq.not": "⋣",
  "supset.equiv": "⫆",
  "supset.neq": "⊋",
  "supset.nequiv": "⫌",
  "supset.not": "⊅",
  "supset.plus": "⫀",
  "supset.sq": "⊐",
  "supset.sq.neq": "⋥",
  "supset.tilde": "⫈",
  "supset.times": "⫂",
  "tack.b": "⊤",
  "tack.b.big": "⟙",
  "tack.b.double": "⫪",
  "tack.b.short": "⫟",
  "tack.l": "⊣",
  "tack.l.double": "⫤",
  "tack.l.long": "⟞",
  "tack.l.r": "⟛",
  "tack.l.short": "⫞",
  "tack.r": "⊢",
  "tack.r.double": "⊨",
  "tack.r.double.not": "⊭",
  "tack.r.long": "⟝",
  "tack.r.not": "⊬",
  "tack.r.short": "⊦",
  "tack.t": "⊥",
  "tack.t.big": "⟘",
  "tack.t.double": "⫫",
  "tack.t.short": "⫠",
  taka: "৳",
  taman: "߿",
  tau: "τ",
  Tau: "Τ",
  tenge: "₸",
  therefore: "∴",
  theta: "θ",
  Theta: "Θ",
  "theta.alt": "ϑ",
  "Theta.alt": "ϴ",
  thick: "",
  thin: "",
  "tilde.basic": "~",
  "tilde.dot": "⩪",
  "tilde.eq": "≃",
  "tilde.eq.not": "≄",
  "tilde.eq.rev": "⋍",
  "tilde.equiv": "≅",
  "tilde.equiv.not": "≇",
  "tilde.nequiv": "≆",
  "tilde.not": "≁",
  "tilde.op": "∼",
  "tilde.rev": "∽",
  "tilde.rev.equiv": "≌",
  "tilde.triple": "≋",
  times: "×",
  "times.big": "⨉",
  "times.div": "⋇",
  "times.l": "⋉",
  "times.o": "⊗",
  "times.o.big": "⨂",
  "times.o.hat": "⨶",
  "times.o.l": "⨴",
  "times.o.r": "⨵",
  "times.r": "⋊",
  "times.square": "⊠",
  "times.three.l": "⋋",
  "times.three.r": "⋌",
  "times.triangle": "⨻",
  tiny: "⧾",
  togrog: "₮",
  top: "⊤",
  trademark: "™",
  "trademark.registered": "®",
  "trademark.service": "℠",
  "triangle.filled.b": "▼",
  "triangle.filled.bl": "◣",
  "triangle.filled.br": "◢",
  "triangle.filled.l": "◀",
  "triangle.filled.r": "▶",
  "triangle.filled.small.b": "▾",
  "triangle.filled.small.l": "◂",
  "triangle.filled.small.r": "▸",
  "triangle.filled.small.t": "▴",
  "triangle.filled.t": "▲",
  "triangle.filled.tl": "◤",
  "triangle.filled.tr": "◥",
  "triangle.stroked.b": "▽",
  "triangle.stroked.bl": "◺",
  "triangle.stroked.br": "◿",
  "triangle.stroked.dot": "◬",
  "triangle.stroked.l": "◁",
  "triangle.stroked.nested": "⟁",
  "triangle.stroked.r": "▷",
  "triangle.stroked.rounded": "🛆",
  "triangle.stroked.small.b": "▿",
  "triangle.stroked.small.l": "◃",
  "triangle.stroked.small.r": "▹",
  "triangle.stroked.small.t": "▵",
  "triangle.stroked.t": "△",
  "triangle.stroked.tl": "◸",
  "triangle.stroked.tr": "◹",
  TT: "𝕋",
  underscore: "_",
  union: "∪",
  "union.arrow": "⊌",
  "union.big": "⋃",
  "union.dot": "⊍",
  "union.dot.big": "⨃",
  "union.double": "⋓",
  "union.minus": "⩁",
  "union.or": "⩅",
  "union.plus": "⊎",
  "union.plus.big": "⨄",
  "union.serif": "∪",
  "union.sq": "⊔",
  "union.sq.big": "⨆",
  "union.sq.double": "⩏",
  "union.sq.serif": "⊔",
  upsilon: "υ",
  Upsilon: "Υ",
  uranus: "⛢",
  "uranus.alt": "♅",
  UU: "𝕌",
  venus: "♀",
  VV: "𝕍",
  without: "∖",
  wj: "⁠",
  won: "₩",
  wreath: "≀",
  WW: "𝕎",
  xi: "ξ",
  Xi: "Ξ",
  xor: "⊕",
  "xor.big": "⨁",
  XX: "𝕏",
  yen: "¥",
  yuan: "¥",
  YY: "𝕐",
  zeta: "ζ",
  Zeta: "Ζ",
  zwj: "‍",
  zwnj: "‌",
  zws: "​",
  ZZ: "ℤ"
}, P = /* @__PURE__ */ new Set(["thin", "med", "thick", "quad", "qquad", "space", "zws"]);
function j(e) {
  return P.has(e);
}
function G(e) {
  const r = U[e];
  if (r !== void 0)
    return r === "" && P.has(e), r;
}
const V = /* @__PURE__ */ new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "sinh",
  "cosh",
  "tanh",
  "coth",
  "sech",
  "csch",
  "arcsin",
  "arccos",
  "arctan",
  "log",
  "ln",
  "lg",
  "exp",
  "lim",
  "liminf",
  "limsup",
  "inf",
  "sup",
  "max",
  "min",
  "det",
  "gcd",
  "lcm",
  "mod",
  "arg",
  "deg",
  "dim",
  "hom",
  "id",
  "im",
  "ker",
  "tr",
  "Pr"
]), W = /* @__PURE__ */ new Set([
  "lim",
  "liminf",
  "limsup",
  "inf",
  "sup",
  "max",
  "min",
  "det",
  "gcd",
  "arg"
]);
function Y(e) {
  return V.has(e);
}
function x(e) {
  return W.has(e);
}
const Z = /* @__PURE__ */ new Set([
  "∑",
  "∏",
  "∐",
  "∫",
  "∬",
  "∭",
  "⨌",
  "∮",
  "∯",
  "∰",
  "∱",
  "∲",
  "∳",
  "⋃",
  "⋂",
  "⨆",
  "⨅",
  "⨀",
  "⨁",
  "⨂",
  "⨃",
  "⨄",
  "⨊",
  "⨋"
]), X = /* @__PURE__ */ new Set([
  "∫",
  "∬",
  "∭",
  "⨌",
  "∮",
  "∯",
  "∰",
  "∱",
  "∲",
  "∳"
]);
function O(e) {
  return Z.has(e);
}
function E(e) {
  return X.has(e);
}
const L = /* @__PURE__ */ new Set(["cal", "bb", "frak", "bold", "italic", "upright", "sans", "mono"]), N = /* @__PURE__ */ new Set(["vec", "mat", "cases", "bmat", "pmat", "vmat", "Vmat"]), B = /* @__PURE__ */ new Set([
  "hat",
  "tilde",
  "dot",
  "overline",
  "bar",
  "arrow",
  "breve",
  "grave",
  "acute",
  "macron",
  "caron",
  "circle",
  "dot.double",
  "dot.triple",
  "arrow.l",
  "arrow.l.r"
]), v = {
  overbrace: "overbrace",
  underbrace: "underbrace",
  overline: "overline.stretch",
  underline: "underline.stretch",
  overparen: "overparen",
  underparen: "underparen",
  overbracket: "overbracket",
  underbracket: "underbracket"
}, J = {
  cancel: "cancel",
  bcancel: "bcancel",
  xcancel: "xcancel"
}, Q = /* @__PURE__ */ new Set(["normal", "op", "bin", "rel", "open", "close", "punct"]), y = {
  display: "display",
  inline: "inline",
  script: "script",
  sscript: "sscript"
}, $ = {
  thin: "thin",
  med: "med",
  thick: "thick",
  quad: "quad",
  qquad: "qquad",
  space: "space",
  zws: "zws"
}, q = {
  abs: { kind: "abs", open: "|", close: "|" },
  norm: { kind: "norm", open: "‖", close: "‖" },
  floor: { kind: "floor", open: "⌊", close: "⌋" },
  ceil: { kind: "ceil", open: "⌈", close: "⌉" }
};
function T(e) {
  const r = F(e), t = new K(r, e), s = t.parseAlign();
  if (t.peek().kind !== o.EOF)
    throw new k(`Unexpected token '${t.peek().text}'`, t.peek().pos, e);
  return s;
}
class K {
  constructor(r, t) {
    this.tokens = r, this.src = t, this.pos = 0;
  }
  peek(r = 0) {
    const t = this.pos + r;
    return t < this.tokens.length ? this.tokens[t] : this.tokens[this.tokens.length - 1];
  }
  consume() {
    const r = this.tokens[this.pos];
    return r.kind !== o.EOF && this.pos++, r;
  }
  expect(r) {
    const t = this.peek();
    if (t.kind !== r)
      throw new k(
        `Expected ${o[r] ?? r} but got '${t.text}'`,
        t.pos,
        this.src
      );
    return this.consume();
  }
  // alignExpr := addExpr ('&' addExpr)*
  parseAlign() {
    const r = this.parseAdd();
    if (this.peek().kind !== o.Amp) return r;
    const t = [r];
    for (; this.peek().kind === o.Amp; )
      this.consume(), t.push({ type: "align" }), t.push(this.parseAdd());
    return { type: "seq", nodes: t };
  }
  // addExpr := fracExpr (ADDOP fracExpr)*
  parseAdd() {
    const r = [];
    for (r.push(...this.collectFrac()); (this.peek().kind === o.Op || this.peek().kind === o.Shorthand) && A(this.peek().text); ) {
      const t = this.consume();
      r.push({ type: "operator", text: t.text }), r.push(...this.collectFrac());
    }
    return m(r);
  }
  // Returns the flat nodes produced by one fracExpr (may be multiple from seq)
  collectFrac() {
    const r = this.parseSeq();
    if (this.peek().kind !== o.Slash)
      return r.type === "seq" ? r.nodes : [r];
    this.consume();
    const t = this.parseSeq();
    return [{ type: "frac", num: r, den: t }];
  }
  // seqExpr := attachExpr+ (atoms, not separated by addOps)
  parseSeq() {
    const r = [];
    for (; ; ) {
      const t = this.peek();
      if (t.kind === o.EOF || t.kind === o.RParen || t.kind === o.RBracket || t.kind === o.RBrace || t.kind === o.Amp || t.kind === o.Semicolon || t.kind === o.Comma || t.kind === o.Slash || r.length > 0 && (t.kind === o.Op || t.kind === o.Shorthand) && A(t.text)) break;
      const s = this.parseAttach();
      r.push(s);
    }
    if (r.length === 0)
      throw new k("Expected expression", this.peek().pos, this.src);
    return m(r);
  }
  // attachExpr := primeExpr (('_' | '^') primeExpr)*
  parseAttach() {
    let r = this.parsePrime(), t, s;
    for (; this.peek().kind === o.Under || this.peek().kind === o.Caret; ) {
      const n = this.consume();
      let a = this.parsePrime();
      a.type === "lr" && a.kind === "paren" && (a = a.body), n.kind === o.Under ? t = t ? m([t, a]) : a : s = s ? m([s, a]) : a;
    }
    return t !== void 0 && s !== void 0 ? { type: "attach", base: r, sub: t, sup: s } : t !== void 0 ? { type: "attach", base: r, sub: t } : s !== void 0 ? { type: "attach", base: r, sup: s } : r;
  }
  // primeExpr := primary ("'")*
  parsePrime() {
    let r = this.parsePrimary(), t = 0;
    for (; this.peek().kind === o.Prime; )
      this.consume(), t++;
    return t > 0 ? {
      type: "attach",
      base: r,
      sup: { type: "symbol", name: "prime", char: t === 1 ? "′" : t === 2 ? "″" : "‴" }
    } : r;
  }
  parsePrimary() {
    const r = this.peek();
    if (r.kind === o.Number)
      return this.consume(), { type: "number", value: r.text };
    if (r.kind === o.Str)
      return this.consume(), { type: "text", value: r.text };
    if (r.kind === o.Op)
      return this.consume(), { type: "operator", text: r.text };
    if (r.kind === o.Shorthand)
      return this.consume(), { type: "operator", text: r.text };
    if (r.kind === o.Bang)
      return this.consume(), { type: "operator", text: "!" };
    if (r.kind === o.Escape)
      return this.consume(), this.resolveName(r.text);
    if (r.kind === o.LParen)
      return this.parseGroup("(", ")");
    if (r.kind === o.LBracket)
      return this.parseGroup("[", "]");
    if (r.kind === o.LBrace)
      return this.parseGroup("{", "}");
    if (r.kind === o.Ident)
      return this.parseIdent();
    throw new k(`Unexpected token '${r.text}'`, r.pos, this.src);
  }
  parseGroup(r, t) {
    this.consume();
    const s = t === ")" ? o.RParen : t === "]" ? o.RBracket : o.RBrace, n = [];
    if (this.peek().kind !== s)
      for (n.push(this.parseAlign()); this.peek().kind === o.Comma || this.peek().kind === o.Semicolon; ) {
        const l = this.consume();
        if (n.push({ type: "operator", text: l.text }), this.peek().kind === s) break;
        n.push(this.parseAlign());
      }
    if (this.peek().kind !== s)
      throw new k(
        `Expected '${t}' but got '${this.peek().text}'`,
        this.peek().pos,
        this.src
      );
    return this.consume(), {
      type: "lr",
      kind: r === "(" ? "paren" : r === "[" ? "bracket" : "brace",
      open: r,
      close: t,
      body: m(n)
    };
  }
  parseIdent() {
    const r = this.assembleDottedIdent();
    return this.resolveName(r);
  }
  // Resolves a (possibly dotted) identifier or escape name to a node.
  resolveName(r) {
    if (r in $)
      return { type: "spacing", kind: $[r] };
    if (this.peek().kind === o.LParen && se(r))
      return this.parseCall(r);
    const t = G(r);
    if (t !== void 0)
      return j(r) ? { type: "spacing", kind: r } : { type: "symbol", name: r, char: t };
    if (Y(r))
      return { type: "atom", text: r, italic: !1, operator: !0 };
    const s = r.length === 1 && /[a-zA-Z]/.test(r);
    return { type: "atom", text: r, italic: s };
  }
  assembleDottedIdent() {
    let r = this.consume().text;
    for (; this.peek().kind === o.Dot && this.peek(1).kind === o.Ident; )
      this.consume(), r += "." + this.consume().text;
    return r;
  }
  parseCall(r) {
    if (this.consume(), r === "frac") return this.parseFrac();
    if (r === "sqrt") return this.parseSqrt();
    if (r === "root") return this.parseRoot();
    if (r === "binom") return this.parseBinom();
    if (r === "lr") return this.parseLr();
    if (r === "op") return this.parseOp();
    if (r === "class") return this.parseClass();
    if (r === "limits") return this.parseLimitsHint("limits");
    if (r === "scripts") return this.parseLimitsHint("scripts");
    if (r === "mid") return this.parseMid();
    if (r === "cancel" || r === "bcancel" || r === "xcancel")
      return this.parseCancel(r);
    if (r in y) return this.parseSize(y[r]);
    if (r in v) return this.parseUnderOver(v[r]);
    if (r in q) return this.parseLrShorthand(r);
    if (B.has(r)) return this.parseAccent(r);
    if (L.has(r)) return this.parseStyle(r);
    if (N.has(r)) return this.parseMatrix(r);
    const t = this.parseArgs(), s = { type: "atom", text: r, italic: !1 }, a = { type: "lr", kind: "paren", open: "(", close: ")", body: re(t) };
    return m([s, a]);
  }
  // Parses a comma-separated argument list, handling named args (k: v) and
  // spread args (..expr). Returns the positional and named pieces; the
  // closing ')' is consumed.
  parseArgs() {
    const r = [], t = {};
    for (; this.peek().kind !== o.RParen && this.peek().kind !== o.EOF; ) {
      if (this.peek().kind === o.Comma) {
        this.consume();
        continue;
      }
      if (this.peek().kind === o.DotDot) {
        this.consume(), r.push(this.parseAlign()), this.peek().kind === o.Comma && this.consume();
        continue;
      }
      if (this.peek().kind === o.Ident && this.peek(1).kind === o.Colon) {
        const s = this.consume().text;
        this.consume(), t[s] = this.parseAlign(), this.peek().kind === o.Comma && this.consume();
        continue;
      }
      r.push(this.parseAlign()), this.peek().kind === o.Comma && this.consume();
    }
    return this.expect(o.RParen), { positional: r, named: t };
  }
  parseFrac() {
    const r = this.parseAlign();
    this.expect(o.Comma);
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "frac", num: r, den: t };
  }
  parseSqrt() {
    const r = this.parseAlign();
    return this.expect(o.RParen), { type: "sqrt", body: r };
  }
  parseRoot() {
    const r = this.parseAlign();
    this.expect(o.Comma);
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "root", index: r, body: t };
  }
  parseBinom() {
    const r = this.parseAlign();
    this.expect(o.Comma);
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "binom", top: r, bot: t };
  }
  parseLr() {
    const r = this.parseAlign();
    if (this.expect(o.RParen), r.type === "lr") return r;
    if (r.type === "seq" && r.nodes.length >= 2) {
      const t = r.nodes[0], s = r.nodes[r.nodes.length - 1];
      if (t.type === "operator" && s.type === "operator") {
        const n = t.text, a = s.text;
        if (te(n) === a) {
          const l = r.nodes.slice(1, -1);
          return { type: "lr", kind: "custom", open: n, close: a, body: m(l) };
        }
      }
    }
    return { type: "lr", kind: "custom", open: "", close: "", body: r };
  }
  parseLrShorthand(r) {
    const t = q[r], s = this.parseAlign();
    return this.expect(o.RParen), { type: "lr", kind: t.kind, open: t.open, close: t.close, body: s };
  }
  parseAccent(r) {
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "accent", kind: r, body: t };
  }
  parseStyle(r) {
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "style", kind: r, body: t };
  }
  parseUnderOver(r) {
    const t = this.parseAlign();
    let s;
    this.peek().kind === o.Comma && (this.consume(), s = this.parseAlign()), this.expect(o.RParen);
    const n = { type: "underover", kind: r, body: t };
    return s !== void 0 && (n.annotation = s), n;
  }
  parseCancel(r) {
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "cancel", kind: J[r], body: t };
  }
  parseOp() {
    let r = "", t = !1;
    if (this.peek().kind === o.RParen)
      return this.consume(), { type: "op", text: "", limits: !1 };
    const s = this.parseAlign();
    for (s.type === "text" ? r = s.value : s.type === "atom" && (r = s.text); this.peek().kind === o.Comma; )
      if (this.consume(), this.peek().kind === o.Ident && this.peek().text === "limits" && this.peek(1).kind === o.Colon) {
        this.consume(), this.consume();
        const n = this.parseAlign();
        n.type === "atom" && (t = n.text === "true");
      } else
        this.parseAlign();
    return this.expect(o.RParen), { type: "op", text: r, limits: t };
  }
  parseClass() {
    const r = this.parseAlign();
    this.expect(o.Comma);
    const t = this.parseAlign();
    this.expect(o.RParen);
    let s = "normal";
    const n = r.type === "text" ? r.value : r.type === "atom" ? r.text : "";
    return Q.has(n) && (s = n), { type: "class", cls: s, body: t };
  }
  parseSize(r) {
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "size", size: r, body: t };
  }
  parseLimitsHint(r) {
    const t = this.parseAlign();
    return this.expect(o.RParen), { type: "limits-hint", mode: r, body: t };
  }
  parseMid() {
    const r = this.parseAlign();
    return this.expect(o.RParen), { type: "class", cls: "rel", body: r };
  }
  parseMatrix(r) {
    const t = [];
    let s = [];
    const n = r === "vec" || r === "cases";
    let a;
    for (; this.peek().kind !== o.RParen && this.peek().kind !== o.EOF; ) {
      const c = this.peek();
      if (c.kind === o.Semicolon)
        this.consume(), t.push(s), s = [];
      else if (c.kind === o.Comma)
        this.consume(), n && (t.push(s), s = []);
      else if (c.kind === o.Ident && this.peek(1).kind === o.Colon) {
        const d = this.consume().text;
        this.consume();
        const h = this.parseAlign();
        d === "delim" && (a = ee(h));
      } else c.kind === o.DotDot ? (this.consume(), s.push(this.parseAlign())) : s.push(this.parseAlign());
    }
    s.length > 0 && t.push(s), this.expect(o.RParen);
    const l = { type: "matrix", kind: r, rows: t };
    return a !== void 0 && (l.delim = a), l;
  }
}
function ee(e) {
  switch (e.type === "text" ? e.value : e.type === "atom" ? e.text : e.type === "symbol" ? e.char : e.type === "operator" ? e.text : "") {
    case "(":
      return { open: "(", close: ")" };
    case "[":
      return { open: "[", close: "]" };
    case "{":
      return { open: "{", close: "}" };
    case "|":
      return { open: "|", close: "|" };
    case "||":
      return { open: "‖", close: "‖" };
    default:
      return;
  }
}
function re(e) {
  if (e.positional.length === 0) return { type: "seq", nodes: [] };
  if (e.positional.length === 1) return e.positional[0];
  const r = [];
  for (let t = 0; t < e.positional.length; t++)
    t > 0 && r.push({ type: "operator", text: "," }), r.push(e.positional[t]);
  return m(r);
}
function te(e) {
  return {
    "(": ")",
    "[": "]",
    "{": "}",
    "|": "|",
    "‖": "‖",
    "⟨": "⟩",
    "⌊": "⌋",
    "⌈": "⌉"
  }[e] ?? e;
}
function A(e) {
  return _(e);
}
function se(e) {
  return !!(e === "frac" || e === "sqrt" || e === "root" || e === "binom" || e === "lr" || e === "mid" || e === "op" || e === "class" || e === "limits" || e === "scripts" || e === "cancel" || e === "bcancel" || e === "xcancel" || e in y || e in v || e in q || B.has(e) || L.has(e) || N.has(e));
}
function i(e) {
  let r = "";
  for (let t = 0; t < e.length; t++) {
    const s = e.charCodeAt(t);
    s === 38 ? r += "&amp;" : s === 60 ? r += "&lt;" : s === 62 ? r += "&gt;" : s === 34 ? r += "&quot;" : r += e[t];
  }
  return r;
}
function ne(e) {
  switch (e) {
    case "cal":
      return "script";
    case "bb":
      return "double-struck";
    case "frak":
      return "fraktur";
    case "bold":
      return "bold-italic";
    case "italic":
      return "italic";
    case "upright":
      return "normal";
    case "sans":
      return "sans-serif";
    case "mono":
      return "monospace";
    default:
      return "normal";
  }
}
function M(e) {
  switch (e) {
    case "thin":
      return "0.1667em";
    case "med":
      return "0.2222em";
    case "thick":
      return "0.2778em";
    case "quad":
      return "1em";
    case "qquad":
      return "2em";
    case "space":
      return "0.3333em";
    case "zws":
      return "0em";
    default:
      return "0em";
  }
}
const oe = /^[∑∏∐∫∬∭⨌∮∯∰∱∲∳⋃⋂⨆⨅⨀⨁⨂⨃⨄⨊⨋]$/u;
function S(e, r) {
  const s = p(e, { display: r, scriptLevel: 0 });
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${r ? ' display="block"' : ""}>${s}</math>`;
}
function p(e, r) {
  switch (e.type) {
    case "seq":
      return ae(e.nodes, r);
    case "atom":
      return ie(e.text, e.italic, e.operator === !0);
    case "number":
      return `<mn>${i(e.value)}</mn>`;
    case "symbol":
      return le(e.char);
    case "operator":
      return `<mo>${i(e.text)}</mo>`;
    case "text":
      return `<mtext>${i(e.value)}</mtext>`;
    case "frac":
      return pe(e.num, e.den, r);
    case "sqrt":
      return `<msqrt>${p(e.body, r)}</msqrt>`;
    case "root":
      return `<mroot>${p(e.body, r)}${p(e.index, r)}</mroot>`;
    case "attach":
      return me(e, r);
    case "matrix":
      return be(e.kind, e.rows, e.delim, r);
    case "style":
      return ge(e.kind, e.body, r);
    case "lr":
      return we(e.open, e.close, e.body, r);
    case "spacing":
      return `<mspace width="${M(e.kind)}"/>`;
    case "align":
      return "<mo>&#x200B;</mo>";
    case "binom":
      return de(e.top, e.bot, r);
    case "accent":
      return ye(e.kind, e.body, r);
    case "underover":
      return xe(e, r);
    case "cancel":
      return $e(e.kind, p(e.body, r));
    case "op":
      return Ae(e.text, e.limits);
    case "class":
      return Se(e.cls, e.body, r);
    case "size":
      return Ce(e.size, e.body, r);
    case "limits-hint":
      return p(e.body, { ...r, limitsHint: e.mode });
  }
}
function ae(e, r) {
  if (e.length === 0) return "<mrow></mrow>";
  const t = '<mspace width="0.1667em"/>', s = [];
  for (let n = 0; n < e.length; n++) {
    const a = e[n], l = e[n - 1], c = e[n + 1];
    a.type === "text" && l !== void 0 && l.type !== "spacing" && s.push(t), s.push(p(a, r)), a.type === "text" && c !== void 0 && c.type !== "spacing" && s.push(t);
  }
  return `<mrow>${s.join("")}</mrow>`;
}
function ie(e, r, t) {
  return t ? `<mi mathvariant="normal">${i(e)}</mi><mspace width="0.1667em"/>` : `<mi${r ? "" : ' mathvariant="normal"'}>${i(e)}</mi>`;
}
function le(e) {
  if (e === "") return '<mspace width="0em"/>';
  const r = e.codePointAt(0) ?? 0;
  return O(e) || oe.test(e) ? `<mo largeop="true" movablelimits="${E(e) ? "false" : "true"}">${i(e)}</mo>` : ce(r) ? `<mo>${i(e)}</mo>` : ue(r) ? `<mi>${i(e)}</mi>` : `<mo>${i(e)}</mo>`;
}
function ce(e) {
  return e >= 8592 && e <= 10239 || e === 177 || e === 215 || e === 247 || e >= 10752 && e <= 11007;
}
function ue(e) {
  return e >= 913 && e <= 1023 || e >= 8448 && e <= 8527 || e >= 119808 && e <= 120831;
}
function pe(e, r, t) {
  return `<mfrac>${p(e, t)}${p(r, t)}</mfrac>`;
}
function de(e, r, t) {
  return `<mrow><mo form="prefix" stretchy="true">(</mo><mfrac linethickness="0">${p(e, t)}${p(r, t)}</mfrac><mo form="postfix" stretchy="true">)</mo></mrow>`;
}
function he(e, r) {
  return r.limitsHint === "limits" ? !0 : r.limitsHint === "scripts" || !r.display ? !1 : !!(e.type === "symbol" && O(e.char) && !E(e.char) || e.type === "atom" && e.operator === !0 && x(e.text) || e.type === "op" && e.limits || e.type === "op" && x(e.text));
}
function me(e, r) {
  const t = ke(e.base, r), s = e.sub !== void 0 ? p(e.sub, r) : void 0, n = e.sup !== void 0 ? p(e.sup, r) : void 0, a = he(e.base, r);
  return s !== void 0 && n !== void 0 ? a ? `<munderover>${t}${s}${n}</munderover>` : `<msubsup>${t}${s}${n}</msubsup>` : s !== void 0 ? a ? `<munder>${t}${s}</munder>` : `<msub>${t}${s}</msub>` : n !== void 0 ? a ? `<mover>${t}${n}</mover>` : `<msup>${t}${n}</msup>` : t;
}
function ke(e, r) {
  return e.type === "atom" && e.operator === !0 ? `<mi mathvariant="normal">${i(e.text)}</mi>` : e.type === "op" ? `<mi mathvariant="normal">${i(e.text)}</mi>` : p(e, r);
}
function be(e, r, t, s) {
  const { open: n, close: a } = t ?? fe(e), l = r.map((d) => `<mtr>${d.map((g) => `<mtd>${p(g, s)}</mtd>`).join("")}</mtr>`).join("");
  if (e === "cases")
    return `<mrow><mo form="prefix" stretchy="true">{</mo><mtable columnalign="left left">${l}</mtable></mrow>`;
  const c = `<mtable>${l}</mtable>`;
  if (n || a) {
    const d = n ? `<mo form="prefix" stretchy="true">${i(n)}</mo>` : "", h = a ? `<mo form="postfix" stretchy="true">${i(a)}</mo>` : "";
    return `<mrow>${d}${c}${h}</mrow>`;
  }
  return c;
}
function fe(e) {
  switch (e) {
    case "vec":
      return { open: "(", close: ")" };
    case "mat":
      return { open: "(", close: ")" };
    case "pmat":
      return { open: "(", close: ")" };
    case "bmat":
      return { open: "[", close: "]" };
    case "vmat":
      return { open: "|", close: "|" };
    case "Vmat":
      return { open: "‖", close: "‖" };
    case "cases":
      return { open: "{", close: "" };
    default:
      return { open: "(", close: ")" };
  }
}
function ge(e, r, t) {
  const s = ne(e), n = p(r, t);
  return `<mstyle mathvariant="${s}">${n}</mstyle>`;
}
function we(e, r, t, s) {
  const n = e ? `<mo form="prefix" stretchy="true" fence="true">${i(e)}</mo>` : "", a = r ? `<mo form="postfix" stretchy="true" fence="true">${i(r)}</mo>` : "";
  return `<mrow>${n}${p(t, s)}${a}</mrow>`;
}
const ve = {
  hat: "^",
  tilde: "~",
  dot: "˙",
  "dot.double": "¨",
  "dot.triple": "⃛",
  overline: "‾",
  bar: "‾",
  arrow: "⃗",
  "arrow.l": "⃖",
  "arrow.l.r": "⃡",
  breve: "˘",
  grave: "`",
  acute: "´",
  macron: "¯",
  caron: "ˇ",
  circle: "˚"
};
function ye(e, r, t) {
  const s = ve[e] ?? "^";
  return `<mover accent="true">${p(r, t)}<mo>${i(s)}</mo></mover>`;
}
const qe = {
  overbrace: { ch: "⏞", over: !0 },
  underbrace: { ch: "⏟", over: !1 },
  "overline.stretch": { ch: "‾", over: !0 },
  "underline.stretch": { ch: "_", over: !1 },
  overparen: { ch: "⏜", over: !0 },
  underparen: { ch: "⏝", over: !1 },
  overbracket: { ch: "⎴", over: !0 },
  underbracket: { ch: "⎵", over: !1 }
};
function xe(e, r) {
  const t = qe[e.kind], s = t.over ? "mover" : "munder", n = p(e.body, r), a = `<mo stretchy="true">${i(t.ch)}</mo>`, l = `<${s} accent="true">${n}${a}</${s}>`;
  if (e.annotation === void 0) return l;
  const c = p(e.annotation, r);
  return t.over ? `<mover>${l}${c}</mover>` : `<munder>${l}${c}</munder>`;
}
function $e(e, r) {
  return `<menclose notation="${e === "bcancel" ? "downdiagonalstrike" : e === "xcancel" ? "updiagonalstrike downdiagonalstrike" : "updiagonalstrike"}">${r}</menclose>`;
}
function Ae(e, r) {
  return `<mi mathvariant="normal">${i(e)}</mi><mspace width="0.1667em"/>`;
}
function Se(e, r, t) {
  if (r.type === "atom" || r.type === "symbol" || r.type === "operator") {
    const s = r.type === "atom" ? r.text : r.type === "symbol" ? r.char : r.text;
    if (e === "op")
      return `<mo largeop="true" movablelimits="true">${i(s)}</mo>`;
    if (e === "bin" || e === "rel" || e === "punct")
      return `<mo>${i(s)}</mo>`;
    if (e === "open")
      return `<mo form="prefix" stretchy="true">${i(s)}</mo>`;
    if (e === "close")
      return `<mo form="postfix" stretchy="true">${i(s)}</mo>`;
    if (e === "normal")
      return `<mi mathvariant="normal">${i(s)}</mi>`;
  }
  return p(r, t);
}
function Ce(e, r, t) {
  const s = e === "display" ? "true" : e === "inline" ? "false" : void 0, n = e === "display" || e === "inline" ? "0" : e === "script" ? "1" : e === "sscript" ? "2" : void 0, a = [
    s !== void 0 ? `displaystyle="${s}"` : "",
    n !== void 0 ? `scriptlevel="${n}"` : ""
  ].filter(Boolean).join(" "), l = {
    ...t,
    display: e === "display" ? !0 : e === "inline" ? !1 : t.display
  };
  return `<mstyle ${a}>${p(r, l)}</mstyle>`;
}
function C(e, r) {
  const t = u(e);
  return `<span class="${r ? "kern kern-display" : "kern kern-inline"}">${t}</span>`;
}
function u(e, r) {
  switch (e.type) {
    case "seq":
      return Re(e.nodes);
    case "atom":
      return Pe(e.text, e.italic, e.operator === !0);
    case "number":
      return `<span class="kern-mn">${i(e.value)}</span>`;
    case "symbol":
      return Oe(e.char);
    case "operator":
      return `<span class="kern-mo">${i(e.text)}</span>`;
    case "text":
      return `<span class="kern-mtext">${i(e.value)}</span>`;
    case "frac":
      return Ee(e.num, e.den);
    case "sqrt":
      return Ne(e.body);
    case "root":
      return Be(e.index, e.body);
    case "attach":
      return Me(e);
    case "matrix":
      return He(e.kind, e.rows);
    case "style":
      return De(e.kind, e.body);
    case "lr":
      return ze(e.open, e.close, e.body);
    case "spacing":
      return je(e.kind);
    case "align":
      return '<span class="kern-align"></span>';
    case "binom":
      return Le(e.top, e.bot);
    case "accent":
      return Ue(e.kind, e.body);
    case "underover":
      return Ge(e.kind, e.body, e.annotation);
    case "cancel":
      return Ve(e.kind, e.body);
    case "op":
      return We(e.text);
    case "class":
      return u(e.body);
    case "size":
      return u(e.body);
    case "limits-hint":
      return u(e.body);
  }
}
function Re(e, r) {
  return `<span class="kern-mrow">${e.map((t) => u(t)).join("")}</span>`;
}
function Pe(e, r, t) {
  return t ? `<span class="kern-mi kern-mathrm kern-op">${i(e)}</span><span class="kern-mspace" style="display:inline-block;width:0.1667em"></span>` : `<span class="${r ? "kern-mi kern-mathnormal" : "kern-mi kern-mathrm"}">${i(e)}</span>`;
}
function Oe(e) {
  return e === "" ? "" : `<span class="kern-mo">${i(e)}</span>`;
}
function Ee(e, r, t) {
  return `<span class="kern-mfrac"><span class="kern-mfrac-num">${u(e)}</span><span class="kern-mfrac-den">${u(r)}</span></span>`;
}
function Le(e, r, t) {
  return `<span class="kern-mrow"><span class="kern-mo">(</span><span class="kern-mfrac kern-mfrac-binom"><span class="kern-mfrac-num">${u(e)}</span><span class="kern-mfrac-den">${u(r)}</span></span><span class="kern-mo">)</span></span>`;
}
function Ne(e, r) {
  return `<span class="kern-sqrt"><span class="kern-sqrt-sign">√</span><span class="kern-sqrt-body">${u(e)}</span></span>`;
}
function Be(e, r, t) {
  return `<span class="kern-sqrt kern-nroot"><span class="kern-nroot-index">${u(e)}</span><span class="kern-sqrt-sign">√</span><span class="kern-sqrt-body">${u(r)}</span></span>`;
}
function Me(e, r) {
  const t = u(e.base);
  return e.sub !== void 0 && e.sup !== void 0 ? `<span class="kern-msubsup"><span class="kern-msubsup-base">${t}</span><span class="kern-msubsup-scripts"><span class="kern-msup">${u(e.sup)}</span><span class="kern-msub">${u(e.sub)}</span></span></span>` : e.sub !== void 0 ? `<span class="kern-msub">${t}<span class="kern-msub-script">${u(e.sub)}</span></span>` : e.sup !== void 0 ? `<span class="kern-msup">${t}<span class="kern-msup-script">${u(e.sup)}</span></span>` : t;
}
function He(e, r, t) {
  const { open: s, close: n } = Ie(e), l = `<span class="kern-mtable">${r.map((c) => `<span class="kern-mtr">${c.map(
    (h) => `<span class="kern-mtd">${u(h)}</span>`
  ).join("")}</span>`).join("")}</span>`;
  return s || n ? '<span class="kern-mrow">' + (s ? `<span class="kern-mo kern-delimiter">${i(s)}</span>` : "") + l + (n ? `<span class="kern-mo kern-delimiter">${i(n)}</span>` : "") + "</span>" : l;
}
function Ie(e) {
  switch (e) {
    case "vec":
      return { open: "(", close: ")" };
    case "mat":
      return { open: "(", close: ")" };
    case "pmat":
      return { open: "(", close: ")" };
    case "bmat":
      return { open: "[", close: "]" };
    case "vmat":
      return { open: "|", close: "|" };
    case "Vmat":
      return { open: "‖", close: "‖" };
    case "cases":
      return { open: "{", close: "" };
    default:
      return { open: "(", close: ")" };
  }
}
const _e = {
  cal: "kern-cal",
  bb: "kern-bb",
  frak: "kern-frak",
  bold: "kern-bold",
  italic: "kern-italic",
  upright: "kern-upright",
  sans: "kern-sans",
  mono: "kern-mono"
};
function De(e, r, t) {
  return `<span class="${_e[e] ?? "kern-upright"}">${u(r)}</span>`;
}
function ze(e, r, t, s) {
  return '<span class="kern-mrow">' + (e ? `<span class="kern-mo kern-delimiter">${i(e)}</span>` : "") + u(t) + (r ? `<span class="kern-mo kern-delimiter">${i(r)}</span>` : "") + "</span>";
}
const Fe = {
  hat: "^",
  tilde: "~",
  dot: "˙",
  overline: "‾",
  bar: "‾",
  arrow: "→"
};
function Ue(e, r, t) {
  const s = Fe[e] ?? "^";
  return `<span class="kern-mover"><span class="kern-mover-body">${u(r)}</span><span class="kern-mo kern-accent">${i(s)}</span></span>`;
}
function je(e) {
  return `<span class="kern-mspace" style="display:inline-block;width:${M(e)}"></span>`;
}
const R = {
  overbrace: { ch: "⏞", over: !0 },
  underbrace: { ch: "⏟", over: !1 },
  "overline.stretch": { ch: "‾", over: !0 },
  "underline.stretch": { ch: "_", over: !1 },
  overparen: { ch: "⏜", over: !0 },
  underparen: { ch: "⏝", over: !1 },
  overbracket: { ch: "⎴", over: !0 },
  underbracket: { ch: "⎵", over: !1 }
};
function Ge(e, r, t, s) {
  const n = R[e] ?? R.overbrace, a = n.over ? "kern-mover" : "kern-munder", l = n.over ? "kern-mover-mark" : "kern-munder-mark", c = n.over ? "kern-mover-body" : "kern-munder-body", d = t !== void 0 ? `<span class="${l} kern-ann">${u(t)}</span>` : "";
  return `<span class="${a}"><span class="${c}">${u(r)}</span><span class="${l}">${i(n.ch)}</span>` + d + "</span>";
}
function Ve(e, r, t) {
  return `<span class="${e === "bcancel" ? "kern-cancel kern-bcancel" : e === "xcancel" ? "kern-cancel kern-xcancel" : "kern-cancel"}">${u(r)}</span>`;
}
function We(e) {
  return `<span class="kern-mi kern-mathrm kern-op">${i(e)}</span><span class="kern-mspace" style="display:inline-block;width:0.1667em"></span>`;
}
function Ye(e) {
  return {
    displayMode: e?.displayMode ?? !1,
    throwOnError: e?.throwOnError ?? !0,
    errorColor: e?.errorColor ?? "#cc0000",
    macros: e?.macros ?? {},
    output: e?.output ?? "mathml",
    trust: e?.trust ?? !1,
    strict: e?.strict ?? "warn",
    delimiters: e?.delimiters ?? [
      { left: "$$", right: "$$", display: !0 },
      { left: "$", right: "$", display: !1 }
    ]
  };
}
function Je(e, r, t) {
  r.innerHTML = Ze(e, t);
}
function Ze(e, r) {
  const t = Ye(r);
  try {
    const s = T(e), n = t.displayMode, a = t.output;
    if (a === "mathml")
      return S(s, n);
    if (a === "html")
      return C(s, n);
    const l = S(s, n), c = C(s, n);
    return `<span class="${n ? "kern kern-display" : "kern kern-inline"}" aria-hidden="true">${c}</span>${l}`;
  } catch (s) {
    if (s instanceof k) {
      if (t.throwOnError) throw s;
      const n = Xe(s.message);
      return `<span class="kern-error" style="color:${t.errorColor}">${n}</span>`;
    }
    throw s;
  }
}
function Xe(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export {
  k as ParseError,
  Je as render,
  Ze as renderToString
};
