import { useState } from 'react';
import ScientificCalculator from './components/ScientificCalculator';
import GraphingCard from './components/GraphingCard';
import SolverCard from './components/SolverCard';
import ProgrammerCard from './components/ProgrammerCard';
import PercentageCard from './components/PercentageCard';

type ToolTab = 'solver' | 'graph' | 'programmer' | 'percent';

const TABS: Array<{ id: ToolTab; label: string; hint: string }> = [
  { id: 'solver', label: '🧩 حلال المعادلات', hint: 'جبرية · أنظمة خطية · انحدار' },
  { id: 'graph', label: '📈 الرسم البياني', hint: 'دوال Y · جذور · جدول قيم' },
  { id: 'programmer', label: '💻 المبرمج و RPN', hint: 'DEC/HEX/OCT/BIN · مكدس HP' },
  { id: 'percent', label: '💵 النسبة والعمولة', hint: 'للحسابات اليومية في الهيئة' },
];

export default function App() {
  const [tab, setTab] = useState<ToolTab>('percent');

  return (
    <div className="app-shell-bg min-h-screen text-slate-100" dir="rtl">
      {/* ════ الشريط العلوي ════ */}
      <header className="sticky top-0 z-20 border-b border-teal-400/10 bg-[#070d1a]/85 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="./icon.png" alt="حاسبة هيئة النقل العام" className="w-8 h-8 rounded-lg shadow-[0_0_16px_rgba(45,212,191,0.35)]" />
            <div className="min-w-0">
              <h1 className="text-[15px] font-black leading-4 text-teal-50 truncate">حاسبة هيئة النقل العام</h1>
              <p className="text-[9px] text-teal-500/90 font-bold leading-4">الآلة الحاسبة المستقلة — فرع فتح</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black">
            <span className="px-2 py-1 rounded-full border border-teal-800 bg-teal-950/70 text-teal-300">بدون eval</span>
            <span className="px-2 py-1 rounded-full border border-indigo-800 bg-indigo-950/70 text-indigo-300">KaTeX عرض طبيعي</span>
            <span className="px-2 py-1 rounded-full border border-amber-800 bg-amber-950/70 text-amber-300">دقة ٢٤ رقم</span>
          </div>
        </div>
      </header>

      {/* ════ المحتوى ════ */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 py-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* الحاسبة العلمية — العمود الأكبر */}
        <section className="xl:col-span-5">
          <ScientificCalculator />
        </section>

        {/* لوحة الأدوات */}
        <section className="xl:col-span-7 flex flex-col gap-3">
          {/* تبويبات الأدوات */}
          <div className="glass-panel p-2 flex flex-wrap gap-1.5" role="tablist" aria-label="أدوات الحاسبة">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[130px] rounded-xl px-3 py-2 text-right transition border ${
                  tab === t.id
                    ? 'border-teal-500/60 bg-gradient-to-l from-teal-500/20 to-cyan-500/10 shadow-[0_0_18px_rgba(45,212,191,0.18)]'
                    : 'border-transparent hover:bg-slate-800/50'
                }`}
              >
                <span className={`block text-[11px] font-black ${tab === t.id ? 'text-teal-200' : 'text-slate-300'}`}>{t.label}</span>
                <span className="block text-[8px] font-bold text-slate-500 mt-0.5">{t.hint}</span>
              </button>
            ))}
          </div>

          {/* محتوى التبويب */}
          <div key={tab}>
            {tab === 'solver' && <SolverCard />}
            {tab === 'graph' && <GraphingCard />}
            {tab === 'programmer' && <ProgrammerCard />}
            {tab === 'percent' && <PercentageCard />}
          </div>

          {/* بطاقة معلومات سريعة */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-bold text-slate-500">
            <span>⌨️ لوحة المفاتيح تعمل داخل الحاسبة: الأرقام · + − × ÷ · Enter = · Backspace مسح · Esc الكل</span>
            <span>💾 الإعدادات والسجل محفوظة محليًا على الجهاز</span>
            <span>🧮 المحرك: safeCalc + mathjs + nerdamer + KaTeX</span>
          </div>
        </section>
      </main>

      {/* ════ تذييل ════ */}
      <footer className="border-t border-slate-800/70">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-10 flex items-center justify-between text-[9px] font-bold text-slate-600">
          <span>حاسبة هيئة النقل العام المستقلة — الإصدار ١٫٠٫٠</span>
          <span>فرع فتح · بدون eval · أرقام عربية هندية مدعومة في كل المدخلات</span>
        </div>
      </footer>
    </div>
  );
}
