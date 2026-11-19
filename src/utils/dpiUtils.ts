// =========================================================================
// BỘ TIỆN ÍCH TỐI ƯU HÓA ĐỘ PHÂN GIẢI 300 DPI CHUẨN IN ẤN VÀ WORD
// =========================================================================

let pngCrcTable: Uint32Array | null = null;
function getPngCrcTable(): Uint32Array {
  if (pngCrcTable) return pngCrcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  pngCrcTable = table;
  return table;
}

function calcCrc32(buf: Uint8Array): number {
  const table = getPngCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPhysChunk(dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk[4] = 0x70; chunk[5] = 0x48; chunk[6] = 0x59; chunk[7] = 0x73; // 'pHYs'
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  chunk[16] = 1; // đơn vị mét
  const crc = calcCrc32(chunk.subarray(4, 17));
  view.setUint32(17, crc);
  return chunk;
}

export function insertDpiIntoPng(pngBytes: Uint8Array, dpi = 300): Uint8Array {
  if (pngBytes.length < 33 || pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50) {
    return pngBytes;
  }
  const physChunk = createPhysChunk(dpi);
  let offset = 8;
  const view = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);

  while (offset < pngBytes.length) {
    const len = view.getUint32(offset);
    const type = String.fromCharCode(pngBytes[offset + 4], pngBytes[offset + 5], pngBytes[offset + 6], pngBytes[offset + 7]);
    if (type === 'pHYs') {
      const result = new Uint8Array(pngBytes.length);
      result.set(pngBytes.subarray(0, offset));
      result.set(physChunk, offset);
      result.set(pngBytes.subarray(offset + 12 + len), offset + physChunk.length);
      return result;
    }
    if (type === 'IHDR') {
      const afterIhdr = offset + 12 + len;
      const result = new Uint8Array(pngBytes.length + physChunk.length);
      result.set(pngBytes.subarray(0, afterIhdr), 0);
      result.set(physChunk, afterIhdr);
      result.set(pngBytes.subarray(afterIhdr), afterIhdr + physChunk.length);
      return result;
    }
    offset += 12 + len;
  }
  return pngBytes;
}

export async function addDpiToBlob(blob: Blob, dpi = 300): Promise<Blob> {
  try {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const withDpi = insertDpiIntoPng(bytes, dpi);
    return new Blob([withDpi], { type: 'image/png' });
  } catch (e) {
    console.error('Lỗi nhúng DPI vào Blob:', e);
    return blob;
  }
}

export async function copyCanvasToClipboard300Dpi(canvas: HTMLCanvasElement, dpi = 300): Promise<boolean> {
  try {
    const cropped = cropCanvasToContent(canvas, 32);
    const blob = await new Promise<Blob | null>(resolve => cropped.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    const blobWithDpi = await addDpiToBlob(blob, dpi);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blobWithDpi })
    ]);
    return true;
  } catch (err) {
    console.error('Lỗi copy ảnh vào Clipboard:', err);
    return false;
  }
}

/**
 * Tự động cắt bỏ viền trắng thừa xung quanh nội dung vẽ của canvas (Auto-crop to content).
 * Giúp hình vẽ (hình học không gian, đồ thị, biểu đồ, trục số) luôn to lớn, sát viền
 * tương tự như Bảng biến thiên khi dán vào Microsoft Word.
 */
export function cropCanvasToContent(sourceCanvas: HTMLCanvasElement, padding = 32): HTMLCanvasElement {
  try {
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    // Quét với bước nhảy 3px để siêu nhanh (< 2ms)
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Nếu pixel không phải là màu trắng hoặc trong suốt
        if (a > 10 && (r < 248 || g < 248 || b < 248)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found || maxX <= minX || maxY <= minY) {
      return sourceCanvas;
    }

    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(w - cropX, maxX - minX + 2 * padding);
    const cropH = Math.min(h - cropY, maxY - minY + 2 * padding);

    if (cropW <= 20 || cropH <= 20) {
      return sourceCanvas;
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cCtx = croppedCanvas.getContext('2d');
    if (!cCtx) return sourceCanvas;

    cCtx.fillStyle = '#FFFFFF';
    cCtx.fillRect(0, 0, cropW, cropH);
    cCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return croppedCanvas;
  } catch (e) {
    console.warn('cropCanvasToContent failed, returning original canvas:', e);
    return sourceCanvas;
  }
}
