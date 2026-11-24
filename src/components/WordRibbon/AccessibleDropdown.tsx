/**
 * @license
 * AccessibleDropdown.tsx
 * Dropdown chuẩn WAI-ARIA cho Microsoft Word Ribbon UI:
 * - Kích hoạt bằng sự kiện click (không hover)
 * - aria-haspopup="menu", aria-expanded
 * - Tự động đóng khi click ra ngoài hoặc nhấn Esc
 * - Hỗ trợ Large Button (icon trên, chữ dưới kèm ▼) hoặc Compact Button
 */

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownActionItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: any;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface AccessibleDropdownProps {
  label: string;
  icon?: any;
  items: DropdownActionItem[];
  variant?: 'large' | 'compact' | 'split';
  className?: string;
  buttonClassName?: string;
  menuWidth?: string;
  ariaLabel: string;
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

export default function AccessibleDropdown({
  label,
  icon: Icon,
  items,
  variant = 'large',
  className = '',
  buttonClassName = '',
  menuWidth = 'w-60',
  ariaLabel,
}: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const triggerId = `ribbon-drop-btn-${uniqueId}`;
  const menuId = `ribbon-drop-menu-${uniqueId}`;

  // Đóng khi click ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'compact') {
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <button
          id={triggerId}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={ariaLabel}
          onClick={() => setIsOpen(!isOpen)}
          className={`h-[28px] px-2 flex items-center gap-1.5 rounded-[4px] text-xs font-normal border transition cursor-pointer select-none ${
            isOpen
              ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
              : 'bg-white hover:bg-[#EDEBE9] text-[#242424] border-[#E1DFDD] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
          } ${buttonClassName}`}
        >
          {renderSafeIcon(Icon, 14, "shrink-0")}
          <span className="truncate">{label}</span>
          <ChevronDown size={12} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ul
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            className={`absolute z-50 top-full left-0 mt-1 ${menuWidth} py-1 bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-lg focus:outline-none max-h-72 overflow-y-auto`}
          >
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <React.Fragment key={item.id}>
                  {item.divider && <li role="separator" className="my-1 border-t border-[#E1DFDD] dark:border-slate-800" />}
                  <li role="none">
                    <button
                      role="menuitem"
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        if (!item.disabled) {
                          item.onClick();
                          setIsOpen(false);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left text-[#242424] dark:text-slate-200 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {renderSafeIcon(ItemIcon, 14, "text-[#0F6CBD] shrink-0")}
                        <span className="truncate font-medium">{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <span className="text-[10px] text-[#605E5C] font-mono ml-2 shrink-0">{item.shortcut}</span>
                      )}
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // Variant: Large Button (Office 365 Standard Large Ribbon Button)
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[68px] min-w-[62px] px-2 py-1 flex flex-col items-center justify-center rounded-[4px] border transition cursor-pointer select-none ${
          isOpen
            ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
            : 'bg-white hover:bg-[#EDEBE9] text-[#242424] border-transparent hover:border-[#E1DFDD] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
        } ${buttonClassName}`}
      >
        <div className="flex items-center justify-center mb-1">
          {renderSafeIcon(Icon, 24, isOpen ? 'text-[#0F6CBD]' : 'text-[#0F6CBD]')}
        </div>
        <div className="flex items-center gap-0.5 text-xs font-normal text-center leading-tight">
          <span className="text-[11px] leading-tight">{label}</span>
          <ChevronDown size={11} className={`text-[#605E5C] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <ul
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={`absolute z-50 top-full left-0 mt-1 ${menuWidth} py-1.5 bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-xl focus:outline-none max-h-80 overflow-y-auto`}
        >
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {item.divider && <li role="separator" className="my-1 border-t border-[#E1DFDD] dark:border-slate-800" />}
                <li role="none">
                  <button
                    role="menuitem"
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick();
                        setIsOpen(false);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left text-[#242424] dark:text-slate-200 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderSafeIcon(ItemIcon, 15, "text-[#0F6CBD] shrink-0")}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.subLabel && <span className="text-[10px] text-[#605E5C] truncate">{item.subLabel}</span>}
                      </div>
                    </div>
                    {item.shortcut && (
                      <span className="text-[10px] text-[#605E5C] font-mono ml-2 shrink-0">{item.shortcut}</span>
                    )}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
