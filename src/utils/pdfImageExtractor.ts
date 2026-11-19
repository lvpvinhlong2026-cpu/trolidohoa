import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for client-side rendering
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedPdfImage {
  id: string; // e.g. "image_1"
  label: string; // e.g. "Hình 1"
  pageNumber: number;
  dataUrl: string; // "data:image/jpeg;base64,..." or "data:image/png;base64,..."
  width: number;
  height: number;
  format: 'jpeg' | 'png';
  sizeBytes: number;
}

/**
 * Convert Uint8Array to Base64 in chunks to prevent stack overflow on large files
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Convert Base64 or DataURL to Uint8Array
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extract all embedded raster images from a PDF file using pdf-lib
 */
export async function extractEmbeddedImagesFromPdf(pdfBytes: ArrayBuffer): Promise<ExtractedPdfImage[]> {
  const images: ExtractedPdfImage[] = [];

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const objects = pdfDoc.context.enumerateIndirectObjects();
    let imgCount = 0;

    for (const [, obj] of objects) {
      if (!(obj instanceof PDFRawStream)) continue;

      const dict = obj.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      const widthObj = dict.get(PDFName.of('Width'));
      const heightObj = dict.get(PDFName.of('Height'));
      const width = typeof (widthObj as any)?.asNumber === 'function' ? (widthObj as any).asNumber() : Number(widthObj?.toString()) || 200;
      const height = typeof (heightObj as any)?.asNumber === 'function' ? (heightObj as any).asNumber() : Number(heightObj?.toString()) || 200;

      // Filter out 1x1 or tiny 10px tracking pixels/spacers
      if (width < 20 || height < 20) continue;

      // Filter out full-page scans (e.g. 1700x2400 A4 scanned pages) because they represent entire document pages, not question diagrams
      const isFullPageScan = (width >= 1000 && height >= 1300) || (width >= 1300 && height >= 1000);
      if (isFullPageScan) continue;

      const filter = dict.get(PDFName.of('Filter'));
      const filterStr = filter ? filter.toString() : '';

      // Case 1: DCTDecode (Native JPEG)
      if (filterStr.includes('DCTDecode')) {
        imgCount++;
        const rawBytes = obj.contents;
        const b64 = uint8ArrayToBase64(rawBytes);
        const dataUrl = `data:image/jpeg;base64,${b64}`;

        images.push({
          id: `image_${imgCount}`,
          label: `Hình ${imgCount} (${width}x${height})`,
          pageNumber: 1,
          dataUrl,
          width,
          height,
          format: 'jpeg',
          sizeBytes: rawBytes.byteLength,
        });
      }
      // Case 2: FlateDecode (PNG / raw pixels)
      else if (filterStr.includes('FlateDecode') && typeof document !== 'undefined') {
        try {
          const decoded = decodePDFRawStream(obj);
          const rawBytes = ((decoded as any)?.contents || (decoded as any)?.data || decoded) as Uint8Array;
          const colorSpace = dict.get(PDFName.of('ColorSpace'))?.toString() || '';
          const bpcObj = dict.get(PDFName.of('BitsPerComponent'));
          const bpc = typeof (bpcObj as any)?.asNumber === 'function' ? (bpcObj as any).asNumber() : 8;

          // Only convert 8-bit RGB or Grayscale to Canvas
          if (bpc === 8 && width > 0 && height > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              const imgData = ctx.createImageData(width, height);
              const data = imgData.data;

              const isGray = colorSpace.includes('DeviceGray');
              const bytesPerPixel = isGray ? 1 : 3;

              let srcIdx = 0;
              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  const targetIdx = (y * width + x) * 4;
                  if (srcIdx < rawBytes.length) {
                    if (isGray) {
                      const g = rawBytes[srcIdx++];
                      data[targetIdx] = g;
                      data[targetIdx + 1] = g;
                      data[targetIdx + 2] = g;
                      data[targetIdx + 3] = 255;
                    } else {
                      data[targetIdx] = rawBytes[srcIdx++];
                      data[targetIdx + 1] = rawBytes[srcIdx++];
                      data[targetIdx + 2] = rawBytes[srcIdx++];
                      data[targetIdx + 3] = 255;
                    }
                  }
                }
              }

              ctx.putImageData(imgData, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              imgCount++;

              images.push({
                id: `image_${imgCount}`,
                label: `Hình ${imgCount} (${width}x${height})`,
                pageNumber: 1,
                dataUrl,
                width,
                height,
                format: 'png',
                sizeBytes: rawBytes.byteLength,
              });
            }
          }
        } catch (flateErr) {
          console.warn('FlateDecode image parsing skipped:', flateErr);
        }
      }
    }
  } catch (err) {
    console.error('Error extracting images from PDF:', err);
  }

  return images;
}

/**
 * Render a PDF page onto an HTML Canvas at high resolution (e.g. scale = 2 for 300 DPI equivalent)
 */
export async function renderPdfPageToCanvas(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  scale: number = 2.0
): Promise<HTMLCanvasElement> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Cannot get 2D context from canvas');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  return canvas;
}

/**
 * Crop a specific bounding box from a rendered page canvas
 */
export function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = width;
  cropCanvas.height = height;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
  return cropCanvas.toDataURL('image/png');
}

/**
 * Render multiple pages of a PDF to Canvas array at high resolution (scale = 2.0 ~ 300 DPI)
 */
export async function renderPdfPagesToCanvases(
  pdfBytes: ArrayBuffer,
  scale: number = 2.0,
  maxPages: number = 25
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = [];
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const numPages = Math.min(pdf.numPages, maxPages);

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;
        canvases.push(canvas);
      }
    }
  } catch (err) {
    console.warn('Error rendering PDF pages to canvases:', err);
  }
  return canvases;
}

