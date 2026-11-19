import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Copy, 
  Download, 
  Check, 
  Layers, 
  Sparkles, 
  Eye, 
  Sliders, 
  RefreshCw,
  Palette,
  CheckCircle2,
  FolderKanban,
  Compass
} from 'lucide-react';
import { addDpiToBlob } from '../utils/dpiUtils';

export interface PresetModel {
  id: string;
  name: string;
  category: 'chop' | 'lang_tru' | 'tron_xoay' | 'phang';
  description: string;
  defaultLabels: Record<string, string>;
  renderSvg: (
    labels: Record<string, string>, 
    options: {
      color: string;
      showHeight: boolean;
      showRightAngles: boolean;
      strokeWidth: number;
      fontFamily: string;
    }
  ) => React.ReactNode;
}

// ========================================================
// DANH SÁCH 12+ HÌNH MẪU KINH ĐIỂN CHUẨN SGK VIỆT NAM (EXPORT CHO STUDIO TÍCH HỢP)
// ========================================================
export const PRESET_MODELS: PresetModel[] = [
  {
    id: 'chop_tu_giac_deu',
    name: 'Hình chóp tứ giác đều (S.ABCD)',
    category: 'chop',
    description: 'Đáy ABCD là hình vuông tâm O, đường cao SO vuông góc với đáy.',
    defaultLabels: { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D', O: 'O' },
    renderSvg: (labels, opt) => {
      const S = [300, 70];
      const A = [160, 260];
      const B = [100, 360];
      const C = [380, 360];
      const D = [440, 260];
      const O = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];

      return (
        <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Đáy nét đứt AD, AB */}
          <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} strokeDasharray="5 4" />
          <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} strokeDasharray="5 4" />
          <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />
          <line x1={C[0]} y1={C[1]} x2={D[0]} y2={D[1]} />

          {/* Đường chéo đáy */}
          <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} strokeDasharray="4 4" strokeOpacity="0.6" />
          <line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} strokeDasharray="4 4" strokeOpacity="0.6" />

          {/* Các cạnh bên */}
          <line x1={S[0]} y1={S[1]} x2={A[0]} y2={A[1]} strokeDasharray="5 4" />
          <line x1={S[0]} y1={S[1]} x2={B[0]} y2={B[1]} />
          <line x1={S[0]} y1={S[1]} x2={C[0]} y2={C[1]} />
          <line x1={S[0]} y1={S[1]} x2={D[0]} y2={D[1]} />

          {/* Đường cao SO */}
          {opt.showHeight && (
            <line x1={S[0]} y1={S[1]} x2={O[0]} y2={O[1]} strokeDasharray="5 4" stroke="#e11d48" strokeWidth={opt.strokeWidth + 0.5} />
          )}

          {/* Ký hiệu vuông góc tại O */}
          {opt.showHeight && opt.showRightAngles && (
            <polyline points={`${O[0] - 10},${O[1]} ${O[0] - 10},${O[1] - 8} ${O[0]},${O[1] - 8}`} stroke="#e11d48" strokeWidth="1.2" />
          )}

          {/* Nhãn đỉnh */}
          <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
            <text x={S[0]} y={S[1] - 12} textAnchor="middle">{labels.S || 'S'}</text>
            <text x={A[0] - 14} y={A[1] - 6}>{labels.A || 'A'}</text>
            <text x={B[0] - 14} y={B[1] + 16}>{labels.B || 'B'}</text>
            <text x={C[0] + 10} y={C[1] + 16}>{labels.C || 'C'}</text>
            <text x={D[0] + 12} y={D[1]}>{labels.D || 'D'}</text>
            {opt.showHeight && <text x={O[0] + 8} y={O[1] + 16} fill="#e11d48">{labels.O || 'O'}</text>}
          </g>
        </g>
      );
    }
  },
  {
    id: 'chop_sa_vuong_day',
      name: 'Hình chóp có SA vuông góc đáy (S.ABCD)',
      category: 'chop',
      description: 'Cạnh bên SA thẳng đứng vuông góc với mặt phẳng đáy (ABCD).',
      defaultLabels: { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D' },
      renderSvg: (labels, opt) => {
        const A = [160, 240];
        const S = [160, 70];
        const B = [110, 360];
        const C = [390, 360];
        const D = [440, 240];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy */}
            <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} strokeDasharray="5 4" />
            <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} strokeDasharray="5 4" />
            <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />
            <line x1={C[0]} y1={C[1]} x2={D[0]} y2={D[1]} />

            {/* Cạnh bên SA (đường cao) */}
            <line x1={S[0]} y1={S[1]} x2={A[0]} y2={A[1]} strokeDasharray="5 4" stroke="#0d9488" strokeWidth={opt.strokeWidth + 0.5} />
            <line x1={S[0]} y1={S[1]} x2={B[0]} y2={B[1]} />
            <line x1={S[0]} y1={S[1]} x2={C[0]} y2={C[1]} />
            <line x1={S[0]} y1={S[1]} x2={D[0]} y2={D[1]} />

            {/* Ký hiệu vuông góc tại A */}
            {opt.showRightAngles && (
              <>
                <polyline points={`${A[0] + 12},${A[1]} ${A[0] + 12},${A[1] - 10} ${A[0]},${A[1] - 10}`} stroke="#0d9488" strokeWidth="1.2" />
                <polyline points={`${A[0] - 6},${A[1] + 10} ${A[0] + 2},${A[1] + 12} ${A[0] + 8},${A[1] + 2}`} stroke="#0d9488" strokeWidth="1.2" />
              </>
            )}

            {/* Nhãn đỉnh */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={S[0]} y={S[1] - 12} textAnchor="middle">{labels.S || 'S'}</text>
              <text x={A[0] - 16} y={A[1] + 4}>{labels.A || 'A'}</text>
              <text x={B[0] - 14} y={B[1] + 16}>{labels.B || 'B'}</text>
              <text x={C[0] + 10} y={C[1] + 16}>{labels.C || 'C'}</text>
              <text x={D[0] + 12} y={D[1]}>{labels.D || 'D'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'chop_tam_giac_deu',
      name: 'Hình chóp tam giác đều (S.ABC)',
      category: 'chop',
      description: 'Đáy ABC là tam giác đều trọng tâm G, đường cao SG vuông góc đáy.',
      defaultLabels: { S: 'S', A: 'A', B: 'B', C: 'C', G: 'G' },
      renderSvg: (labels, opt) => {
        const S = [280, 70];
        const A = [130, 270];
        const B = [220, 370];
        const C = [430, 270];
        // Trọng tâm G
        const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy: AC nét đứt, AB và BC nét liền */}
            <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} strokeDasharray="5 4" />
            <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} />
            <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />

            {/* Cạnh bên */}
            <line x1={S[0]} y1={S[1]} x2={A[0]} y2={A[1]} />
            <line x1={S[0]} y1={S[1]} x2={B[0]} y2={B[1]} />
            <line x1={S[0]} y1={S[1]} x2={C[0]} y2={C[1]} />

            {/* Đường cao SG */}
            {opt.showHeight && (
              <>
                <line x1={S[0]} y1={S[1]} x2={G[0]} y2={G[1]} strokeDasharray="5 4" stroke="#e11d48" strokeWidth={opt.strokeWidth + 0.5} />
                <line x1={B[0]} y1={B[1]} x2={(A[0] + C[0]) / 2} y2={(A[1] + C[1]) / 2} strokeDasharray="4 4" strokeOpacity="0.5" />
              </>
            )}

            {/* Nhãn đỉnh */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={S[0]} y={S[1] - 12} textAnchor="middle">{labels.S || 'S'}</text>
              <text x={A[0] - 16} y={A[1] + 4}>{labels.A || 'A'}</text>
              <text x={B[0]} y={B[1] + 20} textAnchor="middle">{labels.B || 'B'}</text>
              <text x={C[0] + 12} y={C[1] + 4}>{labels.C || 'C'}</text>
              {opt.showHeight && <text x={G[0] + 10} y={G[1] + 10} fill="#e11d48">{labels.G || 'G'}</text>}
            </g>
          </g>
        );
      }
    },
    {
      id: 'hinh_hop_chu_nhat',
      name: 'Hình hộp chữ nhật / Lập phương (ABCD.A\'B\'C\'D\')',
      category: 'lang_tru',
      description: '8 đỉnh, 12 cạnh, mặt phẳng đáy và nắp song song với các nét khuất chuẩn mực.',
      defaultLabels: { A: 'A', B: 'B', C: 'C', D: 'D', A1: "A'", B1: "B'", C1: "C'", D1: "D'" },
      renderSvg: (labels, opt) => {
        const h = 160;
        // Đáy dưới ABCD
        const A = [160, 230];
        const B = [100, 340];
        const C = [360, 340];
        const D = [420, 230];

        // Đáy trên A'B'C'D'
        const A1 = [A[0], A[1] - h];
        const B1 = [B[0], B[1] - h];
        const C1 = [C[0], C[1] - h];
        const D1 = [D[0], D[1] - h];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy dưới */}
            <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} strokeDasharray="5 4" />
            <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} strokeDasharray="5 4" />
            <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />
            <line x1={C[0]} y1={C[1]} x2={D[0]} y2={D[1]} />

            {/* Đáy trên (toàn bộ nét liền) */}
            <polygon points={`${A1[0]},${A1[1]} ${B1[0]},${B1[1]} ${C1[0]},${C1[1]} ${D1[0]},${D1[1]}`} />

            {/* Các cạnh bên thẳng đứng */}
            <line x1={A[0]} y1={A[1]} x2={A1[0]} y2={A1[1]} strokeDasharray="5 4" />
            <line x1={B[0]} y1={B[1]} x2={B1[0]} y2={B1[1]} />
            <line x1={C[0]} y1={C[1]} x2={C1[0]} y2={C1[1]} />
            <line x1={D[0]} y1={D[1]} x2={D1[0]} y2={D1[1]} />

            {/* Nhãn đỉnh */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={A1[0] - 16} y={A1[1]}>{labels.A1 || "A'"}</text>
              <text x={B1[0] - 16} y={B1[1] + 4}>{labels.B1 || "B'"}</text>
              <text x={C1[0] + 10} y={C1[1] + 4}>{labels.C1 || "C'"}</text>
              <text x={D1[0] + 12} y={D1[1]}>{labels.D1 || "D'"}</text>

              <text x={A[0] - 16} y={A[1] + 4}>{labels.A || 'A'}</text>
              <text x={B[0] - 16} y={B[1] + 16}>{labels.B || 'B'}</text>
              <text x={C[0] + 10} y={C[1] + 16}>{labels.C || 'C'}</text>
              <text x={D[0] + 12} y={D[1]}>{labels.D || 'D'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'lang_tru_tam_giac',
      name: 'Hình lăng trụ tam giác đứng (ABC.A\'B\'C\')',
      category: 'lang_tru',
      description: 'Lăng trụ có 2 đáy tam giác song song và 3 mặt bên hình chữ nhật.',
      defaultLabels: { A: 'A', B: 'B', C: 'C', A1: "A'", B1: "B'", C1: "C'" },
      renderSvg: (labels, opt) => {
        const h = 180;
        const A = [130, 310];
        const B = [250, 380];
        const C = [420, 310];

        const A1 = [A[0], A[1] - h];
        const B1 = [B[0], B[1] - h];
        const C1 = [C[0], C[1] - h];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy dưới */}
            <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} strokeDasharray="5 4" />
            <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} />
            <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />

            {/* Đáy trên */}
            <polygon points={`${A1[0]},${A1[1]} ${B1[0]},${B1[1]} ${C1[0]},${C1[1]}`} />

            {/* Các cạnh bên */}
            <line x1={A[0]} y1={A[1]} x2={A1[0]} y2={A1[1]} />
            <line x1={B[0]} y1={B[1]} x2={B1[0]} y2={B1[1]} />
            <line x1={C[0]} y1={C[1]} x2={C1[0]} y2={C1[1]} />

            {/* Nhãn đỉnh */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={A1[0] - 16} y={A1[1]}>{labels.A1 || "A'"}</text>
              <text x={B1[0]} y={B1[1] - 8} textAnchor="middle">{labels.B1 || "B'"}</text>
              <text x={C1[0] + 12} y={C1[1]}>{labels.C1 || "C'"}</text>

              <text x={A[0] - 16} y={A[1] + 10}>{labels.A || 'A'}</text>
              <text x={B[0]} y={B[1] + 20} textAnchor="middle">{labels.B || 'B'}</text>
              <text x={C[0] + 12} y={C[1] + 10}>{labels.C || 'C'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'hinh_non',
      name: 'Khối nón tròn xoay (Cone)',
      category: 'tron_xoay',
      description: 'Đỉnh S, trục SO, bán kính đáy R, đường sinh l và đáy hình elip.',
      defaultLabels: { S: 'S', O: 'O', A: 'A', B: 'B', r: 'R', h: 'h', l: 'l' },
      renderSvg: (labels, opt) => {
        const S = [280, 80];
        const O = [280, 320];
        const rx = 150;
        const ry = 42;
        const A = [O[0] - rx, O[1]];
        const B = [O[0] + rx, O[1]];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy Elip: nửa dưới nét liền, nửa trên nét đứt */}
            {/* Nửa trên nét đứt (từ A sang B qua cung trên) */}
            <path d={`M ${A[0]} ${A[1]} A ${rx} ${ry} 0 0 1 ${B[0]} ${B[1]}`} strokeDasharray="5 4" />
            {/* Nửa dưới nét liền */}
            <path d={`M ${A[0]} ${A[1]} A ${rx} ${ry} 0 0 0 ${B[0]} ${B[1]}`} />

            {/* Đường sinh SA, SB */}
            <line x1={S[0]} y1={S[1]} x2={A[0]} y2={A[1]} />
            <line x1={S[0]} y1={S[1]} x2={B[0]} y2={B[1]} />

            {/* Trục SO và Bán kính OA */}
            {opt.showHeight && (
              <>
                <line x1={S[0]} y1={S[1]} x2={O[0]} y2={O[1]} strokeDasharray="5 4" stroke="#e11d48" strokeWidth={opt.strokeWidth + 0.5} />
                <line x1={O[0]} y1={O[1]} x2={B[0]} y2={B[1]} strokeDasharray="5 4" stroke="#0d9488" strokeWidth={opt.strokeWidth + 0.5} />
              </>
            )}

            {/* Vuông góc tại O */}
            {opt.showHeight && opt.showRightAngles && (
              <polyline points={`${O[0] + 12},${O[1]} ${O[0] + 12},${O[1] - 10} ${O[0]},${O[1] - 10}`} stroke="#e11d48" strokeWidth="1.2" />
            )}

            {/* Nhãn đỉnh và kích thước */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={S[0]} y={S[1] - 12} textAnchor="middle">{labels.S || 'S'}</text>
              <text x={A[0] - 16} y={A[1] + 4}>{labels.A || 'A'}</text>
              <text x={B[0] + 12} y={B[1] + 4}>{labels.B || 'B'}</text>
              {opt.showHeight && <text x={O[0] - 14} y={O[1] + 16} fill="#e11d48">{labels.O || 'O'}</text>}

              {/* Nhãn h, r, l */}
              <text x={S[0] - 14} y={(S[1] + O[1]) / 2} fill="#e11d48" fontSize="14" fontStyle="italic">{labels.h || 'h'}</text>
              <text x={(O[0] + B[0]) / 2} y={O[1] - 8} fill="#0d9488" fontSize="14" fontStyle="italic">{labels.r || 'R'}</text>
              <text x={(S[0] + B[0]) / 2 + 14} y={(S[1] + B[1]) / 2} fill="#64748b" fontSize="14" fontStyle="italic">{labels.l || 'l'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'hinh_tru',
      name: 'Khối trụ tròn xoay (Cylinder)',
      category: 'tron_xoay',
      description: 'Hai đáy elip song song bán kính R, trục OO\' và đường sinh h.',
      defaultLabels: { O: 'O', O1: "O'", A: 'A', B: 'B', r: 'R', h: 'h' },
      renderSvg: (labels, opt) => {
        const h = 180;
        const rx = 140;
        const ry = 36;
        const O1 = [280, 120];
        const O = [280, 120 + h];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đáy trên O' (toàn bộ nét liền) */}
            <ellipse cx={O1[0]} cy={O1[1]} rx={rx} ry={ry} />

            {/* Đáy dưới O: nửa trên nét đứt, nửa dưới nét liền */}
            <path d={`M ${O[0] - rx} ${O[1]} A ${rx} ${ry} 0 0 1 ${O[0] + rx} ${O[1]}`} strokeDasharray="5 4" />
            <path d={`M ${O[0] - rx} ${O[1]} A ${rx} ${ry} 0 0 0 ${O[0] + rx} ${O[1]}`} />

            {/* Hai đường sinh hai bên */}
            <line x1={O1[0] - rx} y1={O1[1]} x2={O[0] - rx} y2={O[1]} />
            <line x1={O1[0] + rx} y1={O1[1]} x2={O[0] + rx} y2={O[1]} />

            {/* Trục OO' */}
            {opt.showHeight && (
              <>
                <line x1={O1[0]} y1={O1[1]} x2={O[0]} y2={O[1]} strokeDasharray="5 4" stroke="#e11d48" strokeWidth={opt.strokeWidth + 0.5} />
                <line x1={O1[0]} y1={O1[1]} x2={O1[0] + rx} y2={O1[1]} stroke="#0d9488" strokeWidth={opt.strokeWidth + 0.5} />
              </>
            )}

            {/* Nhãn */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={O1[0] - 14} y={O1[1] - 8} fill="#e11d48">{labels.O1 || "O'"}</text>
              <text x={O[0] - 14} y={O[1] + 16} fill="#e11d48">{labels.O || 'O'}</text>
              <text x={(O1[0] + O1[0] + rx) / 2} y={O1[1] - 8} fill="#0d9488" fontSize="14" fontStyle="italic">{labels.r || 'R'}</text>
              <text x={O1[0] - rx - 18} y={O1[1] + h / 2} fill="#64748b" fontSize="14" fontStyle="italic">{labels.h || 'h'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'hinh_cau',
      name: 'Mặt cầu & Khối cầu (Sphere)',
      category: 'tron_xoay',
      description: 'Đường tròn lớn tâm O bán kính R, vòng xích đạo elip phối cảnh không gian.',
      defaultLabels: { O: 'O', R: 'R' },
      renderSvg: (labels, opt) => {
        const O = [280, 220];
        const R = 140;
        const ry = 45;

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Đường tròn bao ngoài */}
            <circle cx={O[0]} cy={O[1]} r={R} />

            {/* Vòng xích đạo Elip: nửa sau nét đứt, nửa trước nét liền */}
            <path d={`M ${O[0] - R} ${O[1]} A ${R} ${ry} 0 0 1 ${O[0] + R} ${O[1]}`} strokeDasharray="5 4" strokeOpacity="0.7" />
            <path d={`M ${O[0] - R} ${O[1]} A ${R} ${ry} 0 0 0 ${O[0] + R} ${O[1]}`} />

            {/* Tâm O và bán kính R */}
            <circle cx={O[0]} cy={O[1]} r="3" fill="#e11d48" stroke="none" />
            <line x1={O[0]} y1={O[1]} x2={O[0] + R} y2={O[1]} strokeDasharray="5 4" stroke="#0d9488" strokeWidth={opt.strokeWidth + 0.5} />

            {/* Nhãn */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={O[0] - 14} y={O[1] - 8} fill="#e11d48">{labels.O || 'O'}</text>
              <text x={O[0] + R / 2} y={O[1] - 8} fill="#0d9488" fontSize="14" fontStyle="italic">{labels.R || 'R'}</text>
            </g>
          </g>
        );
      }
    },
    {
      id: 'tam_giac_vuong_cao',
      name: 'Tam giác vuông & Hệ thức lượng (2D)',
      category: 'phang',
      description: 'Tam giác ABC vuông tại A có đường cao AH, ký hiệu góc vuông chuẩn SGK.',
      defaultLabels: { A: 'A', B: 'B', C: 'C', H: 'H' },
      renderSvg: (labels, opt) => {
        const A = [220, 110];
        const B = [100, 330];
        const C = [460, 330];

        // Chân đường cao H: hình chiếu A lên BC
        const H = [A[0], B[1]];

        return (
          <g stroke={opt.color} strokeWidth={opt.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <polygon points={`${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`} />
            <line x1={A[0]} y1={A[1]} x2={H[0]} y2={H[1]} stroke="#e11d48" strokeWidth={opt.strokeWidth + 0.5} />

            {/* Ký hiệu vuông góc tại H */}
            {opt.showRightAngles && (
              <>
                <polyline points={`${H[0] + 12},${H[1]} ${H[0] + 12},${H[1] - 12} ${H[0]},${H[1] - 12}`} stroke="#e11d48" strokeWidth="1.2" />
                <polyline points={`${A[0] - 10},${A[1] + 15} ${A[0]},${A[1] + 20} ${A[0] + 10},${A[1] + 6}`} stroke="#0f172a" strokeWidth="1.2" />
              </>
            )}

            {/* Nhãn đỉnh */}
            <g fill={opt.color} stroke="none" fontSize="16" fontWeight="bold">
              <text x={A[0]} y={A[1] - 12} textAnchor="middle">{labels.A || 'A'}</text>
              <text x={B[0] - 16} y={B[1] + 16}>{labels.B || 'B'}</text>
              <text x={C[0] + 10} y={C[1] + 16}>{labels.C || 'C'}</text>
              <text x={H[0]} y={H[1] + 18} textAnchor="middle" fill="#e11d48">{labels.H || 'H'}</text>
            </g>
          </g>
        );
      }
    }
  ];

export interface GeometryPresetGalleryProps {
  onLoadIntoGsp?: (presetId: string) => void;
  onLoadInto3D?: (presetId: string) => void;
  selectedPresetId?: string;
}

export default function GeometryPresetGallery({
  onLoadIntoGsp,
  onLoadInto3D,
  selectedPresetId
}: GeometryPresetGalleryProps = {}) {
  const [selectedId, setSelectedId] = useState<string>(selectedPresetId || 'chop_tu_giac_deu');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'chop' | 'lang_tru' | 'tron_xoay' | 'phang'>('all');
  
  // Tùy chọn hiển thị
  const [themeColor, setThemeColor] = useState<string>('#0f172a'); // slate-900 chuẩn mực
  const [showHeight, setShowHeight] = useState<boolean>(true);
  const [showRightAngles, setShowRightAngles] = useState<boolean>(true);
  const [strokeWidth, setStrokeWidth] = useState<number>(1.8);
  const [fontFamily, setFontFamily] = useState<'times' | 'sans'>('times');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Nhãn đỉnh tùy chỉnh
  const [customLabels, setCustomLabels] = useState<Record<string, Record<string, string>>>({
    chop_tam_giac: { S: 'S', A: 'A', B: 'B', C: 'C', H: 'H' },
    chop_sa_vuong_day: { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D' },
    chop_tu_giac_deu: { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D', O: 'O' },
    chop_tam_giac_deu: { S: 'S', A: 'A', B: 'B', C: 'C', G: 'G' },
    lang_tru_tam_giac: { A: 'A', B: 'B', C: 'C', A1: "A'", B1: "B'", C1: "C'" },
    hinh_hop_chu_nhat: { A: 'A', B: 'B', C: 'C', D: 'D', A1: "A'", B1: "B'", C1: "C'", D1: "D'" },
    hinh_non: { S: 'S', O: 'O', A: 'A', B: 'B', r: 'R', h: 'h', l: 'l' },
    hinh_tru: { O: 'O', O1: "O'", A: 'A', B: 'B', r: 'R', h: 'h' },
    hinh_cau: { O: 'O', R: 'R' },
    bat_dien_deu: { S: 'S', S1: "S'", A: 'A', B: 'B', C: 'C', D: 'D' },
    tam_giac_vuong_cao: { A: 'A', B: 'B', C: 'C', H: 'H' },
    duong_tron_noi_tiep: { A: 'A', B: 'B', C: 'C', I: 'I', r: 'r' }
  });

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (selectedPresetId && selectedPresetId !== selectedId) {
      setSelectedId(selectedPresetId);
    }
  }, [selectedPresetId]);

  const currentPreset = PRESET_MODELS.find(m => m.id === selectedId) || PRESET_MODELS[0];
  const activeLabels = customLabels[selectedId] || currentPreset.defaultLabels;

  const handleUpdateLabel = (key: string, val: string) => {
    setCustomLabels(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || currentPreset.defaultLabels),
        [key]: val
      }
    }));
  };

  // ========================================================
  // SAO CHÉP & XUẤT ẢNH PNG 300 DPI CHUẨN MICROSOFT WORD
  // ========================================================
  const handleCopyImage = async () => {
    if (!svgRef.current) return;
    try {
      const svg = svgRef.current;
      let svgData = new XMLSerializer().serializeToString(svg);
      if (!svgData.includes('xmlns=')) {
        svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 3;
      const width = 560;
      const height = 440;
      canvas.width = width * scale;
      canvas.height = height * scale;

      // Nền trắng tinh khiết chống lỗi viền đen trong Word
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      img.onload = async () => {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        window.URL.revokeObjectURL(blobURL);

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) return;

        try {
          const blobWithDpi = await addDpiToBlob(blob, 300);
          const dataUrl = canvas.toDataURL('image/png');
          const htmlBlob = new Blob([`<img src="${dataUrl}" alt="Hinh hoc ${selectedId}" width="${width}" height="${height}" />`], { type: 'text/html' });

          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blobWithDpi, 'text/html': htmlBlob })
            ]);
          } catch {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blobWithDpi })
            ]);
          }

          setCopyStatus('copied');
          setTimeout(() => setCopyStatus(null), 3500);
        } catch (err) {
          console.error(err);
          const a = document.createElement('a');
          a.download = `${selectedId}_300DPI_${Date.now()}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
          setCopyStatus('downloaded');
          setTimeout(() => setCopyStatus(null), 3500);
        }
      };

      img.onerror = () => {
        window.URL.revokeObjectURL(blobURL);
        console.error('Không thể render SVG sang Canvas');
      };

      img.src = blobURL;
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes('xmlns=')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 3;
    const width = 560;
    const height = 440;
    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    img.onload = async () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      window.URL.revokeObjectURL(blobURL);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const blobWithDpi = await addDpiToBlob(blob, 300);
        const url = window.URL.createObjectURL(blobWithDpi);
        const a = document.createElement('a');
        a.download = `Hinh_hoc_${selectedId}_300DPI.png`;
        a.href = url;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    };
    img.src = blobURL;
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Hinh_hoc_${selectedId}.svg`;
    a.href = url;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredPresets = PRESET_MODELS.filter(m => 
    categoryFilter === 'all' ? true : m.category === categoryFilter
  );

  const fontFamilyStyle = fontFamily === 'times' 
    ? '"Times New Roman", Times, "Cambria Math", serif' 
    : 'system-ui, -apple-system, sans-serif';

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <FolderKanban size={20} />
            </div>
            <span>Thư Viện Hình Mẫu Không Gian & 2D Kinh Điển</span>
          </h2>
        </div>

        {/* Nút lọc phân loại */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-wrap">
          {[
            { id: 'all', label: 'Tất cả mẫu' },
            { id: 'chop', label: 'Hình chóp' },
            { id: 'lang_tru', label: 'Lăng trụ & Hộp' },
            { id: 'tron_xoay', label: 'Nón - Trụ - Cầu' },
            { id: 'phang', label: 'Hình 2D' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID BODY: BÊN TRÁI DANH SÁCH MẪU & CẤU HÌNH, BÊN PHẢI KHUNG XEM TRƯỚC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5 CỘT): CHỌN MẪU & TÙY BIẾN ĐỈNH */}
        <div className="lg:col-span-5 space-y-5">
          {/* DANH SÁCH CÁC MẪU HÌNH DẠNG GRID CARD */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Chọn mẫu hình học:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = preset.id === selectedId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedId(preset.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="truncate">{preset.name}</span>
                      {isSelected && <Check size={14} className="text-teal-600 shrink-0 ml-1" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TÙY CHỈNH TÊN CÁC ĐỈNH */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={15} />
              <span>Sửa tên các đỉnh theo đề bài:</span>
            </h3>

            <div className="flex flex-wrap gap-3">
              {Object.keys(currentPreset.defaultLabels).map((key) => (
                <div key={key} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-mono text-slate-400">{key}:</span>
                  <input
                    type="text"
                    value={activeLabels[key] !== undefined ? activeLabels[key] : currentPreset.defaultLabels[key]}
                    onChange={(e) => handleUpdateLabel(key, e.target.value)}
                    maxLength={4}
                    className="w-10 text-center font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>

            {/* CÁC TÙY CHỌN BẬT/TẮT NÉT */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeight}
                  onChange={(e) => setShowHeight(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Hiện đường cao / trục</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRightAngles}
                  onChange={(e) => setShowRightAngles(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Ký hiệu góc vuông</span>
              </label>

              <div className="flex items-center gap-2">
                <span>Màu nét:</span>
                <select
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="#0f172a">Đen truyền thống</option>
                  <option value="#1e3a8a">Xanh Navy học đường</option>
                  <option value="#0d9488">Ngọc Lam (Teal)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span>Phông chữ:</span>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="times">Times New Roman</option>
                  <option value="sans">Sans-serif</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 CỘT): KHUNG VẼ BẰNG SVG & NÚT XUẤT ẢNH */}
        <div className="lg:col-span-7 space-y-4">
          {/* THANH XUẤT ẢNH */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
              {currentPreset.name}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onLoadIntoGsp && (
                <button
                  onClick={() => onLoadIntoGsp(selectedId)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Nạp mẫu này vào Bảng vẽ GSP để vẽ thêm nét, thêm điểm, góc vuông & kéo thả đỉnh"
                >
                  <Compass size={14} />
                  <span>Dựng trên Bảng vẽ GSP</span>
                </button>
              )}

              {onLoadInto3D && (currentPreset.category === 'chop' || currentPreset.category === 'lang_tru') && (
                <button
                  onClick={() => onLoadInto3D(selectedId)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Mở mô hình 3D tương tác để xoay 360 độ quan sát đa chiều"
                >
                  <Box size={14} />
                  <span>Xoay 3D (360°)</span>
                </button>
              )}

              <button
                onClick={handleCopyImage}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Sao chép ảnh chất lượng cao để dán ngay (Ctrl+V) vào Microsoft Word"
              >
                {copyStatus === 'copied' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép ảnh (Dán Word)'}</span>
              </button>

              <button
                onClick={handleDownloadPng}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Tải ảnh PNG"
              >
                <Download size={13} />
                <span>Tải PNG</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Tải file vector SVG"
              >
                <Download size={13} />
                <span>SVG</span>
              </button>
            </div>
          </div>

          {/* VÙNG VẼ SVG BẢN VẼ HÌNH HỌC */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[440px]">
            <svg
              ref={svgRef}
              viewBox="0 0 560 440"
              className="w-full max-w-[560px] h-auto select-none"
              style={{ fontFamily: fontFamilyStyle, backgroundColor: '#ffffff' }}
            >
              {currentPreset.renderSvg(activeLabels, {
                color: themeColor,
                showHeight,
                showRightAngles,
                strokeWidth,
                fontFamily
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
