import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Copy, Download, CheckCircle2, 
  Play, Pause, RotateCcw, RotateCw, ZoomIn, ZoomOut, Eye,
  Compass, FolderKanban
} from 'lucide-react';
import { 
  renderGeometry3DToCanvas, 
  getGeometry3DPoints, 
  getDefaultAngles, 
  Geometry3DConfig 
} from '../utils/geometry3dEngine';
import { addDpiToBlob } from '../utils/dpiUtils';

export interface Interactive3DGeometryProps {
  externalPreset?: string | null;
  onOpenGsp?: (presetId?: string) => void;
  onOpenPresets?: () => void;
  isSplitView?: boolean;
}

export default function Interactive3DGeometry({
  externalPreset,
  onOpenGsp,
  onOpenPresets,
  isSplitView = false
}: Interactive3DGeometryProps = {}) {
  const [geoConfig, setGeoConfig] = useState<Geometry3DConfig>({
    preset: 'pyramid_s_abcd',
    showCenterO: true,
    showMidpointM: true,
    showDiagonals: false
  });
  const geoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Nhận preset từ ngoài (Thư viện mẫu SGK hoặc Bảng vẽ GSP)
  useEffect(() => {
    if (!externalPreset) return;
    let mapped: Geometry3DConfig['preset'] | null = null;
    if (externalPreset === 'chop_tu_giac_deu' || externalPreset === 'pyramid_regular_quad' || externalPreset === 'pyramid_s_abcd') {
      mapped = 'pyramid_s_abcd';
    } else if (externalPreset === 'chop_sa_vuong_day' || externalPreset === 'pyramid_sa_bottom') {
      mapped = 'pyramid_sa_bottom';
    } else if (externalPreset === 'chop_tam_giac_deu' || externalPreset === 'chop_tam_giac' || externalPreset === 'pyramid_regular_tri' || externalPreset === 'pyramid_s_abc') {
      mapped = 'pyramid_s_abc';
    } else if (externalPreset === 'lang_tru_tam_giac' || externalPreset === 'prism_abc') {
      mapped = 'prism_abc';
    } else if (externalPreset === 'hinh_hop_chu_nhat' || externalPreset === 'box_abcd') {
      mapped = 'box_abcd';
    }

    if (mapped) {
      const def = getDefaultAngles(mapped);
      setIsAutoRotating(false);
      setGeoConfig(prev => ({
        ...prev,
        preset: mapped!,
        rotX: def.rotX,
        rotY: def.rotY,
        zoom: def.zoom,
        panX: def.panX,
        panY: def.panY,
        pointOverrides: undefined,
        hoveredPoint: null,
        draggedPoint: null
      }));
    }
  }, [externalPreset]);

  const dragStateRef = useRef<{
    isDragging: boolean;
    targetPoint: string | null;
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
  }>({
    isDragging: false,
    targetPoint: null,
    startX: 0,
    startY: 0,
    startRotX: 0,
    startRotY: 0
  });

  // Vòng lặp tự động xoay 360 độ mượt mà khi bật nút Play
  useEffect(() => {
    if (!isAutoRotating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const animate = () => {
      setGeoConfig(prev => {
        const def = getDefaultAngles(prev.preset);
        const curY = prev.rotY ?? def.rotY;
        return {
          ...prev,
          rotY: curY + 0.007,
          pointOverrides: undefined
        };
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotating]);

  useEffect(() => {
    if (geoCanvasRef.current) {
      try {
        renderGeometry3DToCanvas(geoConfig, geoCanvasRef.current, 3);
      } catch (err) {
        console.error('Lỗi render hình học 3D:', err);
      }
    }
  }, [geoConfig]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = geoCanvasRef.current;
    if (!canvas) return { x: 250, y: 200 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (500 / (rect.width || 500));
    const y = (clientY - rect.top) * (400 / (rect.height || 400));
    return { x, y };
  };

  const findNearestPointKey = (x: number, y: number): string | null => {
    const allPts = getGeometry3DPoints(geoConfig, 500, 400);
    let closestKey: string | null = null;
    let minDist = 18;
    for (const [key, pt] of Object.entries(allPts)) {
      if (key === 'O' && !geoConfig.showCenterO) continue;
      if (key === 'M' && !geoConfig.showMidpointM) continue;
      const d = Math.hypot(x - pt.x, y - pt.y);
      if (d < minDist) {
        minDist = d;
        closestKey = key;
      }
    }
    return closestKey;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitKey = findNearestPointKey(x, y);
    const def = getDefaultAngles(geoConfig.preset);

    dragStateRef.current = {
      isDragging: true,
      targetPoint: hitKey,
      startX: e.clientX,
      startY: e.clientY,
      startRotX: geoConfig.rotX ?? def.rotX,
      startRotY: geoConfig.rotY ?? def.rotY
    };

    if (hitKey) {
      setGeoConfig(prev => ({ ...prev, draggedPoint: hitKey }));
    } else {
      setIsAutoRotating(false);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const state = dragStateRef.current;

    if (!state.isDragging) {
      const hitKey = findNearestPointKey(x, y);
      if (hitKey !== geoConfig.hoveredPoint) {
        setGeoConfig(prev => ({ ...prev, hoveredPoint: hitKey }));
      }
      if (geoCanvasRef.current) {
        geoCanvasRef.current.style.cursor = hitKey ? 'grab' : 'crosshair';
      }
      return;
    }

    if (geoCanvasRef.current) {
      geoCanvasRef.current.style.cursor = 'grabbing';
    }

    if (state.targetPoint) {
      setGeoConfig(prev => ({
        ...prev,
        pointOverrides: {
          ...(prev.pointOverrides || {}),
          [state.targetPoint!]: { x: Math.round(x), y: Math.round(y) }
        }
      }));
    } else {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const sensitivity = 0.012;
      setGeoConfig(prev => ({
        ...prev,
        rotY: state.startRotY + dx * sensitivity,
        rotX: Math.max(-1.4, Math.min(1.4, state.startRotX + dy * sensitivity)),
        pointOverrides: undefined
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.targetPoint = null;
    setGeoConfig(prev => ({ ...prev, draggedPoint: null }));
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setGeoConfig(prev => ({
      ...prev,
      zoom: Math.max(0.4, Math.min(3.0, (prev.zoom ?? 1.0) * factor))
    }));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const hitKey = findNearestPointKey(x, y);
      const def = getDefaultAngles(geoConfig.preset);
      dragStateRef.current = {
        isDragging: true,
        targetPoint: hitKey,
        startX: touch.clientX,
        startY: touch.clientY,
        startRotX: geoConfig.rotX ?? def.rotX,
        startRotY: geoConfig.rotY ?? def.rotY
      };
      if (hitKey) setGeoConfig(prev => ({ ...prev, draggedPoint: hitKey }));
      else setIsAutoRotating(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (dragStateRef.current.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const state = dragStateRef.current;
      if (state.targetPoint) {
        setGeoConfig(prev => ({
          ...prev,
          pointOverrides: {
            ...(prev.pointOverrides || {}),
            [state.targetPoint!]: { x: Math.round(x), y: Math.round(y) }
          }
        }));
      } else {
        const dx = touch.clientX - state.startX;
        const dy = touch.clientY - state.startY;
        const sensitivity = 0.012;
        setGeoConfig(prev => ({
          ...prev,
          rotY: state.startRotY + dx * sensitivity,
          rotX: Math.max(-1.4, Math.min(1.4, state.startRotX + dy * sensitivity)),
          pointOverrides: undefined
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.targetPoint = null;
    setGeoConfig(prev => ({ ...prev, draggedPoint: null }));
  };

  const handleResetView = () => {
    const def = getDefaultAngles(geoConfig.preset);
    setIsAutoRotating(false);
    setGeoConfig(prev => ({
      ...prev,
      rotX: def.rotX,
      rotY: def.rotY,
      zoom: def.zoom,
      panX: def.panX,
      panY: def.panY,
      pointOverrides: undefined,
      hoveredPoint: null,
      draggedPoint: null
    }));
  };

  const handleZoom = (factor: number) => {
    setGeoConfig(prev => ({
      ...prev,
      zoom: Math.max(0.4, Math.min(3.0, (prev.zoom ?? 1.0) * factor))
    }));
  };

  const handleCopyImage = async (offscreenCanvas: HTMLCanvasElement) => {
    try {
      const blob = await new Promise<Blob | null>(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Canvas toBlob failed");
      const blobWithDpi = await addDpiToBlob(blob, 300);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobWithDpi })
      ]);
      setCopySuccess('Đã copy hình học 3D (300 DPI) vào Clipboard! Dán (Ctrl+V) ngay vào Word.');
      setTimeout(() => setCopySuccess(null), 3500);
    } catch (err) {
      console.error('Lỗi copy ảnh:', err);
      setCopySuccess('Không thể copy trực tiếp. Vui lòng bấm "Tải PNG".');
      setTimeout(() => setCopySuccess(null), 4000);
    }
  };

  const handleExportQuick3D = (action: 'copy' | 'download') => {
    try {
      const offscreen = document.createElement('canvas');
      renderGeometry3DToCanvas({ ...geoConfig, isExporting: true }, offscreen, 3);
      if (action === 'copy') {
        handleCopyImage(offscreen);
      } else {
        const dataUrl = offscreen.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Hinh_hoc_3D_${geoConfig.preset}_300dpi.png`;
        a.click();
      }
    } catch (err) {
      console.error('Lỗi xuất ảnh 3D:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {copySuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{copySuccess}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isSplitView ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-5 items-start`}>
        {/* Cột trái chọn khối mẫu */}
        <div className={`${isSplitView ? 'w-full' : 'lg:col-span-5'} bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              Chọn khối hình học mẫu:
            </span>
            {onOpenPresets && (
              <button
                onClick={onOpenPresets}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <FolderKanban size={13} />
                Thư viện SGK
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'pyramid_s_abcd', label: 'Hình chóp S.ABCD đáy bình hành', desc: 'Dạng chuẩn thi THPT 2025' },
              { id: 'pyramid_s_abc', label: 'Hình chóp tam giác S.ABC', desc: 'Đáy tam giác bất kỳ' },
              { id: 'pyramid_sa_bottom', label: 'Hình chóp S.ABCD (SA ⊥ đáy)', desc: 'Cạnh bên vuông góc đáy' },
              { id: 'prism_abc', label: 'Lăng trụ tam giác ABC.A\'B\'C\'', desc: 'Khối lăng trụ chuẩn' },
              { id: 'box_abcd', label: 'Hộp chữ nhật ABCD.A\'B\'C\'D\'', desc: 'Khối đa diện vuông vắn' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => {
                  const def = getDefaultAngles(g.id as any);
                  setIsAutoRotating(false);
                  setGeoConfig({
                    ...geoConfig,
                    preset: g.id as any,
                    rotX: def.rotX,
                    rotY: def.rotY,
                    zoom: def.zoom,
                    panX: def.panX,
                    panY: def.panY,
                    pointOverrides: undefined,
                    hoveredPoint: null,
                    draggedPoint: null
                  });
                }}
                className={`p-2.5 rounded-xl border text-left font-bold transition ${
                  geoConfig.preset === g.id
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-500 shadow-xs ring-1 ring-teal-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs">{g.label}</div>
                <div className="text-[10px] font-normal text-slate-400">{g.desc}</div>
              </button>
            ))}
          </div>

          {/* Checkboxes chi tiết hình học */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tùy chọn vẽ điểm & đường đặc biệt:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoConfig.showCenterO}
                  onChange={e => setGeoConfig({ ...geoConfig, showCenterO: e.target.checked })}
                  className="rounded text-teal-600"
                />
                Tâm đáy O
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoConfig.showMidpointM}
                  onChange={e => setGeoConfig({ ...geoConfig, showMidpointM: e.target.checked })}
                  className="rounded text-teal-600"
                />
                Trung điểm M (cạnh SC)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoConfig.showDiagonals}
                  onChange={e => setGeoConfig({ ...geoConfig, showDiagonals: e.target.checked })}
                  className="rounded text-teal-600"
                />
                Đường chéo đáy (AC, BD)
              </label>
            </div>
          </div>

          {/* Hàng nút tác vụ xuất ảnh & chuyển phân hệ */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            {onOpenGsp && (
              <button
                onClick={() => onOpenGsp(geoConfig.preset)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Chuyển sang Bảng vẽ GSP để vẽ thêm đường phụ, đoạn thẳng, thiết diện hoặc ký hiệu vuông góc"
              >
                <Compass size={15} />
                <span>Vẽ tiếp trên Bảng vẽ GSP (2D)</span>
              </button>
            )}

            <button
              onClick={() => handleExportQuick3D('copy')}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Copy size={15} />
              <span>Copy ảnh Word</span>
            </button>

            <button
              onClick={() => handleExportQuick3D('download')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={15} />
              <span>Tải PNG</span>
            </button>
          </div>
        </div>

        {/* Khung Canvas 300 DPI tương tác trực tiếp */}
        <div className={`${isSplitView ? 'w-full' : 'lg:col-span-7'} bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[460px]`}>
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-teal-600" />
              Khung vẽ 300 DPI tương tác trực tiếp (Xoay 3D & Kéo đỉnh):
            </span>
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full">
              {geoConfig.preset}
            </span>
          </div>

          <div className="relative w-full flex items-center justify-center p-2 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 select-none overflow-hidden">
            {/* Thanh công cụ tương tác nổi phía trên canvas */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-800/60 shadow-xs pointer-events-auto text-[11px] font-bold text-teal-800 dark:text-teal-200">
                <RotateCw size={13} className={`text-teal-600 ${isAutoRotating ? 'animate-spin' : ''}`} />
                <span>
                  {geoConfig.draggedPoint 
                    ? `🎯 Đang kéo đỉnh ${geoConfig.draggedPoint}` 
                    : geoConfig.hoveredPoint 
                      ? `✨ Sẵn sàng kéo đỉnh ${geoConfig.hoveredPoint}` 
                      : '🖱️ Kéo để xoay 3D / Kéo đỉnh'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs pointer-events-auto">
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  title={isAutoRotating ? 'Tạm dừng tự xoay' : 'Tự động xoay 360°'}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    isAutoRotating 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600'
                  }`}
                >
                  {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <button
                  onClick={() => handleZoom(1.15)}
                  title="Phóng to"
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 transition cursor-pointer"
                >
                  <ZoomIn size={14} />
                </button>

                <button
                  onClick={() => handleZoom(0.87)}
                  title="Thu nhỏ"
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 transition cursor-pointer"
                >
                  <ZoomOut size={14} />
                </button>

                <button
                  onClick={handleResetView}
                  title="Đặt lại góc nhìn chuẩn SGK"
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <canvas
              ref={geoCanvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="max-w-full h-auto rounded-lg shadow-xs bg-white border border-slate-200 touch-none cursor-crosshair transition-shadow hover:shadow-md"
            />
          </div>

          <div className="mt-3.5 w-full p-2.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900/50 text-[11px] text-teal-900 dark:text-teal-200 flex flex-wrap items-center justify-around gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 font-medium">
              <span>🖱️</span> <b>Kéo nền:</b> Xoay 3D 360°
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span>🎯</span> <b>Kéo đỉnh (A, B, C, S...):</b> Biến dạng hình
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span>🔍</span> <b>Cuộn chuột:</b> Phóng to / Thu nhỏ
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span>↩️</span> <b>Nút reset:</b> Về chuẩn SGK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
