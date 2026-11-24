/**
 * @license
 * FileMenuDropdown.tsx
 * Menu sổ dọc phím "Tệp" (File) đặc trưng của Microsoft Word Office 365
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  Image as ImageIcon, 
  Code, 
  Printer, 
  Settings,
  ChevronDown
} from 'lucide-react';

export interface FileMenuDropdownProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onPrint: () => void;
  onOpenSettings: () => void;
}

function renderSafeIcon(icon: any, size: number = 16, className?: string) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))) {
    const Component = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <Component size={size} className={className} />;
  }
  return null;
}

export default function FileMenuDropdown({
  onNew,
  onOpen,
  onSave,
  onExportPng,
  onExportSvg,
  onPrint,
  onOpenSettings,
}: FileMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const menuItems = [
    { id: 'new', label: 'Tạo hình mới', icon: FilePlus, shortcut: 'Ctrl + N', onClick: onNew },
    { id: 'open', label: 'Mở dự án (.json)', icon: FolderOpen, shortcut: 'Ctrl + O', onClick: onOpen },
    { id: 'save', label: 'Lưu dự án offline (.json)', icon: Save, shortcut: 'Ctrl + S', onClick: onSave },
    { divider: true },
    { id: 'export_png', label: 'Xuất ảnh PNG chuẩn Word', icon: ImageIcon, shortcut: '300 DPI', onClick: onExportPng },
    { id: 'export_svg', label: 'Xuất vector SVG', icon: Code, shortcut: 'Vector', onClick: onExportSvg },
    { id: 'print', label: 'In nhanh', icon: Printer, shortcut: 'Ctrl + P', onClick: onPrint },
    { divider: true },
    { id: 'settings', label: 'Cài đặt & Khóa API Gemini', icon: Settings, onClick: onOpenSettings },
  ];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        role="tab"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu Tệp dự án"
        onClick={() => setIsOpen(!isOpen)}
        className="h-[36px] px-3.5 bg-[#0F6CBD] hover:bg-[#115EA3] active:bg-[#0C5494] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none rounded-[2px]"
      >
        <span>Tệp</span>
        <ChevronDown size={12} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul
          role="menu"
          className="absolute z-50 top-full left-0 mt-0.5 w-64 py-1.5 bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-2xl focus:outline-none animate-in fade-in duration-100"
        >
          {menuItems.map((item, idx) => {
            if (item.divider) {
              return <li key={`div-${idx}`} role="separator" className="my-1.5 border-t border-[#E1DFDD] dark:border-slate-800" />;
            }
            return (
              <li key={item.id} role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left text-[#242424] dark:text-slate-200 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderSafeIcon(item.icon, 16, "text-[#0F6CBD] shrink-0")}
                    <span className="font-medium truncate">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] text-[#605E5C] font-mono ml-2 shrink-0">{item.shortcut}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
