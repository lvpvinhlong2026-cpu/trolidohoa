import React, { useState, useRef, useMemo } from 'react';
import { 
  Table, 
  Copy, 
  Download, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  Code,
  Eye,
  CheckCircle2,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import { addDpiToBlob } from '../utils/dpiUtils';

export type BBTType = 'variation' | 'sign_chart';

export interface XPoint {
  id: string;
  xVal: string;
  // Trạng thái y' tại điểm x: '0' | 'double_bar' (||) | 'single_bar' (|) | 'blank'
  derivType: '0' | 'double_bar' | 'single_bar' | 'blank';
  // Dấu của y' ở khoảng bên phải điểm x này (nếu không phải điểm cuối)
  intervalSign: '+' | '-' | 'blank';
  // Giá trị của y tại điểm x:
  // Nếu là tiệm cận đứng (double_bar) thì có thể có giá trị bên trái và bên phải (vd: -inf / +inf)
  yVal: string;
  yRightVal?: string; // Dùng cho tiệm cận đứng 2 nhánh
  // Vị trí độ cao của y: 'top' (cực đại / +inf), 'bottom' (cực tiểu / -inf), 'middle'
  yPos: 'top' | 'bottom' | 'middle';
  yRightPos?: 'top' | 'bottom' | 'middle';
}

// Chuyển ký hiệu LaTeX sang ký tự hiển thị Toán học chuẩn
function formatDisplayMath(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\infty/g, '∞')
    .replace(/-\s*\\infty/g, '−∞')
    .replace(/\+\s*\\infty/g, '+∞')
    .replace(/^-/g, '−')
    .replace(/\\pm/g, '±')
    .replace(/_0/g, '₀')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃');
}

/**
 * =========================================================================
 * BỘ VẼ TRỰC TIẾP LÊN HTML5 CANVAS (300 DPI CHUẨN IN ẤN VÀ MICROSOFT WORD)
 * Giải quyết triệt để 100% lỗi không dán được hình vào Word!
 * Tối ưu hóa chữ to rõ, chuẩn SGK và đề thi Toán học
 * =========================================================================
 */
