import { useEffect, useMemo, useRef, useState } from 'react';
import { create, all } from 'mathjs';
import functionPlot from 'function-plot';
import { UI } from '../utils/uiTheme';
import { normalizeArabicNumerals, toArabicNumerals, formatNumber } from '../utils/arabic';

const math = create(all, { number: 'number' });

const uid = () => Math.random().toString(36).slice(2);

/** تطبيع تعبير الدالة للرسم (أرقام عربية → لاتينية) */
const normFn = (s: string) =>
  normalizeArabicNumerals(s).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/π/g, 'pi');

/** إيجاد الجذور داخل النطاق عبر تقاطع الإشارات + التنصيف */
function findRoots(fnSrc: string, a: number, b: number): number[] {
  const expr = normFn(fnSrc);
  const f = (x: number) => {
    try {
      const v = math.evaluate(expr, { x });
      return typeof v === 'number' ? v : Number(v);
    } catch { return NaN; }
  };
  const roots: number[] = [];
  const N = 600;
  const step = (b - a) / N;
  let prevX = a, prevY = f(a);
  for (let i = 1; i <= N; i++) {
    const x = a + i * step;
    const y = f(x);
    if (isFinite(prevY) && isFinite(y)) {
      if ((prevY > 0 && y < 0) || (prevY < 0 && y > 0)) {
        // تنصيف
        let lo = prevX, hi = x;
        for (let j = 0; j < 48; j++) {
          const mid = (lo + hi) / 2;
          const fm = f(mid);
          if (isNaN(fm)) break;
          if ((f(lo) > 0) === (fm > 0)) lo = mid; else hi = mid;
        }
        const root = (lo + hi) / 2;
        if (roots.every(r => Math.abs(r - root) > step / 4)) roots.push(root);
        if (roots.length >= 9) break;
      } else if (y === 0) {
        if (roots.every(r => Math.abs(r - x) > step / 4)) roots.push(x);
      }
    }
    prevX = x; prevY = y;
  }
  // تجاهل الجذور خارج النطاق
  return roots.filter(r => r >= a && r <= b);
}

