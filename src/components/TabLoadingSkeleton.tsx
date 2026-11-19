import React from 'react';
import { Loader2 } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';

interface TabLoadingSkeletonProps {
  title?: string;
  accentColor?: AccentColor;
}

export default function TabLoadingSkeleton({ title = 'Đang tải công cụ...', accentColor = 'teal' }: TabLoadingSkeletonProps) {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className={`w-14 h-14 rounded-2xl ${theme.softBg} ${theme.softBorder} border flex items-center justify-center shadow-sm`}>
          <Loader2 className={`w-7 h-7 animate-spin ${theme.primaryText}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Đang khởi tạo các thuật toán đồ họa & phân hệ chuyên sâu...
          </p>
        </div>
        <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${theme.primaryBg} rounded-full animate-pulse`} style={{ width: '65%' }} />
        </div>
      </div>
    </div>
  );
}