/**
 * Render an uploaded image file (PNG/JPG) to an HTML Canvas
 */
export async function renderImageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      } else {
        URL.revokeObjectURL(url);
        reject(new Error('Cannot get 2d context for image canvas'));
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Crop normalized (0-1000) bounding box from a canvas with slight margin
 */
export function cropImageFromCanvas(
  canvas: HTMLCanvasElement,
  ymin: number,
  xmin: number,
  ymax: number,
  xmax: number,
  padding: number = 8
): string {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return '';

  const actualYmin = Math.min(ymin, ymax);
  const actualYmax = Math.max(ymin, ymax);
  const actualXmin = Math.min(xmin, xmax);
  const actualXmax = Math.max(xmin, xmax);

  const rawX = (actualXmin / 1000) * canvas.width;
  const rawY = (actualYmin / 1000) * canvas.height;
  const rawW = ((actualXmax - actualXmin) / 1000) * canvas.width;
  const rawH = ((actualYmax - actualYmin) / 1000) * canvas.height;

  // Add slight padding around the bounding box
  const x = Math.max(0, Math.floor(rawX - padding));
  const y = Math.max(0, Math.floor(rawY - padding));
  const w = Math.min(canvas.width - x, Math.ceil(rawW + padding * 2));
  const h = Math.min(canvas.height - y, Math.ceil(rawH + padding * 2));

  if (w < 10 || h < 10) return '';

  return cropCanvasRegion(canvas, x, y, w, h);
}

/**
 * Automatically process text from AI:
 * - Detects crop coordinates for diagrams/graphs (crop:page,ymin,xmin,ymax,xmax)
 * - Crops high-resolution images from page canvases
 * - Replaces crop tags with clean ![Hình X](image_X) right below the questions
 * - Maps image data into imageMap so they display in preview and embed in Word
 */
export function processExtractedImagesFromText(
  markdownText: string,
  pageCanvases: HTMLCanvasElement[] = [],
  embeddedImages: ExtractedPdfImage[] = []
): {
  processedText: string;
  imageMap: Record<string, string>;
  extractedImages: ExtractedPdfImage[];
} {
  const imageMap: Record<string, string> = {};
  const extractedImages: ExtractedPdfImage[] = [...embeddedImages];

  // Seed imageMap with embedded images first
  embeddedImages.forEach((img, idx) => {
    const num = (idx + 1).toString();
    imageMap[`image_${num}`] = img.dataUrl;
    imageMap[num] = img.dataUrl;
    imageMap[`hinh_${num}`] = img.dataUrl;
    imageMap[`hình_${num}`] = img.dataUrl;
    imageMap[`hinh ${num}`] = img.dataUrl;
    imageMap[`hình ${num}`] = img.dataUrl;
  });

  let count = extractedImages.length;

  // Regex to match crop tags from AI in all flexible variants:
  // 1. ![Hình 1](crop:1,150,220,430,780)
  // 2. ![Hình 1](crop: page 1, [150, 220, 430, 780])
  // 3. ![Hình 1](crop:[150, 220, 430, 780])
  // 4. crop:1,150,220,430,780
  const cropRegex = /!\[(.*?)\]\(\s*crop:\s*(?:(?:page\s*)?(\d+)\s*,)?\s*\[?(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\]?\s*\)|crop:\s*(?:(?:page\s*)?(\d+)\s*,)?\s*\[?(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\]?/gi;

  const processedText = markdownText.replace(
    cropRegex,
    (match, alt, p1, y1, x1, y2, x2, p2, y3, x3, y4, x4) => {
      const pageStr = p1 || p2 || '1';
      const yminStr = y1 || y3;
      const xminStr = x1 || x3;
      const ymaxStr = y2 || y4;
      const xmaxStr = x2 || x4;

      const pageNum = parseInt(pageStr, 10) || 1;
      const ymin = Math.min(parseInt(yminStr, 10) || 0, 1000);
      const xmin = Math.min(parseInt(xminStr, 10) || 0, 1000);
      const ymax = Math.min(parseInt(ymaxStr, 10) || 1000, 1000);
      const xmax = Math.min(parseInt(xmaxStr, 10) || 1000, 1000);

      const canvas = pageCanvases[pageNum - 1] || pageCanvases[0];
      if (canvas) {
        const croppedDataUrl = cropImageFromCanvas(canvas, ymin, xmin, ymax, xmax, 10);
        if (croppedDataUrl) {
          count++;
          const imgId = `image_${count}`;
          const label = alt && alt.trim() ? alt.trim() : `Hình ${count}`;

          extractedImages.push({
            id: imgId,
            label,
            pageNumber: pageNum,
            dataUrl: croppedDataUrl,
            width: Math.round(((xmax - xmin) / 1000) * canvas.width),
            height: Math.round(((ymax - ymin) / 1000) * canvas.height),
            format: 'png',
            sizeBytes: Math.round((croppedDataUrl.length * 3) / 4),
          });

          const num = count.toString();
          imageMap[imgId] = croppedDataUrl;
          imageMap[num] = croppedDataUrl;
          imageMap[`hinh_${num}`] = croppedDataUrl;
          imageMap[`hình_${num}`] = croppedDataUrl;
          imageMap[`hinh ${num}`] = croppedDataUrl;
          imageMap[`hình ${num}`] = croppedDataUrl;
          imageMap[match] = croppedDataUrl;

          return `\n\n![${label}](${imgId})\n\n`;
        }
      }

      // Fallback
      count++;
      const imgId = `image_${count}`;
      return `\n\n![${alt && alt.trim() ? alt.trim() : 'Hình ' + count}](${imgId})\n\n`;
    }
  );

  return {
    processedText,
    imageMap,
    extractedImages,
  };
}
