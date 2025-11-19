import { GoogleGenAI } from "@google/genai";
import { EmbeddingService } from './embeddingService';
import { VectorDBService, StoredDocument } from './vectorDB';

export class RAGService {
  private embeddingService: EmbeddingService;
  private vectorDB: VectorDBService;
  private genAI: GoogleGenAI;
  private llmModel: string;

  constructor(
    embeddingService: EmbeddingService,
    vectorDB: VectorDBService,
    apiKey?: string
  ) {
    this.embeddingService = embeddingService;
    this.vectorDB = vectorDB;
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.llmModel = 'gemini-2.5-flash';
  }

  async answerQuestion(
    question: string,
    documentId?: string,
    topK: number = 5
  ): Promise<{
    answer: string;
    sources: StoredDocument[];
    context: string;
  }> {

    const questionEmbedding = await this.embeddingService.generateEmbedding(
      question
    );

    const relevantDocs = await this.vectorDB.searchSimilar(
      questionEmbedding,
      topK,
      documentId ? { documentId } : undefined
    );

    if (relevantDocs.length === 0) {
      return {
        answer: 'I could not find any relevant information in the documents to answer your question.',
        sources: [],
        context: '',
      };
    }

    const context = relevantDocs
      .map((doc, index) => `[Source ${index + 1}]\n${doc.text}`)
      .join('\n\n');

    const answer = await this.generateAnswer(question, context);

    return {
      answer,
      sources: relevantDocs,
      context,
    };
  }

  private async generateAnswer(
    question: string,
    context: string
  ): Promise<string> {
    const prompt = `You are a helpful assistant that answers questions based on the provided context from medical/health documents.

    Context:
    ${context}

    Question: ${question}

    Instructions:
    - Answer the question based ONLY on the provided context
    - If the context doesn't contain enough information, say so
    - Be concise and accurate
    - If discussing medical information, emphasize that this is for informational purposes only
    - Cite which source(s) you used when relevant

    Answer:`;

    try {
      console.log('Generating answer...');
      const result = await this.genAI.models.generateContent({
        model: this.llmModel,
        contents: prompt
      });
      const response = result.text;

      return response || 'Unable to generate answer';
    } catch (error) {
      console.error('Error generating answer:', error);
      throw new Error('Failed to generate answer');
    }
  }
}
