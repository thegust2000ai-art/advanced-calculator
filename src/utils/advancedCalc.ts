// المحرك المتقدم للحاسبة العلمية — mathjs (وحدات/مصفوفات/إحصاء/BigNumber) + nerdamer (حل رمزي واشتقاق وتكامل)
import { create, all } from 'mathjs';
import nerdamer from 'nerdamer';
import 'nerdamer/solve';
import 'nerdamer/calculus';
import 'nerdamer/algebra';
import { normalizeArabicNumerals, toArabicNumerals } from './arabic';

// نمط الرقم والزوايا — نعرّفه مرة واحدة عند الاستيراد
const math = create(all, { number: 'BigNumber', precision: 24 });

let degMode = true;
export function setAdvancedAngleMode(mode: 'DEG' | 'RAD'): void {
  degMode = mode === 'DEG';
}

const toRad = (x: any): number => {
  const n = typeof x?.toNumber === 'function' ? x.toNumber() : Number(x);
  return (isNaN(n) ? 0 : n) * Math.PI / 180;
};
const toDeg = (x: any): number => {
  const n = typeof x?.toNumber === 'function' ? x.toNumber() : Number(x);
  return (isNaN(n) ? 0 : n) * 180 / Math.PI;
};

const rawTrig = { sin: math.sin, cos: math.cos, tan: math.tan, asin: math.asin, acos: math.acos, atan: math.atan };

math.import({
  sin: (x: any) => (degMode ? rawTrig.sin(toRad(x)) : rawTrig.sin(x)),
  cos: (x: any) => (degMode ? rawTrig.cos(toRad(x)) : rawTrig.cos(x)),
  tan: (x: any) => (degMode ? rawTrig.tan(toRad(x)) : rawTrig.tan(x)),
  asin: (x: any) => (degMode ? toDeg(rawTrig.asin(x)) : rawTrig.asin(x)),
  acos: (x: any) => (degMode ? toDeg(rawTrig.acos(x)) : rawTrig.acos(x)),
  atan: (x: any) => (degMode ? toDeg(rawTrig.atan(x)) : rawTrig.atan(x)),
}, { override: true });

// ثابت π مع أرقام عربية مشحونة
math.import({ 'π': math.bignumber(Math.PI) });

export interface AdvancedResult { ok: boolean; output?: string; error?: string; /** الناتج بصيغة LaTeX يُعرض عبر KaTeX كعرض طبيعي */ isTeX?: boolean }

/** تحويل التعبير للصيغة التي يفهمها mathjs (أرقام عربية، رموز الضرب والقسمة، √، π) */
function normalizeForMathjs(src: string): string {
  return normalizeArabicNumerals(src)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, ' pi ')
    // mathjs يفهم % كـ modulo ثنائية — نجعلها كسرًا مئويًا (أسلوب كاسيو)
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
}

function formatOutput(v: any): string {
  try {
    if (v === undefined || v === null) return '';
    return math.format(v, { precision: 12, notation: 'auto' });
  } catch {
    try { return String(v); } catch { return ''; }
  }
}

