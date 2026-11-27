import React, { useState } from 'react';
import { Sparkles, RotateCcw, Box, Loader2, AlertCircle, Copy, Play, Eye } from 'lucide-react';

interface Props {
  apiKey: string;
  model: string;
}

export default function Geogebra3DTool({ apiKey, model }: Props) {
  const [activeTab, setActiveTab] = useState<'ai3d' | 'revolution'>('ai3d');
  const [lessonContent, setLessonContent] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [ggbCode, setGgbCode] = useState('');
  const [explanationText, setExplanationText] = useState('');

  // Tròn xoay Ox
  const [revFx, setRevFx] = useState('sqrt(x)');
  const [revGx, setRevGx] = useState('0');
  const [revA, setRevA] = useState('0');
  const [revB, setRevB] = useState('4');

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              setImageBase64(event.target.result);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'revolution') {
      const code = `// 1. Parameters
a_val = ${revA.replace(/^x\s*=\s*/i, '')}
b_val = ${revB.replace(/^x\s*=\s*/i, '')}
alpha = Slider(0, 2pi, 0.05)
SetValue(alpha, 0)

// 2. Functions
f_raw(x) = ${revFx}
g_raw(x) = ${revGx || '0'}
f = Function(f_raw, a_val, b_val)
g = Function(g_raw, a_val, b_val)

// 3. Static Flat Region
flatArea = Surface(u, v * f_raw(u) + (1 - v) * g_raw(u), 0, u, a_val, b_val, v, 0, 1)
SetColor(flatArea, "Blue")
SetFilling(flatArea, 0.25)
hatching = Sequence(Segment((k, f_raw(k), 0), (k, g_raw(k), 0)), k, a_val, b_val, (b_val-a_val)/21.1)
SetColor(hatching, "Blue")

// 4. Boundary Points
PtA1 = (a_val, f_raw(a_val), 0)
PtA2 = (a_val, g_raw(a_val), 0)
PtB1 = (b_val, f_raw(b_val), 0)
PtB2 = (b_val, g_raw(b_val), 0)

// 5. Solid Volume of Revolution
surfF = Surface(f, alpha, xAxis)
surfG = Surface(g, alpha, xAxis)
SetColor(surfF, "Orange")
SetColor(surfG, "Orange")

capA = Surface(a_val, r * cos(w), r * sin(w), r, Min(f_raw(a_val), g_raw(a_val)), Max(f_raw(a_val), g_raw(a_val)), w, 0, alpha)
capB = Surface(b_val, r * cos(w), r * sin(w), r, Min(f_raw(b_val), g_raw(b_val)), Max(f_raw(b_val), g_raw(b_val)), w, 0, alpha)
SetColor(capA, "Orange")
SetColor(capB, "Orange")

crossSection = Surface(u, (v*f_raw(u) + (1-v)*g_raw(u)) * cos(alpha), (v*f_raw(u) + (1-v)*g_raw(u)) * sin(alpha), u, a_val, b_val, v, 0, 1)
SetColor(crossSection, "Orange")
SetFilling(crossSection, 0.8)`;
      setGgbCode(code);
      setExplanationText('Đã dựng khối tròn xoay đặc quay quanh trục Ox với thanh trượt góc quay alpha.');
      return;
    }

    if (!apiKey) {
      setError('Vui lòng nhập API Key ở phần Cài đặt.');
      return;
    }

    if (!lessonContent.trim() && !imageBase64) {
      setError('Vui lòng nhập đề bài hoặc dán ảnh bài toán.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const prompt = `ROLE: You are a Geometry Algorithms Expert & GeoGebra Specialist. Convert Math Problems into precise GeoGebra commands in 3D (x, y, z).
Output strictly standard English GeoGebra commands inside \`\`\`geogebra ... \`\`\` block.
User problem:
${lessonContent}`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey, model, imageBase64 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gọi AI');

      const text = data.text || '';
      const match = text.match(/```(?:geogebra)?\s*([\s\S]*?)```/);
      if (match) {
        setGgbCode(match[1].trim());
        setExplanationText(text.replace(/```(?:geogebra)?\s*[\s\S]*?```/, '').trim());
      } else {
        setGgbCode(text.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo mã GeoGebra');
    } finally {
      setIsProcessing(false);
    }
  };

  const getIframeSrcdoc = () => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>GeoGebra 3D</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #f8fafc; font-family: sans-serif; }
    #ggb-element { width: 100%; height: 100%; }
    .loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.85); z-index: 100; font-weight: bold; color: #0d9488; }
    .float-btn {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;
      padding: 10px 20px; font-size: 13px; font-weight: bold; 
      background: #0d9488; color: white; border: none; border-radius: 9999px; cursor: pointer; 
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4); display: flex; align-items: center; gap: 8px;
    }
    .float-btn:hover { background: #0f766e; }
  </style>
  <script src="https://www.geogebra.org/apps/deployggb.js"></script>
</head>
<body>
  <div id="loading" class="loading-overlay">Đang tải GeoGebra 3D...</div>
  ${activeTab === 'revolution' ? `
  <button id="btnRotate" class="float-btn">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    Bắt đầu quay quanh Ox
  </button>` : ''}
  <div id="ggb-element"></div>
  <script>
    var params = {
      "appName": "3d",
      "width": window.innerWidth,
      "height": window.innerHeight,
      "showToolBar": true,
      "showAlgebraInput": true,
      "showMenuBar": true,
      "language": "vi",
      "appletOnLoad": function(api) {
        document.getElementById('loading').style.display = 'none';
        api.setErrorDialogsActive(false);
        var script = ${JSON.stringify(ggbCode)};
        var lines = script.split('\\n');
        lines.forEach(function(line) {
          var execLine = line.trim().split('//')[0].trim();
          if(execLine !== '') {
            try { api.evalCommand(execLine); } catch(e) {}
          }
        });
        ${activeTab === 'revolution' ? `
        var isRotating = false;
        var btnRotate = document.getElementById('btnRotate');
        if (btnRotate) {
          btnRotate.addEventListener('click', function() {
            isRotating = !isRotating;
            api.setAnimating('alpha', isRotating);
            if(isRotating) { api.startAnimation(); btnRotate.innerText = 'Tạm dừng quay'; }
            else { api.stopAnimation(); btnRotate.innerText = 'Tiếp tục quay Ox'; }
          });
        }` : ''}
      }
    };
    var applet = new GGBApplet(params, true);
    window.addEventListener("load", function() { applet.inject('ggb-element'); });
  </script>
</body>
</html>`;
  };

  // Đồng bộ hai chiều với thanh Ribbon Word
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('lvp_vanban_state_change', {
        detail: { space3dSubTab: activeTab },
      })
    );
  }, [activeTab]);

  React.useEffect(() => {
    const onRibbonAction = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (!action) return;
      if (action.type === 'space3d_mode' && action.mode) {
        setActiveTab(action.mode);
      }
    };
    window.addEventListener('lvp_vanban_ribbon_action', onRibbonAction);
    return () => window.removeEventListener('lvp_vanban_ribbon_action', onRibbonAction);
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Nút chuyển chế độ */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('ai3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'ai3d' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles size={14} />
          GeoGebra 3D AI
        </button>
        <button
          onClick={() => setActiveTab('revolution')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'revolution' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <RotateCcw size={14} />
          Khối tròn xoay Ox
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cột trái: Điều khiển & Đầu vào */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-4">
          {activeTab === 'ai3d' ? (
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                Mô tả bài toán hình học hoặc dán ảnh:
              </span>
              <textarea
                value={lessonContent}
                onChange={e => setLessonContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Ví dụ: Cho hình chóp S.ABC có đáy ABC là tam giác vuông tại B, SA vuông góc với đáy ABC..."
                className="w-full h-36 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs leading-relaxed outline-none focus:border-teal-500"
              />
              {imageBase64 && (
                <div className="relative inline-block border rounded-xl overflow-hidden">
                  <img src={imageBase64} alt="Đề bài" className="max-h-24 object-contain" />
                  <button
                    onClick={() => setImageBase64(null)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                Cấu hình mặt giới hạn hình phẳng quay quanh Ox:
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Đường cong trên y = f(x):
                  </label>
                  <input
                    type="text"
                    value={revFx}
                    onChange={e => setRevFx(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Đường cong dưới y = g(x) (trục Ox = 0):
                  </label>
                  <input
                    type="text"
                    value={revGx}
                    onChange={e => setRevGx(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Cận trái a:</label>
                    <input
                      type="text"
                      value={revA}
                      onChange={e => setRevA(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Cận phải b:</label>
                    <input
                      type="text"
                      value={revB}
                      onChange={e => setRevB(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {activeTab === 'ai3d' ? 'Dựng mô hình GeoGebra 3D AI' : 'Tạo khối tròn xoay Ox'}
          </button>
        </div>

        {/* Cột phải: Khung GeoGebra 3D tương tác */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs flex flex-col min-h-[500px]">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-teal-600" />
              Môi trường tương tác GeoGebra 3D:
            </span>
            {ggbCode && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                Đã tải mô hình
              </span>
            )}
          </div>

          <div className="w-full flex-1 min-h-[460px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            {ggbCode ? (
              <iframe
                srcDoc={getIframeSrcdoc()}
                className="w-full h-full min-h-[460px] border-0"
                title="GeoGebra 3D Frame"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[460px] text-center p-6 text-slate-400 space-y-2">
                <Box size={40} className="text-slate-300 dark:text-slate-700" />
                <p className="text-xs">
                  Nhập dữ kiện bài toán hoặc thiết lập cận hàm số và bấm{' '}
                  <strong className="text-teal-600">"Dựng mô hình"</strong> để khởi tạo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
