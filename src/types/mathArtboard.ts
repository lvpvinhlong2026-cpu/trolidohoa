/**
 * @license
 * Trợ lí đồ họa Toán THPT - GDPT 2018 (Kết nối tri thức với cuộc sống)
 * Kiểu dữ liệu trung tâm cho Artboard & Ribbon UI
 */

export type RibbonTabId = 
  | 'home'
  | 'graph_2d'
  | 'bbt'
  | 'plane_trig'
  | 'space_3d'
  | 'stats_prob'
  | 'format'; // Contextual Tab

export type GraphicCategory =
  | 'graph_2d'
  | 'bbt'
  | 'number_line'
  | 'trig_circle'
  | 'plane_geo'
  | 'space_3d'
  | 'venn'
  | 'tree_prob'
  | 'box_plot'
  | 'histogram';

export interface TypographySettings {
  fontFamily: string; // Mặc định 'Times New Roman'
  fontSize: number;   // 13 - 26pt
  isBold: boolean;
  isItalic: boolean;  // Chuẩn ký hiệu biến số x, y, A, B
  isSubscript: boolean;
  isSuperscript: boolean;
  color: string;
}

export interface StrokeFillSettings {
  strokeWidth: number; // 0.75, 1, 1.5, 2 pt
  strokeStyle: 'solid' | 'dashed';
  strokeColor: string;
  fillColor: string;
  hatching: 'none' | 'diagonal_left' | 'diagonal_right' | 'cross' | 'dots';
}

export interface Graph2DConfig {
  type: 
    | 'parabola'
    | 'trig_sin' | 'trig_cos' | 'trig_tan'
    | 'exp_log'
    | 'cubic'
    | 'rational_1_1'
    | 'rational_2_1'
    | 'derivative'
    | 'conic_ellipse' | 'conic_hyperbola' | 'conic_parabola';
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  showAsymptotes: boolean;
  showTangent: boolean;
  tangentX0: number;
  showExtrema: boolean;
  showGrid: boolean;
  gridType: 'decimal' | 'pi';
  showIntegralHatch: boolean;
  integralRange: [number, number];
  showInequalityHatch: boolean;
}

export interface BBTRow {
  label: string; // 'x', "y'", 'y'
  values: string[];
}

export interface BBTConfig {
  type: 'quadratic_sign' | 'cubic' | 'rational_1_1' | 'rational_2_1' | 'custom';
  columns: string[]; // ['-∞', 'x1', 'x2', '+∞']
  signs: string[];   // ['+', '0', '-', '0', '+']
  hasDoubleBar: boolean;
  doubleBarColumnIdx?: number;
  arrows: { fromRow: number; fromCol: number; toRow: number; toCol: number; dir: 'up' | 'down' }[];
  yValues: string[];
  yExtrema: { col: number; val: string; pos: 'top' | 'bottom' | 'mid' }[];
}

export interface PlaneTrigConfig {
  type: 'number_line' | 'unit_circle_half' | 'trig_circle_full' | 'triangle' | 'circle_incirc' | 'quadrilateral' | 'vector';
  intervalType?: 'open' | 'closed' | 'half_open_left' | 'half_open_right';
  intervalA?: number;
  intervalB?: number;
  angleDeg?: number;
  showSinCosAxes?: boolean;
  triangleType?: 'general' | 'right' | 'isosceles' | 'equilateral';
  showRightAngleMark?: boolean;
  vectorA?: [number, number];
  vectorB?: [number, number];
}

export interface Space3DConfig {
  type: 'pyramid_quad' | 'pyramid_tri' | 'pyramid_sa_perp' | 'prism' | 'box' | 'sphere' | 'cone' | 'cylinder' | 'paraboloid_ox';
  showOxyz: boolean;
  showProjectionDashed: boolean;
  showNormalVector: boolean;
  autoHiddenLines: boolean;
  rotX: number;
  rotY: number;
  showSectionPlane: boolean;
  showRightAngle3D: boolean;
}

export interface StatsProbConfig {
  type: 'venn_2' | 'venn_3' | 'bayes_tree' | 'box_plot' | 'histogram';
  boxPlotData?: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers?: number[];
  };
  histogramGroups?: { interval: string; freq: number }[];
  treeLevels?: number;
  vennIntersectionFilled?: boolean;
}

export interface ArtboardDocument {
  id: string;
  name: string;
  category: GraphicCategory;
  typography: TypographySettings;
  strokeFill: StrokeFillSettings;
  graph2D: Graph2DConfig;
  bbt: BBTConfig;
  planeTrig: PlaneTrigConfig;
  space3D: Space3DConfig;
  statsProb: StatsProbConfig;
  customText: string;
  zoom: number; // Tỷ lệ zoom (50 - 200%)
  selectedElementId: string | null;
  historyIndex: number;
}

export const INITIAL_ARTBOARD_DOC: ArtboardDocument = {
  id: 'doc-initial',
  name: 'Đồ thị & Hình vẽ mới',
  category: 'graph_2d',
  typography: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    isBold: false,
    isItalic: true,
    isSubscript: false,
    isSuperscript: false,
    color: '#000000',
  },
  strokeFill: {
    strokeWidth: 1.2,
    strokeStyle: 'solid',
    strokeColor: '#000000',
    fillColor: '#FFFFFF',
    hatching: 'none',
  },
  graph2D: {
    type: 'cubic',
    a: 1,
    b: 0,
    c: -3,
    d: 1,
    e: 1,
    showAsymptotes: false,
    showTangent: true,
    tangentX0: 2,
    showExtrema: true,
    showGrid: true,
    gridType: 'decimal',
    showIntegralHatch: false,
    integralRange: [0, 2],
    showInequalityHatch: false,
  },
  bbt: {
    type: 'cubic',
    columns: ['-∞', '1', '3', '+∞'],
    signs: ['+', '0', '-', '0', '+'],
    hasDoubleBar: false,
    arrows: [],
    yValues: ['-∞', '4', '0', '+∞'],
    yExtrema: [],
  },
  planeTrig: {
    type: 'triangle',
    intervalType: 'half_open_right',
    intervalA: 2,
    intervalB: 6,
    angleDeg: 60,
    showSinCosAxes: true,
    triangleType: 'right',
    showRightAngleMark: true,
  },
  space3D: {
    type: 'pyramid_quad',
    showOxyz: false,
    showProjectionDashed: true,
    showNormalVector: false,
    autoHiddenLines: true,
    rotX: 25,
    rotY: 45,
    showSectionPlane: false,
    showRightAngle3D: true,
  },
  statsProb: {
    type: 'box_plot',
    boxPlotData: { min: 2, q1: 5, median: 7, q3: 8.5, max: 10 },
    vennIntersectionFilled: true,
  },
  customText: '',
  zoom: 100,
  selectedElementId: null,
  historyIndex: 0,
};
