import React, { useState, useMemo, useRef } from 'react';
import {
  X, Plus, Trash2, Sparkles, Compass, Image as ImageIcon,
  Upload, Wand2, Check, Loader2, Eye
} from 'lucide-react';
import {
  OxyzSceneConfig,
  OxyzPointInput,
  OxyzSegmentInput,
  OXYZ_PRESET_BALLOONS,
  OXYZ_PRESET_STANDARD,
  OXYZ_PRESET_RADAR_PLANE,
  buildOxyzScene
} from '../utils/oxyzEngine';
import { OXYZ_STICKERS, OxyzStickerDef } from '../utils/oxyzStickers';
import type { GspPoint, GspSegment, GspText, GspChartItem } from './GspSketchpad';

export interface OxyzBuilderModalProps {
  isOpen: boolean;
  initialTab?: 'oxyz' | 'stickers';
  onClose: () => void;
  onApplyOxyzScene: (scene: {
    points: GspPoint[];
    segments: GspSegment[];
    texts: GspText[];
    charts: GspChartItem[];
    presetName?: string;
  }) => void;
  onInsertSticker: (item: GspChartItem, label: string) => void;
}

const cloneConfig = (cfg: OxyzSceneConfig): OxyzSceneConfig => JSON.parse(JSON.stringify(cfg));

