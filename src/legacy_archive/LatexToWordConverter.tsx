import React, { useState, useRef, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Trash2,
  Sparkles,
  Upload,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Loader2,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Code
} from 'lucide-react';
import MathJaxRenderer from './MathJaxRenderer';
import { downloadDocxFile, countFormulas } from '../utils/docxEquationGenerator';
import mammoth from 'mammoth';

interface Props {
  apiKey?: string;
  model?: string;
}

const SAMPLE_MATH_TEXT = `### PHẦN 1: TOÁN HỌC (Công thức 1 - 40)
*Bao gồm: Đại số, Giải tích, Hình học, Xác suất, Ma trận, Logic...*

1. $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
2. $(a+b)^n = \\sum_{k=0}^n \\binom{n}{k} a^{n-k} b^k$
3. $\\log_a(x \\cdot y) = \\log_a x + \\log_a y$
4. $\\sin(x \\pm y) = \\sin x \\cos y \\pm \\cos x \\sin y$
5. $e^{i\\pi} + 1 = 0$
6. $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$
7. $\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e$
8. $f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}$
9. $\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{u'v - uv'}{v^2}$
10. $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$
11. $\\int u \\, dv = uv - \\int v \\, du$
12. $\\int_0^{\\infty} e^{-x^2} \\, dx = \\frac{\\sqrt{\\pi}}{2}$
13. $\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$
14. $\\prod_{i=1}^n i = n!$
15. $f(x) = a_0 + \\sum_{n=1}^\\infty \\left(a_n \\cos \\frac{n\\pi x}{L} + b_n \\sin \\frac{n\\pi x}{L}\\right)$
16. $f(x) = \\sum_{n=0}^\\infty \\frac{f^{(n)}(a)}{n!} (x - a)^n$
17. $\\nabla f = \\frac{\\partial f}{\\partial x}\\vec{i} + \\frac{\\partial f}{\\partial y}\\vec{j}$
18. $\\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) dx\\,dy = \\oint_C (P\\,dx + Q\\,dy)$
19. $\\Gamma(z) = \\int_0^\\infty t^{z-1} e^{-t} dt$
20. $\\mathbf{A} = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}$
21. $\\det(\\mathbf{A}) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$`;

