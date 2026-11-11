# آلة حاسبة متقدمة — Advanced Calculator

تطبيق حاسبة مكتبي مستقل (Electron + React + TypeScript) — علمية + مبرمج + RPN + رسم بياني + حل معادلات، بدقة ٢٤ رقم وأرقام عربية هندية في كل المدخلات والعروض.

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

## المميزات

- **حاسبة علمية بوضعين**: أساسي (safeCalc بدون eval — parser يدوي آمن) · 🔬 متقدم (mathjs BigNumber بدقة ٢٤ + nerdamer رمزي: solve · diff · integrate · factor)
- **٧ ثيمات**: كاسيو داكن · fx‑991 · HiPER · TI‑84 CE · Nord · Solarized · Miami (بقيادة كاسيو fx‑991 الكلاسيكي وNumWorks)
- **وضع المبرمج** (DEC/HEX/OCT/BIN، BigInt 64‑بت) + **وضع RPN كامل** (HP‑style)
- **رسم بياني TI‑84** — Y₁/Y₂ + جذور تلقائية (تقاطع إشارات + تنصيف) + جدول قيم
- **حل معادلات** — جبرية (جذور رمزية دقيقة) · أنظمة خطية (solveSystem) · انحدار خطي بالمربعات الصغرى
- **النسبة والعمولة** — نسبة من مبلغ · استرجاع من إجمالي شامل · كم النسبة · نسبة التغيير — مع سجل محلي
- **ثوابت فيزيائية ورياضية** — ٣٠ ثابت SI/CODATA مع إدراج بضغطة
- **KaTeX** — عرض طبيعي للنتائج الرمزية (كسور وجذور مكدسة)
- حفظ كامل للإعدادات والسجل في localStorage — بدون eval وبدون خادم

## بنية المشروع

| الجزء | الملف |
|---|---|
| الحاسبة العلمية + الثيمات السبعة | `src/components/ScientificCalculator.tsx` (`SCI_THEMES`) |
| حلال المعادلات | `src/components/SolverCard.tsx` + `src/utils/solver.ts` |
| الرسم البياني | `src/components/GraphingCard.tsx` |
| المبرمج و RPN | `src/components/ProgrammerCard.tsx` |
| النسبة والعمولة | `src/components/PercentageCard.tsx` |
| المحركات | `src/utils/` (safeCalc · advancedCalc · solver · constants · arabic) |

## للـ AI Agents

طريقة العمل على هذا المشروع موثقة كمهارة جاهزة في [`skills/advanced-calc/SKILL.md`](skills/advanced-calc/SKILL.md) — المحركات لا تُلمس، و`npm run typecheck` إلزامي بعد أي تعديل.

## الخطوات القادمة

1. Natural Textbook Input (2D) — الحاليًا العرض فقط عبر KaTeX.
2. حفظ جلسات كاملة (استعادة المكدس والسجل) + صوت مفاتيح اختياري.
