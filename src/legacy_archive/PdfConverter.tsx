import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Settings,
  RotateCcw,
  ImageIcon,
  ImagePlus,
  Check,
  Copy,
  Trash2,
  Crop,
} from 'lucide-react';
import JSZip from 'jszip';
import EditorToolbar from './EditorToolbar';
import MarkdownEditor from './MarkdownEditor';
import VisualCropModal from './VisualCropModal';
import { downloadDocxFile, DocxFormattingOptions } from '../utils/docxEquationGenerator';
import {
  extractEmbeddedImagesFromPdf,
  renderPdfPagesToCanvases,
  renderImageFileToCanvas,
  processExtractedImagesFromText,
  ExtractedPdfImage,
} from '../utils/pdfImageExtractor';

interface Props {
  apiKey: string;
  model: string;
}

export default function PdfConverter({ apiKey, model }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [parsingMode, setParsingMode] = useState<string>('normal');
  const [resultText, setResultText] = useState<string>('');

  // Image extraction states
  const [extractedImages, setExtractedImages] = useState<ExtractedPdfImage[]>([]);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [isExtractingImages, setIsExtractingImages] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);

  // Visual Crop Modal states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropTargetId, setCropTargetId] = useState('image_1');
  const [cropPage, setCropPage] = useState(1);

  // Word export formatting options state (persisted to localStorage)
  const [showWordSettings, setShowWordSettings] = useState(false);
  const [wordFormatting, setWordFormatting] = useState<DocxFormattingOptions>(() => {
    try {
      const saved = localStorage.getItem('lvp_docx_formatting');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontFamily: 'Times New Roman',
      fontSizePt: 13,
      lineSpacingMultiplier: 1.15,
      marginPreset: 'exam',
      choiceLayout: 'auto',
    };
  });

  const updateWordFormatting = (updates: Partial<DocxFormattingOptions>) => {
    setWordFormatting(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('lvp_docx_formatting', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const extractedImagesRef = useRef<ExtractedPdfImage[]>([]);
  const imageMapRef = useRef<Record<string, string>>({});
  const manualImageInputRef = useRef<HTMLInputElement>(null);

  const preparePageCanvasesAndImages = async (fileList: File[]) => {
    setIsExtractingImages(true);
    try {
      const canvases: HTMLCanvasElement[] = [];
      const embedded: ExtractedPdfImage[] = [];

      for (const f of fileList) {
        const lowerName = f.name.toLowerCase();
        if (lowerName.endsWith('.pdf')) {
          try {
            const buf = await f.arrayBuffer();
            // Render all pages to high-res canvases for visual crop
            const pageCanvasList = await renderPdfPagesToCanvases(buf, 2.0, 25);
            canvases.push(...pageCanvasList);

            // Also extract embedded raster images if any
            const imgs = await extractEmbeddedImagesFromPdf(buf);
            embedded.push(...imgs);
          } catch (pdfErr) {
            console.warn('Không thể bóc tách ảnh từ PDF:', pdfErr);
          }
        } else if (f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(lowerName)) {
          try {
            const imgCanvas = await renderImageFileToCanvas(f);
            canvases.push(imgCanvas);
            embedded.push({
              id: `image_${embedded.length + 1}`,
              label: f.name.replace(/\.[^/.]+$/, '') || `Hình ${embedded.length + 1}`,
              pageNumber: 1,
              dataUrl: imgCanvas.toDataURL('image/png'),
              width: imgCanvas.width,
              height: imgCanvas.height,
              format: 'png',
              sizeBytes: f.size,
            });
          } catch (imgErr) {
            console.warn('Không thể render ảnh sang canvas:', imgErr);
          }
        } else if (lowerName.endsWith('.docx')) {
          try {
            const zip = await JSZip.loadAsync(f);
            const mediaFiles = zip.file(/^word\/media\//);
            for (const mediaFile of mediaFiles) {
              const ext = mediaFile.name.split('.').pop()?.toLowerCase() || 'png';
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
              const b64 = await mediaFile.async('base64');
              const dataUrl = `data:${mime};base64,${b64}`;
              embedded.push({
                id: `image_${embedded.length + 1}`,
                label: `Hình ${embedded.length + 1}`,
                pageNumber: 1,
                dataUrl,
                width: 350,
                height: 250,
                format: mime.includes('png') ? 'png' : 'jpeg',
                sizeBytes: Math.round((b64.length * 3) / 4),
              });
            }
          } catch (zipErr) {
            console.warn('Không thể bóc tách ảnh từ Word:', zipErr);
          }
        }
      }

      pageCanvasesRef.current = canvases;
      extractedImagesRef.current = embedded;
      setExtractedImages(embedded);

      const map: Record<string, string> = {};
      embedded.forEach((img, idx) => {
        const num = (idx + 1).toString();
        map[`image_${num}`] = img.dataUrl;
        map[num] = img.dataUrl;
        map[`hinh_${num}`] = img.dataUrl;
        map[`hình_${num}`] = img.dataUrl;
        map[`hinh ${num}`] = img.dataUrl;
        map[`hình ${num}`] = img.dataUrl;
        if (img.id) {
          map[img.id] = img.dataUrl;
        }
      });
      imageMapRef.current = map;
      setImageMap(map);
      return { canvases, embedded, imageMap: map };
    } catch (err) {
      console.error('Lỗi khi chuẩn bị dữ liệu hình ảnh:', err);
      return null;
    } finally {
      setIsExtractingImages(false);
    }
  };

  const handleAddManualImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const nextIdx = (extractedImagesRef.current.length || extractedImages.length) + 1;
        const newImg: ExtractedPdfImage = {
          id: `image_${nextIdx}`,
          label: `Hình ${nextIdx} (Thêm tay)`,
          pageNumber: 1,
          dataUrl,
          width: 360,
          height: 240,
          format: file.type.includes('png') ? 'png' : 'jpeg',
          sizeBytes: file.size,
        };
        const updated = [...extractedImagesRef.current, newImg];
        extractedImagesRef.current = updated;
        setExtractedImages(updated);
        const num = nextIdx.toString();
        const updatedMap = {
          ...imageMapRef.current,
          [`image_${num}`]: dataUrl,
          [num]: dataUrl,
          [`hinh_${num}`]: dataUrl,
          [`hình_${num}`]: dataUrl,
          [`hinh${num}`]: dataUrl,
          [`hình${num}`]: dataUrl,
          [`hinh ${num}`]: dataUrl,
          [`hình ${num}`]: dataUrl,
        };
        imageMapRef.current = updatedMap;
        setImageMap(updatedMap);
        if (manualImageInputRef.current) manualImageInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (indexToRemove: number) => {
    const updated = extractedImagesRef.current
      .filter((_, idx) => idx !== indexToRemove)
      .map((img, idx) => ({
        ...img,
        id: `image_${idx + 1}`,
        label: `Hình ${idx + 1}`,
      }));
    const map: Record<string, string> = {};
    updated.forEach((img, idx) => {
      const num = (idx + 1).toString();
      map[`image_${num}`] = img.dataUrl;
      map[num] = img.dataUrl;
      map[`hinh_${num}`] = img.dataUrl;
      map[`hình_${num}`] = img.dataUrl;
      map[`hinh${num}`] = img.dataUrl;
      map[`hình${num}`] = img.dataUrl;
      map[`hinh ${num}`] = img.dataUrl;
      map[`hình ${num}`] = img.dataUrl;
      if (img.id) {
        map[img.id] = img.dataUrl;
      }
    });
    extractedImagesRef.current = updated;
    imageMapRef.current = map;
    setExtractedImages(updated);
    setImageMap(map);
  };

  const handleInsertImageTag = (id: string, label: string) => {
    const tag = `\n\n![${label}](${id})\n\n`;
    setResultText((prev) => (prev ? prev.trimEnd() + tag : tag.trimStart()));
    setCopiedImageId(id);
    setTimeout(() => setCopiedImageId(null), 2000);
  };

  const handleOpenCrop = (targetId?: string, pageNumber: number = 1) => {
    if (pageCanvasesRef.current.length === 0) {
      if (files.length > 0) {
        preparePageCanvasesAndImages(files).then(() => {
          setCropTargetId(targetId || `image_${(extractedImagesRef.current.length || 0) + 1}`);
          setCropPage(pageNumber);
          setIsCropModalOpen(true);
        });
        return;
      }
      setError('Vui lòng chọn file PDF hoặc Ảnh trước khi mở công cụ cắt ảnh.');
      return;
    }
    setCropTargetId(targetId || `image_${(extractedImagesRef.current.length || 0) + 1}`);
    setCropPage(pageNumber);
    setIsCropModalOpen(true);
  };

  const handleSaveCrop = (
    dataUrl: string,
    targetId: string,
    label: string,
    pageNumber: number
  ) => {
    const numMatch = targetId.match(/\d+/);
    const num = numMatch ? numMatch[0] : (extractedImagesRef.current.length + 1).toString();
    const cleanId = targetId.startsWith('image_') ? targetId : `image_${num}`;

    // 1. Update or append to extractedImages
    const existingIdx = extractedImagesRef.current.findIndex(
      (img) => img.id.toLowerCase() === cleanId.toLowerCase() || img.id.toLowerCase() === targetId.toLowerCase()
    );

    const newImgItem: ExtractedPdfImage = {
      id: cleanId,
      label: label || `Hình ${num}`,
      pageNumber,
      dataUrl,
      width: 400,
      height: 300,
      format: 'png',
      sizeBytes: Math.round((dataUrl.length * 3) / 4),
    };

    let updatedList: ExtractedPdfImage[] = [];
    if (existingIdx >= 0) {
      updatedList = [...extractedImagesRef.current];
      updatedList[existingIdx] = newImgItem;
    } else {
      updatedList = [...extractedImagesRef.current, newImgItem];
    }

    extractedImagesRef.current = updatedList;
    setExtractedImages(updatedList);

    // 2. Update imageMapRef and state with all aliases
    const updatedMap = {
      ...imageMapRef.current,
      [cleanId]: dataUrl,
      [targetId]: dataUrl,
      [num]: dataUrl,
      [`hinh_${num}`]: dataUrl,
      [`hình_${num}`]: dataUrl,
      [`hinh${num}`]: dataUrl,
      [`hình${num}`]: dataUrl,
      [`hinh ${num}`]: dataUrl,
      [`hình ${num}`]: dataUrl,
      [label]: dataUrl,
    };
    imageMapRef.current = updatedMap;
    setImageMap(updatedMap);

    // 3. If targetId was NOT in the text, optionally append it
    const tag = `![${label || `Hình ${num}`}](${cleanId})`;
    if (resultText && !resultText.includes(cleanId) && !resultText.includes(targetId)) {
      setResultText((prev) => (prev ? prev.trimEnd() + `\n\n${tag}\n\n` : tag));
    }

    setSuccess(`Đã lưu thành công ảnh "${label}" (${cleanId}) và sẵn sàng nhúng vào Word!`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/jpg'];

      const filteredFiles = selectedFiles.filter(f => {
        const ext = f.name.toLowerCase();
        return validTypes.includes(f.type) || ext.endsWith('.docx') || ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
      });

      if (filteredFiles.length === 0) {
        setError('Vui lòng chọn file PDF, Word (.docx) hoặc Ảnh (PNG/JPG).');
        return;
      }
      setFiles(filteredFiles);
      setError('');
      setSuccess('');
      setResultText('');
      preparePageCanvasesAndImages(filteredFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFiles = Array.from(e.dataTransfer.files);
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/jpg'];

      const filteredFiles = selectedFiles.filter(f => {
        const ext = f.name.toLowerCase();
        return validTypes.includes(f.type) || ext.endsWith('.docx') || ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
      });

      if (filteredFiles.length === 0) {
        setError('Vui lòng chọn file PDF, Word (.docx) hoặc Ảnh (PNG/JPG).');
        return;
      }
      setFiles(filteredFiles);
      setError('');
      setSuccess('');
      setResultText('');
      preparePageCanvasesAndImages(filteredFiles);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    setError('');
    setSuccess('');
    setParsingMode('normal');
    setResultText('');
    setExtractedImages([]);
    setImageMap({});
    setCopiedImageId(null);
    pageCanvasesRef.current = [];
    extractedImagesRef.current = [];
    imageMapRef.current = {};
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateDocx = async (markdownText: string, originalFilename: string) => {
    setStatus('Đang biên dịch công thức sang Microsoft Equation...');
    setProgress(90);

    try {
      let baseName = originalFilename.replace(/\.(pdf|docx|png|jpg|jpeg)$/i, '');
      if (files.length > 1) baseName = 'Tai_lieu_gop';
      const filename = `${baseName}_converted.docx`;

      let finalMap = { ...imageMapRef.current, ...imageMap };

      // Self-healing: if finalMap has no images but files exist, re-extract immediately!
      if (Object.keys(finalMap).length === 0 && files.length > 0) {
        const prep = await preparePageCanvasesAndImages(files);
        if (prep) {
          finalMap = prep.imageMap;
        }
      }

      await downloadDocxFile(markdownText, filename, undefined, finalMap, wordFormatting);

      const imgCount = extractedImagesRef.current.length || extractedImages.length;
      setSuccess(
        `Lưu file Word thành công! Toàn bộ công thức (Equation) ${
          imgCount > 0 ? `và ${imgCount} hình ảnh` : ''
        } đã được tự động nhúng vào file Word.`
      );
      setProgress(100);
    } catch (err: any) {
      console.error('Error generating docx:', err);
      setError('Lỗi khi tạo file Word: ' + err.message);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    if (!apiKey) {
      setError('Vui lòng cấu hình API Key ở góc trên cùng bên phải trước khi sử dụng.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setResultText('');
    setProgress(10);

    let currentCanvases = pageCanvasesRef.current;
    let currentEmbedded = extractedImagesRef.current;
    let currentMap = imageMapRef.current;

    // Ensure page canvases and images are prepared if not already done
    if (currentCanvases.length === 0 || currentEmbedded.length === 0) {
      setStatus('Đang chuẩn bị dữ liệu trang và hình ảnh...');
      const prep = await preparePageCanvasesAndImages(files);
      if (prep) {
        currentCanvases = prep.canvases;
        currentEmbedded = prep.embedded;
        currentMap = prep.imageMap;
      }
    }

    try {
      let extractedText = '';

      // Check if all files are DOCX (currently we only support processing one docx at a time for simplicity, but let's handle if it is a docx)
      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.docx')) {
        const file = files[0];
        setStatus('Đang giải nén file Word...');
        const zip = await JSZip.loadAsync(file);
        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) throw new Error('File Word không hợp lệ hoặc bị hỏng.');

        const xmlString = await docXmlFile.async('string');

        setProgress(20);
        setStatus('Đang chuyển đổi công thức nội tại (OMML -> MathML)...');

        const xsltResponse = await fetch('/OMML2MML.XSL');
        if (!xsltResponse.ok) throw new Error('Không tìm thấy tệp cấu hình XSLT.');
        const xsltText = await xsltResponse.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        const xsltDoc = parser.parseFromString(xsltText, "application/xml");

        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        const resultDoc = xsltProcessor.transformToDocument(xmlDoc);

        const serializeNode = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (el.tagName.includes('mml:math') || el.tagName === 'math') {
              return new XMLSerializer().serializeToString(el) + " ";
            }
            let childText = '';
            for (let i = 0; i < el.childNodes.length; i++) childText += serializeNode(el.childNodes[i]);
            if (el.tagName === 'w:p') return childText + '\n\n';
            return childText;
          }
          return '';
        };

        const parsedText = serializeNode(resultDoc.documentElement);

        setProgress(40);
        setStatus('Đang gửi dữ liệu đến AI để chuẩn hoá sang LaTeX...');

        const res = await fetch('/api/convert-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textContent: parsedText,
            parsingMode: parsingMode,
            model: model || 'gemini-2.5-flash',
            apiKey: apiKey
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Lỗi từ máy chủ API.');
        }

        const data = await res.json();
        extractedText = data.text;

      } else {
        // PDF or Images (Multiple support)
        setStatus('Đang đọc dữ liệu file...');

        const base64Files = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name.toLowerCase().endsWith('.docx')) {
            throw new Error('Chế độ xử lý hàng loạt hiện tại chỉ hỗ trợ Ảnh và PDF, không hỗ trợ trộn file Word chung với Ảnh.');
          }

          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => {
              const result = reader.result?.toString().split(',')[1];
              if (result) resolve(result);
              else reject(new Error('Không thể đọc dữ liệu file.'));
            };
            reader.onerror = () => reject(new Error('Lỗi khi đọc file trên trình duyệt.'));
          });

          base64Files.push({
            base64: base64Data,
            mimeType: f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
          });
        }

        setProgress(30);
        setStatus('Đang gửi dữ liệu đến AI (có thể mất vài phút)...');

        const res = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: base64Files,
            parsingMode: parsingMode,
            model: model || 'gemini-1.5-pro',
            apiKey: apiKey
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Lỗi từ máy chủ API.');
        }

        const data = await res.json();
        extractedText = data.text;
      }

      setProgress(80);
      setStatus('Đang tự động bóc tách và dán hình ảnh vào từng câu hỏi...');
      const { processedText, imageMap: newMap, extractedImages: finalImages } =
        processExtractedImagesFromText(extractedText, currentCanvases, currentEmbedded);

      const mergedMap = { ...currentMap, ...imageMapRef.current, ...newMap };
      imageMapRef.current = mergedMap;
      extractedImagesRef.current = finalImages;

      setResultText(processedText);
      setImageMap(mergedMap);
      setExtractedImages(finalImages);
      setStatus('Hoàn thành trích xuất! Chữ, công thức và hình ảnh đã được dán ngay dưới từng câu hỏi.');
      setSuccess('Đã trích xuất xong nội dung. Toàn bộ hình ảnh/đồ thị đã được tự động dán ngay bên dưới các câu hỏi tương ứng và sẵn sàng xuất ra file Word.');
      setProgress(100);

    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'Có lỗi xảy ra trong quá trình chuyển đổi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueConvert = async () => {
    if (files.length === 0 || !resultText) return;
    if (!apiKey) {
      setError('Vui lòng cấu hình API Key ở góc trên cùng bên phải trước khi sử dụng.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setStatus('Đang gửi phần đang viết dở cho AI để sinh tiếp...');
    setProgress(30);

    try {
      const base64Files = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.name.toLowerCase().endsWith('.docx')) {
           // Fallback for docx continue is not fully supported in this simple mode, but we pass empty files or skip it
           continue;
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => {
            const result = reader.result?.toString().split(',')[1];
            if (result) resolve(result);
            else reject(new Error('Không thể đọc dữ liệu file.'));
          };
          reader.onerror = () => reject(new Error('Lỗi khi đọc file trên trình duyệt.'));
        });

        base64Files.push({
          base64: base64Data,
          mimeType: f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        });
      }

      // If it's docx, we just call word api
      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.docx')) {
         // Re-extract text...
         const file = files[0];
         const zip = await JSZip.loadAsync(file);
         const docXmlFile = zip.file('word/document.xml');
         if (!docXmlFile) throw new Error('File Word không hợp lệ.');
         const xmlString = await docXmlFile.async('string');
         const parser = new DOMParser();
         const xsltResponse = await fetch('/OMML2MML.XSL');
         const xsltText = await xsltResponse.text();
         const xmlDoc = parser.parseFromString(xmlString, "application/xml");
         const xsltDoc = parser.parseFromString(xsltText, "application/xml");
         const xsltProcessor = new XSLTProcessor();
         xsltProcessor.importStylesheet(xsltDoc);
         const resultDoc = xsltProcessor.transformToDocument(xmlDoc);
         const serializeNode = (node: Node): string => {
           if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
           if (node.nodeType === Node.ELEMENT_NODE) {
             const el = node as Element;
             if (el.tagName.includes('mml:math') || el.tagName === 'math') {
               return new XMLSerializer().serializeToString(el) + " ";
             }
             let childText = '';
             for (let i = 0; i < el.childNodes.length; i++) childText += serializeNode(el.childNodes[i]);
             if (el.tagName === 'w:p') return childText + '\n\n';
             return childText;
           }
           return '';
         };
         const parsedText = serializeNode(resultDoc.documentElement);

         const res = await fetch('/api/convert-word', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ textContent: parsedText, parsingMode, model: model || 'gemini-2.5-flash', apiKey, continueFromText: resultText })
         });
         if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'Lỗi từ máy chủ API.');
         }
         const data = await res.json();
          const { processedText: continuedText, imageMap: continuedMap, extractedImages: continuedImages } =
            processExtractedImagesFromText(data.text, pageCanvasesRef.current, extractedImagesRef.current);
          const mergedContinuedMap = { ...imageMapRef.current, ...continuedMap };
          imageMapRef.current = mergedContinuedMap;
          extractedImagesRef.current = continuedImages;
          setResultText(prev => prev + '\n' + continuedText);
          setImageMap(mergedContinuedMap);
          setExtractedImages(continuedImages);
      } else {
         const res = await fetch('/api/convert-pdf', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ files: base64Files, parsingMode, model: model || 'gemini-2.5-flash', apiKey, continueFromText: resultText })
         });
         if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'Lỗi từ máy chủ API.');
         }
         const data = await res.json();
          const { processedText: continuedText, imageMap: continuedMap, extractedImages: continuedImages } =
            processExtractedImagesFromText(data.text, pageCanvasesRef.current, extractedImagesRef.current);
          const mergedContinuedMap = { ...imageMapRef.current, ...continuedMap };
          imageMapRef.current = mergedContinuedMap;
          extractedImagesRef.current = continuedImages;
          setResultText(prev => prev + '\n' + continuedText);
          setImageMap(mergedContinuedMap);
          setExtractedImages(continuedImages);
      }

      setProgress(100);
      setSuccess('Đã tạo tiếp phần nội dung bị thiếu!');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi sinh tiếp nội dung.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadWord = () => {
    if (!resultText) return;
    const filename = files.length > 0 ? files[0].name : 'Tai_lieu_chuyen_doi';
    generateDocx(resultText, filename);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <FileText size={20} />
          </div>
          Chuyển đổi nâng cao (PDF/Word/Ảnh) sang LaTeX
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl mx-auto">
          Hỗ trợ bóc tách đề thi, chuyển đổi ảnh chụp hàng loạt và giữ nguyên 100% công thức Toán học dưới dạng mã LaTeX, giúp dễ dàng chỉnh sửa trên MS Word.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
        <div className="h-full">
          <div
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all h-full flex flex-col justify-center items-center ${
              files.length > 0 ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="application/pdf,.docx,image/png,image/jpeg,image/jpg"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center cursor-pointer w-full h-full" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 text-teal-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Kéo thả các file PDF, Word hoặc Ảnh vào đây</h3>
                <p className="text-slate-400 text-sm mt-1">Hỗ trợ tải lên nhiều file ảnh cùng lúc</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {files.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm shadow-sm">
                      <FileText size={14} className="text-teal-600" />
                      <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300 font-medium">{f.name}</span>
                    </div>
                  ))}
                  {files.length > 3 && (
                    <div className="flex items-center justify-center px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium shadow-sm">
                      +{files.length - 3} file khác
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Đã chọn {files.length} file</h3>

                <button
                  onClick={handleReset}
                  className="mt-4 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  disabled={isProcessing}
                >
                  Huỷ bỏ / Chọn file khác
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 h-full flex flex-col justify-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Settings size={18} className="text-teal-600" />
              Cấu hình xử lý
            </h3>

            <div className="space-y-4">
              <label className={`block relative p-4 border rounded-2xl cursor-pointer transition-all ${parsingMode === 'normal' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="parsingMode"
                    value="normal"
                    checked={parsingMode === 'normal'}
                    onChange={() => setParsingMode('normal')}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Chuyển đổi thông thường</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Giữ nguyên định dạng gốc của tài liệu, giáo án.</div>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2.5 mt-6">
              <button
                onClick={resultText ? handleContinueConvert : handleConvert}
                disabled={files.length === 0 || isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 ${
                  files.length === 0 || isProcessing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500 shadow-none'
                    : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : resultText ? (
                  'Tiếp Tục Trích Xuất'
                ) : (
                  'Bắt Đầu Trích Xuất'
                )}
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
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      {success && !resultText && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-start gap-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div className="font-medium">{success}</div>
        </div>
      )}

      {isProcessing && (
        <div className="mt-6 space-y-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm font-semibold text-teal-700 dark:text-teal-400">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {status}
            </div>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* KHU VỰC THÔNG BÁO VÀ QUẢN LÝ HÌNH ẢNH TRÍCH XUẤT */}
      {isExtractingImages && (
        <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center gap-3 text-teal-700 dark:text-teal-300 text-sm">
          <Loader2 size={18} className="animate-spin shrink-0" />
          <span>Đang tự động bóc tách các hình ảnh, sơ đồ từ tài liệu...</span>
        </div>
      )}

      {(extractedImages.length > 0 || (files.length > 0 && !isProcessing)) && (
        <div className="mt-6 p-5 bg-gradient-to-r from-teal-50/70 via-blue-50/40 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-teal-950/30 rounded-3xl border border-teal-200/80 dark:border-teal-800/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ImageIcon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  Hình ảnh bóc tách từ tài liệu ({extractedImages.length} ảnh)
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                    Tự động nhúng vào file Word khi tải về
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Các thẻ <code className="bg-white/80 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-teal-700 dark:text-teal-300">![Hình X](image_X)</code> sẽ tự động gắn với ảnh tương ứng khi xuất ra file .docx.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenCrop()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                title="Kéo chuột trực tiếp trên trang PDF để cắt đồ thị, hình học, bảng biến thiên"
              >
                <Crop size={15} />
                Cắt ảnh từ PDF / Tài liệu
              </button>

              <input
                type="file"
                accept="image/*"
                ref={manualImageInputRef}
                className="hidden"
                onChange={handleAddManualImage}
              />
              <button
                type="button"
                onClick={() => manualImageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-700 shadow-xs transition cursor-pointer"
              >
                <ImagePlus size={15} />
                Thêm ảnh thủ công
              </button>
            </div>
          </div>

          {extractedImages.length === 0 ? (
            <div className="p-4 bg-white/70 dark:bg-slate-800/60 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tài liệu đã được tải lên ({pageCanvasesRef.current.length || files.length} trang). Nếu đề thi có đồ thị, bảng biến thiên hoặc hình học, bạn hãy bấm <strong className="text-teal-600 dark:text-teal-400">"Cắt ảnh từ PDF / Tài liệu"</strong> để khoanh vùng và dán ngay vào đề thi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {extractedImages.map((img, idx) => {
                const isCopied = copiedImageId === img.id;
                return (
                  <div
                    key={img.id}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="relative w-full h-28 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-slate-100 dark:border-slate-700/50">
                      <img
                        src={img.dataUrl}
                        alt={img.label}
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded text-[10px] font-bold">
                        #{idx + 1}
                      </div>

                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => handleOpenCrop(img.id, img.pageNumber)}
                          className="p-1 bg-teal-600/90 hover:bg-teal-700 text-white rounded-md shadow-xs cursor-pointer"
                          title="Cắt lại ảnh này từ tài liệu"
                        >
                          <Crop size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-md shadow-xs cursor-pointer"
                          title="Xóa ảnh này khỏi danh sách nhúng"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {img.id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {img.width}x{img.height} px
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInsertImageTag(img.id, img.label)}
                        className={`mt-1.5 w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white'
                        }`}
                        title={`Chèn ![${img.label}](${img.id}) vào văn bản`}
                      >
                      {isCopied ? (
                        <>
                          <Check size={12} /> Đã chèn!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Chèn vào bài
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* LIVE PREVIEW EDITOR - SIDE BY SIDE */}
      {resultText && (
        <div className="mt-8 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Edit3 size={18} className="text-teal-600" />
              Chế độ đối chiếu (Side-by-Side Editor)
            </h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-lg">
              Sẵn sàng xuất file
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
            {/* Cột trái: Hiển thị ảnh/PDF gốc */}
            <div className="bg-slate-100 dark:bg-slate-900/50 h-[600px] overflow-y-auto p-4 flex flex-col items-center gap-4 relative">
              {files.map((file, idx) => {
                const url = URL.createObjectURL(file);
                if (file.type.startsWith('image/')) {
                  return <img key={idx} src={url} alt={`Trang ${idx + 1}`} className="w-full max-w-lg h-auto border border-slate-300 dark:border-slate-600 shadow-sm rounded-lg" />;
                } else if (file.type === 'application/pdf') {
                  return <iframe key={idx} src={`${url}#toolbar=0`} className="w-full h-[800px] border border-slate-300 dark:border-slate-600 shadow-sm rounded-lg bg-white" title={`PDF ${idx + 1}`} />;
                } else {
                  return <div key={idx} className="p-4 bg-white dark:bg-slate-800 text-slate-500 text-sm rounded-lg w-full text-center">Tệp gốc định dạng Word - Hãy sửa nội dung bên phải.</div>;
                }
              })}
            </div>

            {/* Cột phải: Khung soạn thảo */}
            <div className="p-0 bg-white dark:bg-slate-800 flex flex-col">
              <EditorToolbar text={resultText} setText={setResultText} onContinue={handleContinueConvert} isProcessing={isProcessing} />
              <MarkdownEditor text={resultText} setText={setResultText} imageMap={imageMap} onOpenCrop={handleOpenCrop} />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn có thể nhìn đề bài gốc ở cột bên trái để dò lỗi và sửa nội dung kết quả ở cột bên phải.
            </p>
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title="Xóa làm lại - Bắt đầu lại từ đầu"
              >
                <RotateCcw size={14} />
                <span>Xóa làm lại</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCrop()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:hover:bg-teal-900/60 dark:text-teal-300 font-bold text-xs rounded-xl border border-teal-200 dark:border-teal-700 transition cursor-pointer shadow-xs"
                title="Mở công cụ cắt đồ thị/hình ảnh từ tài liệu"
              >
                <Crop size={15} />
                <span>Cắt ảnh từ PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWordSettings(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-600 transition cursor-pointer shadow-xs hover:border-teal-500"
                title="Tùy chỉnh phông chữ, cỡ chữ, căn lề và bố cục đáp án file Word"
              >
                <Settings size={15} className="text-teal-600 dark:text-teal-400" />
                <span>Định dạng Word</span>
              </button>

              <button
                onClick={handleDownloadWord}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5 cursor-pointer"
              >
                <Download size={18} />
                Lưu thành file Word (.docx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TÙY CHỈNH ĐỊNH DẠNG WORD */}
      {showWordSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    Tùy chỉnh định dạng file Word (.docx)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cấu hình font chữ, căn lề và cách sắp xếp đáp án theo nhu cầu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWordSettings(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Phông chữ */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                  Phông chữ (Font)
                </label>
                <select
                  value={wordFormatting.fontFamily || 'Times New Roman'}
                  onChange={e => updateWordFormatting({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="Times New Roman">Times New Roman (Chuẩn đề thi & văn bản chính thức)</option>
                  <option value="Arial">Arial (Không chân, hiện đại)</option>
                  <option value="Calibri">Calibri (Mặc định MS Office)</option>
                  <option value="Segoe UI">Segoe UI</option>
                </select>
              </div>

              {/* Cỡ chữ & Giãn dòng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                    Cỡ chữ chính (Font size)
                  </label>
                  <select
                    value={wordFormatting.fontSizePt || 13}
                    onChange={e => updateWordFormatting({ fontSizePt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value={12}>12 pt (Nhỏ gọn, tiết kiệm trang in)</option>
                    <option value={13}>13 pt (Chuẩn đề thi THPT & văn bản VN)</option>
                    <option value={14}>14 pt (Chữ to, rõ nét)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                    Khoảng cách dòng (Line Spacing)
                  </label>
                  <select
                    value={wordFormatting.lineSpacingMultiplier || 1.15}
                    onChange={e => updateWordFormatting({ lineSpacingMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value={1.0}>1.0x (Đơn - Single, gọn gàng nhất)</option>
                    <option value={1.15}>1.15x (Chuẩn quy chuẩn Việt Nam)</option>
                    <option value={1.25}>1.25x (Thoáng hơn)</option>
                    <option value={1.5}>1.5x (Thoáng rộng 1.5 dòng)</option>
                  </select>
                </div>
              </div>

              {/* Căn lề trang */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                  Căn lề trang in (Margins)
                </label>
                <select
                  value={wordFormatting.marginPreset || 'exam'}
                  onChange={e => updateWordFormatting({ marginPreset: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="exam">Chuẩn đề thi (Trên 2.0cm, Dưới 2.0cm, Trái 2.5cm, Phải 2.0cm)</option>
                  <option value="nd30">Nghị định 30/2020 (Trên 2.0cm, Dưới 2.0cm, Trái 3.0cm, Phải 1.5cm)</option>
                  <option value="compact">Tiết kiệm giấy (Lề 1.5cm toàn bộ 4 phía)</option>
                  <option value="standard">Chuẩn MS Word (Mỗi cạnh 2.54cm / 1 inch)</option>
                </select>
              </div>

              {/* Bố cục 4 đáp án A, B, C, D */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                  Bố cục 4 đáp án trắc nghiệm (A, B, C, D)
                </label>
                <select
                  value={wordFormatting.choiceLayout || 'auto'}
                  onChange={e => updateWordFormatting({ choiceLayout: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="auto">Tự động thông minh (Ngắn trên 1 dòng 4 cột, vừa 2 cột, dài 4 dòng)</option>
                  <option value="two_columns">Luôn chia 2 cột đều nhau (A, B hàng 1 | C, D hàng 2)</option>
                  <option value="one_column">Mỗi đáp án 1 dòng riêng biệt (Thẳng đứng)</option>
                  <option value="keep">Giữ nguyên như văn bản gốc</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  updateWordFormatting({
                    fontFamily: 'Times New Roman',
                    fontSizePt: 13,
                    lineSpacingMultiplier: 1.15,
                    marginPreset: 'exam',
                    choiceLayout: 'auto',
                  });
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={() => setShowWordSettings(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẮT ẢNH TRỰC TIẾP TỪ TÀI LIỆU (VISUAL SNIP TOOL) */}
      <VisualCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        pageCanvases={pageCanvasesRef.current}
        initialTargetId={cropTargetId}
        initialPage={cropPage}
        existingImages={extractedImages}
        onSaveCrop={handleSaveCrop}
      />
    </div>
  );
}
