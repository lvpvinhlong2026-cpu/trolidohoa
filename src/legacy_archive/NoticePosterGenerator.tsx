import React, { useState, useRef } from 'react';
import { 
  Megaphone, 
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
  AlertCircle
} from 'lucide-react';

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

const PRESET_NOTICES = [
  {
    label: 'Lễ Khai Giảng',
    text: 'Sở GD&ĐT Vĩnh Long - Trường THPT Thạnh Phước thông báo Kế hoạch tổ chức Lễ Khai Giảng Năm Học Mới 2026 - 2027 vào lúc 07h00 ngày 05/09/2026 tại Sân trường.',
    theme: 'Học đường 3D tươi sáng, cờ hoa rực rỡ'
  },
  {
    label: 'Họp Phụ Huynh',
    text: 'Trường THPT Thạnh Phước kính mời Quý cha mẹ học sinh tham dự Phiên Họp Phụ Huynh Đầu Năm Học vào lúc 08h00 Chủ Nhật ngày 13/09/2026 tại Phòng học các lớp.',
    theme: 'Trang trọng, ấm cúng, gắn kết gia đình - nhà trường'
  },
  {
    label: 'Tập huấn Chuyển đổi số',
    text: 'Thông báo tổ chức Hội nghị Tập huấn Nâng cao Năng lực Chuyển đổi số và Ứng dụng AI trong Dạy học cho giáo viên toàn trường vào ngày 15/11/2026 tại Phòng Hội đồng.',
    theme: 'Cyber công nghệ hiện đại, tông neon xanh tím'
  },
  {
    label: 'Hội thao học sinh',
    text: 'Đoàn trường phát động Giải Thể Thao Học Sinh Chào Mừng 26/3 gồm bóng đá, cầu lông, kéo co. Khai mạc 07h30 sáng Thứ Bảy tại Nhà thi đấu đa năng.',
    theme: 'Năng động, rực rỡ, nhiệt huyết tuổi trẻ'
  }
];

