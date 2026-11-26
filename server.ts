/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// BỘ LỌC CỨNG (Hard Sanitizer): Tự động cắt bỏ triệt để mọi nhánh mục phụ / ngoại khóa / sáng tác ngoài bài học
function sanitizeMindmapCode(md: string): string {
  if (!md || typeof md !== 'string') return md;
  
  const lines = md.split('\n');
  const result: string[] = [];
  let inFrontmatter = false;
  let frontmatterDashes = 0;
  
  // Forbidden keywords: sidebars, trivia, supplementary boxes, out-of-curriculum coordinate systems
  const FORBIDDEN_REGEX = /(?:em có biết|kiến thức bổ sung|kiến thức mở rộng|mục đọc thêm|đọc thêm|tìm hiểu thêm|góc lịch sử|nhân vật lịch sử|tiểu sử|tọa độ cầu|tọa độ trụ|toạ độ cầu|toạ độ trụ|rené descartes|rene descartes)/i;

  let pruningHeadingLevel: number | null = null;
  let pruningBulletIndent: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve YAML frontmatter
    if (trimmed === '---') {
      frontmatterDashes++;
      inFrontmatter = frontmatterDashes < 2;
      result.push(rawLine);
      continue;
    }
    if (inFrontmatter) {
      result.push(rawLine);
      continue;
    }

    // Handle empty lines
    if (!trimmed) {
      if (pruningHeadingLevel === null && pruningBulletIndent === null) {
        result.push(rawLine);
      }
      continue;
    }

    // Check heading
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];

      // If we were pruning a heading, check if this new heading ends the pruning
      if (pruningHeadingLevel !== null) {
        if (level <= pruningHeadingLevel) {
          pruningHeadingLevel = null;
          pruningBulletIndent = null;
        } else {
          continue;
        }
      }

      // Any heading resets bullet pruning
      pruningBulletIndent = null;

      // Check if this heading itself is forbidden
      if (FORBIDDEN_REGEX.test(title)) {
        pruningHeadingLevel = level;
        continue;
      }

      result.push(rawLine);
      continue;
    }

    // If currently pruning heading, skip all lines under it
    if (pruningHeadingLevel !== null) {
      continue;
    }

    // Check bullet list item (normalizes tabs to 2 spaces)
    const normalizedLine = rawLine.replace(/\t/g, '  ');
    const bulletMatch = normalizedLine.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2];

      // If currently pruning bullet
      if (pruningBulletIndent !== null) {
        if (indent <= pruningBulletIndent) {
          pruningBulletIndent = null;
        } else {
          continue;
        }
      }

      // Check if this bullet item itself is forbidden
      if (FORBIDDEN_REGEX.test(content) || FORBIDDEN_REGEX.test(trimmed)) {
        pruningBulletIndent = indent;
        continue;
      }

      result.push(rawLine);
      continue;
    }

    // Plain text or continuation line
    if (pruningBulletIndent !== null) {
      continue;
    }

    if (FORBIDDEN_REGEX.test(trimmed)) {
      continue;
    }

    result.push(rawLine);
  }

  return result.join('\n').trim();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3004;

  // Middleware
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // Global Error Handler cho Body Parser (tránh trả về HTML khi file quá lớn)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: "Dữ liệu JSON không hợp lệ." });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: "Kích thước file quá lớn (vượt giới hạn). Vui lòng thử lại với file nhỏ hơn." });
    }
    next(err);
  });

  // Lazy initialization of Gemini client to prevent crashes if key is omitted on startup
  let aiClients: Record<string, GoogleGenAI> = {};
  function getGeminiClient(clientKey?: string, modelName: string = 'gemini-3.8-flash'): GoogleGenAI {
    const safeModelName = typeof modelName === 'string' && modelName ? modelName : 'gemini-3.8-flash';
    const apiVersion = 'v1beta';
    const key = clientKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing on the server.");
    }
    const clientMapKey = `${key}_${apiVersion}`;
    if (!aiClients[clientMapKey]) {
       aiClients[clientMapKey] = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion } });
    }
    return aiClients[clientMapKey];
  }

  // Global cache để ghi nhớ model nào đang hoạt động tốt cho từng API Key (tránh việc loop lại các model đã lỗi gây tốn Quota 15 RPM)
  const workingModelCache: Record<string, string> = {};

  const DEFAULT_SERVER_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash"
  ];

  function parseServerApiKeys(raw?: string): string[] {
    const keys: string[] = [];
    if (raw && typeof raw === "string") {
      for (const part of raw.split(/[\r\n,;]+/)) {
        const trimmed = part.trim();
        if (trimmed.length >= 10) keys.push(trimmed);
      }
    }
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length >= 10) {
      keys.push(process.env.GEMINI_API_KEY.trim());
    }
    return Array.from(new Set(keys));
  }

  async function discoverLiveGeminiModels(effectiveKey: string): Promise<string[]> {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveKey)}`);
      if (!resp.ok) return [];
      const data = await resp.json();
      const models: string[] = (data.models || [])
        .filter((m: any) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent") &&
          typeof m.name === "string" &&
          m.name.includes("gemini") &&
          !/embedding|imagen|veo|tts|aqa|robotics|computer-use|audio|live/i.test(m.name)
        )
        .map((m: any) => m.name.replace(/^models\//, ""));
      models.sort((a, b) => {
        const aFlash = /flash/i.test(a) ? 0 : 1;
        const bFlash = /flash/i.test(b) ? 0 : 1;
        if (aFlash !== bFlash) return aFlash - bFlash;
        return b.localeCompare(a, undefined, { numeric: true });
      });
      return models;
    } catch {
      return [];
    }
  }

  // API endpoint proxy to call Gemini (hỗ trợ nhiều API Key xoay vòng & tự dò model)
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, model = "gemini-3.8-flash", apiKey, imageBase64, temperature, topP } = req.body;
      if (!prompt && !imageBase64) {
        return res.status(400).json({ error: "Vui lòng truyền dữ liệu đầu vào." });
      }

      let contents: any = prompt;
      if (imageBase64) {
        const match = imageBase64.match(/^data:([^;]+);base64,/);
        const mimeType = match ? match[1] : "image/jpeg";
        const data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
        contents = [
          { text: prompt || "Phân tích hình ảnh này:" },
          { inlineData: { mimeType, data } }
        ];
      }

      const keysToTry = parseServerApiKeys(apiKey);
      if (keysToTry.length === 0) {
        return res.status(400).json({ error: "Thiếu Google Gemini API Key. Vui lòng nhập ít nhất 1 Key." });
      }

      const allErrors: string[] = [];

      for (const currentKey of keysToTry) {
        const cachedModel = workingModelCache[currentKey];
        const basePool = [cachedModel, model, ...DEFAULT_SERVER_MODELS].filter(Boolean) as string[];
        const MODELS_POOL = Array.from(new Set(basePool));

        const tryPool = async (pool: string[]) => {
          for (const modelName of pool) {
            try {
              const client = getGeminiClient(currentKey, modelName);
              const response = await client.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                  temperature: typeof temperature === 'number' ? temperature : 0.7,
                  topP: typeof topP === 'number' ? topP : undefined,
                  maxOutputTokens: 8192,
                }
              });

              if (response && response.text) {
                let textValue = typeof (response as any).text === 'function' ? await (response as any).text() : response.text;
                if (typeof prompt === 'string' && (prompt.includes('Markmap') || prompt.includes('Sơ đồ tư duy'))) {
                  textValue = sanitizeMindmapCode(textValue);
                }
                workingModelCache[currentKey] = modelName;
                const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
                const isFinished = finishReason !== 'MAX_TOKENS';
                return { text: textValue, finishReason, isFinished };
              } else {
                allErrors.push(`[...${currentKey.slice(-4)}/${modelName}]: No response.text returned`);
              }
            } catch (err: any) {
              const msg = err?.message || String(err);
              console.warn(`Lỗi khi gọi model ${modelName} (key ...${currentKey.slice(-4)}):`, msg);
              if (cachedModel === modelName && /404|not found|no longer available/i.test(msg)) {
                delete workingModelCache[currentKey];
              }
              allErrors.push(`[...${currentKey.slice(-4)}/${modelName}]: ${msg}`);
              if (/API_KEY_INVALID|key not valid/i.test(msg)) {
                return null;
              }
              await new Promise(r => setTimeout(r, 400));
            }
          }
          return null;
        };

        const firstRes = await tryPool(MODELS_POOL);
        if (firstRes) return res.json(firstRes);

        const liveModels = await discoverLiveGeminiModels(currentKey);
        const fallbackPool = liveModels.filter(m => !MODELS_POOL.includes(m)).slice(0, 5);
        if (fallbackPool.length > 0) {
          const discoveredRes = await tryPool(fallbackPool);
          if (discoveredRes) return res.json(discoveredRes);
        }
      }

      throw new Error(`Tất cả ${keysToTry.length} API Key & model đều lỗi. Chi tiết: ${allErrors.join(' | ')}`);
    } catch (error: any) {
      console.error("API Gemini Proxy Exception:", error);
      res.status(500).json({
        error: error.message || "Có lỗi bất ngờ xảy ra khi xử lý phản hồi từ AI."
      });
    }
  });

  // File (PDF/Image) to DOCX Convert Proxy
  app.post("/api/convert-pdf", async (req, res) => {
    try {
      const { pdfBase64, mimeType = "application/pdf", files, parsingMode = "normal", customPrompt = "", model = "gemini-1.5-pro", apiKey, includeShortSolution = false, examCount = 1, contextSuggestion = "", matrixConfig = "[]", continueFromText = "", textContent = "", subject = "", grade = "", lesson = "" } = req.body;
      
      let targetFiles = files;
      if (!targetFiles && pdfBase64) {
        targetFiles = [{ base64: pdfBase64, mimeType }];
      }

      if (!targetFiles || targetFiles.length === 0) {
        return res.status(400).json({ error: "Không tìm thấy dữ liệu file." });
      }

      let prompt = "";
      if (customPrompt) {
        prompt = customPrompt;
      } else if (parsingMode === "mindmap") {
        prompt = `Bạn là một Hệ thống Trích xuất Dữ liệu Khoa học & Giáo dục Tuyệt đối Chính xác.
