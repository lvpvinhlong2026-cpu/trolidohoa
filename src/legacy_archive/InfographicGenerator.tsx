import React, { useState, useRef } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Loader2, 
  Lightbulb, 
  RotateCcw,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  ShieldCheck,
  AlertCircle,
  Download,
  Eye,
  Edit3,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import MathJaxRenderer from './MathJaxRenderer';
import { toPng } from 'html-to-image';

interface Props {
  apiKey?: string;
  model?: string;
}

interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  base64: string;
  previewUrl?: string;
}

const PRESET_LESSONS = [
  { 
    label: 'Tích vô hướng vectơ', 
    title: 'TÍCH VÔ HƯỚNG CỦA HAI VECTƠ - TOÁN 10',
    content: `I. ĐỊNH NGHĨA CỐT LÕI:
- Tích vô hướng của hai vectơ $\\vec{a}$ và $\\vec{b}$ là một số, kí hiệu là $\\vec{a} \\cdot \\vec{b}$.
- Công thức định nghĩa: $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos(\\vec{a}, \\vec{b})$

II. CÁC TÍNH CHẤT TRỌNG TÂM:
- Giao hoán: $\\vec{a} \\cdot \\vec{b} = \\vec{b} \\cdot \\vec{a}$
- Nhân với một số: $k(\\vec{a} \\cdot \\vec{b}) = (k\\vec{a}) \\cdot \\vec{b} = \\vec{a} \\cdot (k\\vec{b})$
- Phân phối: $\\vec{a} \\cdot (\\vec{b} + \\vec{c}) = \\vec{a} \\cdot \\vec{b} + \\vec{a} \\cdot \\vec{c}$
- Bình phương vô hướng: $\\vec{a} \\cdot \\vec{a} = \\vec{a}^2 = |\\vec{a}|^2$

III. CÔNG THỨC TÍNH GÓC & ĐIỀU KIỆN VUÔNG GÓC:
- Điều kiện vuông góc: $\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0$
- Công thức tính góc: $\\cos(\\vec{a}, \\vec{b}) = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|}$

IV. LƯU Ý QUAN TRỌNG:
- Tích vô hướng của hai vectơ là một SỐ THỰC, không phải là một vectơ!
- Bình phương vô hướng luôn không âm: $\\vec{a}^2 \\ge 0$, dấu "=" xảy ra khi $\\vec{a} = \\vec{0}$.` 
  },
  { 
    label: 'Ba định luật Newton', 
    title: 'BA ĐỊNH LUẬT NEWTON VỀ CHUYỂN ĐỘNG - VẬT LÍ 10',
    content: `I. ĐỊNH LUẬT I (QUÁN TÍNH):
- Một vật giữ nguyên trạng thái đứng yên hoặc chuyển động thẳng đều khi không chịu lực tác dụng hoặc hợp lực bằng 0.
- Khái niệm Quán tính: Xu hướng bảo toàn vận tốc của vật.

II. ĐỊNH LUẬT II (GIA TỐC):
- Vectơ gia tốc cùng hướng với hợp lực tác dụng: $\\vec{a} = \\frac{\\vec{F}}{m} \\Leftrightarrow \\vec{F} = m\\vec{a}$
- Khối lượng $m$ là đại lượng đặc trưng cho mức quán tính của vật.

III. ĐỊNH LUẬT III (TƯƠNG TÁC):
- Lực và phản lực luôn xuất hiện theo cặp, cùng phương, ngược chiều: $\\vec{F}_{AB} = -\\vec{F}_{BA}$
- Lực và phản lực đặt vào hai vật khác nhau (không phải hai lực cân bằng!).

IV. ỨNG DỤNG THỰC TẾ:
- Thắt dây an toàn khi đi xe ô tô (chống quán tính khi phanh gấp).
- Chuyển động bằng phản lực của tên lửa không gian.` 
  },
  { 
    label: 'Khảo sát hàm số', 
    title: 'QUY TRÌNH KHẢO SÁT & VẼ ĐỒ THỊ HÀM SỐ - TOÁN 12',
    content: `I. CÁC BƯỚC KHẢO SÁT CHUẨN:
- Bước 1: Tìm tập xác định $D$ của hàm số.
- Bước 2: Tính đạo hàm $y'$, giải phương trình $y' = 0$ tìm điểm cực trị.
- Bước 3: Lập bảng biến thiên (xét dấu $y'$, khoảng đồng biến/nghịch biến).
- Bước 4: Tìm giao điểm Ox, Oy và vẽ đồ thị.

II. HÀM BẬC BA: $y = ax^3 + bx^2 + cx + d$ ($a \\ne 0$):
- Đạo hàm: $y' = 3ax^2 + 2bx + c$.
- Hàm số có 2 cực trị khi $\\Delta_{y'} > 0$.
- Đồ thị nhận điểm uốn $I(x_0, y_0)$ với $y''(x_0) = 0$ làm tâm đối xứng.

III. QUY TẮC XÁC ĐỊNH CHIỀU:
- Khi $x \\to +\\infty$, đồ thị đi lên nếu $a > 0$, đi xuống nếu $a < 0$.

IV. SAI LẦM CẦN TRÁNH:
- Nhầm lẫn giữa "giá trị cực trị" ($y_{CT}, y_{CD}$) và "điểm cực trị" ($x_{CT}, x_{CD}$).` 
  },
  { 
    label: 'Bảng tuần hoàn Hóa học', 
    title: 'CẤU TẠO BẢNG TUẦN HOÀN CÁC NGUYÊN TỐ - HÓA 10',
    content: `I. NGUYÊN TẮC SẮP XẾP:
- Các nguyên tố được sắp xếp theo chiều tăng dần của điện tích hạt nhân nguyên tử ($Z$).
- Các nguyên tố có cùng số lớp electron xếp thành một Chu kỳ.
- Các nguyên tố có cùng số electron hóa trị xếp thành một Nhóm.

II. CẤU TRÚC BẢNG TUẦN HOÀN:
- Ô nguyên tố: Số hiệu nguyên tử ($Z$), Kí hiệu, Tên, Nguyên tử khối.
- Chu kỳ: 7 chu kỳ (Chu kỳ 1, 2, 3 là chu kỳ nhỏ; 4, 5, 6, 7 là chu kỳ lớn).
- Nhóm: 18 cột gồm 8 nhóm A (nguyên tố s, p) và 8 nhóm B (nguyên tố d, f).

III. QUY LUẬT BIẾN ĐỔI TUẦN HOÀN:
- Trong một chu kỳ (trái -> phải): Tính kim loại giảm dần, tính phi kim tăng dần.
- Trong một nhóm A (trên -> dưới): Tính kim loại tăng dần, tính phi kim giảm dần.

IV. GHI NHỚ TRỌNG TÂM:
- Số thứ tự Chu kỳ = Số lớp electron.
- Số thứ tự Nhóm A = Số electron lớp ngoài cùng.` 
  },
];

