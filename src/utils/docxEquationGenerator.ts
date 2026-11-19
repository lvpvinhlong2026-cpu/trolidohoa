import katex from 'katex';
import { mml2omml } from 'mathml2omml';
import { xml2js } from 'xml-js';
import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImportedXmlComponent,
  ImageRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { dataUrlToUint8Array } from './pdfImageExtractor';

/**
 * Convert an xml-js element into an ImportedXmlComponent hierarchy
 */
function convertElementToXmlComponent(element: any): ImportedXmlComponent | string | undefined {
  switch (element.type) {
    case 'element': {
      const comp = new ImportedXmlComponent(element.name, element.attributes);
      for (const child of element.elements || []) {
        const c = convertElementToXmlComponent(child);
        if (c !== undefined) {
          comp.push(c as any);
        }
      }
      return comp;
    }
    case 'text':
      return element.text;
    default:
      return undefined;
  }
}

/**
 * Safely parse OMML XML into an ImportedXmlComponent tree without docx's root <undefined> bug
 */
export function parseOmmlToComponent(ommlString: string): ImportedXmlComponent | null {
  try {
    const parsed = xml2js(ommlString, { compact: false }) as any;
    if (!parsed || !parsed.elements || parsed.elements.length === 0) return null;
    const rootElement = parsed.elements[0];
    const comp = convertElementToXmlComponent(rootElement);
    return comp instanceof ImportedXmlComponent ? comp : null;
  } catch (err) {
    console.warn('Failed to parse OMML to component:', err);
    return null;
  }
}

export interface DocxFormattingOptions {
  fontFamily?: string; // Default: 'Times New Roman'
  fontSizePt?: number; // Default: 13 pt
  lineSpacingMultiplier?: number; // Default: 1.15
  marginPreset?: 'exam' | 'nd30' | 'compact' | 'standard'; // Default: 'exam'
  choiceLayout?: 'auto' | 'two_columns' | 'one_column' | 'keep'; // Default: 'auto'
  customMargins?: {
    topMm?: number;
    bottomMm?: number;
    leftMm?: number;
    rightMm?: number;
  };
}

const DEFAULT_FONT = 'Times New Roman';
const DEFAULT_FONT_SIZE_PT = 13;

const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const noBorders = {
  top: noneBorder,
  bottom: noneBorder,
  left: noneBorder,
  right: noneBorder,
  insideHorizontal: noneBorder,
  insideVertical: noneBorder,
};
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const tableBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
  insideHorizontal: thinBorder,
  insideVertical: thinBorder,
};

/**
 * Clean & normalize LaTeX string before KaTeX rendering
 */
export function cleanLatex(latex: string): string {
  let s = latex.trim();
  // Strip outer delimiters if present
  if (s.startsWith('$$') && s.endsWith('$$')) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('$') && s.endsWith('$') && s.length >= 2) {
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('\\[') && s.endsWith('\\]')) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('\\(') && s.endsWith('\\)')) {
    s = s.slice(2, -2).trim();
  }
  return s;
}

/**
 * Convert a LaTeX formula into OMML XML (<m:oMath> or <m:oMathPara>)
 */
export function latexToOmml(rawLatex: string, isBlock: boolean = false): string | null {
  try {
    const expr = cleanLatex(rawLatex);
    if (!expr) return null;

    // Render LaTeX to MathML using KaTeX
    let html = katex.renderToString(expr, {
      displayMode: isBlock,
      output: 'mathml',
      throwOnError: false,
    });

    // Strip annotation tags that KaTeX adds
    html = html.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/gi, '');

    const match = html.match(/<math[^>]*>[\s\S]*?<\/math>/i);
    if (!match) return null;

    // Convert MathML to OMML string
    let omml = mml2omml(match[0]);

    // Ensure standard OMML namespaces are declared
    if (!omml.includes('xmlns:m=')) {
      omml = omml.replace(
        '<m:oMath',
        '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
      );
    }

    if (isBlock && !omml.startsWith('<m:oMathPara')) {
      omml = `<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${omml}</m:oMathPara>`;
    }

    return omml;
  } catch (err) {
    console.warn('Failed to convert latex to OMML:', rawLatex, err);
    return null;
  }
}