Nhiệm vụ: Hãy đọc kỹ toàn bộ tài liệu đính kèm và trích xuất CẤU TRÚC KIẾN THỨC BÀI HỌC thành Sơ đồ tư duy dạng Markmap (Markdown).

[CHẾ ĐỘ NGHIÊM NGẶT - CHỐNG ẢO GIÁC & CẤM SÁNG TÁC NỘI DUNG TUYỆT ĐỐI 100%]:
1. CHỈ TẬP TRUNG 100% VÀO LÝ THUYẾT TRỌNG TÂM CHÍNH KHÓA CỦA BÀI HỌC:
   - Chỉ lấy các đề mục chính thức đánh số La Mã: I, II, III...
   - Các đề mục nhỏ: 1, 2, 3...
   - Các Khái niệm, Định nghĩa, Định lý, Tính chất, Biểu thức toạ độ, Quy tắc, Công thức toán học cốt lõi phục vụ ôn tập thi cử.
2. TUYỆT ĐỐI LOẠI BỎ TOÀN BỘ CÁC HỘP THÔNG TIN PHỤ & NGOẠI KHÓA (KỂ CẢ CÓ IN TRONG SÁCH/TÀI LIỆU CŨNG CẤM KHÔNG ĐƯỢC ĐƯA VÀO):
   - CẤM đưa vào các mục phụ: Hộp "Em có biết?", "Góc lịch sử / Nhân vật lịch sử" (ví dụ: René Descartes, tiểu sử...), "Đọc thêm", "Tìm hiểu thêm", "Kiến thức bổ sung", "Tọa độ cầu", "Tọa độ trụ", "Bài tập về nhà", "Câu hỏi thảo luận".
   - Bất kể các phần này có in trong trang sách hay không, TUYỆT ĐỐI KHÔNG đưa vào sơ đồ tư duy dù dưới dạng nhánh lớn hay nhánh con. Sơ đồ tư duy bài học chỉ dành cho kiến thức lý thuyết trọng tâm chính thức.
