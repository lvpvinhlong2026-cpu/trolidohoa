import React, { useState, useRef, useEffect } from 'react';
import { 
  GitFork, Copy, Download, CheckCircle2, Sparkles, RefreshCw, 
  Plus, Trash2, Sliders, Eye, Palette, Check, HelpCircle
} from 'lucide-react';
import { addDpiToBlob } from '../utils/bbtEngine';
import MathFontSelector, { MathFontChoice, MathStrokeChoice, MATH_FONT_FAMILIES } from './MathFontSelector';

export interface Stage2Branch {
  id: string;
  label: string;       // Nhãn biến cố (ví dụ: 'B', 'B̄', 'T⁺', 'T⁻')
  prob: string;        // Xác suất P(B|A), ví dụ: '0.95', '19/20', '95%'
  probVal: number;     // Giá trị số thực quy đổi
  outcomeName?: string;// Tên kết quả đầu cành, e.g. 'A ∩ B'
}

export interface Stage1Branch {
  id: string;
  label: string;       // Nhãn biến cố (ví dụ: 'A', 'Ā', 'D', 'D̄')
  prob: string;        // Xác suất P(A), ví dụ: '0.01', '1%', '3/5'
  probVal: number;     // Giá trị số thực quy đổi
  branches: Stage2Branch[];
}

export interface TreePreset {
  id: string;
  title: string;
  desc: string;
  rootLabel: string;
  stage1Name: string;
  stage2Name: string;
  data: Stage1Branch[];
  bayesTargetStage2: string; // Tên biến cố tầng 2 để tính Bayes (e.g. 'T⁺', 'F')
}

// Hàm phân tích chuỗi xác suất (hỗ trợ phân số '3/5', phần trăm '70%', số thập phân '0.7')
function parseProbInput(str: string): number {
  if (!str) return 0;
  const trimmed = str.trim().replace(/,/g, '.');
  if (trimmed.endsWith('%')) {
    const val = parseFloat(trimmed.slice(0, -1));
    return isNaN(val) ? 0 : val / 100;
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }
  const val = parseFloat(trimmed);
  return isNaN(val) ? 0 : val;
}

