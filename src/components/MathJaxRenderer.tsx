import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { Crop, Image as ImageIcon } from 'lucide-react';

interface MathJaxRendererProps {
  content: string;
  inline?: boolean;
  className?: string;
  imageMap?: Record<string, string>;
  onOpenCrop?: (targetId: string) => void;
}

export default function MathJaxRenderer({
  content,
  inline = true,
  className = '',
  imageMap,
  onOpenCrop,
}: MathJaxRendererProps) {
  // Chuẩn hóa nội dung: 
  // 1. Chuyển <br/> thành \n để react-markdown hiểu là xuống dòng
  // 2. Chuyển \[ và \] thành $$ vì remark-math chuộng $ và $$
  // 3. Chuyển \( và \) thành $
  // 4. Chuyển [HÌNH X] thành cú pháp ảnh Markdown ![Hình X](image_X)
  let processedContent = (content || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\[(HÌNH|HINH|IMAGE)[_\s]+(\d+)\]/gi, '\n\n![Hình $2](image_$2)\n\n');

  const ContainerTag = inline ? 'span' : 'div';
  const containerClass = inline 
    ? `inline-math-container leading-relaxed break-words inline align-baseline ${className}`.trim()
    : `block-math-container my-3 overflow-x-auto p-4 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700 font-sans ${className}`.trim();

  return (
    <ContainerTag className={containerClass}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Nếu là inline, tránh thẻ <p> tự động bao bọc gây xuống dòng
          p: ({ node, ...props }) => (inline ? <span {...props} /> : <p className="mb-2" {...props} />),
          // Tùy chỉnh bảng để đẹp hơn khi hiển thị ma trận/đáp án
          table: ({ node, ...props }) => (
            <table className="border-collapse border border-slate-300 dark:border-slate-600 my-2 text-sm w-full" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 font-bold text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-300 dark:border-slate-600 px-3 py-1.5" {...props} />
          ),
          // Định dạng danh sách
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
          // Định dạng hình ảnh
          img: ({ node, src, alt, ...props }) => {
            let rawSrc = src || '';
            let finalSrc = '';

            if (rawSrc.startsWith('data:image/') || rawSrc.startsWith('http')) {
              finalSrc = rawSrc;
            } else if (imageMap) {
              const cleanKey = rawSrc
                .replace(/^(image_|hình_|hinh_|img_)/i, '')
                .replace(/\.(png|jpe?g|webp)$/i, '')
                .trim();
              const numKey = parseInt(cleanKey, 10).toString();

              finalSrc =
                imageMap[rawSrc] ||
                imageMap[rawSrc.toLowerCase()] ||
                imageMap[cleanKey] ||
                imageMap[numKey] ||
                imageMap[`image_${cleanKey}`] ||
                imageMap[`image_${numKey}`] ||
                imageMap[`hình_${cleanKey}`] ||
                imageMap[`hình_${numKey}`] ||
                imageMap[`hinh_${cleanKey}`] ||
                imageMap[`hinh_${numKey}`] ||
                imageMap[`hình ${cleanKey}`] ||
                imageMap[`hình ${numKey}`] ||
                imageMap[`hinh ${cleanKey}`] ||
                imageMap[`hinh ${numKey}`] ||
                (alt ? imageMap[alt] || imageMap[alt.toLowerCase()] : '') ||
                '';
            }

            const hasValidImage = finalSrc && (finalSrc.startsWith('data:image/') || finalSrc.startsWith('http'));

            if (!hasValidImage) {
              // Helpful interactive placeholder when image data is not yet available
              return (
                <div className="my-3 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl max-w-[420px] mx-auto text-center shadow-xs">
                  <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <ImageIcon size={16} />
                    <span>{alt || 'Hình minh họa'} ({rawSrc})</span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                    Chưa có ảnh đồ thị/hình vẽ tương ứng trong bộ nhớ.
                  </p>
                  {onOpenCrop && (
                    <button
                      type="button"
                      onClick={() => onOpenCrop(rawSrc)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Crop size={14} />
                      Cắt ảnh từ PDF / Tài liệu ngay
                    </button>
                  )}
                </div>
              );
            }

            return (
              <span className="block my-3 text-center">
                <img
                  src={finalSrc}
                  alt={alt || 'Hình minh họa'}
                  className="max-w-[420px] max-h-[320px] mx-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs object-contain bg-white p-1"
                  {...props}
                />
                {alt && <span className="block text-xs text-slate-500 italic mt-1">{alt}</span>}
              </span>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </ContainerTag>
  );
}
