import { useEffect, useMemo, useState } from 'react';
import { UI } from '../utils/uiTheme';
import { toArabicNumerals, formatNumber, parseArabicFloat } from '../utils/arabic';

/* =============================================================
   النسبة المئوية والعمولة — بطاقة الحسابات اليومية في الهيئة
   4 أوضاع:
   ١) نسبة من مبلغ — العمولة + الصافي بعد الاستقطاع + الإجمالي شامل
   ٢) استرجاع من إجمالي شامل — الأساس والعمولة (لما يكون المبلغ المحصل شامل النسبة)
   ٣) كم النسبة؟ — الجزء من الكل
   ٤) نسبة التغيير — من قيمة إلى قيمة (زيادة/نقص)
   ============================================================= */

type PercentMode = 'fromAmount' | 'backOut' | 'whatPercent' | 'change';

interface HistoryEntry {
  id: string;
  time: string;
  text: string;
}

const QUICK_RATES = [0.5, 1, 2.5, 3, 5, 7.5, 10, 12.5, 15, 20];
const HISTORY_KEY = 'calc.percentHistory';
const MAX_HISTORY = 30;

const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch { /* fallback below */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
}

/** تنسيق رقم للعرض — كسور حتى 4 خانات مع فواصل آلاف وأرقام عربية */
const fmt = (n: number, decimals = 2): string => {
  if (!isFinite(n) || isNaN(n)) return '—';
  return formatNumber(n, decimals);
};

const inputCls =
  'w-full rounded-xl border px-3 py-2.5 text-lg font-black outline-none focus:border-teal-500 transition placeholder:font-medium placeholder:text-slate-500';