/**
 * Parse inline text formatting (bold **, italic *, text)
 */
function parseInlineFormatting(
  text: string,
  baseOpts: { font: string; size: number; bold?: boolean; italics?: boolean }
): TextRun[] {
  const runs: TextRun[] = [];
  // Tokenize by bold **text** or italic *text*
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.substring(lastIndex, match.index);
      if (plain) {
        runs.push(new TextRun({ text: plain, ...baseOpts }));
      }
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          ...baseOpts,
          bold: true,
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          ...baseOpts,
          italics: true,
        })
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    const plain = text.substring(lastIndex);
    if (plain) {
      runs.push(new TextRun({ text: plain, ...baseOpts }));
    }
  }

  return runs;
}

/**
 * Parse a line of text, splitting into normal text runs and inline math OMML components
 */
export function parseLineWithFormulas(
  line: string,
  options: {
    font?: string;
    size?: number;
    bold?: boolean;
    italics?: boolean;
  } = {}
): (TextRun | ImportedXmlComponent)[] {
  const font = options.font || DEFAULT_FONT;
  const size = options.size || DEFAULT_FONT_SIZE_PT * 2;
  const baseOpts = { font, size, bold: options.bold, italics: options.italics };

  const components: (TextRun | ImportedXmlComponent)[] = [];

  // Match inline math: $...$ or \(...\)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      const textPart = line.substring(lastIndex, match.index);
      if (textPart) {
        components.push(...parseInlineFormatting(textPart, baseOpts));
      }
    }

    const formulaWithDelim = match[0];
    const isBlock = formulaWithDelim.startsWith('$$') || formulaWithDelim.startsWith('\\[');
    const omml = latexToOmml(formulaWithDelim, isBlock);

    if (omml) {
      try {
        const xmlComp = parseOmmlToComponent(omml);
        if (xmlComp) {
          components.push(xmlComp);
        } else {
          components.push(new TextRun({ text: formulaWithDelim, ...baseOpts }));
        }
      } catch (xmlErr) {
        console.warn('Failed to parse OMML XML, falling back to text:', xmlErr);
        components.push(new TextRun({ text: formulaWithDelim, ...baseOpts }));
      }
    } else {
      // Fallback to text if conversion failed
      components.push(new TextRun({ text: formulaWithDelim, ...baseOpts }));
    }

    lastIndex = match.index + formulaWithDelim.length;
  }

  if (lastIndex < line.length) {
    const textPart = line.substring(lastIndex);
    if (textPart) {
      components.push(...parseInlineFormatting(textPart, baseOpts));
    }
  }

  return components;
}

/**
 * Count total number of LaTeX formulas in a text
 */
export function countFormulas(text: string): number {
  if (!text) return 0;
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  const matches = text.match(mathRegex);
  return matches ? matches.length : 0;
}

/**
 * Inspect image bytes and dataUrl to extract valid format and scaled dimensions.
 * Crucial: docx ImageRun requires exact type ('png' | 'jpg' | 'gif' | 'bmp') to avoid corrupt files (.undefined).
 */
