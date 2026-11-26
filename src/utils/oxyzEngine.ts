import type { GspPoint, GspSegment, GspText, GspChartItem } from '../components/GspSketchpad';
import { getOxyzStickerById } from './oxyzStickers';

export interface OxyzPointInput {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  showProjection?: boolean;      // Hạ đường vuông góc xuống (Oxy) tạo P'
  projectionLabel?: string;      // Nhãn hình chiếu trên (Oxy), vd A'
  showAxisProjections?: boolean; // Kẻ nét đứt từ P' vào Ox, Oy
  stickerId?: string;            // Sticker gắn tại điểm (vd 'balloon_pink_blue')
  stickerScale?: number;         // Tỉ lệ kích thước sticker (mặc định 1.0)
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface OxyzSegmentInput {
  id: string;
  fromLabel: string; // Tên điểm đầu (vd 'B', 'O', 'A')
  toLabel: string;   // Tên điểm cuối (vd 'F', 'E', 'A')
  style: 'solid' | 'dashed';
  color: string;
  isVector?: boolean;
}

export interface OxyzSceneConfig {
  presetName?: string;
  originX?: number;
  originY?: number;
  scale?: number;
  axisXPos?: number;
  axisXNeg?: number;
  axisYPos?: number;
  axisYNeg?: number;
  axisZPos?: number;
  points: OxyzPointInput[];
  segments: OxyzSegmentInput[];
}

export interface OxyzViewVectors {
  ox: { x: number; y: number };
  oy: { x: number; y: number };
  oz: { x: number; y: number };
}

export const DEFAULT_OXYZ_VECTORS: OxyzViewVectors = {
  ox: { x: -0.68, y: 0.56 },
  oy: { x: 0.95, y: 0.24 },
  oz: { x: 0, y: -1 }
};

export function projectOxyzPoint(
  x: number,
  y: number,
  z: number,
  originX = 345,
  originY = 335,
  scale = 40,
  vectors: OxyzViewVectors = DEFAULT_OXYZ_VECTORS
): { x: number; y: number } {
  return {
    x: Math.round(originX + scale * (x * vectors.ox.x + y * vectors.oy.x + z * vectors.oz.x)),
    y: Math.round(originY + scale * (x * vectors.ox.y + y * vectors.oy.y + z * vectors.oz.y))
  };
}

export const OXYZ_PRESET_BALLOONS: OxyzSceneConfig = {
  presetName: 'Bài toán thực tế Oxyz – 2 Khinh khí cầu',
  originX: 345,
  originY: 335,
  scale: 40,
  axisXPos: 4.5,
  axisXNeg: 3.6,
  axisYPos: 5.3,
  axisYNeg: 4.6,
  axisZPos: 5.6,
  points: [
    {
      id: 'b_pt_a',
      label: 'A',
      x: 2.3,
      y: 4.0,
      z: 3.4,
      color: '#000000',
      showProjection: true,
      projectionLabel: "A'",
      showAxisProjections: true,
      stickerId: 'balloon_pink_blue',
      stickerScale: 1,
      labelOffsetX: 16,
      labelOffsetY: -6
    },
    {
      id: 'b_pt_b',
      label: 'B',
      x: -1.6,
      y: -3.2,
      z: 3.6,
      color: '#000000',
      showProjection: true,
      projectionLabel: "B'",
      showAxisProjections: true,
      stickerId: 'balloon_pink_blue',
      stickerScale: 1,
      labelOffsetX: -30,
      labelOffsetY: -6
    },
    {
      id: 'b_pt_e',
      label: 'E',
      x: 1.5,
      y: 2.2,
      z: 0,
      color: '#000000',
      showProjection: false,
      showAxisProjections: false,
      labelOffsetX: 10,
      labelOffsetY: 10
    },
    {
      id: 'b_pt_f',
      label: 'F',
      x: -0.9,
      y: -1.0,
      z: 0,
      color: '#000000',
      showProjection: false,
      showAxisProjections: false,
      labelOffsetX: -24,
      labelOffsetY: 6
    }
  ],
  segments: [
    { id: 'b_seg_1', fromLabel: 'B', toLabel: 'F', style: 'dashed', color: '#dc2626' },
    { id: 'b_seg_2', fromLabel: 'F', toLabel: 'E', style: 'dashed', color: '#dc2626' },
    { id: 'b_seg_3', fromLabel: 'E', toLabel: 'A', style: 'dashed', color: '#dc2626' }
  ]
};

export const OXYZ_PRESET_STANDARD: OxyzSceneConfig = {
  presetName: 'Hệ trục tọa độ Oxyz chuẩn SGK',
  originX: 350,
  originY: 315,
  scale: 42,
  axisXPos: 4.5,
  axisXNeg: 2.0,
  axisYPos: 5.0,
  axisYNeg: 2.0,
  axisZPos: 5.2,
  points: [
    {
      id: 's_pt_m',
      label: 'M',
      x: 2.4,
      y: 3.2,
      z: 3.0,
      color: '#000000',
      showProjection: true,
      projectionLabel: "M'",
      showAxisProjections: true,
      labelOffsetX: 10,
      labelOffsetY: -8
    }
  ],
  segments: [
    { id: 's_seg_1', fromLabel: 'O', toLabel: 'M', style: 'solid', color: '#0284c7', isVector: true }
  ]
};

export const OXYZ_PRESET_RADAR_PLANE: OxyzSceneConfig = {
  presetName: 'Trạm Radar & Máy bay (Oxyz)',
  originX: 340,
  originY: 335,
  scale: 40,
  axisXPos: 4.4,
  axisXNeg: 2.8,
  axisYPos: 5.2,
  axisYNeg: 3.0,
  axisZPos: 5.4,
  points: [
    {
      id: 'r_pt_a',
      label: 'A',
      x: 1.8,
      y: 3.5,
      z: 3.6,
      color: '#000000',
      showProjection: true,
      projectionLabel: "A'",
      showAxisProjections: true,
      stickerId: 'airplane',
      stickerScale: 1,
      labelOffsetX: 26,
      labelOffsetY: -12
    },
    {
      id: 'r_pt_b',
      label: 'B',
      x: -1.4,
      y: 0.4,
      z: 1.5,
      color: '#000000',
      showProjection: true,
      projectionLabel: "B'",
      showAxisProjections: false,
      stickerId: 'radar_tower',
      stickerScale: 0.9,
      labelOffsetX: -28,
      labelOffsetY: -10
    }
  ],
  segments: [
    { id: 'r_seg_1', fromLabel: 'B', toLabel: 'A', style: 'dashed', color: '#dc2626' },
    { id: 'r_seg_2', fromLabel: 'O', toLabel: 'A', style: 'dashed', color: '#2563eb' }
  ]
};

/**
 * Chuyển cấu hình OxyzSceneConfig thành tập đối tượng cho GspSketchpad
 */
export function buildOxyzScene(config: OxyzSceneConfig): {
  points: GspPoint[];
  segments: GspSegment[];
  texts: GspText[];
  charts: GspChartItem[];
} {
  const ox = config.originX ?? 345;
  const oy = config.originY ?? 335;
  const scale = config.scale ?? 40;
  const xPos = config.axisXPos ?? 4.5;
  const xNeg = config.axisXNeg ?? 3.5;
  const yPos = config.axisYPos ?? 5.2;
  const yNeg = config.axisYNeg ?? 4.5;
  const zPos = config.axisZPos ?? 5.5;

  const ts = Date.now();
  const points: GspPoint[] = [];
  const segments: GspSegment[] = [];
  const texts: GspText[] = [];
  const charts: GspChartItem[] = [];

  const labelToPointId = new Map<string, string>();

  // 1. Gốc tọa độ O và các đầu trục Ox, Oy, Oz
  const pO2D = projectOxyzPoint(0, 0, 0, ox, oy, scale);
  const pO: GspPoint = {
    id: `oxyz_O_${ts}`,
    x: pO2D.x,
    y: pO2D.y,
    label: 'O',
    color: '#000000',
    labelOffsetX: -4,
    labelOffsetY: 22
  };
  points.push(pO);
  labelToPointId.set('O', pO.id);

  // Trục Ox (phần âm -> phần dương mũi tên)
  const pXNeg2D = projectOxyzPoint(-xNeg, 0, 0, ox, oy, scale);
  const pXPos2D = projectOxyzPoint(xPos, 0, 0, ox, oy, scale);
  const pXNeg: GspPoint = { id: `oxyz_xn_${ts}`, x: pXNeg2D.x, y: pXNeg2D.y, label: '', hideDot: true, hideLabel: true };
  const pXPos: GspPoint = { id: `oxyz_xp_${ts}`, x: pXPos2D.x, y: pXPos2D.y, label: 'x', hideDot: true, labelOffsetX: -14, labelOffsetY: 24 };
  points.push(pXNeg, pXPos);
  segments.push({
    id: `oxyz_ax_x_${ts}`,
    p1Id: xNeg > 0 ? pXNeg.id : pO.id,
    p2Id: pXPos.id,
    style: 'solid',
    color: '#000000',
    width: 1.5,
    isVector: true,
    vectorEnd: 'p2'
  });

  // Trục Oy
  const pYNeg2D = projectOxyzPoint(0, -yNeg, 0, ox, oy, scale);
  const pYPos2D = projectOxyzPoint(0, yPos, 0, ox, oy, scale);
  const pYNeg: GspPoint = { id: `oxyz_yn_${ts}`, x: pYNeg2D.x, y: pYNeg2D.y, label: '', hideDot: true, hideLabel: true };
  const pYPos: GspPoint = { id: `oxyz_yp_${ts}`, x: pYPos2D.x, y: pYPos2D.y, label: 'y', hideDot: true, labelOffsetX: 4, labelOffsetY: 24 };
  points.push(pYNeg, pYPos);
  segments.push({
    id: `oxyz_ax_y_${ts}`,
    p1Id: yNeg > 0 ? pYNeg.id : pO.id,
    p2Id: pYPos.id,
    style: 'solid',
    color: '#000000',
    width: 1.5,
    isVector: true,
    vectorEnd: 'p2'
  });

  // Trục Oz
  const pZPos2D = projectOxyzPoint(0, 0, zPos, ox, oy, scale);
  const pZPos: GspPoint = { id: `oxyz_zp_${ts}`, x: pZPos2D.x, y: pZPos2D.y, label: 'z', hideDot: true, labelOffsetX: 10, labelOffsetY: 14 };
  points.push(pZPos);
  segments.push({
    id: `oxyz_ax_z_${ts}`,
    p1Id: pO.id,
    p2Id: pZPos.id,
    style: 'solid',
    color: '#000000',
    width: 1.5,
    isVector: true,
    vectorEnd: 'p2'
  });

  // 2. Các điểm không gian và hình chiếu + Sticker
  config.points.forEach((pt, idx) => {
    const pos = projectOxyzPoint(pt.x, pt.y, pt.z, ox, oy, scale);
    const sticker = pt.stickerId ? getOxyzStickerById(pt.stickerId) : undefined;

    const defaultOffX = sticker?.suggestedLabelOffset?.x ?? 10;
    const defaultOffY = sticker?.suggestedLabelOffset?.y ?? -8;

    const mainPt: GspPoint = {
      id: `oxyz_pt_${idx}_${ts}`,
      x: pos.x,
      y: pos.y,
      label: pt.label,
      color: pt.color || '#000000',
      hideDot: Boolean(sticker),
      labelOffsetX: pt.labelOffsetX ?? defaultOffX,
      labelOffsetY: pt.labelOffsetY ?? defaultOffY
    };
    points.push(mainPt);
    if (pt.label) {
      labelToPointId.set(pt.label, mainPt.id);
    }

    // Hình chiếu xuống (Oxy) khi z != 0
    if (pt.showProjection && Math.abs(pt.z) > 1e-4) {
      const projPos = projectOxyzPoint(pt.x, pt.y, 0, ox, oy, scale);
      const projLabel = pt.projectionLabel || `${pt.label}'`;
      const projPt: GspPoint = {
        id: `oxyz_proj_${idx}_${ts}`,
        x: projPos.x,
        y: projPos.y,
        label: projLabel,
        color: '#000000',
        labelOffsetX: pt.x >= 0 && pt.y >= 0 ? 10 : -24,
        labelOffsetY: pt.x >= 0 && pt.y >= 0 ? 18 : -8
      };
      points.push(projPt);
      labelToPointId.set(projLabel, projPt.id);

      segments.push({
        id: `oxyz_vproj_${idx}_${ts}`,
        p1Id: mainPt.id,
        p2Id: projPt.id,
        style: 'dashed',
        color: '#000000',
        width: 1.4
      });

      // Hình chiếu từ P' lên trục Ox và Oy
      if (pt.showAxisProjections && Math.abs(pt.x) > 1e-4 && Math.abs(pt.y) > 1e-4) {
        const pxPos = projectOxyzPoint(pt.x, 0, 0, ox, oy, scale);
        const pyPos = projectOxyzPoint(0, pt.y, 0, ox, oy, scale);
        const ptOx: GspPoint = {
          id: `oxyz_px_${idx}_${ts}`,
          x: pxPos.x,
          y: pxPos.y,
          label: '',
          hideDot: true,
          hideLabel: true
        };
        const ptOy: GspPoint = {
          id: `oxyz_py_${idx}_${ts}`,
          x: pyPos.x,
          y: pyPos.y,
          label: '',
          hideDot: true,
          hideLabel: true
        };
        points.push(ptOx, ptOy);
        segments.push(
          {
            id: `oxyz_axp_x_${idx}_${ts}`,
            p1Id: projPt.id,
            p2Id: ptOx.id,
            style: 'dashed',
            color: '#000000',
            width: 1.3
          },
          {
            id: `oxyz_axp_y_${idx}_${ts}`,
            p1Id: projPt.id,
            p2Id: ptOy.id,
            style: 'dashed',
            color: '#000000',
            width: 1.3
          }
        );
      }
    }

    // Gắn sticker minh họa tại điểm nếu có
    if (sticker) {
      const sScale = pt.stickerScale ?? 1;
      const w = Math.round(sticker.defaultWidth * sScale);
      const h = Math.round(sticker.defaultHeight * sScale);
      charts.push({
        id: `sticker_${sticker.id}_${idx}_${ts}`,
        x: Math.round(pos.x - w * sticker.anchorX),
        y: Math.round(pos.y - h * sticker.anchorY),
        width: w,
        height: h,
        svgString: sticker.svgString,
        config: {
          isSticker: true,
          stickerId: sticker.id,
          layer: 'behind_labels',
          keepAspect: true,
          anchorPointId: mainPt.id,
          anchorX: sticker.anchorX,
          anchorY: sticker.anchorY
        }
      });
    }
  });

  // 3. Các đoạn nối bổ sung (đường truyền, khoảng cách, vectơ)
  config.segments.forEach((seg, idx) => {
    const p1Id = labelToPointId.get(seg.fromLabel);
    const p2Id = labelToPointId.get(seg.toLabel);
    if (!p1Id || !p2Id || p1Id === p2Id) return;
    segments.push({
      id: `oxyz_cseg_${idx}_${ts}`,
      p1Id,
      p2Id,
      style: seg.style,
      color: seg.color || '#dc2626',
      width: 1.6,
      isVector: seg.isVector,
      vectorEnd: seg.isVector ? 'p2' : undefined
    });
  });

  return { points, segments, texts, charts };
}