export default function GraphingCard() {
  const t = UI;

  const [fn1, setFn1] = useState('sin(x)');
  const [fn2, setFn2] = useState('');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState<string>(''); // فارغ = تلقائي
  const [yMax, setYMax] = useState<string>('');
  const [showRoots, setShowRoots] = useState(true);
  const [tableStep, setTableStep] = useState(1);
  const [showTable, setShowTable] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [graphId, setGraphId] = useState(uid()); // لإعادة الرسم يدويًا
  const containerRef = useRef<HTMLDivElement>(null);

  const roots = useMemo(() => (fn1.trim() && showRoots ? findRoots(fn1, xMin, xMax) : []), [fn1, xMin, xMax, showRoots]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    setPlotError(null);
    const normalized = [fn1, fn2].map(f => normFn(f.trim())).filter(Boolean);
    if (normalized.length === 0) {
      el.innerHTML = `<div style="color:${t.textMuted};font-size:11px;text-align:center;padding:48px 8px">اكتب دالة في Y₁ (مثال: sin(x) أو x^2/4-2)</div>`;
      return;
    }
    const colors = ['#818cf8', '#fbbf24'];
    const data = normalized.map((fn, i) => ({
      fn,
      graphType: 'polyline',
      range: [xMin, xMax] as [number, number],
      color: colors[i],
    }));
    const yDomain: [number, number] | undefined =
      yMin.trim() && yMax.trim() && !isNaN(Number(yMin)) && !isNaN(Number(yMax)) && Number(yMin) < Number(yMax)
        ? [Number(yMin), Number(yMax)] : undefined;
    try {
      functionPlot({
        target: el,
        width: Math.max(280, el.clientWidth || 520),
        height: 260,
        grid: true,
        xAxis: { domain: [xMin, xMax] },
        ...(yDomain ? { yAxis: { domain: yDomain } } : {}),
        data,
        annotations: showRoots ? roots.slice(0, 9).map(r => ({ x: r, text: `x ≈ ${toArabicNumerals(r.toFixed(3))}` })) : undefined,
      });
    } catch {
      setPlotError('تعذر رسم الدالة — راجع الصيغة (مثال: sin(x) أو x^2/10-2)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn1, fn2, xMin, xMax, yMin, yMax, showRoots, graphId]);

  // جدول القيم
  const tableRows = useMemo(() => {
    if (!showTable || !fn1.trim() || tableStep <= 0) return [];
    const expr = normFn(fn1);
    const rows: Array<{ x: number; y: number | null }> = [];
    for (let x = xMin; x <= xMax + 1e-9; x += tableStep) {
      let y: number | null = null;
      try {
        const v = math.evaluate(expr, { x });
        const n = typeof v === 'number' ? v : Number(v);
        y = isFinite(n) ? n : null;
      } catch { y = null; }
      rows.push({ x, y });
      if (rows.length > 500) break;
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTable, fn1, xMin, xMax, tableStep]);

  const quickFns = ['sin(x)', 'cos(x)', 'tan(x)', 'x^2', 'x^3', 'sqrt(x)', 'ln(x)', '1/x', 'abs(x)', 'exp(-x^2)'];

  return (
    <div className="rounded-2xl shadow p-4" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderInlineStart: '4px solid #818cf8' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-black" style={{ color: t.text }}>📈 الرسم البياني (TI-84)</h3>
          <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>اكتب دالة في Y — يُرسم فورًا مع الجذور تلقائيًا ومعاينة جدول القيم</p>
        </div>
        <button onClick={() => setGraphId(uid())} className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-indigo-600 text-white hover:bg-indigo-500" title="إعادة الرسم">🔄 إعادة الرسم</button>
        <button onClick={() => setShowRoots(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition ${showRoots ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          title="إظهار/إخفاء النقاط عند الجذور على المحور">{showRoots ? '📍 الجذور ظاهرة' : '📍 إظهار الجذور'}</button>
      </div>

      {/* دوال الإدخال */}
      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {[['Y₁', fn1, setFn1, '#818cf8'], ['Y₂', fn2, setFn2, '#fbbf24']].map(([label, value, setter, color]) => (
          <label key={label as string} className="flex items-center gap-1.5" dir="ltr">
            <span className="text-xs font-black w-7" style={{ color: color as string }}>{label as string} =</span>
            <input
              dir="ltr"
              value={value as string}
              onChange={e => (setter as (v: string) => void)(e.target.value)}
              placeholder={label === 'Y₁' ? 'sin(x)' : 'اختياري…'}
              className="flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-xs font-mono font-bold outline-none focus:border-indigo-500"
              style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }}
            />
          </label>
        ))}
      </div>

      {/* دوال جاهزة */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {quickFns.map(q => (
          <button key={q} onClick={() => setFn1(q)} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[9px] font-mono text-indigo-700 hover:bg-indigo-100">{q}</button>
        ))}
      </div>

      {/* الكنفاس */}
      <div ref={containerRef} className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: t.border, backgroundColor: '#0b1220' }} />
      {plotError && <div className="text-[10px] text-red-500 font-bold mt-1">{plotError}</div>}

      {/* نطاق المحاور */}
      <div className="flex flex-wrap gap-2 items-end mt-2" dir="rtl">
        {[['من (x)', xMin, (v: number) => setXMin(v)], ['إلى (x)', xMax, (v: number) => setXMax(v)]].map(([label, val, setter]) => (
          <label key={label as string} className="flex flex-col gap-0.5 text-[9px] font-bold" style={{ color: t.textMuted }}>
            {label as string}
            <input type="number" step="1" value={val as number} onChange={e => (setter as (v: number) => void)(Number(e.target.value))}
              className="w-20 rounded-lg border px-2 py-1 text-[11px] font-bold" style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
          </label>
        ))}
        {[['y أدنى', yMin, setYMin], ['y أقصى', yMax, setYMax]].map(([label, val, setter]) => (
          <label key={label as string} className="flex flex-col gap-0.5 text-[9px] font-bold" style={{ color: t.textMuted }}>
            {label as string} (اختياري)
            <input type="number" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
              placeholder="تلقائي" className="w-20 rounded-lg border px-2 py-1 text-[11px] font-bold"
              style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
          </label>
        ))}
        <button onClick={() => { setXMin(-10); setXMax(10); setYMin(''); setYMax(''); }} className="px-2 py-1.5 rounded-lg text-[10px] font-black border" style={{ borderColor: t.border, color: t.textMuted }}>↺ إعادة الضبط</button>
      </div>

      {/* الجذور */}
      {roots.length > 0 && (
        <div className="mt-2 text-[11px] font-bold flex flex-wrap gap-1.5 items-center" style={{ color: t.text }}>
          <span style={{ color: t.textMuted }}>الجذور:</span>
          {roots.map((r, i) => <span key={i} className="rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-[10px] font-mono text-indigo-800">x ≈ {toArabicNumerals(r.toFixed(4))}</span>)}
        </div>
      )}

      {/* جدول القيم */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowTable(v => !v)} className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-sky-600 text-white hover:bg-sky-700">{showTable ? '▾ إخفاء الجدول' : '▸ جدول القيم'}</button>
        {showTable && (
          <label className="flex items-center gap-1 text-[10px] font-bold" style={{ color: t.textMuted }}>
            الخطوة
            <input type="number" min={0.1} step={0.5} value={tableStep} onChange={e => setTableStep(Number(e.target.value) || 1)} className="w-16 rounded border px-1.5 py-1 text-[10px]" style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
          </label>
        )}
      </div>
      {showTable && tableRows.length > 0 && (
        <div className="mt-1.5 max-h-40 overflow-auto rounded-lg border" style={{ borderColor: t.border }}>
          <table className="w-full text-[10px] font-mono" dir="ltr">
            <thead style={{ backgroundColor: `${t.border}55` }}><tr><th className="px-2 py-1 text-left">x</th><th className="px-2 py-1 text-left">f(x)</th></tr></thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: t.border }}>
                  <td className="px-2 py-0.5">{formatNumber(r.x, 4)}</td>
                  <td className="px-2 py-0.5" dir="auto">{r.y === null ? '—' : formatNumber(r.y, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

