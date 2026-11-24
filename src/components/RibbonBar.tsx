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
  Dot,
  CornerDownRight,
  Type,
  Eraser
} from 'lucide-react';
import { TabId } from '../App';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';
import { CustomDropdownSelect, SelectOption } from './CustomDropdown';

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
  { id: 'bbt_graph', label: 'Đồ thị', icon: TrendingUp },
  { id: 'bbt', label: 'Bảng biến thiên', icon: Table },
  { id: 'geometry', label: 'Hình học', icon: Compass },
  { id: 'statistics', label: 'Thống kê', icon: BarChart2 },
  { id: 'probability_tree', label: 'Cây xác suất', icon: GitFork },
  { id: 'geogebra', label: 'GeoGebra 3D', icon: Layers },
  { id: 'simulation', label: 'Mô phỏng', icon: MonitorPlay },
  { id: 'guide', label: 'Hướng dẫn', icon: HelpCircle },
];

const GSP_SAMPLE_OPTIONS: SelectOption[] = [
  { value: 'pyramid_regular_quad', label: 'Chóp S.ABCD (SO ⊥ đáy)' },
  { value: 'pyramid_regular_tri', label: 'Chóp S.ABC (SG ⊥ đáy)' },
  { value: 'chop_sa_vuong_day', label: 'Chóp S.ABCD (SA ⊥ đáy)' },
  { value: 'lang_tru_tam_giac', label: "Lăng trụ tam giác ABC.A'B'C'" },
  { value: 'box_abcd', label: "Hình hộp chữ nhật ABCD.A'B'C'D'" },
  { value: 'tam_giac_vuong_cao', label: 'Tam giác vuông đường cao AH' },
  { value: 'triangle_equi', label: 'Tam giác đều ABC' },
  { value: 'parallelogram', label: 'Hình bình hành ABCD' },
  { value: 'cone', label: 'Hình nón tròn xoay' },
  { value: 'cylinder', label: 'Hình trụ tròn xoay' },
  { value: 'hinh_cau', label: 'Hình cầu Oxyz' },
];

const GRAPH_PRESET_OPTIONS: SelectOption[] = [
  { value: 'rational_2_1_1', label: 'Bậc 2/1: (x²-x+1)/(x-1)' },
  { value: 'rational_1_1', label: 'Hữu tỉ: (2x+1)/(x-1)' },
  { value: 'cubic_2ext', label: 'Bậc 3: x³ - 3x + 1' },
];

const BBT_PRESET_OPTIONS: SelectOption[] = [
  { value: 'cubic_image1', label: 'Bậc 3: 2 Cực trị (Hình 1)' },
  { value: 'cubic_monotonic', label: 'Bậc 3: Đồng biến trên R (Hình 2)' },
  { value: 'rational11_image3', label: 'Phân thức 1/1: Gián đoạn (Hình 3)' },
  { value: 'rational21_image4', label: 'Phân thức 2/1: Tiệm cận xiên (Hình 4)' },
  { value: 'quartic_image5', label: 'Trùng phương: 3 cực trị (Hình 5)' },
];