function drawBBTToCanvas(
  canvas: HTMLCanvasElement,
  points: XPoint[],
  bbtMode: BBTType,
  fontChoice: 'times' | 'sans',
  colorStyle: 'monochrome' | 'colored',
  scale: number = 3.0,
  fontSizeMode: 'standard' | 'large' | 'extra' = 'large',
  tableWidthMode: 'auto' | 'compact' | 'wide' = 'auto'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontMultiplier = fontSizeMode === 'extra' ? 1.55 : fontSizeMode === 'standard' ? 1.1 : 1.35;
  const numPts = points.length;

  const svgW = tableWidthMode === 'wide' 
    ? 740 
    : tableWidthMode === 'compact' 
      ? 580 
      : Math.min(740, Math.max(560, numPts <= 3 ? 540 : numPts === 4 ? 614 : numPts === 5 ? 660 : 720));

  const paddingX = 15;
  const tableX = paddingX;
  const tableW = svgW - 2 * paddingX;
  const colLabelW = 58;
  const dataAreaX = tableX + colLabelW;
  const dataAreaW = tableW - colLabelW;

  const hRowX = Math.round(45 * (fontMultiplier > 1.3 ? 1.05 : 1));
  const hRowDeriv = Math.round(43 * (fontMultiplier > 1.3 ? 1.05 : 1));
  const hRowY = bbtMode === 'variation' ? 148 : 0;
  const tableH = hRowX + hRowDeriv + hRowY;
  const tableY = 20;

  const yRow1 = tableY;
  const yRow2 = yRow1 + hRowX;
  const yRow3 = yRow2 + hRowDeriv;
  const yBottom = yRow3 + hRowY;
  const svgH = yBottom + 25;

  canvas.width = Math.round(svgW * scale);
  canvas.height = Math.round(svgH * scale);

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Tô nền trắng tinh khiết
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, svgW, svgH);

  const fontFamily = fontChoice === 'times'
    ? '"Times New Roman", Times, "STIX Two Text", "Cambria Math", serif'
    : 'system-ui, -apple-system, sans-serif';

  const strokeColor = '#000000';
  const textColor = '#000000';
  const isMono = colorStyle === 'monochrome';
  const plusColor = isMono ? '#000000' : '#0d9488';
  const minusColor = isMono ? '#000000' : '#e11d48';

  // 2. Kẻ khung viền ngoài chữ nhật kín bao quanh bảng (Nét chuẩn 2.2px)
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(tableX, tableY, tableW, tableH);

  // 3. Đường dọc phân cách cột nhãn (x, y', y)
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(dataAreaX, tableY);
  ctx.lineTo(dataAreaX, yBottom);
  ctx.stroke();

  // 4. Đường ngang phân cách dòng x và y'
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(tableX, yRow2);
  ctx.lineTo(tableX + tableW, yRow2);
  ctx.stroke();

  // 5. Đường ngang phân cách dòng y' và y
  if (bbtMode === 'variation') {
    ctx.beginPath();
    ctx.moveTo(tableX, yRow3);
    ctx.lineTo(tableX + tableW, yRow3);
    ctx.stroke();
  }

  // 6. Nhãn cột trái (x, y', y) - In nghiêng đậm chuẩn toán, chữ to rõ
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const headerFontSz = Math.round(20 * fontMultiplier);
  ctx.font = `italic bold ${headerFontSz}px ${fontFamily}`;
  ctx.fillText('x', tableX + colLabelW / 2, tableY + hRowX / 2);
  ctx.fillText(bbtMode === 'variation' ? "y'" : "f'(x)", tableX + colLabelW / 2, yRow2 + hRowDeriv / 2);
  if (bbtMode === 'variation') {
    ctx.fillText('y', tableX + colLabelW / 2, yRow3 + hRowY / 2);
  }

  // 7. Tính tọa độ các mốc x
  const endMargin = 38;
  const usableWidth = dataAreaW - 2 * endMargin;
  const colSpacing = usableWidth / Math.max(1, numPts - 1);
  const getXPos = (idx: number) => dataAreaX + endMargin + idx * colSpacing;

  // 8. Vẽ giá trị dòng x (To rõ, sắc nét)
  for (let i = 0; i < numPts; i++) {
    const px = getXPos(i);
    const xText = formatDisplayMath(points[i].xVal);
    const isInf = xText.includes('∞');
    const xFontSz = Math.round((isInf ? 19 : 18) * fontMultiplier);
    ctx.font = `bold ${xFontSz}px ${fontFamily}`;
    ctx.fillText(xText, px, tableY + hRowX / 2);
  }

  // 9. Vẽ nội dung dòng y' (0, vạch đơn |, vạch kép ||, dấu +, -)
  for (let i = 0; i < numPts; i++) {
    const pt = points[i];
    const px = getXPos(i);

    if (pt.derivType === '0') {
      ctx.fillStyle = textColor;
      const zeroFontSz = Math.round(18 * fontMultiplier);
      ctx.font = `bold ${zeroFontSz}px ${fontFamily}`;
      ctx.fillText('0', px, yRow2 + hRowDeriv / 2);
    } else if (pt.derivType === 'single_bar') {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, yRow2);
      ctx.lineTo(px, bbtMode === 'variation' ? yBottom : yRow3);
      ctx.stroke();
    } else if (pt.derivType === 'double_bar') {
      const barH = (bbtMode === 'variation' ? yBottom : yRow3) - yRow2;
      const barOffset = 3.5;
      // Xóa phần đường kẻ ngang giữa 2 vạch để tạo khe trắng thông suốt đúng chuẩn SGK
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px - barOffset - 1, yRow2 + 1, barOffset * 2 + 2, barH - 2);

      // Vạch đôi kéo dài từ dưới dòng x xuống đáy bảng
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px - barOffset, yRow2);
      ctx.lineTo(px - barOffset, bbtMode === 'variation' ? yBottom : yRow3);
      ctx.moveTo(px + barOffset, yRow2);
      ctx.lineTo(px + barOffset, bbtMode === 'variation' ? yBottom : yRow3);
      ctx.stroke();
    }

    // Dấu +, - giữa các khoảng (Đậm nét, to rõ chuẩn in)
    if (i < numPts - 1 && pt.intervalSign !== 'blank') {
      const midX = (px + getXPos(i + 1)) / 2;
      const midY = yRow2 + hRowDeriv / 2;

      if (pt.intervalSign === '-') {
        // Dấu trừ nét vẽ đậm đà, rõ ràng như SGK
        ctx.strokeStyle = minusColor;
        ctx.lineWidth = Math.max(3.0, Math.round(2.5 * fontMultiplier));
        ctx.lineCap = 'round';
        const halfMinusW = Math.round(7.5 * fontMultiplier);
        ctx.beginPath();
        ctx.moveTo(midX - halfMinusW, midY);
        ctx.lineTo(midX + halfMinusW, midY);
        ctx.stroke();
      } else {
        ctx.fillStyle = plusColor;
        const plusFontSz = Math.round(21 * fontMultiplier);
        ctx.font = `bold ${plusFontSz}px ${fontFamily}`;
        ctx.fillText('+', midX, midY);
      }
    }
  }

  // 10. Vẽ dòng y và các mũi tên chiều biến thiên
  if (bbtMode === 'variation') {
    const getYCoord = (pos: 'top' | 'bottom' | 'middle') => {
      if (pos === 'top') return yRow3 + 28;
      if (pos === 'bottom') return yBottom - 26;
      return yRow3 + hRowY / 2 + 3;
    };

    // A. Vẽ các mũi tên nối trước (nét đậm to rõ)
    const arrowLineWidth = Math.max(2.0, Math.round(1.8 * fontMultiplier));
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = arrowLineWidth;

    for (let i = 0; i < numPts - 1; i++) {
      const pt = points[i];
      const nextPt = points[i + 1];
      const px = getXPos(i);
      const nextPx = getXPos(i + 1);

      const isCurDouble = pt.derivType === 'double_bar';
      const isNextDouble = nextPt.derivType === 'double_bar';

      const srcX = isCurDouble ? px + 28 : px;
      const srcY = isCurDouble ? getYCoord(pt.yRightPos || 'top') : getYCoord(pt.yPos);
      const srcLabel = isCurDouble ? (pt.yRightVal || '') : pt.yVal;

      const dstX = isNextDouble ? nextPx - 28 : nextPx;
      const dstY = getYCoord(nextPt.yPos);
      const dstLabel = nextPt.yVal;

      const srcLen = formatDisplayMath(srcLabel).length;
      const dstLen = formatDisplayMath(dstLabel).length;
      const marginSrcX = Math.max(20, srcLen * 6.0 + 8);
      const marginDstX = Math.max(20, dstLen * 6.0 + 8);

      let y1 = srcY;
      let y2 = dstY;
      if (dstY < srcY) {
        y1 = srcY - 8;
        y2 = dstY + 8;
      } else if (dstY > srcY) {
        y1 = srcY + 8;
        y2 = dstY - 8;
      }

      const x1 = srcX + marginSrcX;
      const x2 = dstX - marginDstX;

      // Kẻ thân mũi tên
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Vẽ đỉnh tam giác đầu mũi tên sắc nét
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.round(10 * fontMultiplier);
      const headAngle = Math.PI / 7;

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headLen * Math.cos(angle - headAngle),
        y2 - headLen * Math.sin(angle - headAngle)
      );
      ctx.lineTo(
        x2 - headLen * Math.cos(angle + headAngle),
        y2 - headLen * Math.sin(angle + headAngle)
      );
      ctx.closePath();
      ctx.fill();
    }

    // B. Vẽ các giá trị y đè lên lớp nền trắng halo để đảm bảo chữ luôn cực kỳ nổi bật
    ctx.fillStyle = textColor;

    for (let i = 0; i < numPts; i++) {
      const pt = points[i];
      const px = getXPos(i);

      const renderValWithHalo = (val: string, posX: number, posY: number) => {
        const textStr = formatDisplayMath(val);
        if (!textStr) return;
        const isInf = textStr.includes('∞');
        const yFontSz = Math.round((isInf ? 19 : 18) * fontMultiplier);
        ctx.font = `bold ${yFontSz}px ${fontFamily}`;
        const textWidth = ctx.measureText(textStr).width;

        // Nền trắng che phủ nhẹ nhàng
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - textWidth / 2 - 4, posY - 12 * fontMultiplier, textWidth + 8, 24 * fontMultiplier);

        // Chữ số to rõ
        ctx.fillStyle = textColor;
        ctx.fillText(textStr, posX, posY);
      };

      if (pt.derivType !== 'double_bar') {
        renderValWithHalo(pt.yVal, px, getYCoord(pt.yPos));
      } else {
        renderValWithHalo(pt.yVal, px - 28, getYCoord(pt.yPos));
        renderValWithHalo(pt.yRightVal || '', px + 28, getYCoord(pt.yRightPos || 'top'));
      }
    }
  }

  ctx.restore();
}