export default function OxyzBuilderModal({
  isOpen,
  initialTab = 'oxyz',
  onClose,
  onApplyOxyzScene,
  onInsertSticker
}: OxyzBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<'oxyz' | 'stickers'>(initialTab);
  const [config, setConfig] = useState<OxyzSceneConfig>(() => cloneConfig(OXYZ_PRESET_BALLOONS));
  const [stickerCategory, setStickerCategory] = useState<'all' | 'air' | 'sea_land' | 'structure' | 'nature'>('all');
  const [stickerScale, setStickerScale] = useState<number>(1.0);

  // AI SVG generator state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedSvg, setAiGeneratedSvg] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ initialTab mỗi khi mở
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Tính toán preview trực tiếp cho Oxyz
  const previewScene = useMemo(() => buildOxyzScene(config), [config]);

  if (!isOpen) return null;

  const availableLabels = ['O', ...config.points.map(p => p.label).filter(Boolean), ...config.points.filter(p => p.showProjection && Math.abs(p.z) > 1e-4).map(p => p.projectionLabel || `${p.label}'`)];

  const handleLoadPreset = (preset: OxyzSceneConfig) => {
    setConfig(cloneConfig(preset));
  };

  const handleAddPoint = () => {
    const used = new Set(config.points.map(p => p.label));
    const candidates = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'N', 'P', 'Q', 'H', 'K'];
    const nextLabel = candidates.find(c => !used.has(c)) || `P${config.points.length + 1}`;
    const newPt: OxyzPointInput = {
      id: 'pt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      label: nextLabel,
      x: 2,
      y: 2,
      z: 2.5,
      color: '#000000',
      showProjection: true,
      projectionLabel: `${nextLabel}'`,
      showAxisProjections: true,
      stickerId: '',
      stickerScale: 1
    };
    setConfig(prev => ({ ...prev, points: [...prev.points, newPt] }));
  };

  const handleUpdatePoint = (id: string, patch: Partial<OxyzPointInput>) => {
    setConfig(prev => ({
      ...prev,
      points: prev.points.map(p => (p.id === id ? { ...p, ...patch } : p))
    }));
  };

  const handleRemovePoint = (id: string) => {
    setConfig(prev => ({
      ...prev,
      points: prev.points.filter(p => p.id !== id)
    }));
  };

  const handleAddSegment = () => {
    const first = availableLabels[0] || 'O';
    const second = availableLabels[1] || availableLabels[0] || 'O';
    const newSeg: OxyzSegmentInput = {
      id: 'seg_' + Date.now(),
      fromLabel: first,
      toLabel: second,
      style: 'dashed',
      color: '#dc2626',
      isVector: false
    };
    setConfig(prev => ({ ...prev, segments: [...prev.segments, newSeg] }));
  };

  const handleUpdateSegment = (id: string, patch: Partial<OxyzSegmentInput>) => {
    setConfig(prev => ({
      ...prev,
      segments: prev.segments.map(s => (s.id === id ? { ...s, ...patch } : s))
    }));
  };

  const handleRemoveSegment = (id: string) => {
    setConfig(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s.id !== id)
    }));
  };

  const handlePickSticker = (sticker: OxyzStickerDef) => {
    const w = Math.round(sticker.defaultWidth * stickerScale);
    const h = Math.round(sticker.defaultHeight * stickerScale);
    const item: GspChartItem = {
      id: `sticker_${sticker.id}_${Date.now()}`,
      x: Math.round(375 - w / 2),
      y: Math.round(240 - h / 2),
      width: w,
      height: h,
      svgString: sticker.svgString,
      config: {
        isSticker: true,
        stickerId: sticker.id,
        layer: 'behind_labels',
        keepAspect: true
      }
    };
    onInsertSticker(item, sticker.name);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const rawSvg = String(ev.target?.result || '').trim();
        if (!rawSvg.includes('<svg')) return;
        const item: GspChartItem = {
          id: `custom_svg_${Date.now()}`,
          x: 310,
          y: 180,
          width: 90,
          height: 90,
          svgString: rawSvg,
          config: { isSticker: true, layer: 'behind_labels', keepAspect: true }
        };
        onInsertSticker(item, file.name);
        onClose();
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = String(ev.target?.result || '');
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          const maxDim = 120;
          const ratio = img.width > 0 && img.height > 0 ? img.width / img.height : 1;
          const w = ratio >= 1 ? maxDim : Math.round(maxDim * ratio);
          const h = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
          const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><image href="${dataUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" /></svg>`;
          const item: GspChartItem = {
            id: `custom_img_${Date.now()}`,
            x: Math.round(375 - w / 2),
            y: Math.round(240 - h / 2),
            width: w,
            height: h,
            svgString: wrappedSvg,
            config: { isSticker: true, layer: 'behind_labels', keepAspect: true }
          };
          onInsertSticker(item, file.name);
          onClose();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleGenerateAiSticker = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiGeneratedSvg(null);
    try {
      const prompt = `Bạn là chuyên gia đồ họa vector SVG cho sách giáo khoa Toán học Việt Nam.
Hãy vẽ MỘT hình minh họa vector SVG đơn giản, sắc nét, phong cách phẳng sạch sẽ (flat vector illustration, pastel colors, dark outline) cho đối tượng sau: "${aiPrompt.trim()}".
Yêu cầu bắt buộc:
- Chỉ trả về DUY NHẤT mã thẻ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">...</svg>, không giải thích, không markdown.
- Nền trong suốt (không vẽ hình chữ nhật nền phủ kín).
- Dùng các hình cơ bản (<path>, <circle>, <rect>, <polygon>, <ellipse>, <line>) cân đối ở trung tâm viewBox 0 0 120 120.`;

      const savedApiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('apiKey') || '';
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          apiKey: savedApiKey || undefined,
          temperature: 0.3
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể kết nối AI.');
      }
      const rawText = String(data.text || '');
      const match = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      if (!match) {
        throw new Error('AI không trả về mã SVG hợp lệ. Vui lòng thử mô tả ngắn gọn hơn.');
      }
      let cleanSvg = match[0];
      if (!cleanSvg.includes('xmlns=')) {
        cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      setAiGeneratedSvg(cleanSvg);
    } catch (err: any) {
      setAiError(err?.message || 'Lỗi tạo SVG bằng AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredStickers = stickerCategory === 'all'
    ? OXYZ_STICKERS
    : OXYZ_STICKERS.filter(s => s.category === stickerCategory);

  const previewPtMap = new Map<string, GspPoint>(previewScene.points.map(p => [p.id, p]));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#EFF6FC] to-teal-50/60 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F6CBD] text-white flex items-center justify-center shadow-xs">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Hệ trục tọa độ Oxyz & Hình minh họa thực tế (SGK Toán 12)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tự động dựng trục Oxyz, hình chiếu vuông góc nét đứt và gắn sticker vector 300 DPI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS */}
        <div className="px-5 pt-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/70 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('oxyz')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'oxyz'
                ? 'border-[#0F6CBD] text-[#0F6CBD] bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass size={14} />
            <span>Dựng nhanh Hệ trục Oxyz</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stickers'
                ? 'border-[#0F6CBD] text-[#0F6CBD] bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon size={14} />
            <span>Kho Sticker Thực Tế / Ảnh / AI SVG</span>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'oxyz' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* CỘT TRÁI: CẤU HÌNH ĐIỂM & ĐOẠN NỐI */}
              <div className="lg:col-span-7 space-y-4">
                {/* Mẫu nhanh */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Chọn nhanh mẫu bài toán thực tế:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(OXYZ_PRESET_BALLOONS)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 transition cursor-pointer"
                    >
                      🎈 2 Khinh khí cầu (A, B, E, F)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(OXYZ_PRESET_RADAR_PLANE)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition cursor-pointer"
                    >
                      ✈️ Trạm Radar & Máy bay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(OXYZ_PRESET_STANDARD)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition cursor-pointer"
                    >
                      📐 Hệ trục Oxyz chuẩn M(x; y; z)
                    </button>
                  </div>
                </div>

                {/* Danh sách điểm tọa độ */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      1. Các điểm tọa độ & Hình minh họa gắn kèm
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPoint}
                      className="px-2.5 py-1 rounded-lg bg-[#0F6CBD] hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={12} /> Thêm điểm
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {config.points.map(pt => (
                      <div
                        key={pt.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 space-y-2 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={pt.label}
                            onChange={e => handleUpdatePoint(pt.id, { label: e.target.value })}
                            className="w-12 px-2 py-1 text-xs font-bold text-center border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800"
                            title="Tên điểm"
                          />
                          <label className="text-[11px] text-slate-600 flex items-center gap-1">
                            <span>x:</span>
                            <input
                              type="number"
                              step="0.2"
                              value={pt.x}
                              onChange={e => handleUpdatePoint(pt.id, { x: Number(e.target.value) })}
                              className="w-14 px-1.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </label>
                          <label className="text-[11px] text-slate-600 flex items-center gap-1">
                            <span>y:</span>
                            <input
                              type="number"
                              step="0.2"
                              value={pt.y}
                              onChange={e => handleUpdatePoint(pt.id, { y: Number(e.target.value) })}
                              className="w-14 px-1.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </label>
                          <label className="text-[11px] text-slate-600 flex items-center gap-1">
                            <span>z:</span>
                            <input
                              type="number"
                              step="0.2"
                              value={pt.z}
                              onChange={e => handleUpdatePoint(pt.id, { z: Number(e.target.value) })}
                              className="w-14 px-1.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(pt.id)}
                            className="ml-auto p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Xóa điểm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!pt.showProjection}
                              onChange={e => handleUpdatePoint(pt.id, { showProjection: e.target.checked })}
                            />
                            <span>Chiếu xuống (Oxy)</span>
                          </label>
                          {pt.showProjection && (
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!pt.showAxisProjections}
                                onChange={e => handleUpdatePoint(pt.id, { showAxisProjections: e.target.checked })}
                              />
                              <span>Chiếu vào Ox, Oy</span>
                            </label>
                          )}
                          <label className="flex items-center gap-1.5 ml-auto">
                            <span className="text-slate-500">Sticker:</span>
                            <select
                              value={pt.stickerId || ''}
                              onChange={e => handleUpdatePoint(pt.id, { stickerId: e.target.value || undefined })}
                              className="px-2 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            >
                              <option value="">-- Không gắn --</option>
                              {OXYZ_STICKERS.map(st => (
                                <option key={st.id} value={st.id}>{st.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danh sách đoạn nối */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      2. Đường nối / Đường truyền tia / Vectơ
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSegment}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={12} /> Thêm đoạn nối
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {config.segments.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">Chưa có đoạn nối nào.</p>
                    )}
                    {config.segments.map(seg => (
                      <div
                        key={seg.id}
                        className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs"
                      >
                        <select
                          value={seg.fromLabel}
                          onChange={e => handleUpdateSegment(seg.id, { fromLabel: e.target.value })}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                        >
                          {availableLabels.map(lb => <option key={lb} value={lb}>{lb}</option>)}
                        </select>
                        <span className="text-slate-400">→</span>
                        <select
                          value={seg.toLabel}
                          onChange={e => handleUpdateSegment(seg.id, { toLabel: e.target.value })}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                        >
                          {availableLabels.map(lb => <option key={lb} value={lb}>{lb}</option>)}
                        </select>
                        <select
                          value={seg.style}
                          onChange={e => handleUpdateSegment(seg.id, { style: e.target.value as 'solid' | 'dashed' })}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                        >
                          <option value="dashed">Nét đứt</option>
                          <option value="solid">Nét liền</option>
                        </select>
                        <select
                          value={seg.color}
                          onChange={e => handleUpdateSegment(seg.id, { color: e.target.value })}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                        >
                          <option value="#dc2626">Đỏ</option>
                          <option value="#000000">Đen</option>
                          <option value="#2563eb">Xanh dương</option>
                          <option value="#16a34a">Xanh lá</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!seg.isVector}
                            onChange={e => handleUpdateSegment(seg.id, { isVector: e.target.checked })}
                          />
                          <span>Mũi tên</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(seg.id)}
                          className="ml-auto p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cài đặt tỉ lệ trục */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <label className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Tỉ lệ phóng:</span>
                    <input
                      type="range"
                      min={26}
                      max={54}
                      value={config.scale ?? 40}
                      onChange={e => setConfig(prev => ({ ...prev, scale: Number(e.target.value) }))}
                      className="w-24 accent-[#0F6CBD]"
                    />
                    <span className="font-bold">{config.scale ?? 40}px</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600">Trục âm Ox, Oy:</span>
                    <input
                      type="checkbox"
                      checked={(config.axisXNeg ?? 0) > 0}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        axisXNeg: e.target.checked ? 3.6 : 0,
                        axisYNeg: e.target.checked ? 4.6 : 0
                      }))}
                    />
                  </label>
                </div>
              </div>

              {/* CỘT PHẢI: XEM TRƯỚC TRỰC TIẾP (LIVE SVG PREVIEW) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Eye size={14} className="text-[#0F6CBD]" />
                  <span>Xem trước hình Oxyz:</span>
                </div>
                <div className="flex-1 bg-white border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center justify-center shadow-inner min-h-[280px]">
                  <svg viewBox="0 0 750 480" className="w-full h-auto max-h-[360px]">
                    <defs>
                      {['#000000', '#dc2626', '#2563eb', '#16a34a', '#0284c7'].map(col => (
                        <marker
                          key={col}
                          id={`prev-arrow-${col.replace('#', '')}`}
                          viewBox="0 0 10 10"
                          refX="8"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={col} />
                        </marker>
                      ))}
                    </defs>

                    {/* Đoạn thẳng */}
                    {previewScene.segments.map(seg => {
                      const p1 = previewPtMap.get(seg.p1Id);
                      const p2 = previewPtMap.get(seg.p2Id);
                      if (!p1 || !p2) return null;
                      const markerId = `prev-arrow-${(seg.color || '#000000').replace('#', '')}`;
                      return (
                        <line
                          key={seg.id}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={seg.color || '#000000'}
                          strokeWidth={seg.width || 1.6}
                          strokeDasharray={seg.style === 'dashed' ? '7,5' : undefined}
                          markerEnd={seg.isVector ? `url(#${markerId})` : undefined}
                        />
                      );
                    })}

                    {/* Stickers */}
                    {previewScene.charts.map(ch => (
                      <image
                        key={ch.id}
                        x={ch.x}
                        y={ch.y}
                        width={ch.width}
                        height={ch.height}
                        href={`data:image/svg+xml;utf8,${encodeURIComponent(ch.svgString)}`}
                      />
                    ))}

                    {/* Điểm & Nhãn */}
                    {previewScene.points.map(pt => (
                      <g key={pt.id}>
                        {!pt.hideDot && (
                          <circle cx={pt.x} cy={pt.y} r="3" fill={pt.color || '#000000'} />
                        )}
                        {!pt.hideLabel && pt.label && (
                          <text
                            x={pt.x + (pt.labelOffsetX ?? 9)}
                            y={pt.y + (pt.labelOffsetY ?? -8)}
                            fontFamily='"Times New Roman", serif'
                            fontSize="20"
                            fontWeight="bold"
                            fontStyle="italic"
                            fill={pt.color || '#000000'}
                          >
                            {pt.label}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Sau khi chèn, thầy/cô vẫn có thể kéo dời từng điểm, dời nhãn chữ, đổi màu nét và kéo phóng to/thu nhỏ sticker trực tiếp trên bảng vẽ.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Thanh công cụ trên: Tải ảnh ngoài + Cỡ Sticker */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'air', label: 'Trên không (Khinh khí cầu, Máy bay)' },
                    { id: 'structure', label: 'Công trình (Radar, Hải đăng)' },
                    { id: 'sea_land', label: 'Tàu, Xe' },
                    { id: 'nature', label: 'Cây xanh' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStickerCategory(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        stickerCategory === cat.id
                          ? 'bg-[#0F6CBD] text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span>Cỡ chèn:</span>
                    <select
                      value={stickerScale}
                      onChange={e => setStickerScale(Number(e.target.value))}
                      className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value={0.8}>Nhỏ (80%)</option>
                      <option value={1}>Chuẩn (100%)</option>
                      <option value={1.3}>Lớn (130%)</option>
                      <option value={1.6}>Rất lớn (160%)</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Upload size={14} />
                    <span>Tải ảnh / SVG từ máy</span>
                  </button>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Lưới Sticker dựng sẵn */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredStickers.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handlePickSticker(st)}
                    className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0F6CBD] hover:bg-sky-50/40 transition cursor-pointer flex flex-col items-center gap-2 text-center shadow-2xs"
                  >
                    <div className="w-16 h-16 flex items-center justify-center">
                      <img
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(st.svgString)}`}
                        alt={st.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {st.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Khu vực tạo SVG bằng AI */}
              <div className="border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  <Wand2 size={14} />
                  <span>Tạo hình minh họa vector SVG tùy ý bằng AI (Gemini)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerateAiSticker()}
                    placeholder="Ví dụ: cabin cáp treo, cầu dây văng, tháp truyền hình, tàu ngầm..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    disabled={aiLoading || !aiPrompt.trim()}
                    onClick={handleGenerateAiSticker}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>{aiLoading ? 'Đang vẽ SVG...' : 'Tạo SVG ngay'}</span>
                  </button>
                </div>
                {aiError && <p className="text-xs text-red-600 font-medium">{aiError}</p>}
                {aiGeneratedSvg && (
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-indigo-200">
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(aiGeneratedSvg)}`}
                      alt="AI SVG"
                      className="w-16 h-16 object-contain border border-slate-100 rounded"
                    />
                    <div className="flex-1 text-xs text-slate-600">
                      Đã tạo hình vector SVG cho <b>"{aiPrompt}"</b>.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const w = Math.round(76 * stickerScale);
                        const h = Math.round(76 * stickerScale);
                        onInsertSticker({
                          id: `ai_svg_${Date.now()}`,
                          x: Math.round(375 - w / 2),
                          y: Math.round(240 - h / 2),
                          width: w,
                          height: h,
                          svgString: aiGeneratedSvg,
                          config: { isSticker: true, layer: 'behind_labels', keepAspect: true }
                        }, `AI: ${aiPrompt}`);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} /> Chèn vào bảng vẽ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Đóng
          </button>
          {activeTab === 'oxyz' && (
            <button
              type="button"
              onClick={() => {
                onApplyOxyzScene({
                  ...previewScene,
                  presetName: config.presetName || 'Hệ trục tọa độ Oxyz'
                });
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-[#0F6CBD] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check size={14} />
              <span>Chèn hệ trục Oxyz vào bảng vẽ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
