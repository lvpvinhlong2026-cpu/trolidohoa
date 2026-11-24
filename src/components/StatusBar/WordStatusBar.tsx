/**
 * @license
 * WordStatusBar.tsx
 * Thanh trạng thái dưới cùng (Status Bar):
 * - Chiều cao 24px, nền #F3F2F1, viền trên #E1DFDD
 * - Hiển thị tọa độ con trỏ (x; y), tỷ lệ thu phóng (Zoom slider), trạng thái Sẵn sàng (Offline 300 DPI)
 */

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

export interface WordStatusBarProps {
  cursorX: number;
  cursorY: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  statusText?: string;
}

export default function WordStatusBar({
  cursorX,
  cursorY,
  zoom,
  onZoomChange,
  statusText = 'Sẵn sàng (Offline • 300 DPI)',
}: WordStatusBarProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(200, zoom + 10));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(50, zoom - 10));
  };

  const handleZoomReset = () => {
    onZoomChange(100);
  };

  return (
    <footer 
      role="status"
      aria-label="Thanh trạng thái hệ thống"
      className="h-[24px] min-h-[24px] px-3 bg-[#F3F2F1] dark:bg-slate-900 border-t border-[#E1DFDD] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#605E5C] dark:text-slate-400 select-none z-20"
    >
      {/* Bên trái: Tọa độ con trỏ Oxy & Số phần tử */}
      <div className="flex items-center gap-3">
        <span className="font-mono">
          Tọa độ: ({cursorX.toFixed(2)} ; {cursorY.toFixed(2)})
        </span>
        <span className="hidden sm:inline border-l border-[#E1DFDD] dark:border-slate-700 pl-3">
          Trang 1 / 1
        </span>
      </div>

      {/* Ở giữa: Trạng thái hệ thống */}
      <div className="hidden md:flex items-center gap-1.5 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span>{statusText}</span>
      </div>

      {/* Bên phải: Thanh trượt Zoom 50% - 200% */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="p-0.5 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
          title="Thu nhỏ (-10%)"
        >
          <Minus size={12} />
        </button>

        <input
          type="range"
          min="50"
          max="200"
          step="5"
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-16 sm:w-20 h-1.5 accent-[#0F6CBD] cursor-pointer"
          title={`Thu phóng: ${zoom}%`}
        />

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="p-0.5 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
          title="Phóng to (+10%)"
        >
          <Plus size={12} />
        </button>

        <button
          type="button"
          onClick={handleZoomReset}
          className="font-mono w-[38px] text-right hover:text-[#0F6CBD] cursor-pointer"
          title="Đặt lại 100%"
        >
          {zoom}%
        </button>
      </div>
    </footer>
  );
}
