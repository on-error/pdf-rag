import pdfParse from 'pdf-parse';

export interface ExtractedText {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export class PDFExtractor {
  async extractText(pdfBuffer: Buffer): Promise<ExtractedText> {
    const data = await pdfParse(pdfBuffer);

    const cleanedText = this.cleanText(data.text);

    return {
      text: cleanedText,
      pageCount: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
      },
    };
  }

  private cleanText(text: string): string {
    let cleaned = text;

    cleaned = cleaned.replace(/\bPage\s+\d+\b/gi, '');
    cleaned = cleaned.replace(/\b\d+\s*\/\s*\d+\b/g, '');
    cleaned = cleaned.replace(/^\d+$/gm, '');

    const lines = cleaned.split('\n');
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.length < 3) return false;
      if (/^[\d\s\-_.]+$/.test(trimmed)) return false;
      return true;
    });

    cleaned = filteredLines.join('\n');

    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');

    const headerFooterPatterns = [
      /^Confidential.*$/gim,
      /^Patient.*$/gim,
      /^Medical Record.*$/gim,
      /^Date:.*$/gim,
      /^©.*$/gim,
      /^All rights reserved.*$/gim,
    ];

    headerFooterPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '');
    });

    cleaned = cleaned.trim();

    return cleaned;
  }

  splitIntoPages(text: string, pageCount: number): string[] {
    const estimatedCharsPerPage = Math.ceil(text.length / pageCount);
    const pages: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      const start = i * estimatedCharsPerPage;
      const end = (i + 1) * estimatedCharsPerPage;
      pages.push(text.slice(start, end).trim());
    }

    return pages;
  }
}

