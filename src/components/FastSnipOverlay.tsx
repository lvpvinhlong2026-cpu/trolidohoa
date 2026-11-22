import React, { useState, useEffect, useRef } from 'react';
import { Crop, Check, X, Copy, Maximize2 } from 'lucide-react';
import { copyCroppedRegionToClipboard } from '../utils/dpiUtils';

export interface FastSnipOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  onNotify?: (message: string) => void;
}

export default function FastSnipOverlay({
  isOpen,
  onClose,
  imageUrl,
  title = 'Hình vẽ Toán học',
  onNotify,
}: FastSnipOverlayProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Dùng ref để theo dõi toạ độ chuột thời gian thực (tránh độ trễ state của React)
  const isDraggingRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset khi mở/đóng
  useEffect(() => {
    if (!isOpen) {
      isDraggingRef.current = false;
      setSelection(null);
      setIsCopied(false);
    }
  }, [isOpen]);

  // Đóng bằng phím Esc
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

  // Khi ảnh tải xong, lấy kích thước gốc
  const handleImageLoaded = () => {
    if (!imageRef.current) return;
    setNaturalSize({
      width: imageRef.current.naturalWidth || imageRef.current.width,
      height: imageRef.current.naturalHeight || imageRef.current.height,
    });
  };

  // CẮT VÙNG CHỮ NHẬT VÀ LƯU VÀO CLIPBOARD (300 DPI)
  const executeCrop = async (screenRect: { x: number; y: number; w: number; h: number }) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();

    if (imgRect.width <= 0 || imgRect.height <= 0) return;

    // Giới hạn vùng chọn trong phạm vi ảnh hiển thị
    const clampLeft = Math.max(imgRect.left, screenRect.x);
    const clampTop = Math.max(imgRect.top, screenRect.y);
    const clampRight = Math.min(imgRect.right, screenRect.x + screenRect.w);
    const clampBottom = Math.min(imgRect.bottom, screenRect.y + screenRect.h);

    const validW = clampRight - clampLeft;
    const validH = clampBottom - clampTop;

    if (validW < 10 || validH < 10) {
      setSelection(null);
      return;
    }

    const nw = naturalSize.width || img.naturalWidth || imgRect.width;
    const nh = naturalSize.height || img.naturalHeight || imgRect.height;

    const scaleX = nw / imgRect.width;
    const scaleY = nh / imgRect.height;

    const nativeX = Math.max(0, Math.round((clampLeft - imgRect.left) * scaleX));
    const nativeY = Math.max(0, Math.round((clampTop - imgRect.top) * scaleY));
    const nativeW = Math.min(nw - nativeX, Math.round(validW * scaleX));
    const nativeH = Math.min(nh - nativeY, Math.round(validH * scaleY));

    if (nativeW <= 5 || nativeH <= 5) return;

    try {
      setIsCopied(true);
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

      // Đóng chế độ cắt sau khi báo thành công
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error('Lỗi khi chép vào clipboard:', err);
      if (onNotify) onNotify('Không thể chép vào clipboard. Vui lòng thử lại.');
      setIsCopied(false);
    }
  };

  // CHÉP TOÀN BỘ ẢNH (NẾU KHÔNG MUỐN KÉO CHỌN)
  const handleCopyFull = async () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const nw = naturalSize.width || img.naturalWidth;
    const nh = naturalSize.height || img.naturalHeight;

    try {
      setIsCopied(true);
      await copyCroppedRegionToClipboard(
        img,
        { x: 0, y: 0, width: nw, height: nh },
        { fillWhiteBg: true, borderStyle: 'none', dpi: 300 }
      );
      if (onNotify) {
        onNotify('✅ ĐÃ CHÉP TOÀN BỘ ẢNH (300 DPI)! Mở Word và bấm Ctrl + V để dán.');
      }
      setTimeout(() => onClose(), 250);
    } catch {
      setIsCopied(false);
    }
  };

  // =========================================================================
  // XỬ LÝ CHUỘT TOÀN CỤC (WINDOW LISTENERS CHO MƯỢT 100%)
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      currentPosRef.current = { x: e.clientX, y: e.clientY };

      const x = Math.min(startPosRef.current.x, e.clientX);
      const y = Math.min(startPosRef.current.y, e.clientY);
      const w = Math.abs(e.clientX - startPosRef.current.x);
      const h = Math.abs(e.clientY - startPosRef.current.y);

      setSelection({ x, y, w, h });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const x = Math.min(startPosRef.current.x, e.clientX);
      const y = Math.min(startPosRef.current.y, e.clientY);
      const w = Math.abs(e.clientX - startPosRef.current.x);
      const h = Math.abs(e.clientY - startPosRef.current.y);

      // Nếu kéo đủ lớn (>= 15px mỗi chiều) -> Tự động cắt ngay lập tức!
      if (w >= 15 && h >= 15) {
        executeCrop({ x, y, w, h });
      } else {
        // Chỉ nhấp chuột nhầm mà không kéo -> hủy vùng chọn
        setSelection(null);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isOpen, naturalSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Chỉ nhận chuột trái
    if (e.button !== 0) return;
    e.preventDefault();

    isDraggingRef.current = true;
    setIsCopied(false);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    setSelection({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onContextMenu={e => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 select-none animate-fade-in cursor-crosshair touch-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* 1. THANH HƯỚNG DẪN NỔI PHÍA TRÊN CÙNG */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md pointer-events-auto"
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Crop size={16} />
        </div>
        <div className="text-xs">
          <span className="text-amber-400 font-extrabold mr-1.5">CHẾ ĐỘ CẮT:</span>
          <span className="font-semibold text-slate-100">Nhấp giữ chuột trái và kéo quanh hình cần cắt</span>
          <span className="text-slate-500 mx-2">•</span>
          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            Thả chuột là tự lưu Word
          </span>
        </div>

        <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-700">
          <button
            onClick={handleCopyFull}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
            title="Chép toàn bộ ảnh này vào Word không cần kéo"
          >
            <Copy size={13} />
            <span>Chép cả hình</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="Hủy thao tác cắt (Phím Esc hoặc Chuột phải)"
          >
            <X size={14} />
            <span>Hủy (Esc)</span>
          </button>
        </div>
      </div>

      {/* 2. KHUNG HÌNH VẼ HIỂN THỊ */}
      <div
        className="relative inline-block max-w-[92vw] max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden bg-white pointer-events-none"
        onDragStart={e => e.preventDefault()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={title}
          draggable={false}
          onLoad={handleImageLoaded}
          className="max-w-[92vw] max-h-[85vh] object-contain block select-none pointer-events-none"
        />

        {/* Lớp phủ làm tối hình vẽ để vùng chọn nổi bật */}
        <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
      </div>

      {/* 3. KHUNG CHỮ NHẬT ĐANG ĐƯỢC KÉO CHỌN (SÁNG RÕ 100%) */}
      {selection && selection.w > 3 && selection.h > 3 && (
        <div
          style={{
            position: 'fixed',
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h,
          }}
          className={`pointer-events-none z-50 transition-colors ${
            isCopied
              ? 'border-3 border-emerald-400 bg-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.8)]'
              : 'border-2 border-dashed border-amber-400 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
          }`}
        >
          {/* Đường lưới 1/3 bên trong */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-white/30 border-dashed" />
            <div className="border-r border-b border-white/30 border-dashed" />
            <div className="border-b border-white/30 border-dashed" />
            <div className="border-r border-b border-white/30 border-dashed" />
            <div className="border-r border-b border-white/30 border-dashed" />
            <div className="border-b border-white/30 border-dashed" />
            <div className="border-r border-b border-white/30 border-dashed" />
            <div className="border-r border-b border-white/30 border-dashed" />
            <div />
          </div>

          {/* 4 dấu góc nổi bật */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs shadow-md" />

          {/* Huy hiệu thông số kích thước nổi */}
          <div className="absolute -top-8 left-0 px-2.5 py-1 rounded-lg bg-slate-900/95 text-amber-300 font-mono text-xs font-bold shadow-xl whitespace-nowrap border border-amber-500/50 flex items-center gap-1.5">
            {isCopied ? (
              <span className="text-emerald-400 flex items-center gap-1 font-extrabold">
                <Check size={14} /> ĐÃ CHÉP VÀO WORD!
              </span>
            ) : (
              <span>
                {Math.round(selection.w)} × {Math.round(selection.h)} px
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
