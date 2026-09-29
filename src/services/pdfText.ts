/**
 * Text aus einem PDF lesen – vollständig im Gerät mit pdf.js.
 * Die Bibliothek wird erst geladen, wenn wirklich ein PDF gelesen wird.
 */

export interface PdfText {
  text: string;
  pages: number;
  /** Seiten ohne Text (vermutlich eingescannt) */
  emptyPages: number;
}

/** Größtes PDF, das gelesen wird */
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
/** So viele Seiten werden höchstens gelesen */
export const MAX_PDF_PAGES = 300;

interface TextItemLike {
  str?: string;
  hasEOL?: boolean;
}

/** Ausschnitt aus pdf.js, den das Auslesen braucht (Browser- und Node-Build) */
export interface PdfLibrary {
  getDocument: (source: { data: Uint8Array }) => {
    promise: Promise<{
      numPages: number;
      getPage: (number: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }>; cleanup: () => unknown }>;
    }>;
    destroy: () => Promise<void>;
  };
}

export async function readPdfText(data: ArrayBuffer, onProgress?: (page: number, pages: number) => void): Promise<PdfText> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return extractText(pdfjs as unknown as PdfLibrary, data, onProgress);
}

/** Text aller Seiten; Zeilenenden bleiben erhalten (für Trennstriche am Zeilenende) */
export async function extractText(
  pdfjs: PdfLibrary,
  data: ArrayBuffer | Uint8Array,
  onProgress?: (page: number, pages: number) => void,
): Promise<PdfText> {
  const task = pdfjs.getDocument({ data: data instanceof Uint8Array ? data : new Uint8Array(data) });
  const document = await task.promise;
  const pages = Math.min(document.numPages, MAX_PDF_PAGES);
  const parts: string[] = [];
  let emptyPages = 0;
  try {
    for (let number = 1; number <= pages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const text = (content.items as TextItemLike[]).map((item) => `${item.str ?? ''}${item.hasEOL ? '\n' : ' '}`).join('');
      if (!text.trim()) emptyPages++;
      parts.push(text);
      page.cleanup();
      onProgress?.(number, pages);
    }
  } finally {
    await task.destroy();
  }
  return { text: parts.join('\n'), pages: document.numPages, emptyPages };
}
