import React from 'react';
import {
  TrendingUp,
  Table,
  Compass,
  BarChart2,
  GitFork,
  Layers,
  MonitorPlay,
  HelpCircle,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Ruler,
  Bold,
  MousePointer,
  CircleDot,
  Minus,
  Circle,
  Box,
  RotateCcw,
  Play,
  Pause,
  Grid,
  Crop,
  Dot,
  CornerDownRight,
  Type,
  Eraser
} from 'lucide-react';
import { TabId } from '../App';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';

export interface RibbonBarProps {
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
  isRibbonCollapsed: boolean;
  onToggleRibbonCollapse: () => void;
  accentColor: AccentColor;
  graphSubTab: 'graph' | 'inequality' | 'number_line';
  graphFnType?: string;
  graphMode?: 'coeffs' | 'text';
  bbtMasterMode: 'auto' | 'variation' | 'sign_chart';
  bbtFnType?: 'rational_2_1' | 'rational_1_1' | 'cubic' | 'quartic';
  bbtInputMode?: 'coeffs' | 'text';
  bbtFont: 'times' | 'latex';
  bbtStroke: 'thin' | 'standard' | 'thick';
  bbtIsBold: boolean;
  bbtFontSize?: 'standard' | 'large' | 'extra';
  gspActiveTool?: string;
  onRibbonAction: (action: { type: string; [key: string]: any }) => void;
}

// 8 Phân hệ chuẩn đồ họa Toán học sắp xếp như các tab Home, Insert... của Word
const RIBBON_TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'bbt_graph', label: 'Đồ thị & Trục số', icon: TrendingUp },
  { id: 'bbt', label: 'Bảng biến thiên', icon: Table },
  { id: 'geometry', label: 'Hình học 2D & 3D', icon: Compass },
  { id: 'statistics', label: 'Biểu đồ Thống kê', icon: BarChart2 },
  { id: 'probability_tree', label: 'Cây Xác suất', icon: GitFork },
  { id: 'geogebra', label: 'GeoGebra 3D', icon: Layers },
  { id: 'simulation', label: 'Mô phỏng', icon: MonitorPlay },
  { id: 'guide', label: 'Hướng dẫn', icon: HelpCircle },
];

