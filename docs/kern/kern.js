class u extends Error {
  constructor(t, r, s) {
    super(t), this.name = "ParseError", this.position = r, this.source = s;
  }
}
var a = /* @__PURE__ */ ((e) => (e[e.Ident = 0] = "Ident", e[e.Number = 1] = "Number", e[e.Op = 2] = "Op", e[e.Slash = 3] = "Slash", e[e.LParen = 4] = "LParen", e[e.RParen = 5] = "RParen", e[e.LBracket = 6] = "LBracket", e[e.RBracket = 7] = "RBracket", e[e.Under = 8] = "Under", e[e.Caret = 9] = "Caret", e[e.Amp = 10] = "Amp", e[e.Semicolon = 11] = "Semicolon", e[e.Comma = 12] = "Comma", e[e.Dot = 13] = "Dot", e[e.Str = 14] = "Str", e[e.Prime = 15] = "Prime", e[e.EOF = 16] = "EOF", e))(a || {});
function y(e) {
  return e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function d(e) {
  return e >= 48 && e <= 57;
}
function v(e) {
  return y(e) || d(e);
}
function A(e) {
  return e === 32 || e === 9 || e === 10 || e === 13;
}
const S = /* @__PURE__ */ new Set([
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
  "⟺"
]);
function f(e) {
  return S.has(e);
}
function C(e) {
  const t = [];
  let r = 0;
  const s = e.length;
  for (; r < s; ) {
    const n = r, o = e.charCodeAt(r);
    if (A(o)) {
      r++;
      continue;
    }
    if (y(o)) {
      for (; r < s && v(e.charCodeAt(r)); ) r++;
      t.push({ kind: 0, text: e.slice(n, r), pos: n });
      continue;
    }
    if (d(o)) {
      for (; r < s && d(e.charCodeAt(r)); ) r++;
      if (r < s && e.charCodeAt(r) === 46 && r + 1 < s && d(e.charCodeAt(r + 1)))
        for (r++; r < s && d(e.charCodeAt(r)); ) r++;
      t.push({ kind: 1, text: e.slice(n, r), pos: n });
      continue;
    }
    switch (o) {
      case 34: {
        for (r++; r < s && e.charCodeAt(r) !== 34; )
          e.charCodeAt(r) === 92 && r++, r++;
        if (r >= s) throw new u("Unterminated string literal", n, e);
        r++, t.push({ kind: 14, text: e.slice(n + 1, r - 1), pos: n });
        break;
      }
      case 40:
        t.push({ kind: 4, text: "(", pos: n }), r++;
        break;
      case 41:
        t.push({ kind: 5, text: ")", pos: n }), r++;
        break;
      case 91:
        t.push({ kind: 6, text: "[", pos: n }), r++;
        break;
      case 93:
        t.push({ kind: 7, text: "]", pos: n }), r++;
        break;
      case 95:
        t.push({ kind: 8, text: "_", pos: n }), r++;
        break;
      case 94:
        t.push({ kind: 9, text: "^", pos: n }), r++;
        break;
      case 38:
        t.push({ kind: 10, text: "&", pos: n }), r++;
        break;
      case 59:
        t.push({ kind: 11, text: ";", pos: n }), r++;
        break;
      case 44:
        t.push({ kind: 12, text: ",", pos: n }), r++;
        break;
      case 46:
        t.push({ kind: 13, text: ".", pos: n }), r++;
        break;
      case 39:
        t.push({ kind: 15, text: "'", pos: n }), r++;
        break;
      case 47:
        t.push({ kind: 3, text: "/", pos: n }), r++;
        break;
      default: {
        const l = e[r];
        r++, t.push({ kind: 2, text: l, pos: n });
        break;
      }
    }
  }
  return t.push({ kind: 16, text: "", pos: s }), t;
}
function m(e) {
  return e.length === 0 ? { type: "seq", nodes: [] } : e.length === 1 ? e[0] : { type: "seq", nodes: e };
}
const P = {
  // Greek lowercase
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  // Greek uppercase
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Pi: "Π",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
  // Greek variants
  "epsilon.alt": "ϵ",
  "phi.alt": "ϕ",
  "theta.alt": "ϑ",
  "rho.alt": "ϱ",
  "kappa.alt": "ϰ",
  "pi.alt": "ϖ",
  "sigma.alt": "ς",
  // Basic math
  infinity: "∞",
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  forall: "∀",
  exists: "∃",
  "exists.not": "∄",
  nothing: "∅",
  emptyset: "∅",
  // Number sets (double-struck)
  NN: "ℕ",
  ZZ: "ℤ",
  QQ: "ℚ",
  RR: "ℝ",
  CC: "ℂ",
  FF: "𝔽",
  HH: "ℍ",
  // Logic
  not: "¬",
  and: "∧",
  or: "∨",
  xor: "⊻",
  top: "⊤",
  bot: "⊥",
  models: "⊨",
  "models.not": "⊭",
  tack: "⊢",
  "tack.r": "⊢",
  "tack.l": "⊣",
  "tack.r.double": "⊨",
  // Set operations
  in: "∈",
  "in.not": "∉",
  "in.rev": "∋",
  "in.rev.not": "∌",
  subset: "⊂",
  supset: "⊃",
  "subset.eq": "⊆",
  "supset.eq": "⊇",
  "subset.eq.not": "⊈",
  "supset.eq.not": "⊉",
  "subset.neq": "⊊",
  "supset.neq": "⊋",
  union: "∪",
  "union.big": "⋃",
  "union.sq": "⊎",
  "union.sq.big": "⨆",
  sect: "∩",
  "sect.big": "⋂",
  "sect.sq": "⊓",
  "sect.sq.big": "⨅",
  complement: "∁",
  // Arithmetic
  plus: "+",
  minus: "−",
  times: "×",
  div: "÷",
  "dot.op": "⋅",
  "dot.c": "∙",
  "dot.basic": ".",
  ast: "∗",
  star: "⋆",
  compose: "∘",
  "circle.plus": "⊕",
  "circle.minus": "⊖",
  "circle.times": "⊗",
  "circle.dot": "⊙",
  "circle.small": "◦",
  dagger: "†",
  ddagger: "‡",
  prime: "′",
  dprime: "″",
  tprime: "‴",
  backprime: "‵",
  // Relations - equality
  "eq.not": "≠",
  "eq.equiv": "≡",
  "eq.nequiv": "≢",
  "eq.prec": "⋞",
  "eq.succ": "⋟",
  "eq.def": "≝",
  "eq.quest": "≟",
  "eq.colon": "≔",
  approx: "≈",
  "approx.not": "≉",
  "approx.eq": "≊",
  sim: "∼",
  "sim.eq": "≃",
  "sim.equiv": "≅",
  "sim.not": "≁",
  tilde: "∼",
  "tilde.eq": "≃",
  "tilde.equiv": "≅",
  "tilde.not": "≁",
  "tilde.nequiv": "≇",
  propto: "∝",
  "propto.var": "∝",
  perp: "⊥",
  parallel: "∥",
  "parallel.not": "∦",
  mid: "∣",
  "mid.not": "∤",
  // Relations - order
  "lt.eq": "≤",
  "gt.eq": "≥",
  "lt.eq.not": "≰",
  "gt.eq.not": "≱",
  "lt.not": "≮",
  "gt.not": "≯",
  "lt.tri": "⊲",
  "gt.tri": "⊳",
  "lt.tri.eq": "⊴",
  "gt.tri.eq": "⊵",
  prec: "≺",
  succ: "≻",
  "prec.eq": "≼",
  "succ.eq": "≽",
  "prec.not": "⊀",
  "succ.not": "⊁",
  "prec.equiv": "≾",
  "succ.equiv": "≿",
  ll: "≪",
  gg: "≫",
  "lt.double": "≪",
  "gt.double": "≫",
  // Arrows - rightward
  "arrow.r": "→",
  "arrow.r.long": "⟶",
  "arrow.r.double": "⇒",
  "arrow.r.long.double": "⟹",
  "arrow.r.triple": "⇛",
  "arrow.r.squiggly": "⟿",
  "arrow.r.hook": "↪",
  "arrow.r.bar": "↦",
  "arrow.r.tilde": "⇝",
  "arrow.r.not": "↛",
  "arrow.r.double.not": "⇏",
  "arrow.r.dashed": "⇢",
  "arrow.r.dotted": "⇠",
  "arrow.r.wave": "↜",
  "arrow.r.two": "⇉",
  "arrow.r.stop": "↣",
  "arrow.r.curve": "⤳",
  "arrow.r.loop": "↺",
  // Arrows - leftward
  "arrow.l": "←",
  "arrow.l.long": "⟵",
  "arrow.l.double": "⇐",
  "arrow.l.long.double": "⟸",
  "arrow.l.hook": "↩",
  "arrow.l.bar": "↤",
  "arrow.l.not": "↚",
  "arrow.l.double.not": "⇍",
  "arrow.l.dashed": "⇠",
  "arrow.l.two": "⇇",
  "arrow.l.stop": "↢",
  "arrow.l.curve": "⤶",
  // Arrows - bidirectional
  "arrow.l.r": "↔",
  "arrow.l.r.long": "⟷",
  "arrow.l.r.double": "⇔",
  "arrow.l.r.long.double": "⟺",
  "arrow.l.r.not": "↮",
  "arrow.l.r.double.not": "⇎",
  // Arrows - vertical
  "arrow.t": "↑",
  "arrow.b": "↓",
  "arrow.t.double": "⇑",
  "arrow.b.double": "⇓",
  "arrow.t.b": "↕",
  "arrow.t.b.double": "⇕",
  "arrow.t.l": "↖",
  "arrow.t.r": "↗",
  "arrow.b.l": "↙",
  "arrow.b.r": "↘",
  // Arrows - harpoons
  "harpoon.rt": "⇀",
  "harpoon.rb": "⇁",
  "harpoon.lt": "↼",
  "harpoon.lb": "↽",
  "harpoon.tl": "↿",
  "harpoon.tr": "↾",
  "harpoon.bl": "⇃",
  "harpoon.br": "⇂",
  // Big operators
  sum: "∑",
  product: "∏",
  coproduct: "∐",
  integral: "∫",
  "integral.double": "∬",
  "integral.triple": "∭",
  "integral.cont": "∮",
  "integral.cont.double": "∯",
  "integral.cont.triple": "∰",
  "integral.arrow.r": "∷",
  // Geometry / misc math
  degree: "°",
  angle: "∠",
  "angle.l": "⟨",
  "angle.r": "⟩",
  "angle.spheric": "∢",
  "angle.arc": "∡",
  // Dots
  "dots.h": "⋯",
  "dots.v": "⋮",
  "dots.d": "⋱",
  "dots.l": "⋰",
  "dots.c": "⋅",
  dots: "…",
  // Brackets / fences
  "floor.l": "⌊",
  "floor.r": "⌋",
  "ceil.l": "⌈",
  "ceil.r": "⌉",
  "bracket.l": "[",
  "bracket.r": "]",
  "bracket.double.l": "⟦",
  "bracket.double.r": "⟧",
  "brace.l": "{",
  "brace.r": "}",
  "paren.l": "(",
  "paren.r": ")",
  "bar.v": "|",
  "bar.v.double": "‖",
  // Miscellaneous
  aleph: "ℵ",
  beth: "ℶ",
  gimel: "ℷ",
  daleth: "ℸ",
  hbar: "ℏ",
  planck: "ℎ",
  ell: "ℓ",
  Re: "ℜ",
  Im: "ℑ",
  wp: "℘",
  mho: "℧",
  weierp: "℘",
  laplace: "∆",
  gradient: "∇",
  sterling: "£",
  euro: "€",
  yen: "¥",
  cent: "¢",
  copyright: "©",
  trademark: "™",
  registered: "®",
  bullet: "•",
  section: "§",
  paragraph: "¶",
  lozenge: "◊",
  checkmark: "✓",
  "checkmark.light": "✔",
  cross: "✗",
  "cross.circle": "⊗",
  // Accents (returned as standalone characters for use with hat(), tilde() etc.)
  hat: "̂",
  bar: "̅",
  "tilde.accent": "̃",
  vec: "⃗",
  dot: "̇",
  "dot.double": "̈",
  acute: "́",
  grave: "̀",
  breve: "̆",
  macron: "̅",
  caron: "̌",
  circle: "̊",
  // Spacing (resolved to MathML/CSS spacing, not characters)
  thin: "",
  med: "",
  thick: "",
  quad: "",
  qquad: "",
  space: " ",
  zws: "​",
  // Misc operators
  "plus.minus": "±",
  "minus.plus": "∓",
  "lt.eq.slant": "⩽",
  "gt.eq.slant": "⩾",
  wreath: "≀",
  multimap: "⊸",
  intercal: "⊺",
  bowtie: "⋈",
  ltimes: "⋉",
  rtimes: "⋊",
  divides: "∣",
  "divides.not": "∤",
  smash: "⨳",
  curlyeq: "≟",
  "sqrt.symbol": "√"
}, R = /* @__PURE__ */ new Set(["thin", "med", "thick", "quad", "qquad", "space", "zws"]);
function L(e) {
  return R.has(e);
}
function E(e) {
  return P[e];
}
const M = /* @__PURE__ */ new Set(["cal", "bb", "frak", "bold", "italic", "upright", "sans", "mono"]), N = /* @__PURE__ */ new Set(["vec", "mat", "cases", "bmat", "pmat", "vmat", "Vmat"]), O = {
  hat: "^",
  tilde: "~",
  dot: "˙",
  overline: "‾",
  bar: "‾",
  arrow: "→"
}, w = {
  thin: "thin",
  med: "med",
  thick: "thick",
  quad: "quad",
  qquad: "qquad",
  space: "space",
  zws: "zws"
}, g = {
  abs: { kind: "abs", open: "|", close: "|" },
  norm: { kind: "norm", open: "‖", close: "‖" },
  floor: { kind: "floor", open: "⌊", close: "⌋" },
  ceil: { kind: "ceil", open: "⌈", close: "⌉" }
};
function F(e) {
  const t = C(e), r = new I(t, e), s = r.parseAlign();
  if (r.peek().kind !== a.EOF)
    throw new u(`Unexpected token '${r.peek().text}'`, r.peek().pos, e);
  return s;
}
class I {
  constructor(t, r) {
    this.tokens = t, this.src = r, this.pos = 0;
  }
  peek(t = 0) {
    const r = this.pos + t;
    return r < this.tokens.length ? this.tokens[r] : this.tokens[this.tokens.length - 1];
  }
  consume() {
    const t = this.tokens[this.pos];
    return t.kind !== a.EOF && this.pos++, t;
  }
  expect(t) {
    const r = this.peek();
    if (r.kind !== t)
      throw new u(
        `Expected ${a[t] ?? t} but got '${r.text}'`,
        r.pos,
        this.src
      );
    return this.consume();
  }
  // alignExpr := addExpr ('&' addExpr)*
  parseAlign() {
    const t = this.parseAdd();
    if (this.peek().kind !== a.Amp) return t;
    const r = [t];
    for (; this.peek().kind === a.Amp; )
      this.consume(), r.push({ type: "align" }), r.push(this.parseAdd());
    return { type: "seq", nodes: r };
  }
  // addExpr := fracExpr (ADDOP fracExpr)*
  parseAdd() {
    const t = [];
    for (t.push(...this.collectFrac()); this.peek().kind === a.Op && f(this.peek().text); ) {
      const r = this.consume();
      t.push({ type: "operator", text: r.text }), t.push(...this.collectFrac());
    }
    return m(t);
  }
  // Returns the flat nodes produced by one fracExpr (may be multiple from seq)
  collectFrac() {
    const t = this.parseSeq();
    if (this.peek().kind !== a.Slash)
      return t.type === "seq" ? t.nodes : [t];
    this.consume();
    const r = this.parseSeq();
    return [{ type: "frac", num: t, den: r }];
  }
  // seqExpr := attachExpr+ (atoms, not separated by addOps)
  parseSeq() {
    const t = [];
    for (; ; ) {
      const r = this.peek();
      if (r.kind === a.EOF || r.kind === a.RParen || r.kind === a.RBracket || r.kind === a.Amp || r.kind === a.Semicolon || r.kind === a.Comma || r.kind === a.Slash || t.length > 0 && r.kind === a.Op && f(r.text)) break;
      const s = this.parseAttach();
      t.push(s);
    }
    if (t.length === 0)
      throw new u("Expected expression", this.peek().pos, this.src);
    return m(t);
  }
  // attachExpr := primeExpr (('_' | '^') primeExpr)*
  parseAttach() {
    let t = this.parsePrime(), r, s;
    for (; this.peek().kind === a.Under || this.peek().kind === a.Caret; ) {
      const n = this.consume();
      let o = this.parsePrime();
      o.type === "lr" && o.kind === "paren" && (o = o.body), n.kind === a.Under ? r = r ? m([r, o]) : o : s = s ? m([s, o]) : o;
    }
    return r !== void 0 && s !== void 0 ? { type: "attach", base: t, sub: r, sup: s } : r !== void 0 ? { type: "attach", base: t, sub: r } : s !== void 0 ? { type: "attach", base: t, sup: s } : t;
  }
  // primeExpr := primary ("'")*
  parsePrime() {
    let t = this.parsePrimary(), r = 0;
    for (; this.peek().kind === a.Prime; )
      this.consume(), r++;
    return r > 0 ? {
      type: "attach",
      base: t,
      sup: { type: "symbol", name: "prime", char: r === 1 ? "′" : r === 2 ? "″" : "‴" }
    } : t;
  }
  parsePrimary() {
    const t = this.peek();
    if (t.kind === a.Number)
      return this.consume(), { type: "number", value: t.text };
    if (t.kind === a.Str)
      return this.consume(), { type: "text", value: t.text };
    if (t.kind === a.Op)
      return this.consume(), { type: "operator", text: t.text };
    if (t.kind === a.LParen)
      return this.parseGroup("(", ")");
    if (t.kind === a.LBracket)
      return this.parseGroup("[", "]");
    if (t.kind === a.Ident)
      return this.parseIdent();
    throw new u(`Unexpected token '${t.text}'`, t.pos, this.src);
  }
  parseGroup(t, r) {
    this.consume();
    const s = r === ")" ? a.RParen : a.RBracket, n = this.parseAlign();
    if (this.peek().kind !== s)
      throw new u(
        `Expected '${r}' but got '${this.peek().text}'`,
        this.peek().pos,
        this.src
      );
    return this.consume(), {
      type: "lr",
      kind: t === "(" ? "paren" : "bracket",
      open: t,
      close: r,
      body: n
    };
  }
  parseIdent() {
    const t = this.assembleDottedIdent();
    if (t in w)
      return { type: "spacing", kind: w[t] };
    if (this.peek().kind === a.LParen)
      return this.parseCall(t);
    const r = E(t);
    if (r !== void 0)
      return L(t) ? { type: "spacing", kind: t } : { type: "symbol", name: t, char: r };
    const s = t.length === 1 && /[a-zA-Z]/.test(t);
    return { type: "atom", text: t, italic: s };
  }
  assembleDottedIdent() {
    let t = this.consume().text;
    for (; this.peek().kind === a.Dot && this.peek(1).kind === a.Ident; )
      this.consume(), t += "." + this.consume().text;
    return t;
  }
  parseCall(t) {
    if (this.consume(), t === "frac") return this.parseFrac();
    if (t === "sqrt") return this.parseSqrt();
    if (t === "root") return this.parseRoot();
    if (t === "binom") return this.parseBinom();
    if (t === "lr") return this.parseLr();
    if (t in g) return this.parseLrShorthand(t);
    if (t in O) return this.parseAccent(t);
    if (M.has(t)) return this.parseStyle(t);
    if (N.has(t)) return this.parseMatrix(t);
    const r = this.parseAlign();
    return this.expect(a.RParen), m([{ type: "atom", text: t, italic: !1 }, { type: "lr", kind: "paren", open: "(", close: ")", body: r }]);
  }
  parseFrac() {
    const t = this.parseAlign();
    this.expect(a.Comma);
    const r = this.parseAlign();
    return this.expect(a.RParen), { type: "frac", num: t, den: r };
  }
  parseSqrt() {
    const t = this.parseAlign();
    return this.expect(a.RParen), { type: "sqrt", body: t };
  }
  parseRoot() {
    const t = this.parseAlign();
    this.expect(a.Comma);
    const r = this.parseAlign();
    return this.expect(a.RParen), { type: "root", index: t, body: r };
  }
  parseBinom() {
    const t = this.parseAlign();
    this.expect(a.Comma);
    const r = this.parseAlign();
    return this.expect(a.RParen), { type: "binom", top: t, bot: r };
  }
  parseLr() {
    const t = this.parseAlign();
    if (this.expect(a.RParen), t.type === "lr") return t;
    if (t.type === "seq" && t.nodes.length >= 2) {
      const r = t.nodes[0], s = t.nodes[t.nodes.length - 1];
      if (r.type === "operator" && s.type === "operator") {
        const n = r.text, o = s.text;
        if (B(n) === o) {
          const l = t.nodes.slice(1, -1);
          return { type: "lr", kind: "custom", open: n, close: o, body: m(l) };
        }
      }
    }
    return { type: "lr", kind: "custom", open: "", close: "", body: t };
  }
  parseLrShorthand(t) {
    const r = g[t], s = this.parseAlign();
    return this.expect(a.RParen), { type: "lr", kind: r.kind, open: r.open, close: r.close, body: s };
  }
  parseAccent(t) {
    const r = this.parseAlign();
    return this.expect(a.RParen), { type: "accent", kind: t, body: r };
  }
  parseStyle(t) {
    const r = this.parseAlign();
    return this.expect(a.RParen), { type: "style", kind: t, body: r };
  }
  parseMatrix(t) {
    const r = [];
    let s = [];
    const n = t === "vec" || t === "cases";
    for (; this.peek().kind !== a.RParen && this.peek().kind !== a.EOF; ) {
      const o = this.peek();
      o.kind === a.Semicolon ? (this.consume(), r.push(s), s = []) : o.kind === a.Comma ? (this.consume(), n && (r.push(s), s = [])) : s.push(this.parseAlign());
    }
    return s.length > 0 && r.push(s), this.expect(a.RParen), { type: "matrix", kind: t, rows: r };
  }
}
function B(e) {
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
function i(e) {
  let t = "";
  for (let r = 0; r < e.length; r++) {
    const s = e.charCodeAt(r);
    s === 38 ? t += "&amp;" : s === 60 ? t += "&lt;" : s === 62 ? t += "&gt;" : s === 34 ? t += "&quot;" : t += e[r];
  }
  return t;
}
function D(e) {
  switch (e) {
    case "cal":
      return "script";
    case "bb":
      return "double-struck";
    case "frak":
      return "fraktur";
    case "bold":
      return "bold";
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
function q(e) {
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
function x(e, t) {
  const r = c(e);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${t ? ' display="block"' : ""}>${r}</math>`;
}
function c(e, t) {
  switch (e.type) {
    case "seq":
      return H(e.nodes);
    case "atom":
      return _(e.text, e.italic);
    case "number":
      return `<mn>${i(e.value)}</mn>`;
    case "symbol":
      return U(e.char);
    case "operator":
      return `<mo>${i(e.text)}</mo>`;
    case "text":
      return `<mtext>${i(e.value)}</mtext>`;
    case "frac":
      return G(e.num, e.den);
    case "sqrt":
      return `<msqrt>${c(e.body)}</msqrt>`;
    case "root":
      return `<mroot>${c(e.body)}${c(e.index)}</mroot>`;
    case "attach":
      return V(e);
    case "matrix":
      return Y(e.kind, e.rows);
    case "style":
      return W(e.kind, e.body);
    case "lr":
      return X(e.open, e.close, e.body);
    case "spacing":
      return `<mspace width="${q(e.kind)}"/>`;
    case "align":
      return "<mo>&#x200B;</mo>";
    case "binom":
      return Z(e.top, e.bot);
    case "accent":
      return T(e.kind, e.body);
  }
}
function H(e, t) {
  return e.length === 0 ? "<mrow></mrow>" : `<mrow>${e.map((s) => c(s)).join("")}</mrow>`;
}
function _(e, t) {
  return `<mi${t ? "" : ' mathvariant="normal"'}>${i(e)}</mi>`;
}
function U(e) {
  if (e === "") return '<mspace width="0em"/>';
  const t = e.codePointAt(0) ?? 0;
  return z(t) ? `<mo>${i(e)}</mo>` : j(t) ? `<mi>${i(e)}</mi>` : `<mo>${i(e)}</mo>`;
}
function z(e) {
  return e >= 8592 && e <= 10239 || e === 177 || e === 215 || e === 247 || // ±×÷
  e >= 10752 && e <= 11007;
}
function j(e) {
  return e >= 913 && e <= 1023 || e >= 8448 && e <= 8527 || e >= 119808 && e <= 120831;
}
function G(e, t, r) {
  return `<mfrac>${c(e)}${c(t)}</mfrac>`;
}
function Z(e, t, r) {
  return `<mrow><mo>(</mo><mfrac linethickness="0">${c(e)}${c(t)}</mfrac><mo>)</mo></mrow>`;
}
function V(e, t) {
  const r = c(e.base);
  return e.sub !== void 0 && e.sup !== void 0 ? `<msubsup>${r}${c(e.sub)}${c(e.sup)}</msubsup>` : e.sub !== void 0 ? `<msub>${r}${c(e.sub)}</msub>` : e.sup !== void 0 ? `<msup>${r}${c(e.sup)}</msup>` : r;
}
function Y(e, t, r) {
  const { open: s, close: n } = Q(e), o = t.map((h) => `<mtr>${h.map((k) => `<mtd>${c(k)}</mtd>`).join("")}</mtr>`).join("");
  let l = `<mtable>${o}</mtable>`;
  return e === "cases" ? `<mrow><mo>{</mo><mtable columnalign="left">${o}</mtable></mrow>` : s || n ? `<mrow><mo>${i(s)}</mo>${l}<mo>${i(n)}</mo></mrow>` : l;
}
function Q(e) {
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
      return { open: "", close: "" };
    default:
      return { open: "(", close: ")" };
  }
}
function W(e, t, r) {
  const s = D(e), n = c(t);
  return `<mstyle mathvariant="${s}">${n}</mstyle>`;
}
function X(e, t, r, s) {
  const n = e ? `<mo>${i(e)}</mo>` : "", o = t ? `<mo>${i(t)}</mo>` : "";
  return `<mrow>${n}${c(r)}${o}</mrow>`;
}
const J = {
  hat: "^",
  tilde: "~",
  dot: "˙",
  overline: "‾",
  bar: "‾",
  arrow: "⃗"
};
function T(e, t, r) {
  const s = J[e] ?? "^";
  return `<mover accent="true">${c(t)}<mo>${i(s)}</mo></mover>`;
}
function $(e, t) {
  const r = p(e);
  return `<span class="${t ? "kern kern-display" : "kern kern-inline"}">${r}</span>`;
}
function p(e, t) {
  switch (e.type) {
    case "seq":
      return K(e.nodes);
    case "atom":
      return ee(e.text, e.italic);
    case "number":
      return `<span class="kern-mn">${i(e.value)}</span>`;
    case "symbol":
      return te(e.char);
    case "operator":
      return `<span class="kern-mo">${i(e.text)}</span>`;
    case "text":
      return `<span class="kern-mtext">${i(e.value)}</span>`;
    case "frac":
      return re(e.num, e.den);
    case "sqrt":
      return ne(e.body);
    case "root":
      return ae(e.index, e.body);
    case "attach":
      return oe(e);
    case "matrix":
      return ie(e.kind, e.rows);
    case "style":
      return le(e.kind, e.body);
    case "lr":
      return ue(e.open, e.close, e.body);
    case "spacing":
      return de(e.kind);
    case "align":
      return '<span class="kern-align"></span>';
    case "binom":
      return se(e.top, e.bot);
    case "accent":
      return he(e.kind, e.body);
  }
}
function K(e, t) {
  return `<span class="kern-mrow">${e.map((r) => p(r)).join("")}</span>`;
}
function ee(e, t) {
  return `<span class="${t ? "kern-mi kern-mathnormal" : "kern-mi kern-mathrm"}">${i(e)}</span>`;
}
function te(e) {
  return e === "" ? "" : `<span class="kern-mo">${i(e)}</span>`;
}
function re(e, t, r) {
  return `<span class="kern-mfrac"><span class="kern-mfrac-num">${p(e)}</span><span class="kern-mfrac-den">${p(t)}</span></span>`;
}
function se(e, t, r) {
  return `<span class="kern-mrow"><span class="kern-mo">(</span><span class="kern-mfrac kern-mfrac-binom"><span class="kern-mfrac-num">${p(e)}</span><span class="kern-mfrac-den">${p(t)}</span></span><span class="kern-mo">)</span></span>`;
}
function ne(e, t) {
  return `<span class="kern-sqrt"><span class="kern-sqrt-sign">√</span><span class="kern-sqrt-body">${p(e)}</span></span>`;
}
function ae(e, t, r) {
  return `<span class="kern-sqrt kern-nroot"><span class="kern-nroot-index">${p(e)}</span><span class="kern-sqrt-sign">√</span><span class="kern-sqrt-body">${p(t)}</span></span>`;
}
function oe(e, t) {
  const r = p(e.base);
  return e.sub !== void 0 && e.sup !== void 0 ? `<span class="kern-msubsup"><span class="kern-msubsup-base">${r}</span><span class="kern-msubsup-scripts"><span class="kern-msup">${p(e.sup)}</span><span class="kern-msub">${p(e.sub)}</span></span></span>` : e.sub !== void 0 ? `<span class="kern-msub">${r}<span class="kern-msub-script">${p(e.sub)}</span></span>` : e.sup !== void 0 ? `<span class="kern-msup">${r}<span class="kern-msup-script">${p(e.sup)}</span></span>` : r;
}
function ie(e, t, r) {
  const { open: s, close: n } = ce(e), l = `<span class="kern-mtable">${t.map((h) => `<span class="kern-mtr">${h.map(
    (k) => `<span class="kern-mtd">${p(k)}</span>`
  ).join("")}</span>`).join("")}</span>`;
  return s || n ? '<span class="kern-mrow">' + (s ? `<span class="kern-mo kern-delimiter">${i(s)}</span>` : "") + l + (n ? `<span class="kern-mo kern-delimiter">${i(n)}</span>` : "") + "</span>" : l;
}
function ce(e) {
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
const pe = {
  cal: "kern-cal",
  bb: "kern-bb",
  frak: "kern-frak",
  bold: "kern-bold",
  italic: "kern-italic",
  upright: "kern-upright",
  sans: "kern-sans",
  mono: "kern-mono"
};
function le(e, t, r) {
  return `<span class="${pe[e] ?? "kern-upright"}">${p(t)}</span>`;
}
function ue(e, t, r, s) {
  return '<span class="kern-mrow">' + (e ? `<span class="kern-mo kern-delimiter">${i(e)}</span>` : "") + p(r) + (t ? `<span class="kern-mo kern-delimiter">${i(t)}</span>` : "") + "</span>";
}
const me = {
  hat: "^",
  tilde: "~",
  dot: "˙",
  overline: "‾",
  bar: "‾",
  arrow: "→"
};
function he(e, t, r) {
  const s = me[e] ?? "^";
  return `<span class="kern-mover"><span class="kern-mover-body">${p(t)}</span><span class="kern-mo kern-accent">${i(s)}</span></span>`;
}
function de(e) {
  return `<span class="kern-mspace" style="display:inline-block;width:${q(e)}"></span>`;
}
function ke(e) {
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
function we(e, t, r) {
  t.innerHTML = be(e, r);
}
function be(e, t) {
  const r = ke(t);
  try {
    const s = F(e), n = r.displayMode, o = r.output;
    if (o === "mathml")
      return x(s, n);
    if (o === "html")
      return $(s, n);
    const l = x(s, n), h = $(s, n);
    return `<span class="${n ? "kern kern-display" : "kern kern-inline"}" aria-hidden="true">${h}</span>${l}`;
  } catch (s) {
    if (s instanceof u) {
      if (r.throwOnError) throw s;
      const n = fe(s.message);
      return `<span class="kern-error" style="color:${r.errorColor}">${n}</span>`;
    }
    throw s;
  }
}
function fe(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export {
  u as ParseError,
  we as render,
  be as renderToString
};
