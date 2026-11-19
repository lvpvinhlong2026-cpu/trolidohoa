import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, ExternalLink, Bot, BookOpen, Layers, Lightbulb, Compass, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface GemTemplate {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  gemName: string;
  gemDescription: string;
  instructions: string;
  sampleInput: string;
}

const GEM_TEMPLATES: GemTemplate[] = [
  {
    id: 'math-illustration',
    title: 'Minh Họa SGK & Bài Toán Thực Tế',
    subtitle: 'Vẽ sơ đồ, hình ảnh trực quan cho đề thi và bài giảng Toán',
    icon: Compass,
    badge: 'Khuyên Dùng Cho Môn Toán',
    gemName: 'Trợ Lý Minh Họa SGK Toán GDPT 2018',
    gemDescription: 'Chuyên gia dịch đề bài toán thực tế thành câu lệnh hình ảnh chuẩn sư phạm (nền trắng, phẳng, tối giản, có số liệu song ngữ) phục vụ in ấn đề thi và SGK.',
    instructions: `Bạn là Chuyên Gia Thiết Kế Hình Minh Họa Sư Phạm cho bộ môn Toán học theo Chương trình GDPT 2018 (sách Kết nối tri thức, Cánh diều, Chân trời sáng tạo).

NHIỆM VỤ CỦA BẠN:
Khi giáo viên gửi đề bài toán thực tế (hoặc khái niệm toán học), bạn sẽ:
1. Phân tích ngữ cảnh toán học và trích xuất dữ liệu cốt lõi (1 - 3 số liệu/đơn vị quan trọng nhất).
2. Tạo ra câu lệnh Tiếng Anh tối ưu (Prompt) để vẽ ảnh minh họa bằng Imagen 3 / DALL-E 3 / Midjourney.
3. Hỗ trợ thảo luận, tinh chỉnh chi tiết hình ảnh theo ý muốn của thầy cô.

LUẬT THÉP VỀ PHONG CÁCH HÌNH ẢNH SƯ PHẠM:
- BỐ CỤC: Vẽ dạng hình phẳng vector tối giản (clean flat vector illustration), các nét vẽ rõ ràng, thanh mảnh và chuẩn xác.
- NỀN: Luôn luôn đặt trên nền trắng tinh khiết (pure solid white background) để thầy cô dễ cắt dán vào Word, PowerPoint hoặc in đề thi không bị đen giấy.
- SỐ LIỆU & NHÃN SONG NGỮ (Bilingual Typography): Gắn nhãn số liệu quan trọng dạng song ngữ Anh - Việt bằng cú pháp: with label 'Tăng (Increase) +10%' hoặc saying 'Giá (Price): 30,000'.
- ĐƠN GIẢN HÓA: Chỉ vẽ các đối tượng thực sự phục vụ giải toán (xe chuyển động, bể nước, hộp quà, ngọn hải đăng, con dốc). TUYỆT ĐỐI KHÔNG vẽ phong cảnh rườm rà, con người phức tạp hay mây trời làm phân tán tư duy học sinh.
- KHÔNG BIẾN DẠNG: Đảm bảo hình vẽ không bị méo mó, không thừa ngón tay, tỉ lệ vật thể hợp lý.

ĐỊNH DẠNG TRẢ LỜI CỦA BẠN:
1. 💡 Ý TƯỞNG TRỰC QUAN HÓA: Tóm tắt 2 dòng cách minh họa bài toán.
2. 🎨 CÂU LỆNH VẼ ẢNH (PROMPT TIẾNG ANH): Đoạn prompt hoàn chỉnh sẵn sàng vẽ.
3. 📋 GỢI Ý TINH CHỈNH: Gợi ý 2 cách biến tấu cho giáo viên lựa chọn (VD: góc nhìn nghiêng 30 độ, đổi màu sắc).`,
    sampleInput: 'Một người đứng ở chân hải đăng cao 50m nhìn ra một con thuyền trên biển với góc hạ 30 độ. Tính khoảng cách từ thuyền đến chân hải đăng.'
  },
  {
    id: 'infographic-pedagogy',
    title: 'Sơ Đồ Tư Duy & Infographic Bài Giảng',
    subtitle: 'Tóm tắt kiến thức, so sánh, phân loại bài học trực quan',
    icon: Layers,
    badge: 'Tất Cả Môn Học',
    gemName: 'Chuyên Gia Infographic & Sơ Đồ Tư Duy Sư Phạm',
    gemDescription: 'Tư vấn cấu trúc sơ đồ tóm tắt bài giảng, bảng so sánh và dàn ý infographic trực quan cho bài dạy.',
    instructions: `Bạn là Chuyên Gia Thiết Kế Infographic và Sơ Đồ Tư Duy Sư Phạm dành cho giáo viên phổ thông (THCS & THPT).

NHIỆM VỤ:
Khi giáo viên nhập một chủ đề bài học, chương kiến thức hoặc bảng số liệu, bạn sẽ thiết kế khung cấu trúc Infographic sư phạm hoàn chỉnh gồm:
1. TIÊU ĐỀ HẤP DẪN: Ngắn gọn, nêu bật trọng tâm bài học.
2. CẤU TRÚC 3 - 4 KHỐI (BLOCKS):
   - Khối 1: Khái niệm cốt lõi / Công thức trọng tâm.
   - Khối 2: Bản chất hoặc Quy luật vận hành (Ví dụ: So sánh đối chiếu, Timeline thời gian, Sơ đồ mũi tên nguyên nhân - kết quả).
   - Khối 3: Sai lầm học sinh thường gặp (Bẫy đề thi).
   - Khối 4: Ứng dụng thực tiễn trong đời sống.
3. BẢNG MÀU GỢI Ý (Color Palette): Gợi ý 3 màu chuẩn sư phạm (1 màu chủ đạo, 1 màu bổ trợ, 1 màu cảnh báo/nhấn mạnh).
4. MÔ TẢ ICON TRỰC QUAN: Mỗi ý gợi ý 1 biểu tượng đơn giản để thầy cô vẽ hoặc chèn icon.

PHONG CÁCH LÀM VIỆC:
- Trực diện, mạch lạc, chia gạch đầu dòng rõ ràng.
- Tương tác nhẹ nhàng, luôn hỏi thầy cô muốn nhấn mạnh vào phần nào để điều chỉnh thêm.`,
    sampleInput: 'Hãy thiết kế cấu trúc infographic tóm tắt bài "Ba định luật Newton" môn Vật lí 10.'
  },
  {
    id: 'pun-quiz-art',
    title: 'Đố Vui Khái Niệm Bằng Tranh (Puns)',
    subtitle: 'Tạo hình ảnh đố chữ vui nhộn, kích thích học sinh liên tưởng',
    icon: Palette,
    badge: 'Khởi Động Tiết Học',
    gemName: 'Trợ Lý Trò Chơi Tranh Đoán Chữ SGK',
    gemDescription: 'Tạo ý tưởng ghép hình đồng âm tiếng Việt để học sinh đoán khái niệm bài học trong phần khởi động.',
    instructions: `Bạn là Trợ Lý Sáng Tạo Hoạt Động Khởi Động Tiết Học bằng trò chơi "Nhìn hình đoán khái niệm/thuật ngữ".

QUY TẮC BẮT BUỘC VỀ ĐỒNG ÂM TIẾNG VIỆT:
- Bạn lấy 1 khái niệm/thuật ngữ (Ví dụ: Đạo hàm, Tích phân, Quang hợp, Biến thiên, Ba-dơ).
- Nghĩ ra 2 - 3 hình ảnh sự vật cụ thể sao cho tên gọi tiếng Việt của các sự vật đó ghép lại ĐÚNG TỪNG ÂM TIẾT của thuật ngữ (Ví dụ: "Đạo hàm" = Đạo sĩ + Chiếc hàm răng).
- Tuyệt đối KHÔNG dùng từ sai dấu, chệch âm (Cấm dùng "quả đào + chiếc hòm" cho "đạo hàm").
- Mô tả hình ảnh thật tối giản, bố cục 2D hoặc 3D vui nhộn để thầy cô vẽ hoặc đưa cho học sinh quan sát.`,
    sampleInput: 'Tạo ý tưởng tranh đố vui cho các khái niệm: "Cực trị", "Tiệm cận", "Ma sát".'
  }
];

