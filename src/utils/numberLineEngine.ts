/**
 * Number Line Engine - Bộ vẽ Trục số & Biểu diễn các tập con của tập số thực R (Toán 10)
 * Chuẩn SGK: Khoảng (a; b), Đoạn [a; b], Nửa khoảng [a; b), (a; b], [a; +inf), (-inf; b]
 * Vẽ dấu ngoặc tròn ( ), ngoặc vuông [ ], gạch chéo ///////// phần loại bỏ
 * Độ phân giải cao 300 DPI - Tối ưu copy dán Word & in ấn
 */

export interface IntervalItem {
  id?: string;
  start: number | '-inf';
  end: number | '+inf';
  startInclusive: boolean; // true: [, false: (
  endInclusive: boolean;   // true: ], false: )
  startLabel?: string;     // e.g. 'a', '-2', '0'
  endLabel?: string;       // e.g. 'b', '3'
}

export interface NumberLineConfig {
  mode?: 'single' | 'summary_table' | 'operation';
  interval?: IntervalItem; // Cho chế độ single
  intervals?: IntervalItem[]; // Hỗ trợ nhiều khoảng (e.g. hợp của 2 khoảng)
  operation?: {
    setA: IntervalItem;
    setB: IntervalItem;
    type: 'union' | 'intersection' | 'difference'; // A U B, A giao B, A \ B
  };
  minDisplayVal?: number;
  maxDisplayVal?: number;
  title?: string;
  fontFamily?: string;
  fontSizeScale?: number;
  isBold?: boolean;
  labelColor?: string;     // Màu nhãn a, b (mặc định '#0284C7' xanh cyan chuẩn SGK)
  hatchColor?: string;     // Màu nét gạch chéo /////// (mặc định '#334155' Slate-700)
  bracketColor?: string;   // Màu ngoặc (mặc định '#000000')
  axisColor?: string;      // Màu trục số (mặc định '#000000')
  showOrigin?: boolean;    // Hiển thị gốc O
}

/**
 * Phân tích chuỗi tập hợp người dùng nhập:
 * Ví dụ:
 * "(a; b)", "[-2; 3]", "[0; 5)", "(-inf; 4]", "(2; +inf)", "(-inf; +inf)"
 */
export function parseIntervalString(str: string): IntervalItem | null {
  const cleaned = str.trim().replace(/\s+/g, '');
  if (!cleaned) return null;

  if (cleaned.toLowerCase() === 'r' || cleaned === '(-inf;+inf)' || cleaned === '(-∞;+∞)') {
    return {
      start: '-inf',
      end: '+inf',
      startInclusive: false,
      endInclusive: false,
      startLabel: '-∞',
      endLabel: '+∞'
    };
  }

  const startChar = cleaned[0];
  const endChar = cleaned[cleaned.length - 1];

  const startInclusive = startChar === '[';
  const endInclusive = endChar === ']';

  if (!['(', '['].includes(startChar) || ![']', ')'].includes(endChar)) {
    return null;
  }

  const inner = cleaned.substring(1, cleaned.length - 1);
  const parts = inner.split(/[,;]/);
  if (parts.length !== 2) return null;

  const rawStart = parts[0].trim();
  const rawEnd = parts[1].trim();

  let start: number | '-inf';
  if (rawStart === '-inf' || rawStart === '-∞' || rawStart === '-vvc') {
    start = '-inf';
  } else {
    start = parseFloat(rawStart);
    if (isNaN(start)) {
      // Nhãn ký hiệu chữ (e.g. 'a')
      start = -2;
    }
  }

  let end: number | '+inf';
  if (rawEnd === '+inf' || rawEnd === '+∞' || rawEnd === 'inf' || rawEnd === '∞') {
    end = '+inf';
  } else {
    end = parseFloat(rawEnd);
    if (isNaN(end)) {
      // Nhãn ký hiệu chữ (e.g. 'b')
      end = 3;
    }
  }

  return {
    start,
    end,
    startInclusive,
    endInclusive,
    startLabel: rawStart === '-inf' ? '-∞' : rawStart,
    endLabel: (rawEnd === '+inf' || rawEnd === 'inf') ? '+∞' : rawEnd
  };
}

