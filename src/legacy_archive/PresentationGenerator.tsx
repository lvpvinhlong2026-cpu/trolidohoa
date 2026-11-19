import React, { useState } from 'react';
import { 
  Presentation, 
  Download, 
  Sparkles, 
  Palette, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Edit3, 
  Plus, 
  Trash2, 
  RotateCcw,
  BookOpen,
  User,
  School,
  Loader2,
  FileText,
  Upload,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import pptxgen from 'pptxgenjs';

export interface SlideItem {
  id: string;
  type: 'cover' | 'objectives' | 'warmup' | 'content' | 'example' | 'practice' | 'summary' | 'ending';
  title: string;
  subtitle?: string;
  bullets: string[];
  note?: string;
}

export interface PresentationTheme {
  id: string;
  name: string;
  primaryColor: string;    // HEX không có dấu # cho pptxgen
  secondaryColor: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  accentColor: string;
}

const THEMES: PresentationTheme[] = [
  {
    id: 'ocean',
    name: 'Đại Dương Sư Phạm',
    primaryColor: '0F172A',
    secondaryColor: '0284C7',
    bgColor: 'F8FAFC',
    cardBgColor: 'FFFFFF',
    textColor: '1E293B',
    accentColor: '38BDF8'
  },
  {
    id: 'teal',
    name: 'Ngọc Lam Hiện Đại',
    primaryColor: '0F766E',
    secondaryColor: '14B8A6',
    bgColor: 'F0FDFA',
    cardBgColor: 'FFFFFF',
    textColor: '134E4A',
    accentColor: '2DD4BF'
  },
  {
    id: 'amber',
    name: 'Học Đường Tươi Sáng',
    primaryColor: 'B45309',
    secondaryColor: 'F59E0B',
    bgColor: 'FFFBEB',
    cardBgColor: 'FFFFFF',
    textColor: '78350F',
    accentColor: 'FBBF24'
  },
  {
    id: 'indigo',
    name: 'Hàn Lâm Hoàng Gia',
    primaryColor: '3730A3',
    secondaryColor: '6366F1',
    bgColor: 'EEF2FF',
    cardBgColor: 'FFFFFF',
    textColor: '1E1B4B',
    accentColor: '818CF8'
  },
  {
    id: 'rose',
    name: 'Trang Trọng & Tinh Tế',
    primaryColor: '9F1239',
    secondaryColor: 'F43F5E',
    bgColor: 'FFF1F2',
    cardBgColor: 'FFFFFF',
    textColor: '4C0519',
    accentColor: 'FB7185'
  }
];

interface Props {
  apiKey?: string;
  model?: string;
}

export default function PresentationGenerator({ apiKey, model }: Props) {
  // Thông tin cấu hình
  const [lessonTitle, setLessonTitle] = useState<string>('Hàm số bậc hai và đồ thị');
  const [subject, setSubject] = useState<string>('Toán học');
  const [grade, setGrade] = useState<string>('Lớp 10');
  const [teacherName, setTeacherName] = useState<string>('Giáo viên giảng dạy');
  const [schoolName, setSchoolName] = useState<string>('Trường THPT ....................');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('ocean');

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Tài liệu nguồn bài học để AI trích xuất (tuyệt đối không sáng tác)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [sourceLessonText, setSourceLessonText] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        setSourceLessonText(result.value);
        setUploadedFile({ name: file.name, base64: '', type: 'docx' });
        const lines = result.value.split('\n').filter(l => l.trim().length > 3);
        if (lines[0]) {
          const firstLine = lines[0].replace(/^(BÀI|CHƯƠNG|TIẾT)\s*\d+[\.\:\-]\s*/i, '').trim();
          if (firstLine.length < 60) setLessonTitle(firstLine);
        }
      } catch (err) {
        console.error('Lỗi đọc file docx:', err);
        alert('Không thể đọc file Word này. Vui lòng thử lại hoặc dán nội dung văn bản trực tiếp.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedFile({
          name: file.name,
          base64,
          type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png')
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Danh sách các Slide trong bài giảng
  const [slides, setSlides] = useState<SlideItem[]>([
    {
      id: '1',
      type: 'cover',
      title: 'HÀM SỐ BẬC HAI VÀ ĐỒ THỊ',
      subtitle: 'Bộ sách: Kết nối tri thức với cuộc sống • Chương trình GDPT 2018',
      bullets: [
        'Môn học: Toán học - Lớp 10',
        'Thời lượng: 2 tiết học lý thuyết & luyện tập',
        'Giáo viên: Thầy / Cô giảng dạy'
      ]
    },
    {
      id: '2',
      type: 'objectives',
      title: 'I. MỤC TIÊU BÀI HỌC CẦN ĐẠT',
      subtitle: 'Phát triển phẩm chất & năng lực toán học theo chuẩn GDPT 2018',
      bullets: [
        'Kiến thức: Nhận biết dạng hàm số bậc hai y = ax² + bx + c (a ≠ 0).',
        'Kỹ năng: Xác định tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a.',
        'Vẽ đồ thị parabol: Lập bảng giá trị, xác định chiều bề lõm theo dấu của hệ số a.',
        'Năng lực: Mô hình hóa toán học thông qua các bài toán quỹ đạo ném thực tế.'
      ]
    },
    {
      id: '3',
      type: 'warmup',
      title: 'HOẠT ĐỘNG 1: KHỞI ĐỘNG (WARM-UP)',
      subtitle: 'Quan sát thực tiễn & khơi gợi tình huống có vấn đề',
      bullets: [
        'Tình huống: Khi một cầu thủ sút bóng hoặc tia nước từ vòi phun bổng lên cao.',
        'Câu hỏi: Quỹ đạo chuyển động của quả bóng có hình dạng đường cong gì?',
        'Nhiệm vụ nhóm: Thảo luận nhanh trong 2 phút và nêu 3 ví dụ thực tế về đường cong Parabol quanh em (Cổng trường, cầu treo dây võng, vòm lò sưởi...).'
      ]
    },
    {
      id: '4',
      type: 'content',
      title: 'II. HÌNH THÀNH KIẾN THỨC MỚI',
      subtitle: '1. Khái niệm & Tính chất của Parabol y = ax² + bx + c',
      bullets: [
        'Định nghĩa: Hàm số bậc hai có dạng y = ax² + bx + c (trong đó a, b, c là hằng số, a ≠ 0).',
        'Đỉnh Parabol: Điểm I(-b/2a; -Δ/4a) là điểm thấp nhất (khi a > 0) hoặc cao nhất (khi a < 0).',
        'Trục đối xứng: Đường thẳng thẳng đứng d: x = -b/2a đi qua đỉnh I.',
        'Bề lõm Parabol: Hướng lên trên nếu a > 0; Quay xuống dưới nếu a < 0.'
      ]
    },
    {
      id: '5',
      type: 'example',
      title: 'VÍ DỤ MINH HỌA TRỌNG TÂM',
      subtitle: 'Khảo sát và vẽ đồ thị hàm số y = x² - 4x + 3',
      bullets: [
        'Bước 1: Hệ số a = 1 > 0 => Parabol có bề lõm quay lên trên.',
        'Bước 2: Tọa độ đỉnh I: x_I = -b/(2a) = 4/2 = 2 => y_I = 2² - 4(2) + 3 = -1 => Đỉnh I(2; -1).',
        'Bước 3: Trục đối xứng là đường thẳng x = 2.',
        'Bước 4: Giao điểm trục tung: (0; 3). Giao điểm trục hoành (y = 0): x = 1 và x = 3.'
      ]
    },
    {
      id: '6',
      type: 'practice',
      title: 'HOẠT ĐỘNG 3: LUYỆN TẬP CỦNG CỐ',
      subtitle: 'Trắc nghiệm nhanh & Bài tập vận dụng tại lớp',
      bullets: [
        'Câu 1: Tọa độ đỉnh của parabol y = -2x² + 4x - 1 là điểm nào? (A. (1; 1) | B. (1; -1) | C. (-1; -7))',
        'Câu 2: Trục đối xứng của hàm số y = 3x² - 6x + 5 là đường thẳng nào?',
        'Thử thách 5 phút: Vẽ nhanh hình dáng parabol y = -x² + 2x vào vở và nhận xét tính đơn điệu.'
      ]
    },
    {
      id: '7',
      type: 'summary',
      title: 'HOẠT ĐỘNG 4: VẬN DỤNG & TỰ HỌC TẠI NHÀ',
      subtitle: 'Tổng kết nội dung trọng tâm & Giao nhiệm vụ',
      bullets: [
        'Ghi nhớ cốt lõi: Tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a và quy luật bề lõm theo a.',
        'Bài tập về nhà: Làm các bài tập 6.1 đến 6.4 trong SGK Kết nối tri thức.',
        'Dự án mở rộng: Chụp ảnh một công trình kiến trúc hình Parabol ở địa phương em và xác định đỉnh.'
      ]
    },
    {
      id: '8',
      type: 'ending',
      title: 'CẢM ƠN QUÝ THẦY CÔ VÀ CÁC EM!',
      subtitle: 'Chúc các em học sinh có một tiết học tràn đầy hứng khởi và sáng tạo!',
      bullets: [
        'Tiết học tiếp theo: Ứng dụng hàm số bậc hai trong kinh tế và đời sống.',
        'Mọi thắc mắc học sinh liên hệ qua nhóm học tập lớp hoặc Zalo giáo viên.'
      ]
    }
  ]);

  const currentTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  // ========================================================
  // SINH NỘI DUNG SLIDE BẰNG AI (TRÍCH XUẤT 100% TỪ TÀI LIỆU, CẤM SÁNG TÁC)
  // ========================================================
  const handleGenerateWithAI = async () => {
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập tên bài học cần tạo slide!');
      return;
    }

    if (!uploadedFile && !sourceLessonText.trim()) {
      alert('Vui lòng tải lên file tài liệu bài học (.docx, .pdf, ảnh) hoặc dán nội dung văn bản bên dưới để AI trích xuất chính xác theo tài liệu, tuyệt đối không tự ý sáng tác kiến thức ngoài file!');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const strictInstruction = `[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý SÁNG TÁC NỘI DUNG 100%]:
1. CHỈ ĐƯỢC PHÉP TRÍCH XUẤT 100% TỪ TÀI LIỆU FILE / VĂN BẢN ĐÃ CUNG CẤP.
2. TUYỆT ĐỐI KHÔNG TỰ Ý ĐƯA BẤT KỲ KIẾN THỨC, KHÁI NIỆM, ĐỊNH NGHĨA, ĐỊNH LÝ, CÔNG THỨC TOÁN, HOẶC VÍ DỤ NÀO NẰM NGOÀI TÀI LIỆU NÀY.
3. TUYỆT ĐỐI KHÔNG SUY DIỄN, KHÔNG BỊA ĐẶT NỘI DUNG, KHÔNG TỰ Ý BỔ SUNG KIẾN THỨC TỪ BÊN NGOÀI ĐỂ LẤP ĐẦY SLIDE.
4. MỌI ĐỀ MỤC, ĐỊNH NGHĨA, CÔNG THỨC TRÊN TỪNG SLIDE PHẢI LÀ NGUYÊN VĂN HOẶC TÓM LƯỢC TRUNG THỰC TỪ BẢN GỐC CỦA TÀI LIỆU.
5. NẾU TÀI LIỆU KHÔNG ĐỀ CẬP HOẶC KHÔNG CÓ THÔNG TIN CỦA MỘT PHẦN NÀO ĐÓ, CHỈ BIÊN SOẠN DỰA TRÊN ĐÚNG NHỮNG GÌ TÀI LIỆU ĐANG CÓ.`;

      let rawText = '';

      if (uploadedFile && uploadedFile.base64) {
        // Tải qua /api/convert-pdf
        const res = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [{ base64: uploadedFile.base64, mimeType: uploadedFile.type }],
            customPrompt: `${strictInstruction}

Hãy đọc kỹ toàn bộ tài liệu bài học trong file đính kèm và trích xuất thành đúng 8 Slide trình chiếu PowerPoint:
- Tên bài học: ${lessonTitle}
- Môn học: ${subject}
- Khối lớp: ${grade}

Cấu trúc bắt buộc 8 Slide:
1. Cover: Tiêu đề bài học, môn học, khối lớp.
2. Objectives: Mục tiêu bài học (Chỉ lấy đúng kiến thức trong file tài liệu).
3. Warmup: Hoạt động mở đầu bài học (Nếu trong tài liệu có, nếu không thì lấy bài toán thực tế nêu trong tài liệu).
4. Content: Kiến thức trọng tâm nguyên văn trong tài liệu (Định nghĩa, công thức).
5. Example: Ví dụ minh họa nguyên văn trong tài liệu.
6. Practice: Luyện tập củng cố theo bài tập trong tài liệu.
7. Summary: Tổng kết ghi nhớ theo tài liệu.
8. Ending: Lời kết và dặn dò bài học tiếp theo.

Yêu cầu xuất ra DUY NHẤT một mảng JSON thuần túy (không kèm markdown hay văn bản dẫn dắt):
[
  {
    "id": "1",
    "type": "cover",
    "title": "TIÊU ĐỀ SLIDE",
    "subtitle": "Phụ đề hoặc ghi chú ngắn",
    "bullets": ["Ý 1", "Ý 2", "Ý 3"]
  },
  ...
]`,
            apiKey: apiKey,
            model: model || 'gemini-2.5-flash'
          })
        });

        if (!res.ok) throw new Error('Máy chủ không thể bóc tách file bài giảng.');
        const data = await res.json();
        rawText = data.text || '';
      } else {
        // Sử dụng text đã đọc từ docx hoặc text user dán
        const prompt = `${strictInstruction}

NỘI DUNG TÀI LIỆU BÀI HỌC (CHỈ TRÍCH XUẤT TỪ ĐÂY, TUYỆT ĐỐI CẤM SÁNG TÁC THÊM KIẾN THỨC BÊN NGOÀI):
"""
${sourceLessonText}
"""

Hãy biên soạn dàn ý chi tiết gồm đúng 8 Slide trình chiếu PowerPoint từ tài liệu trên:
- Tên bài học: ${lessonTitle}
- Môn học: ${subject}
- Khối lớp: ${grade}

Cấu trúc bắt buộc 8 Slide:
1. Cover: Tiêu đề bài học, môn học, khối lớp.
2. Objectives: Mục tiêu theo đúng tài liệu.
3. Warmup: Khởi động từ tài liệu.
4. Content: Kiến thức trọng tâm nguyên văn từ tài liệu.
5. Example: Ví dụ minh họa nguyên văn từ tài liệu.
6. Practice: Luyện tập theo tài liệu.
7. Summary: Tổng kết theo tài liệu.
8. Ending: Lời dặn dò theo tài liệu.

Yêu cầu xuất ra DUY NHẤT một mảng JSON thuần túy (không kèm markdown hay văn bản dẫn dắt):
[
  {
    "id": "1",
    "type": "cover",
    "title": "TIÊU ĐỀ SLIDE",
    "subtitle": "Phụ đề hoặc ghi chú ngắn",
    "bullets": ["Ý 1", "Ý 2", "Ý 3"]
  },
  ...
]`;

        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: model || 'gemini-2.5-flash',
            apiKey: apiKey
          })
        });

        if (!res.ok) throw new Error('Lỗi kết nối máy chủ AI.');
        const data = await res.json();
        rawText = data.text || '';
      }
      
      // Bóc tách JSON từ phản hồi AI
      const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
          setActiveSlideIndex(0);
          alert('🎉 Đã trích xuất và tạo thành công 8 Slide bài giảng bám sát 100% tài liệu được tải lên!');
        }
      } else {
        alert('AI đã phản hồi nhưng không khớp định dạng slide. Vui lòng thử lại!');
      }
    } catch (err: any) {
      console.error(err);
      alert('Không thể tạo tự động bằng AI. ' + (err.message || 'Vui lòng kiểm tra API Key trong Cài đặt!'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ========================================================
  // XUẤT FILE MICROSOFT POWERPOINT (.PPTX) BẰNG PPTXGENJS
  // ========================================================
  const handleExportPptx = async () => {
    setIsExporting(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      pres.author = teacherName || 'Giáo viên';
      pres.company = schoolName || 'Bộ Giáo Dục';
      pres.title = lessonTitle;

      const theme = currentTheme;

      slides.forEach((sl, idx) => {
        const slide = pres.addSlide();
        slide.background = { color: theme.bgColor };

        if (sl.type === 'cover') {
          // SLIDE BÌA
          // Banner đầu slide
          slide.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 0.35,
            fill: { color: theme.primaryColor },
            line: { color: theme.primaryColor }
          });

          // Card nền chính giữa
          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.0,
            y: 1.0,
            w: 11.33,
            h: 5.5,
            fill: { color: theme.cardBgColor },
            line: { color: theme.secondaryColor, width: 2 },
            rectRadius: 0.3
          });

          // Tag khối lớp & môn học
          slide.addText(`${subject.toUpperCase()} • ${grade.toUpperCase()}`, {
            x: 1.5,
            y: 1.5,
            w: 10.33,
            h: 0.4,
            fontSize: 14,
            bold: true,
            color: theme.secondaryColor,
            fontFace: 'Arial'
          });

          // Tiêu đề bài học
          slide.addText(sl.title, {
            x: 1.5,
            y: 2.1,
            w: 10.33,
            h: 1.4,
            fontSize: 34,
            bold: true,
            color: theme.primaryColor,
            fontFace: 'Arial'
          });

          // Phụ đề
          if (sl.subtitle) {
            slide.addText(sl.subtitle, {
              x: 1.5,
              y: 3.6,
              w: 10.33,
              h: 0.6,
              fontSize: 16,
              italic: true,
              color: '64748B',
              fontFace: 'Arial'
            });
          }

          // Thông tin giáo viên & trường
          slide.addShape(pres.ShapeType.line, {
            x: 1.5,
            y: 4.4,
            w: 10.33,
            h: 0,
            line: { color: 'E2E8F0', width: 1.5 }
          });

          slide.addText(`Giáo viên: ${teacherName}  |  Đơn vị: ${schoolName}`, {
            x: 1.5,
            y: 4.8,
            w: 10.33,
            h: 0.5,
            fontSize: 15,
            bold: true,
            color: theme.textColor,
            fontFace: 'Arial'
          });

        } else if (sl.type === 'ending') {
          // SLIDE KẾT THÚC
          slide.addShape(pres.ShapeType.roundRect, {
            x: 1.5,
            y: 1.2,
            w: 10.33,
            h: 5.0,
            fill: { color: theme.primaryColor },
            line: { color: theme.secondaryColor, width: 2 },
            rectRadius: 0.3
          });

          slide.addText(sl.title, {
            x: 1.8,
            y: 2.0,
            w: 9.73,
            h: 1.2,
            fontSize: 34,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            fontFace: 'Arial'
          });

          if (sl.subtitle) {
            slide.addText(sl.subtitle, {
              x: 1.8,
              y: 3.4,
              w: 9.73,
              h: 0.8,
              fontSize: 18,
              italic: true,
              color: theme.accentColor,
              align: 'center',
              fontFace: 'Arial'
            });
          }

        } else {
          // SLIDE NỘI DUNG CHUẨN
          // Header Banner
          slide.addShape(pres.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 1.1,
            fill: { color: theme.primaryColor },
            line: { color: theme.primaryColor }
          });

          // Tiêu đề Slide
          slide.addText(sl.title, {
            x: 0.8,
            y: 0.15,
            w: 11.5,
            h: 0.5,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
          });

          // Phụ đề Slide
          if (sl.subtitle) {
            slide.addText(sl.subtitle, {
              x: 0.8,
              y: 0.65,
              w: 11.5,
              h: 0.35,
              fontSize: 13,
              italic: true,
              color: theme.accentColor,
              fontFace: 'Arial'
            });
          }

          // Card nội dung trung tâm
          slide.addShape(pres.ShapeType.roundRect, {
            x: 0.8,
            y: 1.4,
            w: 11.73,
            h: 5.4,
            fill: { color: theme.cardBgColor },
            line: { color: 'E2E8F0', width: 1.5 },
            rectRadius: 0.2
          });

          // Các điểm nội dung (Bullets)
          const bulletItems = sl.bullets.map((b) => ({
            text: `  ${b}\n\n`,
            options: {
              bullet: { code: '2022' },
              color: theme.textColor,
              fontSize: 16,
              fontFace: 'Arial',
              lineSpacingMultiple: 1.2
            }
          }));

          slide.addText(bulletItems as any, {
            x: 1.2,
            y: 1.7,
            w: 10.93,
            h: 4.8,
            valign: 'top',
            align: 'left'
          });

          // Footer chỉ số Slide
          slide.addText(`Slide ${idx + 1} / ${slides.length}  •  ${subject} - ${grade}`, {
            x: 0.8,
            y: 7.0,
            w: 11.73,
            h: 0.3,
            fontSize: 10,
            color: '94A3B8',
            align: 'right',
            fontFace: 'Arial'
          });
        }
      });

      await pres.writeFile({
        fileName: `Bai_giang_${lessonTitle.replace(/[\s\/\\]+/g, '_')}.pptx`
      });
    } catch (err) {
      console.error('Export PPTX error:', err);
      alert('Đã xảy ra lỗi khi tạo file PowerPoint.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateCurrentSlide = (field: keyof SlideItem, val: any) => {
    const updated = [...slides];
    updated[activeSlideIndex] = {
      ...updated[activeSlideIndex],
      [field]: val
    };
    setSlides(updated);
  };

  const handleUpdateBullet = (bulletIdx: number, val: string) => {
    const updated = [...slides];
    const curBullets = [...updated[activeSlideIndex].bullets];
    curBullets[bulletIdx] = val;
    updated[activeSlideIndex].bullets = curBullets;
    setSlides(updated);
  };

  const handleAddBullet = () => {
    const updated = [...slides];
    updated[activeSlideIndex].bullets.push('Ý nội dung mới...');
    setSlides(updated);
  };

  const handleRemoveBullet = (bIdx: number) => {
    const updated = [...slides];
    updated[activeSlideIndex].bullets.splice(bIdx, 1);
    setSlides(updated);
  };

  const currentSlide = slides[activeSlideIndex] || slides[0];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Presentation size={20} />
            </div>
            <span>Trình Tạo Slide Bài Giảng PowerPoint (.pptx) Sư Phạm</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Thiết kế bài giảng chuẩn 8 hoạt động GDPT 2018, tùy chọn màu sắc sư phạm và tải file PowerPoint mở chỉnh sửa 100%.
          </p>
        </div>

        {/* NÚT TẢI FILE POWERPOINT VÀ TẠO BẰNG AI */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Dùng Gemini AI để tạo toàn bộ nội dung bài giảng"
          >
            {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isGeneratingAI ? 'AI đang soạn slide...' : 'AI Soạn Slide Tự Động'}</span>
          </button>

          <button
            onClick={handleExportPptx}
            disabled={isExporting}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Tải file .pptx để mở trên Microsoft PowerPoint"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Tải File PowerPoint (.pptx)</span>
          </button>
        </div>
      </div>

      {/* BANNER CAM KẾT CHỐNG SÁNG TÁC NỘI DUNG */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
        <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="space-y-0.5">
          <div className="font-extrabold uppercase tracking-wide">
            Cam kết bám sát tài liệu 100% - Tuyệt đối không tự ý sáng tác:
          </div>
          <p className="text-[11.5px] text-emerald-700/90 dark:text-emerald-300/90">
            Hệ thống AI chỉ trích xuất và cô đọng đúng các kiến thức, công thức và ví dụ có trong file tài liệu được tải lên hoặc nội dung bài học cung cấp bên dưới. Tuyệt đối không đưa kiến thức ngoài file!
          </p>
        </div>
      </div>

      {/* GRID: BÊN TRÁI CẤU HÌNH BÀI HỌC & CHỌN THEME, BÊN PHẢI BẢN XEM TRƯỚC SLIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 CỘT): CẤU HÌNH THÔNG TIN & DANH SÁCH SLIDE */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* KHU VỰC TẢI LÊN TÀI LIỆU NGUỒN ĐỂ SOẠN SLIDE */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-emerald-600" />
                <span>Tài Liệu Nguồn Bài Học (File / Văn bản)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold">
                Bắt buộc
              </span>
            </div>

            {/* Ô Tải File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.pdf,image/png,image/jpeg,image/jpg"
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 rounded-xl bg-white dark:bg-slate-900 text-center cursor-pointer transition hover:bg-emerald-50/40"
            >
              <Upload size={20} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {uploadedFile ? uploadedFile.name : 'Bấm để chọn file tài liệu (.docx, .pdf, ảnh)'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {uploadedFile ? '✓ Đã tải tài liệu thành công. Bấm để đổi file khác.' : 'AI sẽ đọc tài liệu này để soạn slide, không lấy kiến thức ngoài.'}
              </p>
            </div>

            {/* Ô dán nội dung văn bản nếu thầy cô muốn copy trực tiếp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Hoặc dán nội dung bài học từ SGK/Giáo án:
                </label>
                {sourceLessonText && (
                  <button
                    type="button"
                    onClick={() => { setSourceLessonText(''); setUploadedFile(null); }}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Xóa nội dung
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={sourceLessonText}
                onChange={(e) => setSourceLessonText(e.target.value)}
                placeholder="Dán các định nghĩa, định lý, công thức, ví dụ từ SGK vào đây để AI chỉ trích xuất từ nội dung này..."
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* KHỐI THÔNG TIN BÀI HỌC */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Thông tin bài giảng:
            </span>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Tên bài học:</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                placeholder="VD: Hàm số bậc hai và đồ thị..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Môn học:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Khối lớp:</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Tên giáo viên:</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Đơn vị / Trường:</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* CHỌN CHỦ ĐỀ MÀU SẮC SƯ PHẠM */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Bảng màu thiết kế:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const isSelected = theme.id === selectedThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-teal-500 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0" 
                        style={{ backgroundColor: `#${theme.primaryColor}` }}
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {theme.name}
                      </span>
                    </div>
                    {isSelected && <Check size={13} className="text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DANH SÁCH THUMBNAIL TỪNG SLIDE */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Danh sách Slide ({slides.length}):
            </span>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {slides.map((sl, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <button
                    key={sl.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">
                      <strong>Slide {idx + 1}:</strong> {sl.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold opacity-60 ml-1 shrink-0">
                      {sl.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 CỘT): XEM TRƯỚC SLIDE VÀ CHỈNH SỬA TỪNG SLIDE */}
        <div className="lg:col-span-8 space-y-4">
          {/* THANH ĐIỀU HƯỚNG SLIDE */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                title="Slide trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Slide {activeSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                title="Slide sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Chế độ tỷ lệ chuẩn 16:9 widescreen
            </div>
          </div>

          {/* KHUNG XEM TRƯỚC TRỰC QUAN CỦA SLIDE HIỆN TẠI (TỶ LỆ 16:9) */}
          <div 
            className="w-full aspect-video rounded-3xl p-6 sm:p-10 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between overflow-hidden relative select-none transition-all"
            style={{ 
              backgroundColor: `#${currentTheme.bgColor}`,
              color: `#${currentTheme.textColor}`
            }}
          >
            {currentSlide.type === 'cover' ? (
              // BẢN XEM TRƯỚC SLIDE BÌA
              <div 
                className="w-full h-full rounded-2xl p-6 sm:p-8 flex flex-col justify-between border-2 shadow-xs"
                style={{ 
                  backgroundColor: `#${currentTheme.cardBgColor}`,
                  borderColor: `#${currentTheme.secondaryColor}`
                }}
              >
                <div>
                  <div 
                    className="text-xs sm:text-sm font-extrabold tracking-wider uppercase mb-2"
                    style={{ color: `#${currentTheme.secondaryColor}` }}
                  >
                    {subject.toUpperCase()} • {grade.toUpperCase()}
                  </div>
                  <h1 
                    className="text-2xl sm:text-4xl font-extrabold leading-tight"
                    style={{ color: `#${currentTheme.primaryColor}` }}
                  >
                    {currentSlide.title}
                  </h1>
                  {currentSlide.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 italic mt-2">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold flex flex-wrap justify-between gap-2">
                  <span>Giáo viên: {teacherName}</span>
                  <span>Đơn vị: {schoolName}</span>
                </div>
              </div>
            ) : currentSlide.type === 'ending' ? (
              // BẢN XEM TRƯỚC SLIDE KẾT
              <div 
                className="w-full h-full rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg"
                style={{ backgroundColor: `#${currentTheme.primaryColor}`, color: '#ffffff' }}
              >
                <h1 className="text-2xl sm:text-4xl font-extrabold mb-3">
                  {currentSlide.title}
                </h1>
                <p 
                  className="text-sm sm:text-lg italic"
                  style={{ color: `#${currentTheme.accentColor}` }}
                >
                  {currentSlide.subtitle}
                </p>
              </div>
            ) : (
              // BẢN XEM TRƯỚC SLIDE NỘI DUNG
              <>
                {/* Banner đầu */}
                <div 
                  className="-mx-6 -mt-6 sm:-mx-10 sm:-mt-10 p-4 sm:px-8 text-white shadow-xs"
                  style={{ backgroundColor: `#${currentTheme.primaryColor}` }}
                >
                  <h2 className="text-base sm:text-xl font-bold">{currentSlide.title}</h2>
                  {currentSlide.subtitle && (
                    <p 
                      className="text-xs italic mt-0.5"
                      style={{ color: `#${currentTheme.accentColor}` }}
                    >
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                {/* Card nội dung */}
                <div 
                  className="flex-1 my-4 p-5 rounded-2xl shadow-xs overflow-y-auto space-y-3"
                  style={{ backgroundColor: `#${currentTheme.cardBgColor}` }}
                >
                  {currentSlide.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                      <span 
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0" 
                        style={{ backgroundColor: `#${currentTheme.secondaryColor}` }}
                      />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="text-[10px] sm:text-xs text-slate-400 text-right">
                  Slide {activeSlideIndex + 1} / {slides.length} • {lessonTitle}
                </div>
              </>
            )}
          </div>

          {/* CHỈNH SỬA NHANH NỘI DUNG SLIDE ĐANG CHỌN */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={14} className="text-teal-600" />
                <span>Chỉnh sửa nội dung Slide {activeSlideIndex + 1}:</span>
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Tiêu đề Slide:</label>
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleUpdateCurrentSlide('title', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Phụ đề Slide:</label>
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={(e) => handleUpdateCurrentSlide('subtitle', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-500">Các ý nội dung (Bullets):</label>
                <button
                  onClick={handleAddBullet}
                  className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Thêm ý</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {currentSlide.bullets.map((b, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{bIdx + 1}.</span>
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => handleUpdateBullet(bIdx, e.target.value)}
                      className="flex-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    {currentSlide.bullets.length > 1 && (
                      <button
                        onClick={() => handleRemoveBullet(bIdx)}
                        className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                        title="Xóa ý này"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
