import React, { useState, useRef } from 'react';
import { Loader2, AlertCircle, Play, Download, Copy, PencilRuler, Sparkles, FileText, RotateCcw } from 'lucide-react';

interface Props {
  apiKey: string;
  model: string;
}

export default function GeogebraGenerator({ apiKey, model }: Props) {
  const [lessonContent, setLessonContent] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isConvertingMath, setIsConvertingMath] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'geometry' | 'revolution'>('geometry');
  
  const [revFx, setRevFx] = useState('');
  const [revGx, setRevGx] = useState('');
  const [revA, setRevA] = useState('');
  const [revB, setRevB] = useState('');
  const [focusedInput, setFocusedInput] = useState<'revFx' | 'revGx' | 'revA' | 'revB'>('revFx');
  
  const handleInsertSymbol = (symbol: string) => {
    if (focusedInput === 'revFx') setRevFx(prev => prev + symbol);
    else if (focusedInput === 'revGx') setRevGx(prev => prev + symbol);
    else if (focusedInput === 'revA') setRevA(prev => prev + symbol);
    else if (focusedInput === 'revB') setRevB(prev => prev + symbol);
  };
  
  const [ggbCode, setGgbCode] = useState('');
  const [explanationText, setExplanationText] = useState('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let hasImage = false;
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
        hasImage = true;
        break; // Only handle the first image
      }
    }
    
    if (hasImage) return;

    // Handle HTML (Word MathType) paste
    const htmlData = e.clipboardData.getData('text/html');
    if (htmlData && (htmlData.includes('<m:oMath') || htmlData.includes('mml:math') || htmlData.includes('<!--[if gte mso') || htmlData.includes('<math'))) {
      e.preventDefault(); // Ngăn dán chữ thường bị mất công thức
      
      if (!apiKey) {
        setError('Vui lòng cấu hình API Key để tính năng tự động dịch công thức hoạt động.');
        return;
      }
      
      setIsConvertingMath(true);
      setError('');
      
      try {
        const prompt = `You are an expert MathML and HTML parser. I will provide you with an HTML string copied from Microsoft Word/Web which contains math formulas (MathML, OMML, etc).
Task: Convert the entire HTML string into plain text. 
CRITICAL RULE: ALL mathematical formulas, variables, and equations MUST be strictly converted into LaTeX format wrapped in $...$ (for inline) or $$...$$ (for blocks).
DO NOT include any HTML tags in your output. DO NOT include any markdown code blocks (like \`\`\`latex). Just return the raw plain text with LaTeX math embedded.
HTML content:
${htmlData}`;
        
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            model: model || 'gemini-1.5-pro',
            apiKey: apiKey
          })
        });
        
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        const text = data.text || '';
        
        if (text) {
          setLessonContent(prev => prev + (prev ? '\\n' : '') + text.trim());
        }
      } catch (err: any) {
        console.error("Lỗi khi chuyển đổi công thức:", err);
        setError("Lỗi khi dịch công thức từ Clipboard. Vui lòng thử chụp và dán ảnh thay thế.");
      } finally {
        setIsConvertingMath(false);
      }
    }
  };

  const removeImage = () => {
    setImageBase64(null);
  };

  const handleGenerateOutline = async () => {
    if (activeTab === 'geometry') {
      if (!lessonContent.trim() && !imageBase64) {
        setError("Vui lòng nhập bài toán hoặc dán ảnh cần vẽ.");
        return;
      }
    } else {
      if (!revFx.trim() || !revA.trim() || !revB.trim()) {
        setError("Vui lòng nhập đầy đủ f(x), a, và b.");
        return;
      }
    }
    if (!apiKey) {
      setError('Vui lòng cấu hình API Key trước khi sử dụng.');
      return;
    }

    setIsGeneratingOutline(true);
    setError('');

    try {
      const prompt = `Bạn là một chuyên gia Hình học và GeoGebra. Dựa vào yêu cầu bài toán sau, hãy phân tích và viết ra một DÀN Ý CHI TIẾT (các bước dựng hình, xác định tọa độ các điểm quan trọng trong không gian 3D, các mặt phẳng, đường thẳng...) để chuẩn bị cho việc dựng hình bằng GeoGebra 3D.
CHỈ trả về phần dàn ý chi tiết bằng tiếng Việt, giải thích rõ ràng cách xác định tọa độ. KHÔNG TRẢ VỀ MÃ CODE GEOGEBRA.

YÊU CẦU:
${activeTab === 'revolution' ? `Vẽ khối tròn xoay tạo bởi hình phẳng giới hạn bởi: y = ${revFx}, y = ${revGx || '0'}, x = ${revA}, x = ${revB} quay quanh trục Ox.` : lessonContent}`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model: model || 'gemini-1.5-pro',
          apiKey: apiKey,
          imageBase64: activeTab === 'geometry' ? imageBase64 : undefined
        })
      });

      if (!res.ok) {
         throw new Error("Lỗi từ máy chủ API khi gọi mô hình.");
      }
      
      const data = await res.json();
      let text = data.text || '';
      
      if (text) {
        if (activeTab === 'geometry') {
            setLessonContent(prev => {
                const separator = '\n\n--- DÀN Ý CHI TIẾT DỰNG HÌNH ---\n';
                if (prev.includes('--- DÀN Ý CHI TIẾT DỰNG HÌNH ---')) {
                    const parts = prev.split('--- DÀN Ý CHI TIẾT DỰNG HÌNH ---');
                    return parts[0].trim() + separator + text.trim();
                }
                return prev.trim() + separator + text.trim();
            });
        }
      }
      
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi soạn dàn ý.");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'geometry') {
      if (!lessonContent.trim() && !imageBase64) {
        setError("Vui lòng nhập bài toán hoặc dán ảnh cần vẽ.");
        return;
      }
    } else {
      if (!revFx.trim() || !revA.trim() || !revB.trim()) {
        setError("Vui lòng nhập đầy đủ f(x), a, và b.");
        return;
      }
    }
    if (!apiKey) {
      setError('Vui lòng cấu hình API Key trước khi sử dụng.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setGgbCode('');
    setExplanationText('');

    try {
      const geometrySpecific = `GEOMETRY MODE: 3D Geometry (Hình học không gian).
IMPORTANT: You MUST attach a coordinate system and use 3D coordinates (x, y, z) for all points (e.g., A=(0,0,0)).`;

      const revolutionSpecific = `GEOMETRY MODE: Function Surface of Revolution (Mặt tròn xoay hàm số).
CRITICAL TEMPLATE: You MUST output EXACTLY the following GeoGebra script structure for Phase 3. Just replace the placeholders [f_expr], [g_expr], [a_val], [b_val] with the user's data. DO NOT add or remove any commands.

\`\`\`geogebra
// 1. Parameters
a_val = [a_val]
b_val = [b_val]
alpha = Slider(0, 2pi, 0.05)
SetValue(alpha, 0)

// 2. Functions (Pure math for calculations, Restricted for rendering)
f_raw(x) = [f_expr]
g_raw(x) = [g_expr]
f = Function(f_raw, a_val, b_val)
g = Function(g_raw, a_val, b_val)

// 3. Static Flat Region (Mặt phẳng ban đầu)
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
PtsIntersect = Intersect(f, g, a_val, b_val)

// 5. Solid Volume of Revolution (Khối tròn xoay ĐẶC)
// Tuyệt đối không chỉ quay mỗi 2 đường viền để tạo vỏ rỗng, mà quay toàn bộ mặt cắt để tạo KHỐI ĐẶC hoàn toàn kín!
// 5.1 Vỏ ngoài và vỏ trong
surfF = Surface(f, alpha, xAxis)
surfG = Surface(g, alpha, xAxis)
SetColor(surfF, "Orange")
SetColor(surfG, "Orange")

// 5.2 Hai nắp đậy (End caps) để bịt kín 2 đầu
capA = Surface(a_val, r * cos(w), r * sin(w), r, Min(f_raw(a_val), g_raw(a_val)), Max(f_raw(a_val), g_raw(a_val)), w, 0, alpha)
capB = Surface(b_val, r * cos(w), r * sin(w), r, Min(f_raw(b_val), g_raw(b_val)), Max(f_raw(b_val), g_raw(b_val)), w, 0, alpha)
SetColor(capA, "Orange")
SetColor(capB, "Orange")

// 5.3 Mặt cắt đang quét (Leading sweep face)
crossSection = Surface(u, (v*f_raw(u) + (1-v)*g_raw(u)) * cos(alpha), (v*f_raw(u) + (1-v)*g_raw(u)) * sin(alpha), u, a_val, b_val, v, 0, 1)
SetColor(crossSection, "Orange")
SetFilling(crossSection, 0.8)
\`\`\``;

      const prompt = `ROLE: You are a Geometry Algorithms Expert & GeoGebra Specialist. Your mission is to convert Math Problems into precise GeoGebra constructions using a strict, logical workflow.
CRITICAL INSTRUCTION: You MUST ALWAYS output the GeoGebra script inside a \`\`\`geogebra ... \`\`\` block. NEVER refuse to generate code. If a function has asymptotes, discontinuities, or divergent integrals, IGNORE the math errors and generate the script anyway. GeoGebra will handle it.
YÊU CẦU TUYỆT ĐỐI TỪ NGƯỜI DÙNG: Không phải chỉ quay mỗi 2 cái đường viền để tạo thành một lớp vỏ rỗng tuếch, mà bạn phải quay toàn bộ "cục" hình phẳng đó để tạo thành một KHỐI ĐẶC hoàn toàn kín (Solid of Revolution). Khối này phải đặc ruột như một khối pho-mát hay khúc gỗ, bịt kín cả 2 nắp và mặt cắt. KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI LÚC NÀY LÚC KHÁC!

${activeTab === 'geometry' ? geometrySpecific : revolutionSpecific}

MANDATORY WORKFLOW: You must process every request in exactly these 4 sequential phases:

PHASE 1: TASK CONFIRMATION (Xác nhận nhiệm vụ)
Identify the core object (e.g., Triangle, Function, Circle). Restate the specific requirements given by the user (lengths, angles, specific geometric constraints). Output Language: Vietnamese.

PHASE 2: ALGORITHM ANALYSIS (Phân tích cách dựng)
Before writing any code, outline the Step-by-Step Construction Plan. Define the logic:
Where to place the anchor point (usually Origin (0,0)). How to determine dependent points. Mathematical formulas needed (if any). Output Language: Vietnamese.

PHASE 3: GEOGEBRA SCRIPT (Thực thi)
Write the standard English GeoGebra commands based strictly on the plan in Phase 2. Enclose in a \`\`\`geogebra block. Rules:
1. Use explicit valid commands (Point, Segment, Circle, Intersect, Polygon).
2. DO NOT use made-up commands (e.g., SetOpacity -> use SetFilling; Project -> use Intersect(Line, PerpendicularPlane(Point, Line))).
3. CRITICAL: For SetColor, use ONLY string colors (e.g., "Red", "Blue") or SetColor(<Object>, <R>, <G>, <B>) where RGB are 0-1. DO NOT pass an array like {r,g,b,a}.
4. CRITICAL: DO NOT append inline comments (//) at the end of command lines.
5. Use Slider for variable parameters to make the diagram dynamic. Style the output for clarity.
6. CRITICAL AESTHETICS: You MUST explicitly hide ALL auxiliary planes (like PerpendicularPlane) and infinite construction lines (Line) from the 3D view using SetVisibleInView(<ObjectName>, -1, false) (Note: -1 is the ID for the 3D Graphics View). If you need to connect two points, ALWAYS use Segment. Keep the final drawing extremely clean, only showing the main shape and requested points.
7. CRITICAL COMPLETENESS: You MUST explicitly create, name, and draw EVERY single point mentioned in the user's request (e.g., if the request mentions H, I, K, you must define H=..., I=..., K=...). If you need to reference an edge for intersection (e.g., SB), you MUST explicitly define it first (e.g., lineSB = Line(S, B)) before using it.
8. CRITICAL 3D SHAPES: You MUST use built-in GeoGebra commands for 3D solids. Use Pyramid(...) or Prism(...) for polyhedrons. For geometric solids of revolution (khối tròn xoay cơ bản), use Cone, Cylinder, or Sphere. To revolve a function or curve around an axis (quay hàm số quanh trục), you MUST use Surface(<Function>, <Angle>, <Axis>) (e.g. surf = Surface(f, \alpha, xAxis)). You MUST ensure this Surface is VISIBLE and beautifully colored using SetColor and SetFilling. NEVER build a 3D solid manually using Segments.
9. CRITICAL ANGLES: If you create any Angle (especially right angles), you MUST hide its label using ShowLabel(<AngleName>, false). Do NOT display texts like "\alpha = 90°" on the diagram.
10. CRITICAL IMMOBILITY: All geometric objects MUST be completely fixed so they cannot be accidentally dragged by the mouse. You MUST use SetFixed(<PointName>, true) for all base/free points (e.g. Origin A=(0,0,0)). The ONLY way the shape should change is by adjusting the Sliders.
PHASE 4: USER GUIDE (Hướng dẫn sử dụng)
Briefly explain how to use the specific script (what sliders to adjust). Output Language: Vietnamese.

RESPONSE TEMPLATE (Mẫu câu trả lời bạn phải tuân theo):
1. XÁC NHẬN NHIỆM VỤ
Đối tượng: [Ví dụ: Hình chóp S.ABCD]
Dữ kiện: [Ví dụ: Đáy hình vuông tâm O, SA vuông góc đáy]

2. PHÂN TÍCH CÁCH DỰNG
Để đảm bảo hình vẽ chính xác, tôi sẽ thực hiện theo các bước:
Cố định: Đặt tâm O tại gốc tọa độ (0,0,0).
Dựng đáy: Xác định tọa độ A, B, C, D dựa vào tâm O. Dựng đa giác đáy.
Dựng đỉnh: Xác định tọa độ S.
Dựng khối chóp: Dùng lệnh Pyramid(Đáy, Đỉnh) để tạo khối 3D.

3. GEOGEBRA SCRIPT
Đoạn mã
\`\`\`geogebra
// 1. Parameters
a = Slider(1, 10, 0.1)
SetValue(a, 4)
// 2. Base Construction
O = Point({0, 0, 0})
...
\`\`\`

4. HƯỚNG DẪN SỬ DỤNG
- Copy đoạn code trên vào khung nhập lệnh của GeoGebra 3D.
- Kéo thanh trượt để thay đổi kích thước khối chóp.

[YÊU CẦU CỦA NGƯỜI DÙNG]
${activeTab === 'revolution' ? `Vẽ hình phẳng giới hạn bởi: y = ${revFx}, y = ${revGx || '0'}, x = ${revA.replace(/^x\s*=\s*/i, '')}, x = ${revB.replace(/^x\s*=\s*/i, '')}. Sau đó quay hình phẳng này quanh trục Ox.` : lessonContent}`;

      if (activeTab === 'revolution') {
        // Xử lý trực tiếp, không gọi API để tiết kiệm thời gian và đảm bảo độ chính xác 100%
        const templateMatch = revolutionSpecific.match(/```geogebra([\s\S]*?)```/i);
        let code = templateMatch ? templateMatch[1].trim() : '';
        code = code
            .replace(/\[f_expr\]/g, revFx)
            .replace(/\[g_expr\]/g, revGx || '0')
            .replace(/\[a_val\]/g, revA.replace(/^x\s*=\s*/i, ''))
            .replace(/\[b_val\]/g, revB.replace(/^x\s*=\s*/i, ''));
        
        setGgbCode(code);
        setExplanationText('Đã dựng khối tròn xoay thành công 100% bằng thuật toán toán học tĩnh (Bỏ qua xử lý AI để tăng tốc độ và độ chính xác).');
        setIsProcessing(false);
        return;
      }

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model: model || 'gemini-1.5-pro',
          apiKey: apiKey,
          imageBase64: imageBase64
        })
      });

      if (!res.ok) {
         throw new Error("Lỗi từ máy chủ API khi gọi mô hình.");
      }
      
      const data = await res.json();
      let text = data.text || '';
      
      // Extract Geogebra code
      const match = text.match(/```(?:geogebra)?\s*\n([\s\S]*?)(?:```|$)/i) || text.match(/```\s*\n([\s\S]*?)(?:```|$)/i);
      let code = match ? match[1].trim() : text.trim();
      code = code.replace(/^```[^\n]*\n?/gm, '').replace(/```$/gm, '').trim();
      
      // Remove the code block from the explanation
      const explanation = text.replace(/```geogebra[\s\S]*?```/i, '').trim();

      if (!code) {
        throw new Error("AI không sinh ra được mã GeoGebra nào. Hãy thử mô tả bài toán rõ ràng hơn.");
      }

      setGgbCode(code);
      setExplanationText(explanation);
      
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getIframeSrcdoc = () => {
    if (!ggbCode) return '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GeoGebra Applet</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #f8fafc; font-family: sans-serif; }
    #ggb-element { width: 100%; height: 100%; }
    .loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.8); z-index: 100; font-weight: bold; color: #475569; }
    .float-btn {
        position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 1000;
        padding: 12px 24px; font-family: sans-serif; font-size: 16px; font-weight: bold; 
        background: #9333ea; color: white; border: none; border-radius: 9999px; cursor: pointer; 
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4); display: flex; align-items: center; gap: 8px;
        transition: all 0.2s;
    }
    .float-btn:hover { background: #7e22ce; transform: translateX(-50%) scale(1.05); }
    .float-btn.active { background: #e11d48; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4); }
    .float-btn.active:hover { background: #be123c; }
  </style>
  <script src="https://www.geogebra.org/apps/deployggb.js"></script>
</head>
<body>
  <div id="loading" class="loading-overlay">Đang tải công cụ GeoGebra...</div>
  ${activeTab === 'revolution' ? `
  <button id="btnRotate" class="float-btn">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    Quay quanh trục Ox
  </button>
  ` : ''}
  <div id="ggb-element"></div>
  <script>
    var params = {
        "appName": "3d",
        "width": window.innerWidth,
        "height": window.innerHeight,
        "showToolBar": true,
        "showAlgebraInput": true,
        "showMenuBar": true,
        "useBrowserForJS": false,
        "language": "vi",
        "appletOnLoad": function(api) {
            document.getElementById('loading').style.display = 'none';
            // Tắt các thông báo lỗi popup của GeoGebra (nếu AI sinh sai lệnh)
            api.setErrorDialogsActive(false);
            
            var script = ${JSON.stringify(ggbCode)};
            var lines = script.split('\\n');
            var errors = [];
            
            // Execute line by line
            lines.forEach(function(line) {
                var originalLine = line.trim();
                var execLine = originalLine.split('//')[0].trim();
                
                if(execLine !== '') {
                    // Handle potential errors per line to not break the whole script
                    try {
                        var res = api.evalCommand(execLine);
                        // Bỏ qua báo lỗi đỏ cho các lệnh trang trí (bắt đầu bằng Set) 
                        // vì nó không làm hỏng cấu trúc hình học.
                        if (res === false && !execLine.startsWith("Set")) {
                            errors.push(originalLine);
                        }
                    } catch(e) {
                        if (!execLine.startsWith("Set")) {
                            errors.push(originalLine);
                        }
                        console.error("Error executing command:", originalLine, e);
                    }
                }
            });
            
            ${activeTab === 'revolution' ? `
            var isRotating = false;
            var btnRotate = document.getElementById('btnRotate');
            if (btnRotate) {
                btnRotate.addEventListener('click', function() {
                    isRotating = !isRotating;
                    api.setAnimating('alpha', isRotating);
                    if(isRotating) {
                        api.startAnimation();
                        this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Dừng quay';
                        this.classList.add('active');
                    } else {
                        api.stopAnimation();
                        this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg> Tiếp tục quay';
                        this.classList.remove('active');
                    }
                });
            }
            ` : ''}

            if (errors.length > 0) {
                 var errorHtml = "<div style='position:absolute; inset:0; background:rgba(255,255,255,0.9); z-index:9999; padding:20px; overflow:auto;'>";
                 errorHtml += "<h3 style='color:#ef4444; font-family:sans-serif;'>AI đã sinh ra mã lệnh không hợp lệ</h3>";
                 errorHtml += "<p style='font-family:sans-serif; font-size:14px; color:#333;'>Các lệnh bị GeoGebra từ chối (có thể do sai ngôn ngữ hoặc sai cú pháp):</p>";
                 errorHtml += "<pre style='background:#fee2e2; color:#991b1b; padding:10px; border-radius:8px; font-size:12px; white-space:pre-wrap;'>" + errors.join('\\n') + "</pre>";
                 errorHtml += "<button onclick='this.parentElement.remove()' style='margin-top:10px; padding:6px 12px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;'>Đóng cảnh báo</button>";
                 errorHtml += "</div>";
                 document.body.insertAdjacentHTML('beforeend', errorHtml);
            } else if (api.getObjectNumber() === 0) {
                 var errorHtml = "<div style='position:absolute; inset:0; background:white; z-index:9999; padding:20px; overflow:auto;'>";
                 errorHtml += "<h3 style='color:#ef4444; font-family:sans-serif;'>Không thể vẽ hình</h3>";
                 errorHtml += "<p style='font-family:sans-serif; font-size:14px; color:#333;'>Script được chạy nhưng không tạo ra đối tượng nào.</p>";
                 errorHtml += "</div>";
                 document.body.insertAdjacentHTML('beforeend', errorHtml);
            }
        }
    };
    
    try {
        var applet = new GGBApplet(params, true);
        applet.inject('ggb-element');
    } catch(e) {
        document.body.insertAdjacentHTML('beforeend', "<div style='position:absolute; inset:0; background:white; z-index:9999; padding:20px;'><h3 style='color:red;'>Lỗi tải GGBApplet</h3><p>" + e.message + "</p></div>");
    }
    
    window.addEventListener("resize", function() {
        // ggbApplet is the global api object created by GGBApplet
        if (typeof ggbApplet !== 'undefined') {
            ggbApplet.setSize(window.innerWidth, window.innerHeight);
        }
    });
  </script>
  <div style="position: absolute; bottom: 20px; left: 20px; z-index: 999; display: flex; gap: 10px;">
      <button id="toggle-axes-btn" style="padding: 8px 12px; background: white; border: 1px solid #ccc; border-radius: 8px; cursor: pointer; font-family: sans-serif; font-size: 13px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: #333; display: flex; gap: 6px; align-items: center; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>
          Bật/Tắt Hệ trục
      </button>
      <button id="toggle-point-coords-btn" style="padding: 8px 12px; background: white; border: 1px solid #ccc; border-radius: 8px; cursor: pointer; font-family: sans-serif; font-size: 13px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: #333; display: flex; gap: 6px; align-items: center; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 19L15 15"/></svg>
          Bật/Tắt Tọa độ Điểm
      </button>
  </div>
  <script>
    var axesVisible = true;
    document.getElementById('toggle-axes-btn').addEventListener('click', function() {
        if (typeof ggbApplet !== 'undefined') {
            axesVisible = !axesVisible;
            ggbApplet.evalCommand('ShowAxes(' + axesVisible + ')');
            ggbApplet.evalCommand('ShowGrid(' + axesVisible + ')');
            // Luôn là không gian 3D
            ggbApplet.evalCommand('ShowAxes(3, ' + axesVisible + ')');
            ggbApplet.evalCommand('ShowGrid(3, ' + axesVisible + ')');
        }
    });

    var pointCoordsVisible = false;
    document.getElementById('toggle-point-coords-btn').addEventListener('click', function() {
        if (typeof ggbApplet !== 'undefined') {
            pointCoordsVisible = !pointCoordsVisible;
            var mode = pointCoordsVisible ? 1 : 0; // 1: Tên & Giá trị, 0: Chỉ Tên
            var allObjs = ggbApplet.getAllObjectNames();
            for (var i = 0; i < allObjs.length; i++) {
                if (ggbApplet.getObjectType(allObjs[i]) === 'point') {
                    ggbApplet.setLabelStyle(allObjs[i], mode);
                    ggbApplet.setLabelVisible(allObjs[i], true);
                }
            }
        }
    });
  </script>
</body>
</html>`;
  };

  const downloadHtml = () => {
    if (!ggbCode) return;
    const blob = new Blob([getIframeSrcdoc()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "geogebra_drawing.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
       <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <PencilRuler size={20} />
          </div>
          Vẽ hình GeoGebra Tự Động
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl mx-auto">
          Mô tả bài toán hình học hoặc đồ thị, AI sẽ phân tích cách dựng và viết Script để tự động vẽ hình trên GeoGebra.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-2 justify-center -mb-2">
          <button 
            onClick={() => setActiveTab('geometry')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'geometry' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          >
            Hình học không gian
          </button>
          <button 
            onClick={() => setActiveTab('revolution')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'revolution' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          >
            Mặt tròn xoay (Hàm số)
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                {activeTab === 'geometry' ? 'Đề bài Toán (Không gian 3D):' : 'Hàm số & Góc quay (Mặt tròn xoay):'}
              </label>
            </div>
            <div className="relative flex-1 w-full min-h-[150px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
              {isConvertingMath && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                  <Loader2 className="animate-spin mb-2" size={24} />
                  <span className="text-sm font-medium">Đang dịch công thức sang LaTeX...</span>
                </div>
              )}
              {activeTab === 'geometry' ? (
                <>
                  <textarea
                    className="w-full flex-1 p-4 text-sm bg-transparent border-none outline-none resize-none"
                    placeholder="Ví dụ: Vẽ một hình chóp S.ABCD... HOẶC Bấm Ctrl+V để dán ảnh chụp đề bài vào đây."
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    onPaste={handlePaste}
                  />
                  {imageBase64 && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-start gap-3">
                      <div className="relative group">
                        <img src={imageBase64} alt="Đề bài" className="h-16 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm bg-white" />
                        <button 
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa ảnh"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đã đính kèm ảnh đề bài.<br/>AI sẽ kết hợp cả ảnh và chữ để vẽ hình.</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col p-4 gap-4 bg-transparent w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hàm số f(x) <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200" placeholder="VD: x^3 - 3*x" value={revFx} onChange={e => setRevFx(e.target.value)} onFocus={() => setFocusedInput('revFx')} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hàm số g(x) (Tùy chọn, mặc định y=0)</label>
                      <input type="text" className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200" placeholder="VD: x" value={revGx} onChange={e => setRevGx(e.target.value)} onFocus={() => setFocusedInput('revGx')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Giới hạn a (Từ x = ...) <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200" placeholder="VD: 0" value={revA} onChange={e => setRevA(e.target.value)} onFocus={() => setFocusedInput('revA')} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Giới hạn b (Đến x = ...) <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full p-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200" placeholder="VD: 2" value={revB} onChange={e => setRevB(e.target.value)} onFocus={() => setFocusedInput('revB')} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <strong className="text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
                      <Sparkles size={16} /> Chèn nhanh phép toán:
                    </strong>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      <button onClick={() => handleInsertSymbol('*')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Nhân (*)
                      </button>
                      <button onClick={() => handleInsertSymbol('/')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Chia (/)
                      </button>
                      <button onClick={() => handleInsertSymbol('^')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Lũy thừa (^)
                      </button>
                      <button onClick={() => handleInsertSymbol('sqrt()')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Căn bậc 2
                      </button>
                      <button onClick={() => handleInsertSymbol('cbrt()')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Căn bậc 3
                      </button>
                      <button onClick={() => handleInsertSymbol('pi')} className="p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-300 transition-colors shadow-sm text-center">
                        Số Pi (π)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
              <button
                onClick={() => { setLessonContent(''); setImageBase64(null); setRevFx(''); setRevGx(''); setRevA(''); setRevB(''); setGgbCode(''); setExplanationText(''); setError(''); }}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 shadow-sm shrink-0"
                title="Xóa làm lại - Bắt đầu lại từ đầu"
              >
                <RotateCcw size={18} />
                <span className="hidden sm:inline text-xs">Xóa làm lại</span>
              </button>
              {activeTab === 'geometry' && (
                <button
                  onClick={handleGenerateOutline}
                  disabled={isGeneratingOutline || (!lessonContent.trim() && !imageBase64)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                    (isGeneratingOutline || (!lessonContent.trim() && !imageBase64))
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:border-blue-400 dark:text-blue-400'
                  }`}
                >
                  {isGeneratingOutline ? (
                    <><Loader2 size={18} className="animate-spin" /> Đang soạn dàn ý...</>
                  ) : (
                    <><FileText size={18} /> Soạn dàn ý chi tiết</>
                  )}
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isProcessing || (activeTab === 'geometry' ? (!lessonContent.trim() && !imageBase64) : (!revFx.trim() || !revA.trim() || !revB.trim()))}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 ${
                  (isProcessing || (activeTab === 'geometry' ? (!lessonContent.trim() && !imageBase64) : (!revFx.trim() || !revA.trim() || !revB.trim())))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500 shadow-none'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Đang vẽ hình...</>
                ) : (
                  <><Sparkles size={18} /> Vẽ hình GeoGebra</>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm overflow-auto max-h-64">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="font-medium whitespace-pre-wrap">{error}</div>
            </div>
          )}


        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
          <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center z-10">
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Bảng vẽ GeoGebra</span>
            {ggbCode && (
              <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={() => { setLessonContent(''); setImageBase64(null); setRevFx(''); setRevGx(''); setRevA(''); setRevB(''); setGgbCode(''); setExplanationText(''); setError(''); }}
                   className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1.5 shadow-2xs"
                   title="Xóa làm lại"
                 >
                   <RotateCcw size={14} /> <span>Làm lại</span>
                 </button>
                 <button onClick={() => navigator.clipboard.writeText(ggbCode)} className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1.5">
                   <Copy size={14} /> Copy Script
                 </button>
                 <button onClick={downloadHtml} className="px-3 py-1.5 text-xs font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5">
                   <Download size={14} /> Tải HTML
                 </button>
              </div>
            )}
          </div>
          <div className="w-full h-[700px] overflow-hidden bg-white dark:bg-slate-900 relative">
             {!ggbCode && !isProcessing && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm p-4 text-center">
                 Hình vẽ sẽ hiển thị ở đây sau khi AI chạy Script thành công.
               </div>
             )}
             {isProcessing && (
               <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                 <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
                 <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI đang viết Script GeoGebra...</span>
               </div>
             )}
             
             {ggbCode && (
                <iframe
                  ref={iframeRef}
                  srcDoc={getIframeSrcdoc()}
                  title="GeoGebra Output"
                  className="w-full h-full border-0 block"
                  sandbox="allow-scripts allow-same-origin allow-downloads"
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
