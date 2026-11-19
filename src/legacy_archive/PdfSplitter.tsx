import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Scissors,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  X,
  Layers,
  Sparkles,
  Info,
  FileCheck,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  // URL xem trước file gốc đã tải lên & trạng thái hiển thị
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);
  const [showSourceViewer, setShowSourceViewer] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Chế độ tách: 'range' (từ trang A đến B), 'custom' (danh sách tuỳ biến: 1, 3-5, 8), 'single' (mỗi trang 1 file)
  const [splitMode, setSplitMode] = useState<'range' | 'custom' | 'single'>('range');

  // Khoảng trang
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);

  // Tuỳ chỉnh trang: ví dụ "3-5" hoặc "1, 3-5, 8"
  const [customRangeStr, setCustomRangeStr] = useState<string>('3-5');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Danh sách các file PDF nhỏ đã được tạo
  const [extractedResults, setExtractedResults] = useState<{
    name: string;
    url: string;
    pageCount: number;
    rangeLabel: string;
  }[]>([]);

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dọn dẹp bộ nhớ URL khi đổi file hoặc unmount
  useEffect(() => {
    return () => {
      if (sourcePdfUrl) {
        URL.revokeObjectURL(sourcePdfUrl);
      }
    };
  }, [sourcePdfUrl]);

  // Xử lý nạp file PDF
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await loadPdfFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await loadPdfFile(e.dataTransfer.files[0]);
    }
  };

  const loadPdfFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Vui lòng chọn file có định dạng PDF (.pdf).');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setExtractedResults([]);
      setPreviewPdfUrl(null);
      setIsProcessing(true);

      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const count = pdfDoc.getPageCount();

      if (count === 0) {
        throw new Error('File PDF không chứa trang nào.');
      }

      // Tạo URL để xem trước file gốc
      if (sourcePdfUrl) {
        URL.revokeObjectURL(sourcePdfUrl);
      }
      const objectUrl = URL.createObjectURL(selectedFile);
      setSourcePdfUrl(objectUrl);
      setShowSourceViewer(false);

      setFile(selectedFile);
      setPdfBytes(buffer);
      setTotalPages(count);
      setStartPage(1);
      setEndPage(Math.min(count, 5));
      setCustomRangeStr(`1-${Math.min(count, 3)}`);

    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError('Không thể mở file PDF: ' + (err.message || 'File có thể bị mã hóa hoặc lỗi cấu trúc.'));
      setFile(null);
      setPdfBytes(null);
      setTotalPages(0);
      if (sourcePdfUrl) {
        URL.revokeObjectURL(sourcePdfUrl);
        setSourcePdfUrl(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (sourcePdfUrl) {
      URL.revokeObjectURL(sourcePdfUrl);
    }
    extractedResults.forEach(r => {
      if (r.url) URL.revokeObjectURL(r.url);
    });
    setSourcePdfUrl(null);
    setShowSourceViewer(false);
    setIsModalOpen(false);
    setFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setExtractedResults([]);
    setPreviewPdfUrl(null);
    setSplitMode('range');
    setStartPage(1);
    setEndPage(1);
    setCustomRangeStr('3-5');
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = handleReset;

  // Hàm parse chuỗi trang tuỳ biến (ví dụ "1, 3-5, 8") thành mảng các số trang 1-indexed
  const parsePageNumbers = (str: string, maxPages: number): number[] => {
    const pagesSet = new Set<number>();
    const tokens = str.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);

    for (const token of tokens) {
      if (token.includes('-')) {
        const [startStr, endStr] = token.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          const from = Math.max(1, Math.min(s, e));
          const to = Math.min(maxPages, Math.max(s, e));
          for (let p = from; p <= to; p++) {
            pagesSet.add(p);
          }
        }
      } else {
        const p = parseInt(token, 10);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pagesSet.add(p);
        }
      }
    }

    return Array.from(pagesSet).sort((a, b) => a - b);
  };

  // Tiến hành tách file PDF
  const handleSplitPdf = async () => {
    if (!pdfBytes || !file) {
      setError('Vui lòng chọn file PDF nguồn trước.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const srcDoc = await PDFDocument.load(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, '');
      const results: typeof extractedResults = [];

      // 1. Chế độ Khoảng trang (Ví dụ: trang 3 đến 5)
      if (splitMode === 'range') {
        const s = Math.max(1, Math.min(startPage, totalPages));
        const e = Math.min(totalPages, Math.max(startPage, endPage));

        if (s > e) {
          throw new Error(`Trang bắt đầu (${s}) không được lớn hơn trang kết thúc (${e}).`);
        }

        const newDoc = await PDFDocument.create();
        const pageIndices = [];
        for (let p = s; p <= e; p++) {
          pageIndices.push(p - 1); // 0-indexed
        }

        const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach(p => newDoc.addPage(p));

        const newBytes = await newDoc.save();
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const count = pageIndices.length;
        const name = `${baseName}_trang_${s}_den_${e}.pdf`;

        results.push({
          name,
          url,
          pageCount: count,
          rangeLabel: `Trang ${s} - ${e}`
        });

        setPreviewPdfUrl(url);
        setSuccess(`Đã tạo thành công file PDF mới gồm ${count} trang (Trang ${s} đến ${e})!`);
      }

      // 2. Chế độ Danh sách tuỳ biến (Ví dụ: 1, 3-5, 8)
      else if (splitMode === 'custom') {
        const selectedPages = parsePageNumbers(customRangeStr, totalPages);
        if (selectedPages.length === 0) {
          throw new Error('Vui lòng nhập số trang hợp lệ (Ví dụ: 3-5 hoặc 1, 3, 5-7).');
        }

        const newDoc = await PDFDocument.create();
        const pageIndices = selectedPages.map(p => p - 1);

        const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach(p => newDoc.addPage(p));

        const newBytes = await newDoc.save();
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const count = selectedPages.length;
        const name = `${baseName}_trich_xuat_${selectedPages.length}_trang.pdf`;

        results.push({
          name,
          url,
          pageCount: count,
          rangeLabel: `Các trang: ${selectedPages.join(', ')}`
        });

        setPreviewPdfUrl(url);
        setSuccess(`Đã trích xuất thành công ${count} trang theo yêu cầu!`);
      }

      // 3. Chế độ Mỗi trang tách thành 1 file riêng
      else if (splitMode === 'single') {
        for (let p = 1; p <= totalPages; p++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(srcDoc, [p - 1]);
          newDoc.addPage(copiedPage);

          const newBytes = await newDoc.save();
          const blob = new Blob([newBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const name = `${baseName}_trang_${p}.pdf`;

          results.push({
            name,
            url,
            pageCount: 1,
            rangeLabel: `Trang ${p}`
          });
        }

        setPreviewPdfUrl(results[0]?.url || null);
        setSuccess(`Đã tách toàn bộ file thành ${totalPages} file PDF riêng biệt!`);
      }

      setExtractedResults(results);

    } catch (err: any) {
      console.error('Split error:', err);
      setError(err.message || 'Lỗi khi tách file PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tự động tải xuống file
  const downloadSingleResult = (item: typeof extractedResults[0]) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Tải tất cả các file đã tách
  const downloadAllResults = () => {
    extractedResults.forEach((item, idx) => {
      setTimeout(() => {
        downloadSingleResult(item);
      }, idx * 250);
    });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-fade-in">

      {/* HEADER BANNER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-sm shadow-sm">
          <span>✂️</span>
          <span>Công Cụ Tách & Cắt Trang File PDF</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Tách Trang & Trích Xuất File PDF Nhỏ
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Tải file PDF nguồn lên để tạo file PDF mới từ trang bất kỳ (chẳng hạn <strong>từ trang 3 đến trang 5</strong>). Xử lý tức thì, bảo toàn 100% chất lượng gốc và hoàn toàn bảo mật.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CỘT TRÁI: TẢI FILE & CẤU HÌNH TÁCH (6/12) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">

          {/* Vùng chọn file PDF */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              1. Chọn File PDF Gốc:
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 dark:border-teal-700/60 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-7 text-center cursor-pointer bg-teal-50/20 dark:bg-teal-950/20 hover:bg-teal-50/50 transition flex flex-col items-center justify-center gap-2.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    Kéo thả file PDF vào đây hoặc <span className="text-teal-600 dark:text-teal-400 underline">bấm để chọn</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ mọi file PDF bài giảng, sách giáo khoa, đề thi
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileText size={22} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold mt-0.5 flex items-center gap-2">
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full text-[11px]">
                            Tổng cộng: <strong>{totalPages} trang</strong>
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition shrink-0"
                      title="Gỡ file để chọn file khác"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Thanh nút xem & tra cứu file gốc */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-teal-100 dark:border-teal-800/80">
                    <button
                      type="button"
                      onClick={() => setShowSourceViewer(!showSourceViewer)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                        showSourceViewer
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-slate-700'
                      }`}
                      title="Bật/tắt khung xem trực tiếp file PDF bên dưới"
                    >
                      <Eye size={14} />
                      <span>{showSourceViewer ? 'Ẩn xem file' : 'Xem file gốc'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                      title="Xem phóng to trong hộp thoại toàn màn hình"
                    >
                      <Maximize2 size={13} className="text-teal-600 dark:text-teal-400" />
                      <span>Phóng to</span>
                    </button>

                    {sourcePdfUrl && (
                      <a
                        href={sourcePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                        title="Mở file gốc trên tab mới của trình duyệt để đọc và tra cứu số trang"
                      >
                        <ExternalLink size={13} className="text-teal-600 dark:text-teal-400" />
                        <span>Mở tab mới</span>
                      </a>
                    )}

                    <span className="text-[11px] text-teal-700/80 dark:text-teal-400/80 italic ml-auto hidden sm:inline">
                      Tra cứu số trang trước khi cắt
                    </span>
                  </div>
                </div>

                {/* Khung xem trước trực tiếp file gốc (khi bấm 'Xem file gốc') */}
                {showSourceViewer && sourcePdfUrl && (
                  <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-slate-50 dark:bg-slate-900/80 p-3 space-y-2 animate-fade-in shadow-inner">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2 truncate">
                        <Eye size={14} className="text-teal-600 shrink-0" />
                        <span className="truncate">Đang xem: {file.name}</span>
                        <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          {totalPages} trang
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="p-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-300 rounded-md transition"
                          title="Phóng to toàn màn hình"
                        >
                          <Maximize2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSourceViewer(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
                          title="Thu gọn"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                      <iframe
                        src={sourcePdfUrl}
                        title="Xem trước file PDF gốc"
                        className="w-full h-full border-0"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>💡 Cuộn để xem số trang bài học cần tách</span>
                      <a
                        href={sourcePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Mở tab riêng <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chọn chế độ tách */}
          {file && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700/60 animate-fade-in">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                2. Chọn Cách Tách Trang:
              </label>

              {/* 3 Tab chế độ */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSplitMode('range')}
                  className={`py-2 px-2.5 rounded-lg transition text-center ${
                    splitMode === 'range'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Khoảng trang (3-5)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('custom')}
                  className={`py-2 px-2.5 rounded-lg transition text-center ${
                    splitMode === 'custom'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tùy chỉnh linh hoạt
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('single')}
                  className={`py-2 px-2.5 rounded-lg transition text-center ${
                    splitMode === 'single'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tách từng trang
                </button>
              </div>

              {/* Giao diện tương ứng cho từng chế độ */}
              {splitMode === 'range' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Trích xuất khoảng trang liên tục:</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      Tối đa: {totalPages} trang
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Từ trang:</label>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={startPage}
                        onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-center text-teal-700 dark:text-teal-300"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Đến trang:</label>
                      <input
                        type="number"
                        min={startPage}
                        max={totalPages}
                        value={endPage}
                        onChange={(e) => setEndPage(Math.min(totalPages, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-center text-teal-700 dark:text-teal-300"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200/50">
                    💡 <strong>Kết quả:</strong> Sẽ tạo ra 1 file PDF mới gồm{' '}
                    <strong>{Math.max(0, endPage - startPage + 1)} trang</strong> (từ trang {startPage} đến trang {endPage}).
                  </p>
                </div>
              )}

              {splitMode === 'custom' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                    Nhập các trang muốn trích xuất (ngăn cách bởi dấu phẩy hoặc gạch ngang):
                  </label>
                  <input
                    type="text"
                    value={customRangeStr}
                    onChange={(e) => setCustomRangeStr(e.target.value)}
                    placeholder="Ví dụ: 3-5 hoặc 1, 3-5, 8"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                  <p className="text-[11px] text-slate-400">
                    Ví dụ: <strong>3-5</strong> (lấy trang 3, 4, 5) hoặc <strong>1, 3, 7-10</strong>.
                  </p>
                </div>
              )}

              {splitMode === 'single' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Tách toàn bộ file:
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Mỗi trang sẽ được trích xuất thành 1 file PDF riêng lẻ (tổng cộng sẽ tạo ra <strong>{totalPages} file</strong>).
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* NÚT THỰC HIỆN TÁCH */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSplitPdf}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Scissors size={18} />
                  <span>Bắt Đầu Tách File PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95 shrink-0 shadow-xs"
                  title="Xóa làm lại - Bắt đầu lại từ đầu"
                >
                  <RotateCcw size={16} />
                  <span className="hidden sm:inline text-xs">Xóa làm lại</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* CỘT PHẢI: KẾT QUẢ & XEM TRƯỚC (6/12) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[500px]">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileCheck size={18} className="text-teal-600" />
              Kết Quả File PDF Đã Tách:
            </h3>

            <div className="flex items-center gap-2">
              {extractedResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Xóa làm lại"
                >
                  <RotateCcw size={14} />
                  <span>Làm lại</span>
                </button>
              )}

              {extractedResults.length > 1 && (
                <button
                  onClick={downloadAllResults}
                  className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-teal-200"
                >
                  <Download size={14} />
                  <span>Tải tất cả ({extractedResults.length} file)</span>
                </button>
              )}
            </div>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Danh sách các file PDF đã tạo */}
          {extractedResults.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
              {extractedResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {res.name}
                      </p>
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                        {res.rangeLabel} • {res.pageCount} trang
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-500 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition"
                      title="Mở xem thử trên tab mới"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      onClick={() => downloadSingleResult(res)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <Download size={14} />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <Scissors size={28} />
              </div>
              <p className="max-w-xs leading-relaxed">
                Chưa có file nào được tách. Hãy chọn file PDF ở cột bên trái, nhập khoảng trang mong muốn và bấm <strong>"Bắt Đầu Tách File PDF"</strong>.
              </p>
            </div>
          )}

          {/* Xem trước nếu có kết quả */}
          {previewPdfUrl && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-teal-500" />
                  Xem Trước Trực Tiếp File Đã Tách:
                </span>
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-teal-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  Mở toàn màn hình <ExternalLink size={12} />
                </a>
              </div>
              <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                <iframe
                  src={previewPdfUrl}
                  title="PDF Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL XEM PHÓNG TO FILE PDF GỐC */}
      {isModalOpen && sourcePdfUrl && file && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={18} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-2">
                    <span>Tổng cộng: {totalPages} trang</span>
                    <span>•</span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={sourcePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                  title="Mở trong tab mới của trình duyệt"
                >
                  <ExternalLink size={13} />
                  <span>Mở tab mới</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Đóng cửa sổ"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 overflow-hidden">
              <iframe
                src={sourcePdfUrl}
                title="Xem phóng to file PDF gốc"
                className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span className="flex items-center gap-1">
                💡 <span>Dùng thanh cuộn để tìm số trang bài học, sau đó điền vào ô "Từ trang ... Đến trang ..." để tách</span>
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                Đóng cửa sổ & Tiến hành tách trang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
