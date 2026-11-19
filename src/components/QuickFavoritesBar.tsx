import React from 'react';
import { Star, Plus, Search } from 'lucide-react';
import { TabId } from '../App';
import { SEARCHABLE_TOOLS } from './CommandPalette';
import { AccentColor, ACCENT_THEMES } from '../types/personalization';

interface QuickFavoritesBarProps {
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
  pinnedTabs: string[];
  onOpenSearch: () => void;
  accentColor?: AccentColor;
}

export default function QuickFavoritesBar({
  activeTab,
  onSelectTab,
  pinnedTabs,
  onOpenSearch,
  accentColor = 'teal',
}: QuickFavoritesBarProps) {
  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  const favoriteTools = SEARCHABLE_TOOLS.filter(t => pinnedTabs.includes(t.id));

  if (favoriteTools.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0 mr-1 pl-1">
        <Star size={12} className="fill-amber-400" />
        <span className="hidden sm:inline">Ghim nhanh:</span>
      </div>

      <div className="flex items-center gap-1.5">
        {favoriteTools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onSelectTab(tool.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
                isActive
                  ? `${theme.primaryBg} text-white ${theme.primaryBorder} shadow-xs`
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-white' : theme.primaryText} />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onOpenSearch}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 ml-1"
        title="Quản lý công cụ ghim & Tìm kiếm (Ctrl + K)"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