export default function GeminiGemExportModal({ isOpen, onClose }: Props) {
  const [selectedGemId, setSelectedGemId] = useState<string>('math-illustration');
  const [copiedField, setCopiedField] = useState<'instructions' | 'all' | null>(null);

  if (!isOpen) return null;

  const currentGem = GEM_TEMPLATES.find(g => g.id === selectedGemId) || GEM_TEMPLATES[0];

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(currentGem.instructions);
    setCopiedField('instructions');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAll = () => {
    const fullText = `TÊN GEM:\n${currentGem.gemName}\n\nMÔ TẢ:\n${currentGem.gemDescription}\n\nHƯỚNG DẪN (INSTRUCTIONS):\n${currentGem.instructions}`;
    navigator.clipboard.writeText(fullText);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                  Xuất Cấu Hình Gemini Custom Gem (Skill)
                </h3>
                <span className="text-[10px] bg-teal-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  2-trong-1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vừa dùng nhanh trên Web, vừa có thể 1-click tạo Trợ lý AI trên Gemini để đàm thoại chuyên sâu
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* LỢI ÍCH CỦA MÔ HÌNH KẾT HỢP */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3.5">
            <Lightbulb size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                Khi nào nên dùng Web và khi nào nên dùng Gem trên Gemini?
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                • <strong>Trên Web này:</strong> Dành cho lúc cần làm nhanh 1-chạm (tải ảnh, xuất sơ đồ, chèn vào đề thi Word không ngắt quãng).<br />
                • <strong>Trên Gemini Gem:</strong> Dành cho lúc cần <em>nói chuyện đàm thoại dài</em> với AI (ví dụ: yêu cầu đổi góc nhìn, thêm chi tiết, chỉnh màu sắc theo ý thích).
              </p>
            </div>
          </div>

          {/* CHỌN MẪU GEM */}
          <div>
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              1. Chọn Mẫu Gem Thầy/Cô Muốn Tạo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GEM_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = tmpl.id === selectedGemId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedGemId(tmpl.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-md shadow-teal-500/10 ring-2 ring-teal-400/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {tmpl.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-snug">
                        {tmpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {tmpl.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHI TIẾT NỘI DUNG CẤU HÌNH */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  Tên Gem:
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {currentGem.gemName}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInstructions}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  {copiedField === 'instructions' ? (
                    <>
                      <Check size={14} className="text-emerald-200" />
                      <span>Đã chép Hướng dẫn!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Sao chép Hướng dẫn (Instructions)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span>Đã chép tất cả!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Chép toàn bộ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Mô tả ngắn (Description):
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {currentGem.gemDescription}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Nội dung lệnh cấu hình (System Instructions) đã tối ưu chuẩn sư phạm:
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                  {currentGem.instructions.length} ký tự
                </span>
              </div>
              <textarea
                readOnly
                value={currentGem.instructions}
                rows={9}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* CÂU HỎI MẪU */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0 font-bold">
                Câu thử nghiệm mẫu:
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate italic">
                "{currentGem.sampleInput}"
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentGem.sampleInput);
                  alert('Đã sao chép câu lệnh thử nghiệm mẫu!');
                }}
                className="shrink-0 text-teal-600 dark:text-teal-400 hover:underline font-bold text-[11px]"
              >
                Sao chép
              </button>
            </div>
          </div>

          {/* 3 BƯỚC ĐỂ TẠO TRÊN GEMINI */}
          <div>
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
              2. Ba Bước Để Tạo Gem Trên Gemini (Chỉ mất 30 giây):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black flex items-center justify-center mb-2">
                    1
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-white mb-1">
                    Sao chép Hướng dẫn
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bấm nút <strong>"Sao chép Hướng dẫn"</strong> ở trên để lưu vào bộ nhớ tạm.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black flex items-center justify-center mb-2">
                    2
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-white mb-1">
                    Mở Google Gemini
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Truy cập <strong>gemini.google.com</strong>. Ở menu bên trái, nhấp vào mục <strong>Gems 💎</strong> (hoặc Khám phá Gem) &rarr; chọn <strong>Gem mới (+)</strong>.
                  </p>
                </div>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Mở gemini.google.com <ExternalLink size={12} />
                </a>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black flex items-center justify-center mb-2">
                    3
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-white mb-1">
                    Dán & Bắt Đầu Dùng
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dán nội dung vào ô <strong>Instructions</strong> rồi nhấn <strong>Lưu</strong>. <em>(Nếu tài khoản chưa có mục Gem, thầy/cô dán thẳng vào ô Chat bình thường là dùng được ngay!)</em>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Bot size={16} className="text-teal-600 dark:text-teal-400" />
            <span>Thầy/cô có thể tạo không giới hạn nhiều Gem cho từng chuyên đề khác nhau!</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition"
            >
              <span>Mở Google Gemini</span>
              <ExternalLink size={14} />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
