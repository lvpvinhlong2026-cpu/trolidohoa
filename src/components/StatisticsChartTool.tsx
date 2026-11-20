import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart2, 
  BarChart,
  Copy, 
  Download, 
  CheckCircle2, 
  RotateCcw, 
  Info, 
  Sparkles, 
  Sliders, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Table, 
  Check,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { addDpiToBlob, cropCanvasToContent } from '../utils/dpiUtils';
import ThcsStatisticalChart from './ThcsStatisticalChart';
import MathFontSelector, { MathFontChoice, MathStrokeChoice, MATH_FONT_FAMILIES } from './MathFontSelector';

interface GroupedInterval {
  id: string;
  start: number;
  end: number;
  freq: number;
}

export default function StatisticsChartTool() {
  const [activeMode, setActiveMode] = useState<'thcs' | 'thpt'>('thcs');
  const [dataType, setDataType] = useState<'raw' | 'grouped'>('raw');
  
  // Dữ liệu mẫu số liệu không ghép nhóm
  const [rawInput, setRawInput] = useState<string>('12, 14, 15, 15, 16, 17, 18, 19, 19, 20, 22, 25, 29, 38');
  
  // Dữ liệu mẫu ghép nhóm (Toán 11 & 12 GDPT 2018)
  const [groupedData, setGroupedData] = useState<GroupedInterval[]>([
    { id: '1', start: 10, end: 15, freq: 4 },
    { id: '2', start: 15, end: 20, freq: 12 },
    { id: '3', start: 20, end: 25, freq: 18 },
    { id: '4', start: 25, end: 30, freq: 10 },
    { id: '5', start: 30, end: 35, freq: 6 },
  ]);

  const [chartType, setChartType] = useState<'both' | 'box' | 'hist'>('both');
  const [fontChoice, setFontChoice] = useState<MathFontChoice>('times');
  const [strokeChoice, setStrokeChoice] = useState<MathStrokeChoice>('standard');
  const [isBold, setIsBold] = useState<boolean>(true);
  const [boxThemeColor, setBoxThemeColor] = useState<string>('#0d9488'); // teal-600
  const [showOutliers, setShowOutliers] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // ========================================================
  // PHÂN TÍCH THỐNG KÊ MẪU RỜI RẠC (KHÔNG GHÉP NHÓM)
  // ========================================================
  const rawStats = useMemo(() => {
    if (dataType !== 'raw') return null;
    const nums = rawInput
      .split(/[\s,;]+/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (nums.length < 4) return null;

    const n = nums.length;
    const min = nums[0];
    const max = nums[n - 1];
    const range = max - min;
    const sum = nums.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Tính trung vị
    const getMedian = (arr: number[]) => {
      const len = arr.length;
      if (len === 0) return 0;
      const mid = Math.floor(len / 2);
      return len % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const Q2 = getMedian(nums);

    let lowerHalf: number[] = [];
    let upperHalf: number[] = [];
    const midIndex = Math.floor(n / 2);

    if (n % 2 === 0) {
      lowerHalf = nums.slice(0, midIndex);
      upperHalf = nums.slice(midIndex);
    } else {
      lowerHalf = nums.slice(0, midIndex);
      upperHalf = nums.slice(midIndex + 1);
    }

    const Q1 = getMedian(lowerHalf);
    const Q3 = getMedian(upperHalf);
    const IQR = Q3 - Q1;

    // Giá trị bất thường (outliers)
    const lowerBound = Q1 - 1.5 * IQR;
    const upperBound = Q3 + 1.5 * IQR;

    const outliers: number[] = [];
    const regularVals: number[] = [];
    nums.forEach(v => {
      if (v < lowerBound || v > upperBound) {
        outliers.push(v);
      } else {
        regularVals.push(v);
      }
    });

    const whiskerMin = regularVals.length > 0 ? Math.min(...regularVals) : min;
    const whiskerMax = regularVals.length > 0 ? Math.max(...regularVals) : max;

    // Phương sai & độ lệch chuẩn
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      n,
      min,
      max,
      range,
      mean: Number(mean.toFixed(2)),
      Q1: Number(Q1.toFixed(2)),
      Q2: Number(Q2.toFixed(2)),
      Q3: Number(Q3.toFixed(2)),
      IQR: Number(IQR.toFixed(2)),
      lowerBound: Number(lowerBound.toFixed(2)),
      upperBound: Number(upperBound.toFixed(2)),
      whiskerMin,
      whiskerMax,
      outliers,
      variance: Number(variance.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      sortedNums: nums
    };
  }, [rawInput, dataType]);

  // ========================================================
  // PHÂN TÍCH THỐNG KÊ MẪU GHÉP NHÓM (TOÁN 11 & 12 GDPT 2018)
  // ========================================================
  const groupedStats = useMemo(() => {
    if (dataType !== 'grouped') return null;
    const sorted = [...groupedData].sort((a, b) => a.start - b.start);
    const totalFreq = sorted.reduce((sum, g) => sum + (Number(g.freq) || 0), 0);
    if (totalFreq < 4) return null;

    // Giá trị đại diện c_i = (start + end) / 2
    let sumWeight = 0;
    let sumSquareWeight = 0;
    const midpoints: number[] = [];
    const cumFreqs: number[] = [];
    let curCum = 0;

    sorted.forEach(g => {
      const mid = (g.start + g.end) / 2;
      midpoints.push(mid);
      curCum += g.freq;
      cumFreqs.push(curCum);
      sumWeight += g.freq * mid;
      sumSquareWeight += g.freq * mid * mid;
    });

    const mean = sumWeight / totalFreq;
    const variance = sumSquareWeight / totalFreq - mean * mean;
    const stdDev = Math.sqrt(Math.max(0, variance));

    // Công thức tính Tứ phân vị mẫu ghép nhóm chuẩn SGK Toán 11
    // Q_p = u_m + [(p*n/4 - C_{m-1}) / n_m] * (u_{m+1} - u_m)
    const calcQuartile = (targetPos: number) => {
      let groupIdx = 0;
      for (let i = 0; i < cumFreqs.length; i++) {
        if (cumFreqs[i] >= targetPos) {
          groupIdx = i;
          break;
        }
      }
      const g = sorted[groupIdx];
      const prevCum = groupIdx > 0 ? cumFreqs[groupIdx - 1] : 0;
      const intervalLen = g.end - g.start;
      return g.start + ((targetPos - prevCum) / g.freq) * intervalLen;
    };

    const Q1 = calcQuartile(totalFreq / 4);
    const Q2 = calcQuartile(totalFreq / 2); // Trung vị
    const Q3 = calcQuartile((3 * totalFreq) / 4);
    const IQR = Q3 - Q1;

    const min = sorted[0].start;
    const max = sorted[sorted.length - 1].end;

    // Tìm Mốt M_o
    let maxFreq = -1;
    let modeIdx = 0;
    sorted.forEach((g, i) => {
      if (g.freq > maxFreq) {
        maxFreq = g.freq;
        modeIdx = i;
      }
    });

    let modeVal = 0;
    const gMode = sorted[modeIdx];
    const prevFreq = modeIdx > 0 ? sorted[modeIdx - 1].freq : 0;
    const nextFreq = modeIdx < sorted.length - 1 ? sorted[modeIdx + 1].freq : 0;
    const denom = (gMode.freq - prevFreq) + (gMode.freq - nextFreq);
    if (denom !== 0) {
      modeVal = gMode.start + ((gMode.freq - prevFreq) / denom) * (gMode.end - gMode.start);
    } else {
      modeVal = (gMode.start + gMode.end) / 2;
    }

    return {
      n: totalFreq,
      min,
      max,
      mean: Number(mean.toFixed(2)),
      Q1: Number(Q1.toFixed(2)),
      Q2: Number(Q2.toFixed(2)),
      Q3: Number(Q3.toFixed(2)),
      IQR: Number(IQR.toFixed(2)),
      mode: Number(modeVal.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      sortedGroups: sorted,
      cumFreqs,
      maxFreq
    };
  }, [groupedData, dataType]);

  // Thêm nhóm mới vào bảng ghép nhóm
  const handleAddGroup = () => {
    const last = groupedData[groupedData.length - 1];
    const nextStart = last ? last.end : 0;
    const step = last ? last.end - last.start : 5;
    setGroupedData([
      ...groupedData,
      {
        id: Date.now().toString(),
        start: nextStart,
        end: nextStart + step,
        freq: 5
      }
    ]);
  };

  const handleUpdateGroup = (id: string, field: keyof GroupedInterval, val: number) => {
    setGroupedData(groupedData.map(g => g.id === id ? { ...g, [field]: val } : g));
  };

  const handleDeleteGroup = (id: string) => {
    if (groupedData.length <= 2) return;
    setGroupedData(groupedData.filter(g => g.id !== id));
  };

  // ========================================================
  // XUẤT ẢNH SVG / PNG VÀ SAO CHÉP VÀO CLIPBOARD (300 DPI CHUẨN WORD)
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

      const scale = 3; // 300+ DPI
      const width = svg.clientWidth || 800;
      const height = svg.clientHeight || 450;
      canvas.width = width * scale;
      canvas.height = height * scale;

      // Tô nền trắng tinh khiết
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const urlObj = window.URL || (window as any).webkitURL;
      const blobURL = urlObj.createObjectURL(svgBlob);

      img.onload = async () => {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        urlObj.revokeObjectURL(blobURL);

        const targetCanvas = cropCanvasToContent(canvas, 36);
        const blob = await new Promise<Blob | null>(resolve => targetCanvas.toBlob(resolve, 'image/png'));
        if (!blob) return;

        try {
          const blobWithDpi = await addDpiToBlob(blob, 300);
          const dataUrl = targetCanvas.toDataURL('image/png');
          const htmlBlob = new Blob([`<img src="${dataUrl}" alt="Bieu do thong ke" width="${Math.round(targetCanvas.width / scale)}" height="${Math.round(targetCanvas.height / scale)}" />`], { type: 'text/html' });

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
          console.error('Clipboard copy failed:', err);
          // Fallback tải file
          const a = document.createElement('a');
          a.download = `Bieu_do_thong_ke_300DPI_${Date.now()}.png`;
          a.href = targetCanvas.toDataURL('image/png');
          a.click();
          setCopyStatus('downloaded');
          setTimeout(() => setCopyStatus(null), 3500);
        }
      };

      img.onerror = () => {
        urlObj.revokeObjectURL(blobURL);
        console.error('Không thể load SVG vào image');
      };

      img.src = blobURL;
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPng = async () => {
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
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 450;
    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const urlObj = window.URL || (window as any).webkitURL;
    const blobURL = urlObj.createObjectURL(svgBlob);

    img.onload = async () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      urlObj.revokeObjectURL(blobURL);

      const targetCanvas = cropCanvasToContent(canvas, 36);
      const blob = await new Promise<Blob | null>(resolve => targetCanvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const blobWithDpi = await addDpiToBlob(blob, 300);
        const url = urlObj.createObjectURL(blobWithDpi);
        const a = document.createElement('a');
        a.download = `Bieu_do_hop_SGK_300DPI_${Date.now()}.png`;
        a.href = url;
        a.click();
        urlObj.revokeObjectURL(url);
      }
    };
    img.src = blobURL;
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Bieu_do_hop_vector_${Date.now()}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Font family
  const fontFamilyStyle = MATH_FONT_FAMILIES[fontChoice];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ BIỂU ĐỒ THCS & THPT */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveMode('thcs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeMode === 'thcs'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart size={16} />
          <span>Biểu đồ SGK THCS (Cột, Cột kép, Đoạn thẳng, Quạt tròn)</span>
        </button>

        <button
          onClick={() => setActiveMode('thpt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeMode === 'thpt'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart2 size={16} />
          <span>Biểu đồ Hộp & Thống kê Ghép nhóm THPT (GDPT 2018)</span>
        </button>
      </div>

      {activeMode === 'thcs' ? (
        <ThcsStatisticalChart />
      ) : (
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <BarChart2 size={20} />
            </div>
            <span>Vẽ Biểu Đồ Hộp & Thống Kê (SGK Mới GDPT 2018)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Tính toán tự động tứ phân vị ($Q_1, Q_2, Q_3$), vẽ Biểu đồ hộp (Box plot) và Biểu đồ cột ghép nhóm (Histogram) chuẩn mực đề thi Toán 10, 11, 12.
          </p>
        </div>

        {/* Nút bấm chuyển chế độ Dữ liệu */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setDataType('raw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              dataType === 'raw'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} />
            <span>Mẫu không ghép nhóm (Rời rạc)</span>
          </button>
          <button
            onClick={() => setDataType('grouped')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              dataType === 'grouped'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Table size={14} />
            <span>Mẫu ghép nhóm (Toán 11 & 12)</span>
          </button>
        </div>
      </div>

      {/* GRID BODY: BÊN TRÁI NHẬP LIỆU & THỐNG KÊ, BÊN PHẢI ĐỒ THỊ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5 CỘT): NHẬP LIỆU & BẢNG KẾT QUẢ ĐẶC TRƯNG */}
        <div className="lg:col-span-5 space-y-5">
          {/* KHỐI NHẬP LIỆU */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-teal-600" />
                {dataType === 'raw' ? 'Dãy số liệu mẫu:' : 'Bảng phân bố tần số ghép nhóm:'}
              </label>
              {dataType === 'raw' && (
                <button
                  onClick={() => setRawInput('12, 14, 15, 15, 16, 17, 18, 19, 19, 20, 22, 25, 29, 38')}
                  className="text-[11px] text-teal-600 hover:underline cursor-pointer font-medium"
                >
                  Nạp ví dụ mẫu
                </button>
              )}
            </div>

            {dataType === 'raw' ? (
              <div>
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nhập các số cách nhau bởi dấu phẩy hoặc khoảng trắng (Ví dụ: 12, 15, 18, 22...)"
                />
                <div className="text-[11px] text-slate-500 mt-1.5">
                  Mẹo: Bạn có thể dán (Ctrl+V) trực tiếp một cột số liệu từ Microsoft Excel vào đây.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto max-h-[260px] custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Khoảng [a; b)</th>
                        <th className="p-2.5 text-center">Tần số (m)</th>
                        <th className="p-2.5 text-center w-10">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupedData.map((g, idx) => (
                        <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">[</span>
                              <input
                                type="number"
                                value={g.start}
                                onChange={(e) => handleUpdateGroup(g.id, 'start', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold"
                              />
                              <span className="text-slate-400">;</span>
                              <input
                                type="number"
                                value={g.end}
                                onChange={(e) => handleUpdateGroup(g.id, 'end', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold"
                              />
                              <span className="text-slate-400">)</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={g.freq}
                              onChange={(e) => handleUpdateGroup(g.id, 'freq', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-14 px-1.5 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded text-xs font-bold text-teal-700 dark:text-teal-300"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              disabled={groupedData.length <= 2}
                              className="text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                              title="Xóa nhóm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleAddGroup}
                  className="w-full py-1.5 bg-white dark:bg-slate-800 border border-dashed border-teal-400 dark:border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Plus size={14} />
                  <span>Thêm khoảng ghép nhóm kế tiếp</span>
                </button>
              </div>
            )}

            {/* TÙY CHỌN HIỂN THỊ */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutliers}
                  onChange={(e) => setShowOutliers(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Đánh dấu giá trị bất thường (Outliers)</span>
              </label>

              <div className="flex items-center gap-2 ml-auto">
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
            </div>
          </div>

          {/* BẢNG KẾT QUẢ CÁC ĐẶC TRƯNG THỐNG KÊ */}
          {((dataType === 'raw' && rawStats) || (dataType === 'grouped' && groupedStats)) && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-teal-200 dark:border-teal-900/60 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={15} />
                <span>Các số đặc trưng đo xu thế & độ phân tán:</span>
              </h3>

              {dataType === 'raw' && rawStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Cỡ mẫu (n)</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{rawStats.n}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Số trung bình (x̄)</div>
                    <div className="text-base font-bold text-teal-600 dark:text-teal-400">{rawStats.mean}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Trung vị (Me = Q₂)</div>
                    <div className="text-base font-bold text-teal-600 dark:text-teal-400">{rawStats.Q2}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Tứ phân vị Q₁</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{rawStats.Q1}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Tứ phân vị Q₃</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{rawStats.Q3}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Khoảng tứ phân vị (ΔQ)</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{rawStats.IQR}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Khoảng biến thiên (R)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{rawStats.range}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Độ lệch chuẩn (s)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{rawStats.stdDev}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Phương sai (s²)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{rawStats.variance}</div>
                  </div>
                </div>
              )}

              {dataType === 'grouped' && groupedStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Tổng cỡ mẫu (n)</div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{groupedStats.n}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Số trung bình (x̄)</div>
                    <div className="text-base font-bold text-teal-600 dark:text-teal-400">{groupedStats.mean}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Trung vị ghép nhóm (Me)</div>
                    <div className="text-base font-bold text-teal-600 dark:text-teal-400">{groupedStats.Q2}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Tứ phân vị Q₁ (25%)</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{groupedStats.Q1}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Tứ phân vị Q₃ (75%)</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{groupedStats.Q3}</div>
                  </div>
                  <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/60 dark:border-teal-800/40">
                    <div className="text-teal-700 dark:text-teal-400 text-[11px]">Khoảng tứ phân vị (ΔQ)</div>
                    <div className="text-base font-bold text-teal-800 dark:text-teal-300">{groupedStats.IQR}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Mốt ghép nhóm (Mo)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{groupedStats.mode}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Độ lệch chuẩn (s)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{groupedStats.stdDev}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px]">Phương sai (s²)</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{groupedStats.variance}</div>
                  </div>
                </div>
              )}

              {/* Báo giá trị bất thường nếu có */}
              {dataType === 'raw' && rawStats && rawStats.outliers.length > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Phát hiện {rawStats.outliers.length} giá trị bất thường (Outliers):</strong> {rawStats.outliers.join(', ')}.
                    <div className="text-[11px] opacity-80 mt-0.5">
                      (Nằm ngoài khoảng [{rawStats.lowerBound}; {rawStats.upperBound}])
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (7 CỘT): KHU VỰC VẼ BIỂU ĐỒ VECTOR TRỰC QUAN & XUẤT ẢNH */}
        <div className="lg:col-span-7 space-y-4">
          {/* THANH ĐIỀU KHIỂN XUẤT ẢNH */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Dạng biểu đồ:</span>
              <div className="inline-flex p-0.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setChartType('both')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    chartType === 'both' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kết hợp cả hai
                </button>
                <button
                  onClick={() => setChartType('box')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    chartType === 'box' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Chỉ Biểu đồ hộp
                </button>
                {dataType === 'grouped' && (
                  <button
                    onClick={() => setChartType('hist')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      chartType === 'hist' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Chỉ Biểu đồ cột
                  </button>
                )}
              </div>
            </div>

            {/* CÁC NÚT SAO CHÉP / TẢI VỀ */}
            <div className="flex items-center gap-2">
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
                title="Tải ảnh PNG độ phân giải 300 DPI"
              >
                <Download size={13} />
                <span>PNG</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Tải ảnh định dạng vector SVG (phóng to không vỡ nét)"
              >
                <Download size={13} />
                <span>SVG</span>
              </button>
            </div>
          </div>

          {/* KHUNG VẼ BIỂU ĐỒ BẰNG SVG VECTOR */}
          <div className="bg-white dark:bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center overflow-x-auto min-h-[420px]">
            {(() => {
              const stats = dataType === 'raw' ? rawStats : groupedStats;
              if (!stats) {
                return (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Vui lòng nhập ít nhất 4 giá trị số liệu hợp lệ để hệ thống dựng biểu đồ.
                  </div>
                );
              }

              // ==========================================
              // TÍNH TOÁN TỌA ĐỘ VẼ SVG CHUẨN XÁC
              // ==========================================
              const svgW = 760;
              const isHistIncluded = dataType === 'grouped' && (chartType === 'both' || chartType === 'hist');
              const svgH = isHistIncluded ? (chartType === 'both' ? 440 : 320) : 260;
              
              const padLeft = 70;
              const padRight = 50;
              const plotW = svgW - padLeft - padRight;

              // Tìm min, max trên trục số để căn tỉ lệ
              let axisMin = stats.min;
              let axisMax = stats.max;

              if (dataType === 'raw' && rawStats && rawStats.outliers.length > 0) {
                axisMin = Math.min(axisMin, ...rawStats.outliers);
                axisMax = Math.max(axisMax, ...rawStats.outliers);
              }

              const marginSpan = (axisMax - axisMin) * 0.1 || 5;
              const scaleMin = Math.floor(axisMin - marginSpan);
              const scaleMax = Math.ceil(axisMax + marginSpan);
              const scaleRange = scaleMax - scaleMin || 1;

              const getX = (val: number) => padLeft + ((val - scaleMin) / scaleRange) * plotW;

              // Các vạch chia trục số (5 đến 8 mốc)
              const tickCount = 7;
              const step = Math.round(scaleRange / tickCount) || 1;
              const ticks: number[] = [];
              for (let t = Math.ceil(scaleMin / step) * step; t <= scaleMax; t += step) {
                ticks.push(t);
              }

              // Tọa độ biểu đồ hộp (Boxplot)
              const boxY = isHistIncluded ? (chartType === 'both' ? 70 : 0) : 95;
              const boxHeight = 62;

              const xQ1 = getX(stats.Q1);
              const xQ2 = getX(stats.Q2);
              const xQ3 = getX(stats.Q3);

              const xWhiskerMin = getX(dataType === 'raw' && rawStats ? rawStats.whiskerMin : stats.min);
              const xWhiskerMax = getX(dataType === 'raw' && rawStats ? rawStats.whiskerMax : stats.max);

              return (
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full max-w-[760px] h-auto select-none"
                  style={{ fontFamily: fontFamilyStyle, backgroundColor: '#ffffff' }}
                >
                  {/* TIÊU ĐỀ BIỂU ĐỒ */}
                  <text
                    x={svgW / 2}
                    y={28}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize="16"
                    fontWeight={isBold ? 'bold' : 'normal'}
                  >
                    {dataType === 'raw'
                      ? 'BIỂU ĐỒ HỘP (BOX PLOT) PHÂN BỐ DỮ LIỆU'
                      : chartType === 'hist'
                      ? 'BIỂU ĐỒ CỘT TẦN SỐ GHÉP NHÓM (HISTOGRAM)'
                      : 'BIỂU ĐỒ HỘP & TẦN SỐ GHÉP NHÓM THEO SGK'}
                  </text>

                  {/* 1. VẼ BIỂU ĐỒ CỘT GHÉP NHÓM (NẾU CÓ) */}
                  {isHistIncluded && groupedStats && (
                    <g className="histogram-group">
                      {(() => {
                        const histBaseY = chartType === 'both' ? 360 : 250;
                        const maxBarH = chartType === 'both' ? 140 : 160;
                        const maxF = groupedStats.maxFreq || 1;

                        return (
                          <>
                            {/* Trục tung Y của histogram */}
                            <line
                              x1={padLeft - 10}
                              y1={histBaseY}
                              x2={padLeft - 10}
                              y2={histBaseY - maxBarH - 20}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={padLeft - 15}
                              y={histBaseY - maxBarH - 12}
                              textAnchor="end"
                              fill="#475569"
                              fontSize="11"
                              fontStyle="italic"
                            >
                              Tần số (m)
                            </text>

                            {/* Các cột của từng nhóm */}
                            {groupedStats.sortedGroups.map((g, idx) => {
                              const xStart = getX(g.start);
                              const xEnd = getX(g.end);
                              const barW = Math.max(1, xEnd - xStart);
                              const barH = (g.freq / maxF) * maxBarH;
                              const barY = histBaseY - barH;

                              return (
                                <g key={g.id}>
                                  <rect
                                    x={xStart}
                                    y={barY}
                                    width={barW}
                                    height={barH}
                                    fill="#ccfbf1"
                                    stroke="#0d9488"
                                    strokeWidth="1.5"
                                  />
                                  {/* Nhãn tần số trên đầu cột */}
                                  <text
                                    x={xStart + barW / 2}
                                    y={barY - 6}
                                    textAnchor="middle"
                                    fill="#0f766e"
                                    fontSize="11"
                                    fontWeight={isBold ? 'bold' : 'normal'}
                                  >
                                    {g.freq}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </g>
                  )}

                  {/* 2. VẼ BIỂU ĐỒ HỘP (BOX PLOT) */}
                  {chartType !== 'hist' && (
                    <g className="boxplot-group">
                      {/* Râu bên trái (Whisker Left) */}
                      <line
                        x1={xWhiskerMin}
                        y1={boxY + boxHeight / 2}
                        x2={xQ1}
                        y2={boxY + boxHeight / 2}
                        stroke="#0f766e"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                      {/* Đầu mút râu trái */}
                      <line
                        x1={xWhiskerMin}
                        y1={boxY + 8}
                        x2={xWhiskerMin}
                        y2={boxY + boxHeight - 8}
                        stroke="#0f766e"
                        strokeWidth="2"
                      />

                      {/* Râu bên phải (Whisker Right) */}
                      <line
                        x1={xQ3}
                        y1={boxY + boxHeight / 2}
                        x2={xWhiskerMax}
                        y2={boxY + boxHeight / 2}
                        stroke="#0f766e"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                      {/* Đầu mút râu phải */}
                      <line
                        x1={xWhiskerMax}
                        y1={boxY + 8}
                        x2={xWhiskerMax}
                        y2={boxY + boxHeight - 8}
                        stroke="#0f766e"
                        strokeWidth="2"
                      />

                      {/* HỘP TỨ PHÂN VỊ [Q1, Q3] */}
                      <rect
                        x={xQ1}
                        y={boxY}
                        width={Math.max(2, xQ3 - xQ1)}
                        height={boxHeight}
                        fill="#f0fdfa"
                        stroke="#0d9488"
                        strokeWidth="2.5"
                        rx="2"
                      />

                      {/* VẠCH TRUNG VỊ Q2 (ĐỎ NỔI BẬT) */}
                      <line
                        x1={xQ2}
                        y1={boxY}
                        x2={xQ2}
                        y2={boxY + boxHeight}
                        stroke="#e11d48"
                        strokeWidth="3"
                      />

                      {/* ĐÁNH DẤU GIÁ TRỊ BẤT THƯỜNG (OUTLIERS) BẰNG DẤU CHẤM SAO HOẶC TRÒN ĐỎ */}
                      {showOutliers && dataType === 'raw' && rawStats && rawStats.outliers.map((val, idx) => {
                        const ox = getX(val);
                        return (
                          <g key={idx}>
                            <circle
                              cx={ox}
                              cy={boxY + boxHeight / 2}
                              r="6"
                              fill="#ef4444"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                            <text
                              x={ox}
                              y={boxY - 14}
                              textAnchor="middle"
                              fill="#ef4444"
                              fontSize="14"
                              fontWeight={isBold ? 'bold' : 'normal'}
                            >
                              {val}*
                            </text>
                          </g>
                        );
                      })}

                      {/* NHÃN GIÁ TRỊ TRÊN CÁC ĐỈNH HỘP */}
                      {/* Q1 */}
                      <text
                        x={xQ1}
                        y={boxY - 12}
                        textAnchor="middle"
                        fill="#0f766e"
                        fontSize="16"
                        fontWeight={isBold ? 'bold' : 'normal'}
                      >
                        Q₁ = {stats.Q1}
                      </text>
                      {/* Q2 (Trung vị) */}
                      <text
                        x={xQ2}
                        y={boxY + boxHeight + 22}
                        textAnchor="middle"
                        fill="#e11d48"
                        fontSize="17"
                        fontWeight={isBold ? 'bold' : 'normal'}
                      >
                        Me = {stats.Q2}
                      </text>
                      {/* Q3 */}
                      <text
                        x={xQ3}
                        y={boxY - 12}
                        textAnchor="middle"
                        fill="#0f766e"
                        fontSize="16"
                        fontWeight={isBold ? 'bold' : 'normal'}
                      >
                        Q₃ = {stats.Q3}
                      </text>

                      {/* Min / Max Whisker */}
                      <text
                        x={xWhiskerMin}
                        y={boxY + boxHeight + 20}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="14"
                        fontWeight={isBold ? 'bold' : 'normal'}
                      >
                        Min: {dataType === 'raw' && rawStats ? rawStats.whiskerMin : stats.min}
                      </text>
                      <text
                        x={xWhiskerMax}
                        y={boxY + boxHeight + 20}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="14"
                        fontWeight={isBold ? 'bold' : 'normal'}
                      >
                        Max: {dataType === 'raw' && rawStats ? rawStats.whiskerMax : stats.max}
                      </text>
                    </g>
                  )}

                  {/* 3. TRỤC SỐ NGANG HOÀNH ĐỘ (CHUNG CHO CẢ HAI) */}
                  {(() => {
                    const axisY = svgH - 45;
                    return (
                      <g className="horizontal-axis">
                        {/* Đường trục số ngang */}
                        <line
                          x1={padLeft - 10}
                          y1={axisY}
                          x2={svgW - padRight + 20}
                          y2={axisY}
                          stroke="#334155"
                          strokeWidth="2.5"
                        />
                        {/* Mũi tên trục số */}
                        <polygon
                          points={`${svgW - padRight + 20},${axisY - 5} ${svgW - padRight + 32},${axisY} ${svgW - padRight + 20},${axisY + 5}`}
                          fill="#334155"
                        />
                        <text
                          x={svgW - padRight + 36}
                          y={axisY + 5}
                          fill="#334155"
                          fontSize="17"
                          fontStyle="italic"
                          fontWeight={isBold ? 'bold' : 'normal'}
                        >
                          x
                        </text>

                        {/* Các vạch chia và số trên trục */}
                        {ticks.map((t) => {
                          const tx = getX(t);
                          return (
                            <g key={t}>
                              <line
                                x1={tx}
                                y1={axisY}
                                x2={tx}
                                y2={axisY + 7}
                                stroke="#334155"
                                strokeWidth="2"
                              />
                              <text
                                x={tx}
                                y={axisY + 24}
                                textAnchor="middle"
                                fill="#1e293b"
                                fontSize="15"
                                fontWeight={isBold ? 'bold' : 'normal'}
                              >
                                {t}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}
