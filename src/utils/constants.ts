// ثوابت فيزيائية ورياضية — قيم CODATA 2018/2022 والـ SI المعاد تعريفه (قيم دقيقة حين تصبح)
export interface PhysicalConstant {
  id: string;
  symbolTex: string;   // الرمز بـ LaTeX للعرض عبر KaTeX
  nameAr: string;      // الاسم العربي
  value: number;       // القيمة الرقمية (بالوحدة الأساسية)
  unit: string;        // الوحدة
  texValue?: string;   // قيمة بأسس عشرية للعرض
}

export const PHYSICAL_CONSTANTS: PhysicalConstant[] = [
  // ثوابت SI الدقيقة (تعريف 2019)
  { id: 'c',   symbolTex: 'c',                    nameAr: 'سرعة الضوء في الفراغ',        value: 299792458,        unit: 'm/s',  texValue: '2.99792458 × 10^{8}' },
  { id: 'h',   symbolTex: 'h',                    nameAr: 'ثابت بلانك',                  value: 6.62607015e-34,   unit: 'J·s' },
  { id: 'e',   symbolTex: 'e',                    nameAr: 'الشحنة الأولية (الإلكترون)',   value: 1.602176634e-19,  unit: 'C' },
  { id: 'k',   symbolTex: 'k',                    nameAr: 'ثابت بولتزمان',               value: 1.380649e-23,     unit: 'J/K' },
  { id: 'Na',  symbolTex: 'N_A',                  nameAr: 'عدد أفوجادرو',                value: 6.02214076e23,    unit: 'mol⁻¹' },
  { id: 'Kcd', symbolTex: 'K_{cd}',               nameAr: 'الفعالية المضيئة',             value: 683,              unit: 'lm/W' },
  { id: 'Dcs', symbolTex: '\\Delta\\nu_{Cs}',     nameAr: 'تردد انتقال السيزيوم 133',    value: 9192631770,       unit: 'Hz' },
  // فيزيائية تقريبية
  { id: 'g',   symbolTex: 'g',                    nameAr: 'تسارع الجاذبية الأرضية',       value: 9.80665,          unit: 'm/s²' },
  { id: 'G',   symbolTex: 'G',                    nameAr: 'ثابت الجذب العام',             value: 6.67430e-11,      unit: 'N·m²/kg²' },
  { id: 'm_e', symbolTex: 'm_e',                  nameAr: 'كتلة الإلكترون',              value: 9.1093837139e-31, unit: 'kg' },
  { id: 'm_p', symbolTex: 'm_p',                  nameAr: 'كتلة البروتون',               value: 1.67262192369e-27, unit: 'kg' },
  { id: 'm_n', symbolTex: 'm_n',                  nameAr: 'كتلة النيوترون',              value: 1.67492749804e-27, unit: 'kg' },
  { id: 'u',   symbolTex: 'u',                    nameAr: 'وحدة الكتلة الذرية',          value: 1.66053906660e-27, unit: 'kg' },
  { id: 'R',   symbolTex: 'R',                    nameAr: 'ثابت الغازات العام',          value: 8.314462618,      unit: 'J/(mol·K)' },
  { id: 'sigma', symbolTex: '\\sigma',           nameAr: 'ثابت ستيفان–بولتزمان',        value: 5.670374419e-8,   unit: 'W/(m²·K⁴)' },
  { id: 'epsilon0', symbolTex: '\\varepsilon_0', nameAr: 'السماحية الكهربائية للفراغ',   value: 8.8541878128e-12, unit: 'F/m' },
  { id: 'mu0', symbolTex: '\\mu_0',              nameAr: 'النفاذية المغناطيسية للفراغ',  value: 1.25663706127e-6, unit: 'N/A²' },
  { id: 'k_e', symbolTex: 'k_e',                  nameAr: 'ثابت كولوم',                  value: 8.9875517923e9,   unit: 'N·m²/C²' },
  { id: 'a0',  symbolTex: 'a_0',                  nameAr: 'نصف قطر بور',                 value: 5.29177210903e-11, unit: 'm' },
  { id: 'alpha', symbolTex: '\\alpha',           nameAr: 'ثابت البنية الدقيقة',          value: 7.2973525693e-3,  unit: '' },
  { id: 'atm', symbolTex: 'atm',                  nameAr: 'الضغط الجوي المعياري',         value: 101325,           unit: 'Pa' },
  { id: 'eV',  symbolTex: 'eV',                   nameAr: 'الإلكترون فولت',              value: 1.602176634e-19,  unit: 'J' },
  { id: 'faraday', symbolTex: 'F',                nameAr: 'ثابت فاراداي',                value: 96485.33212,      unit: 'C/mol' },
  { id: 'Rydberg', symbolTex: 'R_\\infty',       nameAr: 'ثابت ريدبرغ',                 value: 10973731.568160,  unit: 'm⁻¹' },
  // رياضية
  { id: 'pi',  symbolTex: '\\pi',                 nameAr: 'النسبة التقريبية π',          value: Math.PI,          unit: '' },
  { id: 'e_const', symbolTex: 'e',                nameAr: 'العدد النيبيري e',            value: Math.E,           unit: '' },
  { id: 'phi', symbolTex: '\\varphi',            nameAr: 'النسبة الذهبية φ',            value: 1.618033988749895, unit: '' },
  { id: 'gamma', symbolTex: '\\gamma',           nameAr: 'ثابت أويلر–ماشروني γ',        value: 0.5772156649015329, unit: '' },
  { id: 'ln2', symbolTex: '\\ln 2',              nameAr: 'لوغاريتم ٢ الطبيعي',          value: Math.LN2,         unit: '' },
  { id: 'ln10', symbolTex: '\\ln 10',            nameAr: 'لوغاريتم ١٠ الطبيعي',         value: Math.LN10,        unit: '' },
  { id: 'sqrt2', symbolTex: '\\sqrt{2}',         nameAr: 'الجذر التربيعي للـ ٢',         value: Math.SQRT2,       unit: '' },
];
