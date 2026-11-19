import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  Table,
  BarChart2,
  TrendingUp,
  Compass,
  Layers,
  MonitorPlay,
  PieChart,
  Copy,
  Download,
  Sparkles,
  GitFork
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Chào mừng đến với Trợ Lý Đồ Họa Toán Học AI</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Hệ thống chuyên biệt hỗ trợ giáo viên Toán và khoa học tự nhiên tạo nhanh các loại <strong>hình vẽ hình học 2D/3D, đồ thị hàm số, bảng biến thiên, biểu đồ thống kê SGK chuẩn mực 300 DPI</strong> để dán trực tiếp vào đề thi Word, PowerPoint hoặc in ấn đề kiểm tra.
          </p>
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
            <h3 className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-2 mb-2">
              <Lightbulb size={18} /> Các ưu điểm vượt trội
            </h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Chuẩn độ phân giải 300 DPI:</strong> Mọi hình vẽ, bảng biến thiên và biểu đồ đều được gắn metadata pHYs 300 DPI, khi dán vào Word (Ctrl + V) không bị mờ nhòe hay vỡ hạt.</li>
              <li><strong>Chế độ in đen trắng (Hoa văn SGK):</strong> Tự động gán hoa văn (gạch chéo, chấm bi, sọc caro) cho các cột và lát quạt, phục vụ tối ưu cho việc in đề thi photocopy.</li>
              <li><strong>Hoạt động mượt mà offline & AI thông minh:</strong> Các công cụ vẽ hoạt động tức thì trên trình duyệt; phần AI (GeoGebra 3D, mô phỏng) hỗ trợ sinh mã nhanh.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'stat_chart_guide',
      title: 'Biểu đồ Thống kê SGK (Mới)',
      icon: <PieChart size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Vẽ Biểu Đồ Thống Kê SGK (THCS & THPT)</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ vẽ nhanh 4 dạng biểu đồ phổ biến trong chương trình Toán 6, 7, 8 và THPT: <strong>Biểu đồ Cột đơn, Cột kép, Đoạn thẳng và Hình quạt tròn</strong>.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Kho mẫu có sẵn chuẩn SGK:</strong> Nạp ngay ví dụ SGK như doanh thu công viên nước Đầm Sen, so sánh điểm hai lớp, nhiệt độ các tháng, cơ cấu học lực...</li>
              <li><strong>Nhập số liệu nhanh:</strong> Hỗ trợ phím Enter xuống dòng, dán trực tiếp từ bảng Excel hoặc Word (Ctrl + V).</li>
              <li><strong>Đen trắng hoa văn (Hatch patterns):</strong> Chuyển nhanh sang chế độ in đen trắng với hoa văn sọc xiên, sọc ngược, chấm bi chuẩn SGK để in đề thi rõ nét.</li>
              <li><strong>Chèn trực tiếp vào hình GSP:</strong> Có thể mở ngay trong GSP Sketchpad và bấm "Chèn vào hình" như một khung vẽ di chuyển, phóng to/thu nhỏ linh hoạt.</li>
              <li><strong>Xuất ảnh 300 DPI & SVG:</strong> Bấm sao chép là có ảnh dán ngay vào Word.</li>
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Bảng Biến Thiên (BBT) & Bảng Xét Dấu 300 DPI</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tự động lập bảng biến thiên chuẩn mực Toán học Việt Nam cho đề thi THPT, kiểm tra 1 tiết hoặc giáo án mà không lo bị lệch mũi tên hay vỡ font.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Điểm nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Kho mẫu hàm số kinh điển:</strong> Hàm bậc 3 (2 cực trị, không cực trị), hàm trùng phương bậc 4, phân thức hữu tỉ (ax+b)/(cx+d) và bậc 2 / bậc 1.</li>
              <li><strong>Tùy biến tự do:</strong> Thêm bớt mốc x tùy ý, chọn nghiệm đạo hàm (0), vạch phân cách (|) hoặc tiệm cận đứng không xác định (||).</li>
              <li><strong>Tự động căn chỉnh mũi tên biến thiên:</strong> Cực đại và cực tiểu được bố trí so le theo độ cao, mũi tên sắc nét nối mượt mà giữa các điểm.</li>
              <li><strong>Xuất ảnh 1 chạm (Dán Word):</strong> Sao chép ảnh 300 DPI dán ngay vào Word bằng phím Ctrl+V hoặc xuất mã LaTeX tkz-tab.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'bbt_graph_guide',
      title: 'Đồ thị Oxy, Miền nghiệm BPT & Trục số',
      icon: <TrendingUp size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Đồ Thị Oxy, Miền Nghiệm BPT & Trục Số</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Vẽ chính xác các đồ thị hàm số phổ thông, gạch sọc miền nghiệm hệ bất phương trình bậc nhất hai ẩn (Toán 10) và biểu diễn tập nghiệm trên trục số.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Đồ thị hàm số:</strong> Hàm bậc 1, bậc 2 (Parabol), bậc 3, bậc 4 trùng phương, phân thức bậc 1/bậc 1, bậc 2/bậc 1 với đầy đủ tiệm cận và điểm đặc biệt.</li>
              <li><strong>Tô miền diện tích Tích phân (Toán 12):</strong> Giới hạn bởi đồ thị f(x), trục hoành Ox hoặc đường thẳng y = mx + n trên đoạn [a; b], gạch sọc toán học tùy chỉnh góc/mật độ, tính diện tích tự động theo công thức Simpson.</li>
              <li><strong>Miền nghiệm BPT:</strong> Gạch chéo nửa mặt phẳng không thỏa mãn, viền liền (lấy dấu bằng) hoặc viền đứt (không lấy dấu bằng).</li>
              <li><strong>Trục số:</strong> Biểu diễn khoảng, đoạn, nửa khoảng với ngoặc tròn ( ), ngoặc vuông [ ], gạch bỏ phần không thuộc tập nghiệm.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'statistics_box_guide',
      title: 'Biểu đồ Hộp & Thống kê THPT',
      icon: <BarChart2 size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Biểu Đồ Hộp & Thống Kê Ghép Nhóm (Toán 10, 11, 12)</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ tính toán các số đặc trưng đo xu thế trung tâm và mức độ phân tán theo chuẩn GDPT 2018.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng chính:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Mẫu số liệu rời rạc & ghép nhóm:</strong> Tự động tính trung bình, trung vị, tứ phân vị Q1, Q2, Q3, khoảng tứ phân vị IQR, phương sai và độ lệch chuẩn.</li>
              <li><strong>Biểu đồ hộp (Box plot):</strong> Tự động phát hiện và đánh dấu các giá trị bất thường (outliers).</li>
              <li><strong>Biểu đồ tần số ghép nhóm (Histogram):</strong> Trực quan hóa các khoảng nhóm [a; b) kèm tần số.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'gsp_guide',
      title: 'Hình học 2D & 3D (GSP Sketchpad)',
      icon: <Compass size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Bảng Vẽ Hình Học GSP Sketchpad 5 & Mẫu 3D</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Phần mềm vẽ hình học tương tác mô phỏng Geometer's Sketchpad trực tiếp trên nền web, hỗ trợ vẽ hình phẳng và hình học không gian.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>Thước kẻ & Compa ảo:</strong> Dựng điểm, đoạn thẳng nét liền/nét đứt, đường tròn, elip, ký hiệu góc vuông có chấm tâm.</li>
              <li><strong>Bắt điểm thông minh:</strong> Bắt trung điểm, điểm trên đoạn thẳng, điểm tự do, di chuyển đỉnh kéo theo toàn bộ hình.</li>
              <li><strong>Chèn biểu đồ thống kê:</strong> Bấm nút Biểu đồ trên thanh công cụ để chèn biểu đồ cột, quạt, đoạn thẳng trực tiếp vào bản vẽ.</li>
              <li><strong>Mô hình 3D tương tác:</strong> Xem trước mô hình 3D xoay 360 độ tự động phân loại nét thấy và nét khuất.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'geogebra_guide',
      title: 'GeoGebra 3D AI',
      icon: <Layers size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Trợ Lý Dựng Hình GeoGebra 3D AI</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Sử dụng trí tuệ nhân tạo Gemini để tự động sinh lệnh dựng hình GeoGebra 3D từ mô tả tiếng Việt (ví dụ: "Cho hình chóp S.ABCD đáy hình vuông cạnh a, SA vuông góc đáy").
          </p>
        </div>
      )
    },

    {
      id: 'probability_tree_guide',
      title: 'Sơ đồ Cây Xác suất & Định lý Bayes',
      icon: <GitFork size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Sơ Đồ Cây Xác Suất & Định Lý Bayes (Toán 11 & 12)</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Công cụ trực quan hóa sơ đồ hình cây trong chương trình Toán 11 (Xác suất có điều kiện) và Toán 12 (Công thức Xác suất toàn phần & Định lý Bayes) theo chuẩn SGK Kết nối tri thức, Chân trời sáng tạo, Cánh Diều.
          </p>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-teal-800 dark:text-teal-300">Tính năng nổi bật:</h3>
            <ul className="list-disc pl-5 text-sm text-teal-700 dark:text-teal-200 space-y-1.5">
              <li><strong>5 Bộ mẫu chuẩn SGK:</strong> Xét nghiệm y tế (Bayes), Nhà máy sản xuất linh kiện (XS toàn phần), Xạ thủ bắn 2 lượt, Rút bóng từ 2 hộp, Ba dây chuyền sản xuất (cây 3 nhánh).</li>
              <li><strong>Tùy chỉnh linh hoạt:</strong> Tự do thêm/bớt biến cố Giai đoạn 1 và các nhánh con Giai đoạn 2, nhập xác suất dạng số thập phân hoặc phân số (ví dụ: 1/3, 2/5).</li>
              <li><strong>Định dạng thẩm mỹ:</strong> Đường nhánh uốn lượn Bezier cong mềm mại hoặc thẳng, nhãn nền mờ chống đè chữ, màu sắc đồng bộ.</li>
              <li><strong>Tính toán tự động:</strong> Tự động tính xác suất giao \(P(A \cap B)\), xác suất toàn phần \(P(B)\), và định lý Bayes \(P(A_i|B)\) kèm công thức chi tiết.</li>
              <li><strong>Xuất ảnh 300 DPI:</strong> 1-click chép thẳng vào Clipboard Word hoặc tải ảnh PNG độ phân giải in ấn 300 DPI.</li>
            </ul>
          </div>
        </div>
      )
    },

    {
      id: 'simulation_guide',
      title: 'Mô phỏng Khái niệm Tương tác',
      icon: <MonitorPlay size={18} />,
      content: (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Mô Phỏng Khái Niệm Tương Tác Toán Học</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Sinh các mô phỏng HTML5/Canvas động minh họa định lý Pytago, đường tròn lượng giác, ý nghĩa hình học của đạo hàm, tích phân diện tích hình phẳng.
          </p>
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
