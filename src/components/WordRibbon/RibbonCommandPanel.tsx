/**
 * @license
 * RibbonCommandPanel.tsx
 * Tầng 2: Thanh công cụ Ribbon Command Panel (~96px, nền #FFFFFF, viền #E1DFDD)
 * Chứa đầy đủ các nhóm chức năng cho 6 Tab chính + 1 Contextual Tab:
 * - Chia thành các Command Groups ngăn cách bằng đường kẻ dọc mảnh (#E1DFDD)
 * - Mỗi nhóm có nhãn tên nhóm (11px, #605E5C) căn giữa sát mép dưới
 * - Nút lớn (icon 24-28px, chữ dưới), nút nhỏ 2 hàng
 * - Nút Cắt nhanh - Kéo dán Word & Copy vào Word (300 DPI, lề 24px)
 * - Kết nối trực tiếp với các phân hệ đồ họa toán học GDPT 2018
 */

import React from 'react';
import {
  Sparkles,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Bold,
  Italic,
  Subscript,
  Superscript,
  Download,
  Share2,
  TrendingUp,
  Sliders,
  Grid,
  Maximize2,
  Layers,
  Box,
  Compass,
  PieChart,
  BarChart2,
  GitFork,
  CheckSquare,
  Lock,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RotateCw,
  RotateCcw,
  Plus,
  Minus,
  Equal,
  X,
  Crop,
  Eye,
  EyeOff,
  Circle,
  CircleDot,
  Dot,
  CornerDownRight,
  Type,
  Eraser,
  MonitorPlay,
  Table as TableIcon,
  Image as ImageIcon
} from 'lucide-react';
import { 
  RibbonTabId, 
  ArtboardDocument, 
  TypographySettings, 
  StrokeFillSettings 
} from '../../types/mathArtboard';
import AccessibleDropdown from './AccessibleDropdown';

export interface RibbonCommandPanelProps {
  activeTab: RibbonTabId;
  doc: ArtboardDocument;
  onUpdateDoc: (updater: (prev: ArtboardDocument) => ArtboardDocument) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopyWord: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onSelectTemplate: (category: string, presetKey: string) => void;
  onRibbonAction?: (action: { type: string; [key: string]: any }) => void;
  graphSubTab?: 'graph' | 'inequality' | 'number_line';
  bbtMasterMode?: 'auto' | 'variation' | 'sign_chart';
  bbtIsBold?: boolean;
  bbtStroke?: number;
  gspActiveTool?: string;
  statsTool?: 'statistics' | 'tree';
  onSetStatsTool?: (tool: 'statistics' | 'tree') => void;
}

// Nhóm xuất Word chung tiện dụng cho mọi tab
function ExportGroup({
  onCopyWord,
  onDownloadPng,
  onDownloadSvg,
}: {
  onCopyWord: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
}) {
  return (
    <div className="flex flex-col justify-between px-2 min-w-[170px] ml-auto shrink-0 select-none">
      <div className="flex items-center gap-1.5 flex-1">
        <button
          type="button"
          onClick={onCopyWord}
          className="h-[64px] px-3.5 flex flex-col items-center justify-center rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] active:bg-[#0C5494] text-white font-semibold transition cursor-pointer shadow-xs"
          title="Tự động căn lề 24px đều 4 cạnh, xuất 300 DPI và sao chép vào Clipboard (Ctrl + V vào Word)"
        >
          <Copy size={18} className="mb-1" />
          <span className="text-[11px] font-bold leading-tight">Copy vào Word</span>
          <span className="text-[9px] opacity-90 font-normal">300 DPI • Lề 24px</span>
        </button>

        <AccessibleDropdown
          label="Tải PNG"
          icon={Download}
          variant="large"
          ariaLabel="Menu tải ảnh"
          items={[
            { id: 'png', label: 'Tải PNG (300 DPI, Lề 24px)', shortcut: 'PNG', onClick: onDownloadPng },
            { id: 'svg', label: 'Tải Vector SVG sắc nét', shortcut: 'SVG', onClick: onDownloadSvg },
          ]}
        />
      </div>
      <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto">
        Xuất sang Word
      </div>
    </div>
  );
}

// Nhóm định dạng đồ thị thống nhất toàn hệ thống (Times New Roman, LaTeX KaTeX, 12 ˅, B, I, Lưới Oxy)
interface MathFormattingGroupProps {
  fontFamily: string;
  onSelectFont: (font: 'times' | 'latex') => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  isBold: boolean;
  onToggleBold: () => void;
  isItalic: boolean;
  onToggleItalic: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  gridLabel?: string;
  groupTitle?: string;
  extraControls?: React.ReactNode;
}

