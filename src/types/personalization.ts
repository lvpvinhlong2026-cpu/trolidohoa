export type AccentColor = 'teal' | 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';

export interface TeacherProfile {
  name: string;
  school: string;
  subject: string;
  academicYear: string;
  showGreeting: boolean;
}

export interface PersonalizationSettings {
  profile: TeacherProfile;
  accentColor: AccentColor;
  isCompactMode: boolean;
  pinnedTabs: string[];
  startupTab: string; // 'last_used' or specific TabId
}

export interface AccentThemeDef {
  id: AccentColor;
  label: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  primaryBorder: string;
  ring: string;
  glow: string;
  softBg: string;
  softBorder: string;
  softText: string;
  previewHex: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentThemeDef> = {
  teal: {
    id: 'teal',
    label: 'Ngọc Lam (Mặc định)',
    colorName: 'Teal',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-800/80',
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryText: 'text-teal-600 dark:text-teal-400',
    primaryBorder: 'border-teal-600',
    ring: 'focus:ring-teal-500',
    glow: 'shadow-teal-600/20',
    softBg: 'bg-teal-50 dark:bg-teal-950/50',
    softBorder: 'border-teal-200 dark:border-teal-800',
    softText: 'text-teal-700 dark:text-teal-300',
    previewHex: '#0d9488',
  },
  blue: {
    id: 'blue',
    label: 'Đại Dương Tri Thức',
    colorName: 'Ocean Blue',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800/80',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600 dark:text-blue-400',
    primaryBorder: 'border-blue-600',
    ring: 'focus:ring-blue-500',
    glow: 'shadow-blue-600/20',
    softBg: 'bg-blue-50 dark:bg-blue-950/50',
    softBorder: 'border-blue-200 dark:border-blue-800',
    softText: 'text-blue-700 dark:text-blue-300',
    previewHex: '#2563eb',
  },
  indigo: {
    id: 'indigo',
    label: 'Tím Trí Tuệ',
    colorName: 'Royal Indigo',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/80',
    primaryBg: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryText: 'text-indigo-600 dark:text-indigo-400',
    primaryBorder: 'border-indigo-600',
    ring: 'focus:ring-indigo-500',
    glow: 'shadow-indigo-600/20',
    softBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    softBorder: 'border-indigo-200 dark:border-indigo-800',
    softText: 'text-indigo-700 dark:text-indigo-300',
    previewHex: '#4f46e5',
  },
  emerald: {
    id: 'emerald',
    label: 'Xanh Lá Tươi Sáng',
    colorName: 'Emerald Green',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/80',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    primaryBorder: 'border-emerald-600',
    ring: 'focus:ring-emerald-500',
    glow: 'shadow-emerald-600/20',
    softBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    softBorder: 'border-emerald-200 dark:border-emerald-800',
    softText: 'text-emerald-700 dark:text-emerald-300',
    previewHex: '#059669',
  },
  amber: {
    id: 'amber',
    label: 'Cam Năng Động',
    colorName: 'Sunset Amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/80',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    primaryText: 'text-amber-600 dark:text-amber-400',
    primaryBorder: 'border-amber-600',
    ring: 'focus:ring-amber-500',
    glow: 'shadow-amber-600/20',
    softBg: 'bg-amber-50 dark:bg-amber-950/50',
    softBorder: 'border-amber-200 dark:border-amber-800',
    softText: 'text-amber-700 dark:text-amber-300',
    previewHex: '#d97706',
  },
  rose: {
    id: 'rose',
    label: 'Hoa Hồng Tinh Tế',
    colorName: 'Elegant Rose',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/80',
    primaryBg: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    primaryText: 'text-rose-600 dark:text-rose-400',
    primaryBorder: 'border-rose-600',
    ring: 'focus:ring-rose-500',
    glow: 'shadow-rose-600/20',
    softBg: 'bg-rose-50 dark:bg-rose-950/50',
    softBorder: 'border-rose-200 dark:border-rose-800',
    softText: 'text-rose-700 dark:text-rose-300',
    previewHex: '#e11d48',
  },
};
