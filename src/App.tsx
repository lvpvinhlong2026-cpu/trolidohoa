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
import RibbonTabStrip from './components/WordRibbon/RibbonTabStrip';
import RibbonCommandPanel from './components/WordRibbon/RibbonCommandPanel';
import WordStatusBar from './components/StatusBar/WordStatusBar';
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
const TrigAngleTool = lazy(() => import('./components/TrigAngleTool'));
const StatisticsChartTool = lazy(() => import('./components/StatisticsChartTool'));
const ProbabilityTreeTool = lazy(() => import('./components/ProbabilityTreeTool'));
const UserGuide = lazy(() => import('./components/UserGuide'));

export type TabId = 'home' | 'bbt_graph' | 'bbt' | 'geometry' | 'trig_angle' | 'statistics' | 'probability_tree' | 'geogebra' | 'simulation' | 'guide' | 'gsp' | 'quick3d';

export default function App() {
  // 1. Trạng thái Ribbon Tab (Đồ thị 2D, Bảng biến thiên, Hình phẳng & Lượng giác, Không gian 3D, Thống kê & Xác suất)
  const [activeTab, setActiveTab] = useState<RibbonTabId>('graph_2d');
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lvp_ribbon_collapsed_4') === 'true';
  });

  // 2. Trạng thái các tab con bên trong các phân hệ chuyên sâu
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

  // 6. Thông tin giáo viên & giao diện
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
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lưu lịch sử tab đã mở để nạp mượt mà
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['graph_2d']));

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
    } else if (action.type === 'switch_to_number_line') {
      setActiveTab('graph_2d');
      setGraphSubTab('number_line');
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
    const activeSvg = document.getElementById('math-artboard-svg') as unknown as SVGSVGElement | null;
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#E8E8E8] text-[#242424]'}`}>
      
      {/* =====================================================================
          1. THANH HEADER TRÊN CÙNG (36PX - THANH LỊCH & TINH GỌN CHUẨN FLUENT)
          ===================================================================== */}
      <header className="h-[38px] min-h-[38px] px-3 sm:px-4 bg-[#F3F2F1] dark:bg-slate-900 border-b border-[#E1DFDD] dark:border-slate-800 flex items-center justify-between select-none z-30">
        {/* Bên trái: Tên ứng dụng thanh lịch & Thông tin tác giả */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-[3px] bg-[#0F6CBD] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Palette size={13} />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#242424] dark:text-white uppercase truncate leading-none">
                TRỢ LÍ ĐỒ HỌA TOÁN HỌC
              </h1>
            </div>
            <span className="text-[10px] text-[#605E5C] dark:text-slate-400 font-semibold uppercase truncate leading-tight mt-0.5">
              GV: LÊ VĨNH PHÚC
            </span>
          </div>
        </div>

        {/* Bên phải: Các nút dạng Pill bo tròn thanh lịch */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cài đặt */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="h-[26px] px-2.5 rounded-full text-xs font-medium bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 shadow-2xs flex items-center gap-1 cursor-pointer relative"
            title="Cài đặt & Cá nhân hóa"
          >
            <Settings size={13} className="text-[#0F6CBD]" />
            <span className="hidden md:inline">Cài đặt</span>
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
              } else if (cat === 'trig_angle') {
                setActiveTab('trig_angle');
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
            statsTool={statsSubTool}
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

              {/* 3.1 TAB ĐỒ THỊ 2D & TÍCH PHÂN */}
              {visitedTabs.has('graph_2d') && (
                <div className={activeTab === 'graph_2d' ? 'block animate-fade-in' : 'hidden'}>
                  <FunctionGraphTool 
                    onNavigateToBBT={() => setActiveTab('bbt')}
                    subTab={graphSubTab}
                    onSubTabChange={setGraphSubTab}
                  />
                </div>
              )}

              {/* 3.3 TAB BẢNG BIẾN THIÊN & XÉT DẤU */}
              {visitedTabs.has('bbt') && (
                <div className={activeTab === 'bbt' ? 'block animate-fade-in' : 'hidden'}>
                  <TableVariationTool />
                </div>
              )}

              {/* 3.4 TAB HÌNH HỌC PHẲNG (GSP SKETCHPAD WEB) */}
              {visitedTabs.has('plane_trig') && (
                <div className={activeTab === 'plane_trig' ? 'block animate-fade-in' : 'hidden'}>
                  <CombinedGeometryTab />
                </div>
              )}

              {/* 3.5 TAB GÓC LƯỢNG GIÁC (SGK TOÁN 11 GDPT 2018) */}
              {visitedTabs.has('trig_angle') && (
                <div className={activeTab === 'trig_angle' ? 'block animate-fade-in' : 'hidden'}>
                  <TrigAngleTool />
                </div>
              )}

              {/* 3.4 TAB THỐNG KÊ & XÁC SUẤT */}
              {visitedTabs.has('stats_prob') && (
                <div className={activeTab === 'stats_prob' ? 'block animate-fade-in' : 'hidden'}>
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
      {/* Command Palette Ctrl + K */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTool={(toolId) => {
          setShowCommandPalette(false);
          if (toolId === 'bbt_graph') setActiveTab('graph_2d');
          else if (toolId === 'bbt') setActiveTab('bbt');
          else if (toolId === 'geometry') setActiveTab('plane_trig');
          else if (toolId === 'trig_angle') setActiveTab('trig_angle');
          else if (toolId === 'statistics') {
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

      {/* Cài đặt & Cá nhân hóa */}
      <PersonalizationModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        profile={profile}
        onSaveProfile={(newProf) => {
          localStorage.setItem('lvp_teacher_profile', JSON.stringify(newProf));
          setProfile(newProf);
          showToast('Đã lưu cấu hình thành công!');
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
