import React, { useState, useRef, useEffect } from 'react';
import { 
  Grid, 
  ExternalLink, 
  BookOpen, 
  CheckSquare, 
  Gamepad2, 
  Palette, 
  FileText,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';

interface LvpEcosystemMenuProps {
  accentColor?: AccentColor;
}

export const LVP_APPS = [
  {
    id: 'app_vanban',
    name: 'Trợ Lý Văn Bản & Đề Thi',
    desc: 'Bóc tách PDF/Word sang LaTeX, tách ghép PDF, chuẩn hóa đề thi',
    port: 3000,
    url: 'http://localhost:3000',
    icon: FileText,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/50',
    borderColor: 'border-teal-200 dark:border-teal-800',
    isCurrent: false
  },
  {
    id: 'app_1',
    name: 'Phân hệ 1: Soạn Giảng CV 5512',
    desc: 'Soạn KHBD 5512, Slide PowerPoint, Trắc nghiệm & Ma trận',
    port: 3001,
    url: 'http://localhost:3001',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-800',
    isCurrent: false
  },
  {
    id: 'app_2',
    name: 'Phân hệ 2: Khảo Thí & Tạo Đề CV 7991',
    desc: 'Sinh đề AI theo ma trận, trộn 4 mã đề, chuẩn hóa OCR LaTeX',
    port: 3002,
    url: 'http://localhost:3002',
    icon: CheckSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    borderColor: 'border-purple-200 dark:border-purple-800',
    isCurrent: false
  },
  {
    id: 'app_3',
    name: 'Phân hệ 3: Lớp Học Thông Minh',
    desc: 'Game tương tác khởi động & củng cố, vòng quay may mắn',
    port: 3003,
    url: 'http://localhost:3003',
    icon: Gamepad2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800',
    isCurrent: false
  },
  {
    id: 'app_4',
    name: 'Phân hệ 4: Đồ Họa Toán Học (300 DPI)',
    desc: 'Vẽ đồ thị Oxy 300 DPI, BBT, GeoGebra 3D, GSP Sketchpad 5',
    port: 3004,
    url: 'http://localhost:3004',
    icon: Palette,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    isCurrent: true
  }
];

export default function LvpEcosystemMenu({ accentColor = 'teal' }: LvpEcosystemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
          isOpen
            ? `${theme.softBg} ${theme.primaryText} ${theme.softBorder}`
            : 'bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60'
        }`}
        title="Chuyển đổi các Phân hệ trong Hệ sinh thái LVP"
      >
        <Grid size={14} className={theme.primaryText} />
        <span className="hidden lg:inline">Hệ sinh thái LVP</span>
        <span className="lg:hidden text-[11px]">LVP</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-fade-in space-y-2">
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className={theme.primaryText} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Hệ sinh thái Giáo dục Số LVP
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">4 Phân hệ</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {LVP_APPS.map(app => {
              const Icon = app.icon;
              return (
                <a
                  key={app.id}
                  href={app.isCurrent ? undefined : app.url}
                  target={app.isCurrent ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (app.isCurrent) setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                    app.isCurrent
                      ? `${theme.softBg} ${theme.softBorder} cursor-default`
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${app.bgColor} ${app.borderColor} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={16} className={app.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${app.isCurrent ? theme.primaryText : 'text-slate-800 dark:text-slate-100'}`}>
                        {app.name}
                      </span>
                      {app.isCurrent ? (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}>
                          Đang mở
                        </span>
                      ) : (
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {app.desc}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      Cổng kết nối: :{app.port}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 text-center border border-slate-100 dark:border-slate-800">
            Dùng chung cấu hình Gemini API Key và hồ sơ giáo viên trên toàn hệ thống
          </div>
        </div>
      )}
    </div>
  );
}
