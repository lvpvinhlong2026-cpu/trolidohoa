/**
 * CustomDropdown.tsx
 * Bộ thành phần Menu sổ dọc tùy biến (Custom Dropdown) chuẩn đặc tả WAI-ARIA
 * 
 * Cung cấp 2 pattern chính:
 * 1. CustomDropdownMenu: Menu Button Pattern (Thực hiện hành động / Điều hướng)
 *    - Trigger: <button type="button" aria-haspopup="menu" aria-expanded={isOpen} aria-controls={menuId}>
 *    - Menu: <ul role="menu" aria-labelledby={triggerId} aria-orientation="vertical">
 *    - Items: <li role="none"><button role="menuitem" tabIndex={...}>
 * 
 * 2. CustomDropdownSelect: Combobox / Listbox Pattern (Chọn giá trị thay thế thẻ <select>)
 *    - Trigger: <button type="button" role="combobox" aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listboxId}>
 *    - Listbox: <ul role="listbox" aria-labelledby={triggerId}>
 *    - Options: <li role="option" aria-selected={isSelected}>
 */

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/* =========================================================================
   1. TYPES & INTERFACES CHO DROPDOWN MENU (ACTION MENU)
   ========================================================================= */

export interface DropdownMenuItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean; // Hiển thị đường phân cách phía trên
  selected?: boolean;
  onClick?: () => void;
}

export interface CustomDropdownMenuProps {
  /** Nhãn hiển thị trên nút kích hoạt (nếu không dùng custom trigger) */
  label?: string;
  /** Biểu tượng hiển thị bên trái nút kích hoạt */
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  /** Danh sách các mục trong menu sổ dọc */
  items: DropdownMenuItem[];
  /** Vị trí mở danh sách */
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Chiều rộng tùy biến của menu (mặc định 'w-64') */
  menuWidth?: string;
  /** Class bổ sung cho container ngoài */
  className?: string;
  /** Class tùy biến cho nút kích hoạt */
  buttonClassName?: string;
  /** Tên định danh hỗ trợ đọc màn hình */
  ariaLabel: string;
  /** Tùy chọn render trigger tùy biến */
  renderTrigger?: (props: {
    isOpen: boolean;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
    toggle: () => void;
  }) => React.ReactNode;
  /** Callback khi bất kỳ mục nào được chọn */
  onSelect?: (item: DropdownMenuItem) => void;
  /** Màu nhấn (Accent theme) */
  themeRing?: string;
}

/* =========================================================================
   HELPER: RENDER ICON AN TOÀN TRONG REACT 19 (HỖ TRỢ LUCIDE FORWARDREF)
   ========================================================================= */

function renderCustomIcon(
  icon: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode,
  size: number = 16,
  className?: string
) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const Component = icon as React.ComponentType<{ size?: number; className?: string }>;
  return <Component size={size} className={className} />;
}

/* =========================================================================
   2. COMPONENT: CustomDropdownMenu (Chuẩn WAI-ARIA Menu Button)
   ========================================================================= */

