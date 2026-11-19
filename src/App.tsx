/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Phân hệ 4: TRỢ LÝ ĐỒ HỌA TOÁN HỌC
 * Hệ sinh thái Giáo dục Số LVP (LVP EduEcosystem)
 * Tác giả: GV Lê Vĩnh Phúc (0944405124)
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  TrendingUp,
  Compass,
  Layers,
  Palette,
  HelpCircle,
  Settings,
  Moon,
  Sun,
  Menu,
  ChevronLeft,
  Search,
  MonitorPlay,
  BarChart2,
  Table,
  Maximize2,
  Minimize2,
  Grid,
  GitFork
} from 'lucide-react';

import { 
  AccentColor, 
  ACCENT_THEMES, 
  TeacherProfile 
} from './types/personalization';
import CommandPalette from './components/CommandPalette';
import QuickFavoritesBar from './components/QuickFavoritesBar';
import PersonalizationModal from './components/PersonalizationModal';
import TabLoadingSkeleton from './components/TabLoadingSkeleton';

// =====================================================================
// CHỈ GIỮ LẠI CÁC PHÂN HỆ CỐT LÕI ĐỒ HỌA TOÁN HỌC (300 DPI)
// =====================================================================
// 1. Nhóm Đồ họa Toán học (300 DPI)
const TableVariationTool = lazy(() => import('./components/TableVariationTool'));
const FunctionGraphTool = lazy(() => import('./components/FunctionGraphTool'));
const StatisticsChartTool = lazy(() => import('./components/StatisticsChartTool'));
const CombinedGeometryTab = lazy(() => import('./components/CombinedGeometryTab'));
const Geogebra3DTool = lazy(() => import('./components/Geogebra3DTool'));
const SimulationGenerator = lazy(() => import('./components/SimulationGenerator'));
const ProbabilityTreeTool = lazy(() => import('./components/ProbabilityTreeTool'));

// 2. Hướng dẫn sử dụng
const UserGuide = lazy(() => import('./components/UserGuide'));

export type TabId =
  | 'bbt'
  | 'bbt_graph'
  | 'statistics'
  | 'geometry'
  | 'geogebra'
  | 'simulation'
  | 'probability_tree'
  | 'guide'
  | 'gsp'
  | 'quick3d';

export interface NavCategory {
  id: string;
  title: string;
  tools: {
    id: TabId;
    label: string;
    sub: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[];
}

// =====================================================================
// DANH MỤC CÔNG CỤ TINH GỌN ĐÚNG TRỌNG TÂM: ĐỒ HỌA TOÁN HỌC
// =====================================================================
export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'do_hoa',
    title: 'Đồ Họa Toán Học (300 DPI)',
    tools: [
      {
        id: 'bbt_graph',
        label: 'Đồ thị, BPT & Trục số',
        sub: 'Hệ toạ độ Oxy, tương tác trực quan 300 DPI',
        icon: TrendingUp,
        badge: 'Trọng tâm',
      },
      {
        id: 'bbt',
        label: 'Bảng biến thiên & Xét dấu',
        sub: 'Lập BBT & dấu tam thức bậc 2, 3 chuẩn SGK',
        icon: Table,
        badge: 'SGK Mới',
      },
      {
        id: 'statistics',
        label: 'Biểu đồ Thống kê (Cột, Quạt, Hộp)',
        sub: 'Cột, cột kép, đoạn thẳng, hình quạt tròn & hộp 300 DPI',
        icon: BarChart2,
        badge: 'Mới',
      },
      {
        id: 'geometry',
        label: 'Hình học 2D & 3D (GSP)',
        sub: 'GSP Sketchpad 5 + Kho mẫu hình học tương tác',
        icon: Compass,
        badge: 'GSP 5',
      },
      {
        id: 'geogebra',
        label: 'GeoGebra 3D AI',
        sub: 'Không gian Oxyz, mặt cầu, khối đa diện AI',
        icon: Layers,
        badge: 'AI 3D',
      },
      {
        id: 'simulation',
        label: 'Mô phỏng Khái niệm',
        sub: 'Minh họa động định lý Toán & Khoa học',
        icon: MonitorPlay,
        badge: 'Mô phỏng',
      },
      {
        id: 'probability_tree',
        label: 'Sơ đồ Cây Xác suất (Bayes)',
        sub: 'Xác suất có điều kiện, toàn phần & Bayes 300 DPI',
        icon: GitFork,
        badge: 'Toán 12',
      },
    ],
  },
  {
    id: 'system',
    title: 'Hệ Thống',
    tools: [
      {
        id: 'guide',
        label: 'Hướng dẫn Sử dụng',
        sub: 'Tài liệu hướng dẫn, video & phím tắt hệ thống',
        icon: HelpCircle,
        badge: 'Trợ giúp',
      },
    ],
  },
];

