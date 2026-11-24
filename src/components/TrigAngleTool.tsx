/**
 * @license
 * TrigAngleTool.tsx
 * Phân hệ Góc lượng giác & Đường tròn lượng giác SGK Toán 11 (Chương trình GDPT 2018)
 * - Vẽ góc lượng giác tổng quát tia (Ou, Ov) hoặc đường tròn lượng giác Oxy
 * - Hỗ trợ góc âm, góc dương, góc nhiều vòng xoắn ốc Archimedes có mũi tên định hướng chuẩn SGK Toán 11
 * - Tùy chỉnh kích thước chữ, phông chữ (Times New Roman / LaTeX Math), in đậm
 * - Tương tác di chuyển, kéo dời vị trí các chữ (O, u, v, M, số đo góc,...) tùy ý
 * - Xuất ảnh 300 DPI chuẩn Word và PNG/SVG.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Copy, 
  Download, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check, 
  Sliders,
  Compass,
  ArrowRight,
  Move,
  Type,
  Bold,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { addDpiToBlob, cropCanvasToContent } from '../utils/dpiUtils';
import { MathFontChoice, MATH_FONT_FAMILIES } from './MathFontSelector';

export interface TrigAngleToolProps {
  onCopyWord?: () => void;
  onDownloadPng?: () => void;
  fontFamily?: string;
}

// Bảng các góc đặc biệt SGK 11
const SPECIAL_ANGLES: { deg: number; rad: string; sinStr: string; cosStr: string; tanStr: string; cotStr: string }[] = [
  { deg: 0, rad: '0', sinStr: '0', cosStr: '1', tanStr: '0', cotStr: 'không xác định' },
  { deg: 30, rad: 'π/6', sinStr: '1/2', cosStr: '√3/2', tanStr: '√3/3', cotStr: '√3' },
  { deg: 45, rad: 'π/4', sinStr: '√2/2', cosStr: '√2/2', tanStr: '1', cotStr: '1' },
  { deg: 60, rad: 'π/3', sinStr: '√3/2', cosStr: '1/2', tanStr: '√3', cotStr: '√3/3' },
  { deg: 90, rad: 'π/2', sinStr: '1', cosStr: '0', tanStr: 'không xác định', cotStr: '0' },
  { deg: 120, rad: '2π/3', sinStr: '√3/2', cosStr: '-1/2', tanStr: '-√3', cotStr: '-√3/3' },
  { deg: 135, rad: '3π/4', sinStr: '√2/2', cosStr: '-√2/2', tanStr: '-1', cotStr: '-1' },
  { deg: 150, rad: '5π/6', sinStr: '1/2', cosStr: '-√3/2', tanStr: '-√3/3', cotStr: '-√3' },
  { deg: 180, rad: 'π', sinStr: '0', cosStr: '-1', tanStr: '0', cotStr: 'không xác định' },
  { deg: 210, rad: '7π/6', sinStr: '-1/2', cosStr: '-√3/2', tanStr: '√3/3', cotStr: '√3' },
  { deg: 225, rad: '5π/4', sinStr: '-√2/2', cosStr: '-√2/2', tanStr: '1', cotStr: '1' },
  { deg: 240, rad: '4π/3', sinStr: '-√3/2', cosStr: '-1/2', tanStr: '√3', cotStr: '√3/3' },
  { deg: 270, rad: '3π/2', sinStr: '-1', cosStr: '0', tanStr: 'không xác định', cotStr: '0' },
  { deg: 300, rad: '5π/3', sinStr: '-√3/2', cosStr: '1/2', tanStr: '-√3', cotStr: '-√3/3' },
  { deg: 315, rad: '7π/4', sinStr: '-√2/2', cosStr: '√2/2', tanStr: '-1', cotStr: '-1' },
  { deg: 330, rad: '11π/6', sinStr: '-1/2', cosStr: '√3/2', tanStr: '-√3/3', cotStr: '-√3' },
  { deg: 360, rad: '2π', sinStr: '0', cosStr: '1', tanStr: '0', cotStr: 'không xác định' },
];

function formatRadian(deg: number): string {
  const sign = deg < 0 ? '-' : '';
  const absDeg = Math.abs(deg);
  if (absDeg === 0) return '0';
  
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = gcd(absDeg, 180);
  const num = absDeg / common;
  const den = 180 / common;

  if (den === 1) {
    return num === 1 ? `${sign}π` : `${sign}${num}π`;
  }
  const numPart = num === 1 ? 'π' : `${num}π`;
  return `${sign}${numPart}/${den}`;
}

interface TextBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function TrigAngleTool({
  onCopyWord,
  onDownloadPng,
  fontFamily = 'Times New Roman'
}: TrigAngleToolProps) {
  // Trạng thái góc lượng giác
  const [angleDeg, setAngleDeg] = useState<number>(750);
  const [angleMode, setAngleMode] = useState<'general_ray' | 'unit_circle'>('general_ray');
  
  // Tùy chọn hiển thị
  const [showProjections, setShowProjections] = useState<boolean>(true); // Hình chiếu sin, cos
  const [showTanAxis, setShowTanAxis] = useState<boolean>(false);        // Trục tang t'At
  const [showCotAxis, setShowCotAxis] = useState<boolean>(false);        // Trục cotang s'Bs
  const [showGrid, setShowGrid] = useState<boolean>(true);               // Lưới tọa độ
  const [showAngleLabel, setShowAngleLabel] = useState<boolean>(true);   // Nhãn số đo góc
  const [showPointCoord, setShowPointCoord] = useState<boolean>(true);   // Tọa độ M(cos, sin)
  const [strokeWeight, setStrokeWeight] = useState<number>(1.8);         // Độ dày nét

  // Tùy chọn phông chữ và kích thước chữ (như các phần khác)
  const [mathFont, setMathFont] = useState<MathFontChoice>('times');
  const [fontScale, setFontScale] = useState<number>(1.0);               // Tỉ lệ cỡ chữ: 0.8 - 1.6
  const [isBold, setIsBold] = useState<boolean>(true);                   // Chữ in đậm

  // Tương tác dời vị trí chữ (drag text)
  const [textOffsets, setTextOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialOffsetX: number; initialOffsetY: number } | null>(null);
  const textBoundsRef = useRef<Record<string, TextBounds>>({});

  // Trạng thái kéo chuột tương tác điểm M trên đường tròn
  const [isDraggingM, setIsDraggingM] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tính toán lượng giác
  const turnsCount = Math.floor(Math.abs(angleDeg) / 360);
  const angleRad = (angleDeg * Math.PI) / 180;
  const sinVal = Math.sin(angleRad);
  const cosVal = Math.cos(angleRad);
  const tanVal = Math.abs(cosVal) < 1e-4 ? null : Math.tan(angleRad);
  const cotVal = Math.abs(sinVal) < 1e-4 ? null : 1 / Math.tan(angleRad);

  const getQuadrant = (deg: number): string => {
    const norm = ((deg % 360) + 360) % 360;
    if (norm === 0 || norm === 90 || norm === 180 || norm === 270) return 'Giao trục';
    if (norm > 0 && norm < 90) return 'Góc phần tư I';
    if (norm > 90 && norm < 180) return 'Góc phần tư II';
    if (norm > 180 && norm < 270) return 'Góc phần tư III';
    return 'Góc phần tư IV';
  };

  // Helper hàm vẽ chữ có hỗ trợ kéo dời vị trí và lưu bounding box
  const renderDraggableText = (
    ctx: CanvasRenderingContext2D,
    id: string,
    text: string,
    defaultX: number,
    defaultY: number,
    fontSize: number,
    color: string,
    fontStyle: 'italic' | 'normal' | 'bold_italic' = 'italic',
    textAlign: CanvasTextAlign = 'left'
  ) => {
    const offset = textOffsets[id] || { x: 0, y: 0 };
    const x = defaultX + offset.x;
    const y = defaultY + offset.y;

    const scaledSize = Math.round(fontSize * fontScale);
    const fontFam = mathFont === 'latex' ? MATH_FONT_FAMILIES.latex : MATH_FONT_FAMILIES.times;
    
    let weightPrefix = isBold ? 'bold ' : '';
    if (fontStyle === 'bold_italic') {
      weightPrefix = 'bold italic ';
    } else if (fontStyle === 'italic') {
      weightPrefix = isBold ? 'bold italic ' : 'italic ';
    }
    ctx.font = `${weightPrefix}${scaledSize}px ${fontFam}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'alphabetic';

    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const height = scaledSize;
    let boxX = x;
    if (textAlign === 'center') boxX = x - width / 2;
    else if (textAlign === 'right') boxX = x - width;
    const boxY = y - height * 0.85;

    // Lưu bounds để hit-test chuột
    textBoundsRef.current[id] = {
      id,
      x: boxX - 4,
      y: boxY - 3,
      width: width + 8,
      height: height + 6
    };

    // Nếu đang hover hoặc đang kéo: vẽ viền gợi ý
    if (hoveredTextId === id || draggedTextId === id) {
      ctx.save();
      ctx.strokeStyle = '#0F6CBD';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.fillStyle = 'rgba(15, 108, 189, 0.08)';
      ctx.fillRect(boxX - 4, boxY - 3, width + 8, height + 6);
      ctx.strokeRect(boxX - 4, boxY - 3, width + 8, height + 6);
      ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  // Helper hàm vẽ mũi tên nhọn cho cung/đường xoắn ốc
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    angle: number,
    color: string,
    len = 10,
    halfWidth = 5
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    // Điểm cánh trái
    const p1X = tipX - len * Math.cos(angle) + halfWidth * Math.sin(angle);
    const p1Y = tipY - len * Math.sin(angle) - halfWidth * Math.cos(angle);
    // Điểm lõm đáy
    const pMidX = tipX - (len - 2.5) * Math.cos(angle);
    const pMidY = tipY - (len - 2.5) * Math.sin(angle);
    // Điểm cánh phải
    const p2X = tipX - len * Math.cos(angle) - halfWidth * Math.sin(angle);
    const p2Y = tipY - len * Math.sin(angle) + halfWidth * Math.cos(angle);

    ctx.lineTo(p1X, p1Y);
    ctx.lineTo(pMidX, pMidY);
    ctx.lineTo(p2X, p2Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Vẽ hình trên HTML5 Canvas
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset hit-test map
    textBoundsRef.current = {};

    const width = 840;
    const height = 580;
    const dpr = 2.4; // 300 DPI clarity
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Xóa nền trắng tinh
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 1. Lưới tọa độ
    if (showGrid) {
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      const step = 34;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const absAngle = Math.abs(angleDeg);
    const isPositive = angleDeg >= 0;

    // =========================================================================
    // CHẾ ĐỘ 1: GÓC LƯỢNG GIÁC TỔNG QUÁT TIA (Ou, Ov) - SGK TOÁN 11
    // =========================================================================
    if (angleMode === 'general_ray') {
      const centerOX = width / 2 - 40;
      const centerOY = height / 2 + 25;
      const rayLen = 230;

      // 1.1 Tia ban đầu Ou (nằm ngang sang phải)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = strokeWeight + 0.6;
      ctx.beginPath();
      ctx.moveTo(centerOX, centerOY);
      ctx.lineTo(centerOX + rayLen, centerOY);
      ctx.stroke();

      // Mũi tên tia Ou
      drawArrowHead(ctx, centerOX + rayLen, centerOY, 0, '#2563EB', 11, 5.5);

      // 1.2 Tia cuối Ov (quay một góc angleDeg, canvas Y ngược)
      const ovX = centerOX + rayLen * cosVal;
      const ovY = centerOY - rayLen * sinVal;
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = strokeWeight + 0.6;
      ctx.beginPath();
      ctx.moveTo(centerOX, centerOY);
      ctx.lineTo(ovX, ovY);
      ctx.stroke();

      // Mũi tên tia Ov
      const rayOvAngle = -angleRad;
      drawArrowHead(ctx, ovX, ovY, rayOvAngle, '#DC2626', 11, 5.5);

      // 1.3 Gốc O
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(centerOX, centerOY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 1.4 ĐƯỜNG CONG GÓC CÓ MŨI TÊN (CUNG ĐƠN KHI <= 360° HOẶC ĐƯỜNG XOẮN ỐC KHI > 360°)
      const curveColor = isPositive ? '#DC2626' : '#2563EB';
      ctx.save();
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = strokeWeight + 0.2;

      if (absAngle <= 360) {
        // Cung tròn đơn
        const arcR = 52;
        if (absAngle >= 4) {
          ctx.beginPath();
          // arc(x, y, radius, startAngle, endAngle, counterclockwise)
          // Canvas góc 0 là tia ngang Ox, góc tăng theo chiều kim đồng hồ
          // Góc dương toán học quay ngược chiều kim đồng hồ => endAngle = -angleRad, CCW = true
          ctx.arc(centerOX, centerOY, arcR, 0, -angleRad, isPositive);
          ctx.stroke();

          // Mũi tên ở đầu cung
          const tipX = centerOX + arcR * Math.cos(-angleRad);
          const tipY = centerOY + arcR * Math.sin(-angleRad);
          // Tiếp tuyến của cung tròn tại góc phi = -angleRad
          // Với CCW (isPositive): tiếp tuyến hướng phi - pi/2
          // Với CW (!isPositive): tiếp tuyến hướng phi + pi/2
          const tangentAngle = isPositive ? -angleRad - Math.PI / 2 : -angleRad + Math.PI / 2;
          drawArrowHead(ctx, tipX, tipY, tangentAngle, curveColor, 9.5, 4.5);
        }
      } else {
        // ĐƯỜNG XOẮN ỐC ARCHIMEDES CHO GÓC NHIỀU VÒNG (|α| > 360°) CHUẨN SGK TOÁN 11!
        const rStart = 30;
        const turns = absAngle / 360;
        // Bán kính nở ra sau mỗi vòng
        const deltaRPerTurn = Math.min(22, Math.max(12, 140 / turns));
        const totalRad = (absAngle * Math.PI) / 180;
        const numSteps = Math.min(700, Math.max(200, Math.floor(absAngle * 2)));

        ctx.beginPath();
        for (let i = 0; i <= numSteps; i++) {
          const t = i / numSteps;
          const theta = t * totalRad;
          const curR = rStart + (theta / (2 * Math.PI)) * deltaRPerTurn;
          const curPhi = isPositive ? -theta : theta;
          const px = centerOX + curR * Math.cos(curPhi);
          const py = centerOY + curR * Math.sin(curPhi);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Mũi tên ở đầu mút đường xoắn ốc
        const finalR = rStart + (totalRad / (2 * Math.PI)) * deltaRPerTurn;
        const finalPhi = isPositive ? -totalRad : totalRad;
        const tipX = centerOX + finalR * Math.cos(finalPhi);
        const tipY = centerOY + finalR * Math.sin(finalPhi);

        // Vector tiếp tuyến đường xoắn ốc r(theta) = rStart + b*theta, phi(theta) = s*theta (s = -1 hoặc 1)
        const b = deltaRPerTurn / (2 * Math.PI);
        const s = isPositive ? -1 : 1;
        const vx = b * Math.cos(finalPhi) - finalR * Math.sin(finalPhi) * s;
        const vy = b * Math.sin(finalPhi) + finalR * Math.cos(finalPhi) * s;
        const tangentAngle = Math.atan2(vy, vx);

        drawArrowHead(ctx, tipX, tipY, tangentAngle, curveColor, 10, 5);
      }
      ctx.restore();

      // 1.5 CÁC NHÃN CHỮ DI CHUYỂN ĐƯỢC
      // Gốc O
      renderDraggableText(ctx, 'text_O', 'O', centerOX - 18, centerOY + 18, 17, '#0F172A', 'italic');
      // Nhãn tia u
      renderDraggableText(ctx, 'text_u', 'u', centerOX + rayLen + 8, centerOY + 6, 17, '#2563EB', 'italic');
      // Nhãn tia v
      const vOffsetDist = 18;
      const vLabelX = ovX + vOffsetDist * cosVal;
      const vLabelY = ovY - vOffsetDist * sinVal + 5;
      renderDraggableText(ctx, 'text_v', 'v', vLabelX, vLabelY, 17, '#DC2626', 'italic');

      // Nhãn số đo góc: (Ou, Ov) = +750°
      if (showAngleLabel) {
        const signPrefix = angleDeg >= 0 ? '+' : '';
        const angleText = `(Ou, Ov) = ${signPrefix}${angleDeg}°`;
        const midRad = absAngle <= 360 ? -angleRad / 2 : (isPositive ? -0.4 : 0.4);
        const textDist = absAngle <= 360 ? 70 : 85;
        const defAngleX = centerOX + textDist * Math.cos(midRad) + 10;
        const defAngleY = centerOY + textDist * Math.sin(midRad) - 10;
        renderDraggableText(ctx, 'text_angle', angleText, defAngleX, defAngleY, 16, '#DC2626', 'bold_italic');
      }

    } else {
      // =========================================================================
      // CHẾ ĐỘ 2: ĐƯỜNG TRÒN LƯỢNG GIÁC OXY CHUẨN SGK TOÁN 11
      // =========================================================================
      const originX = width / 2 - 20;
      const originY = height / 2 + 10;
      const R = 175;

      // 2.1 Trục Ox (Trục cos)
      const xStart = 45;
      const xEnd = width - 65;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = strokeWeight;
      ctx.beginPath();
      ctx.moveTo(xStart, originY);
      ctx.lineTo(xEnd, originY);
      ctx.stroke();
      drawArrowHead(ctx, xEnd, originY, 0, '#1E293B', 10, 4.5);

      // 2.2 Trục Oy (Trục sin)
      const yStart = height - 40;
      const yEnd = 40;
      ctx.beginPath();
      ctx.moveTo(originX, yStart);
      ctx.lineTo(originX, yEnd);
      ctx.stroke();
      drawArrowHead(ctx, originX, yEnd, -Math.PI / 2, '#1E293B', 10, 4.5);

      // 2.3 Đường tròn lượng giác tâm O, bán kính R
      ctx.strokeStyle = '#0F6CBD';
      ctx.lineWidth = strokeWeight + 0.3;
      ctx.beginPath();
      ctx.arc(originX, originY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Điểm gốc A(1, 0)
      const ax = originX + R;
      const ay = originY;
      ctx.fillStyle = '#0F6CBD';
      ctx.beginPath();
      ctx.arc(ax, ay, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Điểm A'(-1, 0)
      const aPrimex = originX - R;
      ctx.beginPath();
      ctx.arc(aPrimex, ay, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Điểm B(0, 1)
      const by = originY - R;
      ctx.beginPath();
      ctx.arc(originX, by, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Điểm B'(0, -1)
      const bPrimey = originY + R;
      ctx.beginPath();
      ctx.arc(originX, bPrimey, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // 2.4 Trục Tang t'At
      if (showTanAxis) {
        ctx.save();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, 35);
        ctx.lineTo(ax, height - 35);
        ctx.stroke();
        ctx.restore();

        renderDraggableText(ctx, 'text_tan', 'Trục tang (t\'At)', ax + 8, 48, 13, '#D97706', 'normal');

        // Giao điểm T
        if (Math.abs(cosVal) > 1e-4) {
          const tVal = Math.tan(angleRad);
          const ty = originY - tVal * R;
          if (ty >= 30 && ty <= height - 30) {
            ctx.fillStyle = '#D97706';
            ctx.beginPath();
            ctx.arc(ax, ty, 4, 0, Math.PI * 2);
            ctx.fill();
            renderDraggableText(ctx, 'text_T', 'T', ax + 8, ty + 4, 15, '#D97706', 'italic');
          }
        }
      }

      // 2.5 Trục Cotang s'Bs
      if (showCotAxis) {
        ctx.save();
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, by);
        ctx.lineTo(width - 50, by);
        ctx.stroke();
        ctx.restore();

        renderDraggableText(ctx, 'text_cot', 'Trục cotang (s\'Bs)', width - 145, by - 8, 13, '#7C3AED', 'normal');

        // Giao điểm S
        if (Math.abs(sinVal) > 1e-4) {
          const cVal = 1 / Math.tan(angleRad);
          const sx = originX + cVal * R;
          if (sx >= 30 && sx <= width - 30) {
            ctx.fillStyle = '#7C3AED';
            ctx.beginPath();
            ctx.arc(sx, by, 4, 0, Math.PI * 2);
            ctx.fill();
            renderDraggableText(ctx, 'text_S', 'S', sx - 4, by - 8, 15, '#7C3AED', 'italic');
          }
        }
      }

      // 2.6 Điểm M biểu diễn góc trên đường tròn
      const mx = originX + R * cosVal;
      const my = originY - R * sinVal;

      // Tia OA (tia đầu)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = strokeWeight + 0.6;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // Tia OM (tia cuối, kéo dài qua M một chút)
      const extX = originX + (R + 26) * cosVal;
      const extY = originY - (R + 26) * sinVal;
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = strokeWeight + 0.4;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(extX, extY);
      ctx.stroke();

      // Điểm M màu đỏ nổi bật
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();

      // Vòng tròn tương tác nhẹ quanh M
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.stroke();

      // 2.7 CUNG / ĐƯỜNG XOẮN ỐC CÓ MŨI TÊN
      const curveColor = isPositive ? '#DC2626' : '#2563EB';
      ctx.save();
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = strokeWeight + 0.2;

      if (absAngle <= 360) {
        const arcR = 40;
        if (absAngle >= 4) {
          ctx.beginPath();
          ctx.arc(originX, originY, arcR, 0, -angleRad, isPositive);
          ctx.stroke();

          const tipX = originX + arcR * Math.cos(-angleRad);
          const tipY = originY + arcR * Math.sin(-angleRad);
          const tangentAngle = isPositive ? -angleRad - Math.PI / 2 : -angleRad + Math.PI / 2;
          drawArrowHead(ctx, tipX, tipY, tangentAngle, curveColor, 9, 4.5);
        }
      } else {
        // Đường xoắn ốc Archimedes
        const rStart = 26;
        const turns = absAngle / 360;
        const deltaRPerTurn = Math.min(18, Math.max(10, 115 / turns));
        const totalRad = (absAngle * Math.PI) / 180;
        const numSteps = Math.min(700, Math.max(200, Math.floor(absAngle * 2)));

        ctx.beginPath();
        for (let i = 0; i <= numSteps; i++) {
          const t = i / numSteps;
          const theta = t * totalRad;
          const curR = rStart + (theta / (2 * Math.PI)) * deltaRPerTurn;
          const curPhi = isPositive ? -theta : theta;
          const px = originX + curR * Math.cos(curPhi);
          const py = originY + curR * Math.sin(curPhi);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        const finalR = rStart + (totalRad / (2 * Math.PI)) * deltaRPerTurn;
        const finalPhi = isPositive ? -totalRad : totalRad;
        const tipX = originX + finalR * Math.cos(finalPhi);
        const tipY = originY + finalR * Math.sin(finalPhi);

        const b = deltaRPerTurn / (2 * Math.PI);
        const s = isPositive ? -1 : 1;
        const vx = b * Math.cos(finalPhi) - finalR * Math.sin(finalPhi) * s;
        const vy = b * Math.sin(finalPhi) + finalR * Math.cos(finalPhi) * s;
        const tangentAngle = Math.atan2(vy, vx);

        drawArrowHead(ctx, tipX, tipY, tangentAngle, curveColor, 9.5, 4.5);
      }
      ctx.restore();

      // 2.8 Hình chiếu sin, cos nét đứt
      if (showProjections) {
        ctx.save();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 3]);

        // Chiếu xuống Ox
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, originY);
        ctx.stroke();

        // Chiếu xuống Oy
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(originX, my);
        ctx.stroke();

        // Điểm hình chiếu trên trục
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(mx, originY, 3, 0, Math.PI * 2);
        ctx.arc(originX, my, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2.9 CÁC NHÃN CHỮ DI CHUYỂN ĐƯỢC TRÊN ĐƯỜNG TRÒN
      renderDraggableText(ctx, 'text_O', 'O', originX - 16, originY + 16, 16, '#1E293B', 'italic');
      renderDraggableText(ctx, 'text_x', 'x', xEnd + 6, originY + 5, 16, '#1E293B', 'italic');
      renderDraggableText(ctx, 'text_y', 'y', originX - 6, yEnd - 8, 16, '#1E293B', 'italic');
      renderDraggableText(ctx, 'text_cos_axis', '(trục cos)', xEnd - 65, originY + 20, 12, '#64748B', 'normal');
      renderDraggableText(ctx, 'text_sin_axis', '(trục sin)', originX + 10, yEnd + 16, 12, '#64748B', 'normal');

      // Điểm A, A', B, B'
      renderDraggableText(ctx, 'text_A', 'A', ax + 8, ay - 8, 15, '#0F6CBD', 'italic');
      renderDraggableText(ctx, 'text_1_x', '1', ax - 4, ay + 17, 13, '#0F6CBD', 'normal');
      renderDraggableText(ctx, 'text_A_prime', 'A\'', aPrimex - 22, ay - 8, 15, '#0F6CBD', 'italic');
      renderDraggableText(ctx, 'text_neg1_x', '-1', aPrimex - 4, ay + 17, 13, '#0F6CBD', 'normal');

      renderDraggableText(ctx, 'text_B', 'B', originX + 8, by - 6, 15, '#0F6CBD', 'italic');
      renderDraggableText(ctx, 'text_1_y', '1', originX - 16, by + 12, 13, '#0F6CBD', 'normal');
      renderDraggableText(ctx, 'text_B_prime', 'B\'', originX + 8, bPrimey + 14, 15, '#0F6CBD', 'italic');
      renderDraggableText(ctx, 'text_neg1_y', '-1', originX - 18, bPrimey - 4, 13, '#0F6CBD', 'normal');

      // Điểm M và tọa độ
      const mOffX = cosVal >= 0 ? 12 : -18;
      const mOffY = sinVal >= 0 ? -12 : 18;
      renderDraggableText(ctx, 'text_M', 'M', mx + mOffX, my + mOffY, 16, '#DC2626', 'bold_italic');

      if (showPointCoord) {
        const coordStr = `(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`;
        renderDraggableText(ctx, 'text_coord', coordStr, mx + mOffX + 18, my + mOffY, 12, '#334155', 'normal');
      }

      // Nhãn số đo góc trên cung
      if (showAngleLabel) {
        const signPrefix = angleDeg >= 0 ? '+' : '';
        const angleStr = `${signPrefix}${angleDeg}° (${formatRadian(angleDeg)})`;
        const midRad = absAngle <= 360 ? -angleRad / 2 : (isPositive ? -0.4 : 0.4);
        const labelDist = absAngle <= 360 ? 58 : 72;
        const lx = originX + labelDist * Math.cos(midRad);
        const ly = originY + labelDist * Math.sin(midRad);
        renderDraggableText(ctx, 'text_angle', angleStr, lx, ly, 15, curveColor, 'bold_italic');
      }
    }

    ctx.restore();
  }, [
    angleDeg, 
    angleMode, 
    showProjections, 
    showTanAxis, 
    showCotAxis, 
    showGrid, 
    showAngleLabel, 
    showPointCoord, 
    strokeWeight, 
    mathFont,
    fontScale,
    isBold,
    textOffsets,
    hoveredTextId,
    draggedTextId,
    sinVal,
    cosVal,
    angleRad
  ]);

  useEffect(() => {
    drawScene();
  }, [drawScene]);

  // Lắng nghe sự kiện từ Ribbon Bar
  useEffect(() => {
    const handleAction = (e: any) => {
      const action = e.detail;
      if (!action) return;
      if (action.type === 'trig_set_angle') {
        setAngleDeg(action.angle);
      } else if (action.type === 'trig_set_mode') {
        setAngleMode(action.mode);
      } else if (action.type === 'trig_step_angle') {
        setAngleDeg(prev => prev + action.delta);
      } else if (action.type === 'trig_toggle_projections') {
        setShowProjections(prev => !prev);
      } else if (action.type === 'trig_toggle_tan') {
        setShowTanAxis(prev => !prev);
      } else if (action.type === 'trig_toggle_cot') {
        setShowCotAxis(prev => !prev);
      } else if (action.type === 'trig_toggle_grid') {
        setShowGrid(prev => !prev);
      } else if (action.type === 'trig_reset_text') {
        setTextOffsets({});
      } else if (action.type === 'trig_set_font') {
        setMathFont(action.font);
      } else if (action.type === 'trig_set_font_scale') {
        setFontScale(action.scale);
      } else if (action.type === 'copy_word') {
        handleCopyWordAction();
      } else if (action.type === 'download_png') {
        handleDownloadPngAction();
      }
    };
    window.addEventListener('lvp_ribbon_action', handleAction);
    return () => window.removeEventListener('lvp_ribbon_action', handleAction);
  }, []);

  // Xử lý chuột: Kéo điểm M hoặc Di chuyển nhãn chữ (Draggable Text)
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 840 / rect.width;
    const scaleY = 580 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);

    // 1. Kiểm tra bấm trúng nhãn chữ để di chuyển
    for (const id in textBoundsRef.current) {
      const b = textBoundsRef.current[id];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        setDraggedTextId(id);
        const curOffset = textOffsets[id] || { x: 0, y: 0 };
        dragStartRef.current = {
          mouseX: x,
          mouseY: y,
          initialOffsetX: curOffset.x,
          initialOffsetY: curOffset.y
        };
        return;
      }
    }

    // 2. Nếu ở chế độ đường tròn: kiểm tra bấm trúng điểm M để xoay góc
    if (angleMode === 'unit_circle') {
      const originX = 840 / 2 - 20;
      const originY = 580 / 2 + 10;
      const R = 175;
      const mx = originX + R * cosVal;
      const my = originY - R * sinVal;

      if (Math.hypot(x - mx, y - my) <= 20) {
        setIsDraggingM(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);

    // 1. Đang kéo dời chữ
    if (draggedTextId && dragStartRef.current) {
      const dx = x - dragStartRef.current.mouseX;
      const dy = y - dragStartRef.current.mouseY;
      setTextOffsets(prev => ({
        ...prev,
        [draggedTextId]: {
          x: dragStartRef.current!.initialOffsetX + dx,
          y: dragStartRef.current!.initialOffsetY + dy
        }
      }));
      return;
    }

    // 2. Đang kéo xoay điểm M
    if (isDraggingM && angleMode === 'unit_circle') {
      const originX = 840 / 2 - 20;
      const originY = 580 / 2 + 10;
      let rawRad = Math.atan2(-(y - originY), x - originX);
      let rawDeg = Math.round((rawRad * 180) / Math.PI);
      if (rawDeg < 0) rawDeg += 360;

      // Bắt dính vào góc đặc biệt nếu lệch dưới 4 độ
      for (const sa of SPECIAL_ANGLES) {
        if (Math.abs(rawDeg - sa.deg) <= 4) {
          rawDeg = sa.deg;
          break;
        }
      }

      const sign = angleDeg < 0 ? -1 : 1;
      const k = Math.floor(Math.abs(angleDeg) / 360);
      const newAngle = sign * (k * 360 + rawDeg);
      setAngleDeg(newAngle);
      return;
    }

    // 3. Hover hit-test chữ
    let foundId: string | null = null;
    for (const id in textBoundsRef.current) {
      const b = textBoundsRef.current[id];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        foundId = id;
        break;
      }
    }
    setHoveredTextId(foundId);
  };

  const handleMouseUp = () => {
    if (draggedTextId) {
      setDraggedTextId(null);
      dragStartRef.current = null;
    }
    if (isDraggingM) {
      setIsDraggingM(false);
    }
  };

  // Xác định con trỏ chuột
  const getCursor = () => {
    if (draggedTextId || isDraggingM) return 'grabbing';
    if (hoveredTextId) return 'pointer';
    return 'default';
  };

  // Sao chép ảnh 300 DPI vào Word
  const handleCopyWordAction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const croppedCanvas = cropCanvasToContent(canvas, 16);
      croppedCanvas.toBlob(async blob => {
        if (!blob) return;
        const blobWithDpi = await addDpiToBlob(blob, 300);
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blobWithDpi })
          ]);
          setCopyStatus('success');
          setTimeout(() => setCopyStatus(null), 3000);
        } catch {
          const url = URL.createObjectURL(blobWithDpi);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Goc_luong_giac_${angleDeg}deg_300DPI.png`;
          a.click();
          URL.revokeObjectURL(url);
          setCopyStatus('fallback');
          setTimeout(() => setCopyStatus(null), 3000);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Lỗi sao chép ảnh góc lượng giác:', err);
    }
  };

  // Tải ảnh PNG 300 DPI
  const handleDownloadPngAction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropped = cropCanvasToContent(canvas, 16);
    cropped.toBlob(async blob => {
      if (!blob) return;
      const blobWithDpi = await addDpiToBlob(blob, 300);
      const url = URL.createObjectURL(blobWithDpi);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Goc_luong_giac_${angleDeg}deg.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-4 items-start">
      {/* VÙNG CHÍNH: KHUNG VẼ CANVAS & THÔNG BÁO */}
      <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-4 flex flex-col items-center shadow-xs">
        {/* Banner trạng thái & Các nút chức năng */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Compass size={16} className="text-[#0F6CBD]" />
            <span className="font-bold">Góc lượng giác:</span>
            <span className="font-mono text-sm font-extrabold text-[#0F6CBD]">
              α = {angleDeg >= 0 ? '+' : ''}{angleDeg}° ({formatRadian(angleDeg)})
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {getQuadrant(angleDeg)}
            </span>
            {turnsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                Xoắn ốc {turnsCount} vòng ({angleDeg >= 0 ? '+' : '-'}{turnsCount * 360}°)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Nút đặt lại vị trí các chữ */}
            <button
              type="button"
              onClick={() => setTextOffsets({})}
              className="h-[28px] px-2.5 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[3px] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Đặt lại vị trí ban đầu của tất cả các nhãn chữ"
            >
              <RotateCcw size={12} />
              <span>Đặt lại chữ</span>
            </button>

            {/* Nút Copy vào Word */}
            <button
              type="button"
              onClick={handleCopyWordAction}
              className="h-[28px] px-3 bg-[#0F6CBD] hover:bg-[#115EA3] active:bg-[#0C5494] text-white rounded-[3px] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Sao chép ảnh độ phân giải cao 300 DPI vào clipboard để dán trực tiếp vào Microsoft Word"
            >
              {copyStatus === 'success' ? <Check size={14} /> : <Copy size={13} />}
              <span>{copyStatus === 'success' ? 'Đã sao chép 300 DPI!' : 'Sao chép vào Word'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPngAction}
              className="h-[28px] px-2.5 border border-[#E1DFDD] dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[3px] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
              title="Tải ảnh PNG chuẩn 300 DPI"
            >
              <Download size={13} />
              <span>Tải PNG</span>
            </button>
          </div>
        </div>

        {/* Khung Canvas vẽ tương tác */}
        <div 
          className="relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-inner select-none"
          style={{ cursor: getCursor() }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block max-w-full"
          />
          {/* Badge hướng dẫn di chuyển chữ */}
          <div className="absolute bottom-2 left-3 text-[11px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded shadow-xs border border-slate-200 dark:border-slate-700 pointer-events-none flex items-center gap-1.5">
            <Move size={12} className="text-[#0F6CBD]" />
            <span><strong>Di chuyển chữ:</strong> Bấm giữ chuột vào bất kỳ chữ nào (<i>O, u, v, M, số đo góc...</i>) để kéo dời tự do.</span>
          </div>
        </div>

        {/* Bảng giá trị lượng giác 4 góc */}
        <div className="w-full mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">sin α (Tung độ)</span>
            <span className="text-base font-bold font-mono text-[#059669]">
              {sinVal.toFixed(3)}
            </span>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">cos α (Hoành độ)</span>
            <span className="text-base font-bold font-mono text-[#0F6CBD]">
              {cosVal.toFixed(3)}
            </span>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">tan α = sin/cos</span>
            <span className="text-base font-bold font-mono text-[#D97706]">
              {tanVal !== null ? tanVal.toFixed(3) : 'Không xác định'}
            </span>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">cot α = cos/sin</span>
            <span className="text-base font-bold font-mono text-[#7C3AED]">
              {cotVal !== null ? cotVal.toFixed(3) : 'Không xác định'}
            </span>
          </div>
        </div>
      </div>

      {/* CỘT ĐIỀU KHIỂN & KHO MẪU SGK TOÁN 11 */}
      <div className="w-full xl:w-96 flex flex-col gap-3.5">
        {/* Khối 1: Chế độ hình vẽ & Nhập số đo góc */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Chế độ hình vẽ SGK 11</span>
            <span className="text-[10px] text-[#0F6CBD] font-semibold">Toán 11 GDPT 2018</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded">
            <button
              type="button"
              onClick={() => setAngleMode('general_ray')}
              className={`py-1.5 px-2 text-xs font-bold rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                angleMode === 'general_ray'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6CBD] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowRight size={13} className="text-rose-600" />
              <span>Góc tia (Ou, Ov)</span>
            </button>
            <button
              type="button"
              onClick={() => setAngleMode('unit_circle')}
              className={`py-1.5 px-2 text-xs font-bold rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                angleMode === 'unit_circle'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6CBD] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass size={13} className="text-[#0F6CBD]" />
              <span>Đường tròn Oxy</span>
            </button>
          </div>

          {/* Nhập góc tùy ý */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
              Nhập số đo góc (Độ hoặc Radian)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={angleDeg}
                onChange={e => setAngleDeg(Number(e.target.value) || 0)}
                step="15"
                className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-[#0F6CBD] outline-none focus:ring-1 focus:ring-[#0F6CBD]"
              />
              <span className="text-xs font-bold text-slate-500">độ (°)</span>
            </div>
          </div>

          {/* Các nút xoay góc linh hoạt */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setAngleDeg(prev => prev + 15)}
              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded cursor-pointer"
            >
              +15°
            </button>
            <button
              type="button"
              onClick={() => setAngleDeg(prev => prev - 15)}
              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded cursor-pointer"
            >
              -15°
            </button>
            <button
              type="button"
              onClick={() => setAngleDeg(prev => prev + 360)}
              className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold rounded cursor-pointer"
              title="Thêm 1 vòng xoắn ốc (+360°)"
            >
              +1 vòng
            </button>
            <button
              type="button"
              onClick={() => setAngleDeg(prev => prev - 360)}
              className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold rounded cursor-pointer"
              title="Trừ 1 vòng xoắn ốc (-360°)"
            >
              -1 vòng
            </button>
          </div>
        </div>

        {/* Khối 2: Tùy chỉnh Phông chữ & Kích thước chữ (Theo yêu cầu) */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Type size={14} className="text-[#0F6CBD]" />
              <span>Phông chữ & Cỡ chữ</span>
            </span>
            <button
              type="button"
              onClick={() => setIsBold(prev => !prev)}
              className={`px-2 py-0.5 rounded text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                isBold 
                  ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
              }`}
              title="Bật/Tắt in đậm ký hiệu"
            >
              <Bold size={11} />
              <span>In đậm</span>
            </button>
          </div>

          {/* Chọn loại phông chữ */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Kiểu phông Toán học:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMathFont('times')}
                className={`py-1 px-2 rounded text-xs font-bold border transition cursor-pointer text-center ${
                  mathFont === 'times'
                    ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                Times New Roman SGK
              </button>
              <button
                type="button"
                onClick={() => setMathFont('latex')}
                className={`py-1 px-2 rounded text-xs font-bold border transition cursor-pointer text-center ${
                  mathFont === 'latex'
                    ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                KaTeX / LaTeX Math
              </button>
            </div>
          </div>

          {/* Điều chỉnh kích thước chữ */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Cỡ chữ hiển thị:</span>
              <span className="font-mono text-[#0F6CBD] font-bold">{Math.round(fontScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFontScale(prev => Math.max(0.75, Math.round((prev - 0.1) * 10) / 10))}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Giảm cỡ chữ"
              >
                <ZoomOut size={13} />
              </button>
              <input
                type="range"
                min="0.75"
                max="1.6"
                step="0.05"
                value={fontScale}
                onChange={e => setFontScale(parseFloat(e.target.value))}
                className="flex-1 accent-[#0F6CBD] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFontScale(prev => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10))}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Tăng cỡ chữ"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Presets cỡ chữ nhanh */}
            <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-bold">
              {[
                { label: '85%', scale: 0.85 },
                { label: 'Chuẩn', scale: 1.0 },
                { label: '120%', scale: 1.2 },
                { label: '140%', scale: 1.4 },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFontScale(p.scale)}
                  className={`py-1 rounded border transition cursor-pointer text-center ${
                    fontScale === p.scale
                      ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Khối 3: Kho mẫu góc SGK Toán 11 */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Kho mẫu góc SGK Toán 11</span>
            <span className="text-[10px] text-slate-400">1-Click</span>
          </div>

          {/* Nhóm góc xoắn ốc nhiều vòng (Bài 1 SGK) */}
          <div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
              Góc đường xoắn ốc mũi tên (Bài 1 SGK)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { deg: 420, label: '+420° (360° + 60°)' },
                { deg: 540, label: '+540° (360° + 180°)' },
                { deg: 750, label: '+750° (2×360° + 30°)' },
                { deg: -750, label: '-750° (-2×360° - 30°)' },
              ].map(item => (
                <button
                  key={item.deg}
                  type="button"
                  onClick={() => setAngleDeg(item.deg)}
                  className={`py-1.5 px-2 rounded text-[11px] font-bold border transition cursor-pointer text-center ${
                    angleDeg === item.deg
                      ? 'bg-amber-100 text-amber-900 border-amber-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nhóm góc dương thông dụng */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Góc dương thông dụng (+)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { deg: 30, rad: 'π/6' },
                { deg: 45, rad: 'π/4' },
                { deg: 60, rad: 'π/3' },
                { deg: 90, rad: 'π/2' },
                { deg: 120, rad: '2π/3' },
                { deg: 150, rad: '5π/6' },
                { deg: 180, rad: 'π' },
                { deg: 270, rad: '3π/2' },
                { deg: 360, rad: '2π' },
              ].map(item => (
                <button
                  key={item.deg}
                  type="button"
                  onClick={() => setAngleDeg(item.deg)}
                  className={`py-1 px-1.5 rounded text-[11px] font-bold border transition cursor-pointer text-center ${
                    angleDeg === item.deg
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  +{item.deg}° ({item.rad})
                </button>
              ))}
            </div>
          </div>

          {/* Nhóm góc âm thông dụng */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Góc âm thông dụng (-)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { deg: -30, rad: '-π/6' },
                { deg: -45, rad: '-π/4' },
                { deg: -60, rad: '-π/3' },
                { deg: -90, rad: '-π/2' },
                { deg: -120, rad: '-2π/3' },
                { deg: -150, rad: '-5π/6' },
              ].map(item => (
                <button
                  key={item.deg}
                  type="button"
                  onClick={() => setAngleDeg(item.deg)}
                  className={`py-1 px-1.5 rounded text-[11px] font-bold border transition cursor-pointer text-center ${
                    angleDeg === item.deg
                      ? 'bg-[#EFF6FC] text-[#0F6CBD] border-[#0F6CBD]'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.deg}° ({item.rad})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Khối 4: Tùy biến hiển thị đường nét */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-2.5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tùy biến hiển thị đường nét
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">Nhãn số đo góc trên hình</span>
              <input
                type="checkbox"
                checked={showAngleLabel}
                onChange={e => setShowAngleLabel(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">Lưới tọa độ ô vuông</span>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
              />
            </label>

            {angleMode === 'unit_circle' && (
              <>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">Hình chiếu vuông góc sin, cos</span>
                  <input
                    type="checkbox"
                    checked={showProjections}
                    onChange={e => setShowProjections(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">Trục Tang t'At song song Oy</span>
                  <input
                    type="checkbox"
                    checked={showTanAxis}
                    onChange={e => setShowTanAxis(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">Trục Cotang s'Bs song song Ox</span>
                  <input
                    type="checkbox"
                    checked={showCotAxis}
                    onChange={e => setShowCotAxis(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300">Tọa độ điểm M(cos; sin)</span>
                  <input
                    type="checkbox"
                    checked={showPointCoord}
                    onChange={e => setShowPointCoord(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
