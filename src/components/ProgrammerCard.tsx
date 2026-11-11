import { useMemo, useState } from 'react';
import { UI } from '../utils/uiTheme';
import { toArabicNumerals } from '../utils/arabic';

type Base = 'DEC' | 'HEX' | 'OCT' | 'BIN';
type ProgTab = 'programmer' | 'rpn';

/* ============ محرك BigInt للوضع المبرمج ============ */
type PTok = { t: 'num' | 'op' | 'lp' | 'rp'; v?: string };

function tokenizeProgrammer(src: string, base: Base): PTok[] {
  const digitRe = base === 'DEC' ? /[0-9]/ : base === 'HEX' ? /[0-9a-fA-F]/ : base === 'OCT' ? /[0-7]/ : /[01]/;
  const tokens: PTok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (digitRe.test(ch)) {
      let j = i;
      while (j < src.length && digitRe.test(src[j])) j++;
      tokens.push({ t: 'num', v: src.slice(i, j) });
      i = j; continue;
    }
    if (ch === '<') { if (src[i + 1] === '<') { tokens.push({ t: 'op', v: '<<' }); i += 2; continue; } throw new Error('للإزاحة اكتب <<'); }
    if (ch === '>') { if (src[i + 1] === '>') { tokens.push({ t: 'op', v: '>>' }); i += 2; continue; } throw new Error('للإزاحة اكتب >>'); }
    if (ch === '(') { tokens.push({ t: 'lp' }); i++; continue; }
    if (ch === ')') { tokens.push({ t: 'rp' }); i++; continue; }
    if ('+-*/%&|^~'.includes(ch)) { tokens.push({ t: 'op', v: ch }); i++; continue; }
    throw new Error(`رمز غير معروف: ${ch}`);
  }
  return tokens;
}

class ProgrammerParser {
  private pos = 0;
  constructor(private tokens: PTok[], private radix: number) {}
  private peek() { return this.tokens[this.pos]; }
  private next() { return this.tokens[this.pos++]; }
  parse(): bigint {
    const v = this.parseOr();
    if (this.pos < this.tokens.length) throw new Error('صيغة غير صحيحة — فائض رموز');
    return v;
  }
  private bin(parseNext: () => bigint, ops: string[]): bigint {
    let v = parseNext();
    for (;;) {
      const t = this.peek();
      if (t?.t === 'op' && ops.includes(String(t.v))) {
        const op = this.next()!.v;
        const rhs = parseNext();
        switch (op) {
          case '|': v = v | rhs; break;
          case '^': v = v ^ rhs; break;
          case '&': v = v & rhs; break;
          case '<<': v = v << rhs; break;
          case '>>': v = v >> rhs; break;
          case '+': v = v + rhs; break;
          case '-': v = v - rhs; break;
          case '*': v = v * rhs; break;
          case '/': if (rhs === 0n) throw new Error('قسمة على صفر'); v = v / rhs; break;
          case '%': if (rhs === 0n) throw new Error('قسمة على صفر'); v = v % rhs; break;
        }
      } else return v;
    }
  }
  private parseOr(): bigint { return this.bin(() => this.parseXor(), ['|']); }
  private parseXor(): bigint { return this.bin(() => this.parseAnd(), ['^']); }
  private parseAnd(): bigint { return this.bin(() => this.parseShift(), ['&']); }
  private parseShift(): bigint { return this.bin(() => this.parseAdd(), ['<<', '>>']); }
  private parseAdd(): bigint { return this.bin(() => this.parseMul(), ['+', '-']); }
  private parseMul(): bigint { return this.bin(() => this.parseUnary(), ['*', '/', '%']); }
  private parseUnary(): bigint {
    const t = this.peek();
    if (t?.t === 'op' && t.v === '-') { this.next(); return -this.parseUnary(); }
    if (t?.t === 'op' && t.v === '+') { this.next(); return this.parseUnary(); }
    if (t?.t === 'op' && t.v === '~') { this.next(); return ~this.parseUnary(); }
    return this.parsePrimary();
  }
  private parsePrimary(): bigint {
    const t = this.next();
    if (!t) throw new Error('صيغة غير مكتملة');
    if (t.t === 'num') {
      // تحليل يدوي بدقة BigInt كاملة — آمن لأي طول
      const baseB = BigInt(this.radix);
      let acc = 0n;
      for (const ch of String(t.v).toLowerCase()) {
        const d = parseInt(ch, this.radix);
        acc = acc * baseB + BigInt(d);
      }
      return acc;
    }
    if (t.t === 'lp') {
      const v = this.parseOr();
      const close = this.next();
      if (close?.t !== 'rp') throw new Error('قوس مفقود )');
      return v;
    }
    throw new Error('صيغة غير صحيحة');
  }
}