// Hàm làm sạch mã LaTeX sang ký tự văn bản thuần túy cho mô hình vẽ ảnh AI (Imagen 3 / DALL-E 3)
function cleanLatexForImagePrompt(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\vec\{([a-zA-Z0-9]+)\}/g, 'vectơ $1')
    .replace(/\\vec\s+([a-zA-Z0-9]+)/g, 'vectơ $1')
    .replace(/\\overrightarrow\{([a-zA-Z0-9]+)\}/g, 'vectơ $1')
    .replace(/\\perp/g, ' ⊥ (vuông góc) ')
    .replace(/\\Leftrightarrow/g, ' ⇔ ')
    .replace(/\\Leftrightline/g, ' ⇔ ')
    .replace(/\\Rightarrow/g, ' ⇒ ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\times/g, ' × ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\cos/g, 'cos')
    .replace(/\\sin/g, 'sin')
    .replace(/\\tan/g, 'tan')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\in/g, '∈')
    .replace(/\\subset/g, '⊂')
    .replace(/\$+/g, '')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\s{2,}/g, ' ');
}

// Tách nội dung thành 4 khối thẻ đẹp mắt
function parseSections(content: string) {
  const parts = content.split(/(?=(?:^|\n)(?:I|II|III|IV|1|2|3|4)\.\s*)/g).filter(p => p.trim());
  if (parts.length >= 2) {
    return parts.map(p => {
      const match = p.match(/^((?:I|II|III|IV|1|2|3|4)\.[^\n]+)\n*([\s\S]*)$/);
      if (match) {
        return { title: match[1].trim(), body: match[2].trim() };
      }
      return { title: '', body: p.trim() };
    });
  }
  return [{ title: 'Nội dung bài học', body: content }];
}

