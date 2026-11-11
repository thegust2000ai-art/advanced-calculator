import { useMemo, useState } from 'react';
import { UI } from '../utils/uiTheme';
import { toArabicNumerals, formatNumber } from '../utils/arabic';
import { solvePolynomialTeX, solveLinearSystem, detectVariables, parsePointLines, linearRegression } from '../utils/solver';
import TeX from './TeX';

type SolverTab = 'polynomial' | 'system' | 'regression';

export default function SolverCard() {
  const t = UI;
  const [tab, setTab] = useState<SolverTab>('polynomial');

  // ─── تبويب: معادلة متعددة الحدود ───
  const [equation, setEquation] = useState('x^3 - 6x^2 + 11x - 6 = 0');
  const polyRoots = useMemo(() => solvePolynomialTeX(equation, 'x'), [equation]);

  // ─── تبويب: نظام خطي ───
  const [equationsText, setEquationsText] = useState('2x + y = 7\nx - y = 1');
  const [varsText, setVarsText] = useState<string | null>(null); // null = اكتشاف تلقائي
  const systemVars = useMemo(() => {
    if (varsText !== null) return varsText.split(',').map(s => s.trim()).filter(Boolean);
    return detectVariables(equationsText.split('\n'));
  }, [equationsText, varsText]);
  const systemResult = useMemo(
    () => solveLinearSystem(equationsText.split('\n'), systemVars),
    [equationsText, systemVars]
  );

  // ─── تبويب: الانحدار ───
  const [pointsText, setPointsText] = useState('1, 3\n2, 5\n3, 7\n4, 9\n5, 11');
  const regPoints = useMemo(() => parsePointLines(pointsText), [pointsText]);
  const regression = useMemo(() => linearRegression(regPoints), [regPoints]);

  const tabBtn = (id: SolverTab, label: string) => (
    <button onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition ${tab === id ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100'}`}>
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl shadow p-4" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderInlineStart: '4px solid #a78bfa' }}>
      <div>
        <h3 className="text-base font-black" style={{ color: t.text }}>🧩 حلال المعادلات والإحصاء</h3>
        <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>كل الأدوات بروح «وضع EQN» في 991 وHI-PER: معادلات · أنظمة خطية · انحدار</p>
      </div>

      <div className="flex gap-1.5 mt-2 flex-wrap">
        {tabBtn('polynomial', '∑ معادلة جبرية')}
        {tabBtn('system', '🔗 نظام معادلات')}
        {tabBtn('regression', '📉 الانحدار والخطوط')}
      </div>

      {/* ════════ تبويب المعادلة الجبرية ════════ */}
      {tab === 'polynomial' && (
        <div className="mt-2">
          <label className="text-[10px] font-black" style={{ color: t.textMuted }}>المعادلة (بصيغة x^2 - 3x + 2 = 0 — أو بدون = 0)</label>
          <input dir="ltr" value={equation} onChange={e => setEquation(e.target.value)}
            placeholder="x^3 - 6x^2 + 11x - 6 = 0"
            className="w-full mt-1 rounded-lg border px-2 py-2 text-sm font-mono font-bold outline-none focus:border-violet-500"
            style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} autoFocus />
          <div className="mt-2 rounded-xl px-3 py-2 min-h-[48px] flex flex-col justify-center" style={{ backgroundColor: `${t.border}40`, border: `1px solid ${t.border}` }}>
            <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>الناتج</span>
            {polyRoots ? (
              <div className="text-lg" dir="ltr"><TeX math={`x \\in \\{${polyRoots}\\}`} className="text-emerald-600 font-black" block={false} /></div>
            ) : (
              <span className="text-[10px]" style={{ color: t.textMuted }}>{equation.trim() ? 'تعذر الحل رمزيًا — جرّب درجة ≤ 4 وتأكد من الصيغة' : 'اكتب المعادلة بالأعلى'}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {['x^2 - 5x + 6 = 0', 'x^3 - 6x^2 + 11x - 6 = 0', 'x^2 - 2 = 0', 'x^4 - 5x^2 + 4 = 0'].map(s => (
              <button key={s} onClick={() => setEquation(s)} className="px-1.5 py-0.5 rounded bg-violet-50 border border-violet-200 text-[9px] font-mono text-violet-800 hover:bg-violet-100">{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* ════════ تبويب النظام الخطي ════════ */}
      {tab === 'system' && (
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-black" style={{ color: t.textMuted }}>المعادلات (سطر لكل معادلة)</label>
            <label className="flex items-center gap-1 text-[9px] font-bold" style={{ color: t.textMuted }}>
              المتغيرات
              <input value={varsText ?? systemVars.join(', ')} onChange={e => setVarsText(e.target.value)}
                className="w-20 rounded border px-1 py-0.5 text-[9px] font-mono" style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
            </label>
          </div>
          <textarea dir="ltr" value={equationsText} onChange={e => { setEquationsText(e.target.value); setVarsText(null); }}
            spellCheck={false} rows={4}
            className="w-full mt-1 rounded-lg border px-2 py-2 text-sm font-mono font-bold outline-none focus:border-violet-500 resize-y"
            style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
          <div className="mt-2 rounded-xl px-3 py-2 min-h-[48px]" style={{ backgroundColor: `${t.border}40`, border: `1px solid ${t.border}` }}>
            <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>الناتج</span>
            {systemResult ? (
              <div dir="ltr" className="flex flex-wrap gap-3 mt-0.5">
                {systemResult.map(([v, val]) => (
                  <div key={v} className="text-base font-black text-emerald-600"><TeX math={`${v} = ${val}`} className="text-base" /></div>
                ))}
              </div>
            ) : (
              <span className="text-[10px]" style={{ color: t.textMuted }}>{equationsText.trim() ? 'تعذر الحل — تأكد من الصيغة (مثال: 2x + y = 7)' : 'اكتب معادلتين أو أكثر'}</span>
            )}
          </div>
          <p className="text-[9px] mt-1" style={{ color: t.textMuted }}>الحل رمزي ودقيق (كسور) عبر nerdamer — مثل وضع EQN في كاسيو 991</p>
        </div>
      )}

      {/* ════════ تبويب الانحدار ════════ */}
      {tab === 'regression' && (
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-black" style={{ color: t.textMuted }}>النقاط — سطر لكل نقطة (x, y)</label>
            <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>{toArabicNumerals(String(regPoints.length))} نقطة</span>
          </div>
          <textarea dir="ltr" value={pointsText} onChange={e => setPointsText(e.target.value)} spellCheck={false} rows={5}
            placeholder={'1, 3\n2, 5\n3, 7'}
            className="w-full mt-1 rounded-lg border px-2 py-2 text-xs font-mono font-bold outline-none focus:border-violet-500 resize-y"
            style={{ borderColor: t.border, backgroundColor: t.surface, color: t.text }} />
          {regression && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]" dir="rtl">
              {[
                ['n', toArabicNumerals(String(regression.n))],
                ['Σx', formatNumber(regression.sumX, 4)],
                ['Σy', formatNumber(regression.sumY, 4)],
                ['Σxy', formatNumber(regression.sumXY, 4)],
                ['Σx²', formatNumber(regression.sumXX, 4)],
                ['x̄', formatNumber(regression.meanX, 4)],
                ['ȳ', formatNumber(regression.meanY, 4)],
                ['r (معامل الارتباط)', formatNumber(regression.r, 6)],
                ['R²', formatNumber(regression.rSquared, 6)],
                ['الميل b', formatNumber(regression.slope, 6)],
                ['المقطع a', formatNumber(regression.intercept, 6)],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border px-2 py-1 flex items-center justify-between gap-1" style={{ borderColor: t.border }}>
                  <span className="font-bold" style={{ color: t.textMuted }}>{k as string}</span>
                  <span className="font-black" style={{ color: t.text }} dir="ltr">{v as string}</span>
                </div>
              ))}
              <div className="col-span-2 rounded-lg border-2 px-2 py-1.5" style={{ borderColor: '#7c3aed', backgroundColor: '#7c3aed0d' }}>
                <span className="font-bold" style={{ color: t.textMuted }}>خط الانحدار: </span>
                <span dir="ltr" className="font-black text-violet-700">ŷ = {formatNumber(regression.intercept, 4)} {regression.slope >= 0 ? '+' : '−'} {formatNumber(Math.abs(regression.slope), 6)} · x</span>
              </div>
            </div>
          )}
          {!regression && <div className="text-[10px] mt-1" style={{ color: t.textMuted }}>أدخل نقطتين على الأقل بصيغة «x, y» في كل سطر</div>}
        </div>
      )}
    </div>
  );
}

