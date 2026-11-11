# حاسبة هيئة النقل العام المستقلة

تطبيق حاسبة مكتبي مستقل (Electron + React + TypeScript) — نفس محركات «🧮 الآلة الحاسبة» المدمجة في منظومة اليومية، كمنتج مستقل.

## التحميل

آخر نسخة محمولة: [**صفحة الـ Releases**](../../releases) — انقل مجلد `data` بجانب الـ exe مع نقل البرنامج لتنقل بياناتك معه.

## التشغيل والتطوير

```bash
npm install
npm run dev            # تطوير عبر المتصفح على منفذ 5174
npm run typecheck      # tsc --noEmit
npm run build          # بناء ملف HTML واحد إلى dist/
npm run desktop:dev    # بناء + تشغيل في نافذة Electron
npm run dist:portable  # بناء + حزمة Portable (exe محمول) → release/
npm run dist:win       # نسخة مثبّتة NSIS
```

> النشر المحمول: البيانات (localStorage + الإعدادات) تتحفظ داخل مجلد `data` بجانب الـ exe — انقل المجلد مع الـ exe.

## المكونات

| الجزء | الملف |
|---|---|
| الحاسبة العلمية — وضعان (أساسي/متقدم) + ٤ ثيمات | `src/components/ScientificCalculator.tsx` |
| حلال المعادلات (جبرية/أنظمة خطية/انحدار) | `src/components/SolverCard.tsx` + `src/utils/solver.ts` |
| الرسم البياني TI-84 (Y₁/Y₂ + جذور + جدول قيم) | `src/components/GraphingCard.tsx` |
| وضع المبرمج (BigInt 64-بت) + وضع RPN | `src/components/ProgrammerCard.tsx` |
| النسبة المئوية والعمولة (٤ أوضاع للهيئة) | `src/components/PercentageCard.tsx` |
| عارض KaTeX (العرض الطبيعي للنتائج الرمزية) | `src/components/TeX.tsx` |
| المحركات: safeCalc / advancedCalc / solver / constants | `src/utils/` |

## ملاحظات تقنية (لا تنساها)

- **بدون eval أبدًا** — المحرك الأساسي parser يدوي، والمتقدم عبر mathjs/nerdamer.
- **الأرقام العربية الهندية** تُحوَّل وتُطبَّع عبر `src/utils/arabic.ts` — كل المدخلات والعروض تدعمها.
- `npx tsc --noEmit` يجب أن يمر قبل أي commit؛ `vite build` لا يفحص الأنواع.
- `npm run dist:portable` يحتاج timeout ≥ 600 ثانية وأوقف أي عملية للتطبيق قبل التحزيم.
- bundle ~4MB بسبب mathjs + nerdamer + KaTeX — مقبول في تطبيق مستقل (Single-file).
- الثيمات الأربعة للحاسبة العلمية موجودة في `SCI_THEMES` داخل المكوّن؛ اختيار المستخدم محفوظ في localStorage (`calc.sciTheme`).

## للـ AI Agents

طريقة العمل على هذا المشروع موثقة كمهارة جاهزة في [`skills/naqel-calc/SKILL.md`](skills/naqel-calc/SKILL.md) — المحركات لا تُلمس، و`npm run typecheck` إلزامي بعد أي تعديل.

## الخطوات القادمة (من CALCULATOR_STANDALONE_BRIEF)

1. Natural Textbook Input (2D) — الحاليًا العرض فقط عبر KaTeX (كما هو مخطط).
2. حفظ جلسات كاملة (استعادة المكدس والسجل) + صوت مفاتيح اختياري.
3. أوامر حساب دفعة (Batch) على ملف CSV — قيد الدراسة.