3. BÁM SÁT ĐÚNG SỐ LƯỢNG VÀ TÊN GỌI CỦA CÁC ĐỀ MỤC LỚN (I, II, III...):
   - Đếm chính xác số lượng mục lớn có trong tài liệu bài học.
   - Ví dụ: Nếu bài học chỉ có "I. HỆ TRỤC TỌA ĐỘ TRONG KHÔNG GIAN" và "II. TỌA ĐỘ CỦA ĐIỂM, TỌA ĐỘ CỦA VECTƠ", bạn CHỈ ĐƯỢC PHÉP tạo đúng 2 nhánh lớn (## I... và ## II...). TUYỆT ĐỐI CẤM tự ý tạo thêm nhánh "III...".
4. BÁM SÁT CÁC MỤC CON VÀ CÔNG THỨC: Từng nhánh con (-) phải là trích đoạn trung thực các định nghĩa, định lý, công thức toán học có trong bài.
5. Cấu trúc Markmap: Mã phải được đặt trong một khối code \`\`\`markdown ... \`\`\` duy nhất. Không thêm lời dẫn giải.
6. Bắt buộc có YAML frontmatter ở đầu:
---
markmap:
  colorScheme: default
  math: katex
---
7. Phân cấp chuẩn: \`#\` cho Tên bài học trong tài liệu, \`##\` cho các phần chính (I, II, III...), \`###\` cho các mục nhỏ (1, 2, 3...), và \`-\` cho các chi tiết/công thức.
8. Mọi công thức Toán học phải bọc trong $...$ hoặc $$...$$. Ký hiệu vectơ dùng \\overrightarrow{...}.`;
      } else if (parsingMode === "normal") {
        prompt = `Bạn là một chuyên gia OCR Toán học. Nhiệm vụ của bạn là chuẩn hóa nội dung văn bản (đã được bóc tách từ file Word hoặc PDF/Ảnh) sang Markdown và LaTeX chuẩn.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Chuyển TẤT CẢ các biểu thức toán học sang mã LaTeX chuẩn. Công thức nội dòng bọc bằng $...$, công thức độc lập bọc bằng $$...$$.
2. Về Cấu trúc Đề thi (Nếu tài liệu là đề thi trắc nghiệm):
   - Mở đầu mỗi câu hỏi PHẢI là "Câu X:" (Ví dụ: Câu 1:, Câu 2:).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
   - Nếu có lời giải chi tiết, phải bắt đầu bằng cụm từ "Lời giải:" ở dòng mới.
3. VỀ HÌNH VẼ, ĐỒ THỊ, BẢNG BIẾN THIÊN, HÌNH HỌC (QUAN TRỌNG NHẤT):
   - Chữ ra chữ, công thức toán ra mã LaTeX ($...$, $$...$$).
   - PHẦN CÒN LẠI LÀ HÌNH ẢNH (đồ thị hàm số, bảng biến thiên, hình học không gian, sơ đồ...): 
     Bạn BẮT BUỘC PHẢI TRÍCH XUẤT TỌA ĐỘ HỘP BAO (Bounding Box [ymin, xmin, ymax, xmax] trên thang đo 0-1000) của riêng hình vẽ đó trên trang và dán ngay bên dưới câu hỏi (trước các đáp án A, B, C, D) theo đúng cú pháp sau:
     ![Hình X](crop:Trang,ymin,xmin,ymax,xmax)
     Trong đó:
     * Trang: số thứ tự trang PDF/ảnh chứa hình (bắt đầu từ 1, ví dụ: 1, 2, 3...)
     * ymin, xmin, ymax, xmax: tọa độ hộp bao của riêng hình vẽ đó (chuẩn từ 0 đến 1000).
     Ví dụ: Câu 12 có hình vẽ đồ thị ở trang 2 từ y=350 đến y=650, x=100 đến x=550, bạn ghi:
     ![Hình 5](crop:2,350,100,650,550)
     Hệ thống máy tính sẽ tự động cắt đồ thị này với độ nét cao và dán thẳng vào file Word ngay dưới câu hỏi!
   - TUYỆT ĐỐI KHÔNG ghi ![Hình X](image_X) mà không có tọa độ crop:, vì tài liệu cần tọa độ để hệ thống tự cắt ảnh!
4. Về Cấu trúc Văn bản: Giữ nguyên các đoạn văn. Không tự ý cắt bớt chữ.
5. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào (ví dụ: "Dưới đây là kết quả...", "Đã hoàn thành..."). CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "tag_questions") {
        prompt = `Bạn là một chuyên gia OCR Toán học. Nhiệm vụ của bạn là chuẩn hóa nội dung văn bản sang Markdown và LaTeX chuẩn, ĐỒNG THỜI TỰ ĐỘNG GẮN THẺ mức độ nhận thức ([B], [H], [VD]) cho các câu hỏi trắc nghiệm và câu đúng/sai.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Chuyển TẤT CẢ các biểu thức toán sang mã LaTeX chuẩn ($...$, $$...$$).
2. Về Cấu trúc Đề thi (Nếu tài liệu là đề thi trắc nghiệm):
   - Mở đầu mỗi câu hỏi trắc nghiệm 4 lựa chọn PHẢI có thẻ tag, ví dụ: "Câu 1 [B]:", "Câu 2 [H]:", "Câu 3 [VD]:". Bạn hãy tự đánh giá độ khó để gắn thẻ phù hợp ([B] Nhận biết, [H] Thông hiểu, [VD] Vận dụng).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
   - Đối với câu hỏi trắc nghiệm Đúng/Sai (có 4 ý a, b, c, d), bạn phải gắn thẻ ngay trước hoặc sau ký tự a, b, c, d. Ví dụ: "a) [B] Nội dung...", "b) [H] Nội dung...".
   - Nếu có lời giải chi tiết, phải bắt đầu bằng cụm từ "Lời giải:" ở dòng mới.
3. VỀ HÌNH VẼ, ĐỒ THỊ, BẢNG BIẾN THIÊN, HÌNH HỌC (QUAN TRỌNG NHẤT):
   - Chữ ra chữ, công thức toán ra mã LaTeX ($...$, $$...$$).
   - PHẦN CÒN LẠI LÀ HÌNH ẢNH (đồ thị hàm số, bảng biến thiên, hình học không gian, sơ đồ...): 
     Bạn BẮT BUỘC PHẢI TRÍCH XUẤT TỌA ĐỘ HỘP BAO (Bounding Box [ymin, xmin, ymax, xmax] trên thang đo 0-1000) của riêng hình vẽ đó trên trang và dán ngay bên dưới câu hỏi (trước các đáp án A, B, C, D) theo đúng cú pháp:
     ![Hình X](crop:Trang,ymin,xmin,ymax,xmax)
     Ví dụ: ![Hình 5](crop:2,350,100,650,550)
   - TUYỆT ĐỐI KHÔNG ghi ![Hình X](image_X) mà không có tọa độ crop:.
4. Về Cấu trúc Văn bản: Giữ nguyên các đoạn văn. Không tự ý cắt bớt chữ.
5. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào. CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "exam") {
        prompt = `Bạn là một chuyên gia bóc tách dữ liệu giáo dục. Nhiệm vụ của bạn là bóc tách toàn bộ nội dung đề thi trắc nghiệm từ tài liệu được cung cấp.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Chuyển TẤT CẢ các biểu thức toán học sang mã LaTeX chuẩn ($...$, $$...$$). Tuyệt đối không dùng ký hiệu Unicode.
2. Về Cấu trúc Đề thi:
   - Mở đầu mỗi câu hỏi PHẢI là "Câu X:" (Ví dụ: Câu 1:, Câu 2:).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
3. VỀ HÌNH VẼ, ĐỒ THỊ, BẢNG BIẾN THIÊN, HÌNH HỌC (QUAN TRỌNG NHẤT):
   - Chữ ra chữ, công thức toán ra mã LaTeX ($...$, $$...$$).
   - PHẦN CÒN LẠI LÀ HÌNH ẢNH (đồ thị hàm số, bảng biến thiên, hình học không gian, sơ đồ...): 
     Bạn BẮT BUỘC PHẢI TRÍCH XUẤT TỌA ĐỘ HỘP BAO (Bounding Box [ymin, xmin, ymax, xmax] trên thang đo 0-1000) của riêng hình vẽ đó trên trang và dán ngay bên dưới câu hỏi (trước các đáp án A, B, C, D) theo đúng cú pháp:
     ![Hình X](crop:Trang,ymin,xmin,ymax,xmax)
     Ví dụ: ![Hình 5](crop:2,350,100,650,550)
   - TUYỆT ĐỐI KHÔNG ghi ![Hình X](image_X) mà không có tọa độ crop:.
4. TUYỆT ĐỐI KHÔNG GIẢI ĐỀ: Nhiệm vụ của bạn CHỈ LÀ TRÍCH XUẤT LẠI NỘI DUNG ĐỀ THI chính xác như bản gốc. KHÔNG tự ý giải bài, KHÔNG đưa ra đáp án đúng.
5. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào. CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "similar_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Nhiệm vụ của bạn là đọc nội dung đề thi/tài liệu được cung cấp (dưới dạng văn bản hoặc hình ảnh) và TẠO RA ${examCount} ĐỀ THI MỚI TƯƠNG TỰ hoàn toàn.
YÊU CẦU:
- Các đề thi mới phải giữ nguyên cấu trúc (số lượng câu hỏi, dạng bài, mức độ khó, chủ đề) của đề thi gốc. BẠN PHẢI SINH RA ĐẦY ĐỦ 100% SỐ LƯỢNG CÂU HỎI, KHÔNG ĐƯỢC RÚT GỌN HAY BỎ SÓT.
- Thay đổi số liệu, thông số, ngữ cảnh hoặc cách hỏi sao cho tương đương nhưng không giống hệt đề gốc.
${contextSuggestion ? `- YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: Hãy phân tích sâu về ngữ cảnh sau đây để tạo đề dễ hiểu, phù hợp tính sư phạm (áp dụng linh hoạt cho mọi bộ môn): "${contextSuggestion}"` : ''}
- Đảm bảo tính chính xác về mặt toán học/khoa học.
- Trình bày dưới dạng định dạng Markdown.
- Chuyển tất cả công thức toán học sang định dạng LaTeX chuẩn (inline dùng dấu đô la đơn $...$, block dùng dấu đô la kép $$...$$).
- Các câu hỏi phải theo định dạng "Câu X: ...".
- Trình bày rõ ràng 4 đáp án A, B, C, D cho mỗi câu hỏi.
${examCount > 1 ? `- Phân tách các đề bằng dấu gạch ngang (---) và tiêu đề rõ ràng (ví dụ: Đề 1, Đề 2...).` : ''}
- LỆNH TỐI CẦN THIẾT: TUYỆT ĐỐI KHÔNG ĐƯỢC QUÊN PHẦN ĐÁP ÁN/LỜI GIẢI NẾU CÓ YÊU CẦU. KHÔNG giải thích lằng nhằng, chỉ xuất ra đề thi${includeShortSolution ? ' và ĐẦY ĐỦ đáp án/lời giải ở cuối' : ''}.
- YÊU CẦU VỀ LỜI GIẢI (QUAN TRỌNG):
${includeShortSolution ? `  + BẮT BUỘC: Phải kèm theo "Đáp án ngắn gọn" (bảng đáp án hoặc giải thích cực ngắn) ở phần cuối cùng của tài liệu.` : `  + BẮT BUỘC: KHÔNG cung cấp lời giải hay đáp án, chỉ sinh đề thi.`}`;
      } else if (parsingMode === "matrix_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ra MỘT ĐỀ THI ĐÚNG CHUẨN FORMAT 2025 MỚI NHẤT bám sát cấu trúc Ma Trận Đặc Tả sau đây:
${matrixConfig}

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG & MỨC ĐỘ:
1. Đề thi phải chia làm 3 phần (nếu trong ma trận có số lượng câu tương ứng):
   - PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Mỗi câu có 4 đáp án A, B, C, D).
   - PHẦN II. Câu trắc nghiệm đúng sai. Mỗi câu phải có đúng 4 ý a), b), c), d).
   - PHẦN III. Câu trắc nghiệm trả lời ngắn (Học sinh chỉ cần điền một con số hoặc cụm từ ngắn gọn).

2. Cấu trúc câu hỏi Đúng/Sai (RẤT QUAN TRỌNG):
   - Cột "Cấu trúc ý ĐS (B-H-VD)" trong ma trận định nghĩa số lượng ý Nhận biết - Thông hiểu - Vận dụng cho từng câu hỏi Đúng/Sai thuộc chủ đề đó. 
   - Ví dụ: Cấu trúc "2-1-1" nghĩa là trong 4 ý a,b,c,d của câu hỏi đó, PHẢI CÓ đúng 2 ý ở mức Nhận biết, 1 ý ở mức Thông hiểu, và 1 ý ở mức Vận dụng.
   - Bạn phải gắn thẻ mức độ [B], [H], [VD] ngay sau mỗi ý a,b,c,d để chứng minh. Ví dụ: "a) [B] Nội dung ý a... b) [H] Nội dung ý b...".

3. Gắn thẻ trước mỗi câu hỏi:
   - Các câu phần I và III phải gắn thẻ mức độ: [B], [H], [VD], [VDC]. Ví dụ: "Câu 1 [B]:" hoặc "Câu 3 [VD]:"
   - Giữ nguyên định dạng Markdown và chuyển tất cả công thức sang LaTeX chuẩn ($...$, $$...$$).