export default function InfographicGenerator({ apiKey, model }: Props) {
  const [lessonContent, setLessonContent] = useState('TÍCH VÔ HƯỚNG CỦA HAI VECTƠ - TOÁN 10');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState(PRESET_LESSONS[0].content);
  const [activeView, setActiveView] = useState<'preview' | 'editor'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const infographicRef = useRef<HTMLDivElement>(null);

  // Xử lý nạp file Ảnh hoặc PDF
  const processSelectedFile = (file: File) => {
    setUploadError('');
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileNameLower.endsWith(ext)) || 
                    file.type === 'application/pdf' || 
                    file.type.startsWith('image/');

    if (!isValid) {
      setUploadError('Chỉ hỗ trợ file Ảnh (.png, .jpg, .webp) hoặc file PDF (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Dung lượng file tối đa là 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || (fileNameLower.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        base64: base64Data,
        previewUrl: isImg ? result : undefined
      });

      // LẤY TÊN FILE LÀM TIÊU ĐỀ BÀI HỌC NGAY LẬP TỨC
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .toUpperCase()
        .trim();

      setLessonContent(cleanName);
      setAnalyzedContent(`[File: ${file.name}]\nĐang chờ bóc tách... Bấm nút "Bóc Tách Nội Dung Từ File (100% Gốc)" bên dưới để AI tự động trích xuất tuyệt đối các định nghĩa, tính chất, công thức từ file này.`);
      setActiveView('editor');
    };
    reader.onerror = () => {
      setUploadError('Không thể đọc file. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSelectPreset = (p: typeof PRESET_LESSONS[0]) => {
    handleRemoveFile();
    setLessonContent(p.title);
    setAnalyzedContent(p.content);
    setActiveView('preview');
  };

  // BƯỚC 1: PHÂN TÍCH BÀI HỌC HOẶC TRÍCH XUẤT TUYỆT ĐỐI TỪ FILE
  const handleAnalyze = async () => {
    if (!lessonContent.trim() && !uploadedFile) return;

    setIsAnalyzing(true);
    setUploadError('');

    try {
      if (uploadedFile) {
        const strictPrompt = `Bạn là Chuyên gia Trích xuất và Hệ thống hóa Kiến thức Giáo dục Sư phạm.
Nhiệm vụ: Hãy đọc kỹ toàn bộ tài liệu đính kèm (Ảnh hoặc PDF) và trích xuất thành cấu trúc Infographic Sơ đồ tư duy bài học hoàn chỉnh.

[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý SÁNG TÁC NỘI DUNG 100%]:
1. BẮT BUỘC TRẢ VỀ THEO ĐÚNG ĐỊNH DẠNG SAU:
TIÊU ĐỀ: [Tên chính xác của bài học/chủ đề trong tài liệu, VIẾT HOA, ví dụ: TÍCH VÔ HƯỚNG CỦA HAI VECTƠ - TOÁN 10]
NỘI DUNG:
I. KHÁI NIỆM & ĐỊNH NGHĨA CỐT LÕI (Trích xuất nguyên văn từ tài liệu)
II. CÔNG THỨC & TÍNH CHẤT TRỌNG TÂM (Trích xuất nguyên văn từ tài liệu)
III. CÁC TRƯỜNG HỢP ĐẶC BIỆT / HỆ QUẢ (Theo đúng tài liệu)
IV. LƯU Ý & SAI LẦM CẦN TRÁNH (Theo đúng tài liệu)

2. VỀ NỘI DUNG: CHỈ TRÍCH XUẤT 100% NỘI DUNG TUYỆT ĐỐI CÓ TRONG FILE TÀI LIỆU ĐÍNH KÈM.
3. TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC, KHÔNG THÊM BỚT BẤT KỲ KIẾN THỨC NÀO NGOÀI TÀI LIỆU, KHÔNG SUY DIỄN, KHÔNG BỊA ĐẶT NỘI DUNG.
4. VỀ CÔNG THỨC TOÁN: Mọi biểu thức toán BẮT BUỘC bọc trong cặp thẻ $...$ (ví dụ: $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cos(\\vec{a}, \\vec{b})$, $\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0$).
5. Nếu trong tài liệu không có thông tin của một mục, hãy để trống hoặc bỏ qua mục đó, TUYỆT ĐỐI KHÔNG tự bịa ra để lấp đầy.
6. Chỉ trả về nội dung theo cấu trúc trên, không thêm lời chào hay dẫn dắt.`;

        const res = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{
              base64: uploadedFile.base64,
              mimeType: uploadedFile.type
            }],
            customPrompt: strictPrompt,
            apiKey: apiKey,
            model: model || 'gemini-2.5-flash'
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Máy chủ không thể bóc tách file. Vui lòng kiểm tra lại cấu hình API Key.');
        }

        const data = await res.json();
        if (data.text) {
          const rawText: string = data.text.trim();
          
          const titleMatch = rawText.match(/TIÊU ĐỀ:\s*([^\n\r]+)/i);
          let extractedTitle = '';
          let extractedBody = rawText;

          if (titleMatch && titleMatch[1]) {
            extractedTitle = titleMatch[1].trim().replace(/^\[|\]$/g, '');
            setLessonContent(extractedTitle);
            extractedBody = rawText.replace(/TIÊU ĐỀ:[^\n\r]+\n*/i, '').replace(/NỘI DUNG:\s*\n*/i, '').trim();
          }

          setAnalyzedContent(extractedBody);
          setActiveView('preview'); // Tự động mở xem trước đồ họa tuyệt đẹp
        } else {
          throw new Error('Không trích xuất được văn bản từ file.');
        }
        return;
      }

      // TRƯỜNG HỢP NHẬP THỦ CÔNG
      if (!apiKey) {
        setAnalyzedContent(
          `I. KHÁI NIỆM TRỌNG TÂM: Định nghĩa và bản chất bài học "${lessonContent}".\nII. CÔNG THỨC THEN CHỐT: Các công thức toán/lý/hóa bắt buộc ghi nhớ.\nIII. QUY TRÌNH CÁC BƯỚC: Hướng dẫn học sinh giải bài tập theo 3 - 4 bước rõ ràng.\nIV. BẪY ĐỀ THI & MẸO NHỚ: Các lỗi sai học sinh hay mắc phải.`
        );
        setActiveView('preview');
        return;
      }

      const promptRule = `Bạn là Chuyên gia Thiết kế Infographic Sư phạm.
[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG SÁNG TÁC THÊM KIẾN THỨC]:
1. CHỈ TRÍCH XUẤT VÀ TỔNG HỢP 100% TỪ ĐOẠN VĂN BẢN TÀI LIỆU SAU:
"""
${lessonContent}
"""
2. TUYỆT ĐỐI KHÔNG ĐƯA THÊM BẤT KỲ KIẾN THỨC, KHÁI NIỆM, ĐỊNH NGHĨA HOẶC CÔNG THỨC NÀO NGOÀI ĐOẠN VĂN BẢN TRÊN.
3. NẾU THIẾU MỤC NÀO, ĐỂ TRỐNG MỤC ĐÓ, TUYỆT ĐỐI CẤM TỰ BỊA RA LẤP ĐẦY.
Hãy tóm tắt thành dàn ý infographic 4 phần cô đọng: I. Khái niệm cốt lõi, II. Công thức & Tính chất trọng tâm, III. Trường hợp đặc biệt / Hệ quả, IV. Lưu ý & Sai lầm cần tránh. Các công thức toán phải bọc trong $...$ chuẩn KaTeX. Không viết quá dài dòng.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptRule,
          model: model || 'gemini-3-flash-preview',
          apiKey: apiKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setAnalyzedContent(data.text.trim());
          setActiveView('preview');
        }
      }
    } catch (e: any) {
      console.error(e);
      setUploadError(e.message || 'Có lỗi xảy ra khi phân tích tài liệu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // TẢI ẢNH INFOGRAPHIC CHUẨN TOÁN HD TỪ CHÍNH WEB (KHUYÊN DÙNG NHẤT)
  const handleDownloadInfographicPng = async () => {
    if (!infographicRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(infographicRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      const safeName = (lessonContent || 'Infographic')
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
        .replace(/_+/g, '_');
      link.download = `Infographic_${safeName}_HD.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh Infographic:', err);
      alert('Không thể tạo ảnh tự động. Thầy/cô vui lòng thử lại hoặc chụp màn hình khung xem trước.');
    } finally {
      setIsExporting(false);
    }
  };

  // BƯỚC 3: CÂU LỆNH VẼ ẢNH DÀNH CHO GEMINI / CHATGPT (CẤM SÁNG TÁC HÌNH SAI ĐỈNH)
  const buildFinalPrompt = () => {
    const isFromUploadedFile = Boolean(uploadedFile);
    const safeTitle = (lessonContent || (uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '') : 'Infographic Bài Học')).trim();
    const cleanContent = cleanLatexForImagePrompt(analyzedContent.trim());

    return `Bạn là Họa sĩ Thiết kế Đồ họa Giáo dục Chuyên nghiệp. Hãy sử dụng công cụ tạo ảnh AI (Google Imagen 3 trên Gemini hoặc DALL-E 3 trên ChatGPT) để VẼ TRỰC TIẾP một bức ảnh Poster Infographic Học Đường TUYỆT ĐẸP về chủ đề:
"${safeTitle}"

[CÁC YÊU CẦU QUAN TRỌNG VỀ ĐỒ HỌA & ĐỘ CHÍNH XÁC - CẤM VẼ SAI]:
1. CỠ CHỮ SIÊU TO & RÕ NÉT (LARGE POSTER TYPOGRAPHY):
   - Toàn bộ chữ và công thức PHẢI VIẾT RẤT TO, IN ĐẬM, RÕ RÀNG, DỄ ĐỌC TỪ XA.
   - TUYỆT ĐỐI KHÔNG dùng chữ nhỏ li ti hoặc dồn quá nhiều chữ gây rối mắt.

2. KÝ HIỆU TOÁN HỌC CHUẨN XÁC:
   - Ký hiệu vectơ: Vẽ rõ ràng mũi tên trên đầu chữ (ví dụ: a⃗ · b⃗) hoặc viết chữ "vectơ a · vectơ b".
   - TUYỆT ĐỐI KHÔNG vẽ thành ký hiệu dấu hai chấm trên đầu (như ä).
   - Công thức hiển thị trong các khối thẻ nổi bật:
${cleanContent}

3. HÌNH VẼ MINH HỌA ĐÚNG BẢN CHẤT - TUYỆT ĐỐI CẤM SÁNG TÁC HÌNH SAI ĐỈNH:
   - TUYỆT ĐỐI KHÔNG tự ý vẽ hình hộp chữ nhật hay hình đa giác không gian bị lặp đỉnh hoặc sai nhãn (như lặp lại 2 đỉnh B').
   - Đối với bài toán vectơ, CHỈ vẽ minh họa phẳng 2D: Hai mũi tên vectơ a⃗ và b⃗ có chung gốc, có góc θ ở giữa, các icon toán học 3D xinh xắn.

4. BỐ CỤC & MÀU SẮC THU HÚT HỌC SINH:
   - Bố cục 4 thẻ nổi (Floating Cards) với các gam màu tươi sáng, sinh động, viền bo tròn mềm mại.
   - Nền trắng sáng hoặc xanh ngọc nhạt, ánh sáng trong trẻo, phong cách thiết kế sư phạm hiện đại.

5. TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC THÊM KIẾN THỨC:
   - Bám sát 100% nội dung đã trích xuất từ file tài liệu ở trên.
   - Tuyệt đối không tự ý đưa các kiến thức, công thức, khái niệm hay sự vật nào nằm ngoài tài liệu vào ảnh infographic.

YÊU CẦU: Hãy vẽ và hiển thị trực tiếp bức ảnh Infographic này ngay bây giờ!`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildFinalPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAndOpen = (url: string) => {
    navigator.clipboard.writeText(buildFinalPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setLessonContent('');
    setAnalyzedContent('');
    handleRemoveFile();
  };

  const parsedSections = parseSections(analyzedContent);

  // Bảng màu cho 4 khối thẻ Infographic
  const cardThemes = [
    { border: 'border-teal-500/30', bg: 'bg-teal-50/70 dark:bg-teal-950/30', header: 'bg-teal-600 text-white', accent: 'text-teal-700 dark:text-teal-300' },
    { border: 'border-blue-500/30', bg: 'bg-blue-50/70 dark:bg-blue-950/30', header: 'bg-blue-600 text-white', accent: 'text-blue-700 dark:text-blue-300' },
    { border: 'border-amber-500/30', bg: 'bg-amber-50/70 dark:bg-amber-950/30', header: 'bg-amber-600 text-white', accent: 'text-amber-700 dark:text-amber-300' },
    { border: 'border-rose-500/30', bg: 'bg-rose-50/70 dark:bg-rose-950/30', header: 'bg-rose-600 text-white', accent: 'text-rose-700 dark:text-rose-300' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
          <BarChart3 size={14} />
          <span>Infographic Giáo Dục • Chuẩn Toán Học 100%</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Infographic Sơ Đồ Tư Duy Bài Học (Chữ To • Sắc Nét)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Khắc phục triệt để lỗi ký hiệu toán học & sai đỉnh: Xem trước trực tiếp với KaTeX chuẩn SGK hoặc mở vẽ AI với lệnh cấm sáng tác sai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* BƯỚC 1: AI PHÂN TÍCH HAY GỢI Ý */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">1</span>
                <span>AI Phân Tích / Gợi Ý</span>
              </span>
              <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" title="Làm mới">
                <RotateCcw size={14} />
              </button>
            </div>

            {/* KHU VỰC TẢI FILE ẢNH HOẶC PDF (LẤY NỘI DUNG TUYỆT ĐỐI) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tải file Ảnh SGK hoặc PDF:
                </label>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck size={12} />
                  <span>Chuẩn 100%</span>
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                    <UploadCloud size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline block">
                      Bấm tải file hoặc Kéo thả vào đây
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Ảnh chụp SGK (.png, .jpg) hoặc file PDF bài học (tối đa 25MB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {uploadedFile.previewUrl ? (
                        <img 
                          src={uploadedFile.previewUrl} 
                          alt="preview" 
                          className="w-8 h-8 rounded-lg object-cover border border-teal-300 dark:border-teal-700 shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                          {uploadedFile.type.includes('pdf') ? <FileText size={16} /> : <ImageIcon size={16} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-teal-950 dark:text-teal-200 truncate" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Xóa file này"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-teal-100/70 dark:bg-teal-900/50 text-[10px] text-teal-800 dark:text-teal-300 font-medium flex items-center gap-1">
                    <ShieldCheck size={11} className="text-teal-600 shrink-0" />
                    <span>Lấy nội dung tuyệt đối trong file • Không sáng tác</span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mt-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[10.5px] flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* NHẬP TÊN BÀI HỌC / TIÊU ĐỀ CHÍNH */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tiêu đề bài học (Vẽ to nhất trên đầu Infographic):
              </label>
              <input
                type="text"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Ví dụ: TÍCH VÔ HƯỚNG CỦA HAI VECTƠ - TOÁN 10"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {uploadedFile ? '📌 Đã tự động nhận diện từ file. Thầy/cô có thể sửa lại nếu muốn.' : '💡 Nhập đúng tên bài để AI không vẽ nhầm sang bài khác.'}
              </span>
            </div>

            {/* MẪU BÀI HỌC NHANH (NẾU CHƯA TẢI FILE) */}
            {!uploadedFile && (
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1">Hoặc chọn bài mẫu có sẵn:</span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_LESSONS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition cursor-pointer ${
                        lessonContent === p.title
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={(!lessonContent.trim() && !uploadedFile) || isAnalyzing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{uploadedFile ? 'Đang đọc và bóc tách file...' : 'Đang phân tích...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{uploadedFile ? 'Bóc Tách Nội Dung Từ File (100% Gốc)' : 'Lên Khung Infographic'}</span>
              </>
            )}
          </button>
        </div>

        {/* BƯỚC 2: NỘI DUNG CẦN THỂ HIỆN (CÓ CHUYỂN ĐỔI GIỮA SOẠN THẢO VÀ XEM TRƯỚC ĐỒ HỌA CHUẨN TOÁN) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">2</span>
                <span>Nội Dung Cần Thể Hiện</span>
              </span>

              {/* TAB SWITCHER GIỮA TEXTAREA VÀ BẢN VẼ CHUẨN TOÁN */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    activeView === 'preview'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Eye size={12} />
                  <span>Xem Bản Vẽ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('editor')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    activeView === 'editor'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Edit3 size={12} />
                  <span>Sửa Text</span>
                </button>
              </div>
            </div>

            {activeView === 'editor' ? (
              <div className="flex-1 flex flex-col space-y-1">
                <p className="text-[11px] text-slate-400">
                  Chỉnh sửa công thức (dùng dấu $ để bọc ký hiệu toán học):
                </p>
                <textarea
                  value={analyzedContent}
                  onChange={(e) => setAnalyzedContent(e.target.value)}
                  placeholder="Nội dung bài học gồm khái niệm, công thức, quy trình..."
                  className="w-full flex-1 min-h-[220px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-none"
                />
              </div>
            ) : (
              /* KHUNG XEM TRƯỚC INFOGRAPHIC CHUẨN TOÁN HỌC 100% (XUẤT ẢNH HD ĐƯỢC) */
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>KaTeX: Vectơ & Công thức hiển thị sắc nét 100%</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadInfographicPng}
                    disabled={isExporting}
                    className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 dark:bg-teal-900/50 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800"
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    <span>Tải ảnh này về</span>
                  </button>
                </div>

                <div className="flex-1 max-h-[250px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner p-2 bg-slate-50 dark:bg-slate-950">
                  {/* BẢN INFOGRAPHIC MẪU SẼ XUẤT ẢNH */}
                  <div
                    ref={infographicRef}
                    className="bg-white p-4 rounded-xl shadow-xs space-y-3 font-sans text-slate-800"
                    style={{ minWidth: '320px' }}
                  >
                    {/* BANNER TIÊU ĐỀ LỚN CHỮ TO BẮT MẮT */}
                    <div className="bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 text-white p-3.5 rounded-xl text-center space-y-1 shadow-sm">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                        <Bookmark size={10} />
                        <span>KIẾN THỨC TRỌNG TÂM SGK 2025</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black tracking-wide uppercase leading-tight drop-shadow-xs">
                        {lessonContent || 'INFOGRAPHIC BÀI HỌC'}
                      </h3>
                    </div>

                    {/* LƯỚI 4 KHỐI THẺ RỰC RỠ, CHỮ TO RÕ NÉT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {parsedSections.map((sec, idx) => {
                        const theme = cardThemes[idx % cardThemes.length];
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border ${theme.border} ${theme.bg} space-y-1.5`}
                          >
                            {sec.title && (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${theme.header}`}>
                                  {sec.title}
                                </span>
                              </div>
                            )}
                            <div className="text-xs leading-relaxed font-medium text-slate-800">
                              <MathJaxRenderer content={sec.body} inline={false} className="text-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* FOOTER GHI NHỚ SƯ PHẠM */}
                    <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-center text-[10.5px] text-teal-800 font-semibold flex items-center justify-center gap-1">
                      <Lightbulb size={12} className="text-amber-500 shrink-0" />
                      <span>Ghi nhớ: Xem kỹ điều kiện vuông góc và các tính chất trọng tâm khi làm bài tập!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-500 shrink-0" />
              <span>Chữ to rõ ràng, ký hiệu vectơ và công thức chuẩn từng milimet.</span>
            </span>
            <button
              type="button"
              onClick={handleDownloadInfographicPng}
              disabled={isExporting}
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Xuất ảnh PNG</span>
            </button>
          </div>
        </div>

        {/* BƯỚC 3: LẤY LỆNH DÁN VÀO CHATGPT HOẶC GEMINI (HOẶC TẢI ẢNH HD TRỰC TIẾP) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">3</span>
                <span>Lấy Lệnh & Mở Vẽ Ảnh</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <><Check size={12} className="text-emerald-500" /> Đã chép!</> : <><Copy size={12} /> Sao chép</>}
              </button>
            </div>

            <textarea
              readOnly
              value={buildFinalPrompt()}
              rows={4}
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10.5px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* CÁC NÚT HÀNH ĐỘNG */}
          <div className="space-y-2 pt-1">
            {/* LỰA CHỌN 1: TẢI ẢNH HD TRỰC TIẾP CHUẨN TOÁN 100% */}
            <button
              type="button"
              onClick={handleDownloadInfographicPng}
              disabled={isExporting}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/25 transition cursor-pointer"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>Tải Ảnh Infographic Chuẩn Toán HD (Khuyên Dùng)</span>
            </button>

            {/* LỰA CHỌN 2: MỞ GEMINI & CHATGPT VỚI CÂU LỆNH CẤM SÁNG TÁC SAI */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopyAndOpen('https://gemini.google.com')}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Mở Gemini</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyAndOpen('https://chatgpt.com')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Mở ChatGPT</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              💡 Bấm <strong>Tải Ảnh Infographic</strong> để có ngay ảnh KaTeX chuẩn toán 100%, không lo AI vẽ méo ký hiệu!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
