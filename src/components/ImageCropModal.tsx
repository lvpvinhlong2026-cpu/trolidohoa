import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  Copy,
  Download,
  Sparkles,
  Maximize2,
  Upload,
  X,
  Check,
  RotateCcw,
  Ruler,
  Image as ImageIcon,
  Square,
  RectangleHorizontal,
  Monitor
} from 'lucide-react';
import {
  addDpiToBlob,
  copyCroppedRegionToClipboard,
  cropRegionToCanvas,
  detectContentBoundingBox,
  CropExportOptions
} from '../utils/dpiUtils';

export interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  title?: string;
  onNotify?: (message: string) => void;
}

type AspectRatioMode = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragHandle =
  | 'inside'
  | 'nw'
  | 'ne'
  | 'se'
  | 'sw'
  | 'n'
  | 's'
  | 'w'
  | 'e'
  | 'draw';

export default function ImageCropModal({
  isOpen,
  onClose,
  initialImageUrl,
  title = 'Hình vẽ Toán học',
  onNotify,
}: ImageCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('free');
  const [borderStyle, setBorderStyle] = useState<'none' | 'solid_black' | 'solid_gray' | 'dashed'>('none');
  const [fillWhiteBg, setFillWhiteBg] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Normalized crop box in range [0, 1] relative to the image natural dimensions
  const [cropBoxNorm, setCropBoxNorm] = useState<CropBox>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });

  // Display container and image layout
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragHandleRef = useRef<DragHandle | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; box: CropBox }>({
    clientX: 0,
    clientY: 0,
    box: { x: 0, y: 0, w: 0, h: 0 }
  });

  // Cập nhật khi initialImageUrl thay đổi
  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  // Lắng nghe sự kiện Paste (Ctrl + V) trên toàn cửa sổ khi Modal đang mở
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              if (result) {
                setImageUrl(result);
                if (onNotify) onNotify('Đã dán ảnh từ Clipboard vào khung cắt!');
              }
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, onNotify]);

  // Lắng nghe phím Esc để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Khi ảnh tải xong, tính toán kích thước gốc và khởi tạo khung chọn
  const handleImageLoaded = () => {
    if (!imageRef.current) return;
    const nw = imageRef.current.naturalWidth;
    const nh = imageRef.current.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    // Tự động phát hiện viền vẽ (Auto-detect)
    const bbox = detectContentBoundingBox(imageRef.current, 24);
    if (bbox && nw > 0 && nh > 0) {
      setCropBoxNorm({
        x: Math.max(0, bbox.x / nw),
        y: Math.max(0, bbox.y / nh),
        w: Math.min(1, bbox.width / nw),
        h: Math.min(1, bbox.height / nh)
      });
    } else {
      setCropBoxNorm({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    }
  };

  // Chọn toàn bộ ảnh (100%)
  const handleSelectAll = () => {
    setAspectRatio('free');
    setCropBoxNorm({ x: 0, y: 0, w: 1, h: 1 });
  };

  // Bắt viền thông minh (Auto-detect content)
  const handleAutoDetect = () => {
    if (!imageRef.current || naturalSize.width === 0) return;
    const bbox = detectContentBoundingBox(imageRef.current, 24);
    if (bbox) {
      const nw = naturalSize.width;
      const nh = naturalSize.height;
      setAspectRatio('free');
      setCropBoxNorm({
        x: Math.max(0, bbox.x / nw),
        y: Math.max(0, bbox.y / nh),
        w: Math.min(1, bbox.width / nw),
        h: Math.min(1, bbox.height / nh)
      });
      if (onNotify) onNotify('Đã tự động ôm sát viền nội dung hình vẽ!');
    }
  };

  // Chuyển đổi tỉ lệ khung hình (Aspect Ratio)
  const handleApplyAspectRatio = (ratio: AspectRatioMode) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === '1:1') targetRatio = 1;
    else if (ratio === '4:3') targetRatio = 4 / 3;
    else if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '3:2') targetRatio = 3 / 2;

    const nw = naturalSize.width;
    const nh = naturalSize.height;
    if (nw <= 0 || nh <= 0) return;

    // Giữ nguyên chiều rộng hiện tại và điều chỉnh chiều cao theo tỉ lệ
    const currentPixelW = cropBoxNorm.w * nw;
    let targetPixelH = currentPixelW / targetRatio;
    let targetNormH = targetPixelH / nh;

    let targetNormW = cropBoxNorm.w;
    if (targetNormH > 1) {
      targetNormH = 1;
      targetPixelH = nh;
      const pixelW = targetPixelH * targetRatio;
      targetNormW = pixelW / nw;
    }

    let newX = cropBoxNorm.x;
    let newY = cropBoxNorm.y;

    if (newX + targetNormW > 1) newX = 1 - targetNormW;
    if (newY + targetNormH > 1) newY = 1 - targetNormH;

    setCropBoxNorm({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      w: Math.min(1, targetNormW),
      h: Math.min(1, targetNormH)
    });
  };

  // Tải ảnh từ máy tính (File Upload)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        if (onNotify) onNotify('Đã nạp tệp ảnh tải lên từ máy tính!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // TÍNH TOÁN KÍCH THƯỚC ĐỒ HỌA THỰC TẾ
  const nativePixelW = Math.max(1, Math.round(cropBoxNorm.w * naturalSize.width));
  const nativePixelH = Math.max(1, Math.round(cropBoxNorm.h * naturalSize.height));
  const printCmW = (nativePixelW / 300 * 2.54).toFixed(1);
  const printCmH = (nativePixelH / 300 * 2.54).toFixed(1);

  // CHÉP VÙNG CẮT VÀO WORD (300 DPI)
  const handleCopyToWord = async () => {
    if (!imageRef.current || naturalSize.width === 0) return;

    const cropRect = {
      x: cropBoxNorm.x * naturalSize.width,
      y: cropBoxNorm.y * naturalSize.height,
      width: cropBoxNorm.w * naturalSize.width,
      height: cropBoxNorm.h * naturalSize.height
    };

    const options: CropExportOptions = {
      fillWhiteBg,
      borderStyle,
      borderWidth: 1,
      dpi: 300
    };

    const success = await copyCroppedRegionToClipboard(imageRef.current, cropRect, options);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
      if (onNotify) {
        onNotify('Đã cắt và chép ảnh 300 DPI vào Clipboard! Thầy/Cô hãy mở Word và bấm Ctrl + V để dán.');
      }
    }
  };

  // TẢI ẢNH PNG ĐÃ CẮT (300 DPI)
  const handleDownloadPng = async () => {
    if (!imageRef.current || naturalSize.width === 0) return;

    const cropRect = {
      x: cropBoxNorm.x * naturalSize.width,
      y: cropBoxNorm.y * naturalSize.height,
      width: cropBoxNorm.w * naturalSize.width,
      height: cropBoxNorm.h * naturalSize.height
    };

    const options: CropExportOptions = {
      fillWhiteBg,
      borderStyle,
      borderWidth: 1,
      dpi: 300
    };

    const croppedCanvas = cropRegionToCanvas(imageRef.current, cropRect, options);
    const blob = await new Promise<Blob | null>(resolve => croppedCanvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    const blobWithDpi = await addDpiToBlob(blob, 300);
    const url = URL.createObjectURL(blobWithDpi);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hinh_cat_toan_hoc_300dpi.png`;
    a.click();
    URL.revokeObjectURL(url);

    if (onNotify) onNotify('Đã tải hình ảnh đã cắt (300 DPI) về máy tính.');
  };

  // =========================================================================
  // XỬ LÝ KÉO THẢ TƯƠNG TÁC (DRAG & RESIZE SELECTION BOX)
  // =========================================================================
  const getImageRenderMetrics = useCallback(() => {
    if (!imageRef.current) return null;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }, []);

  const handlePointerDown = (handle: DragHandle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const metrics = getImageRenderMetrics();
    if (!metrics) return;

    isDraggingRef.current = true;
    dragHandleRef.current = handle;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBoxNorm }
    };

    if (handle === 'draw') {
      const clickNormX = Math.max(0, Math.min(1, (e.clientX - metrics.left) / metrics.width));
      const clickNormY = Math.max(0, Math.min(1, (e.clientY - metrics.top) / metrics.height));
      const initialBox = { x: clickNormX, y: clickNormY, w: 0.01, h: 0.01 };
      setCropBoxNorm(initialBox);
      dragStartRef.current.box = initialBox;
    }

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragHandleRef.current) return;

    const metrics = getImageRenderMetrics();
    if (!metrics || metrics.width <= 0 || metrics.height <= 0) return;

    const deltaX = (e.clientX - dragStartRef.current.clientX) / metrics.width;
    const deltaY = (e.clientY - dragStartRef.current.clientY) / metrics.height;
    const startBox = dragStartRef.current.box;
    const handle = dragHandleRef.current;

    let newBox = { ...startBox };

    if (handle === 'inside') {
      // Di chuyển cả khung
      newBox.x = Math.max(0, Math.min(1 - startBox.w, startBox.x + deltaX));
      newBox.y = Math.max(0, Math.min(1 - startBox.h, startBox.y + deltaY));
    } else if (handle === 'draw') {
      // Kéo vẽ khung mới
      const curX = Math.max(0, Math.min(1, (e.clientX - metrics.left) / metrics.width));
      const curY = Math.max(0, Math.min(1, (e.clientY - metrics.top) / metrics.height));
      const originX = startBox.x;
      const originY = startBox.y;

      newBox.x = Math.min(originX, curX);
      newBox.y = Math.min(originY, curY);
      newBox.w = Math.max(0.02, Math.abs(curX - originX));
      newBox.h = Math.max(0.02, Math.abs(curY - originY));
    } else {
      // Co giãn từ 8 tay cầm
      let left = startBox.x;
      let top = startBox.y;
      let right = startBox.x + startBox.w;
      let bottom = startBox.y + startBox.h;

      if (handle.includes('w')) left = Math.min(right - 0.02, Math.max(0, startBox.x + deltaX));
      if (handle.includes('e')) right = Math.max(left + 0.02, Math.min(1, startBox.x + startBox.w + deltaX));
      if (handle.includes('n')) top = Math.min(bottom - 0.02, Math.max(0, startBox.y + deltaY));
      if (handle.includes('s')) bottom = Math.max(top + 0.02, Math.min(1, startBox.y + startBox.h + deltaY));

      newBox = {
        x: left,
        y: top,
        w: right - left,
        h: bottom - top
      };

      // Áp dụng khoá tỉ lệ Aspect Ratio khi kéo nếu đang bật
      if (aspectRatio !== 'free' && naturalSize.width > 0 && naturalSize.height > 0) {
        let targetRatio = 1;
        if (aspectRatio === '1:1') targetRatio = 1;
        else if (aspectRatio === '4:3') targetRatio = 4 / 3;
        else if (aspectRatio === '16:9') targetRatio = 16 / 9;
        else if (aspectRatio === '3:2') targetRatio = 3 / 2;

        const pixelW = newBox.w * naturalSize.width;
        const pixelH = pixelW / targetRatio;
        const normH = pixelH / naturalSize.height;

        if (newBox.y + normH <= 1) {
          newBox.h = normH;
        } else {
          newBox.h = 1 - newBox.y;
          const scaledPixelW = newBox.h * naturalSize.height * targetRatio;
          newBox.w = Math.min(1 - newBox.x, scaledPixelW / naturalSize.width);
        }
      }
    }

    setCropBoxNorm(newBox);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragHandleRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl max-h-[95vh] overflow-hidden">
        
        {/* =====================================================================
            1. MODAL HEADER
            ===================================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cắt Khung Chữ Nhật ➔ Dán Vào Microsoft Word</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  300 DPI Chuẩn In Ấn
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kéo chọn vùng hình chữ nhật cần trích xuất. Bấm &quot;Chép vào Word&quot; rồi mở Word nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] font-bold">Ctrl + V</kbd>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Tải tệp ảnh bất kỳ từ máy tính lên để cắt"
            >
              <Upload size={14} className="text-blue-500" />
              <span>Tải ảnh từ máy</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. TOP CONTROLS & TOOLBAR
            ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs">
          
          {/* Nhóm tỉ lệ (Aspect Ratio) */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Ruler size={13} />
              <span>Tỉ lệ khung:</span>
            </span>
            <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleApplyAspectRatio('free')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  aspectRatio === 'free'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Tự do
              </button>
              <button
                onClick={() => handleApplyAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Square size={11} />
                <span>1:1</span>
              </button>
              <button
                onClick={() => handleApplyAspectRatio('4:3')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  aspectRatio === '4:3'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <RectangleHorizontal size={12} />
                <span>4:3 (SGK)</span>
              </button>
              <button
                onClick={() => handleApplyAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Monitor size={12} />
                <span>16:9</span>
              </button>
              <button
                onClick={() => handleApplyAspectRatio('3:2')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  aspectRatio === '3:2'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                3:2 (Đề thi)
              </button>
            </div>
          </div>

          {/* Nhóm Bắt viền & Chọn toàn bộ */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoDetect}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 cursor-pointer transition shadow-2xs"
              title="Tự động phát hiện viền vẽ toán học để ôm sát không gian"
            >
              <Sparkles size={13} className="text-teal-500" />
              <span>Tự động bắt viền (Auto-Crop)</span>
            </button>

            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition"
              title="Chọn toàn bộ khung ảnh"
            >
              <Maximize2 size={13} />
              <span>Chọn tất cả</span>
            </button>
          </div>

          {/* Nhóm Viền & Nền Word */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Viền:</span>
              <select
                value={borderStyle}
                onChange={e => setBorderStyle(e.target.value as any)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="none">Không viền</option>
                <option value="solid_black">Viền đen mảnh (1px)</option>
                <option value="solid_gray">Viền xám chuẩn SGK</option>
                <option value="dashed">Viền nét đứt</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={fillWhiteBg}
                onChange={e => setFillWhiteBg(e.target.checked)}
                className="rounded accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Nền trắng Word</span>
            </label>
          </div>
        </div>

        {/* =====================================================================
            3. WORKSPACE: VÙNG HIỂN THỊ ẢNH & OVERLAY CẮT KHUNG CHỮ NHẬT
            ===================================================================== */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-4 min-h-[380px] max-h-[560px]"
        >
          {imageUrl ? (
            <div className="relative inline-block select-none shadow-2xl">
              {/* Ảnh gốc hiển thị */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Source diagram"
                onLoad={handleImageLoaded}
                className="max-w-full max-h-[520px] object-contain block pointer-events-none rounded-lg"
              />

              {/* VÙNG OVERLAY TƯƠNG TÁC (SVG CUTOUT + MARQUEE BOX) */}
              <div
                className="absolute inset-0 cursor-crosshair touch-none"
                onPointerDown={e => handlePointerDown('draw', e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* 1. Lớp phủ đen bán trong suốt ngoài vùng chọn (Cutout SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={`${cropBoxNorm.x * 100}%`}
                        y={`${cropBoxNorm.y * 100}%`}
                        width={`${cropBoxNorm.w * 100}%`}
                        height={`${cropBoxNorm.h * 100}%`}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.58)"
                    mask="url(#crop-mask)"
                  />
                </svg>

                {/* 2. KHUNG CHỮ NHẬT CẮT (INTERACTIVE RESIZABLE BOX) */}
                <div
                  style={{
                    left: `${cropBoxNorm.x * 100}%`,
                    top: `${cropBoxNorm.y * 100}%`,
                    width: `${cropBoxNorm.w * 100}%`,
                    height: `${cropBoxNorm.h * 100}%`,
                  }}
                  className="absolute border-2 border-amber-400 dark:border-amber-300 shadow-sm cursor-move pointer-events-auto"
                  onPointerDown={e => handlePointerDown('inside', e)}
                >
                  {/* Đường lưới 1/3 (Rule of Thirds Guide lines) */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30 border-dashed" />
                    <div className="border-r border-b border-white/30 border-dashed" />
                    <div className="border-b border-white/30 border-dashed" />
                    <div className="border-r border-b border-white/30 border-dashed" />
                    <div className="border-r border-b border-white/30 border-dashed" />
                    <div className="border-b border-white/30 border-dashed" />
                    <div className="border-r border-white/30 border-dashed" />
                    <div className="border-r border-white/30 border-dashed" />
                    <div />
                  </div>

                  {/* Kích thước trực quan nổi phía trên khung */}
                  <div className="absolute -top-7 left-0 bg-slate-900/90 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap border border-amber-500/40">
                    {nativePixelW} × {nativePixelH} px ({printCmW} × {printCmH} cm)
                  </div>

                  {/* 8 TAY CẦM CO GIÃN (RESIZE HANDLES) */}
                  {/* Góc trên-trái (NW) */}
                  <div
                    onPointerDown={e => handlePointerDown('nw', e)}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Cạnh trên (N) */}
                  <div
                    onPointerDown={e => handlePointerDown('n', e)}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-ns-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Góc trên-phải (NE) */}
                  <div
                    onPointerDown={e => handlePointerDown('ne', e)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Cạnh phải (E) */}
                  <div
                    onPointerDown={e => handlePointerDown('e', e)}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-ew-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Góc dưới-phải (SE) */}
                  <div
                    onPointerDown={e => handlePointerDown('se', e)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nwse-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Cạnh dưới (S) */}
                  <div
                    onPointerDown={e => handlePointerDown('s', e)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-ns-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Góc dưới-trái (SW) */}
                  <div
                    onPointerDown={e => handlePointerDown('sw', e)}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-xs shadow-md cursor-nesw-resize z-20 hover:scale-125 transition-transform"
                  />
                  {/* Cạnh trái (W) */}
                  <div
                    onPointerDown={e => handlePointerDown('w', e)}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-amber-500 rounded-full shadow-md cursor-ew-resize z-20 hover:scale-125 transition-transform"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <ImageIcon size={48} className="text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300 mb-1">Chưa có ảnh trong bộ nhớ cắt</p>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Thầy/Cô hãy chụp màn hình hoặc sao chép ảnh từ bất kỳ đâu, sau đó nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">Ctrl + V</kbd> để dán ảnh vào đây.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
              >
                <Upload size={15} />
                <span>Tải ảnh từ máy tính</span>
              </button>
            </div>
          )}
        </div>

        {/* =====================================================================
            4. MODAL FOOTER & ACTION BUTTONS
            ===================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          
          {/* Thông số kích thước khi in ấn trong Microsoft Word */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Ruler size={14} className="text-amber-500" />
              <span>Kích thước dán Word:</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
              {nativePixelW} × {nativePixelH} px
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 font-bold text-teal-800 dark:text-teal-300">
              ~{printCmW} × {printCmH} cm trên trang in Word
            </span>
          </div>

          {/* Các nút hành động chính */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Đóng (Esc)
            </button>

            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              title="Tải ảnh PNG đã cắt (300 DPI) về máy tính"
            >
              <Download size={15} />
              <span>Tải PNG</span>
            </button>

            <button
              onClick={handleCopyToWord}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition shadow-md cursor-pointer border ${
                copySuccess
                  ? 'bg-emerald-700 border-emerald-800 ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
              }`}
              title="Cắt khung chữ nhật và chép trực tiếp vào bộ nhớ tạm với độ phân giải cao 300 DPI để dán vào Word"
            >
              {copySuccess ? (
                <>
                  <Check size={16} className="text-emerald-200" />
                  <span>ĐÃ CHÉP VÀO WORD! (Bấm Ctrl+V)</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>CHÉP VÀO WORD (300 DPI)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
