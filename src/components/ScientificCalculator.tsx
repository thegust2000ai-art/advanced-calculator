import { useCallback, useEffect, useState } from 'react';
import { toArabicNumerals, normalizeArabicNumerals } from '../utils/arabic';
import { evaluateExpression, formatSci, displayExpr } from '../utils/safeCalc';
import { evaluateAdvanced, formatAdvancedOutput, setAdvancedAngleMode } from '../utils/advancedCalc';
import TeX from './TeX';
import { PHYSICAL_CONSTANTS } from '../utils/constants';

/* =============================================================
   الحاسبة العلمية — مواصفات كاسيو بأربعة ثيمات
   (كاسيو داكن / fx-991 / HiPER / TI-84)
   بوضعين: أساسي (safeCalc بدون eval) · 🔬 متقدم (mathjs + nerdamer)
   ============================================================= */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const latinNumber = (n: number) => String(parseFloat(n.toPrecision(12)));

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const SCI_THEMES = {
  default: {
    label: 'كاسيو داكن',
    cardBg: '#0f172a', cardBorder: '#1e293b',
    screenBg: '#022c22', screenBorder: '#064e3b',
    screenText: '#6ee7b7', screenDim: 'rgba(110,231,183,0.62)',
    headerText: '#f1f5f9', headerSub: '#94a3b8',
    numKey: 'bg-slate-700 text-white hover:bg-slate-600',
    opKey: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    sciKey: 'bg-indigo-900 text-indigo-100 hover:bg-indigo-800 text-xs',
    memKey: 'bg-teal-700 text-teal-50 hover:bg-teal-600 text-xs',
    utilKey: 'bg-slate-500 text-white hover:bg-slate-400',
    eqKey: 'bg-emerald-600 text-white hover:bg-emerald-500 text-2xl',
    dangerKey: 'bg-red-600 text-white hover:bg-red-500',
  },
  // كاسيو fx-991ES/DE — جسم داكن، أزرار كريمية، شاشة زيتونية LCD
  casio991: {
    label: 'كاسيو fx‑991',
    cardBg: '#20242a', cardBorder: '#3a3f47',
    screenBg: '#b9c39f', screenBorder: '#8a9370',
    screenText: '#141d10', screenDim: 'rgba(20,29,16,0.62)',
    headerText: '#f5f3ea', headerSub: '#b9b6a6',
    numKey: 'bg-[#e9e4d6] text-[#1d1d1d] hover:bg-[#fbf8ee]',
    opKey: 'bg-[#e8853d] text-[#2b1608] hover:bg-[#f5a054]',
    sciKey: 'bg-[#2f3b52] text-[#cdd7ee] hover:bg-[#3b4a68] text-xs',
    memKey: 'bg-[#54406b] text-[#ecd9ff] hover:bg-[#69507f] text-xs',
    utilKey: 'bg-[#565c66] text-[#f2f2f2] hover:bg-[#696f7a]',
    eqKey: 'bg-[#b8442b] text-[#ffe8df] hover:bg-[#cf5a3c] text-2xl',
    dangerKey: 'bg-[#a13a2a] text-[#ffd9d0] hover:bg-[#b8523f]',
  },
  // HiPER Calc — داكن عصري، زمردي/سياني على كحلي
  hiper: {
    label: 'HiPER',
    cardBg: '#0e1420', cardBorder: '#1f2b3d',
    screenBg: '#0a1f2e', screenBorder: '#123b52',
    screenText: '#3df0a5', screenDim: 'rgba(61,240,165,0.58)',
    headerText: '#e8f4ff', headerSub: '#7f9ab5',
    numKey: 'bg-[#1b2735] text-[#dff0ff] hover:bg-[#24344a]',
    opKey: 'bg-[#f97316] text-[#231002] hover:bg-[#fb923c]',
    sciKey: 'bg-[#0d3a55] text-[#7ee3ff] hover:bg-[#124f6f] text-xs',
    memKey: 'bg-[#0f4c46] text-[#9ff5dd] hover:bg-[#14635b] text-xs',
    utilKey: 'bg-[#35415a] text-[#e8f4ff] hover:bg-[#45536e]',
    eqKey: 'bg-[#0ea5e9] text-[#02131f] hover:bg-[#38bdf8] text-2xl',
    dangerKey: 'bg-[#dc2626] text-white hover:bg-[#ef4444]',
  },
  // Nord (NumWorks classic) — بنفسجي-باثيتي داكن مع Frost cyan
  nord: {
    label: 'Nord',
    cardBg: '#2e3440', cardBorder: '#3b4252',
    screenBg: '#242933', screenBorder: '#3b4252',
    screenText: '#88c0d0', screenDim: 'rgba(136,192,208,0.55)',
    headerText: '#eceff4', headerSub: '#81a1c1',
    numKey: 'bg-[#3b4252] text-[#eceff4] hover:bg-[#434c5e]',
    opKey: 'bg-[#81a1c1] text-[#2e3440] hover:bg-[#8fbcbb]',
    sciKey: 'bg-[#434c5e] text-[#8fbcbb] hover:bg-[#4c556b] text-xs',
    memKey: 'bg-[#434c5e] text-[#a3be8c] hover:bg-[#4c556b] text-xs',
    utilKey: 'bg-[#434c5e] text-[#d8dee9] hover:bg-[#4c556b]',
    eqKey: 'bg-[#5e81ac] text-[#eceff4] hover:bg-[#6f8fbf] text-2xl',
    dangerKey: 'bg-[#bf616a] text-[#eceff4] hover:bg-[#cc707a]',
  },
  // Solarized Dark (NumWorks classic) — سماوي مطفي مع كهرمان
  solarized: {
    label: 'Solarized',
    cardBg: '#002b36', cardBorder: '#073642',
    screenBg: '#073642', screenBorder: '#0a3a47',
    screenText: '#2aa198', screenDim: 'rgba(42,161,152,0.6)',
    headerText: '#fdf6e3', headerSub: '#93a1a1',
    numKey: 'bg-[#073642] text-[#eee8d5] hover:bg-[#0a3a47]',
    opKey: 'bg-[#b58900] text-[#002b36] hover:bg-[#cba731]',
    sciKey: 'bg-[#073642] text-[#268bd2] hover:bg-[#0a3a47] text-xs',
    memKey: 'bg-[#073642] text-[#859900] hover:bg-[#0a3a47] text-xs',
    utilKey: 'bg-[#0a3a47] text-[#eee8d5] hover:bg-[#10505f]',
    eqKey: 'bg-[#2aa198] text-[#002b36] hover:bg-[#35c4ba] text-2xl',
    dangerKey: 'bg-[#dc322f] text-[#fdf6e3] hover:bg-[#e5534f]',
  },
  // Miami Vice (NumWorks classic) — ريترو: وردي + سماوي + نعناعي
  miami: {
    label: 'Miami',
    cardBg: '#1a1033', cardBorder: '#3a2060',
    screenBg: '#0b0217', screenBorder: '#3a2060',
    screenText: '#ff71ce', screenDim: 'rgba(255,113,206,0.58)',
    headerText: '#f5ecff', headerSub: '#b967ff',
    numKey: 'bg-[#241439] text-[#f5ecff] hover:bg-[#2d1a47]',
    opKey: 'bg-[#01cdfe] text-[#0b0217] hover:bg-[#05e0ff]',
    sciKey: 'bg-[#33244d] text-[#b967ff] hover:bg-[#3f2d5c] text-xs',
    memKey: 'bg-[#1f4a44] text-[#05ffa1] hover:bg-[#275f57] text-xs',
    utilKey: 'bg-[#33244d] text-[#fffb96] hover:bg-[#3f2d5c]',
    eqKey: 'bg-[#ff71ce] text-[#2b0620] hover:bg-[#ff8edb] text-2xl',
    dangerKey: 'bg-[#ff3d5a] text-white hover:bg-[#ff5a74]',
  },
  // TI-84 Plus CE — جسم فحمي، أزرار رمادية، حروف سماوية، شاشة فاتحة
  ti84: {
    label: 'TI‑84 CE',
    cardBg: '#17191c', cardBorder: '#2c3036',
    screenBg: '#dee2e6', screenBorder: '#a9adb2',
    screenText: '#101418', screenDim: 'rgba(16,20,24,0.55)',
    headerText: '#eceff1', headerSub: '#9aa0a6',
    numKey: 'bg-[#2c2f34] text-[#e8ecef] hover:bg-[#3a3e44]',
    opKey: 'bg-[#2c2f34] text-[#7fd0ff] hover:bg-[#3a3e44]',
    sciKey: 'bg-[#21334a] text-[#8fd0ff] hover:bg-[#2b4560] text-xs',
    memKey: 'bg-[#21334a] text-[#b8e2ff] hover:bg-[#2b4560] text-xs',
    utilKey: 'bg-[#23262b] text-[#e8ecef] hover:bg-[#2e3238]',
    eqKey: 'bg-[#3f7fbf] text-white hover:bg-[#5294d4] text-2xl',
    dangerKey: 'bg-[#33475b] text-[#cfe4ff] hover:bg-[#41586f]',
  },
} as const;
type SciThemeKey = keyof typeof SCI_THEMES;