YÊU CẦU VỀ NỘI DUNG:
- Hãy sử dụng tài liệu/văn bản/hình ảnh được đính kèm làm cơ sở dữ liệu phụ trợ. Tuy nhiên, bạn BẮT BUỘC phải tuân thủ nghiêm ngặt Ma Trận Đặc Tả (Môn học, Lớp học, Tên bài, Số lượng câu, Mức độ) làm bộ khung chính để tạo đề. TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM TẮT, KHÔNG ĐƯỢC RÚT GỌN, PHẢI SINH ĐỦ 100% SỐ LƯỢNG CÂU HỎI THEO ĐÚNG YÊU CẦU TRONG MA TRẬN.
${contextSuggestion ? `- YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: Hãy phân tích sâu về ngữ cảnh sau đây để tạo đề dễ hiểu, phù hợp tính sư phạm (áp dụng linh hoạt cho mọi bộ môn): "${contextSuggestion}"` : ''}
- LỆNH TỐI CẦN THIẾT: TUYỆT ĐỐI KHÔNG ĐƯỢC QUÊN PHẦN ĐÁP ÁN/LỜI GIẢI NẾU CÓ YÊU CẦU. KHÔNG giải thích lằng nhằng, chỉ xuất ra đề thi${includeShortSolution ? ' và ĐẦY ĐỦ đáp án/lời giải ở cuối' : ''}.
- YÊU CẦU VỀ LỜI GIẢI (QUAN TRỌNG):
${includeShortSolution ? `  + BẮT BUỘC: Phải kèm theo "Đáp án ngắn gọn" (bảng đáp án hoặc giải thích cực ngắn) ở phần cuối cùng của tài liệu.` : `  + BẮT BUỘC: KHÔNG cung cấp lời giải hay đáp án, chỉ sinh đề thi.`}`;
      } else if (parsingMode === "standardize_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Nhiệm vụ của bạn là đọc nội dung đề thi/tài liệu được cung cấp (dưới dạng văn bản hoặc hình ảnh) và CHUẨN HÓA lại toàn bộ theo đúng chuẩn cấu trúc thi mới nhất. BẠN PHẢI CHUẨN HÓA TẤT CẢ CÁC CÂU HỎI TRONG ĐỀ GỐC, KHÔNG ĐƯỢC BỎ SÓT, RÚT GỌN HAY LÀM TẮT BẤT KỲ CÂU NÀO.

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG & MỨC ĐỘ:
1. Đề thi phải chia làm 3 phần chuẩn:
   - PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Mỗi câu có 4 đáp án A, B, C, D).
   - PHẦN II. Câu trắc nghiệm đúng sai (Mỗi câu phải có đúng 4 ý a), b), c), d)).
   - PHẦN III. Câu trắc nghiệm trả lời ngắn.

2. Gắn thẻ mức độ nhận thức (RẤT QUAN TRỌNG):
   - BẠN BẮT BUỘC PHẢI TỰ ĐỘNG ĐÁNH GIÁ và gắn thẻ mức độ [B] (Nhận biết), [H] (Thông hiểu), [VD] (Vận dụng) hoặc [VDC] (Vận dụng cao) cho TỪNG CÂU HỎI.
   - Đối với PHẦN I và PHẦN III: Gắn thẻ ngay trước câu hỏi. Ví dụ: "Câu 1 [B]:" hoặc "Câu 3 [VD]:".
   - Đối với PHẦN II (Đúng/Sai): AI sẽ ĐÁNH GIÁ VÀ GẮN THẺ CHO TỪNG Ý NHỎ a, b, c, d để được kết quả như: "a) [B] Nội dung ý a... b) [H] Nội dung ý b...". BẮT BUỘC TỪNG Ý ĐỀU PHẢI CÓ THẺ.

3. Kỹ thuật hiển thị & Hình ảnh:
   - Giữ nguyên định dạng Markdown và chuyển tất cả công thức sang LaTeX chuẩn (dùng $...$ và $...$).
   - Không tự ý thay đổi số liệu đề gốc, chỉ chuẩn hóa format và đánh giá mức độ.
   - VỀ HÌNH VẼ, ĐỒ THỊ, BẢNG BIẾN THIÊN, HÌNH HỌC (QUAN TRỌNG NHẤT):
     Bạn BẮT BUỘC PHẢI TRÍCH XUẤT TỌA ĐỘ HỘP BAO (Bounding Box [ymin, xmin, ymax, xmax] trên thang đo 0-1000) của riêng hình vẽ đó trên trang và dán ngay bên dưới câu hỏi (trước các đáp án A, B, C, D) theo đúng cú pháp:
     ![Hình X](crop:Trang,ymin,xmin,ymax,xmax)
     Ví dụ: ![Hình 5](crop:2,350,100,650,550)
   - TUYỆT ĐỐI KHÔNG ghi ![Hình X](image_X) mà không có tọa độ crop:.

4. Yêu cầu về Lời giải/Đáp án (QUAN TRỌNG):
${includeShortSolution ? `   - BẮT BUỘC: Ở phần cuối cùng của tài liệu, chỉ cung cấp bảng đáp án và hướng dẫn giải cực kỳ ngắn gọn, dưới tiêu đề "Đáp án ngắn gọn:".` : '   - KHÔNG cung cấp lời giải, chỉ xuất ra đề thi.'}

- KHÔNG giải thích lằng nhằng, chỉ xuất ra đề thi${includeShortSolution ? ' và đáp án/lời giải' : ''}.`;
      } else if (parsingMode === "solve_exam_tutor") {
        prompt = `Bạn là một gia sư AI tài năng, xuất sắc. Nhiệm vụ của bạn là đọc và hiểu tài liệu đề bài được cung cấp (dưới dạng văn bản hoặc hình ảnh).
Sau đó, hãy trình bày lời giải chi tiết, từng bước, khoa học và cực kỳ dễ hiểu cho học sinh trung học phổ thông.

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG VÀ NỘI DUNG:
1. GIẢI QUYẾT TOÀN BỘ ĐỀ: Bạn BẮT BUỘC phải tìm và giải quyết TẤT CẢ các câu hỏi có trong tài liệu. Tuyệt đối không được bỏ sót câu nào, không được dừng lại giữa chừng hay chỉ giải 1 câu đầu tiên.
2. Trình bày dưới dạng Markdown rõ ràng, phân chia rõ "Câu 1:", "Câu 2:"... để người dùng dễ theo dõi.
3. Toàn bộ các công thức toán học BẮT BUỘC phải bọc trong các cặp thẻ LaTeX: $...$ cho công thức nội dòng và $$...$$ cho biểu thức dạng khối. Tuyệt đối không dùng ký hiệu Unicode (như √, Δ).
4. Sử dụng giọng văn sư phạm, lịch sự, thân thiện và giàu khích lệ.
5. Mọi câu trả lời và kiến thức BẮT BUỘC phải bám sát định hướng của bộ sách "Kết nối tri thức với cuộc sống".
6. PHÂN LOẠI LỜI GIẢI THEO MỨC ĐỘ: Bạn phải tự đánh giá mức độ của từng câu hỏi. Đối với các câu hỏi Nhận biết (dễ, lý thuyết cơ bản mức [B]), CHỈ CẦN đưa ra phương án đúng, KHÔNG giải thích chi tiết. CHỈ ĐƯỢC giải thích chi tiết (từng bước) đối với các câu hỏi Thông hiểu ([H]) và Vận dụng ([VD]).`;
      } else if (parsingMode === "lesson_plan") {
        prompt = `Bạn là một hệ thống tự động biên soạn tài liệu. Nhiệm vụ của bạn là XUẤT RA VĂN BẢN GIÁO ÁN CHI TIẾT.

THÔNG TIN BÀI HỌC CẦN SOẠN:
- Môn học: ${subject || 'Không xác định'}
- Khối lớp: ${grade || 'Không xác định'}
- Tên bài học: ${lesson || 'Không xác định'}

ĐIỀU KIỆN TIÊN QUYẾT:
- KHÔNG CÓ LỜI MỞ ĐẦU (ví dụ: CẤM các câu như "Dưới đây là...", "Kế hoạch bài dạy này...").
- KHÔNG CÓ LỜI KẾT LUẬN.
- Ký tự đầu tiên của kết quả trả về PHẢI là dấu "#" hoặc "**" (bắt đầu ngay vào tiêu đề Kế hoạch bài dạy).

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG VÀ NỘI DUNG:
1. Bắt đầu từ Tiết 1: BẮT BUỘC phải soạn giáo án bắt đầu từ Tiết 1, sau đó đến Tiết 2... Tuyệt đối KHÔNG ĐƯỢC bỏ qua Tiết 1.
2. Tích hợp năng lực số: Đề xuất các công cụ AI, phần mềm mô phỏng, nền tảng trực tuyến trong các hoạt động.
3. Cấu trúc 4 bước: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng (Nếu không có mẫu sẵn). 
4. Trình bày Markdown và LaTeX: Bắt buộc dùng $...$ và $$...$$ cho công thức toán.
5. TUÂN THỦ TÀI LIỆU MẪU: Nếu có Mẫu giáo án đính kèm, BẮT BUỘC giữ nguyên cấu trúc các đề mục của mẫu đó và điền nội dung vào.
${contextSuggestion ? `6. YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: ${contextSuggestion}` : ''}`;
      }
      
      if (customPrompt || parsingMode === "mindmap") {
        // Giữ nguyên câu lệnh dành cho Mindmap
      } else if (parsingMode !== "lesson_plan") {
        prompt += `\n\n[YÊU CẦU BẮT BUỘC CHUNG]: Bạn PHẢI tuân thủ NGHIÊM NGẶT các cấu hình xử lý (bao gồm yêu cầu về lời giải, định dạng, độ khó, ma trận) đã được chỉ định ở trên. TUYỆT ĐỐI KHÔNG tự ý thay đổi, bỏ qua hay làm trái các chỉ thị cấu hình này. Mọi nội dung, ngữ cảnh, thuật ngữ và dữ liệu bạn sinh ra PHẢI tuân thủ và bám sát tuyệt đối theo chuẩn của bộ sách "Kết nối tri thức và cuộc sống", nội dung chuẩn kiến thức kĩ năng của chương trình GDPT 2018. TUYỆT ĐỐI KHÔNG giải thích, nhận xét hay bình luận về sự tuân thủ này. BẠN CHỈ LÀ MỘT HỆ THỐNG TỰ ĐỘNG XUẤT RAW TEXT.\n`;
      } else {
        prompt += `\n\n[HƯỚNG DẪN BIÊN SOẠN]: Nội dung giáo án cần tương thích với định hướng của bộ sách "Kết nối tri thức và cuộc sống", chương trình GDPT 2018 và các văn bản hướng dẫn mới nhất. TRÌNH BÀY GIÁO ÁN NGAY LẬP TỨC, KHÔNG CÓ BẤT KỲ LỜI BÌNH LUẬN NÀO. Bạn tuyệt đối không được tự ý thay đổi các quy định chung của hệ thống.\n`;
      }

      if (continueFromText) {
        prompt += `\n[YÊU CẦU ĐẶC BIỆT]: Đoạn văn bản trước đó bạn sinh ra bị thiếu. Dưới đây là phần văn bản cuối cùng bạn đã viết:\n"""\n${continueFromText.length > 2000 ? continueFromText.substring(continueFromText.length - 2000) : continueFromText}\n"""\nHãy ĐỌC KỸ phần cuối này và TIẾP TỤC sinh ra nội dung CÒN THIẾU ngay nối tiếp phần đó. TUYỆT ĐỐI KHÔNG viết lại những phần đã sinh ra, chỉ viết tiếp.\n`;
      }

      if (parsingMode === "lesson_plan") {
        if (textContent) {
          prompt += `\n\n[MẪU GIÁO ÁN / TÀI LIỆU THAM KHẢO TỪ GIÁO VIÊN]:\n${textContent}\n\n(LƯU Ý TỐI QUAN TRỌNG: Các tài liệu đính kèm bên trên CHỈ LÀ MẪU CẤU TRÚC hoặc TÀI LIỆU THAM KHẢO. Bạn BẮT BUỘC phải viết nội dung cho bài học "${lesson}" (Môn ${subject}, ${grade}). TUYỆT ĐỐI KHÔNG sao chép chủ đề của tài liệu mẫu. Bạn CHỈ ĐƯỢC lấy cấu trúc các đề mục từ mẫu này và BẮT BUỘC ĐIỀN KIẾN THỨC CỦA BÀI "${lesson}" VÀO ĐÓ!)`;
        }
      }

      const contentsArray: any[] = [prompt];
      for (const file of targetFiles) {
        contentsArray.push({
          inlineData: {
            data: file.base64,
            mimeType: file.mimeType
          }
        });
      }

      const clientKeyToUse = apiKey || "default";
      const cachedModel = workingModelCache[clientKeyToUse];

      const basePool = [
        model, 
        "gemini-2.5-flash", 
        "gemini-2.0-flash", 
        "gemini-1.5-flash", 
        "gemini-3-flash-preview",
        "gemini-3.5-flash",
        "gemini-3-pro-preview",
        "gemini-1.5-pro"
      ];
      const MODELS_POOL = Array.from(new Set(cachedModel ? [cachedModel, ...basePool] : basePool)).filter(Boolean) as string[];
      let lastError: any = null;
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        for (const modelName of MODELS_POOL) {
          try {
            const client = getGeminiClient(apiKey, modelName);
            const response = await client.models.generateContent({
              model: modelName,
              contents: contentsArray,
              config: {
                temperature: (["mindmap", "normal", "tag_questions", "exam", "standardize_exam"].includes(parsingMode) || Boolean(customPrompt && customPrompt.includes("SÁNG TÁC"))) ? 0.0 : 0.7,
                topP: (["mindmap", "normal", "tag_questions", "exam", "standardize_exam"].includes(parsingMode) || Boolean(customPrompt && customPrompt.includes("SÁNG TÁC"))) ? 0.05 : 0.95,
                maxOutputTokens: 8192,
              }
            });

            if (response && response.text) {
              let textValue = typeof (response as any).text === 'function' ? await (response as any).text() : response.text;
              if (parsingMode === "mindmap" || (customPrompt && (customPrompt.includes("Markmap") || customPrompt.includes("Sơ đồ tư duy")))) {
                textValue = sanitizeMindmapCode(textValue);
              }
              workingModelCache[clientKeyToUse] = modelName;
              const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
              const isFinished = finishReason !== 'MAX_TOKENS';
              return res.json({ text: textValue, finishReason, isFinished });
            }
          } catch (err: any) {
            console.warn(`Lỗi khi gọi model ${modelName} cho xử lý file (Lần thử ${attempt}):`, err.message || err);
            lastError = err;
            // Continue to next model if available
          }
        }
        
        // If all models failed in this attempt, wait before retrying
        if (attempt < MAX_RETRIES) {
          console.log(`Đang chờ thử lại (Lần ${attempt + 1})...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // 2s, 4s, 6s...
        }
      }

      throw lastError || new Error("Hệ thống AI đang quá tải. Vui lòng thử lại sau vài phút.");
    } catch (error: any) {
      console.error("API File Convert Exception:", error);
      res.status(500).json({
        error: error.message || "Có lỗi bất ngờ xảy ra khi bóc tách file."
      });
    }
  });

  // Word (Text+MathML) to Markdown+LaTeX Convert Proxy
  app.post("/api/convert-word", async (req, res) => {
    try {
      const { textContent, parsingMode = "normal", model = "gemini-1.5-pro", apiKey, includeShortSolution = false, examCount = 1, contextSuggestion = "", matrixConfig = "[]", continueFromText = "", subject = "", grade = "", lesson = "", customPrompt = "" } = req.body;
      if (!textContent && parsingMode !== "matrix_exam") {
        return res.status(400).json({ error: "Không tìm thấy dữ liệu văn bản." });
      }

      let prompt = "";
      if (parsingMode === "normal") {
        prompt = `Bạn là một chuyên gia OCR Toán học. Nhiệm vụ của bạn là chuẩn hóa nội dung văn bản (đã được bóc tách từ file Word) sang Markdown và LaTeX chuẩn.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Văn bản đầu vào có thể chứa mã MathML thô hoặc công thức bị lỗi. Hãy chuyển TẤT CẢ chúng sang mã LaTeX chuẩn. Công thức nội dòng bọc bằng $...$, công thức độc lập bọc bằng $$...$$.
2. Về Cấu trúc Đề thi (Nếu tài liệu là đề thi trắc nghiệm):
   - Mở đầu mỗi câu hỏi PHẢI là "Câu X:" (Ví dụ: Câu 1:, Câu 2:).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
   - Nếu có lời giải chi tiết, phải bắt đầu bằng cụm từ "Lời giải:" ở dòng mới.
3. Về Hình ảnh & Đồ thị: Nếu câu hỏi hoặc đoạn văn có hình vẽ, đồ thị hàm số, bảng biến thiên, sơ đồ hoặc hình học, BẮT BUỘC phải chèn thẻ đánh dấu hình ảnh theo cú pháp ![Hình X](image_X) (với X là số thứ tự 1, 2, 3...) ngay bên dưới đề bài để hệ thống tự động nhúng hình ảnh vào Word.
3. Về Cấu trúc Văn bản: Giữ nguyên các đoạn văn. Không tự ý cắt bớt chữ.
4. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào (ví dụ: "Dưới đây là kết quả...", "Đã hoàn thành..."). CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "tag_questions") {
        prompt = `Bạn là một chuyên gia OCR Toán học. Nhiệm vụ của bạn là chuẩn hóa nội dung văn bản (đã được bóc tách từ file Word) sang Markdown và LaTeX chuẩn, ĐỒNG THỜI TỰ ĐỘNG GẮN THẺ mức độ nhận thức ([B], [H], [VD]) cho các câu hỏi trắc nghiệm và câu đúng/sai.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Văn bản đầu vào có thể chứa mã MathML thô hoặc công thức bị lỗi. Hãy chuyển TẤT CẢ chúng sang mã LaTeX chuẩn. Công thức nội dòng bọc bằng $...$, công thức độc lập bọc bằng $$...$$.
2. Về Cấu trúc Đề thi (Nếu tài liệu là đề thi trắc nghiệm):
   - Mở đầu mỗi câu hỏi trắc nghiệm 4 lựa chọn PHẢI có thẻ tag, ví dụ: "Câu 1 [B]:", "Câu 2 [H]:", "Câu 3 [VD]:". Bạn hãy tự đánh giá độ khó để gắn thẻ phù hợp ([B] Nhận biết, [H] Thông hiểu, [VD] Vận dụng).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
   - Đối với câu hỏi trắc nghiệm Đúng/Sai (có 4 ý a, b, c, d), bạn phải gắn thẻ ngay trước hoặc sau ký tự a, b, c, d. Ví dụ: "a) [B] Nội dung...", "b) [H] Nội dung...".
   - Nếu có lời giải chi tiết, phải bắt đầu bằng cụm từ "Lời giải:" ở dòng mới.
3. Về Hình ảnh & Đồ thị: Nếu câu hỏi hoặc đoạn văn có hình vẽ, đồ thị hàm số, bảng biến thiên, sơ đồ hoặc hình học, BẮT BUỘC phải chèn thẻ đánh dấu hình ảnh theo cú pháp ![Hình X](image_X) (với X là số thứ tự 1, 2, 3...) ngay bên dưới đề bài để hệ thống tự động nhúng hình ảnh vào Word.
3. Về Cấu trúc Văn bản: Giữ nguyên các đoạn văn. Không tự ý cắt bớt chữ.
4. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào. CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "exam") {
        prompt = `Bạn là một chuyên gia bóc tách dữ liệu giáo dục. Nhiệm vụ của bạn là bóc tách toàn bộ nội dung đề thi trắc nghiệm từ tài liệu được cung cấp.
BẮT BUỘC TUÂN THỦ CÁC QUY ĐỊNH SAU ĐỂ HỆ THỐNG XỬ LÝ (NẾU KHÔNG SẼ BỊ LỖI):
1. Về Công thức Toán học: Chuyển TẤT CẢ các biểu thức toán học sang mã LaTeX chuẩn. Công thức nội dòng bọc bằng $...$, công thức độc lập bọc bằng $$...$$. Tuyệt đối không dùng ký hiệu Unicode.
2. Về Cấu trúc Đề thi:
   - Mở đầu mỗi câu hỏi PHẢI là "Câu X:" (Ví dụ: Câu 1:, Câu 2:).
   - 4 đáp án bắt buộc phải bắt đầu bằng "A.", "B.", "C.", "D." và nằm trên các dòng riêng biệt.
3. TUYỆT ĐỐI KHÔNG GIẢI ĐỀ: Nhiệm vụ của bạn CHỈ LÀ TRÍCH XUẤT LẠI NỘI DUNG ĐỀ THI chính xác như bản gốc. KHÔNG tự ý giải bài, KHÔNG đưa ra đáp án đúng.
4. Output "Sạch": KHÔNG thêm bất kỳ câu giao tiếp nào. CHỈ trả về đúng nội dung đã bóc tách.`;
      } else if (parsingMode === "similar_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Dựa vào nội dung đề thi/tài liệu gốc ở dưới, hãy TẠO RA ${examCount} ĐỀ THI MỚI TƯƠNG TỰ.
YÊU CẦU:
- Các đề mới giữ nguyên cấu trúc (số câu, dạng bài, độ khó) của đề gốc. BẠN PHẢI SINH RA ĐẦY ĐỦ 100% SỐ LƯỢNG CÂU HỎI, KHÔNG ĐƯỢC RÚT GỌN HAY BỎ SÓT.
- Thay đổi số liệu, thông số, ngữ cảnh sao cho tương đương nhưng không giống hệt.
${contextSuggestion ? `- YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: Hãy phân tích sâu về ngữ cảnh sau đây để tạo đề dễ hiểu, phù hợp tính sư phạm (áp dụng linh hoạt cho mọi bộ môn): "${contextSuggestion}"` : ''}
- Trình bày bằng định dạng Markdown.
- Tất cả công thức toán học/MathML phải chuyển sang LaTeX chuẩn (inline dùng $...$, block dùng $$...$$).
- Các câu theo định dạng "Câu X: ...".
- 4 đáp án A, B, C, D rõ ràng.
${examCount > 1 ? `- Phân tách các đề bằng dấu gạch ngang (---) và tiêu đề rõ ràng (ví dụ: Đề 1, Đề 2...).` : ''}
- YÊU CẦU VỀ LỜI GIẢI (QUAN TRỌNG):
${includeShortSolution ? `  + BẮT BUỘC: Phải kèm theo "Đáp án ngắn gọn" (bảng đáp án hoặc giải thích cực ngắn) ở phần cuối cùng của tài liệu.` : `  + BẮT BUỘC: KHÔNG cung cấp lời giải hay đáp án, chỉ sinh đề thi.`}
- KHÔNG thêm giải thích thừa.`;
      } else if (parsingMode === "matrix_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo ra MỘT ĐỀ THI ĐÚNG CHUẨN FORMAT 2025 MỚI NHẤT bám sát cấu trúc Ma Trận Đặc Tả sau đây:
${matrixConfig}

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG & MỨC ĐỘ:
1. Đề thi phải chia làm 3 phần (nếu trong ma trận có số lượng câu tương ứng):
   - PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Mỗi câu có 4 đáp án A, B, C, D).
   - PHẦN II. Câu trắc nghiệm đúng sai. Mỗi câu phải có đúng 4 ý a), b), c), d).
   - PHẦN III. Câu trắc nghiệm trả lời ngắn (Học sinh chỉ cần điền một con số hoặc cụm từ ngắn gọn).

