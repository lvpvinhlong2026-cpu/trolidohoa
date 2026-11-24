/**
 * @license
 * AccessibleDropdown.tsx
 * Dropdown chuẩn WAI-ARIA cho Microsoft Word Ribbon UI:
 * - Sử dụng createPortal(..., document.body) để menu KHÔNG BAO GIỜ bị ẩn/cắt bớt bởi overflow của thanh Ribbon
 * - Kích hoạt bằng sự kiện click
 * - aria-haspopup="menu", aria-expanded
 * - Tự động đóng khi click ra ngoài hoặc nhấn Esc
 * - Hỗ trợ Large Button (icon trên, chữ dưới kèm ▼) hoặc Compact Button
 */

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  menuWidth = 'w-64',
  ariaLabel,
}: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const uniqueId = useId();
  const triggerId = `ribbon-drop-btn-${uniqueId}`;
  const menuId = `ribbon-drop-menu-${uniqueId}`;

  // Cập nhật tọa độ thả xuống theo vị trí nút bấm
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Ước tính chiều rộng menu (khoảng 260px - 300px)
    const approxWidth = 280;
    let targetLeft = rect.left;
    if (targetLeft + approxWidth > window.innerWidth - 12) {
      targetLeft = Math.max(12, window.innerWidth - approxWidth - 12);
    }

    setCoords({
      top: rect.bottom + 3,
      left: Math.max(8, targetLeft),
    });
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Đóng khi click ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(targetNode) &&
        menuRef.current && 
        !menuRef.current.contains(targetNode)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isOpen, updatePosition]);

  // Menu Dropdown Portal
  const renderDropdownMenu = () => {
    if (!isOpen || !coords) return null;

    return createPortal(
      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-labelledby={triggerId}
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex: 99999,
        }}
        className={`${menuWidth} py-1.5 bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-2xl focus:outline-none max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 select-none`}
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
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left text-[#242424] dark:text-slate-200 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
      </ul>,
      document.body
    );
  };

  // Compact Variant
  if (variant === 'compact') {
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <button
          ref={buttonRef}
          id={triggerId}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={ariaLabel}
          onClick={toggleDropdown}
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

        {renderDropdownMenu()}
      </div>
    );
  }

  // Large Variant (Office 365 Standard Large Ribbon Button)
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={toggleDropdown}
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

      {renderDropdownMenu()}
    </div>
  );
}
