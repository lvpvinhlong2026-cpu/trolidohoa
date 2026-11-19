import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Loader2, 
  AlertCircle, 
  Play, 
  Download, 
  Copy, 
  Share2, 
  Sparkles, 
  RotateCcw, 
  X, 
  Check, 
  ShieldCheck, 
  Eye, 
  Code,
  Filter,
  Brain
} from 'lucide-react';

interface Props {
  apiKey: string;
  model: string;
}

// BỘ LỌC CỨNG (Hard Sanitizer): Tự động cắt bỏ triệt để mọi nhánh mục phụ / ngoại khóa / sáng tác ngoài bài học
export function sanitizeMindmapCode(md: string): string {
  if (!md || typeof md !== 'string') return md;
  
  const lines = md.split('\n');
  const result: string[] = [];
  let inFrontmatter = false;
  let frontmatterDashes = 0;
  
  // Forbidden keywords: sidebars, trivia, supplementary boxes, out-of-curriculum coordinate systems
  const FORBIDDEN_REGEX = /(?:em có biết|kiến thức bổ sung|kiến thức mở rộng|mục đọc thêm|đọc thêm|tìm hiểu thêm|góc lịch sử|nhân vật lịch sử|tiểu sử|tọa độ cầu|tọa độ trụ|toạ độ cầu|toạ độ trụ|rené descartes|rene descartes)/i;

  let pruningHeadingLevel: number | null = null;
  let pruningBulletIndent: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve YAML frontmatter
    if (trimmed === '---') {
      frontmatterDashes++;
      inFrontmatter = frontmatterDashes < 2;
      result.push(rawLine);
      continue;
    }
    if (inFrontmatter) {
      result.push(rawLine);
      continue;
    }

    // Handle empty lines
    if (!trimmed) {
      if (pruningHeadingLevel === null && pruningBulletIndent === null) {
        result.push(rawLine);
      }
      continue;
    }

    // Check heading
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];

      // If we were pruning a heading, check if this new heading ends the pruning
      if (pruningHeadingLevel !== null) {
        if (level <= pruningHeadingLevel) {
          pruningHeadingLevel = null;
          pruningBulletIndent = null;
        } else {
          continue;
        }
      }

      // Any heading resets bullet pruning
      pruningBulletIndent = null;

      // Check if this heading itself is forbidden
      if (FORBIDDEN_REGEX.test(title)) {
        pruningHeadingLevel = level;
        continue;
      }

      result.push(rawLine);
      continue;
    }

    // If currently pruning heading, skip all lines under it
    if (pruningHeadingLevel !== null) {
      continue;
    }

    // Check bullet list item (normalizes tabs to 2 spaces)
    const normalizedLine = rawLine.replace(/\t/g, '  ');
    const bulletMatch = normalizedLine.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2];

      // If currently pruning bullet
      if (pruningBulletIndent !== null) {
        if (indent <= pruningBulletIndent) {
          pruningBulletIndent = null;
        } else {
          continue;
        }
      }

      // Check if this bullet item itself is forbidden
      if (FORBIDDEN_REGEX.test(content) || FORBIDDEN_REGEX.test(trimmed)) {
        pruningBulletIndent = indent;
        continue;
      }

      result.push(rawLine);
      continue;
    }

    // Plain text or continuation line
    if (pruningBulletIndent !== null) {
      continue;
    }

    if (FORBIDDEN_REGEX.test(trimmed)) {
      continue;
    }

    result.push(rawLine);
  }

  return result.join('\n').trim();
}

