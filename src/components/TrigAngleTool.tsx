/**
 * @license
 * TrigAngleTool.tsx
 * Phân hệ Góc lượng giác & Đường tròn lượng giác SGK Toán 11 (Chương trình GDPT 2018)
 * Hỗ trợ vẽ góc dương, góc âm, góc nhiều vòng xoắn ốc Archimedes, hình chiếu sin/cos, trục tang/cotang
 * Xuất ảnh 300 DPI chuẩn Word và PNG/SVG.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Copy, 
  Download, 
  RotateCw, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Layers, 
  Type, 
  Grid, 
  Sliders,
  Compass,
  ArrowRight
} from 'lucide-react';
import { addDpiToBlob, cropCanvasToContent } from '../utils/dpiUtils';

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
  // Rút gọn dạng phân số pi
  const sign = deg < 0 ? '-' : '';
  const absDeg = Math.abs(deg);
  if (absDeg === 0) return '0';
  
  // Tìm ước chung lớn nhất của absDeg và 180
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

export default function TrigAngleTool({
  onCopyWord,
  onDownloadPng,
  fontFamily = 'Times New Roman'
}: TrigAngleToolProps) {
  // Trạng thái góc lượng giác
  const [angleDeg, setAngleDeg] = useState<number>(60);
  const [angleMode, setAngleMode] = useState<'unit_circle' | 'general_ray'>('unit_circle');
  
  // Tùy chọn hiển thị
  const [showProjections, setShowProjections] = useState<boolean>(true); // Hình chiếu sin, cos
  const [showTanAxis, setShowTanAxis] = useState<boolean>(false);        // Trục tang t'At
  const [showCotAxis, setShowCotAxis] = useState<boolean>(false);        // Trục cotang s'Bs
  const [showGrid, setShowGrid] = useState<boolean>(true);               // Lưới tọa độ
  const [showAngleLabel, setShowAngleLabel] = useState<boolean>(true);   // Nhãn số đo góc
  const [showPointCoord, setShowPointCoord] = useState<boolean>(true);   // Tọa độ M(cos, sin)
  const [strokeWeight, setStrokeWeight] = useState<number>(1.6);         // Độ dày nét
  const [mathFont, setMathFont] = useState<'times' | 'latex'>('times');

  // Trạng thái tương tác chuột kéo thả điểm M
  const [isDraggingM, setIsDraggingM] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tính toán góc chuẩn trong [0, 360) và số vòng quay k
  const normalizedDeg = ((angleDeg % 360) + 360) % 360;
  const turnsCount = Math.floor(Math.abs(angleDeg) / 360);
  const angleRad = (angleDeg * Math.PI) / 180;
  const sinVal = Math.sin(angleRad);
  const cosVal = Math.cos(angleRad);
  const tanVal = Math.abs(cosVal) < 1e-4 ? null : Math.tan(angleRad);
  const cotVal = Math.abs(sinVal) < 1e-4 ? null : 1 / Math.tan(angleRad);

  // Xác định góc phần tư
  const getQuadrant = (deg: number): string => {
    const norm = ((deg % 360) + 360) % 360;
    if (norm === 0 || norm === 90 || norm === 180 || norm === 270) return 'Giao trục';
    if (norm > 0 && norm < 90) return 'Góc phần tư I';
    if (norm > 90 && norm < 180) return 'Góc phần tư II';
    if (norm > 180 && norm < 270) return 'Góc phần tư III';
    return 'Góc phần tư IV';
  };

  // Vẽ hình trên Canvas
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina 2x scale
    const width = 840;
    const height = 580;
    const dpr = 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Xóa nền trắng tinh
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const fontFace = mathFont === 'latex' ? 'KaTeX_Math, "Cambria Math", serif' : '"Times New Roman", Times, serif';

    const originX = width / 2 - 20;
    const originY = height / 2 + 10;
    const R = 170; // Bán kính đường tròn chuẩn

    // 1. Lưới tọa độ mờ
    if (showGrid) {
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      const step = 34;
      for (let x = originX % step; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = originY % step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    if (angleMode === 'unit_circle') {
      // 2. Hệ trục tọa độ Oxy
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = strokeWeight;
      ctx.fillStyle = '#1E293B';

      // Trục Ox (trục Cos)
      const xStart = 50;
      const xEnd = width - 70;
      ctx.beginPath();
      ctx.moveTo(xStart, originY);
      ctx.lineTo(xEnd, originY);
      ctx.stroke();

      // Mũi tên Ox
      ctx.beginPath();
      ctx.moveTo(xEnd, originY);
      ctx.lineTo(xEnd - 10, originY - 4);
      ctx.lineTo(xEnd - 10, originY + 4);
      ctx.closePath();
      ctx.fill();

      // Trục Oy (trục Sin)
      const yStart = height - 40;
      const yEnd = 40;
      ctx.beginPath();
      ctx.moveTo(originX, yStart);
      ctx.lineTo(originX, yEnd);
      ctx.stroke();

      // Mũi tên Oy
      ctx.beginPath();
      ctx.moveTo(originX, yEnd);
      ctx.lineTo(originX - 4, yEnd + 10);
      ctx.lineTo(originX + 4, yEnd + 10);
      ctx.closePath();
      ctx.fill();

      // Nhãn trục Ox, Oy, O
      ctx.font = `italic 16px ${fontFace}`;
      ctx.fillText('x', xEnd + 6, originY + 5);
      ctx.fillText('y', originX - 6, yEnd - 8);
      ctx.font = `14px ${fontFace}`;
      ctx.fillText('O', originX - 16, originY + 16);

      // Nhãn phụ (trục cos, trục sin)
      ctx.font = `12px ${fontFace}`;
      ctx.fillStyle = '#64748B';
      ctx.fillText('(trục cos)', xEnd - 62, originY + 18);
      ctx.fillText('(trục sin)', originX + 10, yEnd + 16);

      // 3. Đường tròn lượng giác tâm O, bán kính R
      ctx.strokeStyle = '#0F6CBD';
      ctx.lineWidth = strokeWeight + 0.4;
      ctx.beginPath();
      ctx.arc(originX, originY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Điểm gốc A(1, 0)
      const ax = originX + R;
      const ay = originY;
      ctx.fillStyle = '#0F6CBD';
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `italic 15px ${fontFace}`;
      ctx.fillText('A', ax + 8, ay - 8);
      ctx.font = `13px ${fontFace}`;
      ctx.fillText('1', ax - 4, ay + 17);

      // Điểm A'(-1, 0)
      const aPrimex = originX - R;
      ctx.font = `italic 15px ${fontFace}`;
      ctx.fillText("A'", aPrimex - 22, originY - 8);
      ctx.font = `13px ${fontFace}`;
      ctx.fillText('-1', aPrimex - 4, originY + 17);

      // Điểm B(0, 1)
      const by = originY - R;
      ctx.font = `italic 15px ${fontFace}`;
      ctx.fillText('B', originX + 8, by - 6);
      ctx.font = `13px ${fontFace}`;
      ctx.fillText('1', originX - 16, by + 12);

      // Điểm B'(0, -1)
      const bPrimey = originY + R;
      ctx.font = `italic 15px ${fontFace}`;
      ctx.fillText("B'", originX + 8, bPrimey + 14);
      ctx.font = `13px ${fontFace}`;
      ctx.fillText('-1', originX - 18, bPrimey - 4);

      // 4. Trục Tang t'At (tiếp tuyến tại A song song Oy)
      if (showTanAxis) {
        ctx.save();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, 35);
        ctx.lineTo(ax, height - 35);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `italic 13px ${fontFace}`;
        ctx.fillStyle = '#D97706';
        ctx.fillText("t", ax - 4, 30);
        ctx.fillText("t'", ax - 4, height - 20);
        ctx.fillText("Trục tang", ax + 6, 45);

        // Giao điểm T của tia OM với trục tang (nếu có)
        if (Math.abs(cosVal) > 1e-4) {
          const tVal = Math.tan(angleRad);
          const ty = originY - tVal * R;
          if (ty >= 30 && ty <= height - 30) {
            ctx.fillStyle = '#D97706';
            ctx.beginPath();
            ctx.arc(ax, ty, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = `italic 14px ${fontFace}`;
            ctx.fillText('T', ax + 8, ty + 4);
          }
        }
        ctx.restore();
      }

      // 5. Trục Cotang s'Bs (tiếp tuyến tại B song song Ox)
      if (showCotAxis) {
        ctx.save();
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, by);
        ctx.lineTo(width - 60, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `italic 13px ${fontFace}`;
        ctx.fillStyle = '#7C3AED';
        ctx.fillText("s", width - 50, by - 4);
        ctx.fillText("s'", 25, by - 4);
        ctx.fillText("Trục cotang", width - 130, by - 8);

        // Giao điểm S của tia OM với trục cotang
        if (Math.abs(sinVal) > 1e-4) {
          const cVal = 1 / Math.tan(angleRad);
          const sx = originX + cVal * R;
          if (sx >= 30 && sx <= width - 30) {
            ctx.fillStyle = '#7C3AED';
            ctx.beginPath();
            ctx.arc(sx, by, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = `italic 14px ${fontFace}`;
            ctx.fillText('S', sx - 4, by - 8);
          }
        }
        ctx.restore();
      }

      // 6. Điểm biểu diễn M trên đường tròn
      const mx = originX + R * cosVal;
      const my = originY - R * sinVal;

      // Tia cuối OM
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = strokeWeight + 0.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      // Kéo dài qua M một chút
      const extX = originX + (R + 24) * cosVal;
      const extY = originY - (R + 24) * sinVal;
      ctx.lineTo(extX, extY);
      ctx.stroke();

      // Tia đầu OA (đậm màu)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = strokeWeight + 0.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      // 7. Cung góc lượng giác có mũi tên định hướng (Chiều dương CCW / Chiều âm CW / Xoắn ốc Archimedes)
      const absAngle = Math.abs(angleDeg);
      const isPositive = angleDeg >= 0;

      ctx.save();
      ctx.strokeStyle = isPositive ? '#DC2626' : '#2563EB';
      ctx.lineWidth = 1.7;

      if (absAngle <= 360) {
        // Cung tròn đơn
        const arcR = 38;
        const startRad = 0;
        const endRad = -angleRad; // Do trục y canvas hướng xuống

        ctx.beginPath();
        ctx.arc(originX, originY, arcR, startRad, endRad, isPositive);
        ctx.stroke();

        // Mũi tên ở đầu cung
        if (absAngle >= 8) {
          const tipX = originX + arcR * Math.cos(endRad);
          const tipY = originY + arcR * Math.sin(endRad);
          // Vector tiếp tuyến của cung
          const tangent = isPositive ? endRad - Math.PI / 2 : endRad + Math.PI / 2;
          const arrowLen = 8;
          ctx.fillStyle = isPositive ? '#DC2626' : '#2563EB';
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - arrowLen * Math.cos(tangent - 0.4), tipY - arrowLen * Math.sin(tangent - 0.4));
          ctx.lineTo(tipX - arrowLen * Math.cos(tangent + 0.4), tipY - arrowLen * Math.sin(tangent + 0.4));
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Đường xoắn ốc Archimedes cho góc nhiều vòng (|angle| > 360) chuẩn SGK 11!
        const rStart = 24;
        const rDeltaPerTurn = 14;
        const totalRad = (absAngle * Math.PI) / 180;
        const numSteps = Math.min(600, Math.floor(absAngle * 2));

        ctx.beginPath();
        for (let i = 0; i <= numSteps; i++) {
          const tFrac = i / numSteps;
          const curTheta = tFrac * totalRad;
          const curR = rStart + (curTheta / (2 * Math.PI)) * rDeltaPerTurn;
          const renderAngle = isPositive ? -curTheta : curTheta;
          const px = originX + curR * Math.cos(renderAngle);
          const py = originY + curR * Math.sin(renderAngle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Mũi tên tại điểm cuối đường xoắn ốc
        const finalR = rStart + (totalRad / (2 * Math.PI)) * rDeltaPerTurn;
        const finalAngle = isPositive ? -totalRad : totalRad;
        const tipX = originX + finalR * Math.cos(finalAngle);
        const tipY = originY + finalR * Math.sin(finalAngle);
        const tangent = isPositive ? finalAngle - Math.PI / 2 : finalAngle + Math.PI / 2;
        const arrowLen = 9;
        ctx.fillStyle = isPositive ? '#DC2626' : '#2563EB';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - arrowLen * Math.cos(tangent - 0.45), tipY - arrowLen * Math.sin(tangent - 0.45));
        ctx.lineTo(tipX - arrowLen * Math.cos(tangent + 0.45), tipY - arrowLen * Math.sin(tangent + 0.45));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Nhãn góc lượng giác (ví dụ α = 60° hoặc +420°)
      if (showAngleLabel) {
        ctx.save();
        const midRad = absAngle <= 360 ? -angleRad / 2 : (isPositive ? -0.5 : 0.5);
        const labelR = absAngle <= 360 ? 56 : 68;
        const lx = originX + labelR * Math.cos(midRad);
        const ly = originY + labelR * Math.sin(midRad);

        ctx.font = `bold 14px ${fontFace}`;
        ctx.fillStyle = isPositive ? '#B91C1C' : '#1D4ED8';
        const angleStr = `${angleDeg >= 0 ? '+' : ''}${angleDeg}° (${formatRadian(angleDeg)})`;
        ctx.fillText(angleStr, lx + (cosVal >= 0 ? 6 : -60), ly);
        ctx.restore();
      }

      // 8. Hình chiếu vuông góc nét đứt xuống Ox và Oy (giá trị cos và sin)
      if (showProjections) {
        ctx.save();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 3]);

        // Chiếu xuống Ox (Cos)
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, originY);
        ctx.stroke();

        // Ký hiệu góc vuông nhỏ tại trục Ox
        const sq = 8;
        const signY = sinVal >= 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(mx, originY + signY * sq);
        ctx.lineTo(mx + (cosVal >= 0 ? -sq : sq), originY + signY * sq);
        ctx.lineTo(mx + (cosVal >= 0 ? -sq : sq), originY);
        ctx.stroke();

        // Chiếu xuống Oy (Sin)
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(originX, my);
        ctx.stroke();

        // Ký hiệu góc vuông nhỏ tại trục Oy
        const signX = cosVal >= 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(originX + signX * sq, my);
        ctx.lineTo(originX + signX * sq, my + (sinVal >= 0 ? sq : -sq));
        ctx.lineTo(originX, my + (sinVal >= 0 ? sq : -sq));
        ctx.stroke();

        ctx.setLineDash([]);

        // Điểm đánh dấu trên trục Ox và Oy
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(mx, originY, 3, 0, Math.PI * 2);
        ctx.arc(originX, my, 3, 0, Math.PI * 2);
        ctx.fill();

        // Nhãn cos và sin trên trục
        ctx.font = `italic 13px ${fontFace}`;
        ctx.fillText('cos α', mx - 14, originY + (sinVal >= 0 ? 16 : -8));
        ctx.fillText('sin α', originX + (cosVal >= 0 ? -38 : 8), my + 4);
        ctx.restore();
      }

      // 9. Điểm M nổi bật có viền trắng đổ bóng
      ctx.save();
      ctx.shadowColor = 'rgba(220, 38, 38, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(mx, my, isDraggingM ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Nhãn chữ M(cos α; sin α)
      if (showPointCoord) {
        ctx.font = `bold italic 15px ${fontFace}`;
        ctx.fillStyle = '#DC2626';
        const offX = cosVal >= 0 ? 12 : -18;
        const offY = sinVal >= 0 ? -12 : 18;
        ctx.fillText('M', mx + offX, my + offY);

        ctx.font = `12px ${fontFace}`;
        ctx.fillStyle = '#334155';
        const coordStr = `(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`;
        ctx.fillText(coordStr, mx + offX + 16, my + offY);
      }
    } else {
      // MODE 2: GÓC LƯỢNG GIÁC TỔNG QUÁT (Tia Ou, Ov)
      const centerOX = width / 2 - 40;
      const centerOY = height / 2 + 20;
      const rayLen = 220;

      // Tia Ou (nằm ngang)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = strokeWeight + 0.6;
      ctx.beginPath();
      ctx.moveTo(centerOX, centerOY);
      ctx.lineTo(centerOX + rayLen, centerOY);
      ctx.stroke();

      // Mũi tên tia Ou
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.moveTo(centerOX + rayLen, centerOY);
      ctx.lineTo(centerOX + rayLen - 10, centerOY - 4);
      ctx.lineTo(centerOX + rayLen - 10, centerOY + 4);
      ctx.closePath();
      ctx.fill();

      // Tia Ov (quay góc angleDeg)
      const ovX = centerOX + rayLen * cosVal;
      const ovY = centerOY - rayLen * sinVal;
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = strokeWeight + 0.6;
      ctx.beginPath();
      ctx.moveTo(centerOX, centerOY);
      ctx.lineTo(ovX, ovY);
      ctx.stroke();

      // Mũi tên tia Ov
      ctx.fillStyle = '#DC2626';
      const radOv = -angleRad;
      ctx.beginPath();
      ctx.moveTo(ovX, ovY);
      ctx.lineTo(ovX - 10 * Math.cos(radOv - 0.35), ovY - 10 * Math.sin(radOv - 0.35));
      ctx.lineTo(ovX - 10 * Math.cos(radOv + 0.35), ovY - 10 * Math.sin(radOv + 0.35));
      ctx.closePath();
      ctx.fill();

      // Gốc O
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(centerOX, centerOY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `italic 16px ${fontFace}`;
      ctx.fillText('O', centerOX - 18, centerOY + 16);

      // Nhãn tia u và tia v
      ctx.font = `italic 16px ${fontFace}`;
      ctx.fillStyle = '#2563EB';
      ctx.fillText('u', centerOX + rayLen + 8, centerOY + 5);
      ctx.fillStyle = '#DC2626';
      ctx.fillText('v', ovX + 10 * cosVal, ovY - 10 * sinVal);

      // Cung quay định hướng
      ctx.save();
      const isPositive = angleDeg >= 0;
      ctx.strokeStyle = isPositive ? '#DC2626' : '#2563EB';
      ctx.lineWidth = 1.8;
      const arcR = 50;

      if (Math.abs(angleDeg) <= 360) {
        ctx.beginPath();
        ctx.arc(centerOX, centerOY, arcR, 0, -angleRad, isPositive);
        ctx.stroke();

        const tipX = centerOX + arcR * Math.cos(-angleRad);
        const tipY = centerOY + arcR * Math.sin(-angleRad);
        const tangent = isPositive ? -angleRad - Math.PI / 2 : -angleRad + Math.PI / 2;
        ctx.fillStyle = isPositive ? '#DC2626' : '#2563EB';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - 8 * Math.cos(tangent - 0.4), tipY - 8 * Math.sin(tangent - 0.4));
        ctx.lineTo(tipX - 8 * Math.cos(tangent + 0.4), tipY - 8 * Math.sin(tangent + 0.4));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Nhãn số đo
      ctx.font = `bold 15px ${fontFace}`;
      ctx.fillStyle = '#DC2626';
      ctx.fillText(`(Ou, Ov) = ${angleDeg >= 0 ? '+' : ''}${angleDeg}°`, centerOX + 65, centerOY - 20);
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
    isDraggingM
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
      } else if (action.type === 'copy_word') {
        handleCopyWordAction();
      } else if (action.type === 'download_png') {
        handleDownloadPngAction();
      }
    };
    window.addEventListener('lvp_ribbon_action', handleAction);
    return () => window.removeEventListener('lvp_ribbon_action', handleAction);
  }, []);

  // Xử lý kéo chuột tương tác điểm M
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (angleMode !== 'unit_circle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const originX = 840 / 2 - 20;
    const originY = 580 / 2 + 10;
    const R = 170;

    const mx = originX + R * cosVal;
    const my = originY - R * sinVal;

    // Kiểm tra nhấp trúng điểm M (bán kính tương tác 24px)
    if (Math.hypot(mouseX - mx, mouseY - my) <= 24) {
      setIsDraggingM(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingM || angleMode !== 'unit_circle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const originX = 840 / 2 - 20;
    const originY = 580 / 2 + 10;

    // Tính góc từ tâm O đến chuột (chú ý trục y canvas ngược)
    let rawRad = Math.atan2(-(mouseY - originY), mouseX - originX);
    let rawDeg = Math.round((rawRad * 180) / Math.PI);
    if (rawDeg < 0) rawDeg += 360;

    // Nam châm bắt dính vào góc đặc biệt nếu lệch dưới 4 độ
    for (const sa of SPECIAL_ANGLES) {
      if (Math.abs(rawDeg - sa.deg) <= 4) {
        rawDeg = sa.deg;
        break;
      }
    }

    // Giữ nguyên số vòng k nếu trước đó góc đã nhiều vòng
    const sign = angleDeg < 0 ? -1 : 1;
    const k = Math.floor(Math.abs(angleDeg) / 360);
    const newAngle = sign * (k * 360 + rawDeg);
    setAngleDeg(newAngle);
  };

  const handleMouseUp = () => {
    if (isDraggingM) setIsDraggingM(false);
  };

  // Sao chép ảnh 300 DPI vào Word
  const handleCopyWordAction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const croppedCanvas = cropCanvasToContent(canvas, 14);
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
          // Tải xuống nếu clipboard API bị chặn
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

  // Tải ảnh PNG
  const handleDownloadPngAction = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropped = cropCanvasToContent(canvas, 14);
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
      {/* VÙNG CHÍNH: KHUNG VẼ CANVÁS & THÔNG BÁO */}
      <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-4 flex flex-col items-center shadow-xs">
        {/* Banner trạng thái & Hướng dẫn sư phạm */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 text-xs">
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
              className="h-[28px] px-2.5 border border-[#E1DFDD] dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[3px] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
              title="Tải ảnh PNG chuẩn 300 DPI"
            >
              <Download size={13} />
              <span>Tải PNG</span>
            </button>
          </div>
        </div>

        {/* Canvas vẽ tương tác */}
        <div className="relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-inner select-none cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block max-w-full"
          />
          <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
            💡 Kéo trực tiếp điểm đỏ M trên đường tròn để xoay góc (tự động bắt dính góc đẹp)
          </div>
        </div>

        {/* Bảng giá trị 4 hàm lượng giác */}
        <div className="w-full mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">sin α (Tung độ M)</span>
            <span className="text-base font-bold font-mono text-[#059669]">
              {sinVal.toFixed(3)}
            </span>
          </div>
          <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-semibold">cos α (Hoành độ M)</span>
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
        {/* Khối 1: Chế độ hình vẽ & Nhập góc */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Chế độ hình vẽ SGK 11</span>
            <span className="text-[10px] text-[#0F6CBD] font-semibold">Toán 11 GDPT 2018</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded">
            <button
              type="button"
              onClick={() => setAngleMode('unit_circle')}
              className={`py-1.5 px-2 text-xs font-bold rounded transition cursor-pointer ${
                angleMode === 'unit_circle'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6CBD] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Đường tròn Oxy
            </button>
            <button
              type="button"
              onClick={() => setAngleMode('general_ray')}
              className={`py-1.5 px-2 text-xs font-bold rounded transition cursor-pointer ${
                angleMode === 'general_ray'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6CBD] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Góc tia (Ou, Ov)
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

        {/* Khối 2: Mẫu góc đặc biệt SGK 11 */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Kho mẫu góc SGK Toán 11</span>
            <span className="text-[10px] text-slate-400">Chọn 1 click</span>
          </div>

          {/* Nhóm góc dương */}
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

          {/* Nhóm góc âm */}
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

          {/* Nhóm góc nhiều vòng xoắn ốc (Bài tập SGK) */}
          <div>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-1">
              Góc nhiều vòng xoắn ốc (Bài 1 SGK)
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
                      ? 'bg-amber-100 text-amber-900 border-amber-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Khối 3: Tùy biến hiển thị & Phông chữ */}
        <div className="bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[4px] p-3.5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tùy biến hiển thị sư phạm
          </div>

          <div className="space-y-2 text-xs">
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
              <span className="text-slate-700 dark:text-slate-300">Lưới tọa độ ô vuông</span>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F6CBD] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">Nhãn số đo góc trên cung</span>
              <input
                type="checkbox"
                checked={showAngleLabel}
                onChange={e => setShowAngleLabel(e.target.checked)}
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
          </div>

          {/* Phông chữ */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Phông chữ Toán:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMathFont('times')}
                className={`px-2 py-1 text-xs rounded border cursor-pointer ${
                  mathFont === 'times'
                    ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                Times SGK
              </button>
              <button
                type="button"
                onClick={() => setMathFont('latex')}
                className={`px-2 py-1 text-xs rounded border cursor-pointer ${
                  mathFont === 'latex'
                    ? 'bg-[#0F6CBD] text-white border-[#0F6CBD]'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                LaTeX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
