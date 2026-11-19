import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Play, 
  MonitorPlay, 
  Copy, 
  Download, 
  Sparkles, 
  RotateCcw, 
  Check, 
  ExternalLink,
  Code2,
  Sliders,
  TrendingUp,
  CircleDot,
  Compass,
  Maximize2
} from 'lucide-react';

interface Props {
  apiKey: string;
  model: string;
}

interface SimulationPreset {
  id: string;
  title: string;
  category: 'Đồ thị & Giải tích' | 'Khái niệm Đại số & Hình' | 'Khoa học Tích hợp';
  icon: string;
  description: string;
  prompt: string;
  code: string;
}

const PRESETS: SimulationPreset[] = [
  {
    id: 'tangent_derivative',
    title: 'Đạo hàm & Tiếp tuyến chuyển động',
    category: 'Đồ thị & Giải tích',
    icon: '📈',
    description: 'Mô phỏng ý nghĩa hình học của đạo hàm: tiếp tuyến di chuyển dọc theo đồ thị, hệ số góc k = f\'(x₀) biến thiên liên tục.',
    prompt: 'Mô phỏng đồ thị hàm số bậc ba f(x) = 0.5x³ - 1.5x có thanh trượt cho hoành độ x₀ từ -2.2 đến 2.2. Vẽ đường tiếp tuyến màu đỏ tại điểm M(x₀, f(x₀)) với hệ số góc k = f\'(x₀) hiển thị trực tiếp lên bảng thông số.',
    code: `let sliderX0;

function setup() {
  createCanvas(windowWidth < 650 ? windowWidth - 40 : 620, 420);
  sliderX0 = createSlider(-2.2, 2.2, -1.0, 0.05);
  sliderX0.position(20, 20);
  sliderX0.style('width', '160px');
}

function draw() {
  background(248, 250, 252);
  
  let ox = width / 2;
  let oy = height / 2 + 10;
  let scaleUnit = 60;
  
  // Grid lines
  stroke(226, 232, 240);
  strokeWeight(1);
  for (let x = -5; x <= 5; x++) {
    line(ox + x * scaleUnit, 0, ox + x * scaleUnit, height);
  }
  for (let y = -4; y <= 4; y++) {
    line(0, oy - y * scaleUnit, width, oy - y * scaleUnit);
  }
  
  // Axes Ox, Oy
  stroke(100, 116, 139);
  strokeWeight(1.5);
  line(30, oy, width - 30, oy);
  line(ox, height - 20, ox, 20);
  fill(100, 116, 139);
  noStroke();
  textSize(12);
  text("x", width - 25, oy + 15);
  text("y", ox + 10, 25);
  text("O", ox - 15, oy + 15);

  function f(x) { return 0.5 * pow(x, 3) - 1.5 * x; }
  function df(x) { return 1.5 * pow(x, 2) - 1.5; }
  
  // Draw curve
  noFill();
  stroke(13, 148, 136); // Teal
  strokeWeight(2.5);
  beginShape();
  for (let px = 30; px <= width - 30; px += 2) {
    let xVal = (px - ox) / scaleUnit;
    let yVal = f(xVal);
    let py = oy - yVal * scaleUnit;
    vertex(px, py);
  }
  endShape();
  
  // Selected point M
  let x0 = sliderX0.value();
  let y0 = f(x0);
  let slope = df(x0);
  
  let mx = ox + x0 * scaleUnit;
  let my = oy - y0 * scaleUnit;
  
  // Tangent line: y - y0 = slope * (x - x0)
  stroke(239, 68, 68);
  strokeWeight(2);
  let tanX1 = -4.0;
  let tanY1 = slope * (tanX1 - x0) + y0;
  let tanX2 = 4.0;
  let tanY2 = slope * (tanX2 - x0) + y0;
  line(ox + tanX1 * scaleUnit, oy - tanY1 * scaleUnit, ox + tanX2 * scaleUnit, oy - tanY2 * scaleUnit);
  
  // Point M
  fill(239, 68, 68);
  stroke(255);
  strokeWeight(2);
  circle(mx, my, 12);
  
  // Dashed projection lines
  stroke(148, 163, 184);
  strokeWeight(1);
  drawingContext.setLineDash([4, 4]);
  line(mx, my, mx, oy);
  line(mx, my, ox, my);
  drawingContext.setLineDash([]);
  
  // Info Panel
  noStroke();
  fill(255, 255, 255, 240);
  rect(width - 235, 15, 220, 115, 10);
  stroke(203, 213, 225);
  noFill();
  rect(width - 235, 15, 220, 115, 10);
  
  fill(15, 23, 42);
  noStroke();
  textStyle(BOLD);
  textSize(12);
  text("f(x) = 0.5x³ - 1.5x", width - 220, 38);
  textStyle(NORMAL);
  textSize(12);
  fill(13, 148, 136);
  text("x₀ = " + x0.toFixed(2), width - 220, 60);
  text("y₀ = " + y0.toFixed(2), width - 220, 80);
  fill(220, 38, 38);
  textStyle(BOLD);
  text("Hệ số góc k = f'(x₀) = " + slope.toFixed(2), width - 220, 105);
  
  fill(71, 85, 105);
  textStyle(NORMAL);
  textSize(11);
  text("Kéo thanh trượt để di chuyển tiếp điểm x₀", 20, 52);
}`
  },
  {
    id: 'cubic_exploration',
    title: 'Khảo sát hàm số bậc ba với Slider',
    category: 'Đồ thị & Giải tích',
    icon: '📊',
    description: 'Điều chỉnh hệ số a, b, c, d của hàm số y = ax³ + bx² + cx + d và quan sát hình dáng đồ thị, cực trị và điểm uốn.',
    prompt: 'Xây dựng mô phỏng khảo sát hàm số bậc 3 y = ax³ + bx² + cx + d với 4 thanh trượt cho a, b, c, d. Hiển thị nghiệm của y\' = 0 (cực đại, cực tiểu) và vẽ điểm uốn trên đồ thị.',
    code: `let sliderA, sliderB, sliderC, sliderD;

function setup() {
  createCanvas(windowWidth < 650 ? windowWidth - 40 : 620, 440);
  sliderA = createSlider(-2, 2, 0.5, 0.1);
  sliderA.position(20, 20);
  sliderB = createSlider(-3, 3, 0, 0.2);
  sliderB.position(20, 45);
  sliderC = createSlider(-5, 5, -2, 0.2);
  sliderC.position(20, 70);
  sliderD = createSlider(-3, 3, 0, 0.2);
  sliderD.position(20, 95);
}

function draw() {
  background(248, 250, 252);
  
  let a = sliderA.value();
  let b = sliderB.value();
  let c = sliderC.value();
  let d = sliderD.value();
  
  let ox = width / 2;
  let oy = height / 2 + 10;
  let scaleUnit = 45;
  
  // Grid
  stroke(226, 232, 240);
  strokeWeight(1);
  for (let x = -6; x <= 6; x++) line(ox + x * scaleUnit, 0, ox + x * scaleUnit, height);
  for (let y = -5; y <= 5; y++) line(0, oy - y * scaleUnit, width, oy - y * scaleUnit);
  
  // Axes
  stroke(100, 116, 139);
  strokeWeight(1.5);
  line(20, oy, width - 20, oy);
  line(ox, height - 20, ox, 20);
  fill(100, 116, 139);
  noStroke();
  textSize(12);
  text("x", width - 15, oy + 15);
  text("y", ox + 10, 25);
  text("O", ox - 15, oy + 15);
  
  function f(x) { return a * pow(x, 3) + b * pow(x, 2) + c * x + d; }
  
  // Curve
  noFill();
  stroke(37, 99, 235); // Blue 600
  strokeWeight(2.5);
  beginShape();
  for (let px = 20; px <= width - 20; px += 2) {
    let xVal = (px - ox) / scaleUnit;
    let yVal = f(xVal);
    let py = oy - yVal * scaleUnit;
    vertex(px, py);
  }
  endShape();
  
  // Inflection point: y'' = 6ax + 2b = 0 => x = -b / (3a)
  if (abs(a) > 0.05) {
    let xUon = -b / (3 * a);
    let yUon = f(xUon);
    fill(217, 119, 6);
    stroke(255);
    strokeWeight(2);
    circle(ox + xUon * scaleUnit, oy - yUon * scaleUnit, 10);
    noStroke();
    fill(217, 119, 6);
    textSize(11);
    text("Điểm uốn", ox + xUon * scaleUnit + 8, oy - yUon * scaleUnit - 8);
  }
  
  // Labels for sliders
  fill(15, 23, 42);
  noStroke();
  textSize(11);
  text("a = " + a.toFixed(1), 165, 35);
  text("b = " + b.toFixed(1), 165, 60);
  text("c = " + c.toFixed(1), 165, 85);
  text("d = " + d.toFixed(1), 165, 110);
  
  // Formula panel
  fill(255, 255, 255, 240);
  stroke(203, 213, 225);
  rect(width - 260, 15, 245, 80, 8);
  noStroke();
  fill(37, 99, 235);
  textStyle(BOLD);
  textSize(13);
  text("y = " + a.toFixed(1) + "x³ + " + b.toFixed(1) + "x² + " + c.toFixed(1) + "x + " + d.toFixed(1), width - 245, 40);
  fill(71, 85, 105);
  textStyle(NORMAL);
  textSize(11);
  text("Đạo hàm: y' = " + (3*a).toFixed(1) + "x² + " + (2*b).toFixed(1) + "x + " + c.toFixed(1), width - 245, 65);
}`
  },
  {
    id: 'riemann_integral',
    title: 'Tích phân & Tổng diện tích Riemann',
    category: 'Đồ thị & Giải tích',
    icon: '📐',
    description: 'Minh họa trực quan định nghĩa tích phân: chia nhỏ diện tích dưới đường cong thành n hình chữ nhật Riemann khi n tăng dần.',
    prompt: 'Mô phỏng tính diện tích hình phẳng dưới đường cong hàm số f(x) = sin(x) + 1.2 trên đoạn [0, 4] bằng tổng Riemann. Có thanh trượt cho số dải phân hoạch n từ 2 đến 40.',
    code: `let sliderN;

function setup() {
  createCanvas(windowWidth < 650 ? windowWidth - 40 : 620, 420);
  sliderN = createSlider(2, 40, 8, 1);
  sliderN.position(20, 20);
  sliderN.style('width', '160px');
}

function draw() {
  background(248, 250, 252);
  
  let ox = 80;
  let oy = 340;
  let scaleX = 110;
  let scaleY = 100;
  
  // Axes
  stroke(100, 116, 139);
  strokeWeight(1.5);
  line(40, oy, width - 40, oy);
  line(ox, oy + 20, ox, 40);
  fill(100, 116, 139);
  noStroke();
  textSize(12);
  text("x", width - 35, oy + 15);
  text("y", ox + 10, 45);
  text("O", ox - 15, oy + 15);
  
  function f(x) { return sin(x) + 1.2; }
  
  let a = 0.2;
  let b = 4.0;
  let n = sliderN.value();
  let dx = (b - a) / n;
  let riemannSum = 0;
  
  // Draw Riemann Rectangles
  for (let i = 0; i < n; i++) {
    let xi = a + i * dx;
    let h = f(xi);
    riemannSum += h * dx;
    
    let rx = ox + xi * scaleX;
    let ry = oy - h * scaleY;
    let rw = dx * scaleX;
    let rh = h * scaleY;
    
    fill(13, 148, 136, 140); // Teal transparent
    stroke(13, 148, 136);
    strokeWeight(1);
    rect(rx, ry, rw, rh);
  }
  
  // Draw function curve
  noFill();
  stroke(15, 118, 110);
  strokeWeight(3);
  beginShape();
  for (let px = 50; px <= width - 50; px += 2) {
    let xVal = (px - ox) / scaleX;
    let yVal = f(xVal);
    let py = oy - yVal * scaleY;
    vertex(px, py);
  }
  endShape();
  
  // Exact integral: int_{0.2}^{4} (sin(x)+1.2) dx = [-cos(x) + 1.2x]_{0.2}^{4}
  let exact = (-cos(4) + 1.2 * 4) - (-cos(0.2) + 1.2 * 0.2);
  
  // Info Panel
  fill(255, 255, 255, 240);
  stroke(203, 213, 225);
  rect(width - 250, 15, 230, 110, 10);
  noStroke();
  fill(15, 23, 42);
  textStyle(BOLD);
  textSize(13);
  text("Tích phân: ∫ [sin(x) + 1.2] dx", width - 235, 38);
  textStyle(NORMAL);
  textSize(12);
  fill(13, 148, 136);
  text("Số dải phân hoạch n = " + n, width - 235, 62);
  text("Tổng Riemann ≈ " + riemannSum.toFixed(4), width - 235, 84);
  fill(220, 38, 38);
  textStyle(BOLD);
  text("Giá trị chính xác ≈ " + exact.toFixed(4), width - 235, 108);
  
  fill(71, 85, 105);
  textStyle(NORMAL);
  textSize(11);
  text("Số dải chia n: " + n + " (Kéo tăng n để xấp xỉ chính xác hơn)", 20, 52);
}`
  },
  {
    id: 'trig_circle',
    title: 'Đường tròn lượng giác & Đồ thị sóng Sin',
    category: 'Đồ thị & Giải tích',
    icon: '🔄',
    description: 'Chuyển động tròn đều trên đường tròn lượng giác đơn vị được gióng trực tiếp sang đồ thị hàm số y = sin(x).',
    prompt: 'Mô phỏng đường tròn lượng giác đơn vị ở bên trái có điểm P chuyển động theo góc alpha. Gióng hình chiếu của P lên trục tung sang bên phải để vẽ đồ thị hàm số y = sin(x).',
    code: `let angle = 0;
let wave = [];
let speedSlider;

function setup() {
  createCanvas(windowWidth < 650 ? windowWidth - 40 : 640, 400);
  speedSlider = createSlider(0.01, 0.08, 0.03, 0.005);
  speedSlider.position(20, 20);
  speedSlider.style('width', '140px');
}

function draw() {
  background(248, 250, 252);
  
  let circleX = 140;
  let circleY = height / 2;
  let radius = 80;
  
  // Coordinate axes for circle
  stroke(203, 213, 225);
  strokeWeight(1);
  line(circleX - radius - 20, circleY, circleX + radius + 20, circleY);
  line(circleX, circleY - radius - 20, circleX, circleY + radius + 20);
  
  // Unit circle
  noFill();
  stroke(100, 116, 139);
  strokeWeight(2);
  circle(circleX, circleY, radius * 2);
  
  // Point on circle P(cos a, sin a)
  let px = circleX + radius * cos(angle);
  let py = circleY - radius * sin(angle);
  
  // Radius vector
  stroke(13, 148, 136);
  strokeWeight(2);
  line(circleX, circleY, px, py);
  
  fill(13, 148, 136);
  noStroke();
  circle(px, py, 10);
  
  // Add current y to wave history
  wave.unshift(py);
  if (wave.length > 360) wave.pop();
  
  // Wave coordinate axes
  let waveStartX = 280;
  stroke(148, 163, 184);
  line(waveStartX, circleY, width - 20, circleY);
  line(waveStartX, 40, waveStartX, height - 40);
  fill(100, 116, 139);
  noStroke();
  textSize(12);
  text("x (rad)", width - 35, circleY + 15);
  text("y = sin(x)", waveStartX + 10, 45);
  
  // Dashed projection line from circle to wave
  stroke(239, 68, 68);
  strokeWeight(1.5);
  drawingContext.setLineDash([4, 4]);
  line(px, py, waveStartX, py);
  drawingContext.setLineDash([]);
  
  // Draw wave curve
  noFill();
  stroke(16, 185, 129);
  strokeWeight(2.5);
  beginShape();
  for (let i = 0; i < wave.length; i++) {
    vertex(waveStartX + i, wave[i]);
  }
  endShape();
  
  fill(239, 68, 68);
  noStroke();
  circle(waveStartX, py, 8);
  
  // Info text
  fill(15, 23, 42);
  textSize(12);
  text("Tốc độ quay: " + speedSlider.value().toFixed(3), 20, 55);
  
  let currentVal = sin(angle);
  fill(13, 148, 136);
  textStyle(BOLD);
  text("sin(α) = " + currentVal.toFixed(2), circleX - 35, circleY + radius + 35);
  
  angle += speedSlider.value();
}`
  },
  {
    id: 'vector_addition',
    title: 'Tổng & Hiệu hai Vectơ (Quy tắc hình bình hành)',
    category: 'Khái niệm Đại số & Hình',
    icon: '➡️',
    description: 'Kéo thả các đầu mút vectơ u và v để quan sát trực tiếp vectơ tổng u + v và hình bình hành được tạo thành.',
    prompt: 'Mô phỏng phép cộng hai vectơ theo quy tắc hình bình hành. Cho phép người dùng kéo thả chuột để thay đổi độ lớn và góc của hai vectơ u và v. Vẽ vectơ tổng w = u + v màu đỏ.',
    code: `let u = { x: 120, y: -60 };
let v = { x: 60, y: 100 };
let draggingU = false;
let draggingV = false;

function setup() {
  createCanvas(windowWidth < 650 ? windowWidth - 40 : 620, 420);
}

function draw() {
  background(248, 250, 252);
  
  let ox = 180;
  let oy = 240;
  
  // Grid
  stroke(226, 232, 240);
  strokeWeight(1);
  for (let x = 0; x <= width; x += 30) line(x, 0, x, height);
  for (let y = 0; y <= height; y += 30) line(0, y, width, y);
  
  // Parallelogram dashed lines
  stroke(148, 163, 184);
  strokeWeight(1.5);
  drawingContext.setLineDash([4, 4]);
  line(ox + u.x, oy + u.y, ox + u.x + v.x, oy + u.y + v.y);
  line(ox + v.x, oy + v.y, ox + u.x + v.x, oy + u.y + v.y);
  drawingContext.setLineDash([]);
  
  function drawArrow(x1, y1, x2, y2, clr, label) {
    stroke(clr);
    strokeWeight(2.5);
    fill(clr);
    line(x1, y1, x2, y2);
    let angle = atan2(y2 - y1, x2 - x1);
    push();
    translate(x2, y2);
    rotate(angle);
    triangle(0, 0, -10, -4, -10, 4);
    pop();
    noStroke();
    textSize(13);
    textStyle(BOLD);
    text(label, x2 + 8, y2 + 5);
  }
  
  // Vector u
  drawArrow(ox, oy, ox + u.x, oy + u.y, color(13, 148, 136), "u");
  // Vector v
  drawArrow(ox, oy, ox + v.x, oy + v.y, color(37, 99, 235), "v");
  // Resultant vector w = u + v
  drawArrow(ox, oy, ox + u.x + v.x, oy + u.y + v.y, color(220, 38, 38), "w = u + v");
  
  // Drag handles
  fill(13, 148, 136);
  stroke(255);
  strokeWeight(2);
  circle(ox + u.x, oy + u.y, 14);
  
  fill(37, 99, 235);
  circle(ox + v.x, oy + v.y, 14);
  
  // Origin
  fill(15, 23, 42);
  circle(ox, oy, 8);
  noStroke();
  text("O", ox - 15, oy + 15);
  
  // Info Card
  fill(255, 255, 255, 240);
  stroke(203, 213, 225);
  rect(width - 240, 15, 220, 110, 10);
  noStroke();
  fill(15, 23, 42);
  textStyle(BOLD);
  textSize(13);
  text("Quy tắc hình bình hành", width - 225, 38);
  textStyle(NORMAL);
  textSize(12);
  fill(13, 148, 136);
  text("|u| = " + sqrt(u.x*u.x + u.y*u.y).toFixed(1) + " px", width - 225, 60);
  fill(37, 99, 235);
  text("|v| = " + sqrt(v.x*v.x + v.y*v.y).toFixed(1) + " px", width - 225, 80);
  fill(220, 38, 38);
  textStyle(BOLD);
  let lenW = sqrt(sq(u.x + v.x) + sq(u.y + v.y));
  text("|u + v| = " + lenW.toFixed(1) + " px", width - 225, 105);
  
  fill(71, 85, 105);
  textStyle(NORMAL);
  textSize(11);
  text("💡 Kéo chuột tại các đầu mút xanh để thay đổi vectơ", 20, 30);
}

function mousePressed() {
  let ox = 180;
  let oy = 240;
  if (dist(mouseX, mouseY, ox + u.x, oy + u.y) < 20) draggingU = true;
  else if (dist(mouseX, mouseY, ox + v.x, oy + v.y) < 20) draggingV = true;
}

function mouseDragged() {
  let ox = 180;
  let oy = 240;
  if (draggingU) {
    u.x = mouseX - ox;
    u.y = mouseY - oy;
  } else if (draggingV) {
    v.x = mouseX - ox;
    v.y = mouseY - oy;
  }
}

function mouseReleased() {
  draggingU = false;
  draggingV = false;
}`
  }
];