2. Cấu trúc câu hỏi Đúng/Sai (RẤT QUAN TRỌNG):
   - Cột "Cấu trúc ý ĐS (B-H-VD)" trong ma trận định nghĩa số lượng ý Nhận biết - Thông hiểu - Vận dụng cho từng câu hỏi Đúng/Sai thuộc chủ đề đó. 
   - Ví dụ: Cấu trúc "2-1-1" nghĩa là trong 4 ý a,b,c,d của câu hỏi đó, PHẢI CÓ đúng 2 ý ở mức Nhận biết, 1 ý ở mức Thông hiểu, và 1 ý ở mức Vận dụng.
   - Bạn phải gắn thẻ mức độ [B], [H], [VD] ngay sau mỗi ý a,b,c,d để chứng minh. Ví dụ: "a) [B] Nội dung ý a... b) [H] Nội dung ý b...".

3. Gắn thẻ trước mỗi câu hỏi:
   - Các câu phần I và III phải gắn thẻ mức độ: [B], [H], [VD], [VDC]. Ví dụ: "Câu 1 [B]:" hoặc "Câu 3 [VD]:"
   - Giữ nguyên định dạng Markdown và chuyển tất cả công thức sang LaTeX chuẩn ($...$, $$...$$).

YÊU CẦU VỀ NỘI DUNG:
${textContent ? `- Hãy bám sát vào Bảng Ma Trận Đặc Tả được cung cấp ở trên. Nếu Bảng Ma Trận ghi chú rằng ma trận nằm trong tài liệu đính kèm, HÃY DỰA HOÀN TOÀN VÀO TÀI LIỆU ĐÍNH KÈM ĐÓ để làm bộ khung sinh đề. Nếu ma trận đã được thiết lập rõ ràng, hãy coi tài liệu đính kèm là Dữ Liệu Tham Khảo bổ trợ.` : `- Bạn BẮT BUỘC phải tuân thủ nghiêm ngặt Ma Trận Đặc Tả (Môn học, Lớp học, Tên bài, Số lượng câu, Mức độ) ở trên làm bộ khung chính để tự biên soạn và tạo đề.`}
TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM TẮT, KHÔNG ĐƯỢC RÚT GỌN, PHẢI SINH ĐỦ 100% SỐ LƯỢNG CÂU HỎI THEO ĐÚNG YÊU CẦU TRONG MA TRẬN.
${contextSuggestion ? `- YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: Hãy phân tích sâu về ngữ cảnh sau đây để tạo đề dễ hiểu, phù hợp tính sư phạm (áp dụng linh hoạt cho mọi bộ môn): "${contextSuggestion}"` : ''}
- LỆNH TỐI CẦN THIẾT: TUYỆT ĐỐI KHÔNG ĐƯỢC QUÊN PHẦN ĐÁP ÁN/LỜI GIẢI NẾU CÓ YÊU CẦU. KHÔNG giải thích lằng nhằng, chỉ xuất ra đề thi${includeShortSolution ? ' và ĐẦY ĐỦ đáp án/lời giải ở cuối' : ''}.
- YÊU CẦU VỀ LỜI GIẢI (QUAN TRỌNG):
${includeShortSolution ? `  + BẮT BUỘC: Phải kèm theo "Đáp án ngắn gọn" (bảng đáp án hoặc giải thích cực ngắn) ở phần cuối cùng của tài liệu.` : `  + BẮT BUỘC: KHÔNG cung cấp lời giải hay đáp án, chỉ sinh đề thi.`}`;
      } else if (parsingMode === "standardize_exam") {
        prompt = `Bạn là một chuyên gia giáo dục. Nhiệm vụ của bạn là đọc nội dung đề thi/tài liệu được cung cấp (dưới dạng văn bản hoặc hình ảnh) và CHUẨN HÓA lại toàn bộ theo đúng chuẩn cấu trúc thi mới nhất. BẠN PHẢI CHUẨN HÓA TẤT CẢ CÁC CÂU HỎI TRONG ĐỀ GỐC, KHÔNG ĐƯỢC BỎ SÓT, RÚT GỌN HAY LÀM TẮT BẤT KỲ CÂU NÀO.

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG & MỨC ĐỘ:
1. Đề thi phải chia làm 3 phần chuẩn:
   - PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Mỗi câu có 4 đáp án A, B, C, D).
   - PHẦN II. Câu trắc nghiệm đúng sai (Mỗi câu phải có đúng 4 ý a), b), c), d)).
   - PHẦN III. Câu trắc nghiệm trả lời ngắn.

