/**
 * @license
 * MathArtboard.tsx
 * Vùng làm việc trung tâm (Document Workspace) mô phỏng trang giấy Word A4:
 * - Nền xám nhạt (#E8E8E8), khung vẽ trắng tinh (#FFFFFF) đổ bóng nhẹ
 * - Vẽ đồ họa vector SVG sắc nét: Đồ thị 2D, BBT, Hình phẳng & Lượng giác, 3D & Oxyz, Thống kê & Xác suất
 * - Hỗ trợ chọn đối tượng tương tác để mở Contextual Tab "Định dạng đối tượng"
 * - Cung cấp SVG id="math-artboard-svg" chuẩn để xuất ảnh 300 DPI tự động cắt lề 24px
 */

import React, { useRef, useState, useMemo } from 'react';
import { ArtboardDocument } from '../../types/mathArtboard';

export interface MathArtboardProps {
  doc: ArtboardDocument;
  onUpdateDoc: (updater: (prev: ArtboardDocument) => ArtboardDocument) => void;
  onCursorMove?: (x: number, y: number) => void;
  onSelectElement?: (elementId: string | null) => void;
}

export default function MathArtboard({
  doc,
  onUpdateDoc,
  onCursorMove,
  onSelectElement,
}: MathArtboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Kích thước chuẩn khung vẽ giấy A4 ngang
  const artboardWidth = 780;
  const artboardHeight = 520;
  const centerX = artboardWidth / 2;
  const centerY = artboardHeight / 2;
  const scale = 36; // 36px tương ứng 1 đơn vị toán học

  // Font và kiểu nét theo doc settings
  const fontFamily = doc.typography.fontFamily || 'Times New Roman';
  const fontSize = doc.typography.fontSize || 14;
  const strokeColor = doc.strokeFill.strokeColor || '#000000';
  const strokeWidth = doc.strokeFill.strokeWidth || 1.2;
  const strokeDash = doc.strokeFill.strokeStyle === 'dashed' ? '5,4' : undefined;

  // Xử lý tọa độ chuột thực trên hệ trục tọa độ Oxy
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mousePixelX = e.clientX - rect.left;
    const mousePixelY = e.clientY - rect.top;

    // Quy đổi ra tọa độ Oxy trung tâm
    const mathX = Number(((mousePixelX - centerX) / scale).toFixed(2));
    const mathY = Number(((centerY - mousePixelY) / scale).toFixed(2));

    setHoverCoord({ x: mathX, y: mathY });
    onCursorMove?.(mathX, mathY);
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
    onCursorMove?.(0, 0);
  };

  // Chọn phần tử khi click
  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectElement?.(elementId);
    onUpdateDoc(prev => ({ ...prev, selectedElementId: elementId }));
  };

  const handleBackgroundClick = () => {
    onSelectElement?.(null);
    onUpdateDoc(prev => ({ ...prev, selectedElementId: null }));
  };

  // =========================================================================
  // 1. RENDER ĐỒ THỊ 2D (GIẢI TÍCH 10 - 11 - 12)
  // =========================================================================
  const renderGraph2D = () => {
    const { type, a, b, c, d, showAsymptotes, showTangent, tangentX0, showGrid, showIntegralHatch, integralRange, showInequalityHatch } = doc.graph2D;

    // Sinh đường cong hàm số dựa trên loại
    const points: [number, number][] = [];
    const step = 0.04;
    const xMin = -9;
    const xMax = 9;

    let asymptoteVertical: number | null = null;
    let asymptoteHorizontal: number | null = null;
    let asymptoteOblique: { a: number; b: number } | null = null;

    if (type === 'rational_1_1') {
      // y = (ax + b) / (cx + d)
      const denomRoot = c !== 0 ? -d / c : null;
      asymptoteVertical = denomRoot;
      asymptoteHorizontal = c !== 0 ? a / c : null;
    } else if (type === 'rational_2_1') {
      // y = (ax^2 + bx + c) / (dx + e)
      asymptoteVertical = d !== 0 ? -doc.graph2D.e / d : null;
      if (d !== 0) {
        asymptoteOblique = { a: a / d, b: (b - (a * doc.graph2D.e) / d) / d };
      }
    }

    const segments: string[] = [];
    let currentPath = '';

    for (let x = xMin; x <= xMax; x += step) {
      let y: number | null = null;

      if (type === 'parabola') {
        y = a * x * x + b * x + c;
      } else if (type === 'cubic') {
        y = a * x * x * x + b * x * x + c * x + d;
      } else if (type === 'trig_sin') {
        y = Math.sin(x);
      } else if (type === 'trig_cos') {
        y = Math.cos(x);
      } else if (type === 'trig_tan') {
        if (Math.abs(Math.cos(x)) > 0.05) y = Math.tan(x);
      } else if (type === 'exp_log') {
        if (x > 0) y = Math.log(x);
      } else if (type === 'rational_1_1') {
        const denom = c * x + d;
        if (Math.abs(denom) > 0.08) {
          y = (a * x + b) / denom;
        }
      } else if (type === 'rational_2_1') {
        const denom = d * x + doc.graph2D.e;
        if (Math.abs(denom) > 0.08) {
          y = (a * x * x + b * x + c) / denom;
        }
      } else {
        // Mặc định parabol bậc 2
        y = a * x * x + b * x + c;
      }

      if (y !== null && !isNaN(y) && Math.abs(y) <= 12) {
        const px = centerX + x * scale;
        const py = centerY - y * scale;
        if (!currentPath) {
          currentPath = `M ${px.toFixed(1)} ${py.toFixed(1)}`;
        } else {
          currentPath += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
        }
      } else {
        if (currentPath) {
          segments.push(currentPath);
          currentPath = '';
        }
      }
    }
    if (currentPath) segments.push(currentPath);

    // Tiếp tuyến tại x0
    let tangentPath = '';
    let tangentPoint: [number, number] | null = null;
    if (showTangent) {
      const x0 = tangentX0;
      let y0 = 0;
      let k = 0;
      if (type === 'cubic') {
        y0 = a * x0 * x0 * x0 + b * x0 * x0 + c * x0 + d;
        k = 3 * a * x0 * x0 + 2 * b * x0 + c;
      } else {
        y0 = a * x0 * x0 + b * x0 + c;
        k = 2 * a * x0 + b;
      }
      tangentPoint = [centerX + x0 * scale, centerY - y0 * scale];
      const tx1 = x0 - 3;
      const ty1 = y0 + k * (tx1 - x0);
      const tx2 = x0 + 3;
      const ty2 = y0 + k * (tx2 - x0);
      tangentPath = `M ${centerX + tx1 * scale} ${centerY - ty1 * scale} L ${centerX + tx2 * scale} ${centerY - ty2 * scale}`;
    }

    return (
      <g id="group-graph-2d">
        {/* Lưới tọa độ Oxy */}
        {showGrid && (
          <g id="grid" opacity="0.18">
            {[-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8].map(v => (
              <React.Fragment key={`grid-${v}`}>
                <line x1={centerX + v * scale} y1={20} x2={centerX + v * scale} y2={artboardHeight - 20} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
                <line x1={20} y1={centerY - v * scale} x2={artboardWidth - 20} y2={centerY - v * scale} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
              </React.Fragment>
            ))}
          </g>
        )}

        {/* Trục hoành Ox và Trục tung Oy chuẩn GDPT 2018 */}
        <line x1={20} y1={centerY} x2={artboardWidth - 20} y2={centerY} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
        <line x1={centerX} y1={artboardHeight - 20} x2={centerX} y2={20} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />

        {/* Tên trục & Gốc O (Times New Roman Italic) */}
        <text x={artboardWidth - 18} y={centerY + 16} fontFamily={fontFamily} fontSize="15" fontStyle="italic" textAnchor="end">x</text>
        <text x={centerX - 16} y={24} fontFamily={fontFamily} fontSize="15" fontStyle="italic" textAnchor="start">y</text>
        <text x={centerX - 12} y={centerY + 14} fontFamily={fontFamily} fontSize="14" fontStyle="italic">O</text>

        {/* Các vạch số trên trục Oxy */}
        {[-3, -2, -1, 1, 2, 3].map(v => (
          <React.Fragment key={`tick-${v}`}>
            <line x1={centerX + v * scale} y1={centerY - 3} x2={centerX + v * scale} y2={centerY + 3} stroke="#000000" strokeWidth="1" />
            <text x={centerX + v * scale} y={centerY + 14} fontFamily={fontFamily} fontSize="12" textAnchor="middle">{v}</text>
            <line x1={centerX - 3} y1={centerY - v * scale} x2={centerX + 3} y2={centerY - v * scale} stroke="#000000" strokeWidth="1" />
            <text x={centerX - 10} y={centerY - v * scale + 4} fontFamily={fontFamily} fontSize="12" textAnchor="end">{v}</text>
          </React.Fragment>
        ))}

        {/* Gạch sọc miền nghiệm BPT hoặc diện tích tích phân */}
        {showIntegralHatch && (
          <path
            d={`M ${centerX + integralRange[0] * scale} ${centerY} L ${centerX + integralRange[0] * scale} ${centerY - (a * integralRange[0] * integralRange[0] + c) * scale} L ${centerX + integralRange[1] * scale} ${centerY - (a * integralRange[1] * integralRange[1] + c) * scale} L ${centerX + integralRange[1] * scale} ${centerY} Z`}
            fill="url(#hatch-diagonal)"
            opacity="0.8"
          />
        )}

        {/* Đường cong đồ thị chính */}
        {segments.map((seg, idx) => (
          <path
            key={`seg-${idx}`}
            d={seg}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            className="cursor-pointer hover:stroke-[#0F6CBD] transition-colors"
            onClick={(e) => handleElementClick('curve', e)}
          />
        ))}

        {/* Tiệm cận đứng và tiệm cận ngang (nét đứt) */}
        {showAsymptotes && asymptoteVertical !== null && (
          <line
            x1={centerX + asymptoteVertical * scale}
            y1={25}
            x2={centerX + asymptoteVertical * scale}
            y2={artboardHeight - 25}
            stroke="#b91c1c"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
        )}
        {showAsymptotes && asymptoteHorizontal !== null && (
          <line
            x1={25}
            y1={centerY - asymptoteHorizontal * scale}
            x2={artboardWidth - 25}
            y2={centerY - asymptoteHorizontal * scale}
            stroke="#b91c1c"
            strokeWidth="1.2"
            strokeDasharray="4,3"
          />
        )}

        {/* Tiếp tuyến tại M0 */}
        {showTangent && tangentPath && (
          <>
            <path d={tangentPath} fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3,2" />
            {tangentPoint && (
              <circle cx={tangentPoint[0]} cy={tangentPoint[1]} r="3.5" fill="#2563eb" />
            )}
            {tangentPoint && (
              <text x={tangentPoint[0] + 6} y={tangentPoint[1] - 6} fontFamily={fontFamily} fontSize="13" fontStyle="italic">M₀</text>
            )}
          </>
        )}
      </g>
    );
  };

  // =========================================================================
  // 2. RENDER BẢNG BIẾN THIÊN (BBT & XÉT DẤU)
  // =========================================================================
  const renderBBT = () => {
    const startX = 60;
    const startY = 120;
    const colWidth = 140;
    const rowHeight = 44;
    const totalCols = 4;
    const tableWidth = colWidth * (totalCols + 1);

    return (
      <g id="group-bbt">
        {/* Khung viền ngoài bảng biến thiên chuẩn SGK GDPT 2018 */}
        <rect x={startX} y={startY} width={tableWidth} height={rowHeight * 3.5} fill="#ffffff" stroke="#000000" strokeWidth="1.4" />
        
        {/* Đường kẻ ngang ngăn cách dòng x, y', y */}
        <line x1={startX} y1={startY + rowHeight} x2={startX + tableWidth} y2={startY + rowHeight} stroke="#000000" strokeWidth="1" />
        <line x1={startX} y1={startY + rowHeight * 2} x2={startX + tableWidth} y2={startY + rowHeight * 2} stroke="#000000" strokeWidth="1" />

        {/* Cột nhãn đầu tiên (x, y', y) */}
        <line x1={startX + 70} y1={startY} x2={startX + 70} y2={startY + rowHeight * 3.5} stroke="#000000" strokeWidth="1" />
        
        <text x={startX + 35} y={startY + 28} fontFamily={fontFamily} fontSize="17" fontStyle="italic" textAnchor="middle">x</text>
        <text x={startX + 35} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="17" fontStyle="italic" textAnchor="middle">y'</text>
        <text x={startX + 35} y={startY + rowHeight * 2 + 42} fontFamily={fontFamily} fontSize="17" fontStyle="italic" textAnchor="middle">y</text>

        {/* Các cột nghiệm: -∞, x1, x2, +∞ */}
        <text x={startX + 120} y={startY + 28} fontFamily={fontFamily} fontSize="15" textAnchor="middle">−∞</text>
        <text x={startX + 270} y={startY + 28} fontFamily={fontFamily} fontSize="15" fontStyle="italic" textAnchor="middle">1</text>
        <text x={startX + 430} y={startY + 28} fontFamily={fontFamily} fontSize="15" fontStyle="italic" textAnchor="middle">3</text>
        <text x={startX + 580} y={startY + 28} fontFamily={fontFamily} fontSize="15" textAnchor="middle">+∞</text>

        {/* Dấu y' (+, 0, -, 0, +) */}
        <text x={startX + 190} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="16" textAnchor="middle">+</text>
        <text x={startX + 270} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="16" textAnchor="middle">0</text>
        <text x={startX + 350} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="16" textAnchor="middle">−</text>
        <text x={startX + 430} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="16" textAnchor="middle">0</text>
        <text x={startX + 510} y={startY + rowHeight + 28} fontFamily={fontFamily} fontSize="16" textAnchor="middle">+</text>

        {/* Mũi tên biến thiên của dòng y */}
        {/* Mũi tên đi lên từ -∞ đến 4 */}
        <text x={startX + 120} y={startY + rowHeight * 3.2} fontFamily={fontFamily} fontSize="14" textAnchor="middle">−∞</text>
        <line x1={startX + 140} y1={startY + rowHeight * 3.1} x2={startX + 250} y2={startY + rowHeight * 2.3} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
        <text x={startX + 270} y={startY + rowHeight * 2.3} fontFamily={fontFamily} fontSize="15" textAnchor="middle">4</text>

        {/* Mũi tên đi xuống từ 4 đến 0 */}
        <line x1={startX + 290} y1={startY + rowHeight * 2.3} x2={startX + 410} y2={startY + rowHeight * 3.1} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
        <text x={startX + 430} y={startY + rowHeight * 3.2} fontFamily={fontFamily} fontSize="15" textAnchor="middle">0</text>

        {/* Mũi tên đi lên từ 0 đến +∞ */}
        <line x1={startX + 450} y1={startY + rowHeight * 3.1} x2={startX + 560} y2={startY + rowHeight * 2.3} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
        <text x={startX + 580} y={startY + rowHeight * 2.3} fontFamily={fontFamily} fontSize="14" textAnchor="middle">+∞</text>
      </g>
    );
  };

  // =========================================================================
  // 3. RENDER HÌNH PHẲNG & LƯỢNG GIÁC (TRỤC SỐ / ĐƯỜNG TRÒN / TAM GIÁC)
  // =========================================================================
  const renderPlaneTrig = () => {
    const { type } = doc.planeTrig;

    if (type === 'number_line') {
      // Trục số khoảng [a; b) kèm gạch sọc phần loại bỏ
      const lineY = centerY;
      return (
        <g id="group-number-line">
          <line x1={60} y1={lineY} x2={artboardWidth - 60} y2={lineY} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
          {/* Vùng gạch chéo bên trái [2; 6) */}
          <rect x={60} y={lineY - 14} width={220} height={28} fill="url(#hatch-diagonal)" opacity="0.85" />
          {/* Ngoặc vuông '[' tại 2 */}
          <path d={`M ${280} ${lineY - 16} L ${270} ${lineY - 16} L ${270} ${lineY + 16} L ${280} ${lineY + 16}`} fill="none" stroke="#000000" strokeWidth="1.8" />
          <text x={270} y={lineY + 34} fontFamily={fontFamily} fontSize="15" textAnchor="middle">2</text>

          {/* Ngoặc tròn ')' tại 6 */}
          <path d={`M ${520} ${lineY - 16} Q ${535} ${lineY} ${520} ${lineY + 16}`} fill="none" stroke="#000000" strokeWidth="1.8" />
          <text x={525} y={lineY + 34} fontFamily={fontFamily} fontSize="15" textAnchor="middle">6</text>

          {/* Vùng gạch chéo bên phải 6 */}
          <rect x={530} y={lineY - 14} width={180} height={28} fill="url(#hatch-diagonal)" opacity="0.85" />
          <text x={artboardWidth - 50} y={lineY + 22} fontFamily={fontFamily} fontSize="14" fontStyle="italic">x</text>
        </g>
      );
    }

    if (type === 'unit_circle_half' || type === 'trig_circle_full') {
      // Đường tròn lượng giác
      const radius = 160;
      return (
        <g id="group-trig-circle">
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#000000" strokeWidth="1.4" />
          {/* Trục Cos và Trục Sin */}
          <line x1={centerX - radius - 30} y1={centerY} x2={centerX + radius + 40} y2={centerY} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
          <line x1={centerX} y1={centerY + radius + 30} x2={centerX} y2={centerY - radius - 40} stroke="#000000" strokeWidth="1.4" markerEnd="url(#arrowhead)" />
          
          <text x={centerX + radius + 44} y={centerY + 16} fontFamily={fontFamily} fontSize="14" fontStyle="italic">cos α</text>
          <text x={centerX - 14} y={centerY - radius - 44} fontFamily={fontFamily} fontSize="14" fontStyle="italic">sin α</text>
          <text x={centerX - 14} y={centerY + 16} fontFamily={fontFamily} fontSize="14" fontStyle="italic">O</text>
          <text x={centerX + radius} y={centerY + 18} fontFamily={fontFamily} fontSize="13">1</text>
          <text x={centerX - radius - 10} y={centerY + 18} fontFamily={fontFamily} fontSize="13">−1</text>

          {/* Điểm ngọn góc lượng giác 60 độ */}
          <line x1={centerX} y1={centerY} x2={centerX + radius * 0.5} y2={centerY - radius * 0.866} stroke="#0F6CBD" strokeWidth="1.5" />
          <circle cx={centerX + radius * 0.5} cy={centerY - radius * 0.866} r="4" fill="#0F6CBD" />
          <text x={centerX + radius * 0.5 + 8} y={centerY - radius * 0.866} fontFamily={fontFamily} fontSize="14" fontStyle="italic">M</text>
          {/* Cung góc alpha */}
          <path d={`M ${centerX + 35} ${centerY} A 35 35 0 0 0 ${centerX + 17.5} ${centerY - 30}`} fill="none" stroke="#0F6CBD" strokeWidth="1.2" />
          <text x={centerX + 26} y={centerY - 10} fontFamily={fontFamily} fontSize="13" fontStyle="italic" fill="#0F6CBD">α</text>
        </g>
      );
    }

    // Tam giác vuông / cơ bản kèm ký hiệu góc vuông
    return (
      <g id="group-triangle">
        <polygon points={`${centerX - 160},${centerY + 120} ${centerX + 180},${centerY + 120} ${centerX - 160},${centerY - 100}`} fill="none" stroke="#000000" strokeWidth="1.4" />
        {/* Ký hiệu góc vuông tại đỉnh A */}
        <polyline points={`${centerX - 160},${centerY + 95} ${centerX - 135},${centerY + 95} ${centerX - 135},${centerY + 120}`} fill="none" stroke="#000000" strokeWidth="1.2" />
        {/* Đỉnh A, B, C */}
        <text x={centerX - 180} y={centerY + 135} fontFamily={fontFamily} fontSize="15" fontStyle="italic">A</text>
        <text x={centerX + 190} y={centerY + 135} fontFamily={fontFamily} fontSize="15" fontStyle="italic">B</text>
        <text x={centerX - 180} y={centerY - 110} fontFamily={fontFamily} fontSize="15" fontStyle="italic">C</text>
      </g>
    );
  };

  // =========================================================================
  // 4. RENDER KHÔNG GIAN 3D & OXYZ (CHÓP S.ABCD NÉT LIỀN / NÉT ĐỨT)
  // =========================================================================
  const renderSpace3D = () => {
    // Chóp S.ABCD đáy hình bình hành (SA vuông góc đáy) chuẩn SGK Toán 11 & 12
    const S = [centerX, centerY - 150];
    const A = [centerX - 140, centerY + 60];
    const B = [centerX - 40, centerY + 130];
    const C = [centerX + 160, centerY + 130];
    const D = [centerX + 60, centerY + 60];

    return (
      <g id="group-space-3d">
        {/* Nét đứt (cạnh khuất): SA, AD, CD */}
        <line x1={S[0]} y1={S[1]} x2={A[0]} y2={A[1]} stroke="#000000" strokeWidth="1.3" strokeDasharray="5,4" />
        <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} stroke="#000000" strokeWidth="1.3" strokeDasharray="5,4" />
        <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#000000" strokeWidth="1.3" strokeDasharray="5,4" />

        {/* Nét liền (cạnh nhìn thấy): SB, SC, SD, BC, CD */}
        <line x1={S[0]} y1={S[1]} x2={B[0]} y2={B[1]} stroke="#000000" strokeWidth="1.4" />
        <line x1={S[0]} y1={S[1]} x2={C[0]} y2={C[1]} stroke="#000000" strokeWidth="1.4" />
        <line x1={S[0]} y1={S[1]} x2={D[0]} y2={D[1]} stroke="#000000" strokeWidth="1.4" />
        <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} stroke="#000000" strokeWidth="1.4" />
        <line x1={C[0]} y1={C[1]} x2={D[0]} y2={D[1]} stroke="#000000" strokeWidth="1.4" />

        {/* Ký hiệu góc vuông không gian tại A */}
        <polyline points={`${A[0]},${A[1] - 18} ${A[0] + 16},${A[1] - 13} ${A[0] + 16},${A[1] + 5}`} fill="none" stroke="#000000" strokeWidth="1" />

        {/* Nhãn các đỉnh S, A, B, C, D */}
        <text x={S[0]} y={S[1] - 12} fontFamily={fontFamily} fontSize="16" fontStyle="italic" textAnchor="middle">S</text>
        <text x={A[0] - 18} y={A[1] + 4} fontFamily={fontFamily} fontSize="16" fontStyle="italic">A</text>
        <text x={B[0] - 12} y={B[1] + 20} fontFamily={fontFamily} fontSize="16" fontStyle="italic">B</text>
        <text x={C[0] + 10} y={C[1] + 18} fontFamily={fontFamily} fontSize="16" fontStyle="italic">C</text>
        <text x={D[0] + 12} y={D[1] + 2} fontFamily={fontFamily} fontSize="16" fontStyle="italic">D</text>
      </g>
    );
  };

  // =========================================================================
  // 5. RENDER THỐNG KÊ & XÁC SUẤT (BIỂU ĐỒ HỘP BOX-PLOT & VEN)
  // =========================================================================
  const renderStatsProb = () => {
    const { type } = doc.statsProb;

    if (type === 'box_plot') {
      // Biểu đồ hộp Box-plot chuẩn Toán 10 & 12
      const lineY = centerY;
      const minX = 160;
      const q1X = 280;
      const medX = 400;
      const q3X = 540;
      const maxX = 660;

      return (
        <g id="group-box-plot">
          {/* Trục số phía dưới */}
          <line x1={100} y1={lineY + 80} x2={720} y2={lineY + 80} stroke="#000000" strokeWidth="1.2" markerEnd="url(#arrowhead)" />
          
          {/* Dây ria trái (Min -> Q1) */}
          <line x1={minX} y1={lineY} x2={q1X} y2={lineY} stroke="#000000" strokeWidth="1.4" />
          <line x1={minX} y1={lineY - 20} x2={minX} y2={lineY + 20} stroke="#000000" strokeWidth="1.4" />

          {/* Hộp chữ nhật (Q1 -> Q3) */}
          <rect x={q1X} y={lineY - 35} width={q3X - q1X} height={70} fill="#f8fafc" stroke="#000000" strokeWidth="1.5" />
          
          {/* Đường trung vị Q2 (Median) */}
          <line x1={medX} y1={lineY - 35} x2={medX} y2={lineY + 35} stroke="#0F6CBD" strokeWidth="2" />

          {/* Dây ria phải (Q3 -> Max) */}
          <line x1={q3X} y1={lineY} x2={maxX} y2={lineY} stroke="#000000" strokeWidth="1.4" />
          <line x1={maxX} y1={lineY - 20} x2={maxX} y2={lineY + 20} stroke="#000000" strokeWidth="1.4" />

          {/* Nhãn tứ phân vị */}
          <text x={minX} y={lineY + 40} fontFamily={fontFamily} fontSize="13" textAnchor="middle">Min</text>
          <text x={q1X} y={lineY + 50} fontFamily={fontFamily} fontSize="14" fontStyle="italic" textAnchor="middle">Q₁</text>
          <text x={medX} y={lineY - 45} fontFamily={fontFamily} fontSize="14" fontStyle="italic" textAnchor="middle" fill="#0F6CBD">Q₂ (Me)</text>
          <text x={q3X} y={lineY + 50} fontFamily={fontFamily} fontSize="14" fontStyle="italic" textAnchor="middle">Q₃</text>
          <text x={maxX} y={lineY + 40} fontFamily={fontFamily} fontSize="13" textAnchor="middle">Max</text>
        </g>
      );
    }

    // Biểu đồ Ven 2 tập hợp A và B
    return (
      <g id="group-venn">
        <circle cx={centerX - 70} cy={centerY} r="120" fill="none" stroke="#000000" strokeWidth="1.4" />
        <circle cx={centerX + 70} cy={centerY} r="120" fill="none" stroke="#000000" strokeWidth="1.4" />
        
        {/* Phần giao A ∩ B tô sọc */}
        <path d={`M ${centerX} ${centerY - 97} A 120 120 0 0 1 ${centerX} ${centerY + 97} A 120 120 0 0 1 ${centerX} ${centerY - 97}`} fill="url(#hatch-diagonal)" opacity="0.8" />

        <text x={centerX - 130} y={centerY - 100} fontFamily={fontFamily} fontSize="17" fontStyle="italic">A</text>
        <text x={centerX + 120} y={centerY - 100} fontFamily={fontFamily} fontSize="17" fontStyle="italic">B</text>
        <text x={centerX} y={centerY + 4} fontFamily={fontFamily} fontSize="13" fontStyle="italic" textAnchor="middle">A ∩ B</text>
      </g>
    );
  };

  return (
    <div 
      className="flex-1 w-full h-full flex items-center justify-center p-6 bg-[#E8E8E8] dark:bg-slate-950 overflow-auto select-none"
      onClick={handleBackgroundClick}
    >
      {/* KHUNG GIẤY VẼ A4 TRẮNG TINH VỚI ĐỔ BÓNG WORD CHUẨN */}
      <div 
        className="relative bg-white dark:bg-slate-900 border border-[#E1DFDD] dark:border-slate-800 rounded-[3px] shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)] transition-transform duration-100 ease-out"
        style={{
          width: `${artboardWidth}px`,
          height: `${artboardHeight}px`,
          transform: `scale(${doc.zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >
        {/* SVG CHÍNH CHO TOÀN BỘ ĐỒ HỌA TOÁN HỌC */}
        <svg
          ref={svgRef}
          id="math-artboard-svg"
          viewBox={`0 0 ${artboardWidth} ${artboardHeight}`}
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair"
        >
          <defs>
            {/* Đầu mũi tên trục tọa độ chuẩn */}
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="#000000" />
            </marker>

            {/* Hoa văn gạch chéo chuẩn SGK cho diện tích hình phẳng */}
            <pattern id="hatch-diagonal" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Phân vùng render theo phân hệ */}
          {doc.category === 'graph_2d' && renderGraph2D()}
          {doc.category === 'bbt' && renderBBT()}
          {doc.category === 'plane_trig' && renderPlaneTrig()}
          {doc.category === 'stats_prob' && renderStatsProb()}
        </svg>

        {/* Chỉ báo tọa độ toán học thực tế tại góc giấy */}
        {hoverCoord && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white text-[11px] font-mono rounded pointer-events-none">
            ({hoverCoord.x.toFixed(2)} ; {hoverCoord.y.toFixed(2)})
          </div>
        )}
      </div>
    </div>
  );
}