const ALL_TOOLS = NAV_CATEGORIES.flatMap(c => c.tools);

export default function App() {
  // 1. Quản lý Tab đang mở & Startup Tab
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const startupSetting = localStorage.getItem('lvp_startup_tab_4') || 'last_used';
    if (startupSetting !== 'last_used' && ALL_TOOLS.some(t => t.id === startupSetting)) {
      return startupSetting as TabId;
    }
    let savedTab = localStorage.getItem('active_tab_4') as string;
    if (savedTab === 'gsp' || savedTab === 'quick3d') savedTab = 'geometry';
    if (savedTab === 'latex_word' || savedTab === 'pdf' || savedTab === 'pdfsplit') savedTab = 'bbt_graph';
    return savedTab && ALL_TOOLS.some(t => t.id === savedTab)
      ? (savedTab as TabId)
      : 'bbt_graph';
  });

  // Track các tab đã được truy cập để Keep-Alive (giữ trạng thái hình vẽ khi chuyển tab)
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(() => new Set([activeTab]));

  // 2. Chế độ Thu gọn Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lvp_sidebar_collapsed_4') === 'true';
  });

  // 3. Chế độ Tinh gọn (Zen / Compact Mode)
  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('lvp_compact_mode_4') === 'true';
  });

  // 4. Cá nhân hóa Thầy/Cô (Profile)
  const [profile, setProfile] = useState<TeacherProfile>(() => {
    try {
      const saved = localStorage.getItem('lvp_teacher_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'GV Lê Vĩnh Phúc',
      school: 'Trường THPT Thạnh Phước',
      subject: 'Toán học',
      academicYear: '2026 - 2027',
      showGreeting: true,
    };
  });

  // 5. Màu sắc chủ đạo (Accent Color)
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('lvp_accent_color_4') as AccentColor;
    return saved && ACCENT_THEMES[saved] ? saved : 'teal';
  });

  // 6. Danh sách công cụ Ghim Yêu thích (Mặc định 4 công cụ đồ họa & số hóa quan trọng nhất)
  const [pinnedTabs, setPinnedTabs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lvp_pinned_tabs_4');
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter((id: string) => ALL_TOOLS.some(t => t.id === id));
        if (valid.length > 0) return valid;
      }
    } catch {}
    return ['bbt_graph', 'bbt', 'geometry', 'geogebra'];
  });

  // 7. Cấu hình Gemini AI Key (Đồng bộ đa phân hệ LVP)
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || localStorage.getItem('edtech_gemini_api_key') || '';
  });

  const [preferredModel, setPreferredModel] = useState<string>(() => {
    const saved = localStorage.getItem('gemini_preferred_model');
    const validModels = ['auto', 'gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    if (saved && validModels.includes(saved)) return saved;
    return 'auto';
  });

  const [startupTabSetting, setStartupTabSetting] = useState<string>(() => {
    return localStorage.getItem('lvp_startup_tab_4') || 'last_used';
  });

  // 8. Chế độ Sáng / Tối (Dark mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_4') === 'dark' || localStorage.getItem('theme') === 'dark';
  });

  // 9. Modals State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  // Đồng bộ theme dark/light
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_4', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_4', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Ghi nhớ tab đang active
  useEffect(() => {
    localStorage.setItem('active_tab_4', activeTab);
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  // Lưu trạng thái sidebar
  useEffect(() => {
    localStorage.setItem('lvp_sidebar_collapsed_4', isSidebarCollapsed ? 'true' : 'false');
  }, [isSidebarCollapsed]);

  // Lưu trạng thái compact mode
  useEffect(() => {
    localStorage.setItem('lvp_compact_mode_4', isCompactMode ? 'true' : 'false');
  }, [isCompactMode]);

  // Lắng nghe phím tắt toàn cục
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setIsCompactMode(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSaveApiKey = (key: string, model: string) => {
    const trimmed = key.trim();
    localStorage.setItem('gemini_api_key', trimmed);
    localStorage.setItem('edtech_gemini_api_key', trimmed);
    localStorage.setItem('gemini_preferred_model', model);
    setApiKey(trimmed);
    setPreferredModel(model);
  };

  const handleSaveProfile = (newProfile: TeacherProfile) => {
    localStorage.setItem('lvp_teacher_profile', JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handleSelectAccentColor = (color: AccentColor) => {
    localStorage.setItem('lvp_accent_color_4', color);
    setAccentColor(color);
  };

  const handleTogglePin = (toolId: string) => {
    setPinnedTabs(prev => {
      const updated = prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId];
      localStorage.setItem('lvp_pinned_tabs_4', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectStartupTab = (tabId: string) => {
    localStorage.setItem('lvp_startup_tab_4', tabId);
    setStartupTabSetting(tabId);
  };

  const handleSelectTab = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* =====================================================================
          1. TOPBAR CHUẨN ĐỒ HỌA & SỐ HÓA LVP
          ===================================================================== */}
      <header className={`sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-all ${
        isCompactMode ? 'py-1 px-3 sm:px-4' : 'py-2 px-3 sm:px-5'
      }`}>
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Sidebar Toggle + Brand Logo + Title + Author info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Mở danh mục công cụ (Alt + B)" : "Thu gọn danh mục công cụ (Alt + B)"}
            >
              <Menu size={19} />
            </button>

            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}>
              <Palette size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
                  TRỢ LÝ ĐỒ HỌA TOÁN HỌC
                </h1>
              </div>
              {!isCompactMode && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  <span className={`${theme.primaryText} font-semibold truncate`}>
                    Phân hệ 4 • Tác giả: GV Lê Vĩnh Phúc (0944405124)
                  </span>
                  {profile.showGreeting && profile.name && (
                    <span className="hidden xl:inline text-slate-400">
                      • <strong className="text-slate-700 dark:text-slate-200">{profile.name}</strong> ({profile.school})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Command Palette Search (Ctrl + K) */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
              title="Tìm nhanh công cụ đồ họa Toán học (Ctrl + K)"
            >
              <Search size={14} className={theme.primaryText} />
              <span className="hidden md:inline">Tìm kiếm</span>
              <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
                Ctrl K
              </kbd>
            </button>

            {/* Nút Cấu hình AI & Cá nhân hóa */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                !apiKey.trim()
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 animate-pulse'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
              }`}
              title="Mở Cài đặt & Cá nhân hóa"
            >
              <Settings size={14} className={!apiKey.trim() ? 'text-rose-500' : theme.primaryText} />
              <span className="hidden sm:inline">{apiKey.trim() ? 'Cài đặt' : 'Nhập API Key'}</span>
            </button>

            {/* Nút Bật/Tắt Chế độ Tinh gọn (Zen Mode) */}
            <button
              onClick={() => setIsCompactMode(prev => !prev)}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isCompactMode
                  ? `${theme.softBg} ${theme.primaryText} ${theme.softBorder}`
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title={isCompactMode ? "Tắt chế độ tinh gọn (Alt + Z)" : "Bật chế độ tinh gọn toàn màn hình (Alt + Z)"}
            >
              {isCompactMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Nút Chuyển chế độ Sáng / Tối */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Chuyển chế độ Sáng / Tối"
            >
              {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Thanh Ghim Nhanh (Quick Favorites Bar) */}
        {!isCompactMode && pinnedTabs.length > 0 && (
          <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800/80">
            <QuickFavoritesBar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              pinnedTabs={pinnedTabs}
              onOpenSearch={() => setShowCommandPalette(true)}
              accentColor={accentColor}
            />
          </div>
        )}
      </header>

      {/* =====================================================================
          2. KHÔNG GIAN LÀM VIỆC: SIDEBAR TINH GỌN + WORKSPACE
          ===================================================================== */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Collapsible w-64/w-72 hoặc w-16) */}
        <aside
          className={`shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 z-10 select-none ${
            isSidebarCollapsed ? 'w-16' : 'w-64 sm:w-72'
          }`}
        >
          {/* Header Sidebar */}
          <div className="p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
                <Palette size={13} className={theme.primaryText} />
                Công cụ Đồ họa Toán học
              </span>
            ) : (
              <div className="w-full flex justify-center">
                <Palette size={15} className={theme.primaryText} />
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className={`p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                isSidebarCollapsed ? 'hidden' : ''
              }`}
              title="Thu gọn menu (Alt + B)"
            >
              <ChevronLeft size={15} />
            </button>
          </div>

          {/* Danh mục công cụ Đồ Họa Toán Học */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
            {NAV_CATEGORIES.map(category => (
              <div key={category.id} className="space-y-1">
                {/* Tiêu đề nhóm */}
                {!isSidebarCollapsed ? (
                  <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${theme.primaryText} opacity-90`}>
                    {category.title}
                  </div>
                ) : (
                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                )}

                {/* Các công cụ trong nhóm */}
                {category.tools.map(tool => {
                  const ToolIcon = tool.icon;
                  const isActive = activeTab === tool.id || (tool.id === 'geometry' && (activeTab === 'gsp' || activeTab === 'quick3d'));

                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTab(tool.id)}
                      title={isSidebarCollapsed ? `${tool.label} • ${tool.sub}` : undefined}
                      className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                      } ${
                        isActive
                          ? `${theme.softBg} ${theme.primaryText} border ${theme.softBorder} shadow-2xs ring-1 ${theme.ring}`
                          : 'bg-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <span className={`shrink-0 flex items-center justify-center rounded-lg transition-transform ${
                        isSidebarCollapsed ? 'w-8 h-8' : 'w-7 h-7'
                      } ${
                        isActive 
                          ? `${theme.primaryBg} text-white shadow-2xs scale-105` 
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                      }`}>
                        <ToolIcon size={15} />
                      </span>

                      {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`truncate leading-snug ${
                              isActive ? `${theme.primaryText} font-extrabold` : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {tool.label}
                            </span>
                            {tool.badge && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                isActive
                                  ? `${theme.primaryBg} text-white`
                                  : `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                              }`}>
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {tool.sub}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bridge link to TRO_LI_VAN_BAN */}
          {/* Footer Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Đồ họa Toán học LVP</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                Ctrl+K
              </kbd>
            </div>
          )}
        </aside>

        {/* WORKSPACE AREA (Mở rộng toàn bộ phần còn lại của màn hình) */}
        <main className={`flex-1 overflow-y-auto ${isCompactMode ? 'p-2 sm:p-3' : 'p-3 sm:p-5'}`}>
          <Suspense fallback={<TabLoadingSkeleton title="Đang nạp phân hệ công cụ..." accentColor={accentColor} />}>
            
            {/* NHÓM 1: ĐỒ HỌA TOÁN HỌC */}
            {/* 1.1 ĐỒ THỊ OXY, MIỀN NGHIỆM BPT & TRỤC SỐ */}
            {visitedTabs.has('bbt_graph') && (
              <div className={activeTab === 'bbt_graph' ? 'block animate-fade-in' : 'hidden'}>
                <FunctionGraphTool apiKey={apiKey} model={preferredModel} />
              </div>
            )}

            {/* 1.2 BẢNG BIẾN THIÊN & XÉT DẤU TOÁN HỌC */}
            {visitedTabs.has('bbt') && (
              <div className={activeTab === 'bbt' ? 'block animate-fade-in' : 'hidden'}>
                <TableVariationTool />
              </div>
            )}

            {/* 1.3 BIỂU ĐỒ HỘP & THỐNG KÊ (SGK MỚI) */}
            {visitedTabs.has('statistics') && (
              <div className={activeTab === 'statistics' ? 'block animate-fade-in' : 'hidden'}>
                <StatisticsChartTool />
              </div>
            )}

            {/* 1.4 HÌNH HỌC 2D & 3D (GSP 5 + KHO MẪU HÌNH HỌC) */}
            {(visitedTabs.has('geometry') || visitedTabs.has('gsp') || visitedTabs.has('quick3d')) && (
              <div className={(activeTab === 'geometry' || activeTab === 'gsp' || activeTab === 'quick3d') ? 'block animate-fade-in' : 'hidden'}>
                <CombinedGeometryTab />
              </div>
            )}

            {/* 1.5 GEOGEBRA 3D AI */}
            {visitedTabs.has('geogebra') && (
              <div className={activeTab === 'geogebra' ? 'block animate-fade-in' : 'hidden'}>
                <Geogebra3DTool apiKey={apiKey} model={preferredModel} />
              </div>
            )}

            {/* 1.6 MÔ PHỎNG KHÁI NIỆM TƯƠNG TÁC */}
            {visitedTabs.has('simulation') && (
              <div className={activeTab === 'simulation' ? 'block animate-fade-in' : 'hidden'}>
                <SimulationGenerator apiKey={apiKey} model={preferredModel} />
              </div>
            )}

            {/* 1.7 SƠ ĐỒ CÂY XÁC SUẤT & ĐỊNH LÝ BAYES (TOÁN 12 SGK MỚI) */}
            {visitedTabs.has('probability_tree') && (
              <div className={activeTab === 'probability_tree' ? 'block animate-fade-in' : 'hidden'}>
                <ProbabilityTreeTool />
              </div>
            )}

            {/* 2. HƯỚNG DẪN SỬ DỤNG HỆ THỐNG */}
            {visitedTabs.has('guide') && (
              <div className={activeTab === 'guide' ? 'block animate-fade-in' : 'hidden'}>
                <UserGuide />
              </div>
            )}
          </Suspense>
        </main>
      </div>

      {/* =====================================================================
          3. CÁC MODAL HỆ THỐNG
          ===================================================================== */}
      {/* Quick Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTool={handleSelectTab}
        pinnedTabs={pinnedTabs}
        onTogglePin={handleTogglePin}
        accentColor={accentColor}
      />

      {/* Cài đặt & Cá nhân hóa chuẩn LVP */}
      <PersonalizationModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiKey={apiKey}
        preferredModel={preferredModel}
        onSaveApiKey={handleSaveApiKey}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        accentColor={accentColor}
        onSelectAccentColor={handleSelectAccentColor}
        isCompactMode={isCompactMode}
        onToggleCompactMode={setIsCompactMode}
        pinnedTabs={pinnedTabs}
        onTogglePin={handleTogglePin}
        startupTab={startupTabSetting}
        onSelectStartupTab={handleSelectStartupTab}
      />
    </div>
  );
}