export const CustomDropdownMenu: React.FC<CustomDropdownMenuProps> = ({
  label,
  icon: IconProp,
  items,
  placement = 'bottom-left',
  menuWidth = 'w-64',
  className = '',
  buttonClassName = '',
  ariaLabel,
  renderTrigger,
  onSelect,
  themeRing = 'focus:ring-teal-500',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const uniqueId = useId();
  const triggerId = `dropdown-btn-${uniqueId}`;
  const menuId = `dropdown-menu-${uniqueId}`;

  // Lọc danh sách các index hợp lệ (không disabled) để điều hướng bàn phím
  const enabledIndices = items
    .map((item, idx) => (item.disabled ? -1 : idx))
    .filter(idx => idx !== -1);

  // Đóng menu và trả focus về nút kích hoạt
  const closeMenu = useCallback((restoreFocus: boolean = true) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    if (restoreFocus && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  // Mở menu và focus vào item đầu tiên hoặc item được chọn
  const openMenu = useCallback((firstOrLast: 'first' | 'last' = 'first') => {
    setIsOpen(true);
    if (enabledIndices.length > 0) {
      const selectedIdx = items.findIndex(item => item.selected && !item.disabled);
      if (selectedIdx !== -1 && firstOrLast === 'first') {
        setFocusedIndex(selectedIdx);
      } else {
        const targetIdx = firstOrLast === 'first' 
          ? enabledIndices[0] 
          : enabledIndices[enabledIndices.length - 1];
        setFocusedIndex(targetIdx);
      }
    }
  }, [enabledIndices, items]);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu(true);
    } else {
      openMenu('first');
    }
  }, [isOpen, closeMenu, openMenu]);

  // Click Outside: Tự động đóng menu khi nhấp chuột ra ngoài
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeMenu]);

  // Tự động focus vào item tương ứng khi focusedIndex thay đổi
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Điều hướng bàn phím trên nút kích hoạt (Trigger Button)
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        openMenu('first');
        break;
      case 'ArrowUp':
        e.preventDefault();
        openMenu('last');
        break;
      default:
        break;
    }
  };

  // Điều hướng bàn phím trong Menu sổ dọc (Menu Container)
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (enabledIndices.length === 0) return;

    const currentPos = enabledIndices.indexOf(focusedIndex);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextPos = currentPos < enabledIndices.length - 1 ? currentPos + 1 : 0;
        setFocusedIndex(enabledIndices[nextPos]);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevPos = currentPos > 0 ? currentPos - 1 : enabledIndices.length - 1;
        setFocusedIndex(enabledIndices[prevPos]);
        break;
      }
      case 'Home': {
        e.preventDefault();
        setFocusedIndex(enabledIndices[0]);
        break;
      }
      case 'End': {
        e.preventDefault();
        setFocusedIndex(enabledIndices[enabledIndices.length - 1]);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeMenu(true);
        break;
      }
      case 'Tab': {
        // Chuẩn WAI-ARIA: phím Tab đóng menu và cho phép focus trôi tự nhiên
        closeMenu(false);
        break;
      }
      default: {
        // Typeahead search: Nhấn ký tự để nhảy đến mục có chữ cái đầu tương ứng
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const char = e.key.toLowerCase();
          const matchIdx = items.findIndex((it, idx) => 
            !it.disabled && it.label.trim().toLowerCase().startsWith(char) && idx > focusedIndex
          );
          if (matchIdx !== -1) {
            setFocusedIndex(matchIdx);
          } else {
            const wrapIdx = items.findIndex((it) => 
              !it.disabled && it.label.trim().toLowerCase().startsWith(char)
            );
            if (wrapIdx !== -1) setFocusedIndex(wrapIdx);
          }
        }
        break;
      }
    }
  };

  // Vị trí định vị menu
  const placementClasses = {
    'bottom-left': 'top-full left-0 mt-1.5 origin-top-left',
    'bottom-right': 'top-full right-0 mt-1.5 origin-top-right',
    'top-left': 'bottom-full left-0 mb-1.5 origin-bottom-left',
    'top-right': 'bottom-full right-0 mb-1.5 origin-bottom-right',
  }[placement];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      
      {/* 1. NÚT KÍCH HOẠT (TRIGGER BUTTON) CHUẨN ARIA */}
      {renderTrigger ? (
        renderTrigger({ isOpen, buttonRef: triggerRef, toggle: toggleMenu })
      ) : (
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          onClick={toggleMenu}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={ariaLabel}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border outline-none ${themeRing} focus:ring-2 ${
            isOpen
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          } ${buttonClassName}`}
        >
          {IconProp && (
            <span className="shrink-0">
              {renderCustomIcon(IconProp, 15)}
            </span>
          )}
          {label && <span>{label}</span>}
          <ChevronDown
            size={14}
            className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      )}

      {/* 2. KHUNG MENU SỔ DỌC (DROPDOWN MENU CONTAINER) CHUẨN ARIA */}
      {isOpen && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-labelledby={triggerId}
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-50 ${placementClasses} ${menuWidth} py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 focus:outline-none max-h-[85vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100`}
        >
          {items.map((item, index) => {
            const isFocused = focusedIndex === index;
            const ItemIcon = item.icon;

            return (
              <React.Fragment key={item.id}>
                {item.divider && (
                  <li role="separator" aria-orientation="horizontal" className="my-1.5 border-t border-slate-200 dark:border-slate-800" />
                )}

                <li role="none" className="px-1">
                  <button
                    ref={el => { itemRefs.current[index] = el; }}
                    role="menuitem"
                    type="button"
                    disabled={item.disabled}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => {
                      if (item.disabled) return;
                      item.onClick?.();
                      onSelect?.(item);
                      closeMenu(true);
                    }}
                    onMouseEnter={() => {
                      if (!item.disabled) setFocusedIndex(index);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-xl text-xs font-semibold transition-colors cursor-pointer outline-none select-none ${
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                        : item.danger
                        ? isFocused
                          ? 'bg-rose-500 text-white'
                          : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : isFocused
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${item.selected ? 'font-bold' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ItemIcon && (
                        <span className={`shrink-0 ${item.selected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {renderCustomIcon(ItemIcon, 16)}
                        </span>
                      )}
                      <div className="min-w-0 flex flex-col">
                        <span className="truncate">{item.label}</span>
                        {item.subLabel && (
                          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate">
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {item.shortcut && (
                        <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                          {item.shortcut}
                        </kbd>
                      )}

                      {item.selected && (
                        <Check size={14} className="text-teal-600 dark:text-teal-400 ml-1" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* =========================================================================
   3. TYPES & INTERFACES CHO DROPDOWN SELECT (LISTBOX / COMBOBOX PATTERN)
   ========================================================================= */

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }> | React.ReactNode;
  disabled?: boolean;
}

export interface CustomDropdownSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  size?: 'sm' | 'md';
  themeRing?: string;
}

/* =========================================================================
   4. COMPONENT: CustomDropdownSelect (Chuẩn WAI-ARIA Combobox / Listbox)
   ========================================================================= */

export const CustomDropdownSelect: React.FC<CustomDropdownSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Chọn một mục...',
  ariaLabel,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  placement = 'bottom-left',
  size = 'sm',
  themeRing = 'focus:ring-teal-500',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = options.findIndex(opt => opt.value === value);
  const [focusedIndex, setFocusedIndex] = useState<number>(selectedIndex >= 0 ? selectedIndex : 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const uniqueId = useId();
  const buttonId = `select-btn-${uniqueId}`;
  const listboxId = `select-listbox-${uniqueId}`;

  const selectedOption = options.find(opt => opt.value === value);

  // Lọc danh sách các mục không bị disabled
  const enabledIndices = options
    .map((opt, idx) => (opt.disabled ? -1 : idx))
    .filter(idx => idx !== -1);

  const closeListbox = useCallback((restoreFocus: boolean = true) => {
    setIsOpen(false);
    if (restoreFocus && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, []);

  const openListbox = useCallback(() => {
    setIsOpen(true);
    const currIdx = options.findIndex(opt => opt.value === value && !opt.disabled);
    setFocusedIndex(currIdx >= 0 ? currIdx : (enabledIndices[0] ?? 0));
  }, [options, value, enabledIndices]);

  const toggleListbox = useCallback(() => {
    if (isOpen) closeListbox(true);
    else openListbox();
  }, [isOpen, closeListbox, openListbox]);

  // Click Outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeListbox(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeListbox]);

  // Cuộn vào khung nhìn khi focus
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

  // Điều khiển phím trên nút kích hoạt (Combobox)
  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        openListbox();
        break;
      default:
        break;
    }
  };

  // Điều khiển phím trên danh sách (Listbox)
  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (enabledIndices.length === 0) return;
    const currentPos = enabledIndices.indexOf(focusedIndex);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextPos = currentPos < enabledIndices.length - 1 ? currentPos + 1 : 0;
        setFocusedIndex(enabledIndices[nextPos]);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevPos = currentPos > 0 ? currentPos - 1 : enabledIndices.length - 1;
        setFocusedIndex(enabledIndices[prevPos]);
        break;
      }
      case 'Home': {
        e.preventDefault();
        setFocusedIndex(enabledIndices[0]);
        break;
      }
      case 'End': {
        e.preventDefault();
        setFocusedIndex(enabledIndices[enabledIndices.length - 1]);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
          onChange(options[focusedIndex].value);
          closeListbox(true);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeListbox(true);
        break;
      }
      case 'Tab': {
        closeListbox(false);
        break;
      }
      default:
        break;
    }
  };

  const placementClasses = {
    'bottom-left': 'top-full left-0 mt-1 origin-top-left',
    'bottom-right': 'top-full right-0 mt-1 origin-top-right',
    'top-left': 'bottom-full left-0 mb-1 origin-bottom-left',
    'top-right': 'bottom-full right-0 mb-1 origin-bottom-right',
  }[placement];

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs';

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* NÚT BẤM KÍCH HOẠT DẠNG COMBOBOX CHUẨN ARIA */}
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={toggleListbox}
        onKeyDown={handleButtonKeyDown}
        className={`w-full flex items-center justify-between gap-1.5 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all cursor-pointer outline-none ${themeRing} focus:ring-2 select-none ${sizeClasses} ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* DANH SÁCH LỰA CHỌN LISTBOX CHUẨN ARIA */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={buttonId}
          aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-opt-${focusedIndex}` : undefined}
          onKeyDown={handleListboxKeyDown}
          className={`absolute z-50 ${placementClasses} w-full min-w-[180px] max-w-[320px] py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg focus:outline-none max-h-60 overflow-y-auto scrollbar-thin ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = focusedIndex === index;

            return (
              <li
                key={option.value}
                ref={el => { optionRefs.current[index] = el; }}
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  closeListbox(true);
                }}
                onMouseEnter={() => {
                  if (!option.disabled) setFocusedIndex(index);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-1.5 cursor-pointer text-xs transition-colors select-none ${
                  option.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : isFocused
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${isSelected ? 'font-bold text-teal-600 dark:text-teal-400' : ''}`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{option.label}</span>
                  {option.subLabel && (
                    <span className="text-[10px] text-slate-400 font-normal truncate">
                      {option.subLabel}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check size={14} className="text-teal-600 dark:text-teal-400 shrink-0 ml-1" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