// 5 MẪU CHUẨN SGK TOÁN 11 & 12 CT GDPT 2018
export const TREE_PRESETS: TreePreset[] = [
  {
    id: 'medical_test',
    title: 'Xét nghiệm Y tế (Toán 12 - Công thức Bayes)',
    desc: 'Bài toán kinh điển: Tỉ lệ mắc bệnh 1%, xét nghiệm đúng 95% khi có bệnh, dương tính giả 2%.',
    rootLabel: 'Dân số',
    stage1Name: 'Tình trạng bệnh',
    stage2Name: 'Kết quả xét nghiệm',
    bayesTargetStage2: 'T⁺',
    data: [
      {
        id: 'd1',
        label: 'D',
        prob: '0.01',
        probVal: 0.01,
        branches: [
          { id: 't1_pos', label: 'T⁺', prob: '0.95', probVal: 0.95, outcomeName: 'D ∩ T⁺' },
          { id: 't1_neg', label: 'T⁻', prob: '0.05', probVal: 0.05, outcomeName: 'D ∩ T⁻' }
        ]
      },
      {
        id: 'd0',
        label: 'D̄',
        prob: '0.99',
        probVal: 0.99,
        branches: [
          { id: 't0_pos', label: 'T⁺', prob: '0.02', probVal: 0.02, outcomeName: 'D̄ ∩ T⁺' },
          { id: 't0_neg', label: 'T⁻', prob: '0.98', probVal: 0.98, outcomeName: 'D̄ ∩ T⁻' }
        ]
      }
    ]
  },
  {
    id: 'factory_production',
    title: 'Sản phẩm 2 Nhà máy (Toán 12 - XS toàn phần)',
    desc: 'Nhà máy I sản xuất 60% sản phẩm (tỉ lệ phế phẩm 2%), Nhà máy II sản xuất 40% (phế phẩm 3%).',
    rootLabel: 'Kho hàng',
    stage1Name: 'Nơi sản xuất',
    stage2Name: 'Chất lượng',
    bayesTargetStage2: 'F',
    data: [
      {
        id: 'f1',
        label: 'A₁',
        prob: '0.6',
        probVal: 0.6,
        branches: [
          { id: 'f1_bad', label: 'F', prob: '0.02', probVal: 0.02, outcomeName: 'A₁ ∩ F' },
          { id: 'f1_good', label: 'F̄', prob: '0.98', probVal: 0.98, outcomeName: 'A₁ ∩ F̄' }
        ]
      },
      {
        id: 'f2',
        label: 'A₂',
        prob: '0.4',
        probVal: 0.4,
        branches: [
          { id: 'f2_bad', label: 'F', prob: '0.03', probVal: 0.03, outcomeName: 'A₂ ∩ F' },
          { id: 'f2_good', label: 'F̄', prob: '0.97', probVal: 0.97, outcomeName: 'A₂ ∩ F̄' }
        ]
      }
    ]
  },
  {
    id: 'shooter_two_rounds',
    title: 'Xạ thủ bắn 2 phát (Toán 11 & 12)',
    desc: 'Phát 1 trúng xác suất 0.8. Nếu trúng, phát 2 trúng 0.9; nếu trượt, phát 2 trúng 0.6.',
    rootLabel: 'Bắt đầu',
    stage1Name: 'Lần bắn 1',
    stage2Name: 'Lần bắn 2',
    bayesTargetStage2: 'B',
    data: [
      {
        id: 's1',
        label: 'A',
        prob: '0.8',
        probVal: 0.8,
        branches: [
          { id: 's1_hit', label: 'B', prob: '0.9', probVal: 0.9, outcomeName: 'A ∩ B' },
          { id: 's1_miss', label: 'B̄', prob: '0.1', probVal: 0.1, outcomeName: 'A ∩ B̄' }
        ]
      },
      {
        id: 's0',
        label: 'Ā',
        prob: '0.2',
        probVal: 0.2,
        branches: [
          { id: 's0_hit', label: 'B', prob: '0.6', probVal: 0.6, outcomeName: 'Ā ∩ B' },
          { id: 's0_miss', label: 'B̄', prob: '0.4', probVal: 0.4, outcomeName: 'Ā ∩ B̄' }
        ]
      }
    ]
  },
  {
    id: 'two_boxes_balls',
    title: 'Rút bóng từ 2 hộp (Toán 11 & 12)',
    desc: 'Chọn ngẫu nhiên Hộp I hoặc II, sau đó rút 1 quả bóng (Trắng / Đỏ).',
    rootLabel: 'Chọn hộp',
    stage1Name: 'Hộp',
    stage2Name: 'Màu bóng',
    bayesTargetStage2: 'Đ',
    data: [
      {
        id: 'b1',
        label: 'Hộp 1',
        prob: '0.5',
        probVal: 0.5,
        branches: [
          { id: 'b1_w', label: 'T', prob: '3/5', probVal: 0.6, outcomeName: 'H₁ ∩ T' },
          { id: 'b1_r', label: 'Đ', prob: '2/5', probVal: 0.4, outcomeName: 'H₁ ∩ Đ' }
        ]
      },
      {
        id: 'b2',
        label: 'Hộp 2',
        prob: '0.5',
        probVal: 0.5,
        branches: [
          { id: 'b2_w', label: 'T', prob: '1/3', probVal: 0.333, outcomeName: 'H₂ ∩ T' },
          { id: 'b2_r', label: 'Đ', prob: '2/3', probVal: 0.667, outcomeName: 'H₂ ∩ Đ' }
        ]
      }
    ]
  },
  {
    id: 'three_assembly_lines',
    title: 'Ba dây chuyền sản xuất (Tầng 1 có 3 nhánh)',
    desc: 'Dây chuyền A (40%), B (35%), C (25%). Tỉ lệ đạt chuẩn của mỗi dây chuyền.',
    rootLabel: 'Sản xuất',
    stage1Name: 'Dây chuyền',
    stage2Name: 'Tiêu chuẩn',
    bayesTargetStage2: 'Đ',
    data: [
      {
        id: 'l1',
        label: 'A₁',
        prob: '0.40',
        probVal: 0.4,
        branches: [
          { id: 'l1_p', label: 'Đ', prob: '0.95', probVal: 0.95, outcomeName: 'A₁ ∩ Đ' },
          { id: 'l1_f', label: 'H', prob: '0.05', probVal: 0.05, outcomeName: 'A₁ ∩ H' }
        ]
      },
      {
        id: 'l2',
        label: 'A₂',
        prob: '0.35',
        probVal: 0.35,
        branches: [
          { id: 'l2_p', label: 'Đ', prob: '0.90', probVal: 0.9, outcomeName: 'A₂ ∩ Đ' },
          { id: 'l2_f', label: 'H', prob: '0.10', probVal: 0.1, outcomeName: 'A₂ ∩ H' }
        ]
      },
      {
        id: 'l3',
        label: 'A₃',
        prob: '0.25',
        probVal: 0.25,
        branches: [
          { id: 'l3_p', label: 'Đ', prob: '0.80', probVal: 0.8, outcomeName: 'A₃ ∩ Đ' },
          { id: 'l3_f', label: 'H', prob: '0.20', probVal: 0.2, outcomeName: 'A₃ ∩ H' }
        ]
      }
    ]
  }
];