export default function TableVariationTool() {
  const [bbtMode, setBbtMode] = useState<BBTType>('variation');
  const [fontChoice, setFontChoice] = useState<'times' | 'sans'>('times');
  const [colorStyle, setColorStyle] = useState<'monochrome' | 'colored'>('monochrome');
  const [fontSizeMode, setFontSizeMode] = useState<'standard' | 'large' | 'extra'>('large');
  const [tableWidthMode, setTableWidthMode] = useState<'auto' | 'compact' | 'wide'>('auto');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [latexCodeCopied, setLatexCodeCopied] = useState<boolean>(false);
  const [showLatexModal, setShowLatexModal] = useState<boolean>(false);

  // MẶC ĐỊNH: ĐÚNG CHÍNH XÁC BẢNG TRONG HÌNH ẢNH MẪU
  const [points, setPoints] = useState<XPoint[]>([
    { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '+', yVal: '-\\infty', yPos: 'bottom' },
    { id: '2', xVal: '0', derivType: '0', intervalSign: '-', yVal: '-1', yPos: 'top' },
    { 
      id: '3', 
      xVal: '1', 
      derivType: 'double_bar', 
      intervalSign: '-', 
      yVal: '-\\infty', 
      yPos: 'bottom',
      yRightVal: '+\\infty',
      yRightPos: 'top'
    },
    { id: '4', xVal: '2', derivType: '0', intervalSign: '+', yVal: '3', yPos: 'bottom' },
    { id: '5', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '+\\infty', yPos: 'top' },
  ]);

  const svgRef = useRef<SVGSVGElement>(null);

  const loadPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'cubic_image1':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '+', yVal: '-\\infty', yPos: 'bottom' },
          { id: '2', xVal: '-1', derivType: '0', intervalSign: '-', yVal: '2', yPos: 'top' },
          { id: '3', xVal: '3', derivType: '0', intervalSign: '+', yVal: '-2', yPos: 'bottom' },
          { id: '4', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '+\\infty', yPos: 'top' },
        ]);
        break;
      case 'rational_2_1':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '+', yVal: '-\\infty', yPos: 'bottom' },
          { id: '2', xVal: '0', derivType: '0', intervalSign: '-', yVal: '-1', yPos: 'top' },
          { 
            id: '3', 
            xVal: '1', 
            derivType: 'double_bar', 
            intervalSign: '-', 
            yVal: '-\\infty', 
            yPos: 'bottom',
            yRightVal: '+\\infty',
            yRightPos: 'top'
          },
          { id: '4', xVal: '2', derivType: '0', intervalSign: '+', yVal: '3', yPos: 'bottom' },
          { id: '5', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '+\\infty', yPos: 'top' },
        ]);
        break;
      case 'cubic_2_extrema':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '+', yVal: '-\\infty', yPos: 'bottom' },
          { id: '2', xVal: '0', derivType: '0', intervalSign: '-', yVal: '2', yPos: 'top' },
          { id: '3', xVal: '2', derivType: '0', intervalSign: '+', yVal: '-2', yPos: 'bottom' },
          { id: '4', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '+\\infty', yPos: 'top' },
        ]);
        break;
      case 'cubic_negative_a':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '-', yVal: '+\\infty', yPos: 'top' },
          { id: '2', xVal: '-1', derivType: '0', intervalSign: '+', yVal: '-3', yPos: 'bottom' },
          { id: '3', xVal: '1', derivType: '0', intervalSign: '-', yVal: '1', yPos: 'top' },
          { id: '4', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '-\\infty', yPos: 'bottom' },
        ]);
        break;
      case 'quartic_3_extrema':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '-', yVal: '+\\infty', yPos: 'top' },
          { id: '2', xVal: '-1', derivType: '0', intervalSign: '+', yVal: '-1', yPos: 'bottom' },
          { id: '3', xVal: '0', derivType: '0', intervalSign: '-', yVal: '3', yPos: 'top' },
          { id: '4', xVal: '1', derivType: '0', intervalSign: '+', yVal: '-1', yPos: 'bottom' },
          { id: '5', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '+\\infty', yPos: 'top' },
        ]);
        break;
      case 'rational_1_1':
        setBbtMode('variation');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '-', yVal: '2', yPos: 'top' },
          { 
            id: '2', 
            xVal: '1', 
            derivType: 'double_bar', 
            intervalSign: '-', 
            yVal: '-\\infty', 
            yPos: 'bottom',
            yRightVal: '+\\infty',
            yRightPos: 'top'
          },
          { id: '3', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '2', yPos: 'bottom' },
        ]);
        break;
      case 'sign_quadratic':
        setBbtMode('sign_chart');
        setPoints([
          { id: '1', xVal: '-\\infty', derivType: 'blank', intervalSign: '+', yVal: '', yPos: 'middle' },
          { id: '2', xVal: 'x_1', derivType: '0', intervalSign: '-', yVal: '', yPos: 'middle' },
          { id: '3', xVal: 'x_2', derivType: '0', intervalSign: '+', yVal: '', yPos: 'middle' },
          { id: '4', xVal: '+\\infty', derivType: 'blank', intervalSign: 'blank', yVal: '', yPos: 'middle' },
        ]);
        break;
    }
  };

  const handleAddPoint = () => {
    const newId = Date.now().toString();
    const lastIdx = points.length - 1;
    const newPt: XPoint = {
      id: newId,
      xVal: 'x_0',
      derivType: '0',
      intervalSign: '+',
      yVal: '0',
      yPos: 'middle'
    };
    const nextPoints = [...points];
    nextPoints.splice(Math.max(1, lastIdx), 0, newPt);
    setPoints(nextPoints);
  };

  const handleUpdatePoint = (id: string, updates: Partial<XPoint>) => {
    setPoints(points.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeletePoint = (id: string) => {
    if (points.length <= 2) return;
    setPoints(points.filter(p => p.id !== id));
  };

  // Xuất mã LaTeX tkz-tab
  const latexTikzTabCode = useMemo(() => {
    const xList = points.map(p => `$${p.xVal}$`).join(' , ');
    let linesStr = '';
    let varsStr = '';

    const lineParts: string[] = [];
    points.forEach((p, idx) => {
      if (idx > 0) {
        if (p.derivType === '0') lineParts.push('0');
        else if (p.derivType === 'double_bar') lineParts.push('d');
        else if (p.derivType === 'single_bar') lineParts.push('t');
      }
      if (idx < points.length - 1) {
        lineParts.push(p.intervalSign === '+' ? '+' : p.intervalSign === '-' ? '-' : '');
      }
    });
    linesStr = lineParts.filter(Boolean).join(' , ');

    if (bbtMode === 'variation') {
      const varParts: string[] = [];
      points.forEach((p, idx) => {
        const sign = p.yPos === 'top' ? '+' : p.yPos === 'bottom' ? '-' : '';
        if (p.derivType === 'double_bar') {
          varParts.push(`-D/${p.yVal || '-\\infty'}/${p.yRightVal || '+\\infty'}`);
        } else {
          varParts.push(`${sign}/${p.yVal || '0'}`);
        }
      });
      varsStr = varParts.join(' , ');
    }

    if (bbtMode === 'sign_chart') {
      return `\\begin{tikzpicture}
  \\tkzTabInit[lgt=1.5,espcl=2.2]{$x$/1, $f'(x)$/1}{${xList}}
  \\tkzTabLine{ , ${linesStr} , }
\\end{tikzpicture}`;
    }

    return `\\begin{tikzpicture}
  \\tkzTabInit[lgt=1.5,espcl=2.2]{$x$/1, $y'$/1, $y$/2}{${xList}}
  \\tkzTabLine{ , ${linesStr} , }
  \\tkzTabVar{${varsStr}}
\\end{tikzpicture}`;
  }, [points, bbtMode]);

  // ========================================================
  // SAO CHÉP ẢNH VÀO CLIPBOARD (300 DPI - DÁN WORD HIỂN THỊ 100%)
  // ========================================================
  const handleCopyImage = async () => {
    try {
      // 1. Tạo Canvas ảo độ phân giải cao (scale = 3.0 cho độ nét 300 DPI)
      const canvas = document.createElement('canvas');
      drawBBTToCanvas(canvas, points, bbtMode, fontChoice, colorStyle, 3.0, fontSizeMode, tableWidthMode);

      // 2. Chuyển Canvas thành Blob PNG
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Không thể tạo blob PNG từ canvas');

      // 3. Nhúng siêu dữ liệu pHYs 300 DPI vào PNG để Microsoft Word nhận diện đúng chuẩn in ấn
      const blobWithDpi = await addDpiToBlob(blob, 300);

      // 4. Chuẩn bị thẻ ảnh HTML Data URL (hỗ trợ cả dán qua Bitmap và dán qua HTML trong Microsoft Word)
      const dataUrl = canvas.toDataURL('image/png');
      const htmlSnippet = `<img src="${dataUrl}" alt="Bang bien thien" width="${canvas.width / 3}" height="${canvas.height / 3}" style="display:inline-block; max-width:100%; height:auto;" />`;
      const htmlBlob = new Blob([htmlSnippet], { type: 'text/html' });

      // 5. Ghi đồng thời 'image/png' và 'text/html' vào Clipboard hệ thống
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blobWithDpi,
            'text/html': htmlBlob
          })
        ]);
      } catch {
        // Fallback: ghi 'image/png' đơn lẻ nếu trình duyệt chưa hỗ trợ multi-mime
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blobWithDpi })
        ]);
      }

      setCopyStatus('copied');
      setTimeout(() => setCopyStatus(null), 3500);
    } catch (err) {
      console.warn('Clipboard write thất bại, chuyển sang phương án tải trực tiếp:', err);
      // Fallback: Tự động tải file PNG 300 DPI về máy nếu trình duyệt chặn clipboard
      try {
        const canvas = document.createElement('canvas');
        drawBBTToCanvas(canvas, points, bbtMode, fontChoice, colorStyle, 3.0, fontSizeMode, tableWidthMode);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const blobWithDpi = await addDpiToBlob(blob, 300);
          const url = URL.createObjectURL(blobWithDpi);
          const a = document.createElement('a');
          a.download = `Bang_bien_thien_300DPI_${Date.now()}.png`;
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
          setCopyStatus('downloaded');
          setTimeout(() => setCopyStatus(null), 4000);
        }
      } catch (e2) {
        console.error('Lỗi khi tải fallback:', e2);
      }
    }
  };

  // TẢI ẢNH PNG 300 DPI
  const handleDownloadPng = async () => {
    try {
      const canvas = document.createElement('canvas');
      drawBBTToCanvas(canvas, points, bbtMode, fontChoice, colorStyle, 3.0, fontSizeMode, tableWidthMode);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const blobWithDpi = await addDpiToBlob(blob, 300);
        const url = URL.createObjectURL(blobWithDpi);
        const a = document.createElement('a');
        a.download = `Bang_bien_thien_300DPI_${Date.now()}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Lỗi khi tải PNG:', e);
    }
  };

  // TẢI ẢNH VECTOR SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    let svgData = new XMLSerializer().serializeToString(svgRef.current);
    if (!svgData.includes('xmlns=')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Bang_bien_thien_${Date.now()}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexTikzTabCode);
    setLatexCodeCopied(true);
    setTimeout(() => setLatexCodeCopied(false), 2000);
  };

  const fontFamilyStyle = fontChoice === 'times' 
    ? '"Times New Roman", Times, "STIX Two Text", "Cambria Math", serif' 
    : 'system-ui, -apple-system, sans-serif';

  const isMono = colorStyle === 'monochrome';
  const strokeColor = '#000000';
  const textColor = '#000000';
  const arrowColor = '#000000';
  const plusColor = isMono ? '#000000' : '#0d9488';
  const minusColor = isMono ? '#000000' : '#e11d48';

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Table size={20} />
            </div>
            <span>Bảng Biến Thiên & Bảng Xét Dấu Toán Học</span>
          </h2>
        </div>

        {/* Nút chuyển đổi: Bảng Biến Thiên vs Bảng Xét Dấu */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setBbtMode('variation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              bbtMode === 'variation'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bảng biến thiên đầy đủ (x, y', y)
          </button>
          <button
            onClick={() => setBbtMode('sign_chart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              bbtMode === 'sign_chart'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bảng xét dấu (x, f'(x))
          </button>
        </div>
      </div>

      {/* DANH SÁCH MẪU NHANH (PRESETS) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
          <Bookmark size={14} className="text-teal-600" />
          <span>Mẫu nhanh:</span>
        </span>
        <button
          onClick={() => loadPreset('cubic_image1')}
          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer transition shadow-xs flex items-center gap-1"
        >
          <Sparkles size={12} />
          <span>Mẫu Hình 1 (Bậc 3: x = -1, 3)</span>
        </button>
        <button
          onClick={() => loadPreset('rational_2_1')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition flex items-center gap-1"
        >
          <Sparkles size={12} />
          <span>Mẫu Hình 2 (TCĐ x = 1)</span>
        </button>
        <button
          onClick={() => loadPreset('cubic_2_extrema')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition"
        >
          Hàm bậc 3 (2 cực trị, a &gt; 0)
        </button>
        <button
          onClick={() => loadPreset('cubic_negative_a')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition"
        >
          Hàm bậc 3 (2 cực trị, a &lt; 0)
        </button>
        <button
          onClick={() => loadPreset('quartic_3_extrema')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition"
        >
          Hàm trùng phương (3 cực trị)
        </button>
        <button
          onClick={() => loadPreset('rational_1_1')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition"
        >
          Phân thức (ax+b)/(cx+d)
        </button>
        <button
          onClick={() => loadPreset('sign_quadratic')}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition"
        >
          Xét dấu tam thức bậc hai
        </button>
      </div>

      {/* THÔNG BÁO SAO CHÉP / HƯỚNG DẪN DÁN WORD */}
      {copyStatus && (
        <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fade-in ${
          copyStatus === 'copied'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className={copyStatus === 'copied' ? 'text-emerald-600' : 'text-amber-600'} />
            <span>
              {copyStatus === 'copied'
                ? 'Đã sao chép ảnh Bảng biến thiên (300 DPI)! Thầy/Cô mở Microsoft Word và nhấn phím Ctrl + V để dán ngay.'
                : 'Trình duyệt đã tự động tải tệp ảnh 300 DPI về máy. Thầy/Cô có thể vào Word chọn Insert Picture để chèn ảnh.'}
            </span>
          </div>
          <button
            onClick={() => setCopyStatus(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* BODY GRID: BẢNG NHẬP LIỆU CÁC MỐC & KHUNG HIỂN THỊ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5 CỘT): DANH SÁCH CÁC ĐIỂM MỐC */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Thiết lập từng cột mốc tọa độ:
              </span>
              <button
                onClick={handleAddPoint}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Plus size={13} />
                <span>Thêm mốc x</span>
              </button>
            </div>

            {/* DANH SÁCH CÁC ĐIỂM MỐC */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {points.map((pt, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === points.length - 1;

                return (
                  <div 
                    key={pt.id} 
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {/* Giá trị x */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">x:</span>
                          <input
                            type="text"
                            value={pt.xVal}
                            onChange={(e) => handleUpdatePoint(pt.id, { xVal: e.target.value })}
                            className="w-16 px-2 py-0.5 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                            placeholder="x"
                          />
                        </div>
                      </div>

                      {/* Nút xóa mốc */}
                      {!isFirst && !isLast && (
                        <button
                          onClick={() => handleDeletePoint(pt.id)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                          title="Xóa mốc này"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* DÒNG Y': TRẠNG THÁI TẠI ĐIỂM & DẤU KHOẢNG BÊN PHẢI */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-0.5">Tại mốc y':</span>
                        <select
                          value={pt.derivType}
                          onChange={(e) => handleUpdatePoint(pt.id, { derivType: e.target.value as any })}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold"
                        >
                          <option value="0">0 (Nghiệm đạo hàm)</option>
                          <option value="double_bar">|| (Vạch đôi không xác định)</option>
                          <option value="single_bar">| (Vạch đơn)</option>
                          <option value="blank">Để trống</option>
                        </select>
                      </div>

                      {!isLast ? (
                        <div>
                          <span className="text-[11px] text-slate-500 block mb-0.5">Dấu khoảng sau:</span>
                          <select
                            value={pt.intervalSign}
                            onChange={(e) => handleUpdatePoint(pt.id, { intervalSign: e.target.value as any })}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-teal-700 dark:text-teal-300"
                          >
                            <option value="+">+ (Dương)</option>
                            <option value="-">- (Âm)</option>
                            <option value="blank">Để trống</option>
                          </select>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 flex items-center pt-3">
                          (Điểm mút cuối)
                        </div>
                      )}
                    </div>

                    {/* DÒNG Y: GIÁ TRỊ & ĐỘ CAO MŨI TÊN (CHỈ DÀNH CHO BẢNG BIẾN THIÊN) */}
                    {bbtMode === 'variation' && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 block mb-0.5">
                            {pt.derivType === 'double_bar' ? 'Giá trị y (Trái vạch ||):' : 'Giá trị y:'}
                          </span>
                          <input
                            type="text"
                            value={pt.yVal}
                            onChange={(e) => handleUpdatePoint(pt.id, { yVal: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                            placeholder="y"
                          />
                          <select
                            value={pt.yPos}
                            onChange={(e) => handleUpdatePoint(pt.id, { yPos: e.target.value as any })}
                            className="w-full mt-1 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px]"
                          >
                            <option value="top">Ở trên cao (Cực đại / +inf)</option>
                            <option value="bottom">Ở dưới thấp (Cực tiểu / -inf)</option>
                            <option value="middle">Ở giữa</option>
                          </select>
                        </div>

                        {pt.derivType === 'double_bar' && (
                          <div>
                            <span className="text-[11px] text-slate-500 block mb-0.5">Giá trị y (Phải vạch ||):</span>
                            <input
                              type="text"
                              value={pt.yRightVal || ''}
                              onChange={(e) => handleUpdatePoint(pt.id, { yRightVal: e.target.value })}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                              placeholder="+inf"
                            />
                            <select
                              value={pt.yRightPos || 'top'}
                              onChange={(e) => handleUpdatePoint(pt.id, { yRightPos: e.target.value as any })}
                              className="w-full mt-1 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px]"
                            >
                              <option value="top">Ở trên cao (Cực đại / +inf)</option>
                              <option value="bottom">Ở dưới thấp (Cực tiểu / -inf)</option>
                              <option value="middle">Ở giữa</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 CỘT): KHUNG VẼ BẢNG BIẾN THIÊN & NÚT XUẤT */}
        <div className="lg:col-span-7 space-y-4">
          {/* THANH CÔNG CỤ TÙY CHỌN & XUẤT ẢNH */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cỡ chữ:</span>
                <select
                  value={fontSizeMode}
                  onChange={(e) => setFontSizeMode(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 cursor-pointer shadow-xs"
                >
                  <option value="large">To rõ SGK (Khuyên dùng)</option>
                  <option value="extra">Rất to (Đề thi / Slide)</option>
                  <option value="standard">Tiêu chuẩn vừa phải</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Khổ bảng:</span>
                <select
                  value={tableWidthMode}
                  onChange={(e) => setTableWidthMode(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <option value="auto">Tự động cân đối (Khuyên dùng)</option>
                  <option value="wide">Rộng rãi (740px)</option>
                  <option value="compact">Gọn gàng (580px)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Phông:</span>
                <select
                  value={fontChoice}
                  onChange={(e) => setFontChoice(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="times">Times New Roman (Chuẩn Toán VN)</option>
                  <option value="sans">Sans-serif hiện đại</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chế độ:</span>
                <select
                  value={colorStyle}
                  onChange={(e) => setColorStyle(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="monochrome">Đen trắng chuẩn SGK & Đề thi</option>
                  <option value="colored">Màu sắc trực quan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyImage}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ring-2 ring-teal-500/30"
                title="Sao chép ảnh độ nét 300 DPI để dán ngay (Ctrl+V) vào Microsoft Word"
              >
                {copyStatus === 'copied' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copyStatus === 'copied' ? 'Đã sao chép 300 DPI!' : 'Sao chép ảnh (Dán Word)'}</span>
              </button>

              <button
                onClick={handleDownloadPng}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Tải ảnh PNG độ nét 300 DPI"
              >
                <Download size={13} />
                <span>PNG</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Tải ảnh vector SVG phóng to vô hạn"
              >
                <Download size={13} />
                <span>SVG</span>
              </button>

              <button
                onClick={() => setShowLatexModal(true)}
                className="px-3 py-2 bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Lấy mã LaTeX tkz-tab"
              >
                <Code size={13} />
                <span>LaTeX</span>
              </button>
            </div>
          </div>

          {/* VÙNG VẼ SVG BẢNG BIẾN THIÊN */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[360px] overflow-x-auto">
            {(() => {
              const fontMultiplier = fontSizeMode === 'extra' ? 1.55 : fontSizeMode === 'standard' ? 1.1 : 1.35;
              const numPts = points.length;

              const svgW = tableWidthMode === 'wide' 
                ? 740 
                : tableWidthMode === 'compact' 
                  ? 580 
                  : Math.min(740, Math.max(560, numPts <= 3 ? 540 : numPts === 4 ? 614 : numPts === 5 ? 660 : 720));

              const paddingX = 15;
              const tableX = paddingX;
              const tableW = svgW - 2 * paddingX;
              const colLabelW = 58;
              const dataAreaX = tableX + colLabelW;
              const dataAreaW = tableW - colLabelW;

              const hRowX = Math.round(45 * (fontMultiplier > 1.3 ? 1.05 : 1));
              const hRowDeriv = Math.round(43 * (fontMultiplier > 1.3 ? 1.05 : 1));
              const hRowY = bbtMode === 'variation' ? 148 : 0;
              const tableH = hRowX + hRowDeriv + hRowY;
              const tableY = 20;

              const yRow1 = tableY;
              const yRow2 = yRow1 + hRowX;
              const yRow3 = yRow2 + hRowDeriv;
              const yBottom = yRow3 + hRowY;
              const svgH = yBottom + 25;

              const endMargin = 38;
              const usableWidth = dataAreaW - 2 * endMargin;
              const colSpacing = usableWidth / Math.max(1, numPts - 1);
              const getXPos = (idx: number) => dataAreaX + endMargin + idx * colSpacing;

              const getYCoord = (pos: 'top' | 'bottom' | 'middle') => {
                if (pos === 'top') return yRow3 + 28;
                if (pos === 'bottom') return yBottom - 26;
                return yRow3 + hRowY / 2 + 3;
              };

              const halfMinusW = Math.round(7.5 * fontMultiplier);
              const minusLineWidth = Math.max(3.0, Math.round(2.5 * fontMultiplier));
              const arrowLineWidth = Math.max(2.0, Math.round(1.8 * fontMultiplier));
              const headLen = Math.round(10 * fontMultiplier);
              const headAngle = Math.PI / 7;

              return (
                <svg
                  ref={svgRef}
                  xmlns="http://www.w3.org/2000/svg"
                  width={svgW}
                  height={svgH}
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full max-w-[740px] h-auto select-none"
                  style={{ fontFamily: fontFamilyStyle, backgroundColor: '#ffffff' }}
                >
                  {/* 1. KHUNG BAO NGOÀI TOÀN BẢNG */}
                  <rect
                    x={tableX}
                    y={tableY}
                    width={tableW}
                    height={tableH}
                    fill="#ffffff"
                    stroke={strokeColor}
                    strokeWidth="2.2"
                  />

                  {/* 2. ĐƯỜNG DỌC NGĂN CỘT TIÊU ĐỀ */}
                  <line
                    x1={dataAreaX}
                    y1={tableY}
                    x2={dataAreaX}
                    y2={yBottom}
                    stroke={strokeColor}
                    strokeWidth="2.0"
                  />

                  {/* 3. ĐƯỜNG NGANG DÒNG X VÀ Y' */}
                  <line
                    x1={tableX}
                    y1={yRow2}
                    x2={tableX + tableW}
                    y2={yRow2}
                    stroke={strokeColor}
                    strokeWidth="1.8"
                  />

                  {/* 4. ĐƯỜNG NGANG DÒNG Y' VÀ Y */}
                  {bbtMode === 'variation' && (
                    <line
                      x1={tableX}
                      y1={yRow3}
                      x2={tableX + tableW}
                      y2={yRow3}
                      stroke={strokeColor}
                      strokeWidth="1.8"
                    />
                  )}

                  {/* 5. TIÊU ĐỀ CỘT TRÁI (x, y', y) - CHỮ TO RÕ */}
                  <g fill={textColor} fontSize={Math.round(20 * fontMultiplier)} fontWeight="bold" fontStyle="italic">
                    <text x={tableX + colLabelW / 2} y={tableY + hRowX / 2 + 7} textAnchor="middle">
                      x
                    </text>
                    <text x={tableX + colLabelW / 2} y={yRow2 + hRowDeriv / 2 + 7} textAnchor="middle">
                      {bbtMode === 'variation' ? "y'" : "f'(x)"}
                    </text>
                    {bbtMode === 'variation' && (
                      <text x={tableX + colLabelW / 2} y={yRow3 + hRowY / 2 + 7} textAnchor="middle">
                        y
                      </text>
                    )}
                  </g>

                  {/* 6. GIÁ TRỊ DÒNG X - TO RÕ SẮC NÉT */}
                  <g fill={textColor} fontWeight="bold">
                    {points.map((pt, idx) => {
                      const xText = formatDisplayMath(pt.xVal);
                      const isInf = xText.includes('∞');
                      const xFontSz = Math.round((isInf ? 19 : 18) * fontMultiplier);
                      return (
                        <text
                          key={pt.id}
                          x={getXPos(idx)}
                          y={tableY + hRowX / 2 + 7}
                          textAnchor="middle"
                          fontSize={xFontSz}
                        >
                          {xText}
                        </text>
                      );
                    })}
                  </g>

                  {/* 7. GIÁ TRỊ DÒNG Y' (0, VẠCH ĐÔI ||, DẤU +, - TO RÕ) */}
                  <g fill={textColor}>
                    {points.map((pt, idx) => {
                      const px = getXPos(idx);

                      return (
                        <g key={pt.id}>
                          {pt.derivType === '0' && (
                            <text 
                              x={px} 
                              y={yRow2 + hRowDeriv / 2 + 7} 
                              textAnchor="middle"
                              fontSize={Math.round(18 * fontMultiplier)}
                              fontWeight="bold"
                            >
                              0
                            </text>
                          )}

                          {pt.derivType === 'single_bar' && (
                            <line 
                              x1={px} 
                              y1={yRow2} 
                              x2={px} 
                              y2={bbtMode === 'variation' ? yBottom : yRow3} 
                              stroke={strokeColor} 
                              strokeWidth="1.8" 
                            />
                          )}

                          {pt.derivType === 'double_bar' && (
                            <>
                              {/* Khe trắng xóa đường kẻ ngang nằm giữa 2 vạch chuẩn hình */}
                              <rect
                                x={px - 4}
                                y={yRow2 + 1}
                                width={8}
                                height={(bbtMode === 'variation' ? yBottom : yRow3) - yRow2 - 2}
                                fill="#ffffff"
                              />
                              <line 
                                x1={px - 3.5} 
                                y1={yRow2} 
                                x2={px - 3.5} 
                                y2={bbtMode === 'variation' ? yBottom : yRow3} 
                                stroke={strokeColor} 
                                strokeWidth="1.6" 
                              />
                              <line 
                                x1={px + 3.5} 
                                y1={yRow2} 
                                x2={px + 3.5} 
                                y2={bbtMode === 'variation' ? yBottom : yRow3} 
                                stroke={strokeColor} 
                                strokeWidth="1.6" 
                              />
                            </>
                          )}

                          {idx < points.length - 1 && pt.intervalSign !== 'blank' && (
                            pt.intervalSign === '-' ? (
                              <line
                                x1={(px + getXPos(idx + 1)) / 2 - halfMinusW}
                                y1={yRow2 + hRowDeriv / 2}
                                x2={(px + getXPos(idx + 1)) / 2 + halfMinusW}
                                y2={yRow2 + hRowDeriv / 2}
                                stroke={minusColor}
                                strokeWidth={minusLineWidth}
                                strokeLinecap="round"
                              />
                            ) : (
                              <text
                                x={(px + getXPos(idx + 1)) / 2}
                                y={yRow2 + hRowDeriv / 2 + 8}
                                textAnchor="middle"
                                fontSize={Math.round(21 * fontMultiplier)}
                                fontWeight="bold"
                                fill={plusColor}
                              >
                                +
                              </text>
                            )
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* 8. GIÁ TRỊ DÒNG Y & MŨI TÊN BIẾN THIÊN */}
                  {bbtMode === 'variation' && (
                    <g className="variation-arrows">
                      {/* Mũi tên */}
                      {points.map((pt, idx) => {
                        if (idx >= points.length - 1) return null;

                        const nextPt = points[idx + 1];
                        const px = getXPos(idx);
                        const nextPx = getXPos(idx + 1);

                        const isCurDouble = pt.derivType === 'double_bar';
                        const isNextDouble = nextPt.derivType === 'double_bar';

                        const srcX = isCurDouble ? px + 28 : px;
                        const srcY = isCurDouble 
                          ? getYCoord(pt.yRightPos || 'top') 
                          : getYCoord(pt.yPos);
                        const srcLabel = isCurDouble ? (pt.yRightVal || '') : pt.yVal;

                        const dstX = isNextDouble ? nextPx - 28 : nextPx;
                        const dstY = getYCoord(nextPt.yPos);
                        const dstLabel = nextPt.yVal;

                        const srcTextLen = formatDisplayMath(srcLabel).length;
                        const dstTextLen = formatDisplayMath(dstLabel).length;
                        const marginSrcX = Math.max(20, srcTextLen * 6.0 + 8);
                        const marginDstX = Math.max(20, dstTextLen * 6.0 + 8);

                        let y1 = srcY;
                        let y2 = dstY;
                        if (dstY < srcY) {
                          y1 = srcY - 8;
                          y2 = dstY + 8;
                        } else if (dstY > srcY) {
                          y1 = srcY + 8;
                          y2 = dstY - 8;
                        }

                        const x1 = srcX + marginSrcX;
                        const x2 = dstX - marginDstX;

                        const angle = Math.atan2(y2 - y1, x2 - x1);

                        const arrowP1 = [
                          x2 - headLen * Math.cos(angle - headAngle),
                          y2 - headLen * Math.sin(angle - headAngle),
                        ];
                        const arrowP2 = [
                          x2 - headLen * Math.cos(angle + headAngle),
                          y2 - headLen * Math.sin(angle + headAngle),
                        ];

                        return (
                          <g key={`arrow-${idx}`}>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={arrowColor}
                              strokeWidth={arrowLineWidth}
                              strokeLinecap="round"
                            />
                            <polygon
                              points={`${x2},${y2} ${arrowP1[0]},${arrowP1[1]} ${arrowP2[0]},${arrowP2[1]}`}
                              fill={arrowColor}
                            />
                          </g>
                        );
                      })}

                      {/* Giá trị y (có nền trắng bảo vệ để chữ số luôn to rõ và không bị đường kẻ che) */}
                      {points.map((pt, idx) => {
                        const px = getXPos(idx);
                        const isDouble = pt.derivType === 'double_bar';

                        const renderSvgVal = (val: string, posX: number, posY: number, key: string) => {
                          const textStr = formatDisplayMath(val);
                          if (!textStr) return null;
                          const isInf = textStr.includes('∞');
                          const yFontSz = Math.round((isInf ? 19 : 18) * fontMultiplier);
                          const boxW = Math.max(28, textStr.length * 11 * (fontMultiplier / 1.35) + 8);
                          const boxH = Math.round(22 * (fontMultiplier / 1.35));

                          return (
                            <g key={key}>
                              <rect
                                x={posX - boxW / 2}
                                y={posY - boxH / 2 - 4}
                                width={boxW}
                                height={boxH}
                                fill="#ffffff"
                              />
                              <text
                                x={posX}
                                y={posY}
                                textAnchor="middle"
                                fontSize={yFontSz}
                                fontWeight="bold"
                                fill={textColor}
                              >
                                {textStr}
                              </text>
                            </g>
                          );
                        };

                        if (!isDouble) {
                          return renderSvgVal(pt.yVal, px, getYCoord(pt.yPos), `val-${pt.id}`);
                        } else {
                          return (
                            <g key={`val-group-${pt.id}`}>
                              {renderSvgVal(pt.yVal, px - 28, getYCoord(pt.yPos), `val-l-${pt.id}`)}
                              {renderSvgVal(pt.yRightVal || '', px + 28, getYCoord(pt.yRightPos || 'top'), `val-r-${pt.id}`)}
                            </g>
                          );
                        }
                      })}
                    </g>
                  )}
                </svg>
              );
            })()}
          </div>
        </div>
      </div>

      {/* MODAL MÃ LATEX TKZ-TAB */}
      {showLatexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Code size={18} className="text-teal-600" />
                <span>Mã nguồn LaTeX (Gói tkz-tab)</span>
              </h3>
              <button
                onClick={() => setShowLatexModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sao chép đoạn mã bên dưới và dán vào tài liệu LaTeX của bạn (cần khai báo gói <code>\usepackage&#123;tkz-tab&#125;</code>):
            </p>

            <pre className="p-4 bg-slate-900 text-teal-300 rounded-xl text-xs font-mono overflow-x-auto max-h-[220px]">
              {latexTikzTabCode}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLatexModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleCopyLatex}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {latexCodeCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{latexCodeCopied ? 'Đã sao chép mã!' : 'Sao chép mã LaTeX'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