/** تقسيم وسائط nerdamer على الفواصل العلوية (يحترم الأقواس والاقتباسات) */
function splitArgs(src: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '', inQuote: string | null = null;
  for (const ch of src) {
    if (inQuote) { cur += ch; if (ch === inQuote) inQuote = null; continue; }
    if (ch === '"' || ch === "'") { inQuote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim().replace(/^["']+|["']+$/g, ''));
}

/** تشغيل دالة على nerdamer وإرجاع LaTeX إن أمكن (للعرض الطبيعي عبر KaTeX) */
function nerdamerTeX(exprBuilder: () => any): string {
  const result: any = exprBuilder();
  try {
    if (typeof result?.toTeX === 'function') return result.toTeX();
  } catch { /* fallback to toString */ }
  return String(result?.toString?.() ?? result);
}

const SYMBOLIC_FNS = ['solve', 'diff', 'integrate', 'factor', 'expand', 'simplify', 'gcd', 'sum'] as const;
type SymbolicFn = (typeof SYMBOLIC_FNS)[number];

function runSymbolic(fn: SymbolicFn, argSrc: string): string {
  const args = splitArgs(argSrc);
  switch (fn) {
    case 'solve': {
      let eq = args[0] ?? '';
      if (!eq.includes('=')) eq = `${eq}=0`;
      const v = args[1] || 'x';
      // nerdamer.solve ترجع كائن مجموعة — toTeX إن توفر، وإلا toString مع أقواس { } ← \{ \}
      const result: any = (nerdamer as any).solve(eq, v);
      try { if (typeof result?.toTeX === 'function') return result.toTeX(); } catch { /* fallback */ }
      const s: string = result?.toString?.() ?? '';
      // "{1, 2, 3}" → "1,\;2,\;3" ليظهر طبيعيًا في KaTeX
      return `x = ${s.replace(/^\{|\}$/g, '').trim()}`;
    }
    case 'diff':
      return nerdamerTeX(() => nerdamer(`diff(${args[0]}, ${args[1] || 'x'})`));
    case 'integrate':
      return `${nerdamerTeX(() => nerdamer.integrate(args[0], args[1] || 'x'))} + C`;
    case 'factor':
      return nerdamerTeX(() => nerdamer(`factor(${args[0]})`));
    case 'expand':
      return nerdamerTeX(() => nerdamer(`expand(${args[0]})`));
    case 'simplify':
      return nerdamerTeX(() => nerdamer(`simplify(${args[0]})`));
    case 'gcd':
      return nerdamerTeX(() => nerdamer(`gcd(${args[0]}, ${args[1] ?? ''})`));
    case 'sum':
      return nerdamerTeX(() => nerdamer(`sum(${args[0]}, ${args[1] ?? 'i'}, ${args[2] ?? '1'}, ${args[3] ?? '5'})`));
    default:
      throw new Error('دالة رمزية غير معروفة');
  }
}

export function evaluateAdvanced(src: string): AdvancedResult {
  const trimmed = src.trim();
  if (!trimmed) return { ok: false, error: '' };

  // الدوال الرمزية عبر nerdamer: solve("x^2-4=0","x") · diff("x^3","x") · integrate · factor · expand · simplify · gcd · sum
  const symMatch = trimmed.match(new RegExp(`^(${SYMBOLIC_FNS.join('|')})\\s*\\((.*)\\)\\s*$`, 'is'));
  if (symMatch) {
    try {
      const output = runSymbolic(symMatch[1].toLowerCase() as SymbolicFn, symMatch[2]);
      return { ok: true, output, isTeX: true };
    } catch {
      return { ok: false, error: 'تعذر تنفيذ الصيغة الرمزية — راجع الأقواس والوسائط' };
    }
  }

  try {
    const result = math.evaluate(normalizeForMathjs(trimmed));
    return { ok: true, output: formatOutput(result) };
  } catch (e: any) {
    const msg: string = e?.message || '';
    if (/Unexpected symbol|Undefined symbol|Value expected/i.test(msg)) {
      return { ok: false, error: 'صيغة غير مفهومة — جرّب: 5 km to m · sin(30) · solve("x^2-4=0","x")' };
    }
    if (/Cannot convert|unit/i.test(msg)) {
      return { ok: false, error: 'تعذر التحويل — راجع الوحدات (مثال: 5 km to m)' };
    }
    return { ok: false, error: 'تعذر حساب الصيغة — راجعها بهدوء' };
  }
}

/** عرض نتيجة mathjs/nerdamer بشكل أجمل (أرقام عربية) — نُبقي / كما هي لأنها تظهر في الوحدات والكسور */
export function formatAdvancedOutput(raw: string): string {
  return toArabicNumerals(
    raw
      .replace(/\s*,\s*/g, ' ، ')
      .replace(/\*/g, ' × ')
      .trim()
  );
}
