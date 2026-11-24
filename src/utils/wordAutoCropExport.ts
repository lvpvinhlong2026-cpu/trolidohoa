/**
 * @license
 * wordAutoCropExport.ts
 * Bộ tiện ích xuất ảnh & sao chép vào Word:
 * - Tự động tính bounding box của toàn bộ hình vẽ trên Canvas/SVG (Auto-crop)
 * - Chừa lề trắng đều 24px ở cả 4 cạnh
 * - Nền trắng tuyệt đối #FFFFFF
 * - Độ phân giải cao 300 DPI (pHYs chunk)
 * - Sao chép trực tiếp vào Clipboard để giáo viên dán ngay (Ctrl + V) vào Word
 */

import { insertDpiIntoPng } from './dpiUtils';

export interface AutoCropResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Tính bounding box vùng có nét vẽ trên Canvas HTML5 và cắt chừa 24px lề trắng đều
 */
export function cropCanvasWithMargin(
  sourceCanvas: HTMLCanvasElement,
  margin = 24,
  dpi = 300
): Promise<AutoCropResult> {
  return new Promise((resolve, reject) => {
    try {
      const sWidth = sourceCanvas.width;
      const sHeight = sourceCanvas.height;
      const sCtx = sourceCanvas.getContext('2d');
      if (!sCtx) throw new Error('Không thể khởi tạo 2D context');

      const imgData = sCtx.getImageData(0, 0, sWidth, sHeight);
      const data = imgData.data;

      let minX = sWidth;
      let minY = sHeight;
      let maxX = 0;
      let maxY = 0;
      let foundPixel = false;

      // Quét tìm pixel không phải nền trắng tinh
      for (let y = 0; y < sHeight; y++) {
        for (let x = 0; x < sWidth; x++) {
          const idx = (y * sWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Coi là nét vẽ nếu alpha > 20 và không phải màu trắng tinh
          if (a > 20 && (r < 250 || g < 250 || b < 250)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            foundPixel = true;
          }
        }
      }

      // Nếu không tìm thấy pixel nét vẽ (bảng vẽ trống), lấy mặc định
      if (!foundPixel) {
        minX = Math.round(sWidth * 0.1);
        maxX = Math.round(sWidth * 0.9);
        minY = Math.round(sHeight * 0.1);
        maxY = Math.round(sHeight * 0.9);
      }

      const contentWidth = Math.max(10, maxX - minX);
      const contentHeight = Math.max(10, maxY - minY);

      // Thêm viền trắng đều 24px cả 4 cạnh theo chuẩn yêu cầu
      const targetWidth = contentWidth + margin * 2;
      const targetHeight = contentHeight + margin * 2;

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = targetWidth;
      targetCanvas.height = targetHeight;
      const tCtx = targetCanvas.getContext('2d');
      if (!tCtx) throw new Error('Không thể khởi tạo target context');

      // Nền trắng tinh tuyệt đối #FFFFFF
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0, 0, targetWidth, targetHeight);

      // Vẽ vùng nội dung vào trung tâm
      tCtx.drawImage(
        sourceCanvas,
        minX,
        minY,
        contentWidth,
        contentHeight,
        margin,
        margin,
        contentWidth,
        contentHeight
      );

      targetCanvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Lỗi chuyển đổi ảnh blob'));
          return;
        }

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const dpiEnhanced = insertDpiIntoPng(uint8, dpi);
          const finalBlob = new Blob([dpiEnhanced], { type: 'image/png' });
          const dataUrl = URL.createObjectURL(finalBlob);

          resolve({
            blob: finalBlob,
            dataUrl,
            width: targetWidth,
            height: targetHeight,
          });
        } catch (err) {
          reject(err);
        }
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Chuyển SVG Element thành Canvas với độ phân giải cao và viền trắng 24px
 */
export async function cropSvgWithMargin(
  svgElement: SVGSVGElement,
  margin = 24,
  scale = 3, // High-DPI scale (300 DPI tương đương scale 3.125)
  dpi = 300
): Promise<AutoCropResult> {
  const svgRect = svgElement.getBoundingClientRect();
  const width = Math.max(100, Math.round(svgRect.width));
  const height = Math.max(100, Math.round(svgRect.height));

  const cloneSvg = svgElement.cloneNode(true) as SVGSVGElement;
  cloneSvg.setAttribute('width', (width * scale).toString());
  cloneSvg.setAttribute('height', (height * scale).toString());

  const svgString = new XMLSerializer().serializeToString(cloneSvg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Lỗi khởi tạo canvas'));
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      try {
        const result = await cropCanvasWithMargin(canvas, margin * scale, dpi);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Lỗi load SVG image: ' + e));
    };
    img.src = url;
  });
}

/**
 * Sao chép ảnh 300 DPI trực tiếp vào Clipboard
 */
export async function copyAutoCroppedImageToClipboard(
  source: HTMLCanvasElement | SVGSVGElement
): Promise<AutoCropResult> {
  let result: AutoCropResult;
  if (source instanceof HTMLCanvasElement) {
    result = await cropCanvasWithMargin(source, 24, 300);
  } else {
    result = await cropSvgWithMargin(source, 24, 3, 300);
  }

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': result.blob,
        }),
      ]);
    } catch {
      // Fallback
    }
  }

  return result;
}
