
export interface TextChunk {
  text: string;
  chunkIndex: number;
  startCharIndex: number;
  endCharIndex: number;
}

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  chunkText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.chunkSize, text.length);
      let chunkText = text.slice(startIndex, endIndex);

      if (endIndex < text.length) {
        const lastPeriod = chunkText.lastIndexOf('.');
        const lastNewline = chunkText.lastIndexOf('\n');

        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > this.chunkSize * 0.5) {
          chunkText = chunkText.slice(0, breakPoint + 1);
          startIndex = startIndex + breakPoint + 1;
        } else {
          startIndex = endIndex;
        }
      } else {
        startIndex = endIndex;
      }

      chunks.push({
        text: chunkText.trim(),
        chunkIndex,
        startCharIndex: startIndex - chunkText.length,
        endCharIndex: startIndex,
      });

      chunkIndex++;

      if (startIndex < text.length) {
        startIndex = Math.max(0, startIndex - this.chunkOverlap);
      }
    }

    return chunks.filter((chunk) => chunk.text.length > 0);
  }

  setChunkSize(size: number): void {
    this.chunkSize = size;
  }

  setOverlap(overlap: number): void {
    this.chunkOverlap = overlap;
  }
}

