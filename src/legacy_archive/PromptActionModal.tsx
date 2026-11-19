import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles, Image as ImageIcon, ChevronDown, ChevronUp, CornerDownLeft, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  description?: string;
  promptContent: string;
  jsonPromptContent?: string;
  hasJsonImport?: boolean;
  onImportJson?: (jsonString: string) => void;
  jsonImportPlaceholder?: string;
}

export default function PromptActionModal({
  isOpen,
  onClose,
  title,
  badge = 'Vẽ ảnh 1-chạm',
  description = 'Bấm nút để vừa tự động chép lệnh, vừa mở ngay trang web AI để dán và vẽ ảnh!',
  promptContent,
  jsonPromptContent,
  hasJsonImport = false,
  onImportJson,
  jsonImportPlaceholder = 'Dán đoạn kết quả JSON từ AI vào đây...'
}: Props) {
  const [copiedType, setCopiedType] = useState<'chatgpt' | 'gemini' | 'raw' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPromptMode, setSelectedPromptMode] = useState<'image' | 'json'>('image');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  if (!isOpen) return null;

  const activePrompt = (selectedPromptMode === 'json' && jsonPromptContent)
    ? jsonPromptContent
    : promptContent;

  const handleCopy = (type: 'chatgpt' | 'gemini' | 'raw') => {
    navigator.clipboard.writeText(activePrompt);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyAndOpen = (url: string, type: 'chatgpt' | 'gemini') => {
    handleCopy(type);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleApplyJson = () => {
    if (!jsonInput.trim()) {
      setJsonError('Vui lòng dán kết quả JSON vào ô bên dưới.');
      return;
    }

    try {
      setJsonError('');
      let clean = jsonInput.trim();
      const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        clean = match[1].trim();
      }
      JSON.parse(clean);

      if (onImportJson) {
        onImportJson(clean);
        onClose();
      }
    } catch (err: any) {
      setJsonError('Dữ liệu JSON chưa đúng định dạng. Vui lòng kiểm tra lại phản hồi từ AI.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                  {title}
                </h3>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* PHẦN 1: ĐƯỜNG DẪN & NÚT MỞ TRỰC TIẾP GEMINI VÀ CHATGPT (ĐƯỢC ĐẶT LÊN TRÊN CÙNG) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <ExternalLink size={14} className="text-teal-600" />
                <span>Bấm vào đây để mở và vẽ ảnh ngay:</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Tự động sao chép lệnh khi bấm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NÚT MỞ GEMINI */}
              <button
                onClick={() => handleCopyAndOpen('https://gemini.google.com', 'gemini')}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-blue-500/25 transition cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-base shrink-0">
                    G
                  </div>
                  <div>
                    <div className="font-extrabold flex items-center gap-1">
                      Mở Google Gemini
                      <ExternalLink size={13} className="group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="text-[10px] text-blue-100 font-mono underline decoration-blue-300">
                      https://gemini.google.com
                    </div>
                  </div>
                </div>
              </button>

              {/* NÚT MỞ CHATGPT */}
              <button
                onClick={() => handleCopyAndOpen('https://chatgpt.com', 'chatgpt')}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-emerald-500/25 transition cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-base shrink-0">
                    C
                  </div>
                  <div>
                    <div className="font-extrabold flex items-center gap-1">
                      Mở ChatGPT (DALL-E)
                      <ExternalLink size={13} className="group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="text-[10px] text-emerald-100 font-mono underline decoration-emerald-300">
                      https://chatgpt.com
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* HƯỚNG DẪN 1 CHẠM */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
              ✓
            </div>
            <div>
              <strong>Cách dùng:</strong> Bấm 1 trong 2 nút ở trên &rarr; Sang tab vừa mở, chỉ cần ấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Ctrl + V</kbd> và <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Enter</kbd> là ảnh sẽ tự động vẽ ra!
            </div>
          </div>

          {/* PHẦN 2: NỘI DUNG CÂU LỆNH (GỌN GÀNG, KHÔNG CHIẾM QUÁ NHIỀU MÀN HÌNH) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon size={13} className="text-teal-600" />
                <span>Nội dung câu lệnh đang sẵn sàng:</span>
              </label>
              <button
                onClick={() => handleCopy('raw')}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedType === 'raw' ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Sao chép lại lệnh</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              value={activePrompt}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* TÙY CHỌN NÂNG CAO: THU GỌN LẠI DƯỚI ĐÁY */}
          {hasJsonImport && onImportJson && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⚙️ Tùy chọn nâng cao: Nhập dữ liệu JSON để Web tự xuất ảnh</span>
                {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showAdvanced && (
                <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-fade-in">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Nếu thầy/cô đã có sẵn đoạn mã JSON từ Gemini, có thể dán vào đây để Web tự động vẽ ảnh chuẩn Tiếng Việt:
                  </p>

                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={jsonImportPlaceholder}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />

                  {jsonError && (
                    <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{jsonError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyJson}
                    disabled={!jsonInput.trim()}
                    className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <CornerDownLeft size={14} />
                    <span>Áp Dụng JSON Để Xuất Ảnh Trên Web</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
