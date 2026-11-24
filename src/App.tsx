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
GitFork,
LayoutGrid,
Check
} from 'lucide-react';

import { 
AccentColor, 
ACCENT_THEMES, 
TeacherProfile 
} from './types/personalization';
import CommandPalette from './components/CommandPalette';
import PersonalizationModal from './components/PersonalizationModal';
import TabLoadingSkeleton from './components/TabLoadingSkeleton';
import RibbonBar from './components/RibbonBar';
import { CustomDropdownMenu, DropdownMenuItem } from './components/CustomDropdown';

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
| 'bbt_graph'
| 'bbt'
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
}[];
}

// =====================================================================
// DANH MỤC CÔNG CỤ TINH GỌN ĐÚNG TRỌNG TÂM: ĐỒ HỌA TOÁN HỌC
// =====================================================================
export const NAV_CATEGORIES: NavCategory[] = [
{
id: 'do_hoa',
title: 'Công Cụ Đồ Họa Toán Học',
tools: [
{
id: 'bbt_graph',
label: 'Đồ thị, BPT & Trục số',
sub: 'Khảo sát hàm số Oxy, miền nghiệm BPT & trục số',
icon: TrendingUp,
},
{
id: 'bbt',
label: 'Bảng biến thiên & Xét dấu',
sub: 'BBT tự động từ hàm số & BBT tùy biến chuẩn SGK',
icon: Table,
},
{
id: 'statistics',
label: 'Biểu đồ Hộp & Thống kê THPT',
sub: 'Biểu đồ hộp (Box plot) & Thống kê số liệu ghép nhóm GDPT 2018',
icon: BarChart2,
},
{
id: 'geometry',
label: 'Hình học 2D & 3D (GSP)',
sub: 'Vẽ hình học phẳng & không gian GSP Sketchpad',
icon: Compass,
},
{
id: 'geogebra',
label: 'GeoGebra 3D AI',
sub: 'Không gian Oxyz & vật thể tròn xoay',
icon: Layers,
},
{
id: 'simulation',
label: 'Mô phỏng Khái niệm',
sub: 'Minh họa động định lý & khái niệm Toán học',
icon: MonitorPlay,
},
{
id: 'probability_tree',
label: 'Sơ đồ Cây Xác suất',
sub: 'Xác suất có điều kiện, toàn phần & Bayes',
icon: GitFork,
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
sub: 'Tài liệu hướng dẫn, phím tắt & in ấn 300 DPI',
icon: HelpCircle,
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

// 2. Trạng thái Thu gọn Dải công cụ Ribbon (Ctrl + F1)
const [isRibbonCollapsed, setIsRibbonCollapsed] = useState<boolean>(() => {
return localStorage.getItem('lvp_ribbon_collapsed_4') === 'true';
});

// 2b. Toast thông báo Xuất bản Word
const [toastMessage, setToastMessage] = useState<string | null>(null);

// 2c. Trạng thái đồng bộ từ các phân hệ con lên Ribbon Bar
const [graphSubTab, setGraphSubTab] = useState<'graph' | 'inequality' | 'number_line'>('graph');
const [graphFnType, setGraphFnType] = useState<string>('rational_2_1');
const [graphMode, setGraphMode] = useState<'coeffs' | 'text'>('coeffs');

const [bbtMasterMode, setBbtMasterMode] = useState<'auto' | 'variation' | 'sign_chart'>('auto');
const [bbtFnType, setBbtFnType] = useState<'rational_2_1' | 'rational_1_1' | 'cubic' | 'quartic'>('rational_2_1');
const [bbtInputMode, setBbtInputMode] = useState<'coeffs' | 'text'>('coeffs');
const [bbtFont, setBbtFont] = useState<'times' | 'latex'>('times');
const [bbtStroke, setBbtStroke] = useState<'thin' | 'standard' | 'thick'>('standard');
const [bbtIsBold, setBbtIsBold] = useState<boolean>(true);
const [bbtFontSize, setBbtFontSize] = useState<'standard' | 'large' | 'extra'>('large');
const [gspActiveTool, setGspActiveTool] = useState<string>('select');

useEffect(() => {
const handleGspToolChange = (e: Event) => {
const ce = e as CustomEvent;
if (ce.detail?.tool) {
setGspActiveTool(ce.detail.tool);
}
};
window.addEventListener('lvp_gsp_tool_changed', handleGspToolChange);
return () => window.removeEventListener('lvp_gsp_tool_changed', handleGspToolChange);
}, []);

// 3. Chế độ Tinh gọn (Zen / Compact Mode)
const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
return localStorage.getItem('lvp_compact_mode_4') === 'true';
});

// 4. Cá nhân hóa Thầy/Cô (Profile)
const [profile, setProfile] = useState<TeacherProfile>(() => {
try {
const saved = localStorage.getItem('lvp_teacher_profile');
if (saved) {
const parsed = JSON.parse(saved);
if (parsed.school === 'Trường THPT Thạnh Phước' || !parsed.school) {
parsed.school = 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long';
localStorage.setItem('lvp_teacher_profile', JSON.stringify(parsed));
}
return parsed;
}
} catch {}
return {
name: 'GV Lê Vĩnh Phúc',
school: 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long',
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

// Lưu trạng thái thu gọn Ribbon
useEffect(() => {
localStorage.setItem('lvp_ribbon_collapsed_4', isRibbonCollapsed ? 'true' : 'false');
}, [isRibbonCollapsed]);

// Lưu trạng thái compact mode
useEffect(() => {
localStorage.setItem('lvp_compact_mode_4', isCompactMode ? 'true' : 'false');
}, [isCompactMode]);

// Lắng nghe đồng bộ trạng thái từ các phân hệ con lên Ribbon Bar
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

// Lắng nghe phím tắt toàn cục (Ctrl + F1 hoặc Alt + B thu gọn Ribbon kiểu MS Word, Ctrl + K tìm kiếm)
useEffect(() => {
const handleGlobalKeyDown = (e: KeyboardEvent) => {
if (((e.ctrlKey || e.metaKey) && e.key === 'F1') || (e.altKey && e.key.toLowerCase() === 'b')) {
e.preventDefault();
setIsRibbonCollapsed(prev => !prev);
} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
e.preventDefault();
setShowCommandPalette(prev => !prev);
} else if (e.altKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
setIsCompactMode(prev => !prev);
}
};
window.addEventListener('keydown', handleGlobalKeyDown);
return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, []);

// Xử lý các lệnh hành động phát ra từ thanh Ribbon
const handleRibbonAction = (action: { type: string; [key: string]: any }) => {
window.dispatchEvent(new CustomEvent('lvp_ribbon_action', { detail: action }));
if (action.type === 'copy_word') {
setToastMessage('Đã sao chép ảnh 300 DPI! Thầy/Cô mở Word và nhấn phím Ctrl + V để dán ngay.');
setTimeout(() => setToastMessage(null), 4500);
} else if (action.type === 'switch_subtab') {
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

// Danh sách các mục trong Menu sổ dọc tùy biến (Custom Dropdown) chuẩn ARIA
const toolMenuItems: DropdownMenuItem[] = ALL_TOOLS.map((tool, idx) => ({
id: tool.id,
label: tool.label,
subLabel: tool.sub,
icon: tool.icon,
selected: activeTab === tool.id,
divider: idx === 7,
onClick: () => handleSelectTab(tool.id),
}));

return (
<div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#E8E8E8] text-[#242424]'}`}>

{/* =====================================================================
1. TOPBAR CHUẨN OFFICE 365 / FLUENT DESIGN LIGHT THEME
===================================================================== */}
<header className={`sticky top-0 z-30 bg-[#F3F2F1] dark:bg-slate-900 border-b border-[#E1DFDD] dark:border-slate-800 shadow-xs transition-all ${
isCompactMode ? 'py-1 px-3 sm:px-4' : 'py-1.5 px-3 sm:px-5'
}`}>
<div className="flex items-center justify-between gap-3">

{/* Left: Brand Logo + Title + Author info */}
<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
<div className="w-8 h-8 rounded-[4px] bg-[#0F6CBD] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
<Palette size={18} />
</div>

<div className="min-w-0">
<div className="flex items-center gap-2 flex-wrap">
<h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#242424] dark:text-white uppercase truncate">
TRỢ LÝ ĐỒ HỌA TOÁN HỌC
</h1>
<span className="text-[10px] bg-[#EFF6FC] text-[#0F6CBD] dark:bg-sky-950 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded border border-[#0F6CBD]/30">
Office 365 Fluent UI
</span>
</div>
{!isCompactMode && profile.showGreeting && profile.name && (
<div className="flex items-center gap-2 text-[11px] text-[#605E5C] dark:text-slate-400 truncate mt-0.5">
<span className="truncate">
<strong className="text-[#242424] dark:text-slate-200">{profile.name}</strong> ({profile.school})
</span>
</div>
)}
</div>
</div>

{/* Right Action Buttons */}
<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
{/* Menu sổ dọc tùy biến (Custom Dropdown) chuẩn ARIA */}
<CustomDropdownMenu
ariaLabel="Menu chuyển đổi nhanh phân hệ đồ họa Toán học chuẩn ARIA"
label="Phân hệ"
icon={Menu}
items={toolMenuItems}
placement="bottom-right"
menuWidth="w-72 sm:w-80"
buttonClassName="bg-white hover:bg-[#EDEBE9] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#242424] dark:text-slate-200 border border-[#E1DFDD] dark:border-slate-700 rounded-[4px]"
/>

{/* Quick Command Palette Search (Ctrl + K) */}
<button
onClick={() => setShowCommandPalette(true)}
className="flex items-center gap-2 px-3 py-1 rounded-[4px] text-xs font-normal bg-white hover:bg-[#EDEBE9] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#605E5C] dark:text-slate-300 transition cursor-pointer border border-[#E1DFDD] dark:border-slate-700"
title="Tìm nhanh công cụ đồ họa Toán học (Ctrl + K)"
>
<Search size={14} className="text-[#0F6CBD]" />
<span className="hidden md:inline">Tìm kiếm</span>
<kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F3F2F1] dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-700 text-[#605E5C]">
Ctrl K
</kbd>
</button>

{/* Nút Cấu hình AI & Cá nhân hóa */}
<button
onClick={() => setShowSettingsModal(true)}
className={`px-2.5 sm:px-3 py-1 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
!apiKey.trim()
? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
: 'bg-white text-[#242424] border-[#E1DFDD] hover:bg-[#EDEBE9] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
}`}
title="Mở Cài đặt & Cá nhân hóa"
>
<Settings size={14} className={!apiKey.trim() ? 'text-rose-500' : 'text-[#0F6CBD]'} />
<span className="hidden sm:inline">{apiKey.trim() ? 'Cài đặt' : 'Nhập API Key'}</span>
</button>

{/* Nút Bật/Tắt Chế độ Tinh gọn (Zen Mode) */}
<button
onClick={() => setIsCompactMode(prev => !prev)}
className={`p-1.5 rounded-[4px] border transition cursor-pointer ${
isCompactMode
? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
: 'border-[#E1DFDD] dark:border-slate-700 hover:bg-[#EDEBE9] dark:hover:bg-slate-800 text-[#605E5C] dark:text-slate-300 bg-white dark:bg-slate-800'
}`}
title={isCompactMode ? "Tắt chế độ tinh gọn (Alt + Z)" : "Bật chế độ tinh gọn toàn màn hình (Alt + Z)"}
>
{isCompactMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
</button>

{/* Nút Chuyển chế độ Sáng / Tối */}
<button
onClick={() => setIsDarkMode(!isDarkMode)}
className="p-1.5 rounded-[4px] border border-[#E1DFDD] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EDEBE9] dark:hover:bg-slate-700 text-[#605E5C] dark:text-slate-300 transition cursor-pointer"
title="Chuyển chế độ Sáng / Tối"
>
{isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
</button>
</div>
</div>
</header>

{/* =====================================================================
2. THANH CÔNG CỤ RIBBON THEO PHONG CÁCH MICROSOFT WORD (DUY NHẤT & TOÀN DIỆN)
===================================================================== */}
<RibbonBar
activeTab={activeTab}
onSelectTab={handleSelectTab}
isRibbonCollapsed={isRibbonCollapsed}
onToggleRibbonCollapse={() => setIsRibbonCollapsed(prev => !prev)}
accentColor={accentColor}
graphSubTab={graphSubTab}
graphFnType={graphFnType}
graphMode={graphMode}
bbtMasterMode={bbtMasterMode}
bbtFnType={bbtFnType}
bbtInputMode={bbtInputMode}
bbtFont={bbtFont}
bbtStroke={bbtStroke}
bbtIsBold={bbtIsBold}
bbtFontSize={bbtFontSize}
gspActiveTool={gspActiveTool}
onRibbonAction={handleRibbonAction}
/>

{/* =====================================================================
3. VÙNG LÀM VIỆC CHÍNH (DOCUMENT WORKSPACE - NỀN XÁM NHẠT #E8E8E8 + TRANG GIẤY TRẮNG ĐỔ BÓNG A4)
===================================================================== */}
<div className="flex flex-1 overflow-hidden w-full bg-[#E8E8E8] dark:bg-slate-950">
<main className={`flex-1 w-full overflow-y-auto ${isCompactMode ? 'p-2 sm:p-3' : 'p-3 sm:p-5'}`}>
<div className="max-w-[1550px] mx-auto bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)] p-3 sm:p-5 min-h-[calc(100vh-165px)]">
<Suspense fallback={<TabLoadingSkeleton title="Đang nạp phân hệ công cụ..." accentColor={accentColor} />}>

{/* NHÓM 1: ĐỒ HỌA TOÁN HỌC */}
{/* 1.1 ĐỒ THỊ OXY, MIỀN NGHIỆM BPT & TRỤC SỐ */}
{visitedTabs.has('bbt_graph') && (
<div className={activeTab === 'bbt_graph' ? 'block animate-fade-in' : 'hidden'}>
<FunctionGraphTool 
apiKey={apiKey} 
model={preferredModel} 
onNavigateToBBT={() => handleSelectTab('bbt')}
/>
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
</div>
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

{/* Floating Toast Thông báo Sao chép Word 300 DPI */}
{toastMessage && (
<div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in border border-emerald-500">
<Check size={18} className="text-emerald-200 shrink-0" />
<span>{toastMessage}</span>
</div>
)}
</div>
);
}