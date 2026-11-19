import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, Copy, Download, CheckCircle2, RotateCcw, 
  Plus, Trash2, Sliders, Eye, Sparkles, Layers, Check,
  Type, Ruler
} from 'lucide-react';
import { 
  renderInequalityToCanvas, 
  InequalityConfig, 
  LinearInequality, 
  TestPoint, 
  parseInequalityString, 
  INEQUALITY_PRESETS,
  formatLineEqLabel,
  getAutoBounds
} from '../utils/inequalityEngine';
import { addDpiToBlob, cropCanvasToContent } from '../utils/dpiUtils';

interface Props {
  fontScale?: number;
  graphFont?: string;
}

export default function InequalityGraphTool({ fontScale: initialFontScale = 1.0, graphFont: initialGraphFont = 'latex' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Local font & fontScale state
  const [graphFont, setGraphFont] = useState<string>(initialGraphFont || 'latex');
  const [fontScale, setFontScale] = useState<number>(initialFontScale || 1.0);

  // Cấu hình ban đầu: Mẫu 1 (x + 2y <= 400, x >= 0, y >= 0 - Hình 1) chuẩn quy cách mẫu
  const [config, setConfig] = useState<InequalityConfig>({
    ...INEQUALITY_PRESETS[0].config,
    isBoldLabels: false,
    curveWidth: 2.4,
    axisWidth: 1.8,
    showTicks: false,
    showTickLabels: false,
    showGrid: false,
    hatchPerpendicular: true,
  });

  // State nhập bất phương trình mới bằng chữ
  const [newIneqInput, setNewIneqInput] = useState<string>('2x + y <= 300');
  const [newPtX, setNewPtX] = useState<number>(100);
  const [newPtY, setNewPtY] = useState<number>(50);
  const [newPtLabel, setNewPtLabel] = useState<string>('M');

  // Chuyển đổi font
  const getFontFamily = (f: string) => {
    switch (f) {
      case 'latex':
        return '"KaTeX_Main", "KaTeX_Math", "Computer Modern", "Latin Modern Roman", serif';
      case 'cambria':
        return '"Cambria Math", "Cambria", serif';
      case 'sans':
        return '"Be Vietnam Pro", system-ui, sans-serif';
      default:
        return '"Times New Roman", "STIX Two Text", "Cambria Math", serif';
    }
  };

  // Đồng bộ props nếu có cập nhật từ cấp cha
  useEffect(() => {
    if (initialGraphFont) setGraphFont(initialGraphFont);
  }, [initialGraphFont]);

  useEffect(() => {
    if (initialFontScale) setFontScale(initialFontScale);
  }, [initialFontScale]);

  // Render canvas
  useEffect(() => {
    if (canvasRef.current) {
      try {
        renderInequalityToCanvas(config, canvasRef.current, 2.4, {
          fontFamily: getFontFamily(graphFont),
          fontSizeScale: fontScale
        });
        setDataUrl(canvasRef.current.toDataURL('image/png'));
      } catch (err) {
        console.error('Lỗi render miền nghiệm BPT:', err);
      }
    }
  }, [config, fontScale, graphFont]);

  // Sao chép ảnh 300 DPI (Auto-crop sát viền để ảnh to lớn chuẩn BBT)
  const handleCopy = async () => {
    try {
      if (!canvasRef.current) return;
      const cropped = cropCanvasToContent(canvasRef.current, 24);
      const blob = await new Promise<Blob | null>(resolve => cropped.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const blobWithDpi = await addDpiToBlob(blob, 300);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobWithDpi })
      ]);
      setCopySuccess('Đã copy ảnh Miền nghiệm BPT (300 DPI)! Dán (Ctrl+V) vào Word ảnh sẽ to lớn và sắc nét.');
      setTimeout(() => setCopySuccess(null), 4500);
    } catch {
      setCopySuccess('Không thể copy trực tiếp. Vui lòng bấm "Tải PNG".');
      setTimeout(() => setCopySuccess(null), 4000);
    }
  };

  // Tải ảnh PNG 300 DPI (Auto-crop)
  const handleDownload = async () => {
    try {
      if (!canvasRef.current) return;
      const cropped = cropCanvasToContent(canvasRef.current, 24);
      const blob = await new Promise<Blob | null>(resolve => cropped.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const blobWithDpi = await addDpiToBlob(blob, 300);
      const url = URL.createObjectURL(blobWithDpi);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mien_nghiem_BPT_300dpi.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'Mien_nghiem_BPT_300dpi.png';
      a.click();
    }
  };

  // Thêm BPT mới
  const handleAddIneq = (str?: string) => {
    const text = (str || newIneqInput).trim();
    const parsed = parseInequalityString(text);
    if (!parsed) return;
    setConfig(prev => ({
      ...prev,
      inequalities: [...prev.inequalities, parsed]
    }));
    setNewIneqInput('');
  };

  // Xóa BPT
  const handleRemoveIneq = (id: string) => {
    setConfig(prev => ({
      ...prev,
      inequalities: prev.inequalities.filter(i => i.id !== id)
    }));
  };

  // Thêm điểm kiểm tra
  const handleAddPoint = () => {
    const newPt: TestPoint = {
      x: newPtX,
      y: newPtY,
      label: newPtLabel.trim(),
      color: '#DC2626',
      showProjection: true
    };
    setConfig(prev => ({
      ...prev,
      points: [...(prev.points ?? []), newPt]
    }));
  };

  // Xóa điểm
  const handleRemovePoint = (index: number) => {
    setConfig(prev => ({
      ...prev,
      points: (prev.points ?? []).filter((_, i) => i !== index)
    }));
  };

  // Tính toán phạm vi Oxy & Bước chia hiện tại
  const bounds = getAutoBounds(config);
  const curSpan = Math.max(
    Math.abs(config.xMax ?? bounds.xMax),
    Math.abs(config.xMin ?? bounds.xMin),
    Math.abs(config.yMax ?? bounds.yMax),
    Math.abs(config.yMin ?? bounds.yMin)
  );
  const isLarge = curSpan > 15;
  const zoomDisplay = isLarge ? Math.round(curSpan).toString() : (Math.round(curSpan * 10) / 10).toString();
  const zoomMin = isLarge ? Math.max(20, Math.round(curSpan * 0.3)) : 3;
  const zoomMax = isLarge ? Math.round(curSpan * 2.5) : 15;
  const zoomStep = isLarge ? Math.max(10, Math.round(curSpan / 20)) : 0.5;
  const zoomValue = isLarge ? Math.round(curSpan) : Math.round(curSpan * 10) / 10;

  const handleZoomChange = (newVal: number) => {
    if (newVal <= 0) return;
    const currentMax = curSpan;
    if (currentMax <= 0) return;
    const ratio = newVal / currentMax;
    const curXMin = config.xMin ?? bounds.xMin;
    const curXMax = config.xMax ?? bounds.xMax;
    const curYMin = config.yMin ?? bounds.yMin;
    const curYMax = config.yMax ?? bounds.yMax;
    setConfig(prev => ({
      ...prev,
      xMin: Math.round(curXMin * ratio * 10) / 10,
      xMax: Math.round(curXMax * ratio * 10) / 10,
      yMin: Math.round(curYMin * ratio * 10) / 10,
      yMax: Math.round(curYMax * ratio * 10) / 10,
    }));
  };

  const handleZoomStep = (direction: number) => {
    const delta = isLarge ? (curSpan > 100 ? 50 : 10) : 0.5;
    const next = Math.max(zoomMin, Math.min(zoomMax, Math.round((curSpan + direction * delta) * 10) / 10));
    handleZoomChange(next);
  };

  const currentStep = config.tickStepX ?? bounds.stepX ?? 1;
  const stepOptions = isLarge
    ? [
        { step: 100, label: '100 (chuẩn)' },
        { step: 50, label: '50' },
        { step: 200, label: '200' },
      ]
    : [
        { step: 1, label: '1 (chuẩn)' },
        { step: 0.5, label: '0.5' },
        { step: 2, label: '2' },
      ];

  return (
    <div className="w-full space-y-4">
      {/* THÔNG BÁO COPY */}
      {copySuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{copySuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* CỘT TRÁI: ĐIỀU KHIỂN & BẤT PHƯƠNG TRÌNH (5 CỘT) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {/* 1. MẪU BÀI TẬP SGK TOÁN 10 CHỌN NHANH */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles size={13} className="text-teal-600" />
              Bài tập mẫu SGK Toán 10 (Chuẩn đề thi):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {INEQUALITY_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setConfig(prev => ({
                    ...preset.config,
                    curveWidth: prev.curveWidth ?? 2.4,
                    axisWidth: prev.axisWidth ?? 1.8,
                    isBoldLabels: prev.isBoldLabels ?? false,
                    showTicks: prev.showTicks ?? false,
                    showTickLabels: prev.showTickLabels ?? false,
                    showGrid: prev.showGrid ?? false,
                    hatchPerpendicular: prev.hatchPerpendicular ?? true,
                  }))}
                  className="px-2.5 py-1.5 rounded-lg border text-left text-xs transition bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. NHẬP BẤT PHƯƠNG TRÌNH BẰNG CHỮ */}
          <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2 text-xs">
            <span className="font-extrabold text-teal-900 dark:text-teal-200 block">
              ✍️ Nhập Bất phương trình vào Hệ:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newIneqInput}
                onChange={e => setNewIneqInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddIneq();
                }}
                placeholder="Ví dụ: x + 2y <= 400, 5x - 7y <= 0, x >= 0..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-950 dark:text-teal-100 font-bold text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddIneq()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
              >
                <Plus size={14} />
                Thêm BPT
              </button>
            </div>

            {/* Nút chọn nhanh BPT thường gặp */}
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-[10px] font-bold text-slate-400">Chọn nhanh:</span>
              {['x >= 0', 'y >= 0', 'x + y <= 4', '2x + y <= 6', 'x - y <= 2'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddIneq(s)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 transition cursor-pointer"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          {/* 3. DANH SÁCH CÁC BẤT PHƯƠNG TRÌNH TRONG HỆ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Hệ bất phương trình hiện tại ({config.inequalities.length}):
              </span>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, inequalities: [] }))}
                className="text-[11px] text-rose-600 hover:underline cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {config.inequalities.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color ?? '#DC2626' }} />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {formatLineEqLabel(item.a, item.b, item.c).replace('=', item.op === '<=' ? '≤' : item.op === '>=' ? '≥' : item.op)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({item.op === '<' || item.op === '>' ? 'Nét đứt' : 'Nét liền'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveIneq(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Xóa BPT này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. ĐIỂM KIỂM TRA & ĐƯỜNG GIÓNG (TEST POINTS) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              📍 Thêm Điểm kiểm tra / Tọa độ đỉnh (kèm đường gióng):
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Tọa độ x:</span>
                <input
                  type="number"
                  step="any"
                  value={newPtX}
                  onChange={e => setNewPtX(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-center font-mono font-bold text-xs rounded border bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Tọa độ y:</span>
                <input
                  type="number"
                  step="any"
                  value={newPtY}
                  onChange={e => setNewPtY(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-center font-mono font-bold text-xs rounded border bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Tên nhãn:</span>
                <input
                  type="text"
                  value={newPtLabel}
                  onChange={e => setNewPtLabel(e.target.value)}
                  placeholder="M, A..."
                  className="w-full px-2 py-1 text-center font-bold text-xs rounded border bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="w-full py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-xs transition cursor-pointer"
                >
                  Thêm điểm
                </button>
              </div>
            </div>

            {/* Danh sách điểm */}
            {config.points && config.points.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {config.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[11px]"
                  >
                    <span className="font-bold text-teal-800 dark:text-teal-200">
                      {pt.label ? `${pt.label}(${pt.x}; ${pt.y})` : `(${pt.x}; ${pt.y})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. TÙY CHỌN HIỂN THỊ MIỀN NGHIỆM */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.tintFeasibleRegion ?? true}
                onChange={e => setConfig({ ...config, tintFeasibleRegion: e.target.checked })}
                className="rounded text-teal-600"
              />
              <span>Tô xanh miền nghiệm</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer" title="Nét gạch sọc luôn vuông góc với từng đường thẳng biên theo chuẩn SGK Toán">
              <input
                type="checkbox"
                checked={config.hatchPerpendicular ?? true}
                onChange={e => setConfig({ ...config, hatchPerpendicular: e.target.checked })}
                className="rounded text-teal-600"
              />
              <span>Gạch vuông góc đường biên</span>
            </label>
          </div>

          {/* NÚT COPY & TẢI ẢNH */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Copy size={15} />
              Copy ảnh (Ctrl+V vào Word)
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={15} />
              Tải PNG
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: KHUNG VẼ CANVAS TRỰC TIẾP (7 CỘT) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[460px]">
          {/* CỤM ĐIỀU KHIỂN CÔNG CỤ: PHÔNG, NÉT, CỠ CHỮ, THU PHÓNG, BƯỚC CHIA, LƯỚI */}
          <div className="w-full flex flex-col gap-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            {/* Dòng 1: Phông chữ, Kiểu nét & Cỡ chữ */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Cụm Phông chữ & Nút chọn nhanh */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Type size={13} className="text-teal-600" />
                    Phông:
                  </span>
                  <select
                    value={graphFont}
                    onChange={e => {
                      const val = e.target.value;
                      setGraphFont(val);
                      if (val === 'latex') {
                        setConfig(prev => ({
                          ...prev,
                          isBoldLabels: false,
                          curveWidth: 2.0,
                          axisWidth: 1.4
                        }));
                      }
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] rounded px-1.5 py-0.5 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="latex">🖋️ LaTeX / TikZ (Computer Modern)</option>
                    <option value="times">🏛️ Times New Roman (SGK)</option>
                    <option value="cambria">📐 Cambria Math</option>
                    <option value="sans">✨ Be Vietnam Pro</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGraphFont('latex');
                      setConfig(prev => ({
                        ...prev,
                        isBoldLabels: false,
                        curveWidth: 2.0,
                        axisWidth: 1.4
                      }));
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      graphFont === 'latex'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    LaTeX (Mẫu)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGraphFont('times');
                      setConfig(prev => ({
                        ...prev,
                        isBoldLabels: true,
                        curveWidth: 2.4,
                        axisWidth: 1.8
                      }));
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      graphFont === 'times'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50'
                    }`}
                  >
                    Times SGK
                  </button>
                </div>
              </div>

              {/* Cụm Nét vẽ, Chữ đậm & Cỡ chữ */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Nét vẽ biên */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <span className="text-slate-400 px-1.5">Nét:</span>
                  {[
                    { w: 1.6, label: 'Mảnh' },
                    { w: 2.4, label: 'Chuẩn' },
                    { w: 3.6, label: 'Đậm' },
                  ].map(item => (
                    <button
                      key={item.w}
                      type="button"
                      onClick={() => setConfig({ ...config, curveWidth: item.w })}
                      className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                        Math.abs((config.curveWidth ?? 2.4) - item.w) < 0.2
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* In đậm chữ số */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, isBoldLabels: true })}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      config.isBoldLabels !== false
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Chữ đậm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, isBoldLabels: false })}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      config.isBoldLabels === false
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Thường
                  </button>
                </div>

                {/* Slider cỡ chữ */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500">
                    Cỡ: <span className="font-mono text-teal-700 dark:text-teal-300 font-bold">{Math.round(fontScale * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min="0.75"
                    max="1.6"
                    step="0.05"
                    value={fontScale}
                    onChange={e => setFontScale(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setFontScale(prev => Math.max(0.75, Math.round((prev - 0.1) * 10) / 10))}
                      className="px-1 py-0.2 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100 cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontScale(prev => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10))}
                      className="px-1 py-0.2 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dòng 2: Thu phóng Oxy & Lưới tọa độ */}
            <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Thu phóng phạm vi Oxy */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Ruler size={13} className="text-teal-600" />
                  Thu phóng: <span className="font-mono font-bold text-teal-700 dark:text-teal-300">±{zoomDisplay}</span>
                </span>
                <input
                  type="range"
                  min={zoomMin}
                  max={zoomMax}
                  step={zoomStep}
                  value={zoomValue}
                  onChange={e => handleZoomChange(parseFloat(e.target.value))}
                  className="w-20 sm:w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleZoomStep(1)}
                    className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Mở rộng trục Oxy (-)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomStep(-1)}
                    className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Thu hẹp trục Oxy (+)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bước chia & Lưới */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">Bước:</span>
                  <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                    {stepOptions.map(item => (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => setConfig({
                          ...config,
                          tickStepX: item.step,
                          tickStepY: item.step
                        })}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                          currentStep === item.step
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showTicks ?? false}
                    onChange={e => setConfig({ ...config, showTicks: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>Vạch chia</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showTickLabels ?? false}
                    onChange={e => setConfig({ 
                      ...config, 
                      showTickLabels: e.target.checked,
                      showTicks: e.target.checked ? true : config.showTicks 
                    })}
                    className="rounded text-teal-600"
                  />
                  <span>Đánh số</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.showGrid ?? false}
                    onChange={e => setConfig({ ...config, showGrid: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>Lưới ô</span>
                </label>
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-teal-600" />
              Hình vẽ Miền nghiệm BPT trên hệ trục Oxy:
            </span>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-600 inline-block" /> Đường thẳng biên
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-300 inline-block" /> Miền gạch sọc (vuông góc đường biên, loại bỏ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-sky-200 inline-block" /> Miền nghiệm (xanh nhạt)
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-lg shadow-xs bg-white border border-slate-200"
            />
          </div>

          <div className="w-full mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div>💡 <strong>Quy ước SGK:</strong> Đường thẳng biên là <strong>nét liền</strong> nếu có dấu bằng (≤, ≥) và <strong>nét đứt</strong> nếu là bất đẳng thức ngặt (&lt;, &gt;).</div>
            <div>💡 Nửa mặt phẳng <strong>gạch sọc</strong> là phần bị loại bỏ. Phần không bị gạch (tô màu xanh nhạt) là <strong>miền nghiệm</strong> của hệ bất phương trình.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
