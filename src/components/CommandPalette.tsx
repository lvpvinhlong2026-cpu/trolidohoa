import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Star, 
  Layers, 
  TrendingUp, 
  Table, 
  BarChart2, 
  Compass, 
  MonitorPlay, 
  HelpCircle 
} from 'lucide-react';
import { TabId } from '../App';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';

export interface SearchToolItem {
  id: TabId;
  label: string;
  category: string;
  sub: string;
  badge?: string;
  keywords: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const SEARCHABLE_TOOLS: SearchToolItem[] = [
  // 1. Đồ Họa Toán Học (300 DPI)
  {
    id: 'bbt_graph',
    label: 'Đồ thị, Miền nghiệm BPT & Trục số',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'Hệ toạ độ Oxy, tương tác trực quan, xuất ảnh 300 DPI chất lượng cao',
    badge: 'Trọng tâm',
    keywords: ['đồ thị', 'hàm số', 'parabol', 'bậc 3', 'bậc 4', 'trục số', 'bất phương trình', 'miền nghiệm', 'oxy', '300 dpi', 'toán'],
    icon: TrendingUp,
  },
  {
    id: 'bbt',
    label: 'Bảng biến thiên & Xét dấu',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'Tự động lập bảng biến thiên & xét dấu tam thức bậc hai, bậc ba chuẩn SGK',
    badge: 'SGK Mới',
    keywords: ['bbt', 'bảng biến thiên', 'xét dấu', 'hàm số', 'cực trị', 'đồng biến', 'nghịch biến'],
    icon: Table,
  },
  {
    id: 'statistics',
    label: 'Biểu đồ Thống kê SGK (Cột, Quạt, Hộp)',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'Biểu đồ cột, cột kép, đoạn thẳng, hình quạt tròn THCS & biểu đồ hộp THPT 300 DPI',
    badge: 'Mới',
    keywords: ['thống kê', 'biểu đồ cột', 'cột kép', 'đoạn thẳng', 'hình quạt tròn', 'quạt tròn', 'biểu đồ hộp', 'box plot', 'tứ phân vị', 'trung vị', 'ghép nhóm'],
    icon: BarChart2,
  },
  {
    id: 'geometry',
    label: 'Hình học 2D & 3D (GSP & Kho mẫu)',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'GSP Sketchpad 5 + Kho mẫu hình học không gian 3D tương tác',
    badge: 'GSP 5',
    keywords: ['hình học', 'gsp', 'sketchpad', 'tam giác', 'đường tròn', 'hình chóp', 'lăng trụ', 'không gian 3d'],
    icon: Compass,
  },
  {
    id: 'geogebra',
    label: 'GeoGebra 3D AI',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'Tạo mã GeoGebra 3D tự động bằng AI, khối đa diện, mặt cầu, Oxyz',
    badge: 'AI 3D',
    keywords: ['geogebra', '3d', 'không gian', 'mặt phẳng', 'vectơ', 'toạ độ oxyz', 'khối nón', 'khối trụ'],
    icon: Layers,
  },
  {
    id: 'simulation',
    label: 'Mô phỏng Khái niệm Tương tác',
    category: 'Đồ Họa Toán Học (300 DPI)',
    sub: 'Minh họa động trực quan các định lý, quy luật Toán & Khoa học',
    badge: 'Mô phỏng',
    keywords: ['mô phỏng', 'simulation', 'tương tác', 'chuyển động', 'khái niệm', 'thí nghiệm ảo'],
    icon: MonitorPlay,
  },

  // 2. Hướng Dẫn
  {
    id: 'guide',
    label: 'Hướng dẫn Sử dụng Hệ thống',
    category: 'Hệ Thống & Trợ Giúp',
    sub: 'Tài liệu hướng dẫn chi tiết từng công cụ vẽ hình và đồ thị Toán học',
    badge: 'Trợ giúp',
    keywords: ['hướng dẫn', 'trợ giúp', 'user guide', 'cách dùng', 'video hướng dẫn'],
    icon: HelpCircle,
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: TabId) => void;
  pinnedTabs: string[];
  onTogglePin: (toolId: string) => void;
  accentColor?: AccentColor;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTool,
  pinnedTabs,
  onTogglePin,
  accentColor = 'teal',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = SEARCHABLE_TOOLS.filter(tool => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      tool.label.toLowerCase().includes(q) ||
      tool.sub.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredTools.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredTools.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        onSelectTool(filteredTools[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search size={18} className={theme.primaryText} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm nhanh: Đồ thị Oxy, Bảng biến thiên, Biểu đồ hộp, GSP, Word sang LaTeX..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={15} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Search size={32} className="mx-auto opacity-40" />
              <p className="text-xs">Không tìm thấy công cụ nào phù hợp với từ khóa "{query}"</p>
              <p className="text-[11px] text-slate-400">Thử tìm: đồ thị, bbt, hình học, latex, mindmap, geogebra...</p>
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isSelected = idx === selectedIndex;
              const isPinned = pinnedTabs.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? `${theme.softBg} border ${theme.softBorder}`
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? `${theme.primaryBg} text-white shadow-xs`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? theme.primaryText : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          {tool.label}
                        </span>
                        {tool.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                          }`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tool.sub}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onTogglePin(tool.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPinned
                          ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isPinned ? 'Bỏ ghim khỏi thanh truy cập nhanh' : 'Ghim vào thanh truy cập nhanh'}
                    >
                      <Star size={14} className={isPinned ? 'fill-amber-400' : ''} />
                    </button>
                    <ArrowRight size={14} className={`text-slate-400 ${isSelected ? 'translate-x-0.5' : 'opacity-40'} transition-transform`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span><strong className="font-semibold text-slate-700 dark:text-slate-200">↑↓</strong> Di chuyển</span>
            <span><strong className="font-semibold text-slate-700 dark:text-slate-200">↵</strong> Mở công cụ</span>
            <span><strong className="font-semibold text-slate-700 dark:text-slate-200">ESC</strong> Đóng</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <Star size={11} className="text-amber-500 fill-amber-400" />
            <span>Trợ Lý Đồ Họa Toán Học LVP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