export function getImageInfoFromBytes(
  dataUrl: string,
  bytes: Uint8Array
): {
  type: 'png' | 'jpg' | 'gif' | 'bmp';
  width: number;
  height: number;
} {
  let type: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
  let naturalW = 340;
  let naturalH = 220;

  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    type = 'jpg';
  } else if (dataUrl.startsWith('data:image/gif')) {
    type = 'gif';
  } else if (dataUrl.startsWith('data:image/bmp')) {
    type = 'bmp';
  } else if (bytes.length >= 4) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      type = 'jpg';
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      type = 'png';
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      type = 'gif';
    } else if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      type = 'bmp';
    }
  }

  // Parse natural dimensions from PNG bytes
  if (type === 'png' && bytes.length >= 24) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const w = view.getUint32(16, false);
      const h = view.getUint32(20, false);
      if (w > 0 && h > 0) {
        naturalW = w;
        naturalH = h;
      }
    }
  }

  // Parse natural dimensions from JPEG bytes
  if (type === 'jpg' && bytes.length >= 4) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const h = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const w = (bytes[offset + 7] << 8) | bytes[offset + 8];
        if (w > 0 && h > 0) {
          naturalW = w;
          naturalH = h;
          break;
        }
      }
      const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (len <= 0) break;
      offset += 2 + len;
    }
  }

  // Scale nicely to fit standard Word page printable area
  const MAX_WIDTH = 380; // in points
  const MAX_HEIGHT = 280; // in points

  let targetW = naturalW;
  let targetH = naturalH;

  if (targetW > MAX_WIDTH) {
    const scale = MAX_WIDTH / targetW;
    targetW = MAX_WIDTH;
    targetH = Math.round(targetH * scale);
  }
  if (targetH > MAX_HEIGHT) {
    const scale = MAX_HEIGHT / targetH;
    targetH = MAX_HEIGHT;
    targetW = Math.round(targetW * scale);
  }

  if (targetW < 50) targetW = 50;
  if (targetH < 30) targetH = 30;

  return {
    type,
    width: Math.round(targetW),
    height: Math.round(targetH),
  };
}

/**
 * Extract image data from markdown or tag notation
 */
function resolveImageData(
  line: string,
  imageMap?: Record<string, string>
): { alt: string; dataUrl: string } | null {
  if (!imageMap || Object.keys(imageMap).length === 0) return null;
  const trimmed = line.trim();

  // Pattern 1: ![alt text](src)
  const mdMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
  if (mdMatch) {
    const alt = mdMatch[1].trim();
    const src = mdMatch[2].trim();
    let dataUrl = src;
    if (!src.startsWith('data:image/')) {
      const cleanKey = src
        .replace(/^(image_|hình_|hinh_|img_)/i, '')
        .replace(/\.(png|jpe?g|webp)$/i, '')
        .trim();
      const numKey = parseInt(cleanKey, 10).toString();

      dataUrl =
        imageMap[src] ||
        imageMap[src.toLowerCase()] ||
        imageMap[cleanKey] ||
        imageMap[numKey] ||
        imageMap[`image_${cleanKey}`] ||
        imageMap[`image_${numKey}`] ||
        imageMap[`hình_${cleanKey}`] ||
        imageMap[`hình_${numKey}`] ||
        imageMap[`hinh_${cleanKey}`] ||
        imageMap[`hinh_${numKey}`] ||
        imageMap[`hình ${cleanKey}`] ||
        imageMap[`hình ${numKey}`] ||
        imageMap[`hinh ${cleanKey}`] ||
        imageMap[`hinh ${numKey}`] ||
        imageMap[alt] ||
        imageMap[alt.toLowerCase()] ||
        '';
    }
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      return { alt: alt || 'Hình vẽ', dataUrl };
    }
  }

  // Pattern 2: [HÌNH 1] or [HÌNH_1] or [IMAGE_1]
  const tagMatch = trimmed.match(/\[(HÌNH|HINH|IMAGE|IMG)[_\s]+(\d+)\]/i);
  if (tagMatch) {
    const num = tagMatch[2];
    const numKey = parseInt(num, 10).toString();
    const dataUrl =
      imageMap[`image_${num}`] ||
      imageMap[`image_${numKey}`] ||
      imageMap[num] ||
      imageMap[numKey] ||
      imageMap[`hình_${num}`] ||
      imageMap[`hình_${numKey}`] ||
      imageMap[`hinh_${num}`] ||
      imageMap[`hinh_${numKey}`] ||
      imageMap[`hình ${num}`] ||
      imageMap[`hình ${numKey}`] ||
      imageMap[`hinh ${num}`] ||
      imageMap[`hinh ${numKey}`] ||
      '';
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      return { alt: `Hình ${num}`, dataUrl };
    }
  }

  return null;
}

