/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Phân hệ 4: TRỢ LÝ ĐỒ HỌA TOÁN HỌC (GDPT 2018 - KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
 * Bố cục Microsoft Word Ribbon UI 2 tầng chuẩn mực:
 * - Tầng 1: Ribbon Tab Bar (36px, #F3F2F1, nút Tệp, các tab chức năng, gạch chân xanh 3px)
 * - Tầng 2: Ribbon Command Panel (~96px, #FFFFFF, viền #E1DFDD, Command Groups có nhãn 11px ở đáy)
 * - Document Workspace: Nền xám #E8E8E8, trang giấy trắng A4 trung tâm đổ bóng Word nhẹ
 * - Thanh Header & Status Bar thanh lịch (36px Header, 24px Status Bar)
 * Tác giả: GV Lê Vĩnh Phúc (0944405124)
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Palette,
  Settings,
  Moon,
  Sun,
  Menu,
  Search,
  Check,
  TrendingUp,
  Table,
  Compass,
  BarChart2,
  GitFork,
  Layers,
  MonitorPlay,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { 
  AccentColor, 
  ACCENT_THEMES, 
  TeacherProfile 
} from './types/personalization';
import { 
  RibbonTabId, 
  ArtboardDocument, 
  INITIAL_ARTBOARD_DOC 
} from './types/mathArtboard';
import { CustomDropdownMenu, DropdownMenuItem } from './components/CustomDropdown';
import RibbonTabStrip from './components/WordRibbon/RibbonTabStrip';
import RibbonCommandPanel from './components/WordRibbon/RibbonCommandPanel';
import WordStatusBar from './components/StatusBar/WordStatusBar';
import AiProblemParserModal from './components/AiModal/AiProblemParserModal';
import CommandPalette from './components/CommandPalette';
import PersonalizationModal from './components/PersonalizationModal';
import TabLoadingSkeleton from './components/TabLoadingSkeleton';
import { copyAutoCroppedImageToClipboard } from './utils/wordAutoCropExport';

// =====================================================================
// CÁC PHÂN HỆ CỐT LÕI ĐỒ HỌA TOÁN HỌC (300 DPI)
// =====================================================================
const FunctionGraphTool = lazy(() => import('./components/FunctionGraphTool'));
const TableVariationTool = lazy(() => import('./components/TableVariationTool'));
const CombinedGeometryTab = lazy(() => import('./components/CombinedGeometryTab'));
const Geogebra3DTool = lazy(() => import('./components/Geogebra3DTool'));
const SimulationGenerator = lazy(() => import('./components/SimulationGenerator'));
const StatisticsChartTool = lazy(() => import('./components/StatisticsChartTool'));
const ProbabilityTreeTool = lazy(() => import('./components/ProbabilityTreeTool'));
const UserGuide = lazy(() => import('./components/UserGuide'));

export default function App() {
  // 1. Trạng thái Ribbon Tab (Trang chủ, Đồ thị 2D, Bảng biến thiên, Hình phẳng & Lượng giác, Không gian 3D, Thống kê & Xác suất)
  const [activeTab, setActiveTab] = useState<RibbonTabId>('home');
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lvp_ribbon_collapsed_4') === 'true';
  });

  // 2. Trạng thái các tab con bên trong các phân hệ chuyên sâu
  const [space3dSubTool, setSpace3dSubTool] = useState<'geogebra' | 'viewer3d' | 'simulation'>('geogebra');
  const [statsSubTool, setStatsSubTool] = useState<'statistics' | 'tree'>('statistics');

  // 3. Trạng thái tài liệu Artboard Document
  const [doc, setDoc] = useState<ArtboardDocument>(() => {
    try {
      const saved = localStorage.getItem('lvp_artboard_doc_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ARTBOARD_DOC;
  });

  // 4. Trạng thái đồng bộ từ Ribbon xuống các công cụ con
  const [graphSubTab, setGraphSubTab] = useState<'graph' | 'inequality' | 'number_line'>('graph');
  const [graphFnType, setGraphFnType] = useState<string>('cubic');
  const [graphMode, setGraphMode] = useState<'coeffs' | 'text'>('coeffs');
  const [bbtMasterMode, setBbtMasterMode] = useState<'auto' | 'variation' | 'sign_chart'>('auto');
  const [bbtFnType, setBbtFnType] = useState<string>('cubic');
  const [bbtInputMode, setBbtInputMode] = useState<'coeffs' | 'text'>('coeffs');
  const [bbtFont, setBbtFont] = useState<'times' | 'latex'>('times');
  const [bbtStroke, setBbtStroke] = useState<number>(1.5);
  const [bbtIsBold, setBbtIsBold] = useState<boolean>(false);
  const [bbtFontSize, setBbtFontSize] = useState<string>('standard');
  const [gspActiveTool, setGspActiveTool] = useState<string>('select');

  // 5. Trạng thái tọa độ chuột & zoom
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(100);

  // 6. Gemini API & Thông tin giáo viên
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || localStorage.getItem('edtech_gemini_api_key') || '';
  });
  const [preferredModel, setPreferredModel] = useState<string>(() => {
    return localStorage.getItem('gemini_preferred_model') || 'gemini-2.5-flash';
  });
  const [profile, setProfile] = useState<TeacherProfile>(() => {
    try {
      const saved = localStorage.getItem('lvp_teacher_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'GV Lê Vĩnh Phúc',
      school: 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long',
      subject: 'Toán học',
      academicYear: '2026 - 2027',
      showGreeting: true,
    };
  });
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('lvp_accent_color_4') as AccentColor) || 'teal';
  });

  // 7. Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_4') === 'dark' || localStorage.getItem('theme') === 'dark';
  });

  // 8. Modals
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lưu lịch sử tab đã mở để nạp mượt mà
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['home', activeTab]));

  // Đồng bộ theme
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

  // Ghi nhớ tab
  useEffect(() => {
    setVisitedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  // Quản lý chế độ Toàn màn hình
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Phím tắt toàn cục (Ctrl + F1 hoặc Alt + B thu gọn Ribbon, Ctrl + K tìm kiếm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key === 'F1') || (e.altKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        setIsRibbonCollapsed(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lắng nghe trạng thái từ các phân hệ con lên Ribbon Bar
  useEffect(() => {
    const handleGraphState = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) {
        if (ce.detail.activeSubTab) setGraphSubTab(ce.detail.activeSubTab);
        if (ce.detail.graphConfigType) setGraphFnType(ce.detail.graphConfigType);
        if (ce.detail.graphMode) setGraphMode(ce.detail.graphMode);
      }
    };
    const handleBbtState = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) {
        if (ce.detail.masterMode) setBbtMasterMode(ce.detail.masterMode);
        if (ce.detail.autoFnType) setBbtFnType(ce.detail.autoFnType);
        if (ce.detail.autoInputMode) setBbtInputMode(ce.detail.autoInputMode);
        if (ce.detail.fontChoice) setBbtFont(ce.detail.fontChoice);
        if (ce.detail.strokeChoice) setBbtStroke(ce.detail.strokeChoice);
        if (ce.detail.isBoldLabels !== undefined) setBbtIsBold(ce.detail.isBoldLabels);
        if (ce.detail.fontSizeMode) setBbtFontSize(ce.detail.fontSizeMode);
      }
    };
    window.addEventListener('lvp_graph_state_change', handleGraphState);
    window.addEventListener('lvp_bbt_state_change', handleBbtState);
    return () => {
      window.removeEventListener('lvp_graph_state_change', handleGraphState);
      window.removeEventListener('lvp_bbt_state_change', handleBbtState);
    };
  }, []);

  // Xử lý các lệnh hành động phát ra từ thanh Ribbon Command Panel
  const handleRibbonAction = (action: { type: string; [key: string]: any }) => {
    window.dispatchEvent(new CustomEvent('lvp_ribbon_action', { detail: action }));
    if (action.type === 'switch_subtab') {
      setGraphSubTab(action.subtab);
    } else if (action.type === 'switch_bbt_mode') {
      setBbtMasterMode(action.mode);
    } else if (action.type === 'select_fn_type') {
      setBbtFnType(action.fnType);
      setGraphFnType(action.fnType);
    } else if (action.type === 'switch_input_mode') {
      setBbtInputMode(action.inputMode);
      setGraphMode(action.inputMode);
    } else if (action.type === 'set_font') {
      setBbtFont(action.font);
    } else if (action.type === 'set_stroke') {
      setBbtStroke(action.stroke);
    } else if (action.type === 'set_bold') {
      setBbtIsBold(action.bold);
    } else if (action.type === 'set_font_size') {
      setBbtFontSize(action.size);
    } else if (action.type === 'gsp_select_tool') {
      if (action.tool !== 'clear') {
        setGspActiveTool(action.tool);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // =========================================================================
  // XỬ LÝ SAO CHÉP WORD (AUTO-CROP 24PX • 300 DPI)
  // =========================================================================
  const handleCopyWord = async () => {
    // Phát lệnh cho công cụ con tự xuất ảnh chuẩn hoặc quét canvas hiện thời
    handleRibbonAction({ type: 'copy_word' });

    const activeCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const activeSvg = document.getElementById('math-artboard-svg') as SVGSVGElement | null;
    const target = activeCanvas || activeSvg;

    if (target) {
      try {
        await copyAutoCroppedImageToClipboard(target);
        showToast('Đã sao chép ảnh 300 DPI (chuẩn lề 24px)! Thầy/Cô mở Word và nhấn phím Ctrl + V để dán ngay.');
        return;
      } catch {}
    }
    showToast('Đã phát lệnh sao chép 300 DPI. Thầy/Cô nhấn Ctrl + V vào Word để dán ảnh.');
  };

  const handleDownloadPng = () => {
    handleRibbonAction({ type: 'download_png' });
    showToast('Đang tải ảnh PNG 300 DPI chuẩn Word...');
  };

  const handleDownloadSvg = () => {
    handleRibbonAction({ type: 'download_svg' });
    showToast('Đang tải vector SVG sắc nét...');
  };

  // Thao tác Tệp (File Menu)
  const handleNewFile = () => {
    if (window.confirm('Thầy/Cô có muốn tạo mới bản vẽ? Dữ liệu hiện tại sẽ được làm mới.')) {
      setDoc(INITIAL_ARTBOARD_DOC);
      handleRibbonAction({ type: 'gsp_select_tool', tool: 'clear' });
      showToast('Đã tạo dự án mới.');
    }
  };

  const handleSaveFile = () => {
    const jsonStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DuAn_DoHoaToan_${activeTab}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã lưu tệp dự án (.json) offline thành công.');
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const loaded = JSON.parse(ev.target?.result as string);
          if (loaded) {
            setDoc(loaded);
            showToast('Đã mở dự án thành công.');
          }
        } catch {
          alert('Tệp JSON không hợp lệ.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Áp dụng kết quả từ Dán đề (AI)
  const handleApplyAiResult = (category: string, config: any) => {
    if (category === 'graph_2d') {
      setActiveTab('graph_2d');
      if (config.graph2D?.type) setGraphFnType(config.graph2D.type);
    } else if (category === 'bbt') {
      setActiveTab('bbt');
    } else if (category === 'space_3d') {
      setActiveTab('space_3d');
    } else if (category === 'plane_trig') {
      setActiveTab('plane_trig');
    } else if (category === 'stats_prob') {
      setActiveTab('stats_prob');
    }
    showToast('AI đã hoàn tất dựng hình tự động từ đề bài!');
  };

  // Menu sổ dọc Phân hệ (chuẩn ARIA)
  const toolMenuItems: DropdownMenuItem[] = [
    {
      id: 'tab_home',
      label: 'Trang chủ (Tổng quan)',
      subLabel: 'Màn hình bắt đầu & công cụ nhanh',
      icon: Palette,
      selected: activeTab === 'home',
      onClick: () => setActiveTab('home'),
    },
    {
      id: 'tab_graph',
      label: 'Đồ thị 2D & Tích phân',
      subLabel: 'Khảo sát hàm số, Oxy, miền nghiệm BPT, trục số',
      icon: TrendingUp,
      selected: activeTab === 'graph_2d',
      onClick: () => setActiveTab('graph_2d'),
    },
    {
      id: 'tab_bbt',
      label: 'Bảng biến thiên & Xét dấu',
      subLabel: 'BBT tự động & BBT tùy biến chuẩn SGK',
      icon: Table,
      selected: activeTab === 'bbt',
      onClick: () => setActiveTab('bbt'),
    },
    {
      id: 'tab_plane',
      label: 'Hình phẳng & Lượng giác',
      subLabel: 'GSP Sketchpad Web & Đường tròn lượng giác',
      icon: Compass,
      selected: activeTab === 'plane_trig',
      onClick: () => setActiveTab('plane_trig'),
    },
    {
      id: 'tab_space',
      label: 'Không gian 3D & Oxyz',
      subLabel: 'GeoGebra 3D AI Studio & Khối 3D xoay 360°',
      icon: Layers,
      selected: activeTab === 'space_3d',
      onClick: () => setActiveTab('space_3d'),
    },
    {
      id: 'tab_stats',
      label: 'Thống kê & Xác suất',
      subLabel: 'Biểu đồ hộp (Box-plot), Histogram, Cây Bayes',
      icon: BarChart2,
      selected: activeTab === 'stats_prob',
      onClick: () => setActiveTab('stats_prob'),
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#E8E8E8] text-[#242424]'}`}>
      
      {/* =====================================================================
          1. THANH HEADER TRÊN CÙNG (36PX - THANH LỊCH & TINH GỌN CHUẨN FLUENT)
          ===================================================================== */}
      <header className="h-[36px] min-h-[36px] px-3 sm:px-4 bg-[#F3F2F1] dark:bg-slate-900 border-b border-[#E1DFDD] dark:border-slate-800 flex items-center justify-between select-none z-30">
        {/* Bên trái: Tên ứng dụng thanh lịch & Thông tin tác giả */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-[3px] bg-[#0F6CBD] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Palette size={13} />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#242424] dark:text-white uppercase truncate leading-none">
                TRỢ LÝ ĐỒ HỌA TOÁN HỌC
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-[#0F6CBD] bg-[#EFF6FC] dark:bg-sky-950/60 dark:text-sky-300 px-1.5 py-0.2 rounded border border-[#C7E0F4] dark:border-sky-800">
                Office 365 Fluent UI
              </span>
            </div>
            <span className="hidden xl:inline-block text-[10px] text-[#605E5C] dark:text-slate-400 font-normal truncate leading-tight">
              GV Lê Vĩnh Phúc (Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long)
            </span>
          </div>
        </div>

        {/* Bên phải: Các nút dạng Pill bo tròn thanh lịch */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Menu sổ dọc Phân hệ chuẩn ARIA */}
          <CustomDropdownMenu
            ariaLabel="Menu chuyển đổi nhanh phân hệ đồ họa Toán học chuẩn ARIA"
            label="Phân hệ"
            icon={Menu}
            items={toolMenuItems}
            placement="bottom-right"
            menuWidth="w-72 sm:w-80"
            buttonClassName="h-[26px] bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#242424] dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 rounded-full shadow-2xs px-3 text-xs"
          />

          {/* Quick Search Ctrl + K */}
          <button
            type="button"
            onClick={() => setShowCommandPalette(true)}
            className="h-[26px] flex items-center gap-1.5 px-3 rounded-full text-xs font-medium bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-[#E1DFDD] dark:border-slate-700 shadow-2xs"
            title="Tìm nhanh công cụ đồ họa Toán học (Ctrl + K)"
          >
            <Search size={13} className="text-[#0F6CBD]" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 text-slate-500">
              Ctrl K
            </kbd>
          </button>

          {/* Cài đặt & Khóa API */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="h-[26px] px-2.5 rounded-full text-xs font-medium bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 shadow-2xs flex items-center gap-1 cursor-pointer relative"
            title="Cài đặt hệ thống & Khóa API Gemini"
          >
            <Settings size={13} className="text-[#0F6CBD]" />
            <span className="hidden md:inline">Cài đặt</span>
            {!apiKey.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse" />
            )}
          </button>

          {/* Toàn màn hình */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-[26px] w-[26px] rounded-full border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] dark:hover:bg-slate-700 text-[#605E5C] dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Sáng / Tối */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-[26px] w-[26px] rounded-full border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] dark:hover:bg-slate-700 text-[#605E5C] dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="Chuyển chế độ Sáng / Tối"
          >
            {isDarkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. THANH RIBBON 2 TẦNG CỐ ĐỊNH Ở TRÊN CÙNG (TOP 2-TIER RIBBON)
          ===================================================================== */}
      <div className="sticky top-0 z-20 shadow-xs">
        {/* TẦNG 1: RIBBON TAB BAR (36PX, NỀN #F3F2F1, GẠCH CHÂN XANH #0F6CBD DÀY 3PX) */}
        <RibbonTabStrip
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isRibbonCollapsed={isRibbonCollapsed}
          onToggleRibbonCollapse={() => setIsRibbonCollapsed(prev => !prev)}
          hasSelectedElement={Boolean(doc.selectedElementId)}
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onSaveFile={handleSaveFile}
          onExportPng={handleDownloadPng}
          onExportSvg={handleDownloadSvg}
          onPrint={() => window.print()}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* TẦNG 2: RIBBON COMMAND PANEL (~96PX, NỀN TRẮNG #FFFFFF, VIỀN #E1DFDD) */}
        {!isRibbonCollapsed && (
          <RibbonCommandPanel
            activeTab={activeTab}
            doc={doc}
            onUpdateDoc={setDoc}
            onUndo={() => handleRibbonAction({ type: 'undo' })}
            onRedo={() => handleRibbonAction({ type: 'redo' })}
            onCopyWord={handleCopyWord}
            onDownloadPng={handleDownloadPng}
            onDownloadSvg={handleDownloadSvg}
            onOpenAiModal={() => setShowAiModal(true)}
            onSelectTemplate={(cat, presetKey) => {
              if (cat === 'graph_2d') {
                setActiveTab('graph_2d');
                handleRibbonAction({ type: 'select_fn_type', fnType: presetKey });
              } else if (cat === 'bbt') {
                setActiveTab('bbt');
                handleRibbonAction({ type: 'select_bbt_preset', presetKey });
              } else if (cat === 'plane_trig') {
                setActiveTab('plane_trig');
                handleRibbonAction({ type: 'gsp_load_sample', sample: presetKey });
              } else if (cat === 'space_3d') {
                setActiveTab('space_3d');
                handleRibbonAction({ type: 'geogebra_select_object', obj: presetKey });
              } else if (cat === 'stats_prob') {
                setActiveTab('stats_prob');
                handleRibbonAction({ type: 'select_stat_chart', chart: presetKey });
              }
            }}
            onRibbonAction={handleRibbonAction}
            graphSubTab={graphSubTab}
            bbtMasterMode={bbtMasterMode}
            bbtIsBold={bbtIsBold}
            bbtStroke={bbtStroke}
            gspActiveTool={gspActiveTool}
            space3dTool={space3dSubTool}
            statsTool={statsSubTool}
            onSetSpace3dTool={setSpace3dSubTool}
            onSetStatsTool={setStatsSubTool}
          />
        )}
      </div>

      {/* =====================================================================
          3. VÙNG LÀM VIỆC CHÍNH (DOCUMENT WORKSPACE) - TINH GIẢN & THOÁNG MẮT
          Nền xám nhạt #E8E8E8, khung trang giấy trắng A4 ở chính giữa đổ bóng nhẹ
          ===================================================================== */}
      <div className="flex-1 flex overflow-hidden w-full bg-[#E8E8E8] dark:bg-slate-950">
        <main className="flex-1 w-full overflow-y-auto p-3 sm:p-5 custom-scrollbar">
          <div className="max-w-[1550px] mx-auto bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)] p-3 sm:p-5 min-h-[calc(100vh-175px)]">
            <Suspense fallback={<TabLoadingSkeleton title="Đang nạp phân hệ toán học..." accentColor={accentColor} />}>

              {/* 3.1 TAB TRANG CHỦ (HOME) - TỔNG QUAN TINH GIẢN & ĐIỀU HƯỚNG NHANH */}
              {activeTab === 'home' && (
                <div className="space-y-6 py-4 px-2 max-w-5xl mx-auto animate-fade-in">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0F6CBD] dark:text-blue-300 text-xs font-bold">
                        <Sparkles size={13} />
                        <span>Chương trình GDPT 2018 • Kết nối tri thức với cuộc sống</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                        Hệ Thống Trợ Lý Đồ Họa Toán Học THPT
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                        Chuyên biệt hỗ trợ giáo viên tạo nhanh hình vẽ vector, đồ thị Oxy, bảng biến thiên, không gian Oxyz và biểu đồ thống kê <strong>chuẩn 300 DPI, chừa lề 24px</strong> để dán trực tiếp vào đề thi Word (Ctrl + V).
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="px-5 py-2.5 bg-[#0F6CBD] hover:bg-[#115EA3] active:bg-[#0C5494] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Sparkles size={15} />
                        <span>Dán đề (AI) tự dựng hình</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('graph_2d')}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#242424] dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                      >
                        <span>Bắt đầu vẽ đồ thị 2D</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 5 Thẻ phân hệ chính (Truy cập 1-Click) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        tab: 'graph_2d' as RibbonTabId,
                        title: 'Đồ thị 2D & Tích phân',
                        desc: 'Khảo sát hàm số, trục Oxy, tiếp tuyến, tiệm cận, miền nghiệm BPT, diện tích tích phân.',
                        icon: TrendingUp,
                        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
                      },
                      {
                        tab: 'bbt' as RibbonTabId,
                        title: 'Bảng biến thiên & Xét dấu',
                        desc: 'BBT tự động từ hàm số và tùy biến tự do. Hỗ trợ tam thức bậc 2, bậc 3, phân thức 1/1, 2/1.',
                        icon: Table,
                        color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
                      },
                      {
                        tab: 'plane_trig' as RibbonTabId,
                        title: 'Hình phẳng & Lượng giác',
                        desc: 'GSP Sketchpad Web, đường tròn lượng giác đầy đủ, trục số khoảng/đoạn và kho mẫu phẳng.',
                        icon: Compass,
                        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
                      },
                      {
                        tab: 'space_3d' as RibbonTabId,
                        title: 'Không gian 3D & Oxyz',
                        desc: 'GeoGebra 3D AI Studio, khối chóp, lăng trụ, nón, trụ, cầu và mô hình xoay 360 độ tương tác.',
                        icon: Layers,
                        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
                      },
                      {
                        tab: 'stats_prob' as RibbonTabId,
                        title: 'Thống kê & Xác suất',
                        desc: 'Biểu đồ hộp (Box-plot), Histogram ghép nhóm, Sơ đồ cây Bayes và biểu đồ Ven chuẩn GDPT 2018.',
                        icon: BarChart2,
                        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
                      },
                      {
                        tab: 'home' as RibbonTabId,
                        title: 'Hướng dẫn sử dụng',
                        desc: 'Tài liệu hướng dẫn chi tiết cách dựng hình và mẹo xuất ảnh đẹp chuẩn đề thi THPT.',
                        icon: HelpCircle,
                        color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
                        onClick: () => setShowCommandPalette(true),
                      },
                    ].map((card, idx) => {
                      const CardIcon = card.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => card.onClick ? card.onClick() : setActiveTab(card.tab)}
                          className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:shadow-md hover:border-[#0F6CBD]/40 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} group-hover:scale-105 transition-transform`}>
                              <CardIcon size={20} />
                            </div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#0F6CBD] transition-colors">
                              {card.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {card.desc}
                            </p>
                          </div>
                          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-[#0F6CBD]">
                            <span>Mở phân hệ</span>
                            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3.2 TAB ĐỒ THỊ 2D & TÍCH PHÂN */}
              {visitedTabs.has('graph_2d') && (
                <div className={activeTab === 'graph_2d' ? 'block animate-fade-in' : 'hidden'}>
                  <FunctionGraphTool 
                    apiKey={apiKey} 
                    model={preferredModel} 
                    onNavigateToBBT={() => setActiveTab('bbt')}
                  />
                </div>
              )}

              {/* 3.3 TAB BẢNG BIẾN THIÊN & XÉT DẤU */}
              {visitedTabs.has('bbt') && (
                <div className={activeTab === 'bbt' ? 'block animate-fade-in' : 'hidden'}>
                  <TableVariationTool />
                </div>
              )}

              {/* 3.4 TAB HÌNH PHẲNG & LƯỢNG GIÁC (GSP SKETCHPAD WEB) */}
              {visitedTabs.has('plane_trig') && (
                <div className={activeTab === 'plane_trig' ? 'block animate-fade-in' : 'hidden'}>
                  <CombinedGeometryTab />
                </div>
              )}

              {/* 3.5 TAB KHÔNG GIAN 3D & OXYZ (GEOGEBRA 3D AI STUDIO & MÔ PHỎNG) */}
              {visitedTabs.has('space_3d') && (
                <div className={activeTab === 'space_3d' ? 'block animate-fade-in space-y-3' : 'hidden'}>
                  {/* Thanh chuyển đổi phân hệ Không gian 3D tinh gọn */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#E1DFDD] dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSpace3dSubTool('geogebra')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                          space3dSubTool === 'geogebra'
                            ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#424242] dark:text-slate-200 border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9]'
                        }`}
                      >
                        <Layers size={14} />
                        <span>GeoGebra 3D AI Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpace3dSubTool('simulation')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                          space3dSubTool === 'simulation'
                            ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#424242] dark:text-slate-200 border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9]'
                        }`}
                      >
                        <MonitorPlay size={14} />
                        <span>Mô phỏng Khái niệm tương tác</span>
                      </button>
                    </div>
                  </div>

                  {space3dSubTool === 'geogebra' ? (
                    <Geogebra3DTool apiKey={apiKey} model={preferredModel} />
                  ) : (
                    <SimulationGenerator apiKey={apiKey} model={preferredModel} />
                  )}
                </div>
              )}

              {/* 3.6 TAB THỐNG KÊ & XÁC SUẤT */}
              {visitedTabs.has('stats_prob') && (
                <div className={activeTab === 'stats_prob' ? 'block animate-fade-in space-y-3' : 'hidden'}>
                  {/* Thanh chuyển đổi Thống kê & Xác suất tinh gọn */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#E1DFDD] dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStatsSubTool('statistics')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                          statsSubTool === 'statistics'
                            ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#424242] dark:text-slate-200 border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9]'
                        }`}
                      >
                        <BarChart2 size={14} />
                        <span>Biểu đồ Hộp & Thống kê THPT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatsSubTool('tree')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                          statsSubTool === 'tree'
                            ? 'bg-[#0F6CBD] text-white border-[#0F6CBD] shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-[#424242] dark:text-slate-200 border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9]'
                        }`}
                      >
                        <GitFork size={14} />
                        <span>Sơ đồ Cây Xác suất & Bayes</span>
                      </button>
                    </div>
                  </div>

                  {statsSubTool === 'statistics' ? (
                    <StatisticsChartTool />
                  ) : (
                    <ProbabilityTreeTool />
                  )}
                </div>
              )}

              {/* 3.7 TAB FORMAT (CONTEXTUAL TAB) */}
              {activeTab === 'format' && (
                <div className="p-8 text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0F6CBD] flex items-center justify-center mx-auto">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Bảng định dạng đối tượng đang chọn
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Thầy/Cô có thể điều chỉnh in đậm, in nghiêng biến số x, y, thay đổi cỡ chữ và màu nét trực tiếp trên thanh Ribbon phía trên.
                  </p>
                </div>
              )}

            </Suspense>
          </div>
        </main>
      </div>

      {/* =====================================================================
          4. THANH TRẠNG THÁI DƯỚI CÙNG (WORD STATUS BAR - 24PX - THANH LỊCH)
          ===================================================================== */}
      <WordStatusBar
        cursorX={cursorCoords.x}
        cursorY={cursorCoords.y}
        zoom={zoom}
        onZoomChange={setZoom}
        statusText="Sẵn sàng (Offline • 300 DPI • Lề 24px)"
      />

      {/* =====================================================================
          5. CÁC MODAL HỆ THỐNG
          ===================================================================== */}
      {/* Modal Dán đề (AI) */}
      <AiProblemParserModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyResult={handleApplyAiResult}
        apiKey={apiKey}
      />

      {/* Command Palette Ctrl + K */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTool={(toolId) => {
          setShowCommandPalette(false);
          if (toolId === 'bbt_graph') setActiveTab('graph_2d');
          else if (toolId === 'bbt') setActiveTab('bbt');
          else if (toolId === 'geometry') setActiveTab('plane_trig');
          else if (toolId === 'geogebra') {
            setActiveTab('space_3d');
            setSpace3dSubTool('geogebra');
          } else if (toolId === 'simulation') {
            setActiveTab('space_3d');
            setSpace3dSubTool('simulation');
          } else if (toolId === 'statistics') {
            setActiveTab('stats_prob');
            setStatsSubTool('statistics');
          } else if (toolId === 'probability_tree') {
            setActiveTab('stats_prob');
            setStatsSubTool('tree');
          }
        }}
        pinnedTabs={['bbt_graph', 'bbt', 'geometry', 'geogebra']}
        onTogglePin={() => {}}
        accentColor={accentColor}
      />

      {/* Cài đặt & Khóa API */}
      <PersonalizationModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiKey={apiKey}
        preferredModel={preferredModel}
        onSaveApiKey={(key, model) => {
          localStorage.setItem('gemini_api_key', key);
          localStorage.setItem('gemini_preferred_model', model);
          setApiKey(key);
          setPreferredModel(model);
          showToast('Đã lưu cài đặt API Key thành công!');
        }}
        profile={profile}
        onSaveProfile={(newProf) => {
          localStorage.setItem('lvp_teacher_profile', JSON.stringify(newProf));
          setProfile(newProf);
        }}
        accentColor={accentColor}
        onSelectAccentColor={(c) => {
          localStorage.setItem('lvp_accent_color_4', c);
          setAccentColor(c);
        }}
        isCompactMode={false}
        onToggleCompactMode={() => {}}
        pinnedTabs={['bbt_graph', 'bbt', 'geometry', 'geogebra']}
        onTogglePin={() => {}}
        startupTab="home"
        onSelectStartupTab={() => {}}
      />

      {/* Toast thông báo sao chép ảnh 300 DPI thành công */}
      {toastMessage && (
        <div 
          role="alert"
          aria-live="polite"
          className="fixed bottom-8 right-6 z-50 bg-[#0F6CBD] text-white px-4 py-2.5 rounded-[6px] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150 border border-blue-400"
        >
          <Check size={16} className="text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