export default function ProbabilityTreeTool() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('medical_test');
  const [rootLabel, setRootLabel] = useState<string>('Bắt đầu');
  const [stage1Title, setStage1Title] = useState<string>('Giai đoạn 1');
  const [stage2Title, setStage2Title] = useState<string>('Giai đoạn 2');
  const [bayesTarget, setBayesTarget] = useState<string>('T⁺');
  const [treeData, setTreeData] = useState<Stage1Branch[]>(TREE_PRESETS[0].data);

  // Cấu hình đồ họa & hiển thị
  const [lineStyle, setLineStyle] = useState<'bezier' | 'straight'>('bezier');
  const [colorMode, setColorMode] = useState<'colored' | 'monochrome'>('colored');
  const [showStageLabels, setShowStageLabels] = useState<boolean>(true);
  const [showProbOnBranches, setShowProbOnBranches] = useState<boolean>(true);
  const [showOutcomeFormulas, setShowOutcomeFormulas] = useState<boolean>(true);
  const [showOutcomeProbValues, setShowOutcomeProbValues] = useState<boolean>(true);
  const [fontChoice, setFontChoice] = useState<MathFontChoice>('times');
  const [strokeChoice, setStrokeChoice] = useState<MathStrokeChoice>('standard');
  const [isBold, setIsBold] = useState<boolean>(true);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Nạp Preset
  const handleSelectPreset = (presetId: string) => {
    const found = TREE_PRESETS.find(p => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(presetId);
    setRootLabel(found.rootLabel);
    setStage1Title(found.stage1Name);
    setStage2Title(found.stage2Name);
    setBayesTarget(found.bayesTargetStage2);
    setTreeData(JSON.parse(JSON.stringify(found.data)));
  };

  // Tính toán xác suất toàn phần & công thức Bayes
  const bayesCalc = (() => {
    let totalTargetProb = 0;
    const stage1Terms: { branchLabel: string; pA: number; pBA: number; pJoint: number }[] = [];

    treeData.forEach(b1 => {
      const pA = b1.probVal;
      const match2 = b1.branches.find(b2 => b2.label === bayesTarget);
      const pBA = match2 ? match2.probVal : 0;
      const pJoint = pA * pBA;
      totalTargetProb += pJoint;
      stage1Terms.push({
        branchLabel: b1.label,
        pA,
        pBA,
        pJoint
      });
    });

    const bayesResults = stage1Terms.map(t => ({
      label: t.branchLabel,
      prob: totalTargetProb > 0 ? (t.pJoint / totalTargetProb) : 0
    }));

    return {
      target: bayesTarget,
      totalProb: totalTargetProb,
      terms: stage1Terms,
      bayes: bayesResults
    };
  })();

  // Cập nhật giá trị xác suất tầng 1
  const updateStage1Prob = (id: string, newStr: string) => {
    const val = parseProbInput(newStr);
    setTreeData(prev => prev.map(b => b.id === id ? { ...b, prob: newStr, probVal: val } : b));
  };

  // Cập nhật nhãn tầng 1
  const updateStage1Label = (id: string, newLabel: string) => {
    setTreeData(prev => prev.map(b => b.id === id ? { ...b, label: newLabel } : b));
  };

  // Cập nhật xác suất tầng 2
  const updateStage2Prob = (b1Id: string, b2Id: string, newStr: string) => {
    const val = parseProbInput(newStr);
    setTreeData(prev => prev.map(b1 => {
      if (b1.id !== b1Id) return b1;
      return {
        ...b1,
        branches: b1.branches.map(b2 => b2.id === b2Id ? { ...b2, prob: newStr, probVal: val } : b2)
      };
    }));
  };

  // Cập nhật nhãn tầng 2
  const updateStage2Label = (b1Id: string, b2Id: string, newLabel: string) => {
    setTreeData(prev => prev.map(b1 => {
      if (b1.id !== b1Id) return b1;
      return {
        ...b1,
        branches: b1.branches.map(b2 => b2.id === b2Id ? { ...b2, label: newLabel } : b2)
      };
    }));
  };

  // Thêm nhánh tầng 1
  const addStage1Branch = () => {
    const newId = 's1_' + Date.now();
    const newBranch: Stage1Branch = {
      id: newId,
      label: `A_${treeData.length + 1}`,
      prob: '0.2',
      probVal: 0.2,
      branches: [
        { id: newId + '_b1', label: 'B', prob: '0.5', probVal: 0.5, outcomeName: `A_${treeData.length + 1} ∩ B` },
        { id: newId + '_b2', label: 'B̄', prob: '0.5', probVal: 0.5, outcomeName: `A_${treeData.length + 1} ∩ B̄` }
      ]
    };
    setTreeData(prev => [...prev, newBranch]);
  };

  // Xóa nhánh tầng 1
  const removeStage1Branch = (id: string) => {
    if (treeData.length <= 1) return;
    setTreeData(prev => prev.filter(b => b.id !== id));
  };

  // ==========================================
  // THUẬT TOÁN VẼ SƠ ĐỒ CÂY LÊN CANVAS (300 DPI)
  // ==========================================
  const renderTreeToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, scale = 1) => {
    ctx.save();
    ctx.scale(scale, scale);

    // Tô nền trắng tinh
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const isMono = colorMode === 'monochrome';
    const fontFamily = MATH_FONT_FAMILIES[fontChoice];

    // Đếm tổng số lá (leaves) ở đầu cành
    let totalLeaves = 0;
    treeData.forEach(b1 => {
      totalLeaves += Math.max(1, b1.branches.length);
    });

    // Kích thước các cột theo chiều ngang
    const marginL = 50;
    const marginR = 190; // Khoảng trống cho nhãn kết quả và tích xác suất
    const marginT = showStageLabels ? 65 : 40;
    const marginB = 30;

    const plotW = width - marginL - marginR;
    const plotH = height - marginT - marginB;

    const x0 = marginL + 20;               // Tọa độ gốc cây
    const x1 = marginL + plotW * 0.40;     // Tọa độ nút tầng 1
    const x2 = marginL + plotW * 0.82;     // Tọa độ nút tầng 2
    const xOutcome = x2 + 30;              // Tọa độ nhãn kết quả cuối cành

    // Phân bố tọa độ y của từng lá
    const leafYStep = plotH / Math.max(1, totalLeaves);
    let currentLeafIndex = 0;

    // Tiêu đề các giai đoạn (Stages) ở đỉnh
    if (showStageLabels) {
      ctx.save();
      ctx.font = `${isBold ? 'bold ' : 'normal '}${Math.round(13 * fontSizeScale)}px ${fontFamily}`;
      ctx.fillStyle = isMono ? '#475569' : '#0f766e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Cột 1
      ctx.fillText(stage1Title, (x0 + x1) / 2, marginT - 25);
      // Cột 2
      ctx.fillText(stage2NameOrTitle(), (x1 + x2) / 2, marginT - 25);
      // Cột Kết quả
      ctx.fillText('Biến cố giao & Xác suất', xOutcome + 60, marginT - 25);

      // Đường kẻ phân cách nhẹ
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginL, marginT - 12);
      ctx.lineTo(width - 30, marginT - 12);
      ctx.stroke();
      ctx.restore();
    }

    // Tọa độ y trung tâm của gốc
    const y0 = marginT + plotH / 2;

    // 1. Tính toán trước vị trí y của các nút
    interface NodePos {
      x: number;
      y: number;
      b1: Stage1Branch;
      childPositions: { x: number; y: number; b2: Stage2Branch }[];
    }

    const nodes: NodePos[] = [];

    treeData.forEach(b1 => {
      const childCount = Math.max(1, b1.branches.length);
      const childPositions: { x: number; y: number; b2: Stage2Branch }[] = [];

      let sumY = 0;
      b1.branches.forEach(b2 => {
        const leafY = marginT + (currentLeafIndex + 0.5) * leafYStep;
        childPositions.push({ x: x2, y: leafY, b2 });
        sumY += leafY;
        currentLeafIndex++;
      });

      const nodeY = sumY / childCount;
      nodes.push({
        x: x1,
        y: nodeY,
        b1,
        childPositions
      });
    });

    // 2. VẼ CÁC CÀNH CÂY (BRANCH LINES)
    nodes.forEach((node, idx) => {
      const b1 = node.b1;
      const branchColor1 = isMono ? '#000000' : (idx % 2 === 0 ? '#0d9488' : '#0284c7');

      // Cành từ Gốc -> Nút Tầng 1
      ctx.save();
      ctx.strokeStyle = branchColor1;
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      if (lineStyle === 'bezier') {
        const cx1 = x0 + (node.x - x0) * 0.55;
        const cx2 = node.x - (node.x - x0) * 0.45;
        ctx.bezierCurveTo(cx1, y0, cx2, node.y, node.x, node.y);
      } else {
        ctx.lineTo(node.x, node.y);
      }
      ctx.stroke();

      // Ghi xác suất trên cành Tầng 1
      if (showProbOnBranches) {
        const t = 0.50;
        const textX = x0 + (node.x - x0) * t;
        const textY = y0 + (node.y - y0) * t - 9;

        ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${Math.round(15 * fontSizeScale)}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Viền trắng bảo vệ chữ
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isBold ? 4 : 2.6;
        ctx.lineJoin = 'round';
        ctx.strokeText(b1.prob, textX, textY);

        ctx.fillStyle = branchColor1;
        ctx.fillText(b1.prob, textX, textY);
      }
      ctx.restore();

      // Cành từ Nút Tầng 1 -> Nút Tầng 2
      node.childPositions.forEach((child, cIdx) => {
        const b2 = child.b2;
        const branchColor2 = isMono ? '#000000' : (cIdx % 2 === 0 ? '#0f766e' : '#e11d48');

        ctx.save();
        ctx.strokeStyle = branchColor2;
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        if (lineStyle === 'bezier') {
          const cx1 = node.x + (child.x - node.x) * 0.55;
          const cx2 = child.x - (child.x - node.x) * 0.45;
          ctx.bezierCurveTo(cx1, node.y, cx2, child.y, child.x, child.y);
        } else {
          ctx.lineTo(child.x, child.y);
        }
        ctx.stroke();

        // Ghi xác suất trên cành Tầng 2
        if (showProbOnBranches) {
          const t = 0.52;
          const textX = node.x + (child.x - node.x) * t;
          const textY = node.y + (child.y - node.y) * t - 9;

          ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${Math.round(14 * fontSizeScale)}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = isBold ? 4 : 2.6;
          ctx.lineJoin = 'round';
          ctx.strokeText(b2.prob, textX, textY);

          ctx.fillStyle = branchColor2;
          ctx.fillText(b2.prob, textX, textY);
        }
        ctx.restore();

        // 3. VẼ KẾT QUẢ ĐẦU CÀNH (OUTCOMES & PROBABILITIES)
        const outcomeName = b2.outcomeName || `${b1.label} ∩ ${b2.label}`;
        const jointProbVal = b1.probVal * b2.probVal;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Tên biến cố kết quả
        ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${Math.round(16 * fontSizeScale)}px ${fontFamily}`;
        ctx.fillStyle = '#000000';
        ctx.fillText(outcomeName, xOutcome, child.y);

        // Công thức tính xác suất đầu cành
        if (showOutcomeFormulas || showOutcomeProbValues) {
          const formulaStr = showOutcomeFormulas 
            ? `:  ${b1.prob} × ${b2.prob}` 
            : '';
          const valStr = showOutcomeProbValues 
            ? ` = ${formatDecimalResult(jointProbVal)}` 
            : '';

          ctx.font = `${isBold ? 'bold ' : 'normal '}${Math.round(14 * fontSizeScale)}px ${fontFamily}`;
          ctx.fillStyle = isMono ? '#334155' : '#0f766e';
          const nameWidth = ctx.measureText(outcomeName).width;
          ctx.fillText(`${formulaStr}${valStr}`, xOutcome + nameWidth + 6, child.y);
        }
        ctx.restore();
      });
    });

    // 4. VẼ CÁC CHẤM TRÒN VÀ NHÃN NÚT (NODE LABELS)
    // A. Nút gốc (Root Node)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x0, y0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    if (rootLabel.trim()) {
      ctx.font = `${isBold ? 'bold ' : 'normal '}${Math.round(13 * fontSizeScale)}px ${fontFamily}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#475569';
      ctx.fillText(rootLabel, x0 - 12, y0);
    }
    ctx.restore();

    // B. Các nút Tầng 1
    nodes.forEach(node => {
      ctx.save();
      // Chấm tròn tại nút
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Nhãn biến cố tầng 1 (chữ to rõ in nghiêng đậm)
      ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${Math.round(18 * fontSizeScale)}px ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = isBold ? 5 : 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(node.b1.label, node.x + 8, node.y - 2);

      ctx.fillStyle = '#000000';
      ctx.fillText(node.b1.label, node.x + 8, node.y - 2);
      ctx.restore();
    });

    // C. Các nút Tầng 2
    nodes.forEach(node => {
      node.childPositions.forEach(child => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(child.x, child.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Nhãn biến cố tầng 2
        ctx.font = `italic ${isBold ? 'bold ' : 'normal '}${Math.round(18 * fontSizeScale)}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isBold ? 5 : 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(child.b2.label, child.x + 8, child.y - 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(child.b2.label, child.x + 8, child.y - 2);
        ctx.restore();
      });
    });

    ctx.restore();
  };

  const stage2NameOrTitle = () => {
    return stage2Title || 'Giai đoạn 2';
  };

  const formatDecimalResult = (num: number): string => {
    if (Math.abs(num) < 1e-6) return '0';
    if (Math.abs(num - Math.round(num)) < 1e-6) return String(Math.round(num));
    const fixed = num.toFixed(4);
    return fixed.replace(/\.?0+$/, '');
  };

  // Render lại Canvas mỗi khi dữ liệu hoặc cấu hình thay đổi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let leafCount = 0;
    treeData.forEach(b1 => leafCount += Math.max(1, b1.branches.length));

    const logicalW = 760;
    const logicalH = Math.max(360, leafCount * 65 + 70);

    canvas.width = logicalW;
    canvas.height = logicalH;

    renderTreeToCanvas(ctx, logicalW, logicalH, 1);
  }, [treeData, rootLabel, stage1Title, stage2Title, lineStyle, colorMode, showStageLabels, showProbOnBranches, showOutcomeFormulas, showOutcomeProbValues, fontChoice, fontSizeScale]);

  // ==========================================
  // XUẤT ẢNH 300 DPI CHÈN WORD / TẢI VỀ
  // ==========================================
  const renderToOffscreenCanvas = (dpiScale = 3): HTMLCanvasElement => {
    let leafCount = 0;
    treeData.forEach(b1 => leafCount += Math.max(1, b1.branches.length));
    const logicalW = 760;
    const logicalH = Math.max(360, leafCount * 65 + 70);

    const offscreen = document.createElement('canvas');
    offscreen.width = logicalW * dpiScale;
    offscreen.height = logicalH * dpiScale;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      renderTreeToCanvas(ctx, logicalW, logicalH, dpiScale);
    }
    return offscreen;
  };

  const handleCopy300Dpi = async () => {
    try {
      const offscreen = renderToOffscreenCanvas(3);
      offscreen.toBlob(async (blob) => {
        if (!blob) return;
        const dpiBlob = await addDpiToBlob(blob, 300);
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': dpiBlob })
        ]);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus(null), 3500);
      }, 'image/png');
    } catch {
      handleDownloadPng();
    }
  };

  const handleDownloadPng = async () => {
    const offscreen = renderToOffscreenCanvas(3);
    offscreen.toBlob(async (blob) => {
      if (!blob) return;
      const dpiBlob = await addDpiToBlob(blob, 300);
      const url = URL.createObjectURL(dpiBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `So_do_cay_xac_suat_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setCopyStatus('downloaded');
      setTimeout(() => setCopyStatus(null), 3500);
    }, 'image/png');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* THANH TIÊU ĐỀ & PRESET NHANH */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
              <GitFork size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Sơ đồ hình cây Xác suất (Tree Diagram)</span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 px-2 py-0.5 rounded-full font-bold">
                  Toán 11 & 12 CT GDPT 2018
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quy tắc nhân, xác suất có điều kiện, công thức xác suất toàn phần & định lý Bayes chuẩn SGK mới
              </p>
            </div>
          </div>

          {/* Các nút hành động xuất ảnh 300 DPI */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy300Dpi}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Sao chép ảnh độ phân giải cao 300 DPI (Dán vào Microsoft Word bằng Ctrl + V)"
            >
              <Copy size={15} />
              <span>Chép vào Word (300 DPI)</span>
            </button>
            <button
              onClick={handleDownloadPng}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download size={15} />
              <span>Tải PNG</span>
            </button>
          </div>
        </div>

        {/* DANH SÁCH MẪU SGK CHUẨN (PRESETS 1-CLICK) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles size={13} className="text-teal-600" />
            <span>Mẫu SGK:</span>
          </span>
          {TREE_PRESETS.map(preset => {
            const isCur = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  isCur
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-teal-50'
                }`}
                title={preset.desc}
              >
                {preset.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* THÔNG BÁO SAO CHÉP THÀNH CÔNG */}
      {copyStatus && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>
              {copyStatus === 'copied'
                ? 'Đã sao chép ảnh Sơ đồ cây (300 DPI)! Mở Microsoft Word và nhấn phím Ctrl + V để dán ngay.'
                : 'Đã tải ảnh Sơ đồ cây độ nét cao (300 DPI) về máy.'}
            </span>
          </div>
          <button onClick={() => setCopyStatus(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* GIAO DIỆN CHÍNH: BẢNG ĐIỀU KHIỂN & BẢN VẼ CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT TRÁI: THIẾT LẬP CÂY & DỮ LIỆU (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. TÙY CHỌN PHONG CÁCH VẼ */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders size={14} className="text-teal-600" />
                Phong cách đồ họa:
              </span>
              <span className="text-[10px] text-slate-400">Chuẩn in đề thi</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Kiểu đường cành:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setLineStyle('bezier')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      lineStyle === 'bezier' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Uốn cong SGK
                  </button>
                  <button
                    onClick={() => setLineStyle('straight')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      lineStyle === 'straight' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Gập thẳng
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Màu sắc in ấn:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setColorMode('colored')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      colorMode === 'colored' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Đa sắc
                  </button>
                  <button
                    onClick={() => setColorMode('monochrome')}
                    className={`flex-1 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      colorMode === 'monochrome' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Đen trắng
                  </button>
                </div>
              </div>
            </div>

            {/* Phông chữ & Nét vẽ hiển thị */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <MathFontSelector
                font={fontChoice}
                onFontChange={setFontChoice}
                stroke={strokeChoice}
                onStrokeChange={setStrokeChoice}
                isBold={isBold}
                onBoldChange={setIsBold}
                size="sm"
              />
            </div>

            {/* Bật tắt nhãn và công thức */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProbOnBranches}
                  onChange={e => setShowProbOnBranches(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px]">Xác suất trên cành</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStageLabels}
                  onChange={e => setShowStageLabels(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px]">Tiêu đề giai đoạn</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutcomeFormulas}
                  onChange={e => setShowOutcomeFormulas(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px]">Phép nhân cuối cành</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutcomeProbValues}
                  onChange={e => setShowOutcomeProbValues(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-[11px]">Kết quả số cuối cành</span>
              </label>
            </div>
          </div>

          {/* 2. CHỈNH SỬA DỮ LIỆU CÁC NHÁNH */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <GitFork size={14} className="text-teal-600" />
                Cấu hình các nhánh cây:
              </span>
              <button
                onClick={addStage1Branch}
                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus size={12} />
                Thêm nhánh Tầng 1
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {treeData.map((b1, idx1) => (
                <div key={b1.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  {/* Tầng 1 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 w-5">#{idx1 + 1}</span>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block">Biến cố Tầng 1:</span>
                      <input
                        type="text"
                        value={b1.label}
                        onChange={e => updateStage1Label(b1.id, e.target.value)}
                        className="w-full mt-0.5 p-1 px-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                        placeholder="e.g. A"
                      />
                    </div>
                    <div className="w-24">
                      <span className="text-[10px] text-slate-400 block">Xác suất P(A):</span>
                      <input
                        type="text"
                        value={b1.prob}
                        onChange={e => updateStage1Prob(b1.id, e.target.value)}
                        className="w-full mt-0.5 p-1 px-2 text-xs font-bold text-teal-700 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-center"
                        placeholder="0.5"
                      />
                    </div>
                    {treeData.length > 1 && (
                      <button
                        onClick={() => removeStage1Branch(b1.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer mt-3"
                        title="Xóa nhánh này"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Tầng 2 */}
                  <div className="pl-4 border-l-2 border-teal-200 dark:border-teal-800 space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Các nhánh con rẽ ra ở Tầng 2 (Xác suất có điều kiện):
                    </span>
                    {b1.branches.map((b2) => (
                      <div key={b2.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">↳</span>
                        <input
                          type="text"
                          value={b2.label}
                          onChange={e => updateStage2Label(b1.id, b2.id, e.target.value)}
                          className="w-20 p-1 px-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-center"
                          placeholder="B"
                        />
                        <span className="text-xs text-slate-400">:</span>
                        <input
                          type="text"
                          value={b2.prob}
                          onChange={e => updateStage2Prob(b1.id, b2.id, e.target.value)}
                          className="flex-1 p-1 px-2 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                          placeholder="P(B|A)"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BẢNG CÔNG THỨC TOÀN PHẦN & BAYES TỰ ĐỘNG (TOÁN 12) */}
          <div className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:to-teal-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-teal-200 dark:border-teal-800 pb-2">
              <span className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-teal-600" />
                Công thức Toán 12 (Toàn phần & Bayes):
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500">Mục tiêu:</span>
                <input
                  type="text"
                  value={bayesTarget}
                  onChange={e => setBayesTarget(e.target.value)}
                  className="w-14 p-0.5 text-center font-bold bg-white dark:bg-slate-800 border border-teal-300 rounded text-teal-700"
                  placeholder="T⁺"
                />
              </div>
            </div>

            {/* Xác suất toàn phần */}
            <div className="text-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                1. Xác suất toàn phần P({bayesCalc.target}):
              </div>
              <div className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-teal-100 dark:border-slate-700 font-mono text-[11px] text-teal-900 dark:text-teal-100 font-bold overflow-x-auto">
                P({bayesCalc.target}) = {bayesCalc.terms.map(t => `(${t.pA} × ${t.pBA})`).join(' + ')}
                <div className="text-sm text-teal-600 dark:text-teal-400 font-extrabold mt-1">
                  = {formatDecimalResult(bayesCalc.totalProb)} ({formatDecimalResult(bayesCalc.totalProb * 100)}%)
                </div>
              </div>
            </div>

            {/* Công thức Bayes */}
            <div className="text-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                2. Xác suất hậu nghiệm theo Định lý Bayes:
              </div>
              <div className="space-y-1">
                {bayesCalc.bayes.map(b => (
                  <div key={b.label} className="p-1.5 px-2 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-teal-100 dark:border-slate-700 flex items-center justify-between font-mono text-[11px]">
                    <span>P({b.label} | {bayesCalc.target}) =</span>
                    <span className="font-extrabold text-teal-700 dark:text-teal-300">
                      ≈ {formatDecimalResult(b.prob)} ({formatDecimalResult(b.prob * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG VẼ SƠ ĐỒ CÂY CANVAS (7 COLS) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="w-full flex items-center justify-center p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto bg-white rounded-xl shadow-xs border border-slate-200 select-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>💡 Nét vẽ và chữ tự động canh thẳng hàng, viền trắng Halo chống đè nét chuẩn đề thi SGK.</span>
            <span>Độ phân giải xuất: <b>300 DPI</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
