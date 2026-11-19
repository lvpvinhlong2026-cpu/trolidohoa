import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Upload, 
  BookOpen, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  Settings,
  Layers,
  Edit3,
  Bookmark
} from 'lucide-react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle 
} from 'docx';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  apiKey?: string;
  model?: string;
}

export default function LessonPlanGenerator({ apiKey, model }: Props) {
  // THÔNG TIN BÀI DẠY
  const [subject, setSubject] = useState<string>('Toán học');
  const [grade, setGrade] = useState<string>('Lớp 10');
  const [lessonName, setLessonName] = useState<string>('Hàm số bậc hai và đồ thị');
  const [curriculum, setCurriculum] = useState<string>('Kết nối tri thức với cuộc sống');
  const [lessonPeriods, setLessonPeriods] = useState<number>(2);
  const [specialRequirements, setSpecialRequirements] = useState<string>(
    'Tích hợp công cụ phần mềm GeoGebra vẽ parabol, tăng cường hoạt động làm việc nhóm và liên hệ thực tế quỹ đạo ném bóng.'
  );

  // File đính kèm tài liệu SGK (nếu có)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Trạng thái AI
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  // Xử lý nạp file PDF hoặc Word
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // ========================================================
  // GỬI YÊU CẦU ĐẾN BACKEND ĐỂ SOẠN GIÁO ÁN CV 5512
  // ========================================================
  const handleGeneratePlan = async () => {
    if (!lessonName.trim()) {
      alert('Vui lòng nhập tên bài học cần soạn giáo án!');
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan('');

    try {
      if (uploadedFile) {
        // Tải kèm file tài liệu bài học (PDF / Ảnh)
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(uploadedFile);
          reader.onload = () => {
            const res = reader.result?.toString().split(',')[1];
            if (res) resolve(res);
            else reject(new Error('Không thể đọc file.'));
          };
          reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
        });

        const res = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{
              base64: base64Data,
              mimeType: uploadedFile.type || 'application/pdf'
            }],
            parsingMode: 'lesson_plan',
            subject,
            grade,
            lesson: `${lessonName} (${lessonPeriods} tiết, Sách ${curriculum})`,
            contextSuggestion: specialRequirements,
            model: model || 'gemini-1.5-pro',
            apiKey
          })
        });

        if (!res.ok) throw new Error('Lỗi từ máy chủ khi phân tích file.');
        const data = await res.json();
        setGeneratedPlan(data.text || '');

      } else {
        // Soạn giáo án trực tiếp từ thông tin bài học
        const res = await fetch('/api/convert-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textContent: `Bài học: ${lessonName}\nMôn học: ${subject}\nKhối lớp: ${grade}\nBộ sách: ${curriculum}\nSố tiết: ${lessonPeriods} tiết.\nYêu cầu: Soạn chi tiết chuẩn CV 5512/BGDĐT gồm đủ 4 bước (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng). Mỗi hoạt động đầy đủ: Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện.`,
            parsingMode: 'lesson_plan',
            subject,
            grade,
            lesson: `${lessonName} (${lessonPeriods} tiết, Sách ${curriculum})`,
            contextSuggestion: specialRequirements,
            model: model || 'gemini-1.5-pro',
            apiKey
          })
        });

        if (!res.ok) throw new Error('Lỗi từ máy chủ khi tạo giáo án.');
        const data = await res.json();
        setGeneratedPlan(data.text || '');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Không thể tạo giáo án. Vui lòng kiểm tra lại API Key!');
    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================================
  // XUẤT GIÁO ÁN RA FILE WORD (.DOCX) CHUẨN CÔNG VĂN 5512
  // ========================================================
  const handleExportDocx = async () => {
    if (!generatedPlan) return;
    setIsExportingDocx(true);

    try {
      const lines = generatedPlan.split('\n');
      const docxParagraphs: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({ text: 'TRƯỜNG THPT: ........................................', bold: true, size: 24 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'TỔ CHUYÊN MÔN: ....................................', bold: true, size: 24 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'HỌ VÀ TÊN GIÁO VIÊN: ...........................', bold: true, size: 24 })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `KẾ HOẠCH BÀI DẠY: ${lessonName.toUpperCase()}`, 
              bold: true, 
              size: 28, 
              color: '1E3A8A' 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Môn học: ${subject} • Khối lớp: ${grade} • Thời lượng: ${lessonPeriods} tiết`, 
              italics: true, 
              size: 24 
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 }
        }),
        new Paragraph({ text: '' })
      ];

      // Chuyển đổi từng dòng markdown thành paragraph trong Word
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          docxParagraphs.push(new Paragraph({ text: '' }));
          return;
        }

        if (trimmed.startsWith('# ')) {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/^#\s*/, ''), bold: true, size: 28, color: '0F172A' })],
              spacing: { before: 180, after: 80 }
            })
          );
        } else if (trimmed.startsWith('## ')) {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/^##\s*/, ''), bold: true, size: 26, color: '0D9488' })],
              spacing: { before: 140, after: 60 }
            })
          );
        } else if (trimmed.startsWith('### ')) {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/^###\s*/, ''), bold: true, size: 24, color: '334155' })],
              spacing: { before: 100, after: 40 }
            })
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${trimmed.replace(/^[-*]\s*/, '')}`, size: 24 })],
              indent: { left: 360 },
              spacing: { after: 40 }
            })
          );
        } else {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 24 })],
              spacing: { after: 60 }
            })
          );
        }
      });

      // Tạo tài liệu Word chuẩn lề Nghị định 30 (Top 2cm, Bottom 2cm, Left 3cm, Right 1.5cm)
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1134,    // 2.0 cm
                bottom: 1134, // 2.0 cm
                left: 1701,   // 3.0 cm
                right: 850    // 1.5 cm
              }
            }
          },
          children: docxParagraphs
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Giao_an_5512_${lessonName.replace(/[\s\/\\]+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Docx export error:', err);
      alert('Đã xảy ra lỗi khi tạo file Word.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedPlan);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <FileText size={20} />
            </div>
            <span>Trợ Lý Soạn Kế Hoạch Bài Dạy (Giáo Án Chuẩn CV 5512/BGDĐT)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Biên soạn tự động giáo án 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng, tích hợp năng lực số và xuất file Word chuẩn Nghị định 30.
          </p>
        </div>

        {/* CÁC NÚT TÁC VỤ */}
        <div className="flex items-center gap-2">
          {generatedPlan && (
            <>
              <button
                onClick={handleCopyText}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Sao chép toàn bộ nội dung giáo án"
              >
                {copyStatus === 'copied' ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
                <span>{copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép giáo án'}</span>
              </button>

              <button
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title="Tải file Word (.docx) chuẩn thể thức nộp Tổ chuyên môn"
              >
                {isExportingDocx ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Tải File Word (.docx)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* GRID: BÊN TRÁI THÔNG TIN BÀI DẠY, BÊN PHẢI BẢN XEM TRƯỚC VÀ SOẠN THẢO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 CỘT): FORM THÔNG TIN BÀI DẠY */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Thông số Kế hoạch bài dạy:
            </span>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Tên bài học:</label>
              <input
                type="text"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                placeholder="VD: Hàm số bậc hai và đồ thị..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Môn học:</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lí">Vật lí</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Tin học">Tin học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Khối lớp:</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="Lớp 10">Lớp 10</option>
                  <option value="Lớp 11">Lớp 11</option>
                  <option value="Lớp 12">Lớp 12</option>
                  <option value="Lớp 9">Lớp 9</option>
                  <option value="Lớp 8">Lớp 8</option>
                  <option value="Lớp 7">Lớp 7</option>
                  <option value="Lớp 6">Lớp 6</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Bộ sách:</label>
                <select
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức</option>
                  <option value="Cánh Diều">Cánh Diều</option>
                  <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Thời lượng (Số tiết):</label>
                <select
                  value={lessonPeriods}
                  onChange={(e) => setLessonPeriods(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value={1}>1 tiết</option>
                  <option value={2}>2 tiết</option>
                  <option value={3}>3 tiết</option>
                  <option value={4}>4 tiết</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                Yêu cầu sư phạm đặc biệt & Năng lực số:
              </label>
              <textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-teal-500"
                placeholder="VD: Sử dụng GeoGebra, thảo luận nhóm, tích hợp STEM..."
              />
            </div>

            {/* ĐÍNH KÈM FILE TÀI LIỆU SGK */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                Tài liệu SGK đính kèm (Tùy chọn):
              </label>
              <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white dark:bg-slate-900 transition">
                <Upload size={16} className="text-teal-600" />
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {uploadedFile ? uploadedFile.name : 'Tải lên PDF / Ảnh SGK bài học'}
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>{isGenerating ? 'AI đang soạn giáo án 5512...' : 'Soạn Giáo Án 5512 Tự Động'}</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI (8 CỘT): KHUNG HIỂN THỊ GIÁO ÁN VÀ TRÌNH SOẠN THẢO */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chế độ hiển thị:</span>
              <button
                onClick={() => setIsEditing(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  !isEditing ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Xem định dạng chuẩn
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  isEditing ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sửa văn bản trực tiếp
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Chuẩn 4 bước: Khởi động &rarr; Hình thành kiến thức &rarr; Luyện tập &rarr; Vận dụng
            </div>
          </div>

          {/* VÙNG NỘI DUNG GIÁO ÁN */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[550px] max-h-[750px] overflow-y-auto custom-scrollbar">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-3 text-slate-400">
                <Loader2 size={36} className="animate-spin text-teal-600" />
                <p className="text-sm font-semibold">AI đang phân tích và biên soạn giáo án chuẩn Công văn 5512...</p>
                <p className="text-xs text-slate-500">Quá trình này có thể mất 15-30 giây để hoàn thành toàn bộ 4 hoạt động.</p>
              </div>
            ) : !generatedPlan ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-3 text-slate-400 text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Chưa có nội dung giáo án</h3>
                <p className="text-xs max-w-md text-slate-500">
                  Hãy điền tên bài học ở cột bên trái và bấm <strong>"Soạn Giáo Án 5512 Tự Động"</strong> để hệ thống tự động sinh kế hoạch bài dạy chi tiết.
                </p>
              </div>
            ) : isEditing ? (
              <textarea
                value={generatedPlan}
                onChange={(e) => setGeneratedPlan(e.target.value)}
                className="w-full h-full min-h-[500px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {generatedPlan}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