interface HistoryItem {
  id: string;
  expr: string;
  result?: number;
  resultText?: string;
  resultTeX?: string;
  mode?: 'basic' | 'advanced';
}

export default function ScientificCalculator() {
  const [expr, setExpr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastExprDisplay, setLastExprDisplay] = useState('');
  const [memory, setMemory] = useState<number>(() => loadLS('calc.memory', 0));
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>(() => loadLS<'DEG' | 'RAD'>('calc.angleMode', 'DEG'));
  const [history, setHistory] = useState<HistoryItem[]>(() => loadLS('calc.history', [] as HistoryItem[]));
  const [advMode, setAdvMode] = useState<boolean>(() => loadLS('calc.advMode', false));
  const [advText, setAdvText] = useState('');
  const [advOutput, setAdvOutput] = useState<string | null>(null);
  const [advOutputIsTeX, setAdvOutputIsTeX] = useState(false);
  const [advError, setAdvError] = useState<string | null>(null);
  const [constSearch, setConstSearch] = useState('');
  const [sciTheme, setSciTheme] = useState<SciThemeKey>(() => loadLS<SciThemeKey>('calc.sciTheme', 'hiper'));
  const [copiedResult, setCopiedResult] = useState(false);

  useEffect(() => { try { localStorage.setItem('calc.memory', String(memory)); } catch { /* ignore */ } }, [memory]);
  useEffect(() => { try { localStorage.setItem('calc.angleMode', angleMode); } catch { /* ignore */ } }, [angleMode]);
  useEffect(() => { try { localStorage.setItem('calc.history', JSON.stringify(history)); } catch { /* ignore */ } }, [history]);
  useEffect(() => { try { localStorage.setItem('calc.advMode', JSON.stringify(advMode)); } catch { /* ignore */ } }, [advMode]);
  useEffect(() => { try { localStorage.setItem('calc.sciTheme', JSON.stringify(sciTheme)); } catch { /* ignore */ } }, [sciTheme]);
  const sk = SCI_THEMES[sciTheme];
  useEffect(() => { setAdvancedAngleMode(angleMode); }, [angleMode]);
  useEffect(() => { setAdvancedAngleMode(angleMode); }, []); // نقطة استهلال المحرك المتقدم

  const input = useCallback((s: string) => {
    if (advMode) {
      setAdvError(null);
      setAdvOutput(null);
      setAdvOutputIsTeX(false);
      setAdvText(prev => prev + s);
      return;
    }
    setError(null);
    setExpr(prev => {
      if (justEvaluated) {
        // بعد = : العمليات تستمر على الناتج، وأي شيء آخر يبدأ صيغة جديدة
        if (/^[+\-*/^%!]/.test(s)) return prev + s;
        return s;
      }
      return prev + s;
    });
    setJustEvaluated(false);
  }, [justEvaluated, advMode]);

  const backspace = useCallback(() => {
    if (advMode) { setAdvError(null); setAdvOutput(null); setAdvText(prev => prev.slice(0, -1)); return; }
    setError(null);
    setExpr(prev => (justEvaluated ? '' : prev.slice(0, -1)));
    setJustEvaluated(false);
  }, [justEvaluated, advMode]);

  const clearAll = useCallback(() => {
    if (advMode) { setAdvText(''); setAdvError(null); setAdvOutput(null); return; }
    setExpr(''); setError(null); setJustEvaluated(false); setLastExprDisplay('');
  }, [advMode]);

  const evalCurrent = useCallback((src: string): number | null => {
    try { return evaluateExpression(src, angleMode === 'DEG'); } catch (e: any) { setError(e?.message || 'صيغة غير صحيحة'); return null; }
  }, [angleMode]);

  const onEquals = useCallback(() => {
    if (advMode) {
      if (!advText.trim()) return;
      const res = evaluateAdvanced(advText);
      if (res.ok) {
        setAdvOutput(res.output!);
        setAdvOutputIsTeX(!!res.isTeX);
        setAdvError(null);
        setHistory(h => [{ id: uid(), expr: advText, resultText: res.isTeX ? undefined : formatAdvancedOutput(res.output!), resultTeX: res.isTeX ? res.output : undefined, mode: 'advanced' as const }, ...h].slice(0, 30));
      } else {
        setAdvError(res.error || 'تعذر الحساب');
        setAdvOutput(null);
      }
      return;
    }
    if (!expr.trim()) return;
    setError(null);
    try {
      const v = evaluateExpression(expr, angleMode === 'DEG');
      const formatted = latinNumber(v);
      setHistory(h => [{ id: uid(), expr: displayExpr(expr), result: v, mode: 'basic' as const }, ...h].slice(0, 30));
      setLastExprDisplay(displayExpr(expr));
      setExpr(formatted);
      setJustEvaluated(true);
    } catch (e: any) {
      setError(e?.message || 'صيغة غير صحيحة');
    }
  }, [expr, advText, advMode, angleMode]);

  const toggleSign = useCallback(() => {
    const applyToggle = (prev: string): string => {
      const m = prev.match(/(\d*\.?\d+)$/);
      if (!m || m.index === undefined) return prev + '-';
      const start = m.index;
      if (prev[start - 1] === '-') {
        const before = prev[start - 2];
        const isUnary = start - 2 < 0 || '+-*/^('.includes(before);
        if (isUnary) return prev.slice(0, start - 1) + m[1];
        return prev.slice(0, start) + '-' + m[1];
      }
      return prev.slice(0, start) + '-' + m[1];
    };
    if (advMode) { setAdvError(null); setAdvOutput(null); setAdvText(applyToggle); return; }
    setError(null);
    setExpr(prev => {
      if (justEvaluated) return String(-(parseFloat(normalizeArabicNumerals(prev)) || 0));
      return applyToggle(prev);
    });
    setJustEvaluated(false);
  }, [justEvaluated, advMode]);

  // ذاكرة M+ / M− / MR / MC
  const memAdd = useCallback((sign: 1 | -1) => {
    if (advMode) { setAdvError('الذاكرة M+/M− تعمل في الوضع الأساسي فقط'); setAdvOutput(null); return; }
    const src = expr.trim() || '0';
    const v = evalCurrent(src);
    if (v === null) return;
    setMemory(m => m + sign * v);
  }, [expr, evalCurrent, advMode]);
  const memRecall = useCallback(() => {
    const v = latinNumber(memory);
    if (advMode) { setAdvError(null); setAdvOutput(null); setAdvText(p => p + v); return; }
    input(v);
  }, [memory, input, advMode]);

  // لوحة المفاتيح الفيزيائية
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const inSci = !!target.closest?.('[data-sci-keys]');
        if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && !inSci) return;
      }
      const key = e.key;
      if (/^[0-9.]$/.test(key)) { input(key); e.preventDefault(); return; }
      const single: Record<string, string> = { '+': '+', '-': '-', '*': '*', '/': '/', '^': '^', '%': '%', '!': '!', '(': '(', ')': ')' };
      if (single[key]) { input(single[key]); e.preventDefault(); return; }
      if (key === 'Enter' || key === '=') { onEquals(); e.preventDefault(); return; }
      if (key === 'Backspace') { backspace(); e.preventDefault(); return; }
      if (key === 'Escape') { clearAll(); e.preventDefault(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input, onEquals, backspace, clearAll]);

  // أزرار الآلة
  const Btn = ({ label, onClick, className = '', style, span = 1, title }: { label: string; onClick: () => void; className?: string; style?: React.CSSProperties; span?: number; title?: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`key-press rounded-xl text-sm font-black select-none ${span === 2 ? 'row-span-2 h-full' : 'h-12'} ${className}`}
      style={style}
    >
      {label}
    </button>
  );

  const numKey = sk.numKey;
  const opKey = sk.opKey;
  const sciKey = sk.sciKey;
  const memKey = sk.memKey;
  const utilKey = sk.utilKey;

  // معاينة حية للنتيجة أثناء الكتابة (مثل كاسيو)
  let preview: string | null = null;
  let advPreview: string | null = null;
  if (advMode) {
    if (advText.trim() && !advError) {
      const r = evaluateAdvanced(advText);
      advPreview = r.ok ? (r.isTeX ? '✓ نتيجة رمزية' : formatAdvancedOutput(r.output!)) : null;
    }
  } else if (!justEvaluated && expr.trim() && !error) {
    try { preview = formatSci(evaluateExpression(expr, angleMode === 'DEG')); } catch { preview = null; }
  }

  const displayMainNode = advMode && advOutput && advOutputIsTeX && !advError
    ? <TeX math={advOutput} block className="text-emerald-200 text-2xl leading-relaxed" />
    : null;
  const displayMain = advMode
    ? (advError ? 'خطأ' : advOutputIsTeX ? null : advOutput ?? advPreview ?? (advText.trim() ? '…' : '٠'))
    : error ? 'خطأ' : justEvaluated ? formatSci(parseFloat(normalizeArabicNumerals(expr)) || 0) : (expr ? displayExpr(expr) : '٠');
  const displayExprLine = advMode
    ? (advText ? `${toArabicNumerals(advText)}` : ' ')
    : justEvaluated ? `${lastExprDisplay} =` : (preview ? `= ${preview}` : ' ');
  const currentScreenText = String(displayMainNode ? advOutput : displayMain ?? '');

  const copyResult = async () => {
    if (!currentScreenText || currentScreenText === '٠') return;
    try {
      await navigator.clipboard.writeText(currentScreenText);
      setCopiedResult(true);
      window.setTimeout(() => setCopiedResult(false), 1500);
    } catch { /* تجاهل */ }
  };

  return (
    <div className="rounded-2xl shadow-2xl overflow-hidden flex flex-col" dir="ltr"
      style={{ backgroundColor: sk.cardBg, border: `1px solid ${sk.cardBorder}`, fontFamily: 'Cairo, sans-serif' }}>

      {/* الترويسة */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 pt-3" dir="rtl">
        <div>
          <h3 className="text-base font-black" style={{ color: sk.headerText }}>🧮 الحاسبة العلمية</h3>
          <p className="text-[10px] mt-0.5 leading-4" style={{ color: sk.headerSub }}>{advMode
            ? 'متقدم: mathjs (وحدات · مصفوفات · إحصاء) + nerdamer (حل رمزي · اشتقاق · تكامل) — اكتب بحرية باللوحة أو لوحة المفاتيح'
            : 'sin / cos / tan · ln / log · ^ · √ · عاملي · % · ذاكرة M+/M−/MR/MC · لوحة المفاتيح مدعومة'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* مبدّل الوضع */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button onClick={() => setAdvMode(false)}
              className={`px-2.5 py-1 text-[10px] font-black transition ${!advMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="الوضع الأساسي: لوحة الأزرار التقليدية">⚡ أساسي</button>
            <button onClick={() => setAdvMode(true)}
              className={`px-2.5 py-1 text-[10px] font-black transition ${advMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="الوضع المتقدم: mathjs + nerdamer">🔬 متقدم</button>
          </div>
          {memory !== 0 && <span className="px-2 py-0.5 rounded bg-teal-700 text-[10px] font-black" title={`الذاكرة: ${memory}`}>M</span>}
          <button onClick={() => setAngleMode(m => (m === 'DEG' ? 'RAD' : 'DEG'))}
            className="px-2 py-1 rounded bg-indigo-800 hover:bg-indigo-700 text-[10px] font-black tracking-wider"
            title="تبديل وضع الزوايا (درجات / راديان)">
            {angleMode}
          </button>
        </div>
      </div>

      {/* مبدّل الثيم */}
      <div className="flex items-center gap-1 mt-2 px-4 flex-wrap" dir="rtl">
        <span className="text-[9px] font-black" style={{ color: sk.headerSub }}>الثيم:</span>
        {(Object.keys(SCI_THEMES) as SciThemeKey[]).map(id => (
          <button key={id} onClick={() => setSciTheme(id)}
            className={`px-2 py-1 rounded-full text-[9px] font-black border transition ${sciTheme === id ? 'border-amber-400 text-amber-300 bg-amber-400/10 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
            title={`تطبيق شكل ${SCI_THEMES[id].label}`}>
            {SCI_THEMES[id].label}
          </button>
        ))}
      </div>

      {/* الشاشة */}
      <div className="mx-3 mt-2 rounded-2xl px-3 py-2 screen-glow min-h-[96px] flex flex-col justify-end relative" dir="ltr"
        style={{ backgroundColor: sk.screenBg, border: `1px solid ${sk.screenBorder}` }}>
        <button onClick={copyResult} title="نسخ النتيجة"
          className="absolute left-2 top-2 text-[10px] opacity-60 hover:opacity-100 transition" style={{ color: sk.screenText }}>
          {copiedResult ? '✓' : '⧉'}
        </button>
        <div className="text-[10px] text-right truncate h-4 font-mono" style={{ color: sk.screenDim }}>{displayExprLine}</div>
        <div className={`text-right font-mono font-black leading-tight break-all ${(advMode ? advError : error) ? 'text-red-400 text-xl' : 'text-[28px]'}`}
          style={!((advMode ? advError : error)) ? { color: sk.screenText } : undefined}>
          {displayMainNode ?? displayMain}
        </div>
        <div className="text-[10px] text-red-500/90 h-4 text-left font-sans" dir="rtl">{(advMode ? advError : error) || ''}</div>
      </div>

      {/* لوحة الوضع المتقدم */}
      {advMode && (
        <div className="mx-3 mt-2 rounded-xl bg-slate-800/70 border border-indigo-900/60 p-2" dir="rtl">
          <input
            dir="ltr"
            value={advText}
            onChange={e => { setAdvText(e.target.value); setAdvError(null); setAdvOutput(null); setAdvOutputIsTeX(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onEquals(); e.preventDefault(); } if (e.key === 'Escape') { setAdvText(''); setAdvError(null); setAdvOutput(null); } }}
            placeholder='5 km to m  ·  sin(30)  ·  solve("x^2-4=0","x")  ·  [1,2;3,4]*[5;6]'
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm font-mono text-emerald-200 outline-none focus:border-indigo-500 placeholder:text-slate-600"
            autoFocus
          />
          <div className="flex flex-wrap gap-1 mt-1.5" dir="ltr">
            {[
              'solve("x^2-4=0","x")',
              'diff("x^3+2x","x")',
              'integrate("x^2","x")',
              'factor("x^2-x-2")',
              'expand("(x+1)*(x-2)")',
              'simplify("(x^2-1)/(x-1)")',
              'mean([1,2,3,4,5])',
              'std([2,4,4,4,5,5,7,9])',
              '5 km to m',
              '60 mi/h to km/h',
              'sin(30)',
              '[1,2;3,4]*[5;6]',
            ].map(snippet => (
              <button key={snippet} onClick={() => { setAdvText(prev => prev + snippet); setAdvOutput(null); setAdvOutputIsTeX(false); setAdvError(null); }}
                className="px-1.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[9px] font-mono text-indigo-200 border border-slate-600 transition"
                title="اضغط للإدراج">
                {snippet}
              </button>
            ))}
          </div>
          {/* ثوابت فيزيائية ورياضية — ضغطة تدرج القيمة */}
          <div className="mt-2 rounded-lg bg-slate-900/60 border border-slate-700/60 p-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black text-amber-300/90">π ثوابت فيزيائية ورياضية</span>
              <input
                value={constSearch}
                onChange={e => setConstSearch(e.target.value)}
                placeholder="ابحث: سرعة الضوء، π، ثابت بلانك…"
                className="w-44 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-200 outline-none focus:border-amber-600 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1 mt-1 overflow-x-auto pb-0.5">
              {PHYSICAL_CONSTANTS
                .filter(c => !constSearch.trim() || c.nameAr.includes(constSearch.trim()) || c.id.toLowerCase().includes(constSearch.trim().toLowerCase()) || c.symbolTex.replace(/\\/g, '').toLowerCase().includes(constSearch.trim().toLowerCase()))
                .slice(0, 24)
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setAdvText(prev => prev + `(${c.value})`); setAdvOutput(null); setAdvOutputIsTeX(false); setAdvError(null); }}
                    className="flex-shrink-0 rounded-lg border border-slate-700 bg-slate-800 hover:border-amber-600 hover:bg-slate-700 transition px-1.5 py-1 text-center min-w-[52px]"
                    title={`${c.nameAr}${c.unit ? ' — ' + c.unit : ''}`}
                  >
                    <TeX math={c.symbolTex} className="text-[10px] text-amber-200 block" />
                    <span className="block text-[7px] text-slate-500 max-w-[64px] truncate">{c.nameAr}</span>
                  </button>
                ))}
              {PHYSICAL_CONSTANTS.filter(c => !constSearch.trim() || c.nameAr.includes(constSearch.trim())).length === 0 && (
                <span className="text-[9px] text-slate-500 py-2 px-2">لا توجد نتائج — جرّب كلمة أقصر</span>
              )}
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5 leading-4">mathjs — وحدات وتحويلها · مصفوفات ومتجهات · إحصاء (mean · std · min · max) · دقة ٢٤ رقمًا.
            و nerdamer للرمزي: solve للمعادلات (مثال: solve("2x+6=0","x")) · diff للاشتقاق · integrate للتكامل · factor/expand/simplify.
            % كسر مئوي · π و pi مدعومان.</p>
        </div>
      )}

      {/* لوحة المفاتيح */}
      <div className="grid grid-cols-5 gap-1.5 p-3" data-sci-keys>
        {/* الذاكرة والزوايا */}
        <Btn label="MC" onClick={() => setMemory(0)} className={memKey} title="مسح الذاكرة" />
        <Btn label="MR" onClick={memRecall} className={memKey} title="استدعاء الذاكرة" />
        <Btn label="M+" onClick={() => memAdd(1)} className={memKey} title="إضافة للذاكرة" />
        <Btn label="M−" onClick={() => memAdd(-1)} className={memKey} title="طرح من الذاكرة" />
        <Btn label={angleMode === 'DEG' ? 'DEG' : 'RAD'} onClick={() => setAngleMode(m => (m === 'DEG' ? 'RAD' : 'DEG'))} className={sciKey} title="وضع الزوايا" />

        {/* الدوال العلمية */}
        <Btn label="xʸ" onClick={() => input('^')} className={sciKey} title="أس" />
        <Btn label="x²" onClick={() => input('^2')} className={sciKey} title="مربع" />
        <Btn label="√" onClick={() => input('√(')} className={sciKey} title="جذر تربيعي" />
        <Btn label="1/x" onClick={() => input('^-1')} className={sciKey} title="مقلوب" />
        <Btn label="%" onClick={() => input('%')} className={sciKey} title="النسبة المئوية" />

        <Btn label="sin" onClick={() => input('sin(')} className={sciKey} />
        <Btn label="cos" onClick={() => input('cos(')} className={sciKey} />
        <Btn label="tan" onClick={() => input('tan(')} className={sciKey} />
        <Btn label="ln" onClick={() => input('ln(')} className={sciKey} title="لوغاريتم طبيعي" />
        <Btn label="log" onClick={() => input('log(')} className={sciKey} title="لوغاريتم عشري" />

        <Btn label="(" onClick={() => input('(')} className={sciKey} />
        <Btn label=")" onClick={() => input(')')} className={sciKey} />
        <Btn label="π" onClick={() => input('π')} className={sciKey} />
        <Btn label="e" onClick={() => input('e')} className={sciKey} title="العدد النيبيري e" />
        <Btn label="!" onClick={() => input('!')} className={sciKey} title="عاملي" />

        {/* الأرقام والعمليات */}
        <Btn label="7" onClick={() => input('7')} className={numKey} />
        <Btn label="8" onClick={() => input('8')} className={numKey} />
        <Btn label="9" onClick={() => input('9')} className={numKey} />
        <Btn label="÷" onClick={() => input('/')} className={opKey} />
        <Btn label="⌫" onClick={backspace} className={utilKey} title="مسح آخر خانة" />

        <Btn label="4" onClick={() => input('4')} className={numKey} />
        <Btn label="5" onClick={() => input('5')} className={numKey} />
        <Btn label="6" onClick={() => input('6')} className={numKey} />
        <Btn label="×" onClick={() => input('*')} className={opKey} />
        <Btn label="AC" onClick={clearAll} className={sk.dangerKey} title="مسح الكل" />

        <Btn label="1" onClick={() => input('1')} className={numKey} />
        <Btn label="2" onClick={() => input('2')} className={numKey} />
        <Btn label="3" onClick={() => input('3')} className={numKey} />
        <Btn label="−" onClick={() => input('-')} className={opKey} />
        <Btn label="=" onClick={onEquals} span={2} className={sk.eqKey} title="احسب" />

        <Btn label="0" onClick={() => input('0')} className={numKey} />
        <Btn label="." onClick={() => input('.')} className={numKey} />
        <Btn label="+/−" onClick={toggleSign} className={numKey} title="تغيير الإشارة" />
        <Btn label="+" onClick={() => input('+')} className={opKey} />
      </div>

      {/* شريط السجل */}
      <div className="px-3 pb-3" dir="rtl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400">📜 سجل العمليات ({toArabicNumerals(String(history.length))})</span>
          {history.length > 0 && (
            <button onClick={() => setHistory([])} className="text-[10px] font-black text-red-400 hover:text-red-300 transition">مسح السجل</button>
          )}
        </div>
        <div className="mt-1 max-h-28 overflow-y-auto rounded-lg bg-slate-800/60 border border-slate-800 divide-y divide-slate-800">
          {history.length === 0 && <div className="text-[10px] text-slate-500 text-center py-3">لا توجد عمليات سابقة — نتائجك ستظهر هنا ويمكن استدعاؤها بضغطة</div>}
          {history.map(h => (
            <button key={h.id} onClick={() => {
                if (h.mode === 'advanced') { setAdvMode(true); setAdvText(h.expr); setAdvOutput(null); setAdvError(null); return; }
                setAdvMode(false);
                setExpr(h.result !== undefined ? String(h.result) : (h.resultText ?? '0'));
                setJustEvaluated(false); setError(null);
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-1 hover:bg-slate-700/50 text-right transition" dir="ltr"
              title="اضغط لإدخال الناتج في الصيغة">
              <span className="text-[10px] text-slate-400 truncate font-mono">{h.expr} =</span>
              <span className="text-xs text-emerald-300 font-black font-mono whitespace-nowrap">{h.resultTeX ? <TeX math={h.resultTeX} className="text-[11px]" /> : h.resultText ?? (h.result !== undefined ? formatSci(h.result) : '—')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