export default function RibbonBar({
  activeTab,
  onSelectTab,
  isRibbonCollapsed,
  onToggleRibbonCollapse,
  accentColor,
  graphSubTab,
  graphFnType = 'rational_2_1',
  graphMode = 'coeffs',
  bbtMasterMode,
  bbtFnType = 'rational_2_1',
  bbtInputMode = 'coeffs',
  bbtFont,
  bbtStroke,
  bbtIsBold,
  bbtFontSize = 'large',
  gspActiveTool = 'select',
  onRibbonAction,
}: RibbonBarProps) {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;
  const currentTab = (activeTab === 'gsp' || activeTab === 'quick3d') ? 'geometry' : activeTab;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs select-none">
      
      {/* 1. DÒNG THẺ MENU (RIBBON TAB STRIP - Word Tabs: Home, Insert, Layout...) */}
      <div className="flex items-center justify-between px-2 sm:px-3 pt-1 border-b border-slate-200/90 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70">
        
        {/* Nhóm Tabs bên trái */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none">
          {RIBBON_TABS.map(tab => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  if (isRibbonCollapsed) {
                    onToggleRibbonCollapse();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-t-lg border-t-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? `bg-white dark:bg-slate-900 ${theme.primaryText} border-t-teal-600 dark:border-t-teal-400 border-x border-slate-200 dark:border-slate-800 -mb-px z-10 shadow-2xs`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border-t-transparent border-x border-x-transparent'
                }`}
              >
                <TabIcon size={14} className={isActive ? theme.primaryText : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nút thu gọn / bung rộng Ribbon (Ctrl + F1 hoặc Alt + B) */}
        <button
          onClick={onToggleRibbonCollapse}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
          title={isRibbonCollapsed ? "Mở rộng Dải công cụ Ribbon (Ctrl + F1)" : "Thu gọn Dải công cụ Ribbon (Ctrl + F1)"}
        >
          {isRibbonCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* 2. DẢI CÔNG CỤ TOOLBAR (RIBBON BODY - CÁC NHÓM CÔNG CỤ PHONG CÁCH WORD) */}
      {!isRibbonCollapsed && (
        <div className="flex items-stretch overflow-x-auto py-1 px-2.5 sm:px-3 bg-white dark:bg-slate-900 min-h-[96px] max-h-[110px] scrollbar-thin">
          
          {/* =========================================================================
              PHÂN HỆ 1: ĐỒ THỊ & TRỤC SỐ
              ========================================================================= */}
          {currentTab === 'bbt_graph' && (
            <div className="flex items-stretch gap-2 shrink-0">
              
              {/* Nhóm 1: CLIPBOARD / XUẤT ẢNH WORD */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[72px]"
                    title="Sao chép toàn bộ ảnh độ phân giải cao 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép Word</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'open_crop' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold transition shadow-2xs cursor-pointer border border-amber-300 dark:border-amber-700/60 h-[66px] min-w-[70px]"
                    title="Cắt nhanh 1 chạm: Giữ chuột trái kéo khung cần cắt, thả chuột ra là tự động chép vào Word (Alt + C)"
                  >
                    <Crop size={18} className="mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-tight text-center">Cắt nhanh</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Kéo dán Word</span>
                  </button>

                  <div className="flex flex-col gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_png' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Download size={12} className="text-teal-600" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_svg' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Download size={12} className="text-blue-600" />
                      <span>SVG</span>
                    </button>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: PHÂN HỆ CÔNG CỤ */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_subtab', subtab: 'graph' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      graphSubTab === 'graph'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Đồ thị Oxy</span>
                    <span className="text-[9px] font-normal text-slate-400">Khảo sát hàm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_subtab', subtab: 'inequality' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      graphSubTab === 'inequality'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Sliders size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Miền BPT</span>
                    <span className="text-[9px] font-normal text-slate-400">Gạch sọc Oxy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_subtab', subtab: 'number_line' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      graphSubTab === 'number_line'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Ruler size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Trục số R</span>
                    <span className="text-[9px] font-normal text-slate-400">Giao/Hợp/Hiệu</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  PHÂN HỆ TOÁN
                </div>
              </div>

              {/* Nhóm 3: DẠNG HÀM OXY (Word Style Gallery Cards) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'rational_2_1', label: 'Bậc 2 / 1', formula: '(ax²+bx+c)/(dx+e)', desc: 'SGK Mới Toán 12' },
                    { id: 'rational', label: 'Phân thức 1 / 1', formula: '(ax+b)/(cx+d)', desc: 'Tiệm cận đứng, ngang' },
                    { id: 'cubic', label: 'Hàm bậc 3', formula: 'ax³+bx²+cx+d', desc: 'Có 2 hoặc 0 cực trị' },
                    { id: 'quartic', label: 'Bậc 4 trùng phương', formula: 'ax⁴+bx²+c', desc: '1 hoặc 3 cực trị' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'select_fn_type', fnType: t.id })}
                      className={`flex flex-col items-start justify-center px-2.5 py-1 rounded-xl border text-left transition cursor-pointer h-[66px] min-w-[105px] ${
                        graphFnType === t.id
                          ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-500 shadow-xs ring-1 ring-teal-400'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-bold leading-tight truncate w-full">{t.label}</span>
                      <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 truncate w-full">{t.formula}</span>
                      <span className="text-[8px] text-slate-400 truncate w-full">{t.desc}</span>
                    </button>
                  ))}

                  {/* Cột toggle Hệ số / Biểu thức & Dropdown SGK */}
                  <div className="flex flex-col gap-1 justify-center pl-1">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => onRibbonAction({ type: 'switch_input_mode', inputMode: 'coeffs' })}
                        className={`px-2 py-0.5 rounded-md transition ${graphMode === 'coeffs' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                      >
                        Hệ số
                      </button>
                      <button
                        type="button"
                        onClick={() => onRibbonAction({ type: 'switch_input_mode', inputMode: 'text' })}
                        className={`px-2 py-0.5 rounded-md transition ${graphMode === 'text' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                      >
                        Gõ f(x)
                      </button>
                    </div>

                    <select
                      className="px-2 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        if (val === 'rational_2_1_1') {
                          onRibbonAction({
                            type: 'select_graph_preset',
                            config: { type: 'rational_2_1', a: 1, b: -1, c: 1, d: 1, e: -1 },
                            textExpr: '(x^2 - x + 1)/(x - 1)'
                          });
                        } else if (val === 'rational_1_1') {
                          onRibbonAction({
                            type: 'select_graph_preset',
                            config: { type: 'rational', a: 2, b: 1, c: 1, d: -1, e: 0 },
                            textExpr: '(2x + 1)/(x - 1)'
                          });
                        } else if (val === 'cubic_2ext') {
                          onRibbonAction({
                            type: 'select_graph_preset',
                            config: { type: 'cubic', a: 1, b: 0, c: -3, d: 1, e: 0 },
                            textExpr: 'x^3 - 3x + 1'
                          });
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Mẫu SGK --</option>
                      <option value="rational_2_1_1">Bậc 2/1: (x²-x+1)/(x-1)</option>
                      <option value="rational_1_1">Hữu tỉ: (2x+1)/(x-1)</option>
                      <option value="cubic_2ext">Bậc 3: x³ - 3x + 1</option>
                    </select>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CẤU HÌNH HÀM SỐ (DẠNG SGK)
                </div>
              </div>

              {/* Nhóm 4: ĐỊNH DẠNG HỆ TRỤC */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">Độ nét 300 DPI</span>
                    <span className="text-[9px] text-slate-400">Chuẩn in SGK Word</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  ĐỊNH DẠNG
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 2: BẢNG BIẾN THIÊN & XÉT DẤU
              ========================================================================= */}
          {currentTab === 'bbt' && (
            <div className="flex items-stretch gap-2 shrink-0">
              
              {/* Nhóm 1: CLIPBOARD / XUẤT BẢN WORD */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[72px]"
                    title="Sao chép toàn bộ bảng biến thiên 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép Word</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'open_crop' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold transition shadow-2xs cursor-pointer border border-amber-300 dark:border-amber-700/60 h-[66px] min-w-[70px]"
                    title="Cắt nhanh 1 chạm: Giữ chuột trái kéo khung cần cắt, thả chuột ra là tự động chép vào Word (Alt + C)"
                  >
                    <Crop size={18} className="mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-tight text-center">Cắt nhanh</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Kéo dán Word</span>
                  </button>

                  <div className="flex flex-col gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_png' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Download size={12} className="text-teal-600" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_svg' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Download size={12} className="text-blue-600" />
                      <span>SVG</span>
                    </button>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: CHẾ ĐỘ BẢNG */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_bbt_mode', mode: 'auto' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      bbtMasterMode === 'auto'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles size={18} className="mb-0.5 text-amber-500" />
                    <span className="text-[11px] leading-tight text-center">Tự động</span>
                    <span className="text-[9px] font-normal text-slate-400">1-Click từ hàm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_bbt_mode', mode: 'variation' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      bbtMasterMode === 'variation'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Table size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Tùy biến BBT</span>
                    <span className="text-[9px] font-normal text-slate-400">Chỉnh từng mốc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'switch_bbt_mode', mode: 'sign_chart' })}
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[78px] border ${
                      bbtMasterMode === 'sign_chart'
                        ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-1 ring-teal-400`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Sliders size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Xét dấu</span>
                    <span className="text-[9px] font-normal text-slate-400">Dấu f(x), f'(x)</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CHẾ ĐỘ BẢNG
                </div>
              </div>

              {/* Nhóm 3: CẤU HÌNH HÀM SỐ (Dạng hàm SGK - Word Style Gallery Cards) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'rational_2_1', label: 'Bậc 2 / 1', formula: '(ax²+bx+c)/(dx+e)', desc: 'SGK Mới Toán 12' },
                    { id: 'rational_1_1', label: 'Phân thức 1 / 1', formula: '(ax+b)/(cx+d)', desc: 'Tiệm cận đứng, ngang' },
                    { id: 'cubic', label: 'Hàm bậc 3', formula: 'ax³+bx²+cx+d', desc: 'Có 2 hoặc 0 cực trị' },
                    { id: 'quartic', label: 'Bậc 4 trùng phương', formula: 'ax⁴+bx²+c', desc: '1 hoặc 3 cực trị' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'select_fn_type', fnType: t.id })}
                      className={`flex flex-col items-start justify-center px-2.5 py-1 rounded-xl border text-left transition cursor-pointer h-[66px] min-w-[105px] ${
                        bbtFnType === t.id
                          ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-500 shadow-xs ring-1 ring-teal-400'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-bold leading-tight truncate w-full">{t.label}</span>
                      <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 truncate w-full">{t.formula}</span>
                      <span className="text-[8px] text-slate-400 truncate w-full">{t.desc}</span>
                    </button>
                  ))}

                  {/* Cột toggle Hệ số / Biểu thức & Dropdown SGK */}
                  <div className="flex flex-col gap-1 justify-center pl-1">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => onRibbonAction({ type: 'switch_input_mode', inputMode: 'coeffs' })}
                        className={`px-2 py-0.5 rounded-md transition ${bbtInputMode === 'coeffs' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                      >
                        Hệ số
                      </button>
                      <button
                        type="button"
                        onClick={() => onRibbonAction({ type: 'switch_input_mode', inputMode: 'text' })}
                        className={`px-2 py-0.5 rounded-md transition ${bbtInputMode === 'text' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                      >
                        Gõ f(x)
                      </button>
                    </div>

                    <select
                      className="px-2 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        onRibbonAction({ type: 'select_bbt_preset', presetKey: val });
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Mẫu bài thi BBT --</option>
                      <option value="cubic_image1">Bậc 3: 2 Cực trị (Hình 1)</option>
                      <option value="cubic_monotonic">Bậc 3: Đồng biến trên R (Hình 2)</option>
                      <option value="rational11_image3">Phân thức 1/1: Gián đoạn (Hình 3)</option>
                      <option value="rational21_image4">Phân thức 2/1: Tiệm cận xiên (Hình 4)</option>
                      <option value="quartic_image5">Trùng phương: 3 cực trị (Hình 5)</option>
                    </select>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CẤU HÌNH HÀM SỐ (DẠNG SGK)
                </div>
              </div>

              {/* Nhóm 4: PHÔNG CHỮ & ĐỊNH DẠNG */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex flex-col gap-1 justify-center flex-1">
                  {/* Hàng 1: Phông & Chữ đậm */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Phông:</span>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'set_font', font: 'times' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                        bbtFont === 'times'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Times
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'set_font', font: 'latex' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                        bbtFont === 'latex'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      LaTeX
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'set_bold', bold: !bbtIsBold })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1 ${
                        bbtIsBold
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Bật/Tắt chữ đậm chuẩn SGK"
                    >
                      <Bold size={11} />
                      <span>Đậm</span>
                    </button>
                  </div>

                  {/* Hàng 2: Nét kẻ & Cỡ chữ */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Nét:</span>
                    {(['thin', 'standard', 'thick'] as const).map(stroke => (
                      <button
                        key={stroke}
                        type="button"
                        onClick={() => onRibbonAction({ type: 'set_stroke', stroke })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                          bbtStroke === stroke
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {stroke === 'thin' ? 'Mảnh' : stroke === 'standard' ? 'Chuẩn' : 'Đậm'}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-400 font-bold ml-1">Cỡ:</span>
                    <select
                      value={bbtFontSize}
                      onChange={(e) => onRibbonAction({ type: 'set_font_size', size: e.target.value })}
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="standard">Chuẩn</option>
                      <option value="large">To rõ SGK</option>
                      <option value="extra">Rất to</option>
                    </select>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  ĐỊNH DẠNG CHỮ & NÉT
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 3: HÌNH HỌC 2D & 3D (GSP)
              ========================================================================= */}
          {currentTab === 'geometry' && (
            <div className="flex items-stretch gap-2 shrink-0">
              {/* Nhóm 1: XUẤT BẢN WORD */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[72px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép Word</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'open_crop' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold transition shadow-2xs cursor-pointer border border-amber-300 dark:border-amber-700/60 h-[66px] min-w-[70px]"
                    title="Cắt nhanh 1 chạm: Giữ chuột trái kéo khung cần cắt, thả chuột ra là tự động chép vào Word (Alt + C)"
                  >
                    <Crop size={18} className="mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-tight text-center">Cắt nhanh</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Kéo dán Word</span>
                  </button>

                  <div className="flex flex-col gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_png' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title="Tải ảnh PNG độ phân giải 300 DPI"
                    >
                      <Download size={12} className="text-teal-600" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_select_tool', tool: 'clear' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                      title="Xóa sạch bản vẽ để vẽ hình mới"
                    >
                      <RotateCcw size={12} className="text-rose-600" />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: CÔNG CỤ DỰNG HÌNH GSP (TƯƠNG TÁC CHUỘT) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'select', label: 'Chọn & Dời', icon: MousePointer, tip: 'Chọn & di chuyển đỉnh, nhãn chữ' },
                    { id: 'point', label: 'Vẽ điểm', icon: CircleDot, tip: 'Chấm điểm tự do (A, B, C...)' },
                    { id: 'point_on_segment', label: 'Điểm trên cạnh', icon: Dot, tip: 'Lấy điểm nằm trên cạnh (phụ thuộc)' },
                    { id: 'segment', label: 'Đoạn thẳng', icon: Minus, tip: 'Nối đoạn thẳng giữa 2 điểm' },
                    { id: 'circle', label: 'Đường tròn', icon: Circle, tip: 'Vẽ đường tròn tâm và bán kính' },
                    { id: 'ellipse', label: 'Đáy Elip', icon: Circle, tip: 'Vẽ hình elip làm đáy hình không gian' },
                    { id: 'right_angle', label: 'Góc vuông', icon: CornerDownRight, tip: 'Đánh dấu ký hiệu góc vuông' },
                    { id: 'text', label: 'Chữ / Nhãn', icon: Type, tip: 'Thêm chữ ký hiệu hoặc công thức' },
                    { id: 'eraser', label: 'Tẩy xóa', icon: Eraser, tip: 'Nhấp đối tượng để xóa nhanh' },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    const isActive = gspActiveTool === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onRibbonAction({ type: 'gsp_select_tool', tool: item.id })}
                        className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer h-[66px] min-w-[62px] border ${
                          isActive
                            ? `${theme.softBg} ${theme.primaryText} border-teal-500 shadow-2xs ring-2 ring-teal-400/50`
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={item.tip}
                      >
                        <ItemIcon size={16} className={`mb-0.5 ${isActive ? theme.primaryText : 'text-slate-600 dark:text-slate-400'}`} />
                        <span className="text-[10px] leading-tight text-center whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CÔNG CỤ DỰNG HÌNH GSP
                </div>
              </div>

              {/* Nhóm 3: KHO MẪU HÌNH SGK (BẤM NẠP NGAY) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'pyramid_regular_quad', label: 'Chóp S.ABCD', desc: 'Chóp tứ giác đều (SO ⊥ đáy)' },
                    { id: 'pyramid_regular_tri', label: 'Chóp S.ABC', desc: 'Chóp tam giác đều (SG ⊥ đáy)' },
                    { id: 'chop_sa_vuong_day', label: 'Chóp SA ⊥ đáy', desc: 'Góc vuông tại đỉnh A' },
                    { id: 'lang_tru_tam_giac', label: 'Lăng trụ tam giác', desc: "Lăng trụ ABC.A'B'C'" },
                    { id: 'box_abcd', label: 'Hình hộp chữ nhật', desc: "Hình hộp ABCD.A'B'C'D'" },
                    { id: 'tam_giac_vuong_cao', label: 'Tam giác (AH)', desc: 'Tam giác vuông đường cao AH' },
                    { id: 'triangle_equi', label: 'Tam giác đều', desc: 'Tam giác đều ABC' },
                    { id: 'parallelogram', label: 'Hình bình hành', desc: 'Bình hành ABCD đáy không gian' },
                    { id: 'cone', label: 'Hình nón', desc: 'Đỉnh S & đáy tròn' },
                    { id: 'cylinder', label: 'Hình trụ', desc: 'Hai đáy tròn song song' },
                    { id: 'hinh_cau', label: 'Hình cầu', desc: 'Tâm O & đường vĩ tuyến' },
                  ].map(sample => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_load_sample', sample: sample.id })}
                      className="flex flex-col items-start justify-center px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 text-slate-700 dark:text-slate-300 transition cursor-pointer h-[66px] min-w-[105px]"
                      title={`Bấm để nạp mẫu: ${sample.desc}`}
                    >
                      <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 truncate w-full">{sample.label}</span>
                      <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">{sample.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  KHO MẪU HÌNH SGK (BẤM NẠP NGAY)
                </div>
              </div>

              {/* Nhóm 4: ĐỊNH DẠNG ĐƯỜNG NÉT & CỠ ĐIỂM */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {/* Điều khiển Cỡ chấm điểm tròn */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_set_point_size', size: 'small' })}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 cursor-pointer flex items-center gap-1"
                      title="Chấm tròn điểm nhỏ chuẩn SGK, vừa đủ nhìn (bán kính 2.0px)"
                    >
                      <CircleDot size={12} className="text-teal-600 shrink-0" />
                      <span>Chấm nhỏ SGK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_toggle_point_mode' })}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                      title="Chuyển đổi: Hiện chấm tròn nhỏ • / Ẩn chấm chỉ giữ chữ nhãn A, B, C..."
                    >
                      <span>Ẩn/Hiện chấm •</span>
                    </button>
                  </div>

                  {/* Nét liền / Nét đứt */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_set_line_style', style: 'solid' })}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                      title="Vẽ nét liền cho cạnh nhìn thấy"
                    >
                      <Minus size={12} className="text-slate-800 dark:text-slate-200 shrink-0" />
                      <span>Nét liền</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_set_line_style', style: 'dashed' })}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                      title="Vẽ nét đứt cho cạnh khuất"
                    >
                      <Minus size={12} className="border-b border-dashed border-slate-800 shrink-0" />
                      <span>Nét đứt</span>
                    </button>
                  </div>

                  {/* Lưới tọa độ */}
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'gsp_toggle_grid' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold h-[66px] min-w-[50px] cursor-pointer"
                    title="Bật / Tắt lưới toạ độ nền GSP"
                  >
                    <Grid size={16} className="text-teal-600 mb-0.5" />
                    <span className="text-[10px] leading-tight">Lưới</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  ĐƯỜNG NÉT & CỠ ĐIỂM
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 4: BIỂU ĐỒ THỐNG KÊ
              ========================================================================= */}
          {currentTab === 'statistics' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[72px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép Word</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'open_crop' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold transition shadow-2xs cursor-pointer border border-amber-300 dark:border-amber-700/60 h-[66px] min-w-[70px]"
                    title="Cắt nhanh 1 chạm: Giữ chuột trái kéo khung cần cắt, thả chuột ra là tự động chép vào Word (Alt + C)"
                  >
                    <Crop size={18} className="mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-tight text-center">Cắt nhanh</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Kéo dán Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'download_png' })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer h-[66px]"
                    title="Tải ảnh PNG"
                  >
                    <Download size={13} className="text-teal-600" />
                    <span className="text-[11px]">PNG</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Cấp học & Dạng biểu đồ */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'bar', label: 'Biểu đồ Cột', desc: 'Đơn / Kép (THCS)' },
                    { id: 'pie', label: 'Quạt tròn', desc: 'Tỉ lệ phần trăm %' },
                    { id: 'box', label: 'Biểu đồ Hộp', desc: 'Tứ phân vị Q1-Q3 (THPT)' },
                    { id: 'line', label: 'Đoạn thẳng', desc: 'Biến thiên chuỗi' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'select_stat_chart', chart: c.id })}
                      className="flex flex-col items-start justify-center px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer h-[66px] min-w-[105px]"
                    >
                      <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 truncate w-full">{c.label}</span>
                      <span className="text-[9px] font-normal text-slate-400 truncate w-full mt-0.5">{c.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  DẠNG BIỂU ĐỒ THỐNG KÊ
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">THCS & THPT</span>
                    <span className="text-[9px] text-slate-400">Số liệu ghép nhóm & Rời rạc</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  SỐ LIỆU SGK
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 5: CÂY XÁC SUẤT
              ========================================================================= */}
          {currentTab === 'probability_tree' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[72px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép Word</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'open_crop' })}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold transition shadow-2xs cursor-pointer border border-amber-300 dark:border-amber-700/60 h-[66px] min-w-[70px]"
                    title="Cắt nhanh 1 chạm: Giữ chuột trái kéo khung cần cắt, thả chuột ra là tự động chép vào Word (Alt + C)"
                  >
                    <Crop size={18} className="mb-0.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-tight text-center">Cắt nhanh</span>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Kéo dán Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'download_png' })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer h-[66px]"
                    title="Tải ảnh PNG"
                  >
                    <Download size={13} className="text-teal-600" />
                    <span className="text-[11px]">PNG</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Cấu trúc cây */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {['Cây 2 tầng', 'Cây 3 tầng', 'Định lý Bayes', 'Xác suất toàn phần'].map(structure => (
                    <button
                      key={structure}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'tree_select_type', structure })}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {structure}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CẤU TRÚC CÂY XÁC SUẤT
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 6: GEOGEBRA 3D
              ========================================================================= */}
          {currentTab === 'geogebra' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer border border-emerald-700 h-[66px] min-w-[78px]"
                  >
                    <Copy size={20} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Chép 3D</span>
                    <span className="text-[9px] text-emerald-100 font-normal">300 DPI</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  XUẤT BẢN
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {['Không gian Oxyz', 'Mặt phẳng (P)', 'Đường thẳng (d)', 'Mặt cầu (S)', 'Khối tròn xoay'].map(obj => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'geogebra_select_object', obj })}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {obj}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  ĐỐI TƯỢNG OXYZ 3D
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 7: MÔ PHỎNG KHÁI NIỆM
              ========================================================================= */}
          {currentTab === 'simulation' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'sim_play' })}
                    className="flex flex-col items-center justify-center px-3.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-xs cursor-pointer h-[66px] min-w-[78px]"
                  >
                    <Play size={20} className="mb-0.5" />
                    <span className="text-[11px] leading-tight text-center">Bắt đầu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'sim_reset' })}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-amber-600" />
                    <span>Đặt lại</span>
                  </button>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  ĐIỀU KHIỂN
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {['Đạo hàm & Tiếp tuyến', 'Tích phân & Riemann', 'Đường tròn lượng giác'].map(sim => (
                    <button
                      key={sim}
                      type="button"
                      onClick={() => onRibbonAction({ type: 'sim_select_topic', topic: sim })}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {sim}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  CHỦ ĐỀ ĐỘNG MINH HỌA
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 8: HƯỚNG DẪN SỬ DỤNG
              ========================================================================= */}
          {currentTab === 'guide' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">Tài liệu & Kỹ thuật In ấn 300 DPI</span>
                    <span className="text-[9px] text-slate-400">Tác giả: GV Lê Vĩnh Phúc (0944405124) - LVP EduEcosystem</span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mt-0.5">
                  HỆ SINH THÁI GIÁO DỤC SỐ LVP
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
