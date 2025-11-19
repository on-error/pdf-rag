import { Request, Response } from 'express';
import { EmbeddingService } from '../services/embeddingService';
import { VectorDBService } from '../services/vectorDB';
import { RAGService } from '../services/ragService';

export const query = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, documentId } = req.body;
    console.log(documentId, question)
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    console.log(`Query: ${question}`);

    const embeddingService = new EmbeddingService(process.env.GOOGLE_AI_API_KEY);
    const vectorDB = new VectorDBService();
    await vectorDB.initialize();

    const ragService = new RAGService(
      embeddingService,
      vectorDB,
      process.env.GOOGLE_AI_API_KEY,
    );

    const result = await ragService.answerQuestion(
      question,
      documentId,
      5
    );

    console.log(`Generated answer`);

    res.json({
      success: true,
      question,
      answer: result.answer
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
    });
  }
};

