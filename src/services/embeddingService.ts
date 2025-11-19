import { GoogleGenAI } from '@google/genai';

export class EmbeddingService {
  private genAI: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-embedding-001') {
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.genAI.models.embedContent({
        model: this.model,
        contents: [text],
      });

      if (!result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
        throw new Error('Invalid embedding response');
      }

      return result.embeddings[0].values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddingPromises = texts.map((text) => this.generateEmbedding(text));
      const embeddings = await Promise.all(embeddingPromises);
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }
}
