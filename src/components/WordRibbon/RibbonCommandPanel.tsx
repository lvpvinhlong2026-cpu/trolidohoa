/**
 * @license
 * RibbonCommandPanel.tsx
 * Tầng 2: Thanh công cụ Ribbon Command Panel (~96px, nền #FFFFFF, viền #E1DFDD)
 * Chứa đầy đủ các nhóm chức năng cho 7 Tab chính + 1 Contextual Tab
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
  RotateCw,
  Plus,
  Minus,
  Crop,
  Table as TableIcon
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
  onOpenAiModal: () => void;
  onSelectTemplate: (category: string, presetKey: string) => void;
  onRibbonAction?: (action: { type: string; [key: string]: any }) => void;
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
  onOpenAiModal,
  onSelectTemplate,
  onRibbonAction,
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
          TAB 2: TRANG CHỦ (HOME - TAB MẶC ĐỊNH)
          ========================================================================= */}
      {activeTab === 'home' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          
          {/* Nhóm 1 – Thao tác (Clipboard) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[130px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={onOpenAiModal}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] dark:hover:bg-slate-800 text-[#0F6CBD] font-semibold transition cursor-pointer"
                title="Dán đề bài toán để AI tự động nhận diện và dựng hình"
              >
                <Sparkles size={24} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-bold">Dán đề (AI)</span>
              </button>

              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onUndo}
                    className="p-1 rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200 transition cursor-pointer"
                    title="Hoàn tác (Ctrl + Z)"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    className="p-1 rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200 transition cursor-pointer"
                    title="Làm lại (Ctrl + Y)"
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="p-1 rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200 transition cursor-pointer"
                    title="Nhân bản đối tượng đã chọn"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="p-1 rounded-[4px] border border-transparent hover:border-rose-300 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title="Xóa đối tượng đang chọn"
                  >
                    <Trash2 size={15} />
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
              {/* Hàng 1: Font & Cỡ chữ */}
              <div className="flex items-center gap-1.5">
                <select
                  value={doc.typography.fontFamily}
                  onChange={(e) => updateTypo('fontFamily', e.target.value)}
                  className="h-[24px] px-2 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[130px]"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Cambria Math">Cambria Math</option>
                  <option value="Computer Modern">Computer Modern</option>
                  <option value="Arial">Arial</option>
                </select>

                <select
                  value={doc.typography.fontSize}
                  onChange={(e) => updateTypo('fontSize', Number(e.target.value))}
                  className="h-[24px] px-1 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[55px]"
                >
                  {[13, 14, 15, 16, 18, 20, 22, 26].map(s => (
                    <option key={s} value={s}>{s} pt</option>
                  ))}
                </select>
              </div>

              {/* Hàng 2: B, I, Sub, Super, Màu */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateTypo('isBold', !doc.typography.isBold)}
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
                  className={`p-1 rounded-[3px] border transition cursor-pointer ${
                    doc.typography.isSubscript
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
                  }`}
                  title="Chỉ số dưới (x₁)"
                >
                  <Subscript size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => updateTypo('isSuperscript', !doc.typography.isSuperscript)}
                  className={`p-1 rounded-[3px] border transition cursor-pointer ${
                    doc.typography.isSuperscript
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-transparent hover:bg-[#EDEBE9] text-[#242424] dark:text-slate-200'
                  }`}
                  title="Chỉ số trên (x²)"
                >
                  <Superscript size={14} />
                </button>
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#E1DFDD] dark:border-slate-700">
                  <input
                    type="color"
                    value={doc.typography.color}
                    onChange={(e) => updateTypo('color', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                    title="Màu chữ / ký hiệu"
                  />
                </div>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Kiểu chữ & Nhãn
            </div>
          </div>

          {/* Nhóm 3 – Nét vẽ (Stroke & Fill) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              {/* Hàng 1: Độ dày nét & Kiểu nét */}
              <div className="flex items-center gap-1.5">
                <select
                  value={doc.strokeFill.strokeWidth}
                  onChange={(e) => updateStrokeFill('strokeWidth', Number(e.target.value))}
                  className="h-[24px] px-1.5 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[90px]"
                >
                  <option value={0.75}>Nét 0.75pt</option>
                  <option value={1}>Nét 1.0pt</option>
                  <option value={1.5}>Nét 1.5pt</option>
                  <option value={2}>Nét 2.0pt</option>
                </select>

                <select
                  value={doc.strokeFill.strokeStyle}
                  onChange={(e) => updateStrokeFill('strokeStyle', e.target.value)}
                  className="h-[24px] px-1.5 text-xs border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800 text-[#242424] dark:text-slate-100 outline-none w-[95px]"
                >
                  <option value="solid">― Nét liền</option>
                  <option value="dashed">- - Nét đứt</option>
                </select>
              </div>

              {/* Hàng 2: Màu nét & Tô nền / Gạch sọc */}
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
                  <span>Tô/Gạch:</span>
                  <select
                    value={doc.strokeFill.hatching}
                    onChange={(e) => updateStrokeFill('hatching', e.target.value)}
                    className="h-[22px] px-1 text-[11px] border border-[#E1DFDD] dark:border-slate-700 rounded-[3px] bg-white dark:bg-slate-800"
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

          {/* Nhóm 4 – Xuất sang Word (Export) */}
          <div className="flex flex-col justify-between px-2 min-w-[240px]">
            <div className="flex items-center gap-2 flex-1">
              {/* Nút Cắt nhanh - Kéo dán Word (Chuẩn ảnh đính kèm của Thầy/Cô) */}
              <button
                type="button"
                onClick={onCopyWord}
                className="h-[64px] min-w-[66px] px-2.5 flex flex-col items-center justify-center rounded-[8px] bg-[#FFFBEB] hover:bg-[#FEF3C7] active:bg-[#FDE68A] border border-[#F59E0B] text-[#92400E] font-semibold transition cursor-pointer shadow-xs select-none"
                title="Cắt nhanh ảnh với lề chuẩn 24px, độ phân giải 300 DPI và tự động lưu vào Clipboard để dán vào Word (Ctrl + V)"
              >
                <Crop size={22} className="mb-0.5 text-[#D97706]" />
                <span className="text-xs font-bold leading-tight text-[#78350F]">Cắt nhanh</span>
                <span className="text-[10px] text-[#B45309] font-medium leading-tight">Kéo dán Word</span>
              </button>

              <button
                type="button"
                onClick={onCopyWord}
                className="h-[64px] px-3 flex flex-col items-center justify-center rounded-[4px] bg-[#0F6CBD] hover:bg-[#115EA3] active:bg-[#0C5494] text-white font-semibold transition cursor-pointer shadow-xs select-none"
                title="Tự động căn lề 24px đều 4 cạnh, xuất 300 DPI và sao chép vào Clipboard (Ctrl + V vào Word)"
              >
                <Copy size={20} className="mb-1" />
                <span className="text-xs font-bold leading-tight">Copy vào Word</span>
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
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Xuất sang Word
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ĐỒ THỊ 2D (GIẢI TÍCH 10 – 11 – 12)
          ========================================================================= */}
      {activeTab === 'graph_2d' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          {/* Nhóm 1 – Hàm số mẫu */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <AccessibleDropdown
                label="Hàm số mẫu"
                icon={TrendingUp}
                variant="large"
                menuWidth="w-72"
                ariaLabel="Chọn hàm số mẫu SGK"
                items={[
                  { id: 'parabola', label: 'Parabol (Lớp 10)', subLabel: 'y = ax² + bx + c', onClick: () => onSelectTemplate('graph_2d', 'parabola') },
                  { id: 'trig', label: 'Lượng giác sin / cos / tan (Lớp 11)', subLabel: 'Chu kỳ, tiệm cận', onClick: () => onSelectTemplate('graph_2d', 'trig_sin') },
                  { id: 'exp_log', label: 'Mũ & Lôgarit (Lớp 11)', subLabel: 'y = aˣ, y = logₐx', onClick: () => onSelectTemplate('graph_2d', 'exp_log') },
                  { id: 'cubic', label: 'Bậc 3: 2 Cực trị (Lớp 12)', subLabel: 'y = ax³ + bx² + cx + d', onClick: () => onSelectTemplate('graph_2d', 'cubic') },
                  { id: 'rat_1_1', label: 'Phân thức bậc 1/1 (Lớp 12)', subLabel: 'y = (ax+b)/(cx+d)', onClick: () => onSelectTemplate('graph_2d', 'rational_1_1') },
                  { id: 'rat_2_1', label: 'Phân thức bậc 2/1 (Lớp 12)', subLabel: 'Tiệm cận xiên & đứng', onClick: () => onSelectTemplate('graph_2d', 'rational_2_1') },
                  { id: 'derivative', label: 'Hàm đạo hàm f\'(x) & Gián đoạn', subLabel: 'Xét dấu & nghiệm f\'(x)', onClick: () => onSelectTemplate('graph_2d', 'derivative') },
                ]}
              />
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Hàm số mẫu
            </div>
          </div>

          {/* Nhóm 2 – Yếu tố đồ thị */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[220px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, graph2D: { ...p.graph2D, showAsymptotes: !p.graph2D.showAsymptotes } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer flex items-center gap-1 ${
                    doc.graph2D.showAsymptotes ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Tiệm cận (Nét đứt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, graph2D: { ...p.graph2D, showTangent: !p.graph2D.showTangent } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer flex items-center gap-1 ${
                    doc.graph2D.showTangent ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Tiếp tuyến tại M₀</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, graph2D: { ...p.graph2D, showExtrema: !p.graph2D.showExtrema } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer flex items-center gap-1 ${
                    doc.graph2D.showExtrema ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Điểm Cực trị / Uốn</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, graph2D: { ...p.graph2D, gridType: p.graph2D.gridType === 'decimal' ? 'pi' : 'decimal' } }))}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Grid size={13} />
                  <span>{doc.graph2D.gridType === 'decimal' ? 'Trục Oxy (Số)' : 'Trục Oxy (π)'}</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Yếu tố đồ thị
            </div>
          </div>

          {/* Nhóm 3 – Miền & Conic */}
          <div className="flex flex-col justify-between px-2 min-w-[200px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSelectTemplate('graph_2d', 'inequality_region')}
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Sliders size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Miền nghiệm BPT</span>
                <span className="text-[9px] text-[#605E5C]">Gạch bỏ phần loại</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate('graph_2d', 'integral_area')}
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <TableIcon size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Diện tích Tích phân</span>
                <span className="text-[9px] text-[#605E5C]">Tô gạch sọc ∫</span>
              </button>

              <AccessibleDropdown
                label="Đường Conic"
                variant="large"
                ariaLabel="Menu Conic"
                items={[
                  { id: 'elip', label: 'Elip (Tiêu điểm F₁, F₂)', onClick: () => onSelectTemplate('graph_2d', 'conic_ellipse') },
                  { id: 'hypebol', label: 'Hypebol (Tiệm cận xiên)', onClick: () => onSelectTemplate('graph_2d', 'conic_hyperbola') },
                  { id: 'parabol_conic', label: 'Parabol (Đường chuẩn Δ)', onClick: () => onSelectTemplate('graph_2d', 'conic_parabola') },
                ]}
              />
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Miền & Conic
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BẢNG BIẾN THIÊN (BBT & XÉT DẤU)
          ========================================================================= */}
      {activeTab === 'bbt' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          {/* Nhóm 1 – Tạo nhanh */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <AccessibleDropdown
                label="Tạo nhanh BBT"
                icon={TableIcon}
                variant="large"
                menuWidth="w-68"
                ariaLabel="Chọn mẫu bảng biến thiên"
                items={[
                  { id: 'quad_sign', label: 'Bảng xét dấu tam thức bậc 2', subLabel: 'Trong trái - ngoài cùng', onClick: () => onSelectTemplate('bbt', 'quadratic_sign') },
                  { id: 'cubic_bbt', label: 'BBT hàm bậc 3 (2 cực trị)', subLabel: 'Nét cong lên xuống', onClick: () => onSelectTemplate('bbt', 'cubic') },
                  { id: 'rat_11_bbt', label: 'BBT phân thức bậc 1/1', subLabel: 'Hai gạch song song ||', onClick: () => onSelectTemplate('bbt', 'rational_1_1') },
                  { id: 'rat_21_bbt', label: 'BBT phân thức bậc 2/1', subLabel: 'Tiệm cận xiên', onClick: () => onSelectTemplate('bbt', 'rational_2_1') },
                  { id: 'custom_bbt', label: 'Bảng biến thiên trống tùy biến', subLabel: 'Tự thêm cột nghiệm', onClick: () => onSelectTemplate('bbt', 'custom') },
                ]}
              />
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Tạo nhanh
            </div>
          </div>

          {/* Nhóm 2 – Cấu trúc bảng */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} className="text-[#0F6CBD]" />
                  <span>Thêm cột nghiệm</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Minus size={13} className="text-rose-500" />
                  <span>Xóa cột</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, bbt: { ...p.bbt, hasDoubleBar: !p.bbt.hasDoubleBar } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer flex items-center gap-1 ${
                    doc.bbt.hasDoubleBar ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Chèn hai gạch ||</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Đổi dấu + / - / 0</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Cấu trúc bảng
            </div>
          </div>

          {/* Nhóm 3 – Mũi tên & Ký hiệu */}
          <div className="flex flex-col justify-between px-2 min-w-[190px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => {}}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <ArrowUp size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Mũi tên biến thiên</span>
                <span className="text-[9px] text-[#605E5C]">Chuẩn SGK GDPT</span>
              </button>

              <div className="flex flex-col gap-1 justify-center">
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Chèn -∞ / +∞</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Giá trị Cực trị</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Mũi tên & Ký hiệu
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: HÌNH PHẲNG & LƯỢNG GIÁC
          ========================================================================= */}
      {activeTab === 'plane_trig' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          {/* Nhóm 1 – Tập hợp (L10) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[140px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSelectTemplate('plane_trig', 'number_line')}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Minus size={22} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Trục số ( [ ) ]</span>
                <span className="text-[9px] text-[#605E5C]">Tự động gạch sọc</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Tập hợp (L10)
            </div>
          </div>

          {/* Nhóm 2 – Lượng giác (L10 – L11) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[170px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSelectTemplate('plane_trig', 'unit_circle_half')}
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Compass size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Nửa đường tròn</span>
                <span className="text-[9px] text-[#605E5C]">0° đến 180° (L10)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate('plane_trig', 'trig_circle_full')}
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Compass size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Đường tròn LG</span>
                <span className="text-[9px] text-[#605E5C]">Trục sin, cos, tan</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Lượng giác (L10 – L11)
            </div>
          </div>

          {/* Nhóm 3 – Hình học phẳng & Vectơ */}
          <div className="flex flex-col justify-between px-2 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <AccessibleDropdown
                label="Hình cơ bản"
                icon={Compass}
                variant="large"
                ariaLabel="Menu Hình học phẳng"
                items={[
                  { id: 'tri_general', label: 'Tam giác thường ABC', onClick: () => onSelectTemplate('plane_trig', 'triangle_general') },
                  { id: 'tri_right', label: 'Tam giác vuông (Đường cao AH)', onClick: () => onSelectTemplate('plane_trig', 'triangle_right') },
                  { id: 'tri_equi', label: 'Tam giác đều', onClick: () => onSelectTemplate('plane_trig', 'triangle_equi') },
                  { id: 'incirc', label: 'Đường tròn nội / ngoại tiếp', onClick: () => onSelectTemplate('plane_trig', 'circle_incirc') },
                  { id: 'quad', label: 'Tứ giác / Hình bình hành', onClick: () => onSelectTemplate('plane_trig', 'quadrilateral') },
                ]}
              />

              <button
                type="button"
                onClick={() => onSelectTemplate('plane_trig', 'vector')}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <ArrowUp size={20} className="text-[#0F6CBD] mb-1 rotate-45" />
                <span className="text-[11px] font-medium leading-tight">Vectơ & Tổng</span>
                <span className="text-[9px] text-[#605E5C]">Góc hai vectơ</span>
              </button>

              <div className="flex flex-col gap-1 justify-center">
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Ký hiệu góc vuông ∟</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Đánh dấu bằng nhau ||</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Hình học phẳng & Vectơ
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: KHÔNG GIAN 3D & OXYZ (L11 – L12)
          ========================================================================= */}
      {activeTab === 'space_3d' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          {/* Nhóm 1 – Khối cơ bản */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <AccessibleDropdown
                label="Khối hình 3D"
                icon={Box}
                variant="large"
                menuWidth="w-72"
                ariaLabel="Menu khối hình 3D"
                items={[
                  { id: 'pyr_quad', label: 'Chóp tứ giác đều S.ABCD', subLabel: 'SO ⊥ đáy', onClick: () => onSelectTemplate('space_3d', 'pyramid_quad') },
                  { id: 'pyr_tri', label: 'Chóp tam giác đều S.ABC', subLabel: 'SG ⊥ đáy', onClick: () => onSelectTemplate('space_3d', 'pyramid_tri') },
                  { id: 'pyr_sa', label: 'Chóp S.ABCD có SA ⊥ đáy', subLabel: 'Góc vuông tại A', onClick: () => onSelectTemplate('space_3d', 'pyramid_sa_perp') },
                  { id: 'prism', label: 'Lăng trụ đứng / xiên', subLabel: 'ABC.A\'B\'C\'', onClick: () => onSelectTemplate('space_3d', 'prism') },
                  { id: 'box_cube', label: 'Hình hộp chữ nhật / Lập phương', subLabel: 'ABCD.A\'B\'C\'D\'', onClick: () => onSelectTemplate('space_3d', 'box') },
                  { id: 'sphere', label: 'Mặt cầu tâm O bán kính R', subLabel: 'Đường xích đạo elip', onClick: () => onSelectTemplate('space_3d', 'sphere') },
                  { id: 'cone_cyl', label: 'Khối tròn xoay (Nón / Trụ)', subLabel: 'Đáy elip đứt liền SGK', onClick: () => onSelectTemplate('space_3d', 'cone') },
                ]}
              />
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Khối cơ bản
            </div>
          </div>

          {/* Nhóm 2 – Hệ trục Oxyz (L12) */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[210px]">
            <div className="flex flex-col justify-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, space3D: { ...p.space3D, showOxyz: !p.space3D.showOxyz } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer ${
                    doc.space3D.showOxyz ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Bật/Tắt Hệ trục Oxyz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, space3D: { ...p.space3D, showProjectionDashed: !p.space3D.showProjectionDashed } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer ${
                    doc.space3D.showProjectionDashed ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Chiếu (x;y;z)</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Mặt phẳng & VTPT n</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Đường thẳng & VTCP u</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Hệ trục Oxyz (L12)
            </div>
          </div>

          {/* Nhóm 3 – Hiển thị 3D & Ký hiệu */}
          <div className="flex flex-col justify-between px-2 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onUpdateDoc(p => ({ ...p, space3D: { ...p.space3D, autoHiddenLines: !p.space3D.autoHiddenLines } }))}
                className={`h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer text-center ${
                  doc.space3D.autoHiddenLines
                    ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                    : 'border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424]'
                }`}
                title="Tự động phân loại nét liền / nét đứt theo góc nhìn camera 3D"
              >
                <RotateCw size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Nét đứt tự động</span>
                <span className="text-[9px] text-[#605E5C]">Theo góc xoay 3D</span>
              </button>

              <div className="flex flex-col gap-1 justify-center">
                <button
                  type="button"
                  onClick={() => {}}
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Góc nhị diện / Cung góc</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDoc(p => ({ ...p, space3D: { ...p.space3D, showSectionPlane: !p.space3D.showSectionPlane } }))}
                  className={`h-[26px] px-2 rounded-[3px] text-xs border font-medium transition cursor-pointer ${
                    doc.space3D.showSectionPlane ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]' : 'border-[#E1DFDD] hover:bg-[#EDEBE9]'
                  }`}
                >
                  <span>Thiết diện (Mặt cắt)</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Hiển thị 3D & Ký hiệu
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: THỐNG KÊ & XÁC SUẤT (L10 – L11 – L12)
          ========================================================================= */}
      {activeTab === 'stats_prob' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px]">
          {/* Nhóm 1 – Sơ đồ Xác suất */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800 min-w-[170px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSelectTemplate('stats_prob', 'venn_2')}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <PieChart size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Biểu đồ Ven</span>
                <span className="text-[9px] text-[#605E5C]">2 - 3 vòng tròn giao</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate('stats_prob', 'bayes_tree')}
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <GitFork size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Cây xác suất</span>
                <span className="text-[9px] text-[#605E5C]">Bayes / Tổ hợp</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Sơ đồ Xác suất
            </div>
          </div>

          {/* Nhóm 2 – Biểu đồ Thống kê */}
          <div className="flex flex-col justify-between px-2 min-w-[210px]">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => onSelectTemplate('stats_prob', 'box_plot')}
                className="h-[64px] px-3 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Sliders size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Biểu đồ hộp (Box-plot)</span>
                <span className="text-[9px] text-[#605E5C]">Q₁, Q₂, Q₃, Ngoại lệ</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate('stats_prob', 'histogram')}
                className="h-[64px] px-3 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <BarChart2 size={20} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium leading-tight">Biểu đồ Tần số</span>
                <span className="text-[9px] text-[#605E5C]">Ghép nhóm GDPT 2018</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Biểu đồ Thống kê
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTEXTUAL TAB: ĐỊNH DẠNG ĐỐI TƯỢNG (HIỆN KHI CHỌN ĐỐI TƯỢNG)
          ========================================================================= */}
      {activeTab === 'format' && (
        <div className="flex items-stretch gap-2 shrink-0 h-[84px] animate-in fade-in">
          {/* Nhóm Căn chỉnh */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Maximize2 size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium">Căn giữa trang</span>
              </button>
              <div className="flex flex-col gap-1 justify-center">
                <button
                  type="button"
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Căn trái</span>
                </button>
                <button
                  type="button"
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Căn phải</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Căn chỉnh
            </div>
          </div>

          {/* Nhóm Thứ tự & Xoay */}
          <div className="flex flex-col justify-between px-2 border-r border-[#E1DFDD] dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                className="h-[64px] px-2 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Layers size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium">Lên trên cùng</span>
              </button>
              <div className="flex flex-col gap-1 justify-center">
                <button
                  type="button"
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Xuống dưới cùng</span>
                </button>
                <button
                  type="button"
                  className="h-[26px] px-2 rounded-[3px] text-xs border border-[#E1DFDD] hover:bg-[#EDEBE9] font-medium transition cursor-pointer"
                >
                  <span>Xoay 90°</span>
                </button>
              </div>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Thứ tự & Xoay
            </div>
          </div>

          {/* Nhóm Khóa & Đổi tên */}
          <div className="flex flex-col justify-between px-2">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <Lock size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium">Khóa vị trí</span>
              </button>
              <button
                type="button"
                className="h-[64px] px-2.5 flex flex-col items-center justify-center rounded-[4px] border border-transparent hover:border-[#E1DFDD] hover:bg-[#EDEBE9] text-[#242424] transition cursor-pointer text-center"
              >
                <CheckSquare size={18} className="text-[#0F6CBD] mb-1" />
                <span className="text-[11px] font-medium">Đổi tên đỉnh</span>
              </button>
            </div>
            <div className="text-[11px] font-normal text-[#605E5C] text-center pb-0.5 mt-auto select-none">
              Quản lý đối tượng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