/**
 * Vẽ một đường trục số đơn lẻ trên Canvas
 */
export function drawSingleNumberLine(
  ctx: CanvasRenderingContext2D,
  interval: IntervalItem,
  startX: number,
  endX: number,
  y: number,
  options?: {
    fontFamily?: string;
    fontSizeScale?: number;
    isBold?: boolean;
    labelColor?: string;
    hatchColor?: string;
    bracketColor?: string;
    axisColor?: string;
    showOrigin?: boolean;
    valMin?: number;
    valMax?: number;
  }
) {
  const fontScale = options?.fontSizeScale ?? 1.0;
  const isBold = options?.isBold !== false;
  const fontFam = options?.fontFamily ?? '"Times New Roman", "STIX Two Text", "Cambria Math", serif';
  const labelColor = options?.labelColor ?? '#0284C7'; // Cyan chuẩn SGK
  const hatchColor = options?.hatchColor ?? '#334155'; // Nét gạch đậm nét chuẩn SGK
  const bracketColor = options?.bracketColor ?? '#000000';
  const axisColor = options?.axisColor ?? '#000000';

  const lineLen = endX - startX - 25; // Chừa chỗ cho mũi tên
  const arrowX = endX - 10;

  // Tính tọa độ pixel cho mốc start và end
  const isStartInf = interval.start === '-inf';
  const isEndInf = interval.end === '+inf';

  // Xác định khoảng hiển thị chuẩn
  let valA = isStartInf ? -3 : (typeof interval.start === 'number' ? interval.start : -2);
  let valB = isEndInf ? 3 : (typeof interval.end === 'number' ? interval.end : 2);
  if (valB <= valA) valB = valA + 4;

  const minV = options?.valMin ?? (isStartInf ? valB - 5 : valA - 2);
  const maxV = options?.valMax ?? (isEndInf ? valA + 5 : valB + 2);

  const toPx = (v: number) => {
    const ratio = (v - minV) / (maxV - minV);
    return startX + 10 + ratio * lineLen;
  };

  const pxA = isStartInf ? null : toPx(valA);
  const pxB = isEndInf ? null : toPx(valB);

  // 1. Vẽ các nét gạch chéo /////// phần BỊ LOẠI BỎ (ngoài tập hợp)
  ctx.save();
  ctx.strokeStyle = hatchColor;
  ctx.lineWidth = 1.3;

  const hatchStep = 4.5;
  const hatchHeight = 7.5;
  const hatchSlant = 4.0; // Góc nghiêng gạch chéo

  const drawHatching = (fromX: number, toX: number) => {
    if (toX <= fromX) return;
    for (let hx = fromX; hx <= toX; hx += hatchStep) {
      ctx.beginPath();
      ctx.moveTo(hx - hatchSlant, y + hatchHeight);
      ctx.lineTo(hx + hatchSlant, y - hatchHeight);
      ctx.stroke();
    }
  };

  // Nếu có mốc start (không phải -inf): gạch bỏ từ đầu trục tới mốc start
  if (pxA !== null) {
    drawHatching(startX + 2, pxA - 2);
  }

  // Nếu có mốc end (không phải +inf): gạch bỏ từ mốc end tới trước mũi tên
  if (pxB !== null) {
    drawHatching(pxB + 2, arrowX - 12);
  }

  ctx.restore();

  // 2. Vẽ thân trục số (đường thẳng nằm ngang màu đen)
  ctx.save();
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(arrowX, y);
  ctx.stroke();

  // Mũi tên nhọn chỉ sang phải
  drawArrowHeadHorizontal(ctx, arrowX, y);
  ctx.restore();

  // 3. Vẽ dấu ngoặc tại mốc start và end
  const bracketH = 13; // nửa chiều cao ngoặc (tổng cao 26px)
  ctx.save();
  ctx.strokeStyle = bracketColor;
  ctx.lineWidth = 2.4;

  // Dấu ngoặc mở tại mốc start
  if (pxA !== null) {
    if (interval.startInclusive) {
      // Ngoặc vuông mở: [ (hướng sang phải)
      ctx.beginPath();
      ctx.moveTo(pxA + 6, y - bracketH);
      ctx.lineTo(pxA, y - bracketH);
      ctx.lineTo(pxA, y + bracketH);
      ctx.lineTo(pxA + 6, y + bracketH);
      ctx.stroke();
    } else {
      // Ngoặc tròn mở: ( (hướng sang phải)
      ctx.beginPath();
      ctx.moveTo(pxA + 5, y - bracketH);
      ctx.quadraticCurveTo(pxA - 3, y, pxA + 5, y + bracketH);
      ctx.stroke();
    }
  }

  // Dấu ngoặc đóng tại mốc end
  if (pxB !== null) {
    if (interval.endInclusive) {
      // Ngoặc vuông đóng: ] (hướng sang trái)
      ctx.beginPath();
      ctx.moveTo(pxB - 6, y - bracketH);
      ctx.lineTo(pxB, y - bracketH);
      ctx.lineTo(pxB, y + bracketH);
      ctx.lineTo(pxB - 6, y + bracketH);
      ctx.stroke();
    } else {
      // Ngoặc tròn đóng: ) (hướng sang trái)
      ctx.beginPath();
      ctx.moveTo(pxB - 5, y - bracketH);
      ctx.quadraticCurveTo(pxB + 3, y, pxB - 5, y + bracketH);
      ctx.stroke();
    }
  }

  // Nếu là (-inf; +inf) toàn bộ trục số và có hiển thị gốc O
  if (isStartInf && isEndInf && (options?.showOrigin ?? true)) {
    const midX = (startX + arrowX - 10) / 2;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX, y - 4);
    ctx.lineTo(midX, y + 4);
    ctx.stroke();

    const fSize = Math.round(18 * fontScale);
    ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${fSize}px ${fontFam}`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('O', midX, y + 8);
  }

  ctx.restore();

  // 4. Ghi nhãn giá trị a, b dưới chân các dấu ngoặc
  ctx.save();
  const labelFontSz = Math.round(22 * fontScale);
  ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${labelFontSz}px ${fontFam}`;
  ctx.fillStyle = labelColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (pxA !== null) {
    const lblA = interval.startLabel ?? (typeof interval.start === 'number' ? interval.start.toString() : 'a');
    ctx.fillText(lblA, pxA, y + 15);
  }

  if (pxB !== null) {
    const lblB = interval.endLabel ?? (typeof interval.end === 'number' ? interval.end.toString() : 'b');
    ctx.fillText(lblB, pxB, y + 15);
  }

  ctx.restore();
}