export default function NoticePosterGenerator({ apiKey, model }: Props) {
  const [noticeContent, setNoticeContent] = useState(
    'Sở GD&ĐT Vĩnh Long - Trường THPT Thạnh Phước thông báo Kế hoạch tổ chức Lễ Khai Giảng Năm Học Mới 2026 - 2027 vào lúc 07h00 ngày 05/09/2026 tại Sân trường.'
  );
  const [posterStyle, setPosterStyle] = useState('Học đường 3D (Loa đỏ, cờ hoa, học sinh hoạt hình)');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState(
    '1. Đơn vị: SỞ GD&ĐT VĨNH LONG - TRƯỜNG THPT THẠNH PHƯỚC\n2. Tiêu đề nổi bật: THÔNG BÁO - LỄ KHAI GIẢNG NĂM HỌC 2026 - 2027\n3. Thời gian: 07h00, Thứ Bảy ngày 05/09/2026\n4. Địa điểm: Sân lễ trung tâm nhà trường\n5. Thành phần: Toàn thể Cán bộ, Giáo viên và Học sinh\n6. Lưu ý: Học sinh mặc đồng phục chỉnh tề, có mặt trước 15 phút.'
  );
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
      setNoticeContent('Công văn: ' + cleanName);
      setAnalyzedContent(`[File: ${file.name}]\nĐang chờ bóc tách... Bấm nút "Bóc Tách Công Văn Từ File (100% Gốc)" bên dưới để AI tự động trích xuất thông tin.`);
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

  // BƯỚC 1: PHÂN TÍCH NỘI DUNG THÔNG BÁO HOẶC BÓC TÁCH TỪ FILE GỐC
  const handleAnalyze = async () => {
    if (!noticeContent.trim() && !uploadedFile) return;

    setIsAnalyzing(true);
    setUploadError('');

    try {
      if (uploadedFile) {
        const strictPrompt = `Bạn là Chuyên gia Bóc tách Công văn & Thông báo Học đường.
Nhiệm vụ: Hãy đọc kỹ toàn bộ nội dung từ file đính kèm (Ảnh thông báo hoặc file PDF công văn) và trích xuất thành các thông tin chính xác phục vụ thiết kế Poster.

[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý SÁNG TÁC]:
1. CHỈ TRÍCH XUẤT 100% THÔNG TIN CÓ TRONG TÀI LIỆU/ẢNH ĐÍNH KÈM.
2. TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC, KHÔNG BỊA ĐẶT THỜI GIAN, ĐỊA ĐIỂM, ĐƠN VỊ HAY QUY ĐỊNH NGOÀI TÀI LIỆU.
3. Trình bày trung thực theo cấu trúc:
   1. Đơn vị tổ chức: (Tên cơ quan, trường học trong file)
   2. Tiêu đề sự kiện: (Tiêu đề chính xác trong file)
   3. Thời gian: (Ngày, giờ chính xác trong file)
   4. Địa điểm: (Địa điểm cụ thể trong file)
   5. Thành phần tham dự: (Đối tượng tham dự theo file)
   6. Yêu cầu / Lưu ý quan trọng: (Trang phục, thời gian có mặt theo file)
4. Nếu file không đề cập mục nào, hãy ghi "Theo kế hoạch nhà trường", tuyệt đối không tự bịa ra thông tin sai lệch.
5. Chỉ trả về nội dung bóc tách sạch sẽ, không có lời mở đầu hay kết luận.`;

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
          setAnalyzedContent(data.text.trim());
        } else {
          throw new Error('Không trích xuất được nội dung từ file.');
        }
        return;
      }

      if (!apiKey) {
        setAnalyzedContent(
          `1. Đơn vị tổ chức: [Trường học / Cơ quan]\n2. Tiêu đề sự kiện: [TIÊU ĐỀ VIẾT HOA]\n3. Thời gian: [Ngày, giờ cụ thể]\n4. Địa điểm: [Hội trường / Sân trường]\n5. Thành phần tham dự: [Giáo viên / Học sinh / Phụ huynh]\n6. Lưu ý quan trọng: [Trang phục, thời gian có mặt].`
        );
        return;
      }

      const promptRule = `Bạn là Chuyên gia Thiết kế Poster Học đường.
[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC NỘI DUNG]:
1. CHỈ TRÍCH XUẤT 100% NỘI DUNG TỪ ĐOẠN VĂN BẢN ĐÃ CUNG CẤP DƯỚI ĐÂY:
"""
${noticeContent}
"""
2. TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý ĐƯA THÊM BẤT KỲ THÔNG TIN, THỜI GIAN, ĐỊA ĐIỂM, THÀNH PHẦN HAY DỮ LIỆU NÀO NGOÀI NỘI DUNG TRÊN.
Bóc tách rõ ràng thành các mục: Đơn vị, Tiêu đề sự kiện trọng tâm, Thời gian, Địa điểm, Thành phần tham dự, Lưu ý.`;

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
        }
      }
    } catch (e: any) {
      console.error(e);
      setUploadError(e.message || 'Có lỗi xảy ra khi phân tích công văn.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // BƯỚC 3: XÂY DỰNG CÂU LỆNH VẼ ẢNH POSTER
  const buildFinalPrompt = () => {
    const isFromUploadedFile = Boolean(uploadedFile);

    return `Bạn là Họa sĩ Thiết kế Đồ họa AI. Hãy sử dụng công cụ tạo ảnh (Imagen 3 trên Gemini hoặc DALL-E 3 trên ChatGPT) để VẼ TRỰC TIẾP một bức ảnh Poster Thông Báo Học Đường (3D School Notice Poster) tuyệt đẹp:

${isFromUploadedFile ? `[YÊU CẦU BẮT BUỘC - TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC NỘI DUNG]:
- Chỉ thể hiện chính xác 100% các thông tin dưới đây (được bóc tách trực tiếp từ văn bản/ảnh gốc, không tự bịa thời gian, địa điểm hay dữ liệu ngoài file):` : 'NỘI DUNG THÔNG BÁO CẦN THỂ HIỆN:'}

${analyzedContent.trim()}

PHONG CÁCH & BỐ CỤC:
- Phong cách: ${posterStyle}.
- Điểm nhấn: Chiếc loa phát thanh 3D màu đỏ nổi bật, sách vở, cờ hoa lễ hội, học sinh hoạt hình vui tươi.
- Khung hình: Khổ dọc (tỉ lệ 3:4 hoặc 4:5), ánh sáng rực rỡ, bầu trời xanh tươi sáng, bố cục trang trọng và hiện đại.

YÊU CẦU: Hãy trực tiếp vẽ và hiển thị bức ảnh Poster này ngay bây giờ!`;
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
    setNoticeContent('');
    setAnalyzedContent('');
    handleRemoveFile();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
          <Megaphone size={14} />
          <span>Poster Thông Báo • 3 Bước Đơn Giản</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Vẽ Ảnh Poster & Thông Báo Học Đường 3D
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Quy trình chuẩn 3 bước: Tải file Công văn/Ảnh thông báo hoặc nhập &rarr; Bóc tách chuẩn 100% &rarr; Mở ChatGPT / Gemini vẽ ảnh ngay.
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
              <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Làm mới">
                <RotateCcw size={14} />
              </button>
            </div>

            {/* KHU VỰC TẢI FILE CÔNG VĂN / ẢNH THÔNG BÁO */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tải file Công văn Ảnh hoặc PDF:
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
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <UploadCloud size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline block">
                      Bấm để tải file hoặc Kéo thả vào đây
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Ảnh chụp văn bản (.png, .jpg) hoặc file PDF công văn
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {uploadedFile.previewUrl ? (
                        <img 
                          src={uploadedFile.previewUrl} 
                          alt="preview" 
                          className="w-8 h-8 rounded-lg object-cover border border-rose-300 dark:border-rose-700 shrink-0" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                          {uploadedFile.type.includes('pdf') ? <FileText size={16} /> : <ImageIcon size={16} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-rose-950 dark:text-rose-200 truncate" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400">
                          {formatFileSize(uploadedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition"
                      title="Xóa file này"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-rose-100/70 dark:bg-rose-900/50 text-[10px] text-rose-800 dark:text-rose-300 font-medium flex items-center gap-1">
                    <ShieldCheck size={11} className="text-rose-600 shrink-0" />
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

            {/* NHẬP VĂN BẢN NỘI DUNG CÔNG VĂN */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {uploadedFile ? 'Ghi chú thêm (tùy chọn):' : 'Hoặc nhập nội dung công văn / Thông báo:'}
              </label>
              <textarea
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="Dán nội dung công văn, thông báo sự kiện trường lớp vào đây..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 leading-relaxed resize-none"
              />
            </div>

            {/* CHỌN PHONG CÁCH */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Phong cách ảnh 3D:
              </label>
              <select
                value={posterStyle}
                onChange={(e) => setPosterStyle(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Học đường 3D (Loa đỏ, cờ hoa, học sinh hoạt hình)">Học đường 3D (Loa phát thanh đỏ, cờ hoa, học sinh)</option>
                <option value="Trang trọng & Ấm cúng (Phong cách hội nghị, hoa tươi)">Trang trọng & Ấm cúng (Họp phụ huynh, lễ nghi)</option>
                <option value="Cyber AI & Công nghệ (Neon xanh tím, tương lai)">Cyber AI & Công nghệ (Tập huấn, chuyển đổi số)</option>
                <option value="Hội thao thể thao (Năng động, rực rỡ nhiệt huyết)">Hội thao học sinh (Năng động, nhiệt huyết)</option>
              </select>
            </div>

            {/* MẪU THÔNG BÁO NHANH */}
            {!uploadedFile && (
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1">Sự kiện gợi ý nhanh:</span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_NOTICES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoticeContent(p.text)}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
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
            disabled={(!noticeContent.trim() && !uploadedFile) || isAnalyzing}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{uploadedFile ? 'Đang bóc tách công văn...' : 'Đang phân tích...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{uploadedFile ? 'Bóc Tách Công Văn Từ File (100% Gốc)' : 'Phân Tích Thông Báo'}</span>
              </>
            )}
          </button>
        </div>

        {/* BƯỚC 2: NỘI DUNG CẦN THỂ HIỆN */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">2</span>
                <span>Nội Dung Cần Thể Hiện</span>
              </span>
              {uploadedFile && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Chuẩn theo file gốc
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Chi tiết các thông tin sẽ xuất hiện trên poster (Có thể chỉnh sửa):
            </p>

            <textarea
              value={analyzedContent}
              onChange={(e) => setAnalyzedContent(e.target.value)}
              placeholder="Chi tiết đơn vị, tiêu đề sự kiện, thời gian, địa điểm, thành phần..."
              className="w-full flex-1 min-h-[170px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-900 text-xs font-sans text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed resize-none"
            />
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500 shrink-0" />
            <span>Mẹo: Giữ thông tin ngắn gọn, tập trung vào Thời gian & Địa điểm để poster ấn tượng nhất.</span>
          </div>
        </div>

        {/* BƯỚC 3: LẤY LỆNH DÁN VÀO CHATGPT HOẶC GEMINI */}
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
              rows={5}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* 2 NÚT MỞ TRỰC TIẾP */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => handleCopyAndOpen('https://gemini.google.com')}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-blue-500/25 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">G</span>
                <span>Sao chép & Mở Google Gemini</span>
              </div>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleCopyAndOpen('https://chatgpt.com')}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-emerald-500/25 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">C</span>
                <span>Sao chép & Mở ChatGPT (DALL-E)</span>
              </div>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 transition" />
            </button>

            <p className="text-[10.5px] text-center text-slate-400">
              💡 Bấm nút &rarr; Sang trang AI chỉ cần ấn <strong>Ctrl + V</strong> và <strong>Enter</strong> là xong!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
