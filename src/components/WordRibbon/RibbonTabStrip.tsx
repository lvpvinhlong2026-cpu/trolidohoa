/**
 * @license
 * RibbonTabStrip.tsx
 * Tầng 1: Thanh Tab Ribbon trên cùng (36px, nền #F3F2F1)
 */

import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';
import { RibbonTabId } from '../../types/mathArtboard';
import FileMenuDropdown from './FileMenuDropdown';

export interface RibbonTabStripProps {
  activeTab: RibbonTabId;
  onSelectTab: (tabId: RibbonTabId) => void;
  isRibbonCollapsed: boolean;
  onToggleRibbonCollapse: () => void;
  hasSelectedElement: boolean;
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onPrint: () => void;
  onOpenSettings: () => void;
}

const TABS: { id: RibbonTabId; label: string }[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'graph_2d', label: 'Đồ thị 2D' },
  { id: 'bbt', label: 'Bảng biến thiên' },
  { id: 'plane_trig', label: 'Hình phẳng & Lượng giác' },
  { id: 'space_3d', label: 'Không gian 3D & Oxyz' },
  { id: 'stats_prob', label: 'Thống kê & Xác suất' },
];

export default function RibbonTabStrip({
  activeTab,
  onSelectTab,
  isRibbonCollapsed,
  onToggleRibbonCollapse,
  hasSelectedElement,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onExportPng,
  onExportSvg,
  onPrint,
  onOpenSettings,
}: RibbonTabStripProps) {
  return (
    <div 
      role="tablist" 
      aria-label="Thanh thẻ công cụ Ribbon"
      className="flex items-center justify-between px-2 bg-[#F3F2F1] dark:bg-slate-950 border-b border-[#E1DFDD] dark:border-slate-800 h-[36px] min-h-[36px] select-none"
    >
      {/* Khối Tabs bên trái */}
      <div className="flex items-center gap-0.5 h-full overflow-x-auto scrollbar-none">
        {/* NÚT TỆP (FILE TAB) */}
        <FileMenuDropdown
          onNew={onNewFile}
          onOpen={onOpenFile}
          onSave={onSaveFile}
          onExportPng={onExportPng}
          onExportSvg={onExportSvg}
          onPrint={onPrint}
          onOpenSettings={onOpenSettings}
        />

        {/* CÁC TAB CHÍNH */}
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`ribbon-tab-${tab.id}`}
              type="button"
              aria-selected={isActive}
              aria-controls={`ribbon-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                onSelectTab(tab.id);
                if (isRibbonCollapsed) onToggleRibbonCollapse();
              }}
              className={`h-[36px] px-3.5 text-xs transition-all cursor-pointer whitespace-nowrap flex items-center justify-center shrink-0 ${
                isActive
                  ? 'font-bold text-[#242424] dark:text-white bg-white dark:bg-slate-900 border-b-[3px] border-[#0F6CBD] dark:border-sky-400 -mb-[1px]'
                  : 'font-normal text-[#424242] dark:text-slate-400 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 hover:text-[#242424] dark:hover:text-slate-200 border-b-[3px] border-transparent'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* CONTEXTUAL TAB: ĐỊNH DẠNG ĐỐI TƯỢNG (Chữ màu xanh dương #0F6CBD, chỉ hiện khi chọn đối tượng) */}
        {hasSelectedElement && (
          <button
            role="tab"
            id="ribbon-tab-format"
            type="button"
            aria-selected={activeTab === 'format'}
            aria-controls="ribbon-panel-format"
            onClick={() => {
              onSelectTab('format');
              if (isRibbonCollapsed) onToggleRibbonCollapse();
            }}
            className={`h-[36px] px-3.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 animate-in fade-in ${
              activeTab === 'format'
                ? 'text-[#0F6CBD] bg-white dark:bg-slate-900 border-b-[3px] border-[#0F6CBD] -mb-[1px]'
                : 'text-[#0F6CBD] bg-sky-50/70 hover:bg-sky-100/80 border-b-[3px] border-transparent'
            }`}
          >
            <Sparkles size={13} className="text-[#0F6CBD]" />
            <span>Định dạng đối tượng</span>
          </button>
        )}
      </div>

      {/* Nút thu gọn / mở rộng Ribbon (Ctrl + F1) */}
      <div className="flex items-center shrink-0 ml-2">
        <button
          type="button"
          onClick={onToggleRibbonCollapse}
          className="p-1 rounded-[4px] text-[#605E5C] hover:text-[#242424] hover:bg-[#EDEBE9] dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isRibbonCollapsed ? 'Mở rộng dải Ribbon (Ctrl + F1)' : 'Thu gọn dải Ribbon (Ctrl + F1)'}
        >
          {isRibbonCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </div>
  );
}