function MathFormattingGroup({
  fontFamily,
  onSelectFont,
  fontSize,
  onChangeFontSize,
  isBold,
  onToggleBold,
  isItalic,
  onToggleItalic,
  showGrid,
  onToggleGrid,
  gridLabel = 'Lưới Oxy',
  groupTitle = 'Định dạng đồ thị',
  extraControls,
}: MathFormattingGroupProps) {
  const isTimes = !fontFamily || fontFamily.toLowerCase().includes('times');
  const isLatex = fontFamily.toLowerCase().includes('latex') || fontFamily.toLowerCase().includes('katex');

  return (
    <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px] select-none">
      <div className="flex flex-col justify-center gap-1 flex-1">
        {/* Hàng 1: Times New Roman, LaTeX KaTeX, Cỡ chữ (12 ˅) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectFont('times')}
            className={`h-[26px] px-2 rounded-[3px] text-xs border font-serif font-bold transition cursor-pointer ${
              isTimes && !isLatex
                ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                : 'border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
            }`}
            title="Phông chữ Times New Roman chuẩn tài liệu Word"
          >
            <span>Times New Roman</span>
          </button>
          
          <button
            type="button"
            onClick={() => onSelectFont('latex')}
            className={`h-[26px] px-2 rounded-[3px] text-xs border font-mono transition cursor-pointer ${
              isLatex
                ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold'
                : 'border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
            }`}
            title="Phông chữ công thức LaTeX KaTeX"
          >
            <span>LaTeX KaTeX</span>
          </button>

          {/* Chọn kích thước chữ (12 ˅) chuẩn Office Ribbon */}
          <select
            value={fontSize || 12}
            onChange={(e) => onChangeFontSize(Number(e.target.value))}
            className="h-[26px] px-1 text-xs font-semibold border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[52px] cursor-pointer hover:border-[#0F6CBD] transition"
            title="Kích thước chữ (pt)"
          >
            {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Hàng 2: In đậm (B), In nghiêng (I), Lưới Oxy */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleBold}
            className={`w-[26px] h-[26px] flex items-center justify-center rounded-[3px] border transition cursor-pointer ${
              isBold
                ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold'
                : 'border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
            }`}
            title="In đậm (Bold)"
          >
            <Bold size={14} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onToggleItalic}
            className={`w-[26px] h-[26px] flex items-center justify-center rounded-[3px] border transition cursor-pointer ${
              isItalic
                ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold'
                : 'border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
            }`}
            title="In nghiêng (Italic - Chuẩn biến số x, y, A, B)"
          >
            <Italic size={14} className="stroke-[2.5]" />
          </button>

          {onToggleGrid && (
            <button
              type="button"
              onClick={onToggleGrid}
              className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer flex items-center gap-1 ${
                showGrid
                  ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                  : 'border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
              }`}
              title="Bật/Tắt hiển thị lưới tọa độ Oxy"
            >
              <Grid size={13} className="text-[#0F6CBD]" />
              <span>{gridLabel}</span>
            </button>
          )}

          {extraControls}
        </div>
      </div>

      <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
        {groupTitle}
      </div>
    </div>
  );
}

export default function RibbonCommandPanel({
  activeTab,
  doc,
  onUpdateDoc,
  onUndo,
  onRedo,
  onCopyWord,
  onDownloadPng,
  onDownloadSvg,
  onSelectTemplate,
  onRibbonAction,
  graphSubTab = 'graph',
  bbtMasterMode = 'auto',
  bbtIsBold = false,
  bbtStroke = 1.5,
  gspActiveTool = 'select',
  statsTool = 'statistics',
  onSetStatsTool,
}: RibbonCommandPanelProps) {

  // Update Typography
  const updateTypo = (key: keyof TypographySettings, val: any) => {
    onUpdateDoc(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: val }
    }));
  };

  // Update Stroke & Fill
  const updateStrokeFill = (key: keyof StrokeFillSettings, val: any) => {
    onUpdateDoc(prev => ({
      ...prev,
      strokeFill: { ...prev.strokeFill, [key]: val }
    }));
  };

  return (
    <div 
      id={`ribbon-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`ribbon-tab-${activeTab}`}
      className="h-[96px] bg-white dark:bg-slate-900 border-b border-[#E1DFDD] dark:border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.04)] px-3 flex items-center overflow-x-auto scrollbar-thin select-none"
    >
      {/* =========================================================================
          TAB 1: TRANG CHỦ (HOME - TAB MẶC ĐỊNH)
          ========================================================================= */}
      {activeTab === 'home' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1 – Thao tác Clipboard */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onUndo}
                    className="h-[26px] px-2 flex items-center gap-1 rounded-[3px] border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200 text-xs transition cursor-pointer"
                    title="Hoàn tác (Ctrl + Z)"
                  >
                    <Undo2 size={13} />
                    <span>Hoàn tác</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    className="h-[26px] px-2 flex items-center gap-1 rounded-[3px] border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200 text-xs transition cursor-pointer"
                    title="Làm lại (Ctrl + Y)"
                  >
                    <Redo2 size={13} />
                    <span>Làm lại</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_select_tool', tool: 'clear' })}
                    className="h-[26px] px-2 flex items-center gap-1 rounded-[3px] border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 text-xs transition cursor-pointer"
                    title="Làm sạch bản vẽ"
                  >
                    <Trash2 size={13} />
                    <span>Làm sạch</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Thao tác
            </div>
          </div>

          {/* Nhóm 2 – Kiểu chữ & Nhãn (Typography) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <select
                  value={doc.typography.fontFamily}
                  onChange={(e) => updateTypo('fontFamily', e.target.value)}
                  className="h-[24px] px-1.5 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[125px]"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Cambria Math">Cambria Math</option>
                  <option value="Arial">Arial</option>
                </select>

                <select
                  value={doc.typography.fontSize || 12}
                  onChange={(e) => updateTypo('fontSize', Number(e.target.value))}
                  className="h-[24px] px-1 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[55px]"
                >
                  {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map(s => (
                    <option key={s} value={s}>{s} pt</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    updateTypo('isBold', !doc.typography.isBold);
                    onRibbonAction?.({ type: 'set_bold', bold: !doc.typography.isBold });
                  }}
                  className={`p-1 rounded-[3px] border transition cursor-pointer ${
                    doc.typography.isBold
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
                  }`}
                  title="In đậm (Bold)"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTypo('isItalic', !doc.typography.isItalic)}
                  className={`p-1 rounded-[3px] border transition cursor-pointer ${
                    doc.typography.isItalic
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
                  }`}
                  title="In nghiêng (Italic - chuẩn biến số x, y, A, B)"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTypo('isSubscript', !doc.typography.isSubscript)}
                  className="p-1 rounded-[3px] border border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200"
                  title="Chỉ số dưới (x₁)"
                >
                  <Subscript size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTypo('isSuperscript', !doc.typography.isSuperscript)}
                  className="p-1 rounded-[3px] border border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200"
                  title="Chỉ số trên (x²)"
                >
                  <Superscript size={14} />
                </button>
                <input
                  type="color"
                  value={doc.typography.color}
                  onChange={(e) => updateTypo('color', e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 ml-1"
                  title="Màu chữ ký hiệu"
                />
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Kiểu chữ & Nhãn
            </div>
          </div>

          {/* Nhóm 3 – Nét vẽ (Stroke & Fill) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[190px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              <div className="flex items-center gap-2">
                <select
                  value={doc.strokeFill.strokeWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    updateStrokeFill('strokeWidth', w);
                    onRibbonAction?.({ type: 'set_stroke', stroke: w });
                  }}
                  className="h-[24px] px-1 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[75px]"
                >
                  <option value="0.75">0.75 pt</option>
                  <option value="1">1.0 pt</option>
                  <option value="1.5">1.5 pt</option>
                  <option value="2">2.0 pt</option>
                </select>

                <select
                  value={doc.strokeFill.strokeStyle}
                  onChange={(e) => {
                    const st = e.target.value as any;
                    updateStrokeFill('strokeStyle', st);
                    onRibbonAction?.({ type: 'gsp_set_line_style', style: st });
                  }}
                  className="h-[24px] px-1.5 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[90px]"
                >
                  <option value="solid">― Nét liền</option>
                  <option value="dashed">- - Nét đứt</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px]">
                  <span>Nét:</span>
                  <input
                    type="color"
                    value={doc.strokeFill.strokeColor}
                    onChange={(e) => updateStrokeFill('strokeColor', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                    title="Màu đường nét"
                  />
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <span>Gạch sọc:</span>
                  <select
                    value={doc.strokeFill.hatching}
                    onChange={(e) => updateStrokeFill('hatching', e.target.value)}
                    className="h-[22px] px-1 text-[11px] border border-[#E1DFDD] rounded-[3px] bg-white dark:bg-slate-800"
                  >
                    <option value="none">Trống</option>
                    <option value="diagonal_left">Gạch chéo /////</option>
                    <option value="cross">Sọc caro</option>
                    <option value="dots">Chấm bi</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Nét vẽ
            </div>
          </div>

          {/* Nhóm 4 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 2: ĐỒ THỊ 2D (GIẢI TÍCH 10 – 11 – 12)
          ========================================================================= */}
      {activeTab === 'graph_2d' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1 – Chế độ đồ thị */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_subtab', subtab: 'graph' })}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  graphSubTab === 'graph' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <TrendingUp size={20} className="mb-1 text-teal-600" />
                <span className="text-[11px] leading-tight">Đồ thị Oxy</span>
                <span className="text-[9px] text-[#605E5C]">Khảo sát từ f(x)</span>
              </button>

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_subtab', subtab: 'inequality' })}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  graphSubTab === 'inequality' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <Sliders size={20} className="mb-1 text-[#0F6CBD]" />
                <span className="text-[11px] leading-tight">Miền nghiệm BPT</span>
                <span className="text-[9px] text-[#605E5C]">BPT bậc 1 (L10)</span>
              </button>

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_subtab', subtab: 'number_line' })}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  graphSubTab === 'number_line' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <Minus size={20} className="mb-1 text-indigo-600" />
                <span className="text-[11px] leading-tight">Trục số (L10)</span>
                <span className="text-[9px] text-[#605E5C]">Khoảng, Đoạn, Giao/Hợp</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Chế độ đồ thị
            </div>
          </div>

          {/* Nhóm 2 – Định dạng đồ thị */}
          <MathFormattingGroup
            fontFamily={doc.typography.fontFamily}
            onSelectFont={(f) => {
              updateTypo('fontFamily', f === 'latex' ? 'LaTeX KaTeX' : 'Times New Roman');
              onRibbonAction?.({ type: 'set_font', font: f });
            }}
            fontSize={doc.typography.fontSize || 12}
            onChangeFontSize={(sz) => {
              updateTypo('fontSize', sz);
              onRibbonAction?.({ type: 'set_font_size', size: sz });
            }}
            isBold={doc.typography.isBold || bbtIsBold}
            onToggleBold={() => {
              const nb = !(doc.typography.isBold || bbtIsBold);
              updateTypo('isBold', nb);
              onRibbonAction?.({ type: 'set_bold', bold: nb });
            }}
            isItalic={doc.typography.isItalic}
            onToggleItalic={() => {
              const ni = !doc.typography.isItalic;
              updateTypo('isItalic', ni);
              onRibbonAction?.({ type: 'set_italic', italic: ni });
            }}
            showGrid={doc.graph2D.showGrid}
            onToggleGrid={() => {
              onRibbonAction?.({ type: 'toggle_grid' });
              onUpdateDoc(p => ({ ...p, graph2D: { ...p.graph2D, showGrid: !p.graph2D.showGrid } }));
            }}
            gridLabel="Lưới Oxy"
            groupTitle={graphSubTab === 'number_line' ? 'Định dạng trục số' : 'Định dạng đồ thị'}
            extraControls={graphSubTab === 'number_line' ? (
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'nl_toggle_mode' })}
                className="h-[26px] px-2 rounded-[3px] text-xs border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold transition cursor-pointer flex items-center gap-1"
                title="Đổi giữa Trục số đơn và Phép toán tập hợp (Giao, Hợp, Hiệu)"
              >
                <span>🔀 Giao / Hợp / Hiệu</span>
              </button>
            ) : null}
          />

          {/* Nhóm 4 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 3: BẢNG BIẾN THIÊN (BBT & XÉT DẤU)
          ========================================================================= */}
      {activeTab === 'bbt' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1 – Chế độ BBT */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_bbt_mode', mode: 'auto' })}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  bbtMasterMode === 'auto' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <Sparkles size={20} className="mb-1 text-teal-600" />
                <span className="text-[11px] leading-tight">BBT Tự động</span>
                <span className="text-[9px] text-[#605E5C]">Khảo sát từ f(x)</span>
              </button>

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_bbt_mode', mode: 'variation' })}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  bbtMasterMode === 'variation' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <TableIcon size={20} className="mb-1 text-[#0F6CBD]" />
                <span className="text-[11px] leading-tight">BBT Tùy biến</span>
                <span className="text-[9px] text-[#605E5C]">Thêm cột/dòng tự do</span>
              </button>

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'switch_bbt_mode', mode: 'sign_chart' })}
                className={`h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  bbtMasterMode === 'sign_chart' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <CheckSquare size={20} className="mb-1 text-amber-600" />
                <span className="text-[11px] leading-tight">Xét dấu</span>
                <span className="text-[9px] text-[#605E5C]">Tam thức bậc 2</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Chế độ BBT
            </div>
          </div>

          {/* Nhóm 2 – Định dạng bảng */}
          <MathFormattingGroup
            fontFamily={doc.typography.fontFamily}
            onSelectFont={(f) => {
              updateTypo('fontFamily', f === 'latex' ? 'LaTeX KaTeX' : 'Times New Roman');
              onRibbonAction?.({ type: 'set_font', font: f });
            }}
            fontSize={doc.typography.fontSize || 12}
            onChangeFontSize={(sz) => {
              updateTypo('fontSize', sz);
              onRibbonAction?.({ type: 'set_font_size', size: sz });
            }}
            isBold={doc.typography.isBold || bbtIsBold}
            onToggleBold={() => {
              const nb = !(doc.typography.isBold || bbtIsBold);
              updateTypo('isBold', nb);
              onRibbonAction?.({ type: 'set_bold', bold: nb });
            }}
            isItalic={doc.typography.isItalic}
            onToggleItalic={() => {
              const ni = !doc.typography.isItalic;
              updateTypo('isItalic', ni);
              onRibbonAction?.({ type: 'set_italic', italic: ni });
            }}
            groupTitle="Định dạng đồ thị"
            extraControls={
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'set_stroke', stroke: bbtStroke === 1.5 ? 2.5 : 1.5 })}
                className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                title="Độ dày nét kẻ bảng"
              >
                <span>Nét: {bbtStroke}pt</span>
              </button>
            }
          />

          {/* Nhóm 4 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 4: HÌNH PHẲNG & LƯỢNG GIÁC
          ========================================================================= */}
      {activeTab === 'plane_trig' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1 – Công cụ dựng hình GSP */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1 flex-1">
              {[
                { id: 'select', label: 'Chọn', icon: Sliders },
                { id: 'point', label: 'Điểm', icon: CircleDot },
                { id: 'point_on_segment', label: 'Điểm cạnh', icon: Dot },
                { id: 'segment', label: 'Đoạn', icon: Minus },
                { id: 'parallel', label: 'Song song', icon: Equal },
                { id: 'intersection', label: 'Giao điểm', icon: X },
                { id: 'vector', label: 'Vectơ', icon: ArrowRight },
                { id: 'circle', label: 'Đường tròn', icon: Circle },
                { id: 'ellipse', label: 'Elip', icon: Circle },
                { id: 'right_angle', label: 'Góc vuông', icon: CornerDownRight },
                { id: 'text', label: 'Nhãn', icon: Type },
                { id: 'eraser', label: 'Tẩy', icon: Eraser },
              ].map(t => {
                const IconComp = t.icon;
                const isActive = gspActiveTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_select_tool', tool: t.id })}
                    className={`h-[64px] min-w-[42px] px-1.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                      isActive ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                    }`}
                    title={t.label}
                  >
                    <IconComp size={18} className={`mb-1 ${isActive ? 'text-[#0F6CBD]' : 'text-slate-600'}`} />
                    <span className="text-[10px] leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Công cụ dựng hình GSP
            </div>
          </div>

          {/* Nhóm 2 – Kho mẫu hình học */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <AccessibleDropdown
                label="Kho mẫu SGK"
                icon={Compass}
                variant="large"
                menuWidth="w-72"
                ariaLabel="Kho mẫu hình học"
                items={[
                  { id: 'sample_number_line', label: 'Trục số & Tập hợp (Khoảng, Đoạn, Giao/Hợp)', subLabel: 'Toán 10 GDPT 2018', onClick: () => onRibbonAction?.({ type: 'switch_to_number_line' }) },
                  { id: 'div_nl', label: '', divider: true, onClick: () => {} },
                  { id: 'tri_vuong', label: 'Tam giác vuông (Đường cao AH)', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'tam_giac_vuong' }) },
                  { id: 'tri_deu', label: 'Tam giác đều', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'tam_giac_deu' }) },
                  { id: 'hbh', label: 'Hình bình hành ABCD', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'hinh_binh_hanh' }) },
                  { id: 'hthang', label: 'Hình thang vuông', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'hinh_thang_vuong' }) },
                  { id: 'div1', label: '', divider: true, onClick: () => {} },
                  { id: 'cone', label: 'Hình nón (đáy elip đứt-liền)', subLabel: 'Toán 12 GDPT 2018', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'cone' }) },
                  { id: 'cylinder', label: 'Hình trụ (2 đáy elip)', subLabel: 'Toán 12 GDPT 2018', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'cylinder' }) },
                  { id: 'pyr_quad', label: 'Chóp tứ giác đều S.ABCD', subLabel: 'SO ⊥ đáy', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'pyramid_regular_quad' }) },
                  { id: 'pyr_tri', label: 'Chóp tam giác đều S.ABC', subLabel: 'SG ⊥ đáy', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'pyramid_regular_tri' }) },
                  { id: 'pyr_sa', label: 'Chóp S.ABCD (SA ⊥ đáy)', subLabel: 'Cạnh bên vuông góc', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'chop_sa_vuong_day' }) },
                  { id: 'box', label: 'Hình hộp chữ nhật ABCD.A\'B\'C\'D\'', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'box_abcd' }) },
                  { id: 'sphere', label: 'Mặt cầu (bán kính R & elip)', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'hinh_cau' }) },
                  { id: 'div_oxyz', label: '', divider: true, onClick: () => {} },
                  { id: 'oxyz_balloons', label: '🎈 Oxyz: 2 Khinh khí cầu (A, B, E, F)', subLabel: 'Bài toán thực tế Toán 12', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'oxyz_balloons' }) },
                  { id: 'oxyz_radar', label: '✈️ Oxyz: Trạm Radar & Máy bay', subLabel: 'Bài toán thực tế Toán 12', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'oxyz_radar' }) },
                  { id: 'oxyz_std', label: '🧭 Hệ trục tọa độ Oxyz chuẩn SGK', subLabel: 'Chiếu vuông góc lên (Oxy)', onClick: () => onRibbonAction?.({ type: 'gsp_load_sample', sample: 'oxyz_standard' }) },
                ]}
              />

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'gsp_open_oxyz_modal', tab: 'oxyz' })}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EFF6FC] hover:border-[#0F6CBD]/30 transition cursor-pointer text-center"
                title="Mở trình dựng Hệ trục tọa độ Oxyz & Bài toán thực tế"
              >
                <Box size={20} className="mb-1 text-[#0F6CBD]" />
                <span className="text-[10px] leading-tight font-semibold text-[#0F6CBD]">Dựng Oxyz</span>
              </button>

              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'gsp_open_oxyz_modal', tab: 'stickers' })}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-pink-50 hover:border-pink-200 transition cursor-pointer text-center"
                title="Kho Sticker thực tế (Khinh khí cầu, Máy bay, Radar...) / Tải ảnh / AI SVG"
              >
                <ImageIcon size={20} className="mb-1 text-pink-600" />
                <span className="text-[10px] leading-tight font-semibold text-pink-700">Sticker/Ảnh</span>
              </button>

              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_toggle_grid' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Bật/Tắt lưới tọa độ"
                  >
                    <Grid size={13} />
                    <span>Lưới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_toggle_point_mode' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Hiện / Ẩn chấm tròn điểm"
                  >
                    <Eye size={13} />
                    <span>Điểm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_toggle_hide' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Ẩn / Hiện đối tượng đang chọn (Ctrl+H)"
                  >
                    <EyeOff size={13} className="text-amber-600" />
                    <span>Ẩn/Hiện</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_set_line_style', style: 'toggle' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Chuyển đổi nét liền và nét đứt (khuất)"
                  >
                    <span className="font-mono font-bold text-[#0F6CBD]">┅/─</span>
                    <span>Đổi nét</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'gsp_show_all' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Hiện lại tất cả đối tượng bị ẩn (Ctrl+Shift+H)"
                  >
                    <Eye size={13} className="text-teal-600" />
                    <span>Hiện hết</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Kho mẫu & Hiển thị
            </div>
          </div>

          {/* Nhóm 3 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 4B: GÓC LƯỢNG GIÁC (TOÁN 11 SGK GDPT 2018)
          ========================================================================= */}
      {activeTab === 'trig_angle' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1: Kho mẫu góc SGK 11 */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <AccessibleDropdown
                label="Mẫu góc SGK 11"
                icon={Compass}
                variant="large"
                menuWidth="w-72"
                ariaLabel="Kho mẫu góc lượng giác SGK 11"
                items={[
                  { id: 't_30', label: 'Góc dương +30° (π/6)', subLabel: 'sin = 1/2, cos = √3/2', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 30 }) },
                  { id: 't_45', label: 'Góc dương +45° (π/4)', subLabel: 'sin = √2/2, cos = √2/2', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 45 }) },
                  { id: 't_60', label: 'Góc dương +60° (π/3)', subLabel: 'sin = √3/2, cos = 1/2', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 60 }) },
                  { id: 't_90', label: 'Góc vuông +90° (π/2)', subLabel: 'sin = 1, cos = 0', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 90 }) },
                  { id: 't_120', label: 'Góc tù +120° (2π/3)', subLabel: 'sin = √3/2, cos = -1/2', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 120 }) },
                  { id: 't_150', label: 'Góc tù +150° (5π/6)', subLabel: 'sin = 1/2, cos = -√3/2', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 150 }) },
                  { id: 't_180', label: 'Góc bẹt +180° (π)', subLabel: 'sin = 0, cos = -1', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 180 }) },
                  { id: 'div_neg', label: '', divider: true, onClick: () => {} },
                  { id: 't_neg30', label: 'Góc âm -30° (-π/6)', subLabel: 'Chiều kim đồng hồ', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: -30 }) },
                  { id: 't_neg60', label: 'Góc âm -60° (-π/3)', subLabel: 'Chiều kim đồng hồ', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: -60 }) },
                  { id: 't_neg120', label: 'Góc âm -120° (-2π/3)', subLabel: 'Chiều kim đồng hồ', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: -120 }) },
                  { id: 'div_spiral', label: '', divider: true, onClick: () => {} },
                  { id: 't_420', label: 'Góc xoắn ốc +420° (360° + 60°)', subLabel: 'Bài 1 SGK Toán 11', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 420 }) },
                  { id: 't_750', label: 'Góc xoắn ốc +750° (2×360° + 30°)', subLabel: 'Bài 1 SGK Toán 11', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: 750 }) },
                  { id: 't_neg750', label: 'Góc xoắn ốc -750° (-2×360° - 30°)', subLabel: 'Bài 1 SGK Toán 11', onClick: () => onRibbonAction?.({ type: 'trig_set_angle', angle: -750 }) },
                ]}
              />

              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'trig_set_mode', mode: 'unit_circle' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Đường tròn lượng giác Oxy"
                  >
                    <Compass size={13} className="text-[#0F6CBD]" />
                    <span>Đường tròn Oxy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'trig_set_mode', mode: 'general_ray' })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Góc lượng giác tia (Ou, Ov)"
                  >
                    <ArrowRight size={13} className="text-rose-600" />
                    <span>Tia (Ou, Ov)</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'trig_step_angle', delta: 15 })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Tăng góc 15 độ (+15°)"
                  >
                    <Plus size={12} />
                    <span>+15°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'trig_step_angle', delta: -15 })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                    title="Giảm góc 15 độ (-15°)"
                  >
                    <Minus size={12} />
                    <span>-15°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRibbonAction?.({ type: 'trig_step_angle', delta: 360 })}
                    className="h-[26px] px-2 rounded-[3px] text-xs border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium transition cursor-pointer flex items-center gap-1"
                    title="Thêm 1 vòng xoắn ốc (+360°)"
                  >
                    <span>+1 vòng</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Mẫu góc & Xoay góc
            </div>
          </div>

          {/* Nhóm 2 – Các trục & Hình chiếu */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'trig_toggle_projections' })}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EDEBE9] transition cursor-pointer text-center"
                title="Bật/Tắt hình chiếu vuông góc lên Ox (cos) và Oy (sin)"
              >
                <Sliders size={18} className="mb-1 text-emerald-600" />
                <span className="text-[10px] leading-tight">Chiếu sin/cos</span>
              </button>
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'trig_toggle_tan' })}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EDEBE9] transition cursor-pointer text-center"
                title="Bật/Tắt trục tiếp tuyến Tang t'At"
              >
                <span className="text-xs font-bold text-amber-600 mb-1">t'At</span>
                <span className="text-[10px] leading-tight">Trục Tang</span>
              </button>
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'trig_toggle_cot' })}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EDEBE9] transition cursor-pointer text-center"
                title="Bật/Tắt trục tiếp tuyến Cotang s'Bs"
              >
                <span className="text-xs font-bold text-purple-600 mb-1">s'Bs</span>
                <span className="text-[10px] leading-tight">Trục Cotang</span>
              </button>
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'trig_reset_text' })}
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EDEBE9] transition cursor-pointer text-center"
                title="Đặt lại vị trí ban đầu của tất cả các chữ"
              >
                <RotateCcw size={16} className="mb-1 text-slate-600" />
                <span className="text-[10px] leading-tight font-medium">Đặt lại chữ</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Trục & Hình chiếu
            </div>
          </div>

          {/* Nhóm 3 – Định dạng đồ thị (Chuẩn thống nhất toàn hệ thống) */}
          <MathFormattingGroup
            fontFamily={doc.typography.fontFamily}
            onSelectFont={(f) => {
              updateTypo('fontFamily', f === 'latex' ? 'LaTeX KaTeX' : 'Times New Roman');
              onRibbonAction?.({ type: 'trig_set_font', font: f });
              onRibbonAction?.({ type: 'set_font', font: f });
            }}
            fontSize={doc.typography.fontSize || 12}
            onChangeFontSize={(sz) => {
              updateTypo('fontSize', sz);
              onRibbonAction?.({ type: 'trig_set_font_scale', scale: sz / 12, size: sz });
              onRibbonAction?.({ type: 'set_font_size', size: sz });
            }}
            isBold={doc.typography.isBold}
            onToggleBold={() => {
              const nb = !doc.typography.isBold;
              updateTypo('isBold', nb);
              onRibbonAction?.({ type: 'trig_toggle_bold', bold: nb });
              onRibbonAction?.({ type: 'set_bold', bold: nb });
            }}
            isItalic={doc.typography.isItalic}
            onToggleItalic={() => {
              const ni = !doc.typography.isItalic;
              updateTypo('isItalic', ni);
              onRibbonAction?.({ type: 'trig_toggle_italic', italic: ni });
              onRibbonAction?.({ type: 'set_italic', italic: ni });
            }}
            showGrid={doc.graph2D.showGrid}
            onToggleGrid={() => {
              onRibbonAction?.({ type: 'trig_toggle_grid' });
              onRibbonAction?.({ type: 'toggle_grid' });
            }}
            gridLabel="Lưới Oxy"
            groupTitle="Định dạng đồ thị"
          />

          {/* Nhóm 3 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 5: THỐNG KÊ & XÁC SUẤT (L10 – L11 – L12)
          ========================================================================= */}
      {activeTab === 'stats_prob' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          {/* Nhóm 1 – Chế độ Thống kê */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSetStatsTool?.('statistics')}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  statsTool === 'statistics' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <BarChart2 size={20} className="mb-1 text-teal-600" />
                <span className="text-[11px] leading-tight">Thống kê THPT</span>
                <span className="text-[9px] text-[#605E5C]">Box-plot, Histogram</span>
              </button>

              <button
                type="button"
                onClick={() => onSetStatsTool?.('tree')}
                className={`h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  statsTool === 'tree' ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD] font-bold' : 'border-transparent hover:bg-[#EDEBE9] text-[#242424]'
                }`}
              >
                <GitFork size={20} className="mb-1 text-[#0F6CBD]" />
                <span className="text-[11px] leading-tight">Cây Xác suất</span>
                <span className="text-[9px] text-[#605E5C]">Định lý Bayes (L12)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetStatsTool?.('statistics');
                  onRibbonAction?.({ type: 'select_stat_chart', chart: 'venn' });
                }}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <PieChart size={20} className="mb-1 text-amber-600" />
                <span className="text-[11px] leading-tight">Biểu đồ Ven</span>
                <span className="text-[9px] text-[#605E5C]">Tập hợp & Giao/Hợp</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Chế độ Thống kê
            </div>
          </div>

          {/* Nhóm 2 – Tạo nhanh mẫu */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <AccessibleDropdown
                label="Mẫu Thống kê chuẩn"
                icon={BarChart2}
                variant="large"
                menuWidth="w-72"
                ariaLabel="Menu mẫu Thống kê và Xác suất"
                items={[
                  { id: 'boxplot', label: 'Biểu đồ hộp (Box-plot) L10 & L12', subLabel: 'Min, Q1, Q2, Q3, Max', onClick: () => { onSetStatsTool?.('statistics'); onRibbonAction?.({ type: 'select_stat_chart', chart: 'boxplot' }); } },
                  { id: 'histogram', label: 'Biểu đồ tần số ghép nhóm (Histogram)', subLabel: 'Các cột chữ nhật liền kề chuẩn SGK', onClick: () => { onSetStatsTool?.('statistics'); onRibbonAction?.({ type: 'select_stat_chart', chart: 'histogram' }); } },
                  { id: 'tree_bayes', label: 'Sơ đồ cây Bayes (Toán 12)', subLabel: 'Xác suất toàn phần & Bayes', onClick: () => { onSetStatsTool?.('tree'); onRibbonAction?.({ type: 'tree_select_type', structure: 'bayes' }); } },
                  { id: 'tree_bernoulli', label: 'Phép thử Bernoulli & Lặp', subLabel: 'Thành công p, Thất bại 1-p', onClick: () => { onSetStatsTool?.('tree'); onRibbonAction?.({ type: 'tree_select_type', structure: 'bernoulli' }); } },
                ]}
              />
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Tạo nhanh mẫu
            </div>
          </div>

          {/* Nhóm 3 – Định dạng biểu đồ (Thống nhất toàn hệ thống) */}
          <MathFormattingGroup
            fontFamily={doc.typography.fontFamily}
            onSelectFont={(f) => {
              updateTypo('fontFamily', f === 'latex' ? 'LaTeX KaTeX' : 'Times New Roman');
              onRibbonAction?.({ type: 'set_font', font: f });
            }}
            fontSize={doc.typography.fontSize || 12}
            onChangeFontSize={(sz) => {
              updateTypo('fontSize', sz);
              onRibbonAction?.({ type: 'set_font_size', size: sz });
            }}
            isBold={doc.typography.isBold || bbtIsBold}
            onToggleBold={() => {
              const nb = !(doc.typography.isBold || bbtIsBold);
              updateTypo('isBold', nb);
              onRibbonAction?.({ type: 'set_bold', bold: nb });
            }}
            isItalic={doc.typography.isItalic}
            onToggleItalic={() => {
              const ni = !doc.typography.isItalic;
              updateTypo('isItalic', ni);
              onRibbonAction?.({ type: 'set_italic', italic: ni });
            }}
            groupTitle="Định dạng đồ thị"
            extraControls={
              <button
                type="button"
                onClick={() => onRibbonAction?.({ type: 'set_stroke', stroke: bbtStroke === 1.5 ? 2.5 : 1.5 })}
                className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                title="Độ dày đường nét biểu đồ"
              >
                <span>Nét: {bbtStroke || 1.5}pt</span>
              </button>
            }
          />

          {/* Nhóm 4 – Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}

      {/* =========================================================================
          CONTEXTUAL TAB: ĐỊNH DẠNG ĐỐI TƯỢNG (Chỉ hiện khi chọn đối tượng)
          ========================================================================= */}
      {activeTab === 'format' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] w-full">
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onUpdateDoc(p => ({ ...p, typography: { ...p.typography, isBold: !p.typography.isBold } }))}
                className="h-[64px] px-3 flex flex-col items-center justify-center rounded-[4px] border border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] cursor-pointer"
              >
                <Bold size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-xs font-medium">In đậm nhãn</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateDoc(p => ({ ...p, typography: { ...p.typography, isItalic: !p.typography.isItalic } }))}
                className="h-[64px] px-3 flex flex-col items-center justify-center rounded-[4px] border border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] cursor-pointer"
              >
                <Italic size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-xs font-medium">In nghiêng x, y</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Định dạng đối tượng đang chọn
            </div>
          </div>

          {/* Xuất sang Word */}
          <ExportGroup
            onCopyWord={onCopyWord}
            onDownloadPng={onDownloadPng}
            onDownloadSvg={onDownloadSvg}
          />
        </div>
      )}
    </div>
  );
}
