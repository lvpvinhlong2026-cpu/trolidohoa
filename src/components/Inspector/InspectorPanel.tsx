/**
 * @license
 * InspectorPanel.tsx
 * Cột bên phải (Collapsible Inspector Panel, rộng 280px):
 * - Nhập nhanh biểu thức hàm số, tọa độ điểm, thông số góc/kích thước
 * - Hiển thị công thức toán học bằng KaTeX
 * - Hỗ trợ thu gọn/mở rộng linh hoạt với nút [ ◀ Thu gọn ] / [ ▶ Thuộc tính ]
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  FunctionSquare, 
  Eye, 
  RotateCw,
  Hash,
  Maximize2
} from 'lucide-react';
import katex from 'katex';
import { ArtboardDocument } from '../../types/mathArtboard';

export interface InspectorPanelProps {
  doc: ArtboardDocument;
  onUpdateDoc: (updater: (prev: ArtboardDocument) => ArtboardDocument) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function InspectorPanel({
  doc,
  onUpdateDoc,
  isOpen,
  onToggleOpen,
}: InspectorPanelProps) {
  // Sinh mã KaTeX cho hàm số hiện tại
  const formulaLatex = useMemo(() => {
    if (doc.category === 'graph_2d') {
      const { type, a, b, c, d } = doc.graph2D;
      if (type === 'parabola') {
        return `y = ${a !== 1 ? a : ''}x^2 ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
      }
      if (type === 'cubic') {
        return `y = ${a !== 1 ? a : ''}x^3 ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x^2 ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}x ${d >= 0 ? '+ ' + d : '- ' + Math.abs(d)}`;
      }
      if (type === 'rational_1_1') {
        return `y = \\frac{${a}x + ${b}}{${c}x + ${d}}`;
      }
      if (type === 'trig_sin') return 'y = \\sin(x)';
      if (type === 'trig_cos') return 'y = \\cos(x)';
      if (type === 'exp_log') return 'y = \\ln(x)';
      return 'y = f(x)';
    }
    if (doc.category === 'bbt') {
      return 'y = ax^3 + bx^2 + cx + d';
    }
    if (doc.category === 'plane_trig') {
      if (doc.planeTrig.type === 'number_line') return 'x \\in [2; 6)';
      return '\\cos^2\\alpha + \\sin^2\\alpha = 1';
    }
    if (doc.category === 'space_3d') {
      return 'S.ABCD, \\; SA \\perp (ABCD)';
    }
    if (doc.category === 'stats_prob') {
      return '\\Delta_Q = Q_3 - Q_1';
    }
    return 'f(x)';
  }, [doc]);

  // Render KaTeX HTML
  const renderedFormulaHtml = useMemo(() => {
    try {
      return katex.renderToString(formulaLatex, { throwOnError: false, displayMode: true });
    } catch {
      return formulaLatex;
    }
  }, [formulaLatex]);

  // Helper cập nhật Graph2D
  const updateGraph2D = (key: string, val: any) => {
    onUpdateDoc(prev => ({
      ...prev,
      graph2D: { ...prev.graph2D, [key]: val }
    }));
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-[28px] h-full bg-white dark:bg-slate-900 border-l border-[#E1DFDD] dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-[#605E5C] hover:text-[#0F6CBD] hover:bg-[#F3F2F1] cursor-pointer transition select-none shrink-0"
        title="Mở bảng Thuộc tính (Inspector Panel)"
      >
        <ChevronLeft size={16} />
        <span className="text-[11px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180">
          THUỘC TÍNH
        </span>
      </button>
    );
  }

  return (
    <aside 
      aria-label="Bảng điều khiển thông số đối tượng"
      className="w-[280px] h-full bg-white dark:bg-slate-900 border-l border-[#E1DFDD] dark:border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto scrollbar-thin shadow-xs"
    >
      {/* Tiêu đề thanh Inspector */}
      <div className="h-[36px] px-3 bg-[#F3F2F1] dark:bg-slate-850 border-b border-[#E1DFDD] dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#242424] dark:text-slate-100">
          <Sliders size={14} className="text-[#0F6CBD]" />
          <span>Thuộc tính đối tượng</span>
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          className="p-1 rounded hover:bg-[#EDEBE9] dark:hover:bg-slate-700 text-[#605E5C] cursor-pointer transition"
          title="Thu gọn bảng thuộc tính"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="p-3 space-y-4 flex-1">
        {/* Khối hiển thị công thức Toán bằng KaTeX */}
        <div className="bg-[#F8F9FA] dark:bg-slate-800 border border-[#E1DFDD] dark:border-slate-700 rounded-[4px] p-2.5 text-center">
          <div className="text-[10px] uppercase font-bold text-[#605E5C] dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
            <FunctionSquare size={12} />
            <span>Biểu thức hiển thị (KaTeX)</span>
          </div>
          <div 
            className="py-1 text-sm font-serif overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: renderedFormulaHtml }}
          />
        </div>

        {/* Cấu hình Đồ thị 2D */}
        {doc.category === 'graph_2d' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#242424] dark:text-slate-200 border-b border-[#E1DFDD] pb-1">
              Hệ số phương trình
            </div>

            {/* Slider hệ số a */}
            <div>
              <div className="flex justify-between text-xs text-[#424242] dark:text-slate-300 mb-0.5">
                <span>Hệ số a:</span>
                <span className="font-mono font-bold text-[#0F6CBD]">{doc.graph2D.a}</span>
              </div>
              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={doc.graph2D.a}
                onChange={(e) => updateGraph2D('a', Number(e.target.value))}
                className="w-full accent-[#0F6CBD] cursor-pointer"
              />
            </div>

            {/* Slider hệ số b */}
            <div>
              <div className="flex justify-between text-xs text-[#424242] dark:text-slate-300 mb-0.5">
                <span>Hệ số b:</span>
                <span className="font-mono font-bold text-[#0F6CBD]">{doc.graph2D.b}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={doc.graph2D.b}
                onChange={(e) => updateGraph2D('b', Number(e.target.value))}
                className="w-full accent-[#0F6CBD] cursor-pointer"
              />
            </div>

            {/* Slider hệ số c */}
            <div>
              <div className="flex justify-between text-xs text-[#424242] dark:text-slate-300 mb-0.5">
                <span>Hệ số c:</span>
                <span className="font-mono font-bold text-[#0F6CBD]">{doc.graph2D.c}</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={doc.graph2D.c}
                onChange={(e) => updateGraph2D('c', Number(e.target.value))}
                className="w-full accent-[#0F6CBD] cursor-pointer"
              />
            </div>

            {/* Bật/Tắt Tiệm cận & Tiếp tuyến */}
            <div className="pt-2 border-t border-[#E1DFDD] space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.graph2D.showAsymptotes}
                  onChange={(e) => updateGraph2D('showAsymptotes', e.target.checked)}
                  className="rounded text-[#0F6CBD] accent-[#0F6CBD]"
                />
                <span>Tiệm cận đứng & ngang (nét đứt)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.graph2D.showTangent}
                  onChange={(e) => updateGraph2D('showTangent', e.target.checked)}
                  className="rounded text-[#0F6CBD] accent-[#0F6CBD]"
                />
                <span>Tiếp tuyến tại điểm M₀</span>
              </label>

              {doc.graph2D.showTangent && (
                <div className="pl-5 pt-1">
                  <div className="flex justify-between text-[11px] text-[#605E5C] mb-0.5">
                    <span>Hoành độ tiếp điểm x₀:</span>
                    <span className="font-mono font-bold">{doc.graph2D.tangentX0}</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.25"
                    value={doc.graph2D.tangentX0}
                    onChange={(e) => updateGraph2D('tangentX0', Number(e.target.value))}
                    className="w-full accent-[#0F6CBD]"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doc.graph2D.showIntegralHatch}
                  onChange={(e) => updateGraph2D('showIntegralHatch', e.target.checked)}
                  className="rounded text-[#0F6CBD] accent-[#0F6CBD]"
                />
                <span>Tô gạch sọc diện tích tích phân</span>
              </label>
            </div>
          </div>
        )}

        {/* Cấu hình Hình phẳng & Lượng giác */}
        {doc.category === 'plane_trig' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#242424] dark:text-slate-200 border-b border-[#E1DFDD] pb-1">
              Thông số hình học & Lượng giác
            </div>
            <div>
              <label className="block text-xs text-[#424242] mb-1">Loại biểu diễn:</label>
              <select
                value={doc.planeTrig.type}
                onChange={(e) => onUpdateDoc(prev => ({
                  ...prev,
                  planeTrig: { ...prev.planeTrig, type: e.target.value as any }
                }))}
                className="w-full h-[28px] px-2 text-xs border border-[#E1DFDD] rounded-[3px] bg-white dark:bg-slate-800"
              >
                <option value="number_line">Trục số khoảng/đoạn (L10)</option>
                <option value="trig_circle_full">Đường tròn lượng giác đầy đủ (L11)</option>
                <option value="triangle">Tam giác vuông & Ký hiệu góc vuông</option>
              </select>
            </div>
          </div>
        )}

        {/* Cấu hình Không gian 3D */}
        {doc.category === 'space_3d' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#242424] dark:text-slate-200 border-b border-[#E1DFDD] pb-1">
              Khối 3D & Nét đứt tự động
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={doc.space3D.autoHiddenLines}
                onChange={(e) => onUpdateDoc(prev => ({
                  ...prev,
                  space3D: { ...prev.space3D, autoHiddenLines: e.target.checked }
                }))}
                className="rounded accent-[#0F6CBD]"
              />
              <span>Tự động phân biệt Nét liền / Nét đứt</span>
            </label>
          </div>
        )}

        {/* Nét vẽ & Định dạng chữ */}
        <div className="pt-3 border-t border-[#E1DFDD] space-y-2">
          <div className="text-xs font-bold text-[#242424] dark:text-slate-200">
            Nét vẽ & Nhãn
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Độ dày nét:</span>
            <span className="font-mono font-bold">{doc.strokeFill.strokeWidth} pt</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Cỡ chữ:</span>
            <span className="font-mono font-bold">{doc.typography.fontSize} pt</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Phông chữ:</span>
            <span className="font-serif font-bold">{doc.typography.fontFamily}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
