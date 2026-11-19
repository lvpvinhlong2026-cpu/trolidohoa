import React, { useState } from 'react';
import { Wand2, Sparkles, Copy, Check, ExternalLink, Loader2, Lightbulb, RotateCcw } from 'lucide-react';

interface Props {
  apiKey?: string;
  model?: string;
  onOpenGemModal?: () => void;
  onReset?: () => void;
}

const PRESET_MATH_PROBLEMS = [
  { label: 'Xe lên dốc 30°', text: 'Một chiếc ô tô đang chuyển động lên một đoạn dốc nghiêng 30 độ so với phương ngang, vận tốc 60 km/h.' },
  { label: 'Hải đăng & Con thuyền', text: 'Một ngọn hải đăng cao 50m nhìn ra biển, từ đỉnh hải đăng nhìn thấy một con thuyền với góc hạ 30 độ.' },
  { label: 'Bể nước hình trụ', text: 'Một bể chứa nước hình trụ có bán kính đáy 1.5m, chiều cao 3m, đang được xả nước với tốc độ không đổi.' },
  { label: 'Lợi nhuận bán hàng', text: 'Một cửa hàng bán khăn len với giá gốc 30,000đ, khi tăng giá thêm 1,000đ thì số lượng bán giảm 100 chiếc.' },
];

export default function DirectImageGenerator({ apiKey, model }: Props) {
  const [topic, setTopic] = useState('Một chiếc ô tô đang chuyển động lên một đoạn dốc nghiêng 30 độ so với phương ngang.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState(
    '1. Trích xuất số liệu: "30°", "Vận tốc: 60 km/h".\n2. Nhãn song ngữ: Gắn nhãn mũi tên "Góc nghiêng (Incline): 30°", nhãn xe "Vận tốc (Velocity): 60 km/h".\n3. Bố cục phẳng (Flat Vector): Vẽ một chiếc xe ô tô màu đỏ đơn giản đang lên mặt dốc tam giác vuông, nền trắng tinh khiết.'
  );
  const [copied, setCopied] = useState(false);

  // BƯỚC 1: PHÂN TÍCH BÀI TOÁN
  const handleAnalyze = async () => {
    if (!topic.trim()) return;

    if (!apiKey) {
      setAnalyzedContent(
        `1. Trích xuất số liệu quan trọng từ bài toán: "${topic}".\n2. Nhãn song ngữ: Gắn nhãn các đại lượng chính bằng Tiếng Việt - Tiếng Anh (VD: Chiều cao / Height, Góc / Angle).\n3. Bố cục: Đồ họa vector phẳng tối giản trên nền trắng tinh khiết.`
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const promptRule = `Bạn là Chuyên gia Đồ họa SGK Toán học.
[QUY TẮC BẮT BUỘC TỐI THƯỢNG - TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý SÁNG TÁC NỘI DUNG]:
1. CHỈ TRÍCH XUẤT 100% CÁC SỐ LIỆU VÀ ĐẠI LƯỢNG HÌNH HỌC CÓ THỰC TỪ BÀI TOÁN SAU:
"""
${topic}
"""
2. TUYỆT ĐỐI KHÔNG TỰ Ý ĐƯA THÊM BẤT KỲ SỐ LIỆU, GIẢ THIẾT, HÌNH ẢNH HOẶC KIẾN THỨC NÀO NGOÀI ĐỀ BÀI ĐÃ CHO.
3. Trích xuất 1-3 con số quan trọng, thiết lập nhãn song ngữ Anh-Việt chuẩn xác, và mô tả vật thể phẳng cần vẽ trên nền trắng thuần khiết (#FFFFFF).`;

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
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // BƯỚC 3: XÂY DỰNG CÂU LỆNH VẼ ẢNH
  const buildFinalPrompt = () => {
    return `Bạn là Chuyên gia Đồ họa Toán học SGK GDPT 2018. Hãy dùng công cụ tạo ảnh (Imagen 3 trên Gemini hoặc DALL-E 3 trên ChatGPT) để VẼ TRỰC TIẾP một bức tranh minh họa bài toán thực tế:

NỘI DUNG BÀI TOÁN (BÁM SÁT 100%, TUYỆT ĐỐI CẤM SÁNG TÁC THÊM DỮ LIỆU):
"${topic}"

NỘI DUNG CẦN THỂ HIỆN TRÊN ẢNH:
${analyzedContent.trim()}

QUY TẮC BẮT BUỘC VỀ ĐỒ HỌA TOÁN HỌC:
1. TUYỆT ĐỐI KHÔNG TỰ Ý SÁNG TÁC THÊM KIẾN THỨC HAY CHI TIẾT NGOÀI ĐỀ BÀI.
2. BỐ CỤC PHẲNG (flat vector illustration), các nét vẽ rõ ràng, tối giản, trên NỀN TRẮNG TINH KHIẾT (pure solid white background).
3. Hiển thị nhãn số liệu rõ ràng, không vẽ người hoặc cảnh nền phức tạp làm phân tán tư duy học sinh.

YÊU CẦU: Hãy trực tiếp vẽ và hiển thị bức ảnh này ngay bây giờ!`;
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
    setTopic('');
    setAnalyzedContent('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 font-bold text-xs uppercase tracking-wider">
          <Wand2 size={14} />
          <span>Trợ Lý Prompt AI • 3 Bước Đơn Giản</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Vẽ Hình Minh Họa Bài Toán Thực Tế
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Quy trình chuẩn 3 bước: Nhập bài toán &rarr; Trích xuất nội dung cần thể hiện &rarr; Bấm mở ChatGPT / Gemini để vẽ ảnh ngay.
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

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nhập đề bài toán thực tế:
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Dán câu hỏi bài toán chuyển động, tối ưu, hình học thực tế vào đây..."
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 leading-relaxed resize-none"
              />
            </div>

            {/* Mẫu bài toán nhanh */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-1">Bài toán mẫu nhanh:</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_MATH_PROBLEMS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(p.text)}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!topic.trim() || isAnalyzing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</> : <><Sparkles size={16} /> Phân Tích Bài Toán</>}
          </button>
        </div>

        {/* BƯỚC 2: NỘI DUNG CẦN THỂ HIỆN */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2 flex-1 flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>Nội Dung Cần Thể Hiện</span>
            </span>

            <p className="text-[11px] text-slate-400">
              Số liệu trích xuất, nhãn song ngữ và vật thể vẽ (Có thể chỉnh sửa):
            </p>

            <textarea
              value={analyzedContent}
              onChange={(e) => setAnalyzedContent(e.target.value)}
              placeholder="Nội dung miêu tả các nhãn số liệu và hình vẽ phẳng..."
              className="w-full flex-1 min-h-[170px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-900 text-xs font-sans text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-none"
            />
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500 shrink-0" />
            <span>Mẹo: Chỉ giữ lại 1 - 3 số liệu quan trọng nhất để hình vẽ không bị rối.</span>
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