export default function SimulationGenerator({ apiKey, model }: Props) {
  const [lessonContent, setLessonContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [p5Code, setP5Code] = useState(PRESETS[0].code);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize with first preset
  useEffect(() => {
    setLessonContent(PRESETS[0].prompt);
  }, []);

  const handleSelectPreset = (preset: SimulationPreset) => {
    setSelectedPresetId(preset.id);
    setLessonContent(preset.prompt);
    setP5Code(preset.code);
    setError('');
    setViewMode('preview');
  };

  const handleEnhancePrompt = async () => {
    if (!lessonContent.trim()) {
      setError("Vui lòng nhập ý tưởng hoặc bài toán mô phỏng trước.");
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      const prompt = `Bạn là một Chuyên gia thiết kế Công cụ Giáo dục Tương tác Toán học và Khoa học.
Người dùng có ý tưởng làm mô phỏng tương tác: "${lessonContent}"

Nhiệm vụ: Hãy phân tích và viết ra một KỊCH BẢN YÊU CẦU MÔ PHỎNG chi tiết cho lập trình viên p5.js:
1. Đặt gốc tọa độ ở đâu, hệ trục tọa độ thế nào (gốc ở giữa, tỉ lệ pixel/đơn vị).
2. Các yếu tố tương tác (Thanh trượt/Slider cho những thông số nào, giới hạn min, max, bước nhảy bao nhiêu).
3. Chi tiết hình vẽ (Màu sắc, đường nét, điểm nhấn, chuyển động).
4. Các thông số cần tính toán và in ra màn hình (cực trị, nghiệm, diện tích, góc, độ dài...).
5. Công thức toán học (trình bày công thức giải tích/hình học liên quan).

CHỈ TRẢ VỀ ĐOẠN VĂN BẢN KỊCH BẢN ĐÓ. KHÔNG GIẢI THÍCH, KHÔNG CHÀO HỎI. Trình bày dạng gạch đầu dòng rõ ràng.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model: model || 'gemini-3-flash-preview',
          apiKey: apiKey
        })
      });

      if (!res.ok) {
         throw new Error("Lỗi khi kết nối đến AI.");
      }
      
      const data = await res.json();
      let text = data.text || '';
      setLessonContent(text.trim());
      
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo kịch bản.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!lessonContent.trim()) {
      setError("Vui lòng nhập nội dung khái niệm hoặc đồ thị cần mô phỏng.");
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const prompt = `Bạn là một Kỹ sư phần mềm Giáo dục chuyên sử dụng thư viện p5.js để xây dựng các Mô phỏng Tương tác Toán học và Khoa học trực quan (tương tự như PhET Simulations hay Desmos/GeoGebra tương tác).

Nhiệm vụ của bạn là đọc yêu cầu mô phỏng dưới đây và viết mã code p5.js (JavaScript) hoàn chỉnh, tương tác mượt mà:
"""
${lessonContent}
"""

[QUY TẮC BẮT BUỘC KHẮT KHE VỀ CODE]
1. CHỈ TRẢ VỀ DUY NHẤT MÃ CODE JAVASCRIPT, bọc trong khối \`\`\`javascript ... \`\`\` hoặc trả thẳng raw text. TUYỆT ĐỐI KHÔNG có lời chào hỏi hay giải thích bên ngoài.
2. Hàm \`setup()\` tạo canvas có kích thước tự co giãn phù hợp, ví dụ: \`createCanvas(windowWidth < 650 ? windowWidth - 40 : 620, 420);\`.
3. BẮT BUỘC PHẢI CÓ TƯƠNG TÁC (INTERACTIVITY):
   - Tạo ít nhất 1-2 \`createSlider()\` hoặc cho phép kéo thả chuột (\`mousePressed\`, \`mouseDragged\`) để người dùng thay đổi tham số (ví dụ: hệ số hàm số, hoành độ tiếp điểm x0, số dải phân hoạch n, góc quay, vận tốc...).
   - Định vị slider bằng \`.position(x, y)\` hợp lý để không đè lên hình vẽ.
4. THẨM MỸ CAO & SƯ PHẠM:
   - Sử dụng màu sắc sư phạm, rõ nét: Teal, Blue, Emerald, Amber, Red.
   - Nền canvas sáng sủa (\`background(248, 250, 252)\`).
   - Có hệ trục tọa độ rõ ràng, vạch chia tỉ lệ chuẩn.
   - Có khung Info Card hiển thị thông số động và công thức toán học tính toán theo thời gian thực.
5. TỰ DO & ĐỘC LẬP: Không gọi thư viện hay asset ngoài không hỗ trợ, code chạy độc lập hoàn toàn trong p5.js 1.9.0.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          model: model || 'gemini-3-flash-preview',
          apiKey: apiKey
        })
      });

      if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || "Lỗi từ máy chủ API khi gọi mô hình.");
      }
      
      const data = await res.json();
      let text = data.text || '';
      
      const match = text.match(/```(?:javascript|js)?\s*\n([\s\S]*?)(?:```|$)/i) || text.match(/```\s*\n([\s\S]*?)(?:```|$)/i);
      let finalCode = match ? match[1].trim() : text.trim();
      finalCode = finalCode.replace(/^```[^\n]*\n?/gm, '').replace(/```$/gm, '').trim();

      if (!finalCode.includes('function setup') || !finalCode.includes('function draw')) {
        throw new Error("Mã code sinh ra không đúng định dạng p5.js. Vui lòng bấm thử lại.");
      }

      setP5Code(finalCode);
      setSelectedPresetId('');
      setViewMode('preview');
      
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = () => {
    if (!p5Code) return;
    navigator.clipboard.writeText(p5Code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    if (!p5Code) return;
    const blob = new Blob([getIframeSrcdoc()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mo_phong_tuong_tac_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFullscreen = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(getIframeSrcdoc());
      newWindow.document.close();
    }
  };

  const getIframeSrcdoc = () => {
    if (!p5Code) return '';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mô Phỏng Tương Tác Toán Học - LVP Education</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    canvas { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-radius: 12px; }
    input[type=range] { accent-color: #0d9488; }
  </style>
  <script>
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = '<div style="color:#dc2626; padding:20px; font-family:sans-serif; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; margin:20px;"><b>Lỗi hiển thị mô phỏng:</b><br><br>' + msg + '<br><br>Dòng: ' + lineNo + '</div>';
      return false;
    };
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
</head>
<body>
  <script>
    ${p5Code.replace(/<\/script>/gi, '<\\/script>')}
  </script>
</body>
</html>`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* HEADER GỌN GÀNG, TỐI GIẢN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MonitorPlay className="text-teal-600" size={20} />
            <span>Mô Phỏng Khái Niệm & Đồ Thị Tương Tác</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tạo mô phỏng trực quan có thanh trượt (slider) giúp học sinh dễ dàng nắm bắt kiến thức
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium self-start sm:self-auto bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {PRESETS.length} mẫu có sẵn
        </span>
      </div>

      {/* QUICK PRESETS CAROUSEL / GRID */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sliders size={14} className="text-teal-600" />
            <span>Mẫu mô phỏng có sẵn (Bấm để xem và tương tác ngay):</span>
          </h4>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            {PRESETS.length} mẫu chuẩn sư phạm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 dark:border-teal-500 shadow-sm ring-1 ring-teal-500'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {preset.category === 'Đồ thị & Giải tích' ? 'Giải tích' : 'Hình học'}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                    {preset.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <span>{isSelected ? 'Đang mở' : 'Khởi chạy'}</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: Ô NHẬP & ĐIỀU KHIỂN (5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nội dung khái niệm / Đồ thị cần mô phỏng:</span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">Toán học & Vật lý</span>
            </label>
            <textarea
              rows={6}
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="Ví dụ: Mô phỏng tiệm cận đứng và tiệm cận ngang của hàm phân thức y = (2x+1)/(x-1) với slider di chuyển x đến vô cực và x đến 1..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 font-normal leading-relaxed resize-y"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || isProcessing || !lessonContent.trim()}
                className="flex-1 py-2.5 px-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="AI sẽ viết kịch bản chi tiết về hệ trục, slider và công thức"
              >
                {isEnhancing ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Đang gợi ý...</span></>
                ) : (
                  <><Sparkles size={14} /><span>AI Gợi ý kịch bản</span></>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLessonContent('');
                  setError('');
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                title="Xóa ô nhập"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isProcessing || isEnhancing || !lessonContent.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AI đang lập trình mô phỏng tương tác...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Tạo Mô Phỏng Tương Tác Mới</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-teal-50/50 dark:bg-slate-900/50 rounded-2xl border border-teal-100 dark:border-teal-900/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-teal-800 dark:text-teal-300">💡 Mẹo cho Giáo viên:</p>
            <p>• Mô phỏng tải về dưới dạng file HTML độc lập có thể chèn vào bài giảng điện tử (PowerPoint / Canva / Google Slides) hoặc chạy offline không cần mạng.</p>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG HIỂN THỊ MÔ PHỎNG (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header toolbar */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Khung Tương Tác Trực Tuyến
              </h4>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'code'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                }`}
              >
                <Code2 size={13} />
                <span>{viewMode === 'code' ? 'Xem Mô Phỏng' : 'Xem Code p5.js'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                title="Sao chép mã nguồn p5.js"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={openFullscreen}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                title="Mở toàn màn hình tab mới"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </button>

              <button
                type="button"
                onClick={downloadHtml}
                className="px-3.5 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Tải về file HTML để trình chiếu offline hoặc nhúng vào bài giảng"
              >
                <Download size={13} />
                <span>Tải file HTML</span>
              </button>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="relative min-h-[460px] h-[480px] bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 gap-3">
                <Loader2 size={36} className="animate-spin text-teal-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Đang khởi tạo ứng dụng mô phỏng tương tác...
                </p>
              </div>
            )}

            {viewMode === 'preview' ? (
              p5Code ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={getIframeSrcdoc()}
                  title="Simulation Output"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <MonitorPlay size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Chưa có mã mô phỏng. Hãy chọn một mẫu bên trên hoặc bấm "Tạo Mô Phỏng".</p>
                </div>
              )
            ) : (
              <div className="w-full h-full p-4 overflow-auto bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed select-text">
                <pre>{p5Code}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