function evalProgrammer(src: string, base: Base): bigint | null {
  try {
    const radix = base === 'DEC' ? 10 : base === 'HEX' ? 16 : base === 'OCT' ? 8 : 2;
    if (!src.trim()) return null;
    return new ProgrammerParser(tokenizeProgrammer(src, base), radix).parse();
  } catch {
    return null;
  }
}

const MASK64 = (1n << 64n) - 1n;
const group4 = (bin: string) => bin.padStart(Math.ceil(bin.length / 4) * 4, '0').replace(/(\d{4})(?=\d)/g, '$1 ');

/* ============ مكوّن البطاقة ============ */
export default function ProgrammerCard() {
  const t = UI;
  const [tab, setTab] = useState<ProgTab>('programmer');

  /* ─── وضع المبرمج ─── */
  const [base, setBase] = useState<Base>('DEC');
  const [exprText, setExprText] = useState('255 & 15');
  const progResult = useMemo(() => evalProgrammer(exprText, base), [exprText, base]);
  const digitKeys: Record<Base, string[]> = {
    DEC: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00'],
    HEX: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'A', 'B', 'C', 'D', 'E', 'F'],
    OCT: ['7', '6', '5', '4', '3', '2', '1', '0', '00'],
    BIN: ['1', '0'],
  };
  const progDigitInput = (d: string) => setExprText(p => p + d);
  const progOpInput = (k: string) => setExprText(p => `${p} ${k} `);

  /* ─── وضع RPN ─── */
  const [stack, setStack] = useState<number[]>([]);
  const [rpnInput, setRpnInput] = useState('');
  const rpnOp = (op: string) => {
    setStack(prev => {
      const s = [...prev];
      if (op === 'ENTER') {
        if (rpnInput.trim()) { const v = parseFloat(rpnInput); if (!isNaN(v)) s.push(v); setRpnInput(''); }
        else if (s.length > 0) s.push(s[s.length - 1]);
        return s;
      }
      if (op === 'DROP') { s.pop(); return s; }
      if (op === 'SWAP') { const n = s.length; if (n >= 2) { const a = s[n - 1]; s[n - 1] = s[n - 2]; s[n - 2] = a; } return s; }
      if (op === 'DUP') { if (s.length > 0) s.push(s[s.length - 1]); return s; }
      if (op === 'CHS') {
        if (rpnInput) { setRpnInput(p => (p.startsWith('-') ? p.slice(1) : '-' + p)); return s; }
        if (s.length) s[s.length - 1] = -s[s.length - 1];
        return s;
      }
      if (op === 'C') { setRpnInput(''); return []; }
      // عمليات أحادية على أعلى المكدس (أو على الرقم المكتوب مباشرة)
      const applyUnary = (fn: (x: number) => number) => {
        const typed = rpnInput.trim() ? parseFloat(rpnInput) : NaN;
        if (!isNaN(typed)) { setRpnInput(''); s.push(fn(typed)); return s; }
        const x = s.pop();
        if (x === undefined) return s;
        s.push(fn(x));
        return s;
      };
      if (op === 'SQRT') return applyUnary(x => (x < 0 ? NaN : Math.sqrt(x)));
      if (op === 'SQR') return applyUnary(x => x * x);
      if (op === 'INV') return applyUnary(x => (x === 0 ? NaN : 1 / x));
      if (op === 'ABS') return applyUnary(x => Math.abs(x));
      if (op === 'LN') return applyUnary(x => (x <= 0 ? NaN : Math.log(x)));
      if (op === 'EXP') return applyUnary(x => Math.exp(x));
      const apply = (fn: (a: number, b: number) => number) => {
        let a = s.pop();
        let b = s.pop();
        const typed = rpnInput.trim() ? parseFloat(rpnInput) : NaN;
        if (a === undefined || isNaN(Number(a))) {
          if (!isNaN(typed)) a = typed; else return s;
        }
        if (b === undefined || isNaN(Number(b))) {
          if (!isNaN(typed)) { b = a; a = typed; setRpnInput(''); }
          else return s;
        } else if (!isNaN(typed)) {
          setRpnInput('');
        }
        const r = fn(Number(b), Number(a));
        s.push(r);
        return s;
      };
      switch (op) {
        case '+': return apply((a, b) => a + b);
        case '-': return apply((a, b) => a - b);
        case '*': return apply((a, b) => a * b);
        case '/': return apply((a, b) => (b === 0 ? NaN : a / b));
        case '%': return apply((a, b) => (b === 0 ? NaN : a % b));
        case '^': return apply((a, b) => Math.pow(a, b));
        default: return s;
      }
    });
  };

  /* تنسيقات الأرقام الكبيرة */
  const fmtBig = (v: bigint) => toArabicNumerals(v.toString());
  const fmtHex = (v: bigint) => '0x' + (v & MASK64).toString(16).toUpperCase();
  const fmtOct = (v: bigint) => '0o' + (v & MASK64).toString(8);
  const fmtBin = (v: bigint) => '0b' + group4((v & MASK64).toString(2));

  return (
    <div className="rounded-2xl shadow p-4" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderInlineStart: '4px solid #34d399' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-black" style={{ color: t.text }}>💻 المبرمج و RPN</h3>
          <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>وضع المبرمج بكامل قواعد الأنظمة الأربعة + وضع RPN (مكدس زي آلات HP)</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: t.border }}>
          {([['programmer', '💻 المبرمج'], ['rpn', '⬆ RPN']] as [ProgTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-[11px] font-black transition ${tab === id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* ════════ وضع المبرمج ════════ */}
      {tab === 'programmer' && (
        <div className="mt-3">
          {/* اختيار النظام */}
          <div className="flex gap-1" dir="ltr">
            {(['DEC', 'HEX', 'OCT', 'BIN'] as Base[]).map(b => (
              <button key={b} onClick={() => setBase(b)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-black font-mono transition ${base === b ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{b}</button>
            ))}
          </div>

          {/* شاشة التعبير */}
          <input dir="ltr" value={exprText} onChange={e => setExprText(e.target.value)}
            spellCheck={false}
            className="w-full mt-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-lg font-mono font-black text-emerald-300 outline-none focus:border-emerald-600 text-left"
            placeholder="255 & 15" autoFocus />

          {/* النتيجة بكل الأنظمة */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5" dir="ltr">
            {[
              ['DEC', progResult === null ? '—' : fmtBig(progResult)],
              ['HEX', progResult === null ? '—' : fmtHex(progResult)],
              ['OCT', progResult === null ? '—' : fmtOct(progResult)],
              ['BIN', progResult === null ? '—' : fmtBin(progResult)],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg bg-slate-800 px-2 py-1.5">
                <div className="text-[8px] font-black text-slate-500">{k as string}</div>
                <div className="text-[10px] font-mono font-bold text-emerald-300 break-all">{v as string}</div>
              </div>
            ))}
          </div>
          {progResult === null && exprText.trim() && <div className="text-[9px] text-red-400 font-bold mt-1">تعذر الحساب — راجع الصيغة والأرقام حسب النظام المختار</div>}

          {/* لوحة المفاتيح */}
          <div className="flex flex-wrap gap-1 mt-2" dir="ltr">
            {base === 'HEX' && ['A', 'B', 'C', 'D', 'E', 'F'].map(d => (
              <button key={d} onClick={() => progDigitInput(d)} className="w-11 h-9 rounded-lg bg-indigo-200 text-indigo-900 text-xs font-mono font-black hover:bg-indigo-300">{d}</button>
            ))}
            {digitKeys[base].map(d => (
              <button key={d} onClick={() => progDigitInput(d)} className="w-11 h-9 rounded-lg bg-slate-700 text-white text-xs font-mono font-black hover:bg-slate-600">{d}</button>
            ))}
            {['+', '-', '*', '/', '%', '&', '|', '^', '~', '<<', '>>', '(', ')'].map(k => (
              <button key={k} onClick={() => progOpInput(k)} className="w-11 h-9 rounded-lg bg-amber-500 text-slate-900 text-[10px] font-mono font-black hover:bg-amber-400">{k}</button>
            ))}
            <button onClick={() => setExprText(p => p.slice(0, -1))} className="w-11 h-9 rounded-lg bg-slate-500 text-white text-xs font-mono font-black hover:bg-slate-400">⌫</button>
            <button onClick={() => setExprText('')} className="w-11 h-9 rounded-lg bg-red-600 text-white text-xs font-mono font-black hover:bg-red-500">C</button>
          </div>
          <div className="mt-1.5 text-[8px]" style={{ color: t.textMuted }}>العمليات: AND(&amp;) · OR(|) · XOR(^) · NOT(~) · إزاحة &lt;&lt; &gt;&gt; — بحساب BigInt بدقة 64-بت مع مكمل اثنين للسالب</div>
        </div>
      )}

      {/* ════════ وضع RPN ════════ */}
      {tab === 'rpn' && (
        <div className="mt-3" dir="ltr">
          {/* المكدس — t z y x */}
          <div className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 font-mono">
            {['t', 'z', 'y', 'x'].map((reg, i) => {
              const depth = stack.length;
              const idx = depth - (4 - i);
              const val = idx >= 0 ? stack[idx] : undefined;
              const isX = reg === 'x';
              return (
                <div key={reg} className="flex items-center justify-between py-0.5">
                  <span className={`text-[10px] font-black ${isX ? 'text-amber-400' : 'text-slate-500'}`}>{reg}</span>
                  <span className={`${isX ? 'text-xl text-emerald-300' : 'text-sm text-slate-400'} font-black break-all text-right`}>
                    {val === undefined ? '' : toArabicNumerals(String(parseFloat(val.toPrecision(12))))}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-slate-700 mt-1 pt-1">
              <span className="text-[10px] text-slate-500 font-black">إدخال</span>
              <span className="text-base text-amber-200 font-black">{toArabicNumerals(rpnInput) || '٠'}</span>
            </div>
          </div>

          {/* لوحة RPN — أشكال مفاتيح HiPER */}
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {/* صف العمليات العلمية */}
            {([['√x', 'SQRT'], ['x²', 'SQR'], ['1/x', 'INV'], ['yˣ', '^'], ['|x|', 'ABS']] as [string, string][]).map(([label, op]) => (
              <button key={op} onClick={() => rpnOp(op)} className="h-9 rounded-lg border border-teal-800 bg-teal-950/80 text-teal-300 text-[11px] font-mono font-black hover:bg-teal-900/80 hover:border-teal-700 transition">{label}</button>
            ))}
            {/* صف التحكم */}
            {([['C', 'C'], ['CHS', 'CHS'], ['x⇄y', 'SWAP'], ['DUP', 'DUP'], ['DROP', 'DROP']] as [string, string][]).map(([label, op]) => (
              <button key={op} onClick={() => rpnOp(op)} className="h-9 rounded-lg border border-indigo-900 bg-indigo-950/80 text-indigo-300 text-[11px] font-black hover:bg-indigo-900/70 hover:border-indigo-800 transition">{label}</button>
            ))}
            {['7', '8', '9', '÷'].map(k => (
              <button key={k} onClick={() => (k === '÷' ? rpnOp('/') : setRpnInput(p => p + k))} className={`h-11 rounded-xl text-base font-black transition active:scale-95 ${k === '÷' ? 'bg-amber-500/90 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'}`}>{k}</button>
            ))}
            <button onClick={() => rpnOp('ENTER')} className="h-11 rounded-xl bg-emerald-600 text-white text-[12px] font-black hover:bg-emerald-500 active:scale-95 transition row-span-2" style={{ gridRow: 'span 2' }}>ENTER</button>
            {['4', '5', '6', '×'].map(k => (
              <button key={k} onClick={() => (k === '×' ? rpnOp('*') : setRpnInput(p => p + k))} className={`h-11 rounded-xl text-base font-black transition active:scale-95 ${k === '×' ? 'bg-amber-500/90 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'}`}>{k}</button>
            ))}
            {['1', '2', '3', '−'].map(k => (
              <button key={k} onClick={() => (k === '−' ? rpnOp('-') : setRpnInput(p => p + k))} className={`h-11 rounded-xl text-base font-black transition active:scale-95 ${k === '−' ? 'bg-amber-500/90 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'}`}>{k}</button>
            ))}
            <button onClick={() => rpnOp('+')} className="h-11 rounded-xl bg-amber-500/90 text-slate-900 text-base font-black hover:bg-amber-400 active:scale-95 transition row-span-2" style={{ gridRow: 'span 2' }}>+</button>
            {['0', '.', '00', '%'].map(k => (
              <button key={k} onClick={() => (k === '%' ? rpnOp('%') : setRpnInput(p => p + k))} className={`h-11 rounded-xl text-base font-black transition active:scale-95 ${k === '%' ? 'bg-amber-500/90 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'}`}>{k}</button>
            ))}
            <button onClick={() => setRpnInput(p => p.slice(0, -1))} className="h-11 rounded-xl bg-slate-700/80 text-slate-200 text-sm font-black hover:bg-slate-600 active:scale-95 transition border border-slate-600" title="مسح آخر رقم">⌫</button>
          </div>
          <p className="mt-1.5 text-[8px] leading-4" style={{ color: t.textMuted }}>نظام RPN: اكتب الرقم ثم ENTER ثم العملية — مثل آلات HP. مثال: «5 ENTER 2 +» = ٧ · «9 ENTER 3 ÷» = ٣. العمليات: + − × ÷ % yˣ √x x² 1/x |x| — C يمسح، DUP يكرر الأعلى، x⇄y يبدل، DROP يحذف الأعلى.</p>
        </div>
      )}
    </div>
  );
}

