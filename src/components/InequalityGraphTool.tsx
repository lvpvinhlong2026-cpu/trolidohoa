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
  getAutoBounds,
  InequalityLabelHitbox
} from '../utils/inequalityEngine';
import { addDpiToBlob, cropCanvasToContent } from '../utils/dpiUtils';
import { MathFontChoice, MATH_FONT_FAMILIES } from './MathFontSelector';

interface Props {
  fontScale?: number;
  graphFont?: string;
}

export default function InequalityGraphTool({ fontScale: initialFontScale = 1.0, graphFont: initialGraphFont = 'times' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Local font & fontScale state
  const [graphFont, setGraphFont] = useState<MathFontChoice>((initialGraphFont === 'latex' ? 'latex' : 'times'));
  const [fontScale, setFontScale] = useState<number>(initialFontScale || 1.0);

  // Drag & drop nhãn, số và chữ
  const [labelHitboxes, setLabelHitboxes] = useState<InequalityLabelHitbox[]>([]);
  const [hoveredLabelId, setHoveredLabelId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    active: boolean;
    type: 'label' | 'pan';
    hitbox?: InequalityLabelHitbox;
    startMouseX: number;
    startMouseY: number;
    initialOffset?: { x: number; y: number };
    initialViewport?: { xMin: number; xMax: number; yMin: number; yMax: number };
  } | null>(null);

  // Cấu hình ban đầu: Mẫu 1 (x + 2y <= 400, x >= 0, y >= 0 - Hình 1) chuẩn quy cách mẫu
  const [config, setConfig] = useState<InequalityConfig>({
    ...INEQUALITY_PRESETS[0].config,
    isBoldLabels: false,
    curveWidth: 2.4,
    axisWidth: 1.8,
    showTicks: false,
    showTickLabels: false,
    showAxisIntersections: true,
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
    if (f === 'latex') return MATH_FONT_FAMILIES.latex;
    return MATH_FONT_FAMILIES.times;
  };

  // Đồng bộ props nếu có cập nhật từ cấp cha
  useEffect(() => {
    if (initialGraphFont) setGraphFont(initialGraphFont === 'latex' ? 'latex' : 'times');
  }, [initialGraphFont]);

  useEffect(() => {
    if (initialFontScale) setFontScale(initialFontScale);
  }, [initialFontScale]);

  // Render canvas
  useEffect(() => {
    if (canvasRef.current) {
      try {
        const res = renderInequalityToCanvas(config, canvasRef.current, 2.4, {
          fontFamily: getFontFamily(graphFont),
          fontSizeScale: fontScale
        });
        if (res && res.hitboxes) {
          setLabelHitboxes(res.hitboxes);
        }
        setDataUrl(canvasRef.current.toDataURL('image/png'));
      } catch (err) {
        console.error('Lỗi render miền nghiệm BPT:', err);
      }
    }
  }, [config, fontScale, graphFont]);

  // Tọa độ chuột trong hệ tọa độ canvas CSS (540 x 460)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 540 / (rect.width || 540);
    const scaleY = 460 / (rect.height || 460);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    // Tìm hitbox gần nhất (với padding 6px cho dễ click)
    const hit = labelHitboxes.find(h => 
      x >= h.x - 6 && x <= h.x + h.width + 6 && 
      y >= h.y - 6 && y <= h.y + h.height + 6
    );

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (hit) {
      let initialOffset = { x: 0, y: 0 };
      if (hit.type === 'origin') {
        initialOffset = { x: config.originOffset?.x ?? 0, y: config.originOffset?.y ?? 0 };
      } else if (hit.type === 'ox') {
        const custom = config.oxLabelOffsets?.[hit.text];
        initialOffset = { x: custom?.offsetX ?? 0, y: custom?.offsetY ?? 0 };
      } else if (hit.type === 'oy') {
        const custom = config.oyLabelOffsets?.[hit.text];
        initialOffset = { x: custom?.offsetX ?? 0, y: custom?.offsetY ?? 0 };
      } else if (hit.type === 'axis_x') {
        initialOffset = { x: config.axisLabelXOffset?.x ?? 0, y: config.axisLabelXOffset?.y ?? 0 };
      } else if (hit.type === 'axis_y') {
        initialOffset = { x: config.axisLabelYOffset?.x ?? 0, y: config.axisLabelYOffset?.y ?? 0 };
      } else if (hit.type === 'line_label' && hit.lineId) {
        const custom = config.lineLabelOffsets?.[hit.lineId];
        initialOffset = { x: custom?.offsetX ?? 0, y: custom?.offsetY ?? 0 };
      } else if (hit.type === 'point_label') {
        const custom = config.pointLabelOffsets?.[hit.text] || config.pointLabelOffsets?.[`pt_${hit.pointIndex}`];
        initialOffset = { x: custom?.offsetX ?? 0, y: custom?.offsetY ?? 0 };
      }

      setDragState({
        active: true,
        type: 'label',
        hitbox: hit,
        startMouseX: x,
        startMouseY: y,
        initialOffset
      });
    } else {
      const bounds = getAutoBounds(config);
      setDragState({
        active: true,
        type: 'pan',
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        initialViewport: {
          xMin: bounds.xMin,
          xMax: bounds.xMax,
          yMin: bounds.yMin,
          yMax: bounds.yMax
        }
      });
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (!dragState?.active) {
      const hit = labelHitboxes.find(h => 
        x >= h.x - 6 && x <= h.x + h.width + 6 && 
        y >= h.y - 6 && y <= h.y + h.height + 6
      );
      setHoveredLabelId(hit ? hit.id : null);
      return;
    }

    if (dragState.type === 'label' && dragState.hitbox) {
      const dx = Math.round(x - dragState.startMouseX);
      const dy = Math.round(y - dragState.startMouseY);
      const hit = dragState.hitbox;

      if (hit.type === 'origin') {
        setConfig(prev => ({
          ...prev,
          originOffset: {
            x: (dragState.initialOffset?.x ?? 0) + dx,
            y: (dragState.initialOffset?.y ?? 0) + dy
          }
        }));
      } else if (hit.type === 'ox') {
        setConfig(prev => ({
          ...prev,
          oxLabelOffsets: {
            ...prev.oxLabelOffsets,
            [hit.text]: {
              offsetX: (dragState.initialOffset?.x ?? 0) + dx,
              offsetY: (dragState.initialOffset?.y ?? 0) + dy
            }
          }
        }));
      } else if (hit.type === 'oy') {
        setConfig(prev => ({
          ...prev,
          oyLabelOffsets: {
            ...prev.oyLabelOffsets,
            [hit.text]: {
              offsetX: (dragState.initialOffset?.x ?? 0) + dx,
              offsetY: (dragState.initialOffset?.y ?? 0) + dy
            }
          }
        }));
      } else if (hit.type === 'axis_x') {
        setConfig(prev => ({
          ...prev,
          axisLabelXOffset: {
            x: (dragState.initialOffset?.x ?? 0) + dx,
            y: (dragState.initialOffset?.y ?? 0) + dy
          }
        }));
      } else if (hit.type === 'axis_y') {
        setConfig(prev => ({
          ...prev,
          axisLabelYOffset: {
            x: (dragState.initialOffset?.x ?? 0) + dx,
            y: (dragState.initialOffset?.y ?? 0) + dy
          }
        }));
      } else if (hit.type === 'line_label' && hit.lineId) {
        setConfig(prev => ({
          ...prev,
          lineLabelOffsets: {
            ...prev.lineLabelOffsets,
            [hit.lineId!]: {
              offsetX: (dragState.initialOffset?.x ?? 0) + dx,
              offsetY: (dragState.initialOffset?.y ?? 0) + dy
            }
          }
        }));
      } else if (hit.type === 'point_label') {
        const key = hit.text || `pt_${hit.pointIndex}`;
        setConfig(prev => ({
          ...prev,
          pointLabelOffsets: {
            ...prev.pointLabelOffsets,
            [key]: {
              offsetX: (dragState.initialOffset?.x ?? 0) + dx,
              offsetY: (dragState.initialOffset?.y ?? 0) + dy
            }
          }
        }));
      }
    } else if (dragState.type === 'pan' && dragState.initialViewport) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const deltaScreenX = e.clientX - dragState.startMouseX;
      const deltaScreenY = e.clientY - dragState.startMouseY;

      const spanX = dragState.initialViewport.xMax - dragState.initialViewport.xMin;
      const spanY = dragState.initialViewport.yMax - dragState.initialViewport.yMin;

      const mathDx = -(deltaScreenX / (rect.width || 540)) * spanX;
      const mathDy = (deltaScreenY / (rect.height || 460)) * spanY;

      setConfig(prev => ({
        ...prev,
        xMin: Math.round((dragState.initialViewport!.xMin + mathDx) * 100) / 100,
        xMax: Math.round((dragState.initialViewport!.xMax + mathDx) * 100) / 100,
        yMin: Math.round((dragState.initialViewport!.yMin + mathDy) * 100) / 100,
        yMax: Math.round((dragState.initialViewport!.yMax + mathDy) * 100) / 100
      }));
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragState?.active) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDragState(null);
    }
  };

  const getCanvasCursor = () => {
    if (dragState?.active) {
      return dragState.type === 'label' ? 'cursor-grabbing' : 'cursor-move';
    }
    if (hoveredLabelId) {
      return 'cursor-grab';
    }
    return 'cursor-crosshair';
  };

  const resetLabelPositions = () => {
    setConfig(prev => ({
      ...prev,
      originOffset: undefined,
      axisLabelXOffset: undefined,
      axisLabelYOffset: undefined,
      oxLabelOffsets: {},
      oyLabelOffsets: {},
      lineLabelOffsets: {},
      pointLabelOffsets: {}
    }));
  };

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

  // Lắng nghe sự kiện từ thanh Ribbon Word
  useEffect(() => {
    const handleRibbonAction = (e: Event) => {
      const ce = e as CustomEvent;
      if (!ce.detail) return;
      if (ce.detail.type === 'copy_word') {
        handleCopy();
      } else if (ce.detail.type === 'download_png') {
        handleDownload();
      } else if (ce.detail.type === 'set_font' && ce.detail.font) {
        setGraphFont(ce.detail.font);
      } else if (ce.detail.type === 'set_stroke' && ce.detail.stroke) {
        setConfig(prev => ({ ...prev, curveWidth: ce.detail.stroke }));
      } else if (ce.detail.type === 'toggle_bold') {
        setConfig(prev => ({ ...prev, isBoldLabels: !prev.isBoldLabels }));
      }
    };
    const onIneqCopy = () => handleCopy();
    const onIneqDownload = () => handleDownload();
    window.addEventListener('lvp_ribbon_action', handleRibbonAction);
    window.addEventListener('lvp_ineq_copy', onIneqCopy);
    window.addEventListener('lvp_ineq_download', onIneqDownload);
    return () => {
      window.removeEventListener('lvp_ribbon_action', handleRibbonAction);
      window.removeEventListener('lvp_ineq_copy', onIneqCopy);
      window.removeEventListener('lvp_ineq_download', onIneqDownload);
    };
  }, [config, fontScale, graphFont]);

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
            <label className="flex items-center gap-1.5 cursor-pointer col-span-2 text-teal-700 dark:text-teal-400 font-bold" title="Hiện giao điểm và điểm số dạng toán học của các đường thẳng với trục Ox, Oy">
              <input
                type="checkbox"
                checked={config.showAxisIntersections !== false}
                onChange={e => setConfig({ ...config, showAxisIntersections: e.target.checked })}
                className="rounded text-teal-600"
              />
              <span>Hiện giao điểm với Ox, Oy (chuẩn toán học)</span>
            </label>
          </div>

          {/* GHI CHÚ XUẤT ẢNH: ĐÃ ĐỒNG BỘ LÊN THANH RIBBON WORD */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Xuất ảnh miền nghiệm 300 DPI trực tiếp bằng nút <strong>"Cắt nhanh"</strong> hoặc <strong>"Copy vào Word"</strong> trên thanh Ribbon Word
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: KHUNG VẼ CANVAS TRỰC TIẾP (7 CỘT) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[460px]">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <TrendingUp size={15} className="text-teal-600" />
                Hình vẽ Miền nghiệm BPT trên hệ trục Oxy:
              </span>
              <button
                type="button"
                onClick={resetLabelPositions}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Khôi phục vị trí mặc định cho tất cả nhãn, số và chữ"
              >
                <RotateCcw size={12} />
                <span>Đặt lại vị trí nhãn</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-red-600 inline-block" /> Đường biên
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-300 inline-block" /> Miền gạch sọc
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-sky-200 inline-block" /> Miền nghiệm
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 overflow-x-auto">
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
              className={`max-w-full h-auto rounded-lg shadow-xs bg-white border border-slate-200 select-none touch-none ${getCanvasCursor()}`}
              title="Click & kéo trực tiếp chữ O, chữ x, y, số giao điểm trên trục hoặc tên đường thẳng để sắp xếp thoáng đẹp!"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
