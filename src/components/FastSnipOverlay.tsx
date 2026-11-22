import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crop, Check, X, Sparkles } from 'lucide-react';
import { copyCroppedRegionToClipboard } from '../utils/dpiUtils';

export interface FastSnipOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  onNotify?: (message: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function FastSnipOverlay({
  isOpen,
  onClose,
  imageUrl,
  title = 'Hình vẽ Toán học',
  onNotify,
}: FastSnipOverlayProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [justCopied, setJustCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Khởi tạo khi ảnh được nạp
  const handleImageLoaded = () => {
    if (!imageRef.current) return;
    setNaturalSize({
      width: imageRef.current.naturalWidth,
      height: imageRef.current.naturalHeight,
    });
  };

  // Đóng bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset trạng thái khi đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      setJustCopied(false);
    }
  }, [isOpen]);

  // Bắt đầu nhấp chuột trái để kéo khung chữ nhật
  const handlePointerDown = (e: React.PointerEvent) => {
    // Chỉ nhận chuột trái
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDrawing(true);
    setJustCopied(false);
    const pt = { x: e.clientX, y: e.clientY };
    setStartPoint(pt);
    setCurrentPoint(pt);

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // Di chuyển chuột khi đang kéo
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();
    setCurrentPoint({ x: e.clientX, y: e.clientY });
  };

  // THẢ CHUỘT TRÁI (POINTER UP) -> TỰ ĐỘNG CẮT VÀ SAO CHÉP VÀO WORD NGAY LẬP TỨC
  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!isDrawing || !startPoint || !currentPoint || !imageRef.current) {
      setIsDrawing(false);
      return;
    }

    isDrawingRefRelease(e);
  };

  const isDrawingRefRelease = async (e: React.PointerEvent) => {
    setIsDrawing(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (!startPoint || !currentPoint || !imageRef.current) return;

    // Tính toán hộp chữ nhật trên màn hình
    const screenLeft = Math.min(startPoint.x, currentPoint.x);
    const screenTop = Math.min(startPoint.y, currentPoint.y);
    const screenW = Math.abs(currentPoint.x - startPoint.x);
    const screenH = Math.abs(currentPoint.y - startPoint.y);

    // Nếu vùng kéo quá nhỏ (< 15px), bỏ qua để tránh click nhầm
    if (screenW < 15 || screenH < 15) {
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();
    if (imgRect.width <= 0 || imgRect.height <= 0) return;

    // Giới hạn trong phạm vi hiển thị của ảnh
    const clampLeft = Math.max(imgRect.left, screenLeft);
    const clampTop = Math.max(imgRect.top, screenTop);
    const clampRight = Math.min(imgRect.right, screenLeft + screenW);
    const clampBottom = Math.min(imgRect.bottom, screenTop + screenH);

    const validW = clampRight - clampLeft;
    const validH = clampBottom - clampTop;

    if (validW < 10 || validH < 10) {
      setStartPoint(null);
      setCurrentPoint(null);
      return;
    }

    // Quy đổi tỉ lệ sang kích thước pixel gốc của ảnh (High Resolution)
    const scaleX = naturalSize.width / imgRect.width;
    const scaleY = naturalSize.height / imgRect.height;

    const nativeX = Math.max(0, Math.round((clampLeft - imgRect.left) * scaleX));
    const nativeY = Math.max(0, Math.round((clampTop - imgRect.top) * scaleY));
    const nativeW = Math.min(naturalSize.width - nativeX, Math.round(validW * scaleX));
    const nativeH = Math.min(naturalSize.height - nativeY, Math.round(validH * scaleY));

    if (nativeW <= 5 || nativeH <= 5) return;

    // Cắt và lưu tự động vào Clipboard với chuẩn 300 DPI
    try {
      setJustCopied(true);
      await copyCroppedRegionToClipboard(
        img,
        { x: nativeX, y: nativeY, width: nativeW, height: nativeH },
        { fillWhiteBg: true, borderStyle: 'none', dpi: 300 }
      );

      const printW = (nativeW / 300 * 2.54).toFixed(1);
      const printH = (nativeH / 300 * 2.54).toFixed(1);

      if (onNotify) {
        onNotify(`✅ ĐÃ TỰ ĐỘNG CHÉP VÀO WORD! (${nativeW}×${nativeH}px, ~${printW}×${printH}cm). Mở Word và bấm Ctrl + V để dán ngay.`);
      }

      // Đóng chế độ cắt sau hiệu ứng nhấp nháy thành công
      setTimeout(() => {
        onClose();
      }, 240);
    } catch (err) {
      console.error('Lỗi khi tự động chép vùng cắt:', err);
      if (onNotify) onNotify('Không thể tự động ghi Clipboard. Vui lòng thử lại.');
    }
  };

  if (!isOpen || !imageUrl) return null;

  // Tính toạ độ hiển thị vùng chọn
  let currentRect: Rect | null = null;
  if (startPoint && currentPoint) {
    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const w = Math.abs(currentPoint.x - startPoint.x);
    const h = Math.abs(currentPoint.y - startPoint.y);
    currentRect = { x, y, w, h };
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={e => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 select-none animate-fade-in backdrop-blur-xs cursor-crosshair touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 1. THANH HƯỚNG DẪN NỔI PHÍA TRÊN CÙNG (WORD-STYLE SNIP BAR) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md pointer-events-auto">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <Crop size={14} />
        </div>
        <div className="text-xs font-semibold">
          <span className="text-amber-300 font-extrabold mr-1.5">CHẾ ĐỘ CẮT NHANH:</span>
          <span>Giữ chuột trái kéo khung cần cắt</span>
          <span className="text-slate-400 mx-1.5">•</span>
          <span className="text-emerald-300 font-bold">Thả chuột là tự động chép vào Word</span>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          title="Hủy cắt ảnh (Phím Esc hoặc Chuột phải)"
        >
          <X size={12} />
          <span>Hủy (Esc)</span>
        </button>
      </div>

      {/* 2. KHUNG HÌNH VẼ ĐANG HIỂN THỊ */}
      <div className="relative inline-block max-w-[94vw] max-h-[88vh] shadow-2xl pointer-events-none rounded-xl overflow-hidden bg-white">
        <img
          ref={imageRef}
          src={imageUrl}
          alt={title}
          onLoad={handleImageLoaded}
          className="max-w-[94vw] max-h-[88vh] object-contain block"
        />

        {/* Lớp phủ làm tối toàn bộ vùng ảnh */}
        <div className="absolute inset-0 bg-slate-950/35" />
      </div>

      {/* 3. VÙNG KHUNG CHỮ NHẬT ĐANG ĐƯỢC KÉO CHỌN TRỰC TIẾP */}
      {currentRect && currentRect.w > 3 && currentRect.h > 3 && (
        <div
          style={{
            position: 'fixed',
            left: currentRect.x,
            top: currentRect.y,
            width: currentRect.w,
            height: currentRect.h,
          }}
          className={`pointer-events-none z-40 transition-all ${
            justCopied
              ? 'border-3 border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
              : 'border-2 border-dashed border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
          }`}
        >
          {/* Đường lưới 1/3 mờ bên trong */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-white/20 border-dashed" />
            <div className="border-r border-b border-white/20 border-dashed" />
            <div className="border-b border-white/20 border-dashed" />
            <div className="border-r border-b border-white/20 border-dashed" />
            <div className="border-r border-b border-white/20 border-dashed" />
            <div className="border-b border-white/20 border-dashed" />
            <div className="border-r border-b border-white/20 border-dashed" />
            <div className="border-r border-b border-white/20 border-dashed" />
            <div />
          </div>

          {/* Kích thước hiển thị theo chuột */}
          <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-slate-900/95 text-amber-300 font-mono text-[11px] font-bold shadow-md whitespace-nowrap border border-amber-500/40 flex items-center gap-1.5">
            {justCopied ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check size={12} /> Đang chép Word...
              </span>
            ) : (
              <span>
                {Math.round(currentRect.w)} × {Math.round(currentRect.h)} px
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
