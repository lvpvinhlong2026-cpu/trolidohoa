import React, { useState } from 'react';
import { Palette, Sparkles, Copy, Check, ExternalLink, Loader2, Lightbulb, Box, Grid, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface Props {
  apiKey?: string;
  model?: string;
  onOpenGemModal?: () => void;
}

const PRESET_TOPICS = [
  { label: 'Đạo hàm (Đố chữ)', text: 'Đạo hàm', mode: 'multi_images' as const },
  { label: 'Tích phân (Đố chữ)', text: 'Tích phân', mode: 'multi_images' as const },
  { label: 'Quang hợp (2D Phẳng)', text: 'Quang hợp ở thực vật', mode: '2d_blend' as const },
  { label: 'Lực ma sát (3D Pixar)', text: 'Lực ma sát khi đẩy hộp gỗ', mode: '3d_blend' as const },
  { label: 'Sóng âm (2D Phẳng)', text: 'Sự truyền sóng âm trong không khí', mode: '2d_blend' as const },
];

export default function IllustrationGenerator({ apiKey, model }: Props) {
  const [topic, setTopic] = useState('Đạo hàm');
  const [imageMode, setImageMode] = useState<'multi_images' | '2d_blend' | '3d_blend'>('multi_images');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState(
    'Biểu tượng 1: Một vị đạo sĩ mặc áo lam truyền thống, tay cầm phất trần đứng nghiêm trang.\nBiểu tượng 2: Một chiếc mô hình hàm răng trắng sáng khổng lồ xếp ngay bên cạnh.\n(Học sinh ghép lại: Đạo sĩ + Hàm răng = Đạo hàm)'
  );
  const [copied, setCopied] = useState(false);

  // BƯỚC 1: AI PHÂN TÍCH HOẶC GỢI Ý
  const handleAnalyze = async () => {
    if (!topic.trim()) return;

    if (!apiKey) {
      // Fallback thông minh không cần API key
      if (imageMode === 'multi_images') {
        setAnalyzedContent(
          `Ý tưởng đố chữ cho "${topic}":\nBiểu tượng 1: Hình ảnh đồ vật thứ nhất đồng âm với vần đầu.\nBiểu tượng 2: Hình ảnh đồ vật thứ hai đồng âm với vần sau.\n(Bố cục đặt cạnh nhau trên nền trắng tinh khiết để học sinh liên tưởng đoán từ)`
        );
      } else if (imageMode === '2d_blend') {
        setAnalyzedContent(
          `Bức tranh 2D phẳng minh họa cho khái niệm "${topic}":\n- Vẽ các đối tượng chính liên quan trực tiếp đến bản chất bài học.\n- Nét vẽ rõ ràng, phong cách sơ đồ SGK, đặt trên nền trắng tinh khiết.`
        );
      } else {
        setAnalyzedContent(
          `Bức tranh 3D Pixar sinh động minh họa cho "${topic}":\n- Nhân vật hoạt hình học sinh đang tương tác với mô hình thí nghiệm/hiện tượng.\n- Ánh sáng trong trẻo, phong cách 3D dễ thương, đặt trên nền trắng.`
        );
      }
      return;
    }

    setIsAnalyzing(true);
    try {
      let promptRule = '';
      const strictHeader = `[QUY TẮC BẮT BUỘC TỐI THƯỢNG - CHỐNG ẢO GIÁC & CẤM SÁNG TÁC NGOÀI CHỦ ĐỀ]:
- CHỈ ĐƯỢC PHÉP MINH HỌA ĐÚNG NỘI DUNG VÀ KHÁI NIỆM ĐÃ CHO.
- TUYỆT ĐỐI KHÔNG TỰ Ý ĐƯA THÊM BẤT KỲ KIẾN THỨC, CHI TIẾT HAY KHÁI NIỆM NÀO NGOÀI CHỦ ĐỀ NÀY.`;

      if (imageMode === 'multi_images') {
        promptRule = `${strictHeader}
Từ khóa/khái niệm: "${topic}".
Hãy nghĩ ra 2-3 hình ảnh sự vật cụ thể sao cho tên gọi tiếng Việt ghép lại ĐÚNG TỪNG ÂM TIẾT của từ khóa "${topic}" (ví dụ Đạo hàm = Đạo sĩ + Hàm răng). Mô tả tối giản đối tượng trên nền trắng.`;
      } else if (imageMode === '2d_blend') {
        promptRule = `${strictHeader}
Khái niệm: "${topic}".
Hãy mô tả ý tưởng 1 bức tranh 2D Flat Vector tối giản trên nền trắng minh họa CHÍNH XÁC bản chất cho khái niệm "${topic}" trong SGK.`;
      } else {
        promptRule = `${strictHeader}
Khái niệm: "${topic}".
Hãy mô tả ý tưởng 1 bức tranh 3D Pixar sinh động, dễ thương trên nền trắng minh họa CHÍNH XÁC cho khái niệm "${topic}".`;
      }

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

  // BƯỚC 3: XÂY DỰNG CÂU LỆNH VẼ ẢNH HOÀN CHỈNH
  const buildFinalPrompt = () => {
    const modeName = imageMode === 'multi_images' 
      ? 'Bộ hình ảnh đố chữ ghép từ đồng âm tiếng Việt (Puns)'
      : imageMode === '2d_blend'
      ? 'Đồ họa 2D Flat Vector tối giản chuẩn SGK'
      : 'Đồ họa 3D Pixar hoạt hình sinh động';

    return `Bạn là Chuyên gia Đồ họa Sư phạm. Hãy sử dụng công cụ tạo ảnh (Imagen 3 trên Gemini hoặc DALL-E 3 trên ChatGPT) để VẼ TRỰC TIẾP một bức tranh minh họa SGK theo yêu cầu:

1. CHỦ ĐỀ / KHÁI NIỆM: "${topic}"
2. THỂ LOẠI: ${modeName}
3. NỘI DUNG CẦN THỂ HIỆN:
${analyzedContent.trim()}

QUY TẮC BẮT BUỘC:
- ĐẶT TRÊN NỀN TRẮNG TINH KHIẾT (pure solid white background), không vẽ phong cảnh hay chi tiết rườm rà để tiện in ấn đề thi và chèn giáo án.
- Hình vẽ sắc nét, tỷ lệ chuẩn xác, không biến dạng, không thừa ngón tay.
- TUYỆT ĐỐI BÁM SÁT 100% KHÁI NIỆM TRÊN, CẤM SÁNG TÁC THÊM CÁC KIẾN THỨC HAY ĐỐI TƯỢNG NGOÀI YÊU CẦU.

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
    setImageMode('multi_images');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-xs uppercase tracking-wider">
          <Palette size={14} />
          <span>Xưởng Ảnh AI Sư Phạm • 3 Bước Đơn Giản</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Tạo Lệnh Vẽ Tranh Minh Họa Khái Niệm SGK
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Quy trình chuẩn 3 bước: Nhập chủ đề &rarr; Xem nội dung thể hiện &rarr; Bấm mở ChatGPT / Gemini để vẽ ảnh ngay.
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
                Nhập khái niệm / Từ khóa bài học:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Đạo hàm, Quang hợp, Tích phân..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Kiểu thể loại ảnh */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chọn phong cách minh họa:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImageMode('multi_images')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                    imageMode === 'multi_images'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-2 ring-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Grid size={15} />
                  <span className="text-[11px]">Đố chữ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('2d_blend')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                    imageMode === '2d_blend'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Palette size={15} />
                  <span className="text-[11px]">2D Phẳng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('3d_blend')}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                    imageMode === '3d_blend'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 ring-2 ring-pink-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Box size={15} />
                  <span className="text-[11px]">3D Pixar</span>
                </button>
              </div>
            </div>

            {/* Mẫu gợi ý nhanh */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-1">Gợi ý mẫu nhanh:</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_TOPICS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setTopic(p.text); setImageMode(p.mode); }}
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
            {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</> : <><Sparkles size={16} /> Phân Tích & Gợi Ý</>}
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
              Mô tả chi tiết các vật thể cần vẽ (Thầy/cô có thể tự do gõ sửa):
            </p>

            <textarea
              value={analyzedContent}
              onChange={(e) => setAnalyzedContent(e.target.value)}
              placeholder="Nội dung miêu tả các đối tượng cần vẽ trên nền trắng..."
              className="w-full flex-1 min-h-[170px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-900 text-xs font-sans text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed resize-none"
            />
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500 shrink-0" />
            <span>Mẹo: Chỉ nêu đối tượng chính trên nền trắng, không tả cảnh nền rườm rà.</span>
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