function drawArrowHeadHorizontal(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const headLen = 10;
  const headHalfW = 4.0;
  const notch = 1.8;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - headLen, y - headHalfW);
  ctx.lineTo(x - headLen + notch, y);
  ctx.lineTo(x - headLen, y + headHalfW);
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();
}

/**
 * Render Trục số đơn hoàn chỉnh lên HTML5 Canvas (300 DPI)
 */
export function renderNumberLineToCanvas(
  config: NumberLineConfig,
  canvas: HTMLCanvasElement,
  dpiScale = 2.4,
  options?: { width?: number; height?: number; fontFamily?: string; fontSizeScale?: number; isBold?: boolean }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = options?.width ?? 640;
  const height = options?.height ?? 125;
  const isBold = options?.isBold ?? config.isBold !== false;

  canvas.width = Math.round(width * dpiScale);
  canvas.height = Math.round(height * dpiScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(dpiScale, dpiScale);

  // Nền trắng tinh khiết
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const interval = config.interval ?? {
    start: -2,
    end: 3,
    startInclusive: false,
    endInclusive: false,
    startLabel: 'a',
    endLabel: 'b'
  };

  const midY = height / 2 - 4;
  drawSingleNumberLine(ctx, interval, 24, width - 20, midY, {
    fontFamily: options?.fontFamily ?? config.fontFamily,
    fontSizeScale: options?.fontSizeScale ?? config.fontSizeScale,
    isBold,
    labelColor: config.labelColor,
    hatchColor: config.hatchColor,
    showOrigin: config.showOrigin
  });

  ctx.restore();
}

/**
 * Dữ liệu định nghĩa các tập con chuẩn SGK Toán 10 (Hình 3)
 */
export const SUBSET_DEFINITIONS: {
  category: string;
  name: string;
  symbol: string;
  mathDef: string;
  interval: IntervalItem;
}[] = [
  // Khoảng
  {
    category: 'Khoảng',
    name: 'Khoảng (a; b)',
    symbol: '(a; b)',
    mathDef: '(a; b) = {x ∈ ℝ | a < x < b}',
    interval: { start: -2, end: 3, startInclusive: false, endInclusive: false, startLabel: 'a', endLabel: 'b' }
  },
  {
    category: 'Khoảng',
    name: 'Khoảng (a; +∞)',
    symbol: '(a; +∞)',
    mathDef: '(a; +∞) = {x ∈ ℝ | x > a}',
    interval: { start: -1, end: '+inf', startInclusive: false, endInclusive: false, startLabel: 'a' }
  },
  {
    category: 'Khoảng',
    name: 'Khoảng (−∞; b)',
    symbol: '(−∞; b)',
    mathDef: '(−∞; b) = {x ∈ ℝ | x < b}',
    interval: { start: '-inf', end: 2, startInclusive: false, endInclusive: false, endLabel: 'b' }
  },
  {
    category: 'Khoảng',
    name: 'Khoảng (−∞; +∞)',
    symbol: '(−∞; +∞)',
    mathDef: '(−∞; +∞) = ℝ',
    interval: { start: '-inf', end: '+inf', startInclusive: false, endInclusive: false }
  },
  // Đoạn
  {
    category: 'Đoạn',
    name: 'Đoạn [a; b]',
    symbol: '[a; b]',
    mathDef: '[a; b] = {x ∈ ℝ | a ≤ x ≤ b}',
    interval: { start: -2, end: 3, startInclusive: true, endInclusive: true, startLabel: 'a', endLabel: 'b' }
  },
  // Nửa khoảng
  {
    category: 'Nửa khoảng',
    name: 'Nửa khoảng [a; b)',
    symbol: '[a; b)',
    mathDef: '[a; b) = {x ∈ ℝ | a ≤ x < b}',
    interval: { start: -2, end: 3, startInclusive: true, endInclusive: false, startLabel: 'a', endLabel: 'b' }
  },
  {
    category: 'Nửa khoảng',
    name: 'Nửa khoảng (a; b]',
    symbol: '(a; b]',
    mathDef: '(a; b] = {x ∈ ℝ | a < x ≤ b}',
    interval: { start: -2, end: 3, startInclusive: false, endInclusive: true, startLabel: 'a', endLabel: 'b' }
  },
  {
    category: 'Nửa khoảng',
    name: 'Nửa khoảng [a; +∞)',
    symbol: '[a; +∞)',
    mathDef: '[a; +∞) = {x ∈ ℝ | x ≥ a}',
    interval: { start: -1, end: '+inf', startInclusive: true, endInclusive: false, startLabel: 'a' }
  },
  {
    category: 'Nửa khoảng',
    name: 'Nửa khoảng (−∞; b]',
    symbol: '(−∞; b]',
    mathDef: '(−∞; b] = {x ∈ ℝ | x ≤ b}',
    interval: { start: '-inf', end: 2, startInclusive: false, endInclusive: true, endLabel: 'b' }
  }
];

/**
 * Render BẢNG TỔNG HỢP CÁC TẬP CON THƯỜNG DÙNG CỦA TẬP SỐ THỰC R (Giống y hệt Hình 3)
 * Độ phân giải 300 DPI, có định nghĩa toán học và hình vẽ trục số bên cạnh!
 */
export function renderSummaryTableToCanvas(
  canvas: HTMLCanvasElement,
  dpiScale = 2.4,
  options?: { width?: number; fontFamily?: string; fontSizeScale?: number; isBold?: boolean }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontFam = options?.fontFamily ?? '"Times New Roman", "STIX Two Text", "Cambria Math", serif';
  const fontScale = options?.fontSizeScale ?? 1.0;
  const isBold = options?.isBold !== false;

  const width = options?.width ?? 660;
  const rowHeight = 44;
  const headerHeight = 42;
  const catHeaderHeight = 30;

  // Tính tổng chiều cao
  const totalHeight = headerHeight + 3 * catHeaderHeight + SUBSET_DEFINITIONS.length * rowHeight + 20;

  canvas.width = Math.round(width * dpiScale);
  canvas.height = Math.round(totalHeight * dpiScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${totalHeight}px`;

  ctx.save();
  ctx.scale(dpiScale, dpiScale);

  // Nền trắng
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, totalHeight);

  // Tiêu đề bảng: "Một số tập con thường dùng của tập số thực ℝ:"
  ctx.font = `${isBold ? 'bold ' : 'normal '}${Math.round(20 * fontScale)}px ${fontFam}`;
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Một số tập con thường dùng của tập số thực ℝ:', 24, 14);

  let curY = headerHeight + 10;
  let lastCat = '';

  for (const item of SUBSET_DEFINITIONS) {
    // Nếu là nhóm mới (Khoảng, Đoạn, Nửa khoảng)
    if (item.category !== lastCat) {
      lastCat = item.category;
      ctx.font = `italic bold ${Math.round(18 * fontScale)}px ${fontFam}`;
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`• ${item.category}`, 24, curY + 12);
      curY += catHeaderHeight;
    }

    // Viết công thức toán học bên trái: e.g. "(a; b) = {x ∈ ℝ | a < x < b}"
    ctx.font = `${Math.round(17 * fontScale)}px ${fontFam}`;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.mathDef, 36, curY + rowHeight / 2);

    // Vẽ hình trục số tương ứng bên phải (từ x = 320 đến x = width - 20)
    const lineStartX = Math.round(width * 0.52);
    const lineEndX = width - 24;
    drawSingleNumberLine(ctx, item.interval, lineStartX, lineEndX, curY + rowHeight / 2 - 2, {
      fontFamily: fontFam,
      fontSizeScale: fontScale * 0.95,
      isBold,
      showOrigin: true
    });

    curY += rowHeight;
  }

  ctx.restore();
}

/**
 * Render phép toán tập hợp: Trục 1 (A), Trục 2 (B), Trục 3 (Kết quả A ∩ B hoặc A ∪ B hoặc A \ B)
 */
export function renderSetOperationsToCanvas(
  setA: IntervalItem,
  setB: IntervalItem,
  opType: 'intersection' | 'union' | 'difference',
  canvas: HTMLCanvasElement,
  dpiScale = 2.4,
  options?: { width?: number; fontFamily?: string; fontSizeScale?: number; isBold?: boolean }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = options?.width ?? 580;
  const height = 260;

  canvas.width = Math.round(width * dpiScale);
  canvas.height = Math.round(height * dpiScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(dpiScale, dpiScale);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const fontFam = options?.fontFamily ?? '"Times New Roman", "STIX Two Text", "Cambria Math", serif';
  const fontScale = options?.fontSizeScale ?? 1.0;
  const isBold = options?.isBold !== false;

  // Tính phạm vi min/max chung cho cả 3 trục
  const vals: number[] = [];
  if (typeof setA.start === 'number') vals.push(setA.start);
  if (typeof setA.end === 'number') vals.push(setA.end);
  if (typeof setB.start === 'number') vals.push(setB.start);
  if (typeof setB.end === 'number') vals.push(setB.end);

  const minV = Math.min(...vals, -3) - 1.5;
  const maxV = Math.max(...vals, 4) + 1.5;

  const opLabel = opType === 'intersection' ? 'Giao A ∩ B' : opType === 'union' ? 'Hợp A ∪ B' : 'Hiệu A \\ B';

  // 1. Trục A
  ctx.font = `${isBold ? 'bold ' : 'normal '}${Math.round(17 * fontScale)}px ${fontFam}`;
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Tập A:', 18, 40);
  drawSingleNumberLine(ctx, setA, 90, width - 20, 40, { valMin: minV, valMax: maxV, fontFamily: fontFam, isBold });

  // 2. Trục B
  ctx.fillText('Tập B:', 18, 115);
  drawSingleNumberLine(ctx, setB, 90, width - 20, 115, { valMin: minV, valMax: maxV, fontFamily: fontFam, isBold });

  // Đường phân cách mờ
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(18, 160);
  ctx.lineTo(width - 18, 160);
  ctx.stroke();

  // 3. Trục Kết quả
  ctx.fillStyle = '#DC2626';
  ctx.fillText(`${opLabel}:`, 18, 205);

  // Tính kết quả tập hợp
  let resInterval: IntervalItem = {
    start: -1,
    end: 2,
    startInclusive: false,
    endInclusive: false
  };

  const aStart = typeof setA.start === 'number' ? setA.start : -Infinity;
  const aEnd = typeof setA.end === 'number' ? setA.end : Infinity;
  const bStart = typeof setB.start === 'number' ? setB.start : -Infinity;
  const bEnd = typeof setB.end === 'number' ? setB.end : Infinity;

  if (opType === 'intersection') {
    const interStart = Math.max(aStart, bStart);
    const interEnd = Math.min(aEnd, bEnd);
    const startInc = interStart === aStart ? setA.startInclusive : setB.startInclusive;
    const endInc = interEnd === aEnd ? setA.endInclusive : setB.endInclusive;

    resInterval = {
      start: isFinite(interStart) ? interStart : '-inf',
      end: isFinite(interEnd) ? interEnd : '+inf',
      startInclusive: startInc,
      endInclusive: endInc,
      startLabel: isFinite(interStart) ? interStart.toString() : '-∞',
      endLabel: isFinite(interEnd) ? interEnd.toString() : '+∞'
    };
  } else if (opType === 'union') {
    const uniStart = Math.min(aStart, bStart);
    const uniEnd = Math.max(aEnd, bEnd);
    const startInc = uniStart === aStart ? setA.startInclusive : setB.startInclusive;
    const endInc = uniEnd === aEnd ? setA.endInclusive : setB.endInclusive;

    resInterval = {
      start: isFinite(uniStart) ? uniStart : '-inf',
      end: isFinite(uniEnd) ? uniEnd : '+inf',
      startInclusive: startInc,
      endInclusive: endInc,
      startLabel: isFinite(uniStart) ? uniStart.toString() : '-∞',
      endLabel: isFinite(uniEnd) ? uniEnd.toString() : '+∞'
    };
  } else {
    // Difference A \ B
    resInterval = {
      start: setA.start,
      end: isFinite(bStart) ? bStart : setA.end,
      startInclusive: setA.startInclusive,
      endInclusive: !setB.startInclusive,
      startLabel: typeof setA.start === 'number' ? setA.start.toString() : '-∞',
      endLabel: isFinite(bStart) ? bStart.toString() : ''
    };
  }

  drawSingleNumberLine(ctx, resInterval, 90, width - 20, 205, {
    valMin: minV,
    valMax: maxV,
    fontFamily: fontFam,
    isBold,
    bracketColor: '#DC2626',
    labelColor: '#DC2626'
  });

  ctx.restore();
}
