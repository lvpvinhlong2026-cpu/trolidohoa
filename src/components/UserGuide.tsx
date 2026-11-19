import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Lightbulb,
  Scissors,
  BarChart3,
  Megaphone,
  Table,
  BarChart2,
  FolderKanban,
  Presentation
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [activeGuide, setActiveGuide] = useState<string>('intro');

  const guides: GuideSection[] = [
    {
      id: 'intro',
      title: 'Giới thiệu chung',
      icon: <HelpCircle size={18} />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Chào mừng đến với Trợ Lý Đồ Họa, Hình Vẽ & Số Hóa AI</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Hệ thống này được thiết kế chuyên biệt để hỗ trợ soạn thảo, thiết kế văn bản, poster thông báo, đồ họa toán học và xử lý tài liệu thông qua sức mạnh của AI (Gemini).
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
              <Lightbulb size={18} /> Lưu ý quan trọng
            </h3>
            <ul className="list-disc pl-5 text-sm text-blue-600 dark:text-blue-300 space-y-1">
              <li>Cần có <strong>API Key</strong> từ Google AI Studio để hệ thống hoạt động. (Nhập ở nút bánh răng trên góc phải).</li>
              <li>Bạn có thể đổi giữa các mô hình AI (Gemini 2.5 Flash, Gemini 3 Pro) để tối ưu tốc độ hoặc độ thông minh.</li>
              <li>Luôn kiểm tra lại kết quả do AI tạo ra trước khi mang vào sử dụng chính thức.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'bbt_guide',
      title: 'Bảng biến thiên & Xét dấu',
      icon: <Table size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Công cụ tạo Bảng biến thiên (BBT) & Bảng xét dấu</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Giúp giáo viên tạo nhanh các Bảng biến thiên chuẩn mực Toán học Việt Nam cho đề thi THPT, kiểm tra 1 tiết hoặc giáo án mà không lo bị lệch mũi tên hay vỡ font.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Điểm nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Kho mẫu kinh điển:</strong> Hàm bậc 3 (2 cực trị, không cực trị), hàm trùng phương bậc 4, phân thức hữu tỉ (ax+b)/(cx+d) và bậc 2 / bậc 1.</li>
              <li><strong>Tùy biến tự do:</strong> Thêm bớt mốc x tùy ý, chọn nghiệm đạo hàm (0), vạch phân cách (|) hoặc tiệm cận đứng không xác định (||).</li>
              <li><strong>Tự động căn chỉnh mũi tên biến thiên:</strong> Cực đại và cực tiểu được bố trí so le theo độ cao, mũi tên sắc nét nối mượt mà giữa các điểm.</li>
              <li><strong>Xuất ảnh 1 chạm (Dán Word):</strong> Sao chép ảnh 300 DPI dán ngay vào Word bằng phím Ctrl+V hoặc xuất mã LaTeX tkz-tab.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'statistics_guide',
      title: 'Biểu đồ Hộp & Thống kê',
      icon: <BarChart2 size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Biểu Đồ Hộp & Thống Kê (SGK Mới GDPT 2018)</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ chuyên dụng cho chương trình Toán 10, 11, 12 mới: Tính toán đầy đủ các số đặc trưng và vẽ Biểu đồ hộp (Box plot) cùng Biểu đồ tần số ghép nhóm (Histogram).
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng chính:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Hỗ trợ cả 2 dạng dữ liệu:</strong> Mẫu số liệu rời rạc và Mẫu số liệu ghép nhóm theo các khoảng [a; b) chuẩn SGK Toán 11 & 12.</li>
              <li><strong>Tính toán chính xác 100%:</strong> Cỡ mẫu n, số trung bình x̄, trung vị Me, tứ phân vị Q1, Q3, khoảng tứ phân vị ΔQ, mốt Mo, phương sai và độ lệch chuẩn.</li>
              <li><strong>Phát hiện giá trị bất thường (Outliers):</strong> Tự động cảnh báo và đánh dấu các điểm nằm ngoài khoảng [Q1 - 1.5ΔQ; Q3 + 1.5ΔQ].</li>
              <li><strong>Xuất ảnh vector 300 DPI:</strong> Sao chép hoặc tải ảnh chèn vào đề thi sắc nét tuyệt đối.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'geometry_guide',
      title: 'Thư viện hình mẫu không gian',
      icon: <FolderKanban size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Thư viện Hình mẫu Không gian & 2D Kinh điển</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tổng hợp các mô hình hình học thường gặp nhất trong các kỳ thi: Chóp tam giác, chóp tứ giác đều, lăng trụ, hình hộp, hình nón, hình trụ, hình cầu.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Sửa tên đỉnh linh hoạt:</strong> Đổi tên các đỉnh S.ABCD thành M.NPQR chỉ trong 3 giây.</li>
              <li><strong>Tùy chọn hiển thị:</strong> Ẩn/hiện đường cao, ký hiệu góc vuông, đổi màu nét vẽ và phông chữ Toán.</li>
              <li><strong>Chuẩn nét đứt SGK:</strong> Cạnh khuất nét đứt, cạnh nhìn thấy nét liền chuẩn xác.</li>
              <li><strong>Sao chép 1 chạm vào Word:</strong> Bấm sao chép là có ảnh chất lượng cao để dán ngay vào đề thi.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'poster',
      title: 'Tạo Poster Thông Báo Học Đường',
      icon: <Megaphone size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Tạo Poster Thông Báo Học Đường Tự Động Bằng AI</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ này giúp bạn chuyển đổi các file công văn, thông báo (PDF, Word, Ảnh) hoặc nội dung gõ tay thành <strong>Poster Thông Báo chuẩn đồ họa học đường sắc nét</strong> với 5 phong cách xu hướng hiện nay.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">5 Phong cách thiết kế xu hướng mới nhất:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Học Đường 3D Tươi Sáng:</strong> Loa phát thanh 3D, banner đỏ nổi khối, nền trời xanh và hình minh họa học sinh hoạt hình đáng yêu.</li>
              <li><strong>Chuyển Đổi Số (Cyber Digital):</strong> Phong cách công nghệ Glassmorphism, neon xanh cyan và tím, card kính mờ hiện đại.</li>
              <li><strong>Tối Giản Hàn Quốc (Pastel):</strong> Gam màu cam đào, trắng kem trang nhã, font chữ tròn mềm mại, thoáng đãng.</li>
              <li><strong>Trang Trọng Hội Nghị (Academic Royal):</strong> Xanh Navy hoàng gia viền vàng Gold, chuẩn mực cho đại hội, hội thảo cán bộ giáo viên.</li>
              <li><strong>Hội Thao & Tuổi Trẻ (Festival Youth):</strong> Rực rỡ, năng động, phù hợp hội trại, giải bóng đá, hoạt động Đoàn - Đội.</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Tiện ích xuất ảnh:</h4>
            <p>• <strong>Tải ảnh PNG độ nét cao (2.5x DPI):</strong> Sắc nét đến từng chi tiết, không vỡ nét khi phóng to.</p>
            <p>• <strong>Sao chép 1 chạm:</strong> Bấm nút sao chép ảnh và dán (Ctrl+V) thẳng vào Zalo hoặc nhóm Facebook nhà trường.</p>
            <p>• <strong>Chỉnh sửa linh hoạt:</strong> Bấm tab "Sửa Từng Chữ" để tự do sửa tên trường, thời gian, địa điểm, lưu ý theo ý muốn.</p>
          </div>
        </div>
      )
    },

    {
      id: 'infographic',
      title: 'Tạo Infographic Bài Học',
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Tạo Infographic Bài Học Trực Quan</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tính năng này giúp bạn chuyển đổi tài liệu bài học (file PDF hoặc văn bản) thành một bản <strong>Infographic học tập trực quan</strong>, tổng hợp cô đọng toàn bộ định nghĩa, công thức toán học, quy trình các bước giải và lưu ý thực chiến.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Các điểm nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Bám sát 100% nội dung PDF:</strong> AI chỉ trích xuất từ tài liệu bài học tải lên, không tự ý sáng tác kiến thức ngoài lề.</li>
              <li><strong>Bố cục Infographic sư phạm:</strong> Tự động phân chia thành Thông điệp cốt lõi, Khái niệm, Công thức then chốt, Quy trình từng bước, Ví dụ minh họa và Sai lầm thường gặp.</li>
              <li><strong>4 Bảng màu đa dạng:</strong> Cho phép đổi nhanh giữa phong cách Ngọc Lam, Đại Dương, Năng Động và Thạch Anh.</li>
              <li><strong>Xuất ảnh HD & Tải file HTML:</strong> Dễ dàng xuất ảnh PNG độ nét cao (2x DPI) để dán vào slide bài giảng PowerPoint/Word hoặc tải file HTML mở offline độc lập.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'pdfsplit',
      title: 'Tách Trang PDF (Cắt PDF)',
      icon: <Scissors size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Tách & Trích Xuất File PDF Nhỏ</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ này giúp bạn chia nhỏ file PDF lớn hoặc trích xuất riêng một khoảng trang cụ thể (chẳng hạn <strong>từ trang 3 đến trang 5</strong>) thành một file PDF mới hoàn toàn độc lập.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Các tính năng chính:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Xem & tra cứu file gốc trước khi tách:</strong> Bấm <strong>"Xem file gốc"</strong>, <strong>"Phóng to"</strong> hoặc <strong>"Mở tab mới"</strong> để đọc trực tiếp file PDF đã tải lên, lướt mục lục và tra cứu chính xác số trang bài giảng cần trích xuất.</li>
              <li><strong>Trích xuất khoảng trang liên tục:</strong> Chọn trang bắt đầu (ví dụ: 3) và trang kết thúc (ví dụ: 5) để tạo file PDF mới gồm đúng 3 trang đó.</li>
              <li><strong>Trích xuất trang tùy biến:</strong> Nhập danh sách các trang bất kỳ như <code>1, 3-5, 8</code>.</li>
              <li><strong>Tách từng trang:</strong> Tách toàn bộ file PDF thành từng trang riêng lẻ.</li>
              <li><strong>Xử lý 100% offline trên trình duyệt:</strong> Tốc độ tức thì (dưới 1 giây), không cần gửi file qua mạng, bảo toàn nguyên vẹn độ sắc nét, công thức Toán và hình ảnh.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'presentation_guide',
      title: 'Tạo Slide PowerPoint (.pptx)',
      icon: <Presentation size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Tạo Slide Bài Giảng PowerPoint Chuẩn Sư Phạm</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Hệ thống tự động thiết kế dàn ý bài giảng chuẩn 8 hoạt động GDPT 2018 và xuất ra file <strong>Microsoft PowerPoint (.pptx)</strong> tỷ lệ 16:9 widescreen sắc nét.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Điểm nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>AI Soạn bài giảng tự động:</strong> Chỉ cần nhập tên bài học và môn, AI sẽ lên khung mục tiêu, khởi động, hình thành kiến thức, ví dụ và bài tập.</li>
              <li><strong>5 Bảng màu sư phạm:</strong> Đại Dương, Ngọc Lam, Học Đường, Hoàng Gia, Trang Trọng.</li>
              <li><strong>File .pptx mở chỉnh sửa 100%:</strong> Tải về mở trực tiếp trên Microsoft PowerPoint, Google Slides để sửa chữ, đổi màu, chèn thêm ảnh.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'lesson_plan_guide',
      title: 'Soạn Giáo án CV 5512',
      icon: <BookOpen size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Soạn Kế Hoạch Bài Dạy (Giáo Án Chuẩn CV 5512/BGDĐT)</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Biên soạn kế hoạch bài dạy bám sát cấu trúc Công văn 5512/BGDĐT và chương trình GDPT 2018 (Kết nối tri thức, Cánh Diều, Chân trời sáng tạo).
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Quy chuẩn cấu trúc:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>I. Mục tiêu:</strong> Phẩm chất và năng lực (chung và đặc thù môn học).</li>
              <li><strong>II. Thiết bị dạy học:</strong> Chuẩn bị của giáo viên và học sinh.</li>
              <li><strong>III. Tiến trình dạy học:</strong> Đủ 4 hoạt động (Mở đầu &rarr; Kiến thức mới &rarr; Luyện tập &rarr; Vận dụng), mỗi hoạt động có 4 bước: Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện.</li>
              <li><strong>Xuất file Word (.docx):</strong> Định dạng chuẩn Nghị định 30 (lề 2-2-3-1.5cm, font Times New Roman 13pt) nộp ngay cho Tổ chuyên môn.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'correction',
      title: 'Chuyển sang Word & Chuẩn hóa',
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Chuyển Đổi Word & Chuẩn Hóa Đề Thi</h2>
          
          <div className="space-y-3">
            <div className="border-l-4 border-teal-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-r-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Chuyển sang Word (LaTeX)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Phân tích file PDF / Ảnh chứa văn bản và công thức Toán, chuyển đổi thành tài liệu Word (.docx) chuẩn, giữ nguyên 100% công thức toán học dưới dạng mã LaTeX không bị lỗi font.</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-r-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Chuẩn hóa đề thi</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tự động cấu trúc lại đề thi thô thành 3 phần chuẩn, tự động phân loại mức độ [B] Nhận biết, [H] Thông hiểu, [VD] Vận dụng và sinh kèm bảng đáp án chi tiết.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeContent = guides.find(g => g.id === activeGuide) || guides[0];

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 max-h-[85vh]">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <h2 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-teal-600" />
            Mục lục Hướng dẫn
          </h2>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          {guides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setActiveGuide(guide.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeGuide === guide.id
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shadow-sm border border-teal-200 dark:border-teal-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeGuide === guide.id ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {guide.icon}
              </div>
              {guide.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="max-w-4xl animate-fade-in">
            {activeContent.content}
          </div>
        </div>
      </div>
    </div>
  );
}