const FORMULA_TEMPLATES = [
  { label: 'Phân số', latex: '$\\frac{a}{b}$' },
  { label: 'Căn bậc hai', latex: '$\\sqrt{x^2 + 1}$' },
  { label: 'Căn bậc n', latex: '$\\sqrt[n]{A}$' },
  { label: 'Số mũ & Chỉ số', latex: '$x_1^2 + y_2^2$' },
  { label: 'Tích phân xác định', latex: '$\\int_{a}^{b} f(x) \\, dx$' },
  { label: 'Tổng Sigma', latex: '$\\sum_{i=1}^{n} a_i$' },
  { label: 'Giới hạn (Limit)', latex: '$\\lim_{x \\to x_0} \\frac{f(x)}{g(x)}$' },
  { label: 'Hệ phương trình', latex: '$\\begin{cases} 2x + y = 5 \\\\ x - 3y = 2 \\end{cases}$' },
  { label: 'Ma trận 2x2', latex: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$' },
  { label: 'Véc tơ & Độ dài', latex: '$\\vec{u} \\cdot \\vec{v} = |\\vec{u}| |\\vec{v}| \\cos \\theta$' },
  { label: 'Ký hiệu tập hợp', latex: '$\\forall x \\in \\mathbb{R}, \\; A \\subset B \\cap C$' },
  { label: 'Chữ cái Hy Lạp', latex: '$\\alpha, \\beta, \\gamma, \\Delta, \\pi, \\theta, \\lambda, \\omega$' },
];

export default function LatexToWordConverter({ apiKey, model }: Props) {
  const [docTitle, setDocTitle] = useState('Đề kiểm tra Toán');
  const [content, setContent] = useState(SAMPLE_MATH_TEXT);
  const [zoom, setZoom] = useState<number>(85);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time formula count
  const formulaCount = useMemo(() => countFormulas(content), [content]);
  const charCount = useMemo(() => content.length, [content]);

  // Handle Paste from Clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
        setStatusMsg('Đã dán nội dung từ khay nhớ tạm!');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch {
      setStatusMsg('Vui lòng cấp quyền truy cập Clipboard hoặc dùng phím tắt Ctrl + V.');
    }
  };

  // Insert formula template at cursor
  const handleInsertTemplate = (tplLatex: string) => {
    if (!textareaRef.current) {
      setContent(prev => prev + '\n' + tplLatex);
    } else {
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newText = content.substring(0, start) + ' ' + tplLatex + ' ' + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tplLatex.length + 2, start + tplLatex.length + 2);
      }, 50);
    }
    setShowTemplates(false);
  };

  // Handle uploading Word (.docx) or PDF/Image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMsg(`Đang đọc file ${file.name}...`);

    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        // Extract raw text or markdown from docx using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value) {
          setContent(result.value);
          setDocTitle(file.name.replace(/\.docx$/i, ''));
          setStatusMsg('Đã tải thành công nội dung từ file Word vào bảng!');
        } else {
          throw new Error('Không trích xuất được văn bản từ file Word này.');
        }
      } else if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')) {
        const text = await file.text();
        setContent(text);
        setDocTitle(file.name.replace(/\.(txt|md)$/i, ''));
        setStatusMsg('Đã nạp nội dung tệp vào bảng!');
      } else {
        // If image or PDF, notify or use AI endpoint
        if (!apiKey) {
          throw new Error('Đối với file PDF hoặc Ảnh, vui lòng cấu hình API Key ở mục Cài đặt để AI bóc tách sang LaTeX.');
        }
        // AI extraction for PDF/Image
        setStatusMsg('Đang gửi file đến AI để bóc tách sang LaTeX...');
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
          reader.onerror = reject;
        });

        const res = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{ base64: base64Data, mimeType: file.type || 'application/pdf' }],
            parsingMode: 'normal',
            model: model || 'gemini-2.5-flash',
            apiKey
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Lỗi bóc tách tài liệu từ AI.');
        }

        const data = await res.json();
        setContent(data.text);
        setDocTitle(file.name.replace(/\.(pdf|png|jpg|jpeg)$/i, ''));
        setStatusMsg('Bóc tách tài liệu thành công!');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  // Export to Word with native OMML Equations
  const handleExportWord = async () => {
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung trước khi tải file Word.');
      return;
    }

    setIsExporting(true);
    setStatusMsg('Đang biên dịch công thức sang Microsoft Equation...');

    try {
      const fileName = `${docTitle.trim() || 'Tai_lieu_toan_hoc'}.docx`;
      await downloadDocxFile(content, fileName, docTitle);
      setStatusMsg('✓ Tải file Word thành công! Toàn bộ công thức là Equation chuẩn.');
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi xuất file Word: ' + err.message);
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
      {/* HEADER SECTION */}
      <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                LaTeX sang Word, công thức chuẩn Equation
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Dán lời giải có công thức (từ ChatGPT, Gemini...), xem trước trên trang A4 rồi tải file Word. Công thức là Equation của Word, sửa được trực tiếp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Chuẩn Equation (OMML)
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            A4 • Times New Roman 13pt
          </span>
        </div>
      </div>

      {/* INPUT CONTROLS BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-center">
        {/* Title Input */}
        <div className="lg:col-span-5 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
            Tiêu đề:
          </span>
          <input
            type="text"
            value={docTitle}
            onChange={e => setDocTitle(e.target.value)}
            placeholder="Nhập tiêu đề tài liệu / đề thi..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>

        {/* Toolbar Buttons */}
        <div className="lg:col-span-7 flex flex-wrap items-center justify-between lg:justify-end gap-2">
          {/* Paste from ChatGPT Button */}
          <button
            onClick={handlePasteFromClipboard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 dark:text-teal-300 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Dán văn bản có chứa LaTeX từ Clipboard"
          >
            <Copy size={14} />
            <span>Dán từ ChatGPT / Clipboard</span>
          </button>

          {/* Formula Templates Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Code size={14} />
              <span>Mẫu công thức</span>
              <ChevronDown size={14} />
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
                {FORMULA_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleInsertTemplate(tpl.latex)}
                    className="flex flex-col items-start p-2 rounded-xl text-left hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-xs"
                  >
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{tpl.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate w-full">{tpl.latex}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sample Example Button */}
          <button
            onClick={() => setContent(SAMPLE_MATH_TEXT)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Tải văn bản mẫu gồm 40 công thức toán học"
          >
            <Sparkles size={14} />
            <span>Ví dụ</span>
          </button>

          {/* Upload File Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".docx,.txt,.md,application/pdf,image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Tải file Word (.docx) chứa LaTeX, TXT hoặc PDF/Ảnh"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>Tải file Word/PDF</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={() => setContent('')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 dark:bg-slate-800 dark:hover:bg-red-900/30 dark:text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Xóa trắng bảng soạn thảo"
          >
            <Trash2 size={14} />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-4 px-4 py-2 bg-teal-50 border border-teal-200 dark:bg-teal-900/30 dark:border-teal-800 rounded-xl text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SOURCE CODE & LATEX EDITOR */}
        <div className="lg:col-span-5 flex flex-col h-[760px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Bảng nhập văn bản & LaTeX
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Markdown + LaTeX ($...$)
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Dán nội dung có công thức LaTeX vào đây (ví dụ: $x = \frac{-b \pm \sqrt{\Delta}}{2a}$)..."
            className="flex-1 w-full p-4 bg-transparent text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none overflow-y-auto"
            spellCheck={false}
          />

          {/* Footer Counters */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-1.5 font-bold text-teal-600 dark:text-teal-400">
              <CheckCircle2 size={13} />
              <span>{formulaCount}/{formulaCount} công thức thành Equation</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{charCount.toLocaleString()} ký tự</span>
              <span className="text-slate-400 hidden sm:inline">Hỗ trợ: $, $$, \(\), \[\]</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REALISTIC A4 PREVIEW */}
        <div className="lg:col-span-7 flex flex-col h-[760px] bg-slate-200/70 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner overflow-hidden">
          {/* A4 Topbar Controls */}
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Xem trước gần đúng - Times New Roman 13 - A4
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="Thu nhỏ"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 w-10 text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="Phóng to"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setZoom(85)}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded ml-1"
                title="Đặt lại vừa khung"
              >
                Vừa khung
              </button>
            </div>
          </div>

          {/* Simulated A4 Paper Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
            <div
              style={{
                width: '794px', // standard A4 pixel width at 96dpi
                minHeight: '1123px', // standard A4 pixel height
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                padding: '48px 56px', // Standard 2cm - 2.5cm paper margins
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: '13pt',
                lineHeight: '1.5',
              }}
              className="bg-white text-slate-900 shadow-2xl rounded-xs shrink-0 select-text mb-12"
            >
              {/* Optional Header Title in Preview */}
              {docTitle && (
                <div className="text-center font-bold text-xl uppercase mb-6 pb-2 border-b border-slate-300 tracking-wide text-slate-900">
                  {docTitle}
                </div>
              )}

              {/* Rendered content */}
              <div className="preview-content font-serif text-slate-900">
                <MathJaxRenderer content={content} inline={false} className="bg-transparent border-0 p-0 text-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION & DOWNLOAD BAR */}
      <div className="mt-6 p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Nội dung xử lý và lưu trực tiếp trên máy của bạn
            </div>
            <div className="text-xs text-slate-400">
              Mọi công thức khi tải về sẽ tự động chuyển thành Microsoft Word Equation chuẩn (OMML), nhấp đúp để chỉnh sửa trực tiếp.
            </div>
          </div>
        </div>

        <button
          onClick={handleExportWord}
          disabled={isExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Đang tạo Word Equation...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Tải Word (.docx)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
