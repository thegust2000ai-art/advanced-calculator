// تحويل الأرقام للعربية الهندية
export function toArabicNumerals(n: number | string): string {
  if (n === null || n === undefined) return '٠';
  const str = String(n);
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
}

export function normalizeArabicNumerals(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

// تنسيق الأرقام بفواصل عربية
export function formatNumber(n: number, decimals = 0): string {
  if (!n && n !== 0) return '٠';
  const formatted = n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toArabicNumerals(formatted);
}

// تحويل رقم عربي هندي لرقم عادي
export function fromArabicNumerals(str: string): number {
  const western = str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  return parseFloat(western) || 0;
}

export function englishToArabicDigits(str: string | number): string {
  const s = String(str);
  return s.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
}

// تنسيق التاريخ بصيغة عربية
export function formatDate(date: string | Date): string {
  let year: number, month: number, day: number;
  if (typeof date === 'string') {
    // إذا كان التاريخ YYYY-MM-DD نقرأه مباشرة
    const parts = date.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(date);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    }
  } else {
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return toArabicNumerals(`${dd}/${mm}/${year}`);
}

// الأشهر العربية
export const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatMonthYear(month: number, year: number): string {
  return `${arabicMonths[month - 1]} ${toArabicNumerals(year)}`;
}

// اليوم الحالي بصيغة YYYY-MM-DD محلية
export function todayString(): string {
  const d = new Date();
  return localDateString(d.getFullYear(), d.getMonth(), d.getDate());
}

// أول يوم في الشهر
export function firstDayOfMonth(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// آخر يوم في الشهر
export function lastDayOfMonth(date: string): string {
  const d = new Date(date);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split('T')[0];
}

// تنسيق التاريخ بصيغة YYYY-MM-DD محلية (لا تتأثر بالمنطقة الزمنية)
function localDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// جميع أيام الشهر قبل تاريخ معين
export function daysBefore(date: string): string[] {
  const d = new Date(date);
  // نستخدم getFullYear و getMonth (محليين) مع اليوم مباشرة بدلاً من ISO
  const year = d.getFullYear();
  const month = d.getMonth();
  const today = d.getDate();

  const days: string[] = [];
  for (let i = 1; i < today; i++) {
    days.push(localDateString(year, month, i));
  }
  return days;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// قراءة الأرقام من النصوص سواء كانت عربية هندية أو تحتوي على فواصل
export function parseArabicFloat(val?: string | number | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str) return 0;

  // تحويل الأرقام الهندية/الفارسية إلى أرقام غربية
  str = str
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  // إزالة أي رموز غير رقمية باستثناء النقطة العشرية والسالب
  str = str.replace(/[^0-9.-]/g, '');

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}