export default function MindmapGenerator({ apiKey, model }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [lessonContent, setLessonContent] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [markmapCode, setMarkmapCode] = useState<string>('');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Xử lý chọn file PDF
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Vui lòng chọn file PDF, Word (.docx) hoặc Ảnh (PNG/JPG).');
      return;
    }

    try {
      setError('');
      setSelectedFile(file);

      // Đặt tên bài học mặc định theo tên file nếu chưa có
      if (!lessonTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setLessonTitle(cleanName);
      }

      // Đọc Base64 của file
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString().split(',')[1] || '';
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError('Không thể đọc file: ' + err.message);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa làm lại toàn bộ
  const handleReset = () => {
    setSelectedFile(null);
    setFileBase64('');
    setLessonContent('');
    setLessonTitle('');
    setMarkmapCode('');
    setError('');
    setStatusMessage('');
    setCopied(false);
    setViewMode('preview');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kích hoạt AI tạo Sơ đồ tư duy trực tiếp từ file PDF (NGHIÊM CẤM SÁNG TÁC)
  const handleGenerateMindmap = async () => {
    if (!selectedFile && !lessonContent.trim()) {
      setError('Vui lòng tải lên file PDF bài học (hoặc dán nội dung bài học).');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMarkmapCode('');
    setStatusMessage('Đang chuẩn bị dữ liệu...');

    try {
      const strictPrompt = `Bạn là một Hệ thống Trích xuất Dữ liệu Khoa học & Giáo dục Tuyệt đối Chính xác.
Nhiệm vụ: Hãy đọc kỹ toàn bộ tài liệu đính kèm (PDF/Word/Ảnh/văn bản) và trích xuất CẤU TRÚC KIẾN THỨC BÀI HỌC thành Sơ đồ tư duy dạng Markmap (Markdown).

[CHẾ ĐỘ NGHIÊM NGẶT - CHỐNG ẢO GIÁC & CẤM SÁNG TÁC NỘI DUNG TUYỆT ĐỐI 100%]:
1. CHỈ TẬP TRUNG 100% VÀO LÝ THUYẾT TRỌNG TÂM CHÍNH KHÓA CỦA BÀI HỌC:
   - Chỉ lấy các đề mục chính thức đánh số La Mã: I, II, III...
   - Các đề mục nhỏ: 1, 2, 3...
   - Các Khái niệm, Định nghĩa, Định lý, Tính chất, Biểu thức toạ độ, Quy tắc, Công thức toán học cốt lõi phục vụ ôn tập thi cử.
2. TUYỆT ĐỐI LOẠI BỎ TOÀN BỘ CÁC HỘP THÔNG TIN PHỤ & NGOẠI KHÓA (KỂ CẢ CÓ IN TRONG SÁCH/TÀI LIỆU CŨNG CẤM KHÔNG ĐƯỢC ĐƯA VÀO):
   - CẤM đưa vào các mục phụ: Hộp "Em có biết?", "Góc lịch sử / Nhân vật lịch sử" (ví dụ: René Descartes, tiểu sử...), "Đọc thêm", "Tìm hiểu thêm", "Kiến thức bổ sung", "Tọa độ cầu", "Tọa độ trụ", "Bài tập về nhà", "Câu hỏi thảo luận".
   - Bất kể các phần này có in trong trang sách hay không, TUYỆT ĐỐI KHÔNG đưa vào sơ đồ tư duy dù dưới dạng nhánh lớn hay nhánh con. Sơ đồ tư duy bài học chỉ dành cho kiến thức lý thuyết trọng tâm chính thức.
3. BÁM SÁT ĐÚNG SỐ LƯỢNG VÀ TÊN GỌI CỦA CÁC ĐỀ MỤC LỚN (I, II, III...):
   - Đếm chính xác số lượng mục lớn có trong tài liệu bài học.
   - Ví dụ: Nếu tài liệu chỉ có "I. HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN" và "II. TỌA ĐỘ CỦA ĐIỂM, TỌA ĐỘ CỦA VECTƠ", bạn CHỈ ĐƯỢC PHÉP tạo đúng 2 nhánh lớn (## I... và ## II...). TUYỆT ĐỐI CẤM tự ý tạo thêm nhánh "III...".
4. BÁM SÁT CÁC MỤC CON VÀ CÔNG THỨC: Từng nhánh con (-) phải là trích đoạn trung thực các định nghĩa, định lý, công thức toán học có trong bài.
5. CẤU TRÚC PHÂN TẦNG MARKDOWN:
   - Dùng '#' cho Tiêu đề bài học chính (trích xuất đúng tên bài học từ tiêu đề hoặc nội dung tài liệu đính kèm${lessonTitle ? `: "${lessonTitle}"` : ''})
   - Dùng '##' cho các Mục lớn (I, II, III...)
   - Dùng '###' cho các Mục nhỏ (1, 2, 3...)
   - Dùng '-' (bullet point) cho các chi tiết cụ thể, định nghĩa, công thức từ tài liệu
6. ĐỊNH DẠNG CÔNG THỨC TOÁN HỌC:
   - Toàn bộ công thức toán học bắt buộc phải bọc trong cặp dấu '$...$' (cùng dòng) hoặc '$$...$$' (độc lập).
   - Ký hiệu vectơ bắt buộc dùng '\\overrightarrow{...}'.
7. ĐỊNH DẠNG ĐẦU RA MARKMAP:
   - Bắt buộc phải có phần Header (YAML frontmatter) sau ở dòng đầu tiên:
---
markmap:
  colorScheme: default
  math: katex
---
   - Đặt toàn bộ mã Markmap trong một khối code \`\`\`markdown ... \`\`\` duy nhất.
   - TUYỆT ĐỐI KHÔNG CHÀO HỎI, KHÔNG GIẢI THÍCH, CHỈ TRẢ VỀ DUY NHẤT KHỐI CODE ĐÓ.`;

      let rawResponse = '';

      // Danh sách các model để tự động chuyển đổi nếu một model bị quá tải (503 / High demand)
      const candidateModels = Array.from(new Set([
        model || 'gemini-2.5-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-3-flash-preview',
        'gemini-3-pro-preview'
      ])).filter(Boolean);

      // Trường hợp 1: Có file đính kèm (PDF / Word / Ảnh)
      if (selectedFile && fileBase64) {
        setStatusMessage('AI đang đọc file PDF và trích xuất cấu trúc kiến thức...');

        if (apiKey && apiKey.trim()) {
          const mimeType = selectedFile.type || (selectedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          let lastErr: any = null;

          for (let i = 0; i < candidateModels.length; i++) {
            const currentModel = candidateModels[i];
            try {
              if (i > 0) {
                setStatusMessage(`Mô hình trước đó đang quá tải, hệ thống đang tự động chuyển sang ${currentModel}...`);
              }

              const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { text: strictPrompt + (lessonContent.trim() ? `\n\nGhi chú bổ sung:\n${lessonContent}` : '') },
                      { inlineData: { mimeType, data: fileBase64 } }
                    ]
                  }],
                  generationConfig: { temperature: 0.0, topP: 0.05 } // Chế độ nghiêm ngặt: temperature = 0.0 tuyệt đối không sáng tác
                })
              });

              if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                const errMsg = errJson.error?.message || `Lỗi API: HTTP ${response.status}`;
                throw new Error(errMsg);
              }

              const data = await response.json();
              rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (rawResponse) {
                lastErr = null;
                break;
              }
            } catch (err: any) {
              console.warn(`Lỗi khi gọi model ${currentModel}:`, err.message || err);
              lastErr = err;
              if (i < candidateModels.length - 1) {
                await new Promise(r => setTimeout(r, 600));
                continue;
              }
            }
          }

          if (!rawResponse && lastErr) {
            throw new Error(
              lastErr.message?.includes('high demand') || lastErr.message?.includes('503')
                ? 'Máy chủ AI Google đang tạm thời quá tải tại thời điểm này. Bạn vui lòng bấm nút "Tạo Sơ Đồ Tư Duy" thử lại sau vài giây hoặc chọn "Gemini 2.5 Flash" ở phần Cấu hình.'
                : lastErr.message || 'Lỗi khi kết nối đến AI.'
            );
          }

        } else {
          // Gọi qua proxy server /api/convert-pdf
          const mimeType = selectedFile.type || (selectedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          const res = await fetch('/api/convert-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: [{ base64: fileBase64, mimeType }],
              parsingMode: 'mindmap',
              customPrompt: strictPrompt + (lessonContent.trim() ? `\n\nGhi chú bổ sung:\n${lessonContent}` : ''),
              model: model || 'gemini-2.5-flash',
              apiKey: apiKey
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Lỗi máy chủ: HTTP ${res.status}`);
          }

          const data = await res.json();
          rawResponse = data.text || '';
        }

      } else {
        // Trường hợp 2: Không có file, chỉ có nội dung văn bản giáo viên dán
        setStatusMessage('AI đang trích xuất cấu trúc từ văn bản cung cấp...');
        let lastErr: any = null;

        for (let i = 0; i < candidateModels.length; i++) {
          const currentModel = candidateModels[i];
          try {
            if (i > 0) {
              setStatusMessage(`Mô hình trước đó đang quá tải, hệ thống đang tự động chuyển sang ${currentModel}...`);
            }
            const res = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: strictPrompt + `\n\n[TÀI LIỆU BÀI HỌC CẦN TRÍCH XUẤT]:\n${lessonContent}`,
                model: currentModel,
                apiKey: apiKey,
                temperature: 0.0,
                topP: 0.05
              })
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `Lỗi máy chủ: HTTP ${res.status}`);
            }

            const data = await res.json();
            rawResponse = data.text || '';
            if (rawResponse) {
              lastErr = null;
              break;
            }
          } catch (err: any) {
            lastErr = err;
            if (i < candidateModels.length - 1) {
              await new Promise(r => setTimeout(r, 600));
              continue;
            }
          }
        }

        if (!rawResponse && lastErr) {
          throw new Error(lastErr.message || 'Lỗi khi kết nối đến AI.');
        }
      }

      // Xử lý bóc tách khối markdown
      const match = rawResponse.match(/```(?:markdown)?\s*\n([\s\S]*?)(?:```|$)/i) || rawResponse.match(/```\s*\n([\s\S]*?)(?:```|$)/i);
      let finalCode = match ? match[1].trim() : rawResponse.trim();
      finalCode = finalCode.replace(/^```[^\n]*\n?/gm, '').replace(/```$/gm, '').trim();

      // Đảm bảo luôn có thẻ YAML frontmatter để render toán học và màu sắc
      if (!finalCode.includes('markmap:')) {
        finalCode = "---\nmarkmap:\n  colorScheme: default\n  math: katex\n---\n" + finalCode;
      }

      // [BỘ LỌC CỨNG]: Tự động gạt bỏ triệt để mọi nhánh mục phụ ("Em có biết?", "Tọa độ cầu", ngoại khóa...)
      finalCode = sanitizeMindmapCode(finalCode);

      setMarkmapCode(finalCode);
      setViewMode('preview');

    } catch (err: any) {
      console.error('Lỗi khi tạo sơ đồ tư duy:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo sơ đồ tư duy.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleCopyCode = () => {
    if (!markmapCode) return;
    navigator.clipboard.writeText(markmapCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadHtml = () => {
    if (!markmapCode) return;
    const blob = new Blob([getIframeSrcdoc()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = (lessonTitle || 'so_do_tu_duy').replace(/\s+/g, '_');
    link.download = `${fileName}_markmap.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIframeSrcdoc = () => {
    if (!markmapCode) return '';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${lessonTitle || 'Sơ đồ tư duy (Markmap)'}</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: transparent; }
    .markmap { width: 100vw; height: 100vh; }
    .markmap > svg { width: 100%; height: 100%; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/markmap-autoloader@0.17.0"></script>
</head>
<body>
  <div class="markmap">
${markmapCode}
  </div>
</body>
</html>`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* HEADER GỌN GÀNG, TỐI GIẢN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Brain className="text-teal-600" size={20} />
            <span>Sơ Đồ Tư Duy Bài Học (Markmap)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tải file bài học (PDF / Word) để tự động trích xuất sơ đồ tư duy tương tác
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck size={14} className="shrink-0" />
          <span>Chế độ Nghiêm ngặt: BẬT (100% bám sát file)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: TẢI FILE PDF & NỘI DUNG (5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          
          {/* Vùng tải file PDF */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tải file PDF bài học lên:
            </label>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.docx,.png,.jpg,.jpeg" 
              className="hidden" 
            />

            {!selectedFile ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 dark:border-teal-700/60 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer bg-teal-50/20 dark:bg-teal-950/20 hover:bg-teal-50/50 transition flex flex-col items-center justify-center gap-2.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    Kéo thả file PDF vào đây hoặc <span className="text-teal-600 dark:text-teal-400 underline">chọn file</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ: PDF bài học, Word (.docx), Ảnh tài liệu
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng trích xuất
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Gỡ file này"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Ô nhập / dán nội dung văn bản bổ sung hoặc dự phòng */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nội dung bài học văn bản (tuỳ chọn):</span>
              <span className="text-[11px] text-slate-400 font-normal">Dán nếu không có file PDF</span>
            </label>
            <textarea
              rows={4}
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="Dán nội dung bài học hoặc đoạn văn bản kiến thức nếu không tải file PDF..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-normal leading-relaxed resize-y"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* NÚT TẠO SƠ ĐỒ TƯ DUY */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleGenerateMindmap}
              disabled={isProcessing || (!selectedFile && !lessonContent.trim())}
              className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{statusMessage || 'Đang trích xuất sơ đồ...'}</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Trích Xuất Sơ Đồ Tư Duy (Không Sáng Tác)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shrink-0 shadow-xs"
              title="Xóa làm lại - Bắt đầu lại từ đầu"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline text-xs">Xóa làm lại</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Sơ đồ hỗ trợ đầy đủ công thức Toán học chuẩn LaTeX, có thể thu phóng, kéo rê và xuất ra file HTML chạy offline.
          </p>
        </div>

        {/* CỘT PHẢI: KHUNG XEM TRƯỚC SƠ ĐỒ TƯ DUY (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[560px]">
          
          {/* Header kết quả */}
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                Sơ Đồ Tư Duy Markmap
              </span>
              {markmapCode && (
                <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      viewMode === 'preview' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Trực quan
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      viewMode === 'code' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Mã Markdown
                  </button>
                </div>
              )}
            </div>

            {markmapCode && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMarkmapCode(prev => sanitizeMindmapCode(prev))}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Gạt bỏ mọi hộp phụ (Em có biết, Đọc thêm, Tọa độ cầu/trụ...)"
                >
                  <Filter size={14} />
                  <span>Lọc sạch mục phụ</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Xóa làm lại"
                >
                  <RotateCcw size={14} />
                  <span>Làm lại</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép Code'}</span>
                </button>
                <button
                  onClick={downloadHtml}
                  className="px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>Tải HTML Offline</span>
                </button>
              </div>
            )}
          </div>

          {/* Vùng hiển thị sơ đồ */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 relative min-h-[480px]">
            {!markmapCode && !isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <Share2 size={32} />
                </div>
                <p className="max-w-sm leading-relaxed">
                  Tải file PDF bài học ở cột bên trái và bấm <strong>"Trích Xuất Sơ Đồ Tư Duy"</strong>.<br/>
                  Sơ đồ tương tác phân cấp sẽ hiển thị tại đây.
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center z-10 backdrop-blur-[2px] space-y-2">
                <Loader2 size={36} className="animate-spin text-teal-600" />
                <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                  {statusMessage || 'Đang xử lý tài liệu...'}
                </span>
                <span className="text-xs text-slate-400">Đang bảo toàn 100% nội dung gốc</span>
              </div>
            )}

            {markmapCode && viewMode === 'preview' && (
              <iframe
                ref={iframeRef}
                srcDoc={getIframeSrcdoc()}
                title="Markmap Interactive View"
                className="w-full h-full border-0 block absolute inset-0"
                sandbox="allow-scripts allow-same-origin"
              />
            )}

            {markmapCode && viewMode === 'code' && (
              <div className="p-4 overflow-auto h-full font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre leading-relaxed select-all">
                {markmapCode}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}