interface ChoiceItem {
  key: string;
  text: string;
}

function parseChoiceLine(line: string): { key: string; text: string } | null {
  const m = line.trim().match(/^(?:\*\*)?([A-D])[\.\)](?:\*\*)?\s+(.*)$/i);
  if (!m) return null;
  return { key: m[1].toUpperCase(), text: m[2].trim() };
}

function parseTwoChoices(line: string, firstKey: string, secondKey: string): ChoiceItem[] | null {
  const reg = new RegExp(
    `^(?:\\*\\*)?${firstKey}[\\.\\)](?:\\*\\*)?\\s+(.*?)\\s+(?:\\*\\*)?${secondKey}[\\.\\)](?:\\*\\*)?\\s+(.*)$`,
    'i'
  );
  const m = line.trim().match(reg);
  if (!m) return null;
  return [
    { key: firstKey.toUpperCase(), text: m[1].trim() },
    { key: secondKey.toUpperCase(), text: m[2].trim() },
  ];
}

function parseSingleLineFourChoices(line: string): ChoiceItem[] | null {
  const trimmed = line.trim();
  const m = trimmed.match(
    /^(?:\*\*)?A[\.\)](?:\*\*)?\s+(.*?)\s+(?:\*\*)?B[\.\)](?:\*\*)?\s+(.*?)\s+(?:\*\*)?C[\.\)](?:\*\*)?\s+(.*?)\s+(?:\*\*)?D[\.\)](?:\*\*)?\s+(.*)$/i
  );
  if (!m) return null;
  return [
    { key: 'A', text: m[1].trim() },
    { key: 'B', text: m[2].trim() },
    { key: 'C', text: m[3].trim() },
    { key: 'D', text: m[4].trim() },
  ];
}