export default function PercentageCard() {
  const t = UI;
  const [mode, setMode] = useState<PercentMode>('fromAmount');

  // المدخلات — كل وضع مستقل
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('5');
  const [inclTotal, setInclTotal] = useState('1050');
  const [part, setPart] = useState('50');
  const [whole, setWhole] = useState('1000');
  const [fromVal, setFromVal] = useState('800');
  const [toVal, setToVal] = useState('1000');

  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* ignore */ }
  }, [history]);

  const n = (v: string) => parseArabicFloat(v);
  const a = n(amount), r = n(rate);
  const ti = n(inclTotal), ri = n(rate);
  const p = n(part), w = n(whole);
  const f = n(fromVal), tv = n(toVal);

  // ─── نتائج حية لكل وضع ───
  const res1 = useMemo(() => {
    if (isNaN(a) || isNaN(r)) return null;
    const commission = (a * r) / 100;
    return { commission, net: a - commission, gross: a + commission };
  }, [a, r]);

  const res2 = useMemo(() => {
    if (isNaN(ti) || isNaN(ri) || ri <= -100) return null;
    const base = ti / (1 + ri / 100);
    return { base, commission: ti - base };
  }, [ti, ri]);

  const res3 = useMemo(() => {
    if (isNaN(p) || isNaN(w) || w === 0) return null;
    return { percent: (p / w) * 100 };
  }, [p, w]);

  const res4 = useMemo(() => {
    if (isNaN(f) || isNaN(tv) || f === 0) return null;
    const diff = tv - f;
    return { diff, percent: (diff / Math.abs(f)) * 100, increased: diff >= 0 };
  }, [f, tv]);

  const currentSummary = (): string | null => {
    switch (mode) {
      case 'fromAmount':
        if (!res1) return null;
        return `نسبة من مبلغ — ${fmt(a)} × ${fmt(r, 2)}٪ = عمولة ${fmt(res1.commission)} · صافي ${fmt(res1.net)} · شامل ${fmt(res1.gross)}`;
      case 'backOut':
        if (!res2) return null;
        return `استرجاع من إجمالي — ${fmt(ti)} شامل ${fmt(ri, 2)}٪ ← أساس ${fmt(res2.base)} · عمولة ${fmt(res2.commission)}`;
      case 'whatPercent':
        if (!res3) return null;
        return `كم النسبة — ${fmt(p)} من ${fmt(w)} = ${fmt(res3.percent, 4)}٪`;
      case 'change':
        if (!res4) return null;
        return `نسبة التغيير — من ${fmt(f)} إلى ${fmt(tv)}: ${res4.increased ? 'زيادة' : 'نقص'} ${fmt(Math.abs(res4.diff))} (${fmt(Math.abs(res4.percent), 2)}٪)`;
    }
  };

  const saveToHistory = () => {
    const text = currentSummary();
    if (!text) return;
    const entry: HistoryEntry = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      time: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
      text,
    };
    setHistory(h => [entry, ...h].slice(0, MAX_HISTORY));
  };

  const copySummary = async () => {
    const text = currentSummary();
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const tabBtn = (id: PercentMode, label: string) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition whitespace-nowrap ${
        mode === id
          ? 'bg-teal-500 text-[#03231c] shadow-[0_0_14px_rgba(45,212,191,0.35)]'
          : 'bg-slate-800/80 text-teal-200/80 border border-slate-700 hover:bg-slate-800 hover:text-teal-100'
      }`}
    >
      {label}
    </button>
  );

  const resultRow = (label: string, value: string, highlight = false) => (
    <div
      className="rounded-xl border px-3 py-2 flex items-center justify-between gap-3"
      style={
        highlight
          ? { borderColor: 'rgba(45,212,191,0.45)', background: 'linear-gradient(90deg, rgba(45,212,191,0.13), rgba(45,212,191,0.04))' }
          : { borderColor: t.borderSoft, backgroundColor: t.surfaceDeep }
      }
    >
      <span className="text-[10px] font-bold" style={{ color: t.textMuted }}>{label}</span>
      <span dir="ltr" className={`font-mono-digits font-black ${highlight ? 'text-xl text-teal-300' : 'text-sm text-slate-100'}`}>{value}</span>
    </div>
  );

  const rateChips = (onPick: (v: string) => void) => (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {QUICK_RATES.map(qr => (
        <button
          key={qr}
          onClick={() => onPick(String(qr))}
          className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-mono font-bold text-teal-200/90 hover:border-teal-600 hover:text-teal-100 transition"
        >
          {toArabicNumerals(String(qr))}٪
        </button>
      ))}
    </div>
  );

  const labeled = (label: string, value: string, onChange: (v: string) => void, placeholder: string, autoFocus = false) => (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-black" style={{ color: t.textMuted }}>{label}</span>
      <input
        dir="ltr"
        inputMode="decimal"
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        style={{ borderColor: t.border, backgroundColor: t.surfaceDeep, color: t.text }}
      />
    </label>
  );

  return (
    <div className="glass-panel p-4">
      {/* الترويسة */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-black" style={{ color: t.text }}>💵 النسبة المئوية والعمولة</h3>
          <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>للحسابات اليومية: عمولة التحصيل · استرجاع المبلغ من إجمالي شامل · حساب النسب</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={copySummary} className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-sky-600 text-white hover:bg-sky-500 transition" title="نسخ ملخص النتيجة الحالية">
            {copied ? '✅ اتنسخت' : '📋 نسخ'}
          </button>
          <button onClick={saveToHistory} className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-teal-600 text-[#03231c] hover:bg-teal-500 transition" title="حفظ العملية في السجل">
            💾 احفظ
          </button>
        </div>
      </div>

      {/* مبدّل الأوضاع */}
      <div className="flex gap-1.5 mt-3 flex-wrap">
        {tabBtn('fromAmount', '٪ نسبة من مبلغ')}
        {tabBtn('backOut', '↩ استرجاع من إجمالي')}
        {tabBtn('whatPercent', '؟ كم النسبة')}
        {tabBtn('change', '↕ نسبة التغيير')}
      </div>

      {/* ════ الوضع ١: نسبة من مبلغ ════ */}
      {mode === 'fromAmount' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {labeled('المبلغ', amount, setAmount, '1000', true)}
            {labeled('النسبة ٪', rate, setRate, '5')}
          </div>
          {rateChips(setRate)}
          <div className="flex flex-col gap-1.5 mt-2.5">
            {res1 ? (
              <>
                {resultRow('العمولة (المبلغ × النسبة)', fmt(res1.commission), true)}
                {resultRow('الصافي بعد استقطاع العمولة', fmt(res1.net))}
                {resultRow('الإجمالي شامل العمولة', fmt(res1.gross))}
              </>
            ) : (
              <div className="text-[10px] font-bold text-amber-400/90 py-3 text-center">اكتب مبلغ ونسبة صحيحة — الأرقام العربية والإنجليزية مقبولة</div>
            )}
          </div>
        </div>
      )}

      {/* ════ الوضع ٢: استرجاع من إجمالي شامل ════ */}
      {mode === 'backOut' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {labeled('الإجمالي (شامل العمولة)', inclTotal, setInclTotal, '1050', true)}
            {labeled('النسبة ٪', rate, setRate, '5')}
          </div>
          {rateChips(setRate)}
          <div className="flex flex-col gap-1.5 mt-2.5">
            {res2 ? (
              <>
                {resultRow('المبلغ الأساسي (قبل العمولة)', fmt(res2.base), true)}
                {resultRow('العمولة داخل الإجمالي', fmt(res2.commission))}
                {resultRow('التحقق: الأساس + العمولة = الإجمالي', fmt(res2.base + res2.commission))}
              </>
            ) : (
              <div className="text-[10px] font-bold text-amber-400/90 py-3 text-center">النسبة لازم تكون أكبر من ‎−100٪ — راجع الأرقام</div>
            )}
          </div>
        </div>
      )}

      {/* ════ الوضع ٣: كم النسبة؟ ════ */}
      {mode === 'whatPercent' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {labeled('الجزء (القيمة)', part, setPart, '50', true)}
            {labeled('الكل (الأساس)', whole, setWhole, '1000')}
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {res3 ? (
              <>
                {resultRow('النسبة المئوية', `${fmt(res3.percent, 4)} ٪`, true)}
                {resultRow('لكل ١٠٠ من الأساس', fmt(res3.percent, 4))}
              </>
            ) : (
              <div className="text-[10px] font-bold text-amber-400/90 py-3 text-center">الكل لازم يكون رقم غير صفر — راجع الأرقام</div>
            )}
          </div>
        </div>
      )}

      {/* ════ الوضع ٤: نسبة التغيير ════ */}
      {mode === 'change' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            {labeled('من (القيمة القديمة)', fromVal, setFromVal, '800', true)}
            {labeled('إلى (القيمة الجديدة)', toVal, setToVal, '1000')}
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {res4 ? (
              <>
                {resultRow(res4.increased ? 'مقدار الزيادة' : 'مقدار النقص', fmt(Math.abs(res4.diff)))}
                {resultRow(res4.increased ? 'نسبة الزيادة ٪' : 'نسبة النقص ٪', `${fmt(Math.abs(res4.percent), 2)} ٪`, true)}
              </>
            ) : (
              <div className="text-[10px] font-bold text-amber-400/90 py-3 text-center">القيمة «من» لازم تكون غير صفر — راجع الأرقام</div>
            )}
          </div>
        </div>
      )}

      {/* ════ السجل ════ */}
      {history.length > 0 && (
        <div className="mt-3 border-t pt-2" style={{ borderColor: t.borderSoft }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black" style={{ color: t.textMuted }}>📜 سجل العمليات ({toArabicNumerals(String(history.length))})</span>
            <button onClick={() => setHistory([])} className="text-[9px] font-black text-red-400 hover:text-red-300 transition">مسح السجل</button>
          </div>
          <div className="mt-1 max-h-24 overflow-y-auto flex flex-col gap-1">
            {history.map(h => (
              <button
                key={h.id}
                onClick={() => copyText(h.text)}
                className="w-full text-right rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 hover:border-teal-800 transition flex items-center justify-between gap-2"
                title="اضغط للنسخ"
              >
                <span className="text-[9px] text-slate-300 leading-4 truncate">{h.text}</span>
                <span className="text-[8px] text-slate-500 whitespace-nowrap font-mono">{h.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
