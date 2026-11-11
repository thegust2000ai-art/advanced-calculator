// حلال المعادلات والإحصاء — منطق خالص قابل للاختبار
import nerdamer from 'nerdamer';
import 'nerdamer/solve';
import 'nerdamer/calculus';
import 'nerdamer/algebra';
import { normalizeArabicNumerals } from './arabic';

const norm = (s: string) =>
  normalizeArabicNumerals(s).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

/** حل معادلة متعددة الحدود — ترجع مصفوفة الجذور الدقيقة كنص LaTeX أو null */
export function solvePolynomialTeX(equation: string, variable = 'x'): string | null {
  const cleaned = norm(equation).trim();
  if (!cleaned) return null;
  try {
    const eq = cleaned.includes('=') ? cleaned : `${cleaned}=0`;
    const result: any = (nerdamer as any).solve(eq, variable);
    const s: string = result?.toString?.() ?? '';
    // toString يرجع "{1, 2, 3}" — نحوّل الأقواس لصيغة مفهومة
    const inner = s.replace(/^\{|\}$/g, '').trim();
    if (!inner) return null;
    return inner;
  } catch {
    return null;
  }
}

/** اكتشاف المتغيرات (حروف مفردة) في معادلات خطية */
export function detectVariables(equations: string[]): string[] {
  const found = new Set<string>();
  const knownWords = new Set(['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'exp', 'abs', 'pi', 'eq']);
  for (const eq of equations) {
    const cleaned = norm(eq);
    for (const m of cleaned.matchAll(/[a-zA-Z]+/g)) {
      const w = m[0].toLowerCase();
      if (w.length === 1 && !knownWords.has(w)) found.add(w);
      else if (w.length > 1 && !knownWords.has(w)) {
        // نحذف الكلمات المعروفة ونبقي الحروف المفردة داخل الرموز (مثل xy => x و y؟ لا — نعتبرها رمزًا واحدًا)
      }
    }
  }
  // ترتيب تفضيلي: x, y, z ثم باقي الأبجدية
  const preferred = ['x', 'y', 'z', 'a', 'b', 'c', 'm', 'n'];
  return [...found].sort((a, b) => {
    const ia = preferred.indexOf(a), ib = preferred.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/** حل نظام خطي — ترجع Map (متغير => قيمة كنص كسري) أو null */
export function solveLinearSystem(equations: string[], vars: string[]): Array<[string, string]> | null {
  const cleaned = equations.map(e => norm(e).trim()).filter(Boolean);
  if (cleaned.length === 0 || vars.length === 0) return null;
  try {
    const res: any = (nerdamer as any).solveSystem(cleaned, vars);
    const s: string = res?.toString?.() ?? '';
    // الشكل: [{x => 8/3, y => 5/3}]
    const body = s.replace(/^\[?\{?/, '').replace(/\}?\]?$/, '');
    const pairs: Array<[string, string]> = [];
    for (const m of body.matchAll(/([a-zA-Z][a-zA-Z0-9_]*)\s*=>\s*([^,}]+)/g)) {
      pairs.push([m[1], m[2].trim()]);
    }
    return pairs.length > 0 ? pairs : null;
  } catch {
    return null;
  }
}

/** تحليل أسطر النقاط "x,y" أو "x y" أو "x; y" */
export function parsePointLines(src: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (const rawLine of src.split(/\n|;/)) {
    const line = norm(rawLine).trim();
    if (!line) continue;
    const m = line.match(/^\s*(-?[\d.eE+-]+)\s*[,،;\s]\s*(-?[\d.eE+-]+)\s*$/);
    if (!m) continue;
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
  }
  return points;
}

export interface RegressionResult {
  n: number;
  sumX: number;
  sumY: number;
  meanX: number;
  meanY: number;
  sumXY: number;
  sumXX: number;
  sumYY: number;
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
}

/** انحدار خطي بالمربعات الصغرى */
export function linearRegression(points: Array<{ x: number; y: number }>): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (const p of points) {
    sumX += p.x; sumY += p.y;
    sumXY += p.x * p.y; sumXX += p.x * p.x; sumYY += p.y * p.y;
  }
  const meanX = sumX / n, meanY = sumY / n;
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null; // كل x متساوية
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = meanY - slope * meanX;
  const rDenominator = Math.sqrt(denominator * (n * sumYY - sumY * sumY));
  const r = rDenominator === 0 ? 0 : (n * sumXY - sumX * sumY) / rDenominator;
  return { n, sumX, sumY, meanX, meanY, sumXY, sumXX, sumYY, slope, intercept, r, rSquared: r * r };
}
