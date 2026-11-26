/**
 * Thư viện Sticker Vector SVG cho các bài toán thực tế (Toán 10, 11, 12 GDPT 2018 - Oxyz, Lượng giác)
 * Tất cả đều là SVG thuần sắc nét ở mọi độ phân giải (300 DPI khi xuất Word).
 */

export interface OxyzStickerDef {
  id: string;
  name: string;
  category: 'air' | 'sea_land' | 'structure' | 'nature';
  defaultWidth: number;
  defaultHeight: number;
  /** Vị trí neo theo tỉ lệ (0..1) so với điểm gắn tọa độ (vd: đáy giỏ khinh khí cầu = 0.5, 0.98) */
  anchorX: number;
  anchorY: number;
  /** Hướng gợi ý đặt nhãn điểm (vd 'right' đặt nhãn A bên phải, 'left' đặt bên trái) */
  suggestedLabelOffset?: { x: number; y: number };
  svgString: string;
}

export const OXYZ_STICKERS: OxyzStickerDef[] = [
  {
    id: 'balloon_pink_blue',
    name: 'Khinh khí cầu (Hồng - Xanh)',
    category: 'air',
    defaultWidth: 58,
    defaultHeight: 84,
    anchorX: 0.5,
    anchorY: 0.96,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 175">
  <defs>
    <clipPath id="balloonClip1">
      <path d="M 60 8 C 92 8 106 34 104 64 C 102 90 80 112 70 132 L 50 132 C 40 112 18 90 16 64 C 14 34 28 8 60 8 Z" />
    </clipPath>
  </defs>
  <!-- Bóng khinh khí cầu với các múi sọc hồng - xanh chuẩn SGK -->
  <g clip-path="url(#balloonClip1)">
    <rect x="10" y="5" width="100" height="130" fill="#BFE2F7" />
    <path d="M 33 6 C 24 45 27 92 47 134 L 54 134 C 39 92 38 45 45 6 Z" fill="#F6B4BE" />
    <path d="M 55 6 L 65 6 C 67 45 65 92 63 134 L 57 134 C 55 92 53 45 55 6 Z" fill="#F6B4BE" />
    <path d="M 75 6 C 82 45 81 92 66 134 L 73 134 C 93 92 96 45 87 6 Z" fill="#F6B4BE" />
    <path d="M 14 6 L 23 6 C 17 45 20 92 41 134 L 35 134 C 14 92 10 45 14 6 Z" fill="#F6B4BE" />
    <path d="M 97 6 L 106 6 C 110 45 106 92 85 134 L 79 134 C 100 92 103 45 97 6 Z" fill="#F6B4BE" />
  </g>
  <!-- Viền bóng khinh khí cầu -->
  <path d="M 60 8 C 92 8 106 34 104 64 C 102 90 80 112 70 132 L 50 132 C 40 112 18 90 16 64 C 14 34 28 8 60 8 Z" fill="none" stroke="#94A3B8" stroke-width="1.6" />
  <!-- Đai cổ bóng -->
  <rect x="49" y="131" width="22" height="3.5" rx="1" fill="#E2E8F0" stroke="#64748B" stroke-width="1" />
  <!-- Dây treo giỏ -->
  <line x1="51" y1="134.5" x2="52" y2="149" stroke="#475569" stroke-width="1.4" />
  <line x1="69" y1="134.5" x2="68" y2="149" stroke="#475569" stroke-width="1.4" />
  <line x1="57" y1="134.5" x2="57.5" y2="149" stroke="#475569" stroke-width="1" />
  <line x1="63" y1="134.5" x2="62.5" y2="149" stroke="#475569" stroke-width="1" />
  <!-- Giỏ mây -->
  <rect x="48" y="148" width="24" height="4" rx="1.5" fill="#6D4322" stroke="#3E2410" stroke-width="1" />
  <path d="M 50 152 L 70 152 L 68 168 Q 60 170 52 168 Z" fill="#9A6132" stroke="#3E2410" stroke-width="1.2" />
  <line x1="55" y1="152" x2="55.5" y2="168.5" stroke="#6D4322" stroke-width="1" />
  <line x1="60" y1="152" x2="60" y2="169" stroke="#6D4322" stroke-width="1" />
  <line x1="65" y1="152" x2="64.5" y2="168.5" stroke="#6D4322" stroke-width="1" />
  <line x1="51" y1="160" x2="69" y2="160" stroke="#6D4322" stroke-width="1" />
</svg>`
  },
  {
    id: 'balloon_gold_teal',
    name: 'Khinh khí cầu (Vàng - Xanh)',
    category: 'air',
    defaultWidth: 58,
    defaultHeight: 84,
    anchorX: 0.5,
    anchorY: 0.96,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 175">
  <defs>
    <clipPath id="balloonClip2">
      <path d="M 60 8 C 92 8 106 34 104 64 C 102 90 80 112 70 132 L 50 132 C 40 112 18 90 16 64 C 14 34 28 8 60 8 Z" />
    </clipPath>
  </defs>
  <g clip-path="url(#balloonClip2)">
    <rect x="10" y="5" width="100" height="130" fill="#99F6E4" />
    <path d="M 33 6 C 24 45 27 92 47 134 L 54 134 C 39 92 38 45 45 6 Z" fill="#FDE047" />
    <path d="M 55 6 L 65 6 C 67 45 65 92 63 134 L 57 134 C 55 92 53 45 55 6 Z" fill="#FB923C" />
    <path d="M 75 6 C 82 45 81 92 66 134 L 73 134 C 93 92 96 45 87 6 Z" fill="#FDE047" />
  </g>
  <path d="M 60 8 C 92 8 106 34 104 64 C 102 90 80 112 70 132 L 50 132 C 40 112 18 90 16 64 C 14 34 28 8 60 8 Z" fill="none" stroke="#475569" stroke-width="1.6" />
  <line x1="51" y1="134" x2="52" y2="149" stroke="#334155" stroke-width="1.4" />
  <line x1="69" y1="134" x2="68" y2="149" stroke="#334155" stroke-width="1.4" />
  <rect x="48" y="148" width="24" height="4" rx="1.5" fill="#78350F" />
  <path d="M 50 152 L 70 152 L 68 168 Q 60 170 52 168 Z" fill="#B45309" stroke="#451A03" stroke-width="1.2" />
</svg>`
  },
  {
    id: 'airplane',
    name: 'Máy bay dân dụng',
    category: 'air',
    defaultWidth: 74,
    defaultHeight: 50,
    anchorX: 0.5,
    anchorY: 0.65,
    suggestedLabelOffset: { x: 12, y: -12 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 95">
  <!-- Cánh sau -->
  <path d="M 24 44 L 12 18 L 28 18 L 42 42 Z" fill="#0284C7" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round" />
  <!-- Cánh xa -->
  <path d="M 66 42 L 88 20 L 98 20 L 82 43 Z" fill="#7DD3FC" stroke="#0F172A" stroke-width="1.4" stroke-linejoin="round" />
  <!-- Thân máy bay -->
  <path d="M 18 46 Q 22 39 45 39 L 106 40 Q 128 42 132 50 Q 126 57 104 57 L 36 55 Q 20 53 18 46 Z" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8" />
  <!-- Đường kẻ thân -->
  <path d="M 32 48 L 116 48" stroke="#0284C7" stroke-width="2.5" />
  <!-- Buồng lái -->
  <path d="M 110 42 Q 122 43 125 47 L 112 47 Z" fill="#0F172A" />
  <!-- Cửa sổ -->
  <g fill="#38BDF8" stroke="#0F172A" stroke-width="0.7">
    <circle cx="52" cy="44" r="1.8" />
    <circle cx="60" cy="44" r="1.8" />
    <circle cx="68" cy="44" r="1.8" />
    <circle cx="76" cy="44" r="1.8" />
    <circle cx="84" cy="44" r="1.8" />
    <circle cx="92" cy="44" r="1.8" />
    <circle cx="100" cy="44" r="1.8" />
  </g>
  <!-- Cánh gần -->
  <path d="M 54 51 L 34 78 L 50 78 L 78 52 Z" fill="#38BDF8" stroke="#0F172A" stroke-width="1.6" stroke-linejoin="round" />
  <!-- Động cơ -->
  <rect x="52" y="57" width="16" height="8" rx="3" fill="#CBD5E1" stroke="#0F172A" stroke-width="1.3" />
</svg>`
  },
  {
    id: 'drone',
    name: 'Drone / Flycam',
    category: 'air',
    defaultWidth: 68,
    defaultHeight: 46,
    anchorX: 0.5,
    anchorY: 0.72,
    suggestedLabelOffset: { x: 10, y: -10 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90">
  <!-- Cánh quạt trái/phải -->
  <ellipse cx="26" cy="22" rx="22" ry="4.5" fill="#CBD5E1" stroke="#334155" stroke-width="1.3" />
  <ellipse cx="104" cy="22" rx="22" ry="4.5" fill="#CBD5E1" stroke="#334155" stroke-width="1.3" />
  <ellipse cx="40" cy="34" rx="16" ry="3.5" fill="#E2E8F0" stroke="#475569" stroke-width="1.1" />
  <ellipse cx="90" cy="34" rx="16" ry="3.5" fill="#E2E8F0" stroke="#475569" stroke-width="1.1" />
  <!-- Trục động cơ -->
  <line x1="26" y1="22" x2="26" y2="34" stroke="#1E293B" stroke-width="3" />
  <line x1="104" y1="22" x2="104" y2="34" stroke="#1E293B" stroke-width="3" />
  <!-- Càng nối -->
  <path d="M 24 34 L 50 44 M 106 34 L 80 44" stroke="#334155" stroke-width="4" stroke-linecap="round" />
  <!-- Chân đáp -->
  <path d="M 48 54 L 38 76 L 30 76 M 82 54 L 92 76 L 100 76" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Thân drone -->
  <rect x="44" y="38" width="42" height="16" rx="7" fill="#3B82F6" stroke="#0F172A" stroke-width="1.8" />
  <!-- Camera dưới bụng -->
  <circle cx="65" cy="61" r="7" fill="#1E293B" stroke="#0F172A" stroke-width="1.5" />
  <circle cx="65" cy="61" r="3" fill="#38BDF8" />
</svg>`
  },
  {
    id: 'helicopter',
    name: 'Máy bay trực thăng',
    category: 'air',
    defaultWidth: 74,
    defaultHeight: 52,
    anchorX: 0.5,
    anchorY: 0.85,
    suggestedLabelOffset: { x: 12, y: -8 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
  <!-- Cánh quạt chính -->
  <line x1="16" y1="18" x2="118" y2="18" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" />
  <line x1="67" y1="18" x2="67" y2="32" stroke="#1E293B" stroke-width="3.5" />
  <!-- Đuôi và cánh quạt đuôi -->
  <path d="M 42 46 L 14 42 L 10 30 L 18 30 L 22 40 L 45 41 Z" fill="#F59E0B" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round" />
  <circle cx="13" cy="34" r="8" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="3,2" />
  <!-- Thân trực thăng -->
  <path d="M 42 44 Q 44 30 70 30 Q 98 30 104 48 Q 106 60 80 60 L 48 58 Q 40 56 42 44 Z" fill="#F59E0B" stroke="#0F172A" stroke-width="1.8" />
  <!-- Kính buồng lái -->
  <path d="M 74 33 Q 95 33 100 47 L 74 47 Z" fill="#BAE6FD" stroke="#0F172A" stroke-width="1.4" />
  <!-- Càng đáp -->
  <path d="M 55 60 L 50 74 M 84 60 L 89 74 M 40 74 L 104 74" fill="none" stroke="#1E293B" stroke-width="2.8" stroke-linecap="round" />
</svg>`
  },
  {
    id: 'radar_tower',
    name: 'Trạm phát sóng / Radar',
    category: 'structure',
    defaultWidth: 52,
    defaultHeight: 84,
    anchorX: 0.5,
    anchorY: 0.96,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160">
  <!-- Sóng phát -->
  <path d="M 32 22 Q 24 32 32 42" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" />
  <path d="M 24 16 Q 12 32 24 48" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" opacity="0.7" />
  <path d="M 68 22 Q 76 32 68 42" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" />
  <path d="M 76 16 Q 88 32 76 48" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" opacity="0.7" />
  <!-- Cột thu lôi đỉnh -->
  <line x1="50" y1="10" x2="50" y2="34" stroke="#334155" stroke-width="2.5" />
  <circle cx="50" cy="32" r="5" fill="#EF4444" stroke="#7F1D1D" stroke-width="1.3" />
  <!-- Tháp giàn thép -->
  <path d="M 50 36 L 26 150 M 50 36 L 74 150" stroke="#334155" stroke-width="2.8" stroke-linecap="round" />
  <path d="M 44 62 L 56 62 M 39 85 L 61 85 M 34 110 L 66 110 M 29 135 L 71 135" stroke="#475569" stroke-width="2" />
  <path d="M 44 62 L 61 85 M 56 62 L 39 85 M 39 85 L 66 110 M 61 85 L 34 110 M 34 110 L 71 135 M 66 110 L 29 135" stroke="#64748B" stroke-width="1.4" />
  <!-- Đế bê tông -->
  <rect x="20" y="148" width="60" height="7" rx="2" fill="#94A3B8" stroke="#334155" stroke-width="1.3" />
</svg>`
  },
  {
    id: 'satellite',
    name: 'Vệ tinh nhân tạo',
    category: 'air',
    defaultWidth: 72,
    defaultHeight: 56,
    anchorX: 0.5,
    anchorY: 0.5,
    suggestedLabelOffset: { x: 12, y: -12 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110">
  <!-- Cánh pin mặt trời trái -->
  <polygon points="10,45 48,25 56,42 18,62" fill="#1D4ED8" stroke="#0F172A" stroke-width="1.6" />
  <line x1="22" y1="39" x2="30" y2="56" stroke="#93C5FD" stroke-width="1" />
  <line x1="35" y1="32" x2="43" y2="49" stroke="#93C5FD" stroke-width="1" />
  <!-- Cánh pin mặt trời phải -->
  <polygon points="84,68 122,48 130,65 92,85" fill="#1D4ED8" stroke="#0F172A" stroke-width="1.6" />
  <line x1="96" y1="62" x2="104" y2="79" stroke="#93C5FD" stroke-width="1" />
  <line x1="109" y1="55" x2="117" y2="72" stroke="#93C5FD" stroke-width="1" />
  <!-- Thanh nối -->
  <line x1="48" y1="42" x2="92" y2="66" stroke="#475569" stroke-width="3.5" />
  <!-- Thân vệ tinh -->
  <rect x="55" y="38" width="30" height="32" rx="4" transform="rotate(-25 70 54)" fill="#F59E0B" stroke="#0F172A" stroke-width="1.8" />
  <!-- Chảo parabol -->
  <path d="M 60 72 Q 75 88 92 75" fill="#CBD5E1" stroke="#0F172A" stroke-width="1.6" />
  <line x1="76" y1="80" x2="82" y2="90" stroke="#0F172A" stroke-width="1.6" />
  <circle cx="82" cy="91" r="2.2" fill="#EF4444" />
</svg>`
  },
  {
    id: 'ship',
    name: 'Tàu thủy / Tàu biển',
    category: 'sea_land',
    defaultWidth: 74,
    defaultHeight: 50,
    anchorX: 0.5,
    anchorY: 0.88,
    suggestedLabelOffset: { x: 10, y: -6 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 95">
  <!-- Ống khói -->
  <rect x="52" y="18" width="10" height="22" fill="#EF4444" stroke="#0F172A" stroke-width="1.4" />
  <rect x="52" y="18" width="10" height="6" fill="#1E293B" />
  <!-- Cabin -->
  <rect x="42" y="36" width="46" height="18" rx="2" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.5" />
  <rect x="58" y="28" width="26" height="10" rx="2" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.3" />
  <rect x="64" y="31" width="14" height="4" fill="#38BDF8" />
  <!-- Thân tàu -->
  <polygon points="16,54 124,54 108,76 28,76" fill="#0F172A" stroke="#0F172A" stroke-width="1.5" stroke-linejoin="round" />
  <polygon points="24,68 113,68 108,76 28,76" fill="#DC2626" />
  <!-- Sóng nước -->
  <path d="M 10 80 Q 25 75 40 80 T 70 80 T 100 80 T 130 80" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round" />
</svg>`
  },
  {
    id: 'lighthouse',
    name: 'Ngọn hải đăng',
    category: 'structure',
    defaultWidth: 46,
    defaultHeight: 80,
    anchorX: 0.5,
    anchorY: 0.95,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 155">
  <!-- Tia sáng -->
  <polygon points="52,22 86,10 86,34" fill="#FEF08A" opacity="0.65" />
  <polygon points="38,22 4,10 4,34" fill="#FEF08A" opacity="0.65" />
  <!-- Mái chóp -->
  <polygon points="45,4 33,18 57,18" fill="#DC2626" stroke="#0F172A" stroke-width="1.4" />
  <!-- Đèn -->
  <rect x="36" y="18" width="18" height="12" fill="#FDE047" stroke="#0F172A" stroke-width="1.4" />
  <!-- Hành lang -->
  <rect x="31" y="30" width="28" height="5" rx="1" fill="#334155" />
  <!-- Thân tháp sọc đỏ trắng -->
  <polygon points="35,35 55,35 63,140 27,140" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6" />
  <polygon points="33.5,56 56.5,56 58.5,78 31.5,78" fill="#EF4444" />
  <polygon points="30,100 60,100 62,122 28,122" fill="#EF4444" />
  <!-- Nền đá -->
  <ellipse cx="45" cy="143" rx="28" ry="6" fill="#94A3B8" stroke="#334155" stroke-width="1.3" />
</svg>`
  },
  {
    id: 'car',
    name: 'Xe ô tô',
    category: 'sea_land',
    defaultWidth: 66,
    defaultHeight: 38,
    anchorX: 0.5,
    anchorY: 0.9,
    suggestedLabelOffset: { x: 10, y: -6 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 75">
  <!-- Thân xe -->
  <path d="M 14 44 L 22 24 Q 26 16 40 16 L 80 16 Q 94 16 100 26 L 116 32 Q 122 35 122 44 L 122 54 L 10 54 L 10 46 Z" fill="#EF4444" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round" />
  <!-- Kính xe -->
  <path d="M 32 22 L 78 22 L 90 34 L 26 34 Z" fill="#BAE6FD" stroke="#0F172A" stroke-width="1.3" />
  <line x1="56" y1="22" x2="56" y2="34" stroke="#0F172A" stroke-width="1.3" />
  <!-- Bánh xe -->
  <circle cx="34" cy="54" r="11" fill="#1E293B" stroke="#0F172A" stroke-width="1.5" />
  <circle cx="34" cy="54" r="5" fill="#CBD5E1" />
  <circle cx="96" cy="54" r="11" fill="#1E293B" stroke="#0F172A" stroke-width="1.5" />
  <circle cx="96" cy="54" r="5" fill="#CBD5E1" />
  <!-- Đèn xe -->
  <rect x="114" y="37" width="6" height="6" rx="1" fill="#FEF08A" />
</svg>`
  },
  {
    id: 'building',
    name: 'Tòa nhà / Chung cư',
    category: 'structure',
    defaultWidth: 50,
    defaultHeight: 74,
    anchorX: 0.5,
    anchorY: 0.96,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 145">
  <rect x="20" y="18" width="60" height="118" rx="2" fill="#E2E8F0" stroke="#334155" stroke-width="1.8" />
  <rect x="34" y="10" width="32" height="8" fill="#94A3B8" stroke="#334155" stroke-width="1.4" />
  <g fill="#38BDF8" stroke="#475569" stroke-width="1">
    <rect x="28" y="28" width="12" height="14" />
    <rect x="44" y="28" width="12" height="14" />
    <rect x="60" y="28" width="12" height="14" />
    <rect x="28" y="50" width="12" height="14" />
    <rect x="44" y="50" width="12" height="14" />
    <rect x="60" y="50" width="12" height="14" />
    <rect x="28" y="72" width="12" height="14" />
    <rect x="44" y="72" width="12" height="14" />
    <rect x="60" y="72" width="12" height="14" />
    <rect x="28" y="94" width="12" height="14" />
    <rect x="44" y="94" width="12" height="14" />
    <rect x="60" y="94" width="12" height="14" />
  </g>
  <rect x="42" y="116" width="16" height="20" fill="#475569" />
</svg>`
  },
  {
    id: 'tree',
    name: 'Cây xanh',
    category: 'nature',
    defaultWidth: 46,
    defaultHeight: 68,
    anchorX: 0.5,
    anchorY: 0.96,
    suggestedLabelOffset: { x: 10, y: -4 },
    svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 130">
  <rect x="39" y="78" width="12" height="44" rx="2" fill="#78350F" stroke="#451A03" stroke-width="1.4" />
  <circle cx="45" cy="48" r="28" fill="#22C55E" stroke="#15803D" stroke-width="1.6" />
  <circle cx="28" cy="58" r="18" fill="#4ADE80" stroke="#15803D" stroke-width="1.4" />
  <circle cx="62" cy="58" r="18" fill="#16A34A" stroke="#15803D" stroke-width="1.4" />
</svg>`
  }
];

export function getOxyzStickerById(id: string): OxyzStickerDef | undefined {
  return OXYZ_STICKERS.find(s => s.id === id);
}