function createChoiceTableOrParagraphs(
  choices: ChoiceItem[],
  choiceLayout: 'auto' | 'two_columns' | 'one_column' | 'keep',
  baseFont: string,
  baseFontSize: number,
  lineSpacing: number
): (Paragraph | Table)[] {
  if (choiceLayout === 'keep') {
    return choices.map(
      c =>
        new Paragraph({
          children: [
            new TextRun({ text: `${c.key}. `, bold: true, font: baseFont, size: baseFontSize }),
            ...parseLineWithFormulas(c.text, { font: baseFont, size: baseFontSize }),
          ],
          indent: { left: 300 },
          spacing: { after: 60, line: lineSpacing },
        })
    );
  }

  // Calculate approximate visual length (ignoring latex markers)
  const maxLen = Math.max(...choices.map(c => c.text.replace(/\$[^$]*\$/g, 'XXXX').length));

  const shouldFourCols = choiceLayout === 'auto' ? maxLen <= 20 : false;
  const shouldTwoCols =
    choiceLayout === 'two_columns' || (choiceLayout === 'auto' && maxLen > 20 && maxLen <= 55);

  if (shouldFourCols) {
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: choices.map(
              c =>
                new TableCell({
                  borders: noBorders,
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  margins: { top: 30, bottom: 30, left: 40, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${c.key}. `, bold: true, font: baseFont, size: baseFontSize }),
                        ...parseLineWithFormulas(c.text, { font: baseFont, size: baseFontSize }),
                      ],
                      spacing: { line: lineSpacing },
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
      new Paragraph({ children: [], spacing: { after: 60 } }),
    ];
  }

  if (shouldTwoCols) {
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: [choices[0], choices[1]].map(
              c =>
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 30, bottom: 30, left: 40, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${c.key}. `, bold: true, font: baseFont, size: baseFontSize }),
                        ...parseLineWithFormulas(c.text, { font: baseFont, size: baseFontSize }),
                      ],
                      spacing: { line: lineSpacing },
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            children: [choices[2], choices[3]].map(
              c =>
                new TableCell({
                  borders: noBorders,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 30, bottom: 30, left: 40, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${c.key}. `, bold: true, font: baseFont, size: baseFontSize }),
                        ...parseLineWithFormulas(c.text, { font: baseFont, size: baseFontSize }),
                      ],
                      spacing: { line: lineSpacing },
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
      new Paragraph({ children: [], spacing: { after: 60 } }),
    ];
  }

  // 1 column (4 separate indented paragraphs)
  return choices.map(
    c =>
      new Paragraph({
        children: [
          new TextRun({ text: `${c.key}. `, bold: true, font: baseFont, size: baseFontSize }),
          ...parseLineWithFormulas(c.text, { font: baseFont, size: baseFontSize }),
        ],
        indent: { left: 300 },
        spacing: { after: 60, line: lineSpacing },
      })
  );
}

/**
 * Generate a docx Document from Markdown/LaTeX text with custom formatting
 */
export async function createDocxDocument(
  markdownText: string,
  documentTitle?: string,
  imageMap?: Record<string, string>,
  formattingOptions?: DocxFormattingOptions
): Promise<Document> {
  const baseFont = formattingOptions?.fontFamily || DEFAULT_FONT;
  const baseFontSizePt = formattingOptions?.fontSizePt || DEFAULT_FONT_SIZE_PT;
  const baseFontSize = baseFontSizePt * 2; // half-points
  const heading1Size = baseFontSize + 10;
  const heading2Size = baseFontSize + 6;
  const heading3Size = baseFontSize + 2;
  const captionFontSize = Math.max(18, baseFontSize - 4);
  const lineSpacingMultiplier = formattingOptions?.lineSpacingMultiplier || 1.15;
  const lineSpacing = Math.round(240 * lineSpacingMultiplier);
  const choiceLayout = formattingOptions?.choiceLayout || 'auto';

  const lines = markdownText.split(/\r?\n/);
  const docChildren: (Paragraph | Table)[] = [];

  // Optional Document Header / Title
  if (documentTitle && documentTitle.trim()) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: documentTitle.trim().toUpperCase(),
            bold: true,
            font: baseFont,
            size: heading1Size,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 260, line: lineSpacing },
      })
    );
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line -> small spacing
    if (!trimmed) {
      docChildren.push(
        new Paragraph({
          children: [],
          spacing: { after: 120 },
        })
      );
      i++;
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '—'.repeat(40),
              font: baseFont,
              size: baseFontSize,
              color: '888888',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 160 },
        })
      );
      i++;
      continue;
    }

    // Embedded Image Check: ![alt](url) or [HÌNH 1]
    const imgInfo = resolveImageData(trimmed, imageMap);
    if (imgInfo) {
      try {
        const bytes = dataUrlToUint8Array(imgInfo.dataUrl);
        if (bytes && bytes.length > 0) {
          const meta = getImageInfoFromBytes(imgInfo.dataUrl, bytes);
          const imgRun = new ImageRun({
            data: bytes,
            transformation: {
              width: meta.width,
              height: meta.height,
            },
            type: meta.type,
          });

          docChildren.push(
            new Paragraph({
              children: [imgRun],
              alignment: AlignmentType.CENTER,
              spacing: { before: 140, after: 60 },
            })
          );

          if (imgInfo.alt && imgInfo.alt.trim()) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: imgInfo.alt.trim(),
                    font: baseFont,
                    size: captionFontSize,
                    italics: true,
                    color: '555555',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 140 },
              })
            );
          }
          i++;
          continue;
        }
      } catch (imgErr) {
        console.warn('Failed to embed image into docx:', imgErr);
      }
    } else if (trimmed.match(/^!\[(.*?)\]\((.*?)\)$/) || trimmed.match(/^\[(HÌNH|HINH|IMAGE|IMG)[_\s]+\d+\]$/i)) {
      // Standalone image tag whose image data is not yet available in imageMap
      const mdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      const tagMatch = trimmed.match(/^\[((?:HÌNH|HINH|IMAGE|IMG)[_\s]+\d+)\]$/i);
      const captionText = mdMatch ? (mdMatch[1] || mdMatch[2]) : (tagMatch ? tagMatch[1] : trimmed);

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${captionText} - Ảnh đồ thị/hình vẽ]`,
              font: baseFont,
              size: captionFontSize,
              italics: true,
              color: '777777',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        })
      );
      i++;
      continue;
    }

    // Embedded Image Check (when mixed with surrounding text on same line)
    const inlineImgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
    if (!imgInfo && inlineImgMatch) {
      const idx = inlineImgMatch.index ?? -1;
      const beforeText = trimmed.substring(0, idx).trim();
      const imgTag = inlineImgMatch[0];
      const afterText = trimmed.substring(idx + imgTag.length).trim();
      const resolved = resolveImageData(imgTag, imageMap);

      if (resolved) {
        if (beforeText) {
          const runs = parseLineWithFormulas(beforeText, { font: baseFont, size: baseFontSize });
          docChildren.push(new Paragraph({ children: runs, spacing: { after: 80, line: lineSpacing } }));
        }

        try {
          const bytes = dataUrlToUint8Array(resolved.dataUrl);
          if (bytes && bytes.length > 0) {
            const meta = getImageInfoFromBytes(resolved.dataUrl, bytes);
            const imgRun = new ImageRun({
              data: bytes,
              transformation: { width: meta.width, height: meta.height },
              type: meta.type,
            });
            docChildren.push(
              new Paragraph({
                children: [imgRun],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 60 },
              })
            );
            if (resolved.alt && resolved.alt.trim()) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: resolved.alt.trim(),
                      font: baseFont,
                      size: captionFontSize,
                      italics: true,
                      color: '555555',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                })
              );
            }
          }
        } catch (imgErr) {
          console.warn('Failed to embed inline image into docx:', imgErr);
        }

        if (afterText) {
          const runs = parseLineWithFormulas(afterText, { font: baseFont, size: baseFontSize });
          docChildren.push(new Paragraph({ children: runs, spacing: { after: 120, line: lineSpacing } }));
        }

        i++;
        continue;
      }
    }

    // Smart 4-Choice Detection and Formatting (A, B, C, D)
    if (choiceLayout !== 'keep') {
      // 1. Check for 4 separate consecutive lines: A. ..., B. ..., C. ..., D. ...
      const c1 = parseChoiceLine(trimmed);
      if (c1 && c1.key === 'A' && i + 3 < lines.length) {
        const c2 = parseChoiceLine(lines[i + 1].trim());
        const c3 = parseChoiceLine(lines[i + 2].trim());
        const c4 = parseChoiceLine(lines[i + 3].trim());
        if (c2 && c2.key === 'B' && c3 && c3.key === 'C' && c4 && c4.key === 'D') {
          const elements = createChoiceTableOrParagraphs(
            [c1, c2, c3, c4],
            choiceLayout,
            baseFont,
            baseFontSize,
            lineSpacing
          );
          docChildren.push(...elements);
          i += 4;
          continue;
        }
      }

      // 2. Check for 2 lines with 2 choices each: Line 1 (A & B), Line 2 (C & D)
      if (i + 1 < lines.length) {
        const ab = parseTwoChoices(trimmed, 'A', 'B');
        if (ab) {
          const cd = parseTwoChoices(lines[i + 1].trim(), 'C', 'D');
          if (cd) {
            const elements = createChoiceTableOrParagraphs(
              [...ab, ...cd],
              choiceLayout,
              baseFont,
              baseFontSize,
              lineSpacing
            );
            docChildren.push(...elements);
            i += 2;
            continue;
          }
        }
      }

      // 3. Check for single line containing all 4 choices: A. ... B. ... C. ... D. ...
      const singleChoices = parseSingleLineFourChoices(trimmed);
      if (singleChoices) {
        const elements = createChoiceTableOrParagraphs(
          singleChoices,
          choiceLayout,
          baseFont,
          baseFontSize,
          lineSpacing
        );
        docChildren.push(...elements);
        i++;
        continue;
      }
    }

    // Display / Block Math on own line: $$ ... $$ or \[ ... \]
    if (
      (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 4)
    ) {
      const omml = latexToOmml(trimmed, true);
      if (omml) {
        try {
          const comp = parseOmmlToComponent(omml);
          if (comp) {
            docChildren.push(
              new Paragraph({
                children: [comp],
                alignment: AlignmentType.CENTER,
                spacing: { before: 140, after: 180, line: lineSpacing },
              })
            );
            i++;
            continue;
          }
        } catch {
          // fallback
        }
      }
    }

    // Headings: #, ##, ###
    if (trimmed.startsWith('# ')) {
      const content = trimmed.substring(2);
      const runs = parseLineWithFormulas(content, {
        font: baseFont,
        size: heading1Size,
        bold: true,
      });
      docChildren.push(
        new Paragraph({
          children: runs,
          spacing: { before: 240, after: 160, line: lineSpacing },
        })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const content = trimmed.substring(3);
      const runs = parseLineWithFormulas(content, {
        font: baseFont,
        size: heading2Size,
        bold: true,
      });
      docChildren.push(
        new Paragraph({
          children: runs,
          spacing: { before: 200, after: 130, line: lineSpacing },
        })
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const content = trimmed.substring(4);
      const runs = parseLineWithFormulas(content, {
        font: baseFont,
        size: heading3Size,
        bold: true,
      });
      docChildren.push(
        new Paragraph({
          children: runs,
          spacing: { before: 160, after: 100, line: lineSpacing },
        })
      );
      i++;
      continue;
    }

    // Bullet Lists: - item or * item
    if (/^[-*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      const runs = parseLineWithFormulas(content, {
        font: baseFont,
        size: baseFontSize,
      });
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', font: baseFont, size: baseFontSize, bold: true }),
            ...runs,
          ],
          indent: { left: 400 },
          spacing: { after: 90, line: lineSpacing },
        })
      );
      i++;
      continue;
    }

    // Numbered Lists: 1. item
    const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
    if (numMatch) {
      const numLabel = numMatch[1];
      const content = numMatch[2];
      const runs = parseLineWithFormulas(content, {
        font: baseFont,
        size: baseFontSize,
      });
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${numLabel} `, font: baseFont, size: baseFontSize, bold: true }),
            ...runs,
          ],
          indent: { left: 400 },
          spacing: { after: 90, line: lineSpacing },
        })
      );
      i++;
      continue;
    }

    // Markdown Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const rows: TableRow[] = [];
        const parseRowCells = (rowLine: string) => {
          return rowLine
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
        };

        const headerCells = parseRowCells(tableLines[0]);
        const hasDelimiter = tableLines.length > 1 && /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1]);
        const contentRows = hasDelimiter ? tableLines.slice(2) : tableLines.slice(1);

        // Header Row
        rows.push(
          new TableRow({
            children: headerCells.map(cellText => {
              const runs = parseLineWithFormulas(cellText, {
                font: baseFont,
                size: baseFontSize,
                bold: true,
              });
              return new TableCell({
                borders: tableBorders,
                children: [new Paragraph({ children: runs, alignment: AlignmentType.CENTER, spacing: { line: lineSpacing } })],
                margins: { top: 90, bottom: 90, left: 120, right: 120 },
              });
            }),
          })
        );

        // Content Rows
        for (const cLine of contentRows) {
          const cells = parseRowCells(cLine);
          rows.push(
            new TableRow({
              children: cells.map(cellText => {
                const runs = parseLineWithFormulas(cellText, {
                  font: baseFont,
                  size: baseFontSize,
                });
                return new TableCell({
                  borders: tableBorders,
                  children: [new Paragraph({ children: runs, spacing: { line: lineSpacing } })],
                  margins: { top: 90, bottom: 90, left: 120, right: 120 },
                });
              }),
            })
          );
        }

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows,
          })
        );
        docChildren.push(new Paragraph({ children: [], spacing: { after: 140 } }));
        continue;
      }
    }

    // Normal Paragraph
    const runs = parseLineWithFormulas(line, {
      font: baseFont,
      size: baseFontSize,
    });
    docChildren.push(
      new Paragraph({
        children: runs,
        spacing: { after: 110, line: lineSpacing },
      })
    );
    i++;
  }

  // Margin Preset Mapping (dxa: 1mm ≈ 56.6929 dxa)
  const marginPresets = {
    exam: { top: 1134, bottom: 1134, left: 1417, right: 1134 }, // 20mm, 20mm, 25mm, 20mm (Chuẩn đề thi)
    nd30: { top: 1134, bottom: 1134, left: 1701, right: 850 },  // 20mm, 20mm, 30mm, 15mm (Nghị định 30)
    compact: { top: 850, bottom: 850, left: 850, right: 850 },  // 15mm, 15mm, 15mm, 15mm (Tiết kiệm giấy)
    standard: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 25.4mm (Chuẩn Word 1 inch)
  };

  const presetKey = formattingOptions?.marginPreset || 'exam';
  let finalMargins = marginPresets[presetKey] || marginPresets.exam;

  if (formattingOptions?.customMargins) {
    const cm = formattingOptions.customMargins;
    finalMargins = {
      top: cm.topMm != null ? Math.round(cm.topMm * 56.6929) : finalMargins.top,
      bottom: cm.bottomMm != null ? Math.round(cm.bottomMm * 56.6929) : finalMargins.bottom,
      left: cm.leftMm != null ? Math.round(cm.leftMm * 56.6929) : finalMargins.left,
      right: cm.rightMm != null ? Math.round(cm.rightMm * 56.6929) : finalMargins.right,
    };
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: finalMargins.top,
              bottom: finalMargins.bottom,
              left: finalMargins.left,
              right: finalMargins.right,
            },
            size: {
              width: 11906, // A4 width 210mm
              height: 16838, // A4 height 297mm
            },
          },
        },
        children: docChildren,
      },
    ],
  });
}

/**
 * Generate and trigger download of a Word (.docx) file with Equation formulas, embedded images, and customized formatting
 */
export async function downloadDocxFile(
  markdownText: string,
  filename: string = 'Tai_lieu_toan_hoc.docx',
  title?: string,
  imageMap?: Record<string, string>,
  formattingOptions?: DocxFormattingOptions
): Promise<void> {
  const doc = await createDocxDocument(markdownText, title, imageMap, formattingOptions);
  const rawBlob = await Packer.toBlob(doc);

  // Safety post-processing: Guarantee 0 <undefined> tags in word/document.xml
  let finalBlob: Blob = rawBlob;
  try {
    const zip = await JSZip.loadAsync(rawBlob);
    let docXml = await zip.file('word/document.xml')?.async('string');
    if (docXml && (docXml.includes('<undefined>') || docXml.includes('</undefined>'))) {
      docXml = docXml.replace(/<undefined>/g, '').replace(/<\/undefined>/g, '');
      zip.file('word/document.xml', docXml);
      finalBlob = await zip.generateAsync({ type: 'blob' });
    }
  } catch (cleanErr) {
    console.warn('Post-process clean check completed:', cleanErr);
  }

  const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  const url = window.URL.createObjectURL(finalBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