2. Gắn thẻ mức độ nhận thức (RẤT QUAN TRỌNG):
   - BẠN BẮT BUỘC PHẢI TỰ ĐỘNG ĐÁNH GIÁ và gắn thẻ mức độ [B] (Nhận biết), [H] (Thông hiểu), [VD] (Vận dụng) hoặc [VDC] (Vận dụng cao) cho TỪNG CÂU HỎI.
   - Đối với PHẦN I và PHẦN III: Gắn thẻ ngay trước câu hỏi. Ví dụ: "Câu 1 [B]:" hoặc "Câu 3 [VD]:".
   - Đối với PHẦN II (Đúng/Sai): AI sẽ ĐÁNH GIÁ VÀ GẮN THẺ CHO TỪNG Ý NHỎ a, b, c, d để được kết quả như: "a) [B] Nội dung ý a... b) [H] Nội dung ý b...". BẮT BUỘC TỪNG Ý ĐỀU PHẢI CÓ THẺ.

3. Kỹ thuật hiển thị:
   - Giữ nguyên định dạng Markdown và chuyển tất cả công thức sang LaTeX chuẩn (dùng $...$ và $$...$$).
   - Không tự ý thay đổi số liệu đề gốc, chỉ chuẩn hóa format và đánh giá mức độ.

