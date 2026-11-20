import React, { useState } from 'react';
import { 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Zap, 
  Brain, 
  ShieldCheck, 
  Settings, 
  User, 
  Palette, 
  Star, 
  X, 
  Sliders, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Layers,
  Monitor
} from 'lucide-react';
import { 
  AccentColor, 
  ACCENT_THEMES, 
  TeacherProfile, 
  PersonalizationSettings 
} from '../types/personalization';
import { SEARCHABLE_TOOLS } from './CommandPalette';
import { TabId } from '../App';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  preferredModel: string;
  onSaveApiKey: (key: string, model: string) => void;
  profile: TeacherProfile;
  onSaveProfile: (profile: TeacherProfile) => void;
  accentColor: AccentColor;
  onSelectAccentColor: (color: AccentColor) => void;
  isCompactMode: boolean;
  onToggleCompactMode: (compact: boolean) => void;
  pinnedTabs: string[];
  onTogglePin: (toolId: string) => void;
  startupTab: string;
  onSelectStartupTab: (tabId: string) => void;
}

export default function PersonalizationModal({
  isOpen,
  onClose,
  apiKey,
  preferredModel,
  onSaveApiKey,
  profile,
  onSaveProfile,
  accentColor,
  onSelectAccentColor,
  isCompactMode,
  onToggleCompactMode,
  pinnedTabs,
  onTogglePin,
  startupTab,
  onSelectStartupTab,
}: PersonalizationModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'profile' | 'theme' | 'favorites'>('ai');

  // AI settings local state
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(preferredModel || 'auto');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile local state
  const [nameInput, setNameInput] = useState(profile.name || 'GV Lê Vĩnh Phúc');
  const [schoolInput, setSchoolInput] = useState(profile.school === 'Trường THPT Thạnh Phước' ? 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long' : (profile.school || 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long'));
  const [subjectInput, setSubjectInput] = useState(profile.subject || 'Toán học');
  const [academicYearInput, setAcademicYearInput] = useState(profile.academicYear || '2026 - 2027');
  const [showGreetingInput, setShowGreetingInput] = useState(profile.showGreeting ?? true);

  const theme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.teal;

  const models = [
    { 
      id: 'auto', 
      name: 'Tự động thông minh (Khuyên dùng trong Hệ sinh thái LVP)', 
      desc: 'Tự động chọn mô hình tối ưu nhất (Gemini 3 Flash/Pro). Khi Google AI quá tải, tự động chuyển sang Gemini 2.5/2.0 Flash không làm gián đoạn bài giảng.', 
      badge: 'Khuyên dùng',
      icon: Sparkles,
      iconColor: 'text-teal-500'
    },
    { 
      id: 'gemini-3-flash-preview', 
      name: 'Gemini 3 Flash (Thế hệ 3 Mới nhất - Siêu tốc & Thông minh)', 
      desc: 'Tốc độ phản hồi tức thì, tối ưu xử lý hình học Oxyz, đồ thị Oxy và phân tích văn bản sư phạm.', 
      badge: 'Thế hệ 3',
      icon: Zap,
      iconColor: 'text-amber-500'
    },
    { 
      id: 'gemini-3-pro-preview', 
      name: 'Gemini 3 Pro (Trí tuệ Nhân tạo Đỉnh cao - Suy luận chuyên sâu)', 
      desc: 'Khả năng giải toán chuyên sâu, dựng hình GeoGebra 3D phức tạp và soạn kế hoạch bài dạy 5512 xuất sắc.', 
      badge: 'Chuyên sâu',
      icon: Brain,
      iconColor: 'text-purple-500'
    },
    { 
      id: 'gemini-2.5-flash', 
      name: 'Gemini 2.5 Flash (Cực kỳ Ổn định 24/7)', 
      desc: 'Hoạt động liên tục, hạn ngạch rộng lớn, không bao giờ bị nghẽn mạng khi chuyển đổi file Word hay PDF.', 
      badge: 'Ổn định',
      icon: ShieldCheck,
      iconColor: 'text-emerald-500'
    },
    { 
      id: 'gemini-2.0-flash', 
      name: 'Gemini 2.0 Flash (Bền bỉ)', 
      desc: 'Mô hình thế hệ 2 tốc độ cao, phương án dự phòng tin cậy.', 
      badge: '',
      icon: ShieldCheck,
      iconColor: 'text-blue-500'
    }
  ];

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Save AI Key
    const trimmedKey = keyInput.trim();
    onSaveApiKey(trimmedKey, modelInput);

    // 2. Save Profile
    onSaveProfile({
      name: nameInput.trim() || 'GV Lê Vĩnh Phúc',
      school: schoolInput.trim() || 'Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long',
      subject: subjectInput.trim() || 'Toán học',
      academicYear: academicYearInput.trim() || '2026 - 2027',
      showGreeting: showGreetingInput,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center shadow-xs`}>
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Trung tâm Cài đặt & Cá nhân hóa
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Tùy biến hệ thống đồ họa Toán học theo phong cách của Thầy/Cô
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 sm:px-5 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'ai'
                ? `${theme.primaryBorder} ${theme.primaryText}`
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            <span>Cấu hình AI (Gemini)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'profile'
                ? `${theme.primaryBorder} ${theme.primaryText}`
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User size={14} />
            <span>Hồ sơ Thầy/Cô</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'theme'
                ? `${theme.primaryBorder} ${theme.primaryText}`
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Palette size={14} />
            <span>Màu sắc & Tinh gọn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'favorites'
                ? `${theme.primaryBorder} ${theme.primaryText}`
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Star size={14} />
            <span>Ghim yêu thích ({pinnedTabs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: CẤU HÌNH AI */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Khóa API Gemini (Dùng chung cho toàn bộ Hệ sinh thái LVP)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="Dán API Key AIzaSy... từ Google AI Studio"
                    className={`w-full pl-3.5 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs ${theme.ring} focus:ring-2 outline-none transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                  <span>Khóa được lưu cục bộ trên máy của Thầy/Cô, hoàn toàn bảo mật.</span>
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.primaryText} font-semibold hover:underline`}
                  >
                    Lấy API Key miễn phí →
                  </a>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chọn dòng mô hình AI mặc định
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {models.map(m => {
                    const Icon = m.icon;
                    const isSelected = modelInput === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModelInput(m.id)}
                        className={`p-3 text-left border rounded-2xl flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? `${theme.softBg} ${theme.primaryBorder} ring-1 ${theme.primaryBorder}`
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <Icon size={16} className={m.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? theme.primaryText : 'text-slate-800 dark:text-slate-100'}`}>
                              {m.name}
                            </span>
                            {m.badge && (
                              <span className={`text-[9px] px-2 py-0.2 rounded-full font-extrabold uppercase ${
                                isSelected
                                  ? `${theme.badgeBg} ${theme.badgeText}`
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                            {m.desc}
                          </p>
                        </div>
                        {isSelected && <Check size={16} className={`${theme.primaryText} shrink-0 mt-0.5`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HỒ SƠ THẦY/CÔ */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <GraduationCap size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Thông tin hồ sơ sẽ được tự động đồng bộ khi xuất <strong>Giáo án CV 5512</strong>, <strong>Đề kiểm tra chuẩn hóa</strong>, <strong>Slide bài giảng PPTX</strong> và <strong>Poster thông báo</strong>.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Họ và tên Thầy/Cô
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="VD: GV Lê Vĩnh Phúc"
                    className={`w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs ${theme.ring} focus:ring-2 outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Trường học / Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={schoolInput}
                    onChange={e => setSchoolInput(e.target.value)}
                    placeholder="VD: Trường THPT Lê Hoàng Chiếu, tỉnh Vĩnh Long"
                    className={`w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs ${theme.ring} focus:ring-2 outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Môn học giảng dạy
                  </label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    placeholder="VD: Toán học"
                    className={`w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs ${theme.ring} focus:ring-2 outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Niên khóa / Năm học
                  </label>
                  <input
                    type="text"
                    value={academicYearInput}
                    onChange={e => setAcademicYearInput(e.target.value)}
                    placeholder="VD: 2026 - 2027"
                    className={`w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs ${theme.ring} focus:ring-2 outline-none`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Hiển thị huy hiệu chào mừng trên thanh tiêu đề
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hiển thị "Xin chào {nameInput || 'Thầy/Cô'} • {schoolInput}" ở góc màn hình
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showGreetingInput}
                  onChange={e => setShowGreetingInput(e.target.checked)}
                  className={`w-4 h-4 rounded text-teal-600 ${theme.ring} cursor-pointer`}
                />
              </div>
            </div>
          )}

          {/* TAB 3: MÀU SẮC & GIAO DIỆN */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Bảng màu chủ đạo của Hệ thống (Accent Color Theme)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(ACCENT_THEMES) as AccentColor[]).map(key => {
                    const item = ACCENT_THEMES[key];
                    const isSelected = accentColor === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onSelectAccentColor(key)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? `${item.softBg} ${item.primaryBorder} ring-2 ${item.ring}`
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span 
                          className="w-6 h-6 rounded-full shadow-xs shrink-0 flex items-center justify-center text-white"
                          style={{ backgroundColor: item.previewHex }}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate text-slate-800 dark:text-slate-100">
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <Monitor size={18} className={theme.primaryText} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Chế độ Giao diện Tinh gọn (Zen / Compact Mode)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Thu gọn thanh tiêu đề và ẩn các banner phụ, tối đa hóa diện tích vẽ đồ thị Oxy & soạn thảo.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCompactMode}
                    onChange={e => onToggleCompactMode(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Công cụ tự động mở khi khởi động ứng dụng
                  </label>
                  <select
                    value={startupTab}
                    onChange={e => onSelectStartupTab(e.target.value)}
                    className={`w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs ${theme.ring} focus:ring-2 outline-none`}
                  >
                    <option value="last_used">Ghi nhớ công cụ vừa làm việc trước đó (Mặc định)</option>
                    {SEARCHABLE_TOOLS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.category} → {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ GHIM YÊU THÍCH */}
          {activeTab === 'favorites' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tích chọn những công cụ Thầy/Cô thường xuyên sử dụng nhất để hiển thị trên <strong>Thanh Ghim Nhanh</strong> phía trên:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SEARCHABLE_TOOLS.map(tool => {
                  const Icon = tool.icon;
                  const isPinned = pinnedTabs.includes(tool.id);

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onTogglePin(tool.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isPinned
                          ? `${theme.softBg} ${theme.primaryBorder}`
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={16} className={isPinned ? theme.primaryText : 'text-slate-400'} />
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            isPinned ? theme.primaryText : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {tool.label}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {tool.category}
                          </span>
                        </div>
                      </div>
                      <Star size={15} className={`shrink-0 ${isPinned ? 'text-amber-500 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Hệ sinh thái Giáo dục Số LVP (0944405124)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className={`px-5 py-2 ${theme.primaryBg} ${theme.primaryHover} text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer`}
            >
              {savedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Lưu cấu hình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
