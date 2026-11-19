import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, Check, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ExtractedPdfImage } from '../utils/pdfImageExtractor';

interface VisualCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageCanvases: HTMLCanvasElement[];
  initialTargetId?: string;
  initialPage?: number;
  existingImages?: ExtractedPdfImage[];
  onSaveCrop: (dataUrl: string, targetId: string, label: string, pageNumber: number) => void;
}

export default function VisualCropModal({
  isOpen,
  onClose,
  pageCanvases,
  initialTargetId = 'image_1',
  initialPage = 1,
  existingImages = [],
  onSaveCrop,
}: VisualCropModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [targetId, setTargetId] = useState<string>(initialTargetId);
  const [label, setLabel] = useState<string>('Hình 1');
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync initial parameters when modal opens
  useEffect(() => {
    if (isOpen) {
      const validPage = Math.min(Math.max(1, initialPage), Math.max(1, pageCanvases.length));
      setCurrentPage(validPage);
      setTargetId(initialTargetId || 'image_1');

      // Auto deduce label from targetId, e.g. image_5 -> Hình 5
      const matchNum = initialTargetId.match(/\d+/);
      const numStr = matchNum ? matchNum[0] : '1';
      setLabel(`Hình ${numStr}`);

      setCropRect(null);
      setPreviewDataUrl('');
      setZoom(1);
    }
  }, [isOpen, initialTargetId, initialPage, pageCanvases.length]);

  // Update label automatically when targetId changes if it contains numbers
  const handleTargetIdChange = (newId: string) => {
    setTargetId(newId);
    const m = newId.match(/\d+/);
    if (m) {
      setLabel(`Hình ${m[0]}`);
    }
  };

  // Draw the current page canvas onto displayCanvas
  const currentSourceCanvas = pageCanvases[currentPage - 1];

  useEffect(() => {
    if (!isOpen || !currentSourceCanvas) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;

    canvas.width = currentSourceCanvas.width;
    canvas.height = currentSourceCanvas.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(currentSourceCanvas, 0, 0);
    }
  }, [isOpen, currentPage, currentSourceCanvas]);

  // Helper to convert mouse event client coordinates to canvas pixel coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY));

      return { x, y };
    },
    []
  );

  const generatePreview = useCallback(
    (rect: { x: number; y: number; w: number; h: number }) => {
      if (!currentSourceCanvas || rect.w < 10 || rect.h < 10) {
        setPreviewDataUrl('');
        return;
      }

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = rect.w;
      cropCanvas.height = rect.h;
      const ctx = cropCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(currentSourceCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
        setPreviewDataUrl(cropCanvas.toDataURL('image/png'));
      }
    },
    [currentSourceCanvas]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setStartPos(coords);
    setIsDragging(true);
    setCropRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !startPos) return;
    const coords = getCanvasCoords(e);

    const x = Math.min(startPos.x, coords.x);
    const y = Math.min(startPos.y, coords.y);
    const w = Math.abs(coords.x - startPos.x);
    const h = Math.abs(coords.y - startPos.y);

    setCropRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (isDragging && cropRect && cropRect.w > 10 && cropRect.h > 10) {
      generatePreview(cropRect);
    }
    setIsDragging(false);
    setStartPos(null);
  };

  const handleSave = () => {
    if (!previewDataUrl) return;
    const cleanTargetId = targetId.trim() || 'image_1';
    const cleanLabel = label.trim() || 'Hình vẽ';
    onSaveCrop(previewDataUrl, cleanTargetId, cleanLabel, currentPage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                Công cụ cắt ảnh từ tài liệu (Visual Snip Tool)
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 rounded-full">
                  Kéo chuột để chọn vùng đồ thị
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cắt chính xác đồ thị, hình học hoặc bảng biến thiên từ trang PDF/Ảnh để nhúng thẳng vào câu hỏi tương ứng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Page Selector & Zoom */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Page Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0">
              Trang:
            </span>
            {pageCanvases.map((_, idx) => {
              const pNum = idx + 1;
              const isActive = currentPage === pNum;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pNum);
                    setCropRect(null);
                    setPreviewDataUrl('');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Trang {pNum}
                </button>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="text-xs px-2 py-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Main Canvas Work Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-200/70 dark:bg-slate-950 p-4 flex items-center justify-center relative select-none"
        >
          {pageCanvases.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
              <ImageIcon size={48} className="mx-auto mb-3 opacity-40" />
              <p>Chưa có trang tài liệu nào được hiển thị. Vui lòng tải file PDF hoặc Ảnh trước.</p>
            </div>
          ) : (
            <div
              className="relative shadow-2xl bg-white border border-slate-300 dark:border-slate-700 rounded-sm overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                cursor: 'crosshair',
              }}
            >
              <canvas
                ref={displayCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="block max-w-none"
              />

              {/* Crop selection overlay box */}
              {cropRect && cropRect.w > 0 && cropRect.h > 0 && (
                <div
                  className="absolute pointer-events-none border-2 border-teal-500 bg-teal-400/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-none"
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.w}px`,
                    height: `${cropRect.h}px`,
                  }}
                >
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-teal-700 text-white text-[10px] font-bold rounded shadow-sm">
                    {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Live Preview & Confirm */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Preview thumbnail */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-18 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Ảnh đã cắt"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400 text-center px-1">
                  Kéo chuột chọn vùng cắt
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {previewDataUrl ? 'Đã chọn ảnh thành công' : 'Chưa chọn vùng cắt'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {previewDataUrl
                  ? 'Hãy gán mã ảnh (ID) để chèn đúng vị trí vào đề thi'
                  : 'Nhấp giữ chuột trái và kéo một hình chữ nhật bao quanh đồ thị'}
              </p>
            </div>
          </div>

          {/* Right: Target ID selector & Save button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mã ảnh:</span>
              <input
                type="text"
                value={targetId}
                onChange={(e) => handleTargetIdChange(e.target.value)}
                placeholder="Ví dụ: image_1, image_5"
                className="w-24 text-xs font-bold font-mono px-2 py-1 bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 rounded border border-slate-200 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nhãn:</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Hình 1"
                className="w-20 text-xs px-2 py-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={!previewDataUrl}
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition cursor-pointer ${
                previewDataUrl
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Check size={15} />
              Lưu & Nhúng vào đề
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