4. Yêu cầu về Lời giải/Đáp án (QUAN TRỌNG):
${includeShortSolution ? `   - BẮT BUỘC: Ở phần cuối cùng của tài liệu, chỉ cung cấp bảng đáp án và hướng dẫn giải cực kỳ ngắn gọn, dưới tiêu đề "Đáp án ngắn gọn:".` : '   - KHÔNG cung cấp lời giải, chỉ xuất ra đề thi.'}

- KHÔNG giải thích lằng nhằng, chỉ xuất ra đề thi${includeShortSolution ? ' và đáp án/lời giải' : ''}.`;
      } else if (parsingMode === "solve_exam_tutor") {
        prompt = `Bạn là một gia sư AI tài năng, xuất sắc. Nhiệm vụ của bạn là đọc và hiểu tài liệu đề bài được cung cấp (dưới dạng văn bản hoặc hình ảnh).
Sau đó, hãy trình bày lời giải chi tiết, từng bước, khoa học và cực kỳ dễ hiểu cho học sinh trung học phổ thông.

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG VÀ NỘI DUNG:
1. GIẢI QUYẾT TOÀN BỘ ĐỀ: Bạn BẮT BUỘC phải tìm và giải quyết TẤT CẢ các câu hỏi có trong tài liệu. Tuyệt đối không được bỏ sót câu nào, không được dừng lại giữa chừng hay chỉ giải 1 câu đầu tiên.
2. Trình bày dưới dạng Markdown rõ ràng, phân chia rõ "Câu 1:", "Câu 2:"... để người dùng dễ theo dõi.
3. Toàn bộ các công thức toán học BẮT BUỘC phải bọc trong các cặp thẻ LaTeX: $...$ cho công thức nội dòng và $$...$$ cho biểu thức dạng khối. Tuyệt đối không dùng ký hiệu Unicode (như √, Δ).
4. Sử dụng giọng văn sư phạm, lịch sự, thân thiện và giàu khích lệ.
5. Mọi câu trả lời và kiến thức BẮT BUỘC phải bám sát định hướng của bộ sách "Kết nối tri thức với cuộc sống".
6. PHÂN LOẠI LỜI GIẢI THEO MỨC ĐỘ: Bạn phải tự đánh giá mức độ của từng câu hỏi. Đối với các câu hỏi Nhận biết (dễ, lý thuyết cơ bản mức [B]), CHỈ CẦN đưa ra phương án đúng, KHÔNG giải thích chi tiết. CHỈ ĐƯỢC giải thích chi tiết (từng bước) đối với các câu hỏi Thông hiểu ([H]) và Vận dụng ([VD]).`;
      } else if (parsingMode === "normalize_text") {
        prompt = `Bạn là một trợ lý AI xử lý văn bản tiếng Việt. Nhiệm vụ của bạn là đọc văn bản gốc do người dùng cung cấp và TỰ ĐỘNG CHUẨN HÓA, SỬA LỖI CHÍNH TẢ, NGỮ PHÁP, CÚ PHÁP, VÀ CÁCH TRÌNH BÀY của văn bản đó.

YÊU CẦU BẮT BUỘC:
1. Sửa toàn bộ các lỗi chính tả, đánh máy, viết hoa sai quy tắc.
2. Cải thiện cách diễn đạt sao cho lưu loát, tự nhiên và đúng văn phong tiếng Việt nhưng vẫn BẢO TOÀN TỐI ĐA Ý NGHĨA VÀ NỘI DUNG GỐC của tác giả.
3. Nếu có công thức toán học, hãy chuyển sang định dạng LaTeX chuẩn (inline dùng $...$, block dùng $$...$$).
4. KHÔNG ĐƯỢC thêm bất kỳ lời bình luận, giải thích hay câu chào hỏi nào. BẠN CHỈ TRẢ VỀ ĐÚNG ĐOẠN VĂN BẢN ĐÃ ĐƯỢC CHUẨN HÓA VÀ KHÔNG CÓ GÌ THÊM.`;
      } else if (parsingMode === "latex_correction") {
        prompt = `Bạn là một hệ thống máy tính tự động, CHỈ làm duy nhất một việc: PHÁT HIỆN VÀ SỬA LỖI CÚ PHÁP LATEX.

LỆNH TỐI CAO BẮT BUỘC TUÂN THỦ (NẾU VI PHẠM SẼ BỊ HỦY):
1. TUYỆT ĐỐI KHÔNG GIẢI TOÁN: Dù đầu vào là một bài toán, phương trình hay câu hỏi trắc nghiệm, BẠN KHÔNG ĐƯỢC PHÉP ĐƯA RA LỜI GIẢI, ĐÁP ÁN HAY GỢI Ý. BẠN CHỈ LÀ CÔNG CỤ SỬA LỖI GÕ (TYPO) CỦA CODE LATEX.
2. BẢO TOÀN NGỮ NGHĨA 100%: Tuyệt đối không thay đổi câu chữ, không viết lại văn phong, không dịch ngôn ngữ. CHỈ tìm mã Toán học bị sai cú pháp và sửa lại cho đúng.
3. SỬA LỖI CÚ PHÁP TOÁN: Phát hiện và sửa các lỗi thiếu dấu ngoặc nhọn '{}', thiếu hoặc thừa dấu '$', lệnh gõ sai (ví dụ: '\frac' viết thành '\farc'), khoảng trắng bất hợp lý trong code Toán.
4. Đảm bảo công thức nội dòng được bọc bằng $...$ và công thức khối bọc bằng $$...$$.
5. TRẢ VỀ KẾT QUẢ SẠCH: TRẢ VỀ ĐÚNG ĐOẠN VĂN BẢN (ĐÃ ĐƯỢC SỬA LỖI LATEX). KHÔNG xưng hô, KHÔNG giải thích bạn đã sửa gì, KHÔNG bao bọc bởi markdown block.`;
      } else if (parsingMode === "lesson_plan") {
        prompt = `Bạn là một hệ thống tự động biên soạn tài liệu. Nhiệm vụ của bạn là XUẤT RA VĂN BẢN GIÁO ÁN CHI TIẾT.