const FONT_SIZE_OPTIONS: SelectOption[] = [
  { value: 'standard', label: 'Chuẩn' },
  { value: 'large', label: 'To rõ SGK' },
  { value: 'extra', label: 'Rất to' },
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
    <div className="bg-white dark:bg-slate-900 border-b border-[#E1DFDD] dark:border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.06)] select-none">
      
      {/* 1. DÒNG THẺ MENU (RIBBON TAB STRIP - Office 365 / Fluent Design Light Theme) */}
      <div className="flex items-center justify-between px-2 sm:px-3 border-b border-[#E1DFDD] dark:border-slate-800 bg-[#F3F2F1] dark:bg-slate-950 h-[36px] min-h-[36px]">
        
        {/* Nhóm Tabs bên trái */}
        <div role="tablist" aria-label="Ribbon Tabs" className="flex items-center gap-0.5 overflow-x-auto scrollbar-none h-full">
          {/* NÚT TỆP (FILE TAB ĐẶC TRƯNG CỦA MICROSOFT WORD) */}
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => onRibbonAction({ type: 'open_file_menu' })}
            className="h-[36px] px-3.5 bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer mr-1 shrink-0"
            title="Tệp (Cài đặt, phím tắt, thông tin tài liệu)"
          >
            <span>Tệp</span>
          </button>

          {RIBBON_TABS.map(tab => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`ribbon-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`ribbon-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  onSelectTab(tab.id);
                  if (isRibbonCollapsed) {
                    onToggleRibbonCollapse();
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 text-xs transition-all cursor-pointer whitespace-nowrap h-[36px] shrink-0 ${
                  isActive
                    ? 'font-bold text-[#242424] dark:text-white bg-white dark:bg-slate-900 border-b-[3px] border-[#0F6CBD] dark:border-sky-400 -mb-[1px]'
                    : 'font-semibold text-[#424242] dark:text-slate-400 hover:bg-[#EDEBE9] dark:hover:bg-slate-800/60 hover:text-[#201F1E] dark:hover:text-slate-200 border-b-[3px] border-transparent'
                }`}
              >
                <TabIcon size={14} className={isActive ? 'text-[#0F6CBD] dark:text-sky-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* CONTEXTUAL TABS (THẺ NGỮ CẢNH ĐẶC BIỆT CHỮ XANH DƯƠNG THEO CHUẨN OFFICE 365) */}
          {(currentTab === 'geometry' || currentTab === 'bbt' || currentTab === 'bbt_graph') && (
            <div className="flex items-center ml-1.5 pl-2 border-l border-[#E1DFDD] dark:border-slate-800 shrink-0 h-full">
              <div className="flex flex-col justify-center px-1">
                <span className="text-[9px] font-bold text-[#0F6CBD] dark:text-sky-400 uppercase tracking-wider leading-none">
                  {currentTab === 'geometry' ? 'CÔNG CỤ HÌNH HỌC (GSP)' : currentTab === 'bbt' ? 'CÔNG CỤ BẢNG BIẾN THIÊN' : 'CÔNG CỤ ĐỒ THỊ OXY'}
                </span>
                <span className="text-[11px] font-bold text-[#0F6CBD] dark:text-sky-300 leading-tight">
                  Định dạng 300 DPI
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nút thu gọn / bung rộng Ribbon (Ctrl + F1 hoặc Alt + B) */}
        <button
          onClick={onToggleRibbonCollapse}
          className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] text-[#605E5C] hover:bg-[#EDEBE9] dark:hover:bg-slate-800 hover:text-[#201F1E] dark:hover:text-slate-200 transition cursor-pointer shrink-0 ml-2"
          title={isRibbonCollapsed ? "Mở rộng Dải công cụ Ribbon (Ctrl + F1)" : "Thu gọn Dải công cụ Ribbon (Ctrl + F1)"}
        >
          {isRibbonCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      {/* 2. DẢI CÔNG CỤ TOOLBAR (RIBBON COMMAND PANEL - BỐ CỤC CHUẨN OFFICE 365) */}
      {!isRibbonCollapsed && (
        <div className="flex items-stretch overflow-x-auto py-1 px-2 bg-white dark:bg-slate-900 min-h-[96px] max-h-[102px] scrollbar-thin">
          
          {/* =========================================================================
              PHÂN HỆ 1: ĐỒ THỊ & TRỤC SỐ
              ========================================================================= */}
          {currentTab === 'bbt_graph' && (
            <div className="flex items-stretch gap-2 shrink-0">
              
              {/* Nhóm 1: CLIPBOARD / XUẤT ẢNH WORD */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ ảnh nét cao 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép Word</span>
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: PHÂN HỆ CÔNG CỤ */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  PHÂN HỆ TOÁN
                </div>
              </div>

              {/* Nhóm 3: DẠNG HÀM OXY (Word Style Gallery Cards) */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
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

                    <CustomDropdownSelect
                      value=""
                      placeholder="-- Mẫu SGK --"
                      ariaLabel="Chọn mẫu đồ thị SGK chuẩn ARIA"
                      options={GRAPH_PRESET_OPTIONS}
                      onChange={(val) => {
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
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ bảng biến thiên 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép Word</span>
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: CHẾ ĐỘ BẢNG */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  CHẾ ĐỘ BẢNG
                </div>
              </div>

              {/* Nhóm 3: CẤU HÌNH HÀM SỐ (Dạng hàm SGK - Word Style Gallery Cards) */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
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

                    <CustomDropdownSelect
                      value=""
                      placeholder="-- Mẫu bài thi BBT --"
                      ariaLabel="Chọn mẫu bài thi bảng biến thiên chuẩn ARIA"
                      options={BBT_PRESET_OPTIONS}
                      onChange={(val) => {
                        onRibbonAction({ type: 'select_bbt_preset', presetKey: val });
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                    <div className="w-24">
                      <CustomDropdownSelect
                        value={bbtFontSize}
                        ariaLabel="Chọn cỡ chữ bảng biến thiên chuẩn ARIA"
                        options={FONT_SIZE_OPTIONS}
                        onChange={(val) => onRibbonAction({ type: 'set_font_size', size: val })}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép Word</span>
                  </button>

                  <div className="flex flex-col gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'download_png' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs font-medium bg-white hover:bg-[#EDEBE9] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 cursor-pointer"
                      title="Tải ảnh PNG độ phân giải 300 DPI"
                    >
                      <Download size={12} className="text-[#0F6CBD]" />
                      <span>PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRibbonAction({ type: 'gsp_select_tool', tool: 'clear' })}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs font-medium bg-white hover:bg-rose-50 text-rose-600 border border-[#E1DFDD] dark:border-slate-700 cursor-pointer"
                      title="Xóa sạch bản vẽ để vẽ hình mới"
                    >
                      <RotateCcw size={12} className="text-rose-500" />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Nhóm 2: CÔNG CỤ DỰNG HÌNH GSP (TƯƠNG TÁC CHUỘT) */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1 flex-1">
                  {[
                    { id: 'select', label: 'Chọn', icon: MousePointer, tip: 'Chọn & di chuyển đỉnh, nhãn chữ' },
                    { id: 'point', label: 'Điểm', icon: CircleDot, tip: 'Chấm điểm tự do (A, B, C...)' },
                    { id: 'point_on_segment', label: 'Điểm cạnh', icon: Dot, tip: 'Lấy điểm nằm trên cạnh' },
                    { id: 'segment', label: 'Đoạn thẳng', icon: Minus, tip: 'Nối đoạn thẳng giữa 2 điểm' },
                    { id: 'circle', label: 'Đường tròn', icon: Circle, tip: 'Vẽ đường tròn tâm và bán kính' },
                    { id: 'ellipse', label: 'Elip', icon: Circle, tip: 'Vẽ hình elip làm đáy hình không gian' },
                    { id: 'right_angle', label: 'Góc vuông', icon: CornerDownRight, tip: 'Đánh dấu ký hiệu góc vuông' },
                    { id: 'text', label: 'Nhãn', icon: Type, tip: 'Thêm chữ ký hiệu hoặc công thức' },
                    { id: 'eraser', label: 'Tẩy', icon: Eraser, tip: 'Nhấp đối tượng để xóa nhanh' },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    const isActive = gspActiveTool === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onRibbonAction({ type: 'gsp_select_tool', tool: item.id })}
                        className={`flex flex-col items-center justify-center px-2 py-1 rounded-[4px] text-xs transition cursor-pointer h-[66px] min-w-[54px] border ${
                          isActive
                            ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold shadow-2xs'
                            : 'bg-white hover:bg-[#EDEBE9] text-[#242424] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-transparent'
                        }`}
                        title={item.tip}
                      >
                        <ItemIcon size={18} className={`mb-1 ${isActive ? 'text-[#0F6CBD]' : 'text-[#424242] dark:text-slate-400'}`} />
                        <span className="text-[11px] leading-tight text-center whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  CÔNG CỤ DỰNG HÌNH
                </div>
              </div>

              {/* Nhóm 3: MẪU HÌNH SGK (DROPDOWN TINH GỌN CHUẨN FLUENT) */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[190px]">
                <div className="flex flex-col justify-center gap-1.5 flex-1">
                  <span className="text-[11px] font-medium text-[#605E5C] dark:text-slate-400">Nạp nhanh mẫu SGK:</span>
                  <CustomDropdownSelect
                    value=""
                    placeholder="-- Chọn mẫu hình học --"
                    ariaLabel="Chọn mẫu hình học SGK chuẩn ARIA"
                    options={GSP_SAMPLE_OPTIONS}
                    onChange={(val) => {
                      if (val) onRibbonAction({ type: 'gsp_load_sample', sample: val });
                    }}
                    buttonClassName="h-[32px] text-xs"
                  />
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  MẪU HÌNH SGK
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép Word</span>
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  XUẤT BẢN WORD
                </div>
              </div>

              {/* Cấp học & Dạng biểu đồ */}
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  {[
                    { id: 'box', label: 'Biểu đồ Hộp', desc: 'Tứ phân vị Q1, Q2, Q3' },
                    { id: 'hist', label: 'Ghép nhóm', desc: 'Tần số khoảng [a; b)' },
                    { id: 'both', label: 'Cả hai dạng', desc: 'Hộp & Biểu đồ cột ghép' },
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  DẠNG BIỂU ĐỒ THỐNG KÊ THPT
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">Toán 10, 11, 12</span>
                    <span className="text-[9px] text-slate-400">Số liệu ghép nhóm & Rời rạc 300 DPI</span>
                  </div>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
                  CHUẨN GDPT 2018
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHÂN HỆ 5: CÂY XÁC SUẤT
              ========================================================================= */}
          {currentTab === 'probability_tree' && (
            <div className="flex items-stretch gap-2 shrink-0">
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ hình vẽ 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép Word</span>
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction({ type: 'copy_word' })}
                    className="flex flex-col items-center justify-center px-3 py-1 rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] text-white font-semibold transition shadow-xs cursor-pointer h-[66px] min-w-[68px]"
                    title="Sao chép toàn bộ hình 3D 300 DPI dán trực tiếp vào Microsoft Word (Ctrl + V)"
                  >
                    <Copy size={18} className="mb-1" />
                    <span className="text-xs font-bold leading-tight text-center">Chép 3D</span>
                  </button>
                </div>
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
              <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
                <div className="text-[11px] font-normal text-[#605E5C] dark:text-slate-400 text-center pb-0.5 mt-auto select-none">
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
