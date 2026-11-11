// محرك صيغ آمن للآلة الحاسبة — بدون eval/Function
// يدعم: + − × ÷ ^ (أس يميني) أقواس % عاملي √ π e دوال مثلثية (DEG/RAD) ln/log/exp/abs أرقام عربية هندية
import { normalizeArabicNumerals, toArabicNumerals } from './arabic';

type TokType = 'num' | 'op' | 'lp' | 'rp' | 'func' | 'percent' | 'fact' | 'const';
interface Tok { type: TokType; value?: number | string }

export function tokenize(src: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i, dots = 0;
      while (j < src.length && /[0-9.]/.test(src[j])) { if (src[j] === '.') dots++; j++; }
      const raw = src.slice(i, j);
      const n = parseFloat(raw);
      if (isNaN(n) || dots > 1) throw new Error('عدد غير صحيح');
      tokens.push({ type: 'num', value: n });
      i = j; continue;
    }
    if (/[a-zA-Z_π]/.test(ch) || ch === '√') {
      if (ch === '√') { tokens.push({ type: 'func', value: 'sqrt' }); i++; continue; }
      let j = i;
      while (j < src.length && /[a-zA-Z_π]/.test(src[j])) j++;
      const name = src.slice(i, j).toLowerCase();
      if (name === 'π' || name === 'pi') tokens.push({ type: 'const', value: Math.PI });
      else if (name === 'e') tokens.push({ type: 'const', value: Math.E });
      else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'sqrt', 'exp', 'abs'].includes(name)) tokens.push({ type: 'func', value: name });
      else throw new Error(`دالة غير معروفة: ${name}`);
      i = j; continue;
    }
    const opMap: Record<string, string> = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/', '^': '^' };
    if (opMap[ch]) { tokens.push({ type: 'op', value: opMap[ch] }); i++; continue; }
    if (ch === '(') { tokens.push({ type: 'lp' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rp' }); i++; continue; }
    if (ch === '%') { tokens.push({ type: 'percent' }); i++; continue; }
    if (ch === '!') { tokens.push({ type: 'fact' }); i++; continue; }
    throw new Error(`رمز غير معروف: ${ch}`);
  }
  return tokens;
}

function factorial(v: number): number {
  if (v < 0) throw new Error('العاملي لعدد سالب غير معرّف');
  if (!Number.isInteger(v)) throw new Error('العاملي يتطلب عدداً صحيحاً');
  if (v > 170) return Infinity;
  let r = 1;
  for (let k = 2; k <= v; k++) r *= k;
  return r;
}

function applyFunc(name: string, x: number, deg: boolean): number {
  const toRad = (v: number) => (deg ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (deg ? (v * 180) / Math.PI : v);
  switch (name) {
    case 'sin': return Math.sin(toRad(x));
    case 'cos': return Math.cos(toRad(x));
    case 'tan': return Math.tan(toRad(x));
    case 'asin': return fromRad(Math.asin(x));
    case 'acos': return fromRad(Math.acos(x));
    case 'atan': return fromRad(Math.atan(x));
    case 'ln': if (x <= 0) throw new Error('ln يتطلب عدداً موجباً'); return Math.log(x);
    case 'log': if (x <= 0) throw new Error('log يتطلب عدداً موجباً'); return Math.log10(x);
    case 'sqrt': if (x < 0) throw new Error('الجذر التربيعي لعدد سالب'); return Math.sqrt(x);
    case 'exp': return Math.exp(x);
    case 'abs': return Math.abs(x);
    default: throw new Error(`دالة غير معروفة: ${name}`);
  }
}

class Parser {
  private pos = 0;
  constructor(private tokens: Tok[], private deg: boolean) {}
  private peek(): Tok | undefined { return this.tokens[this.pos]; }
  private next(): Tok | undefined { return this.tokens[this.pos++]; }
  parse(): number {
    if (this.tokens.length === 0) throw new Error('الصيغة فارغة');
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('صيغة غير صحيحة');
    return v;
  }
  private parseExpr(): number {
    let v = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        const op = this.next()!.value;
        const rhs = this.parseTerm();
        v = op === '+' ? v + rhs : v - rhs;
      } else return v;
    }
  }
  private parseTerm(): number {
    let v = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        const op = this.next()!.value;
        const rhs = this.parseFactor();
        if (op === '/' && rhs === 0) throw new Error('قسمة على صفر');
        v = op === '*' ? v * rhs : v / rhs;
      } else return v;
    }
  }
  private parseFactor(): number {
    const base = this.parseUnary();
    const t = this.peek();
    if (t?.type === 'op' && t.value === '^') {
      this.next();
      const exp = this.parseFactor(); // تجميع يميني
      return Math.pow(base, exp);
    }
    return base;
  }
  private parseUnary(): number {
    const t = this.peek();
    if (t?.type === 'op' && t.value === '-') { this.next(); return -this.parseUnary(); }
    if (t?.type === 'op' && t.value === '+') { this.next(); return this.parseUnary(); }
    return this.parsePostfix();
  }
  private parsePostfix(): number {
    let v = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'percent') { this.next(); v = v / 100; continue; }
      if (t?.type === 'fact') { this.next(); v = factorial(v); continue; }
      return v;
    }
  }
  private parsePrimary(): number {
    const t = this.next();
    if (!t) throw new Error('صيغة غير مكتملة');
    if (t.type === 'num' || t.type === 'const') return t.value as number;
    if (t.type === 'func') {
      const name = String(t.value);
      const open = this.next();
      if (open?.type !== 'lp') throw new Error(`الصيغة تحتاج ( بعد ${name}`);
      const arg = this.parseExpr();
      const close = this.next();
      if (close?.type !== 'rp') throw new Error('قوس مفقود )');
      return applyFunc(name, arg, this.deg);
    }
    if (t.type === 'lp') {
      const v = this.parseExpr();
      const close = this.next();
      if (close?.type !== 'rp') throw new Error('قوس مفقود )');
      return v;
    }
    throw new Error('صيغة غير صحيحة');
  }
}

export function evaluateExpression(src: string, deg: boolean): number {
  const norm = normalizeArabicNumerals(src)
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  return new Parser(tokenize(norm), deg).parse();
}

/** تنسيق رقم للعرض بأسلوب كاسيو مع أرقام عربية هندية */
export function formatSci(n: number): string {
  if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'خطأ';
  const abs = Math.abs(n);
  if (n !== 0 && (abs >= 1e13 || abs < 1e-9)) {
    return toArabicNumerals(n.toExponential(6));
  }
  const rounded = parseFloat(n.toPrecision(12));
  return toArabicNumerals(rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
}

/** عرض الصيغة بشكل أجمل مع أرقام عربية هندية */
export function displayExpr(src: string): string {
  return toArabicNumerals(
    src.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−').replace(/sqrt\(/g, '√(')
  );
}
