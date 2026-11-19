export async function callGemini(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-3-flash-preview',
  imageBase64?: string
): Promise<{ text: string }> {
  if (!apiKey) {
    throw new Error('API Key không hợp lệ hoặc bị thiếu.');
  }

  // Ưu tiên Gemini 3 Flash / Gemini 3 Pro / Gemini 2.5 Flash
  const basePool = (!model || model === 'auto') ? [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ] : [
    model,
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  
  const MODELS_POOL = Array.from(new Set(basePool));
  let allErrors: string[] = [];

  for (const modelName of MODELS_POOL) {
    try {
      let contents: any[] = [];
      
      if (imageBase64) {
        const match = imageBase64.match(/^data:([^;]+);base64,/);
        const mimeType = match ? match[1] : "image/jpeg";
        const data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
        
        contents = [
          {
            parts: [
              { text: prompt || "Phân tích hình ảnh này:" },
              { inlineData: { mimeType: mimeType, data: data } }
            ]
          }
        ];
      } else {
        contents = [
          {
            parts: [{ text: prompt }]
          }
        ];
      }

      const apiVersion = modelName.includes('3.0') || modelName.includes('3.5') || modelName.includes('3-') ? 'v1alpha' : 'v1beta';
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errMsg = errorData.error.message;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        return { text };
      } else {
        allErrors.push(`[${modelName}]: Không có nội dung trả về từ AI.`);
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      allErrors.push(`[${modelName}]: ${errMsg}`);
      
      // Báo lỗi ngay lập tức nếu API Key không hợp lệ (không tốn thời gian loop)
      if (errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('not valid')) {
        throw new Error(`API Key không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.`);
      }
      
      // Nếu lỗi Quota (429), chờ 1 giây rồi thử model tiếp theo
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Resource Exhausted')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  const errorDetails = allErrors.join(' | ');
  if (errorDetails.includes('quota') || errorDetails.includes('429') || errorDetails.includes('Resource Exhausted')) {
    throw new Error(`API Key của bạn đã hết hạn ngạch (Quota) miễn phí hoặc bị giới hạn tốc độ trên tất cả các mô hình AI dự phòng. Vui lòng chờ 1-2 phút rồi thử lại.`);
  }

  throw new Error(`Tất cả các model AI đều lỗi. Chi tiết: ${errorDetails}`);
}
