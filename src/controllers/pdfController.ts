import { Request, Response } from 'express';
import { PDFExtractor } from '../services/pdfExtractor';
import { TextChunker } from '../services/textChunker';
import { EmbeddingService } from '../services/embeddingService';
import { VectorDBService, StoredDocument } from '../services/vectorDB';
import { v4 as uuidv4 } from 'uuid';

const pdfExtractor = new PDFExtractor();
const textChunker = new TextChunker(1000, 200);

export const uploadPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file provided' });
      return;
    }

    const file = req.file;
    const documentId = uuidv4();
    const documentName = file.originalname || 'unknown.pdf';

    console.log(`Processing PDF: ${documentName} (${documentId})`);

    const extracted = await pdfExtractor.extractText(file.buffer);
    console.log(`Extracted text: ${extracted.text.length} characters, ${extracted.pageCount} pages`);

    const chunks = textChunker.chunkText(extracted.text);
    console.log(`Created ${chunks.length} chunks`);

    const embeddingService = new EmbeddingService(process.env.GOOGLE_AI_API_KEY);
    const texts = chunks.map((chunk) => chunk.text);
    const embeddings = await embeddingService.generateEmbeddings(texts);
    console.log(`Generated ${embeddings.length} embeddings`);

    const vectorDB = new VectorDBService();
    await vectorDB.initialize();

    const documents: StoredDocument[] = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      text: chunk.text,
      metadata: {
        documentId,
        documentName,
        chunkIndex: index,
        timestamp: new Date().toISOString(),
      },
      embedding: embeddings[index],
    }));

    await vectorDB.storeDocuments(documents, embeddings);
    console.log(`✅ Stored ${documents.length} documents in vector DB`);

    res.status(201).json({
      success: true,
      documentId,
      documentName,
      pageCount: extracted.pageCount,
      chunkCount: chunks.length,
      metadata: extracted.metadata,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({
      error: 'Failed to process PDF',
    });
  }
};

export const listDocuments = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const vectorDB = new VectorDBService();
    await vectorDB.initialize();

    const documentIds = await vectorDB.listDocuments();

    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        const chunks = await vectorDB.getDocumentsByDocumentId(docId);
        if (chunks.length > 0) {
          return {
            documentId: docId,
            documentName: chunks[0].metadata.documentName,
            chunkCount: chunks.length,
            uploadedAt: chunks[0].metadata.timestamp,
          };
        }
        return null;
      })
    );

    res.json({
      success: true,
      count: documents.filter((d) => d !== null).length,
      documents: documents.filter((d) => d !== null),
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({
      error: 'Failed to list documents',
    });
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }

    const vectorDB = new VectorDBService();
    await vectorDB.initialize();

    await vectorDB.deleteDocument(documentId);

    res.json({
      success: true,
      message: `Document ${documentId} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
    });
  }
};