THÔNG TIN BÀI HỌC CẦN SOẠN:
- Môn học: ${subject || 'Không xác định'}
- Khối lớp: ${grade || 'Không xác định'}
- Tên bài học: ${lesson || 'Không xác định'}

ĐIỀU KIỆN TIÊN QUYẾT:
- KHÔNG CÓ LỜI MỞ ĐẦU (ví dụ: CẤM các câu như "Dưới đây là...", "Kế hoạch bài dạy này...").
- KHÔNG CÓ LỜI KẾT LUẬN.
- Ký tự đầu tiên của kết quả trả về PHẢI là dấu "#" hoặc "**" (bắt đầu ngay vào tiêu đề Kế hoạch bài dạy).

YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG VÀ NỘI DUNG:
1. Bắt đầu từ Tiết 1: BẮT BUỘC phải soạn giáo án bắt đầu từ Tiết 1, sau đó đến Tiết 2... Tuyệt đối KHÔNG ĐƯỢC bỏ qua Tiết 1.
2. Tích hợp năng lực số: Đề xuất các công cụ AI, phần mềm mô phỏng, nền tảng trực tuyến trong các hoạt động.
3. Cấu trúc 4 bước: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng (Nếu không có mẫu sẵn). 
4. Trình bày Markdown và LaTeX: Bắt buộc dùng $...$ và $$...$$ cho công thức toán.
5. TUÂN THỦ TÀI LIỆU MẪU: Nếu có Mẫu giáo án đính kèm, BẮT BUỘC giữ nguyên cấu trúc các đề mục của mẫu đó và điền nội dung vào.
${contextSuggestion ? `6. YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN: ${contextSuggestion}` : ''}`;
      }
      
      if (parsingMode !== "lesson_plan" && parsingMode !== "latex_correction" && parsingMode !== "normalize_text") {
        prompt += `\n\n[YÊU CẦU BẮT BUỘC CHUNG]: Bạn PHẢI tuân thủ NGHIÊM NGẶT các cấu hình xử lý (bao gồm yêu cầu về lời giải, định dạng, độ khó, ma trận) đã được chỉ định ở trên. TUYỆT ĐỐI KHÔNG tự ý thay đổi, bỏ qua hay làm trái các chỉ thị cấu hình này. Mọi nội dung, ngữ cảnh, thuật ngữ và dữ liệu bạn sinh ra PHẢI tuân thủ và bám sát tuyệt đối theo chuẩn của bộ sách "Kết nối tri thức và cuộc sống", nội dung chuẩn kiến thức kĩ năng của chương trình GDPT 2018. TUYỆT ĐỐI KHÔNG giải thích, nhận xét hay bình luận về sự tuân thủ này. BẠN CHỈ LÀ MỘT HỆ THỐNG TỰ ĐỘNG XUẤT RAW TEXT.\n`;
      } else if (parsingMode === "lesson_plan") {
        prompt += `\n\n[HƯỚNG DẪN BIÊN SOẠN]: Nội dung giáo án cần tương thích với định hướng của bộ sách "Kết nối tri thức và cuộc sống", chương trình GDPT 2018 và các văn bản hướng dẫn mới nhất. TRÌNH BÀY GIÁO ÁN NGAY LẬP TỨC, KHÔNG CÓ BẤT KỲ LỜI BÌNH LUẬN NÀO. Bạn tuyệt đối không được tự ý thay đổi các quy định chung của hệ thống.\n`;
      }

      if (continueFromText) {
        prompt += `\n[YÊU CẦU ĐẶC BIỆT]: Đoạn văn bản trước đó bạn sinh ra bị thiếu. Dưới đây là phần văn bản cuối cùng bạn đã viết:\n"""\n${continueFromText.length > 2000 ? continueFromText.substring(continueFromText.length - 2000) : continueFromText}\n"""\nHãy ĐỌC KỸ phần cuối này và TIẾP TỤC sinh ra nội dung CÒN THIẾU ngay nối tiếp phần đó. TUYỆT ĐỐI KHÔNG viết lại những phần đã sinh ra, chỉ viết tiếp.\n`;
      }

      if (parsingMode === "matrix_exam") {
        if (textContent) {
          prompt += `\n\n[TÀI LIỆU ĐÍNH KÈM TỪ GIÁO VIÊN]:\n${textContent}\n\n(LƯU Ý TỐI QUAN TRỌNG: Nếu bảng Ma trận yêu cầu đọc tài liệu đính kèm, hãy dùng nội dung này làm bộ khung chính để sinh đề. Nếu ma trận đã được điền sẵn, hãy dùng nội dung này làm dữ liệu tham khảo ngữ cảnh!)`;
        }
      } else if (parsingMode === "lesson_plan") {
        if (textContent) {
          prompt += `\n\n[MẪU GIÁO ÁN / TÀI LIỆU THAM KHẢO TỪ GIÁO VIÊN]:\n${textContent}\n\n(LƯU Ý TỐI QUAN TRỌNG: Các tài liệu đính kèm bên trên CHỈ LÀ MẪU CẤU TRÚC hoặc TÀI LIỆU THAM KHẢO. Bạn BẮT BUỘC phải viết nội dung cho bài học "${lesson}" (Môn ${subject}, ${grade}). TUYỆT ĐỐI KHÔNG sao chép chủ đề của tài liệu mẫu. Bạn CHỈ ĐƯỢC lấy cấu trúc các đề mục từ mẫu này và BẮT BUỘC ĐIỀN KIẾN THỨC CỦA BÀI "${lesson}" VÀO ĐÓ!)`;
        }
      } else {
        prompt += `\n\nNội dung:\n${textContent}`;
      }

      const clientKeyToUse = apiKey || "default";
      const cachedModel = workingModelCache[clientKeyToUse];

      const basePool = [
        model, 
        "gemini-2.5-flash", 
        "gemini-2.0-flash", 
        "gemini-1.5-flash", 
        "gemini-3-flash-preview",
        "gemini-3.5-flash",
        "gemini-3-pro-preview",
        "gemini-1.5-pro"
      ];
      const MODELS_POOL = Array.from(new Set(cachedModel ? [cachedModel, ...basePool] : basePool)).filter(Boolean) as string[];
      let lastError: any = null;
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        for (const modelName of MODELS_POOL) {
          try {
            const client = getGeminiClient(apiKey, modelName);
            const response = await client.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                temperature: ["mindmap", "normal", "tag_questions", "exam", "standardize_exam"].includes(parsingMode) ? 0.0 : 0.7,
                topP: ["mindmap", "normal", "tag_questions", "exam", "standardize_exam"].includes(parsingMode) ? 0.05 : 0.95,
                maxOutputTokens: 8192,
              }
            });

            if (response && response.text) {
              let textValue = typeof (response as any).text === 'function' ? await (response as any).text() : response.text;
              if (parsingMode === "mindmap" || (customPrompt && (customPrompt.includes("Markmap") || customPrompt.includes("Sơ đồ tư duy")))) {
                textValue = sanitizeMindmapCode(textValue);
              }
              workingModelCache[clientKeyToUse] = modelName;
              const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
              const isFinished = finishReason !== 'MAX_TOKENS';
              return res.json({ text: textValue, finishReason, isFinished });
            }
          } catch (err: any) {
            console.warn(`Lỗi khi gọi model ${modelName} cho xử lý Word (Lần thử ${attempt}):`, err.message || err);
            lastError = err;
            // Continue to next model if available
          }
        }
        
        // If all models failed in this attempt, wait before retrying
        if (attempt < MAX_RETRIES) {
          console.log(`Đang chờ thử lại (Lần ${attempt + 1})...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }

      throw lastError || new Error("Hệ thống AI đang quá tải. Vui lòng thử lại sau vài phút.");
    } catch (error: any) {
      console.error("API Word Convert Exception:", error);
      res.status(500).json({
        error: error.message || "Có lỗi bất ngờ xảy ra khi xử lý file Word."
      });
    }
  });

  // Khi được đóng gói bằng pkg, __dirname sẽ trỏ tới thư mục ảo chứa snapshot
  const isPkg = typeof process !== 'undefined' && 'pkg' in process;
  if (isPkg) {
    process.env.NODE_ENV = "production";
  }

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file assets...");
    const distPath = isPkg ? __dirname : path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    // Tự động mở trình duyệt nếu đang chạy ở chế độ production (đóng gói)
    if (process.env.NODE_ENV === "production") {
      const url = `http://localhost:${PORT}`;
      console.log(`Tự động mở trình duyệt tại: ${url}`);
      const { platform } = process;
      let cmd = '';
      if (platform === 'win32') cmd = `start "" "${url}"`;
      else if (platform === 'darwin') cmd = `open "${url}"`;
      else cmd = `xdg-open "${url}"`;
      
      require('child_process').exec(cmd);
    }
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to start server:", err);
});
