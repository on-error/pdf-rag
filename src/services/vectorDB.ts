import { ChromaClient } from 'chromadb';

export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber?: number;
  timestamp: string;
}

export interface StoredDocument {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

export class VectorDBService {
  private client: ChromaClient;
  private collectionName: string;
  private collection: any;

  constructor(collectionName: string = 'pdf_rag_collection') {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    try {
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
        } as any);
        console.log(`Connected to existing collection: ${this.collectionName}`);
      } catch (getError) {
        this.collection = await this.client.createCollection({
          name: this.collectionName,
        });
        console.log(`Created new collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('Error initializing collection:', error);
      throw new Error('Failed to initialize vector database');
    }
  }

  async storeDocuments(
    documents: StoredDocument[],
    embeddings: number[][]
  ): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    if (documents.length !== embeddings.length) {
      throw new Error('Documents and embeddings count mismatch');
    }

    const ids = documents.map((doc) => doc.id);
    const texts = documents.map((doc) => doc.text);
    const metadatas = documents.map((doc) => doc.metadata);

    try {
      await this.collection.add({
        ids,
        embeddings,
        documents: texts,
        metadatas,
      });

      console.log(`Stored ${documents.length} documents in vector DB`);
    } catch (error) {
      console.error('Error storing documents:', error);
      throw new Error('Failed to store documents in vector database');
    }
  }

  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: { documentId?: string }
  ): Promise<StoredDocument[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const where: any = {};
      if (filter?.documentId) {
        where.documentId = filter.documentId;
      }

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      const documents: StoredDocument[] = [];

      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          documents.push({
            id: results.ids[0][i],
            text: results.documents[0][i],
            metadata: results.metadatas[0][i] as DocumentMetadata,
            embedding: results.embeddings?.[0]?.[i],
          });
        }
      }

      return documents;
    } catch (error) {
      console.error('Error searching vector DB:', error);
      throw new Error('Failed to search vector database');
    }
  }

  async getDocumentsByDocumentId(documentId: string): Promise<StoredDocument[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const results = await this.collection.get({
        where: { documentId },
      });

      return results.ids.map((id: string, index: number) => ({
        id,
        text: results.documents[index],
        metadata: results.metadatas[index] as DocumentMetadata,
        embedding: results.embeddings?.[index],
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw new Error('Failed to get documents from vector database');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const documents = await this.getDocumentsByDocumentId(documentId);
      const ids = documents.map((doc) => doc.id);

      if (ids.length > 0) {
        await this.collection.delete({ ids });
        console.log(`✅ Deleted ${ids.length} chunks for document ${documentId}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document from vector database');
    }
  }

  async listDocuments(): Promise<string[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const results = await this.collection.get();
      const documentIds = new Set<string>();

      if (results.metadatas) {
        results.metadatas.forEach((metadata: DocumentMetadata) => {
          if (metadata.documentId) {
            documentIds.add(metadata.documentId);
          }
        });
      }

      return Array.from(documentIds);
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  }
}

