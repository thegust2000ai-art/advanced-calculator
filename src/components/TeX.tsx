// غلاف KaTeX — عرض LaTeX بشكل كاسيو الطبيعي (كسور وأسس وجذور مكدّسة)
import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function TeX({ math, block = false, className = '' }: { math: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: block,
        output: 'html',
        strict: false,
        trust: false,
      });
    } catch {
      // لو فشل التركيب نعرض النص الخام بدل كسر الشاشة
      return `<code>${String(math).replace(/</g, '&lt;')}</code>`;
    }
  }, [math, block]);

  const Tag: 'div' | 'span' = block ? 'div' : 'span';
  return <Tag className={className} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}
