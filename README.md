# PDF RAG

## Setup

1. Install dependencies:
```
npm i
```

2. Install ChromaDB globally and run it:
```
npm i -g chromadb
chroma run
```

3. Configure environment variables:
Create a `.env` file with:
```
GOOGLE_AI_API_KEY=your_api_key_here
PORT=4002
CHROMA_URL=http://localhost:8000
```

4. Start the server:
```
npm run dev
```

## API Endpoints

### POST /api/pdf/upload
Upload and process a PDF file.

**Payload:**
- Form data with key `pdf` (file)

**Example:**
```
curl -X POST http://localhost:4002/api/pdf/upload -F "pdf=@document.pdf"
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "documentName": "document.pdf",
  "pageCount": 10,
  "chunkCount": 25
}
```

### GET /api/pdf/documents
List all processed documents.

**Response:**
```json
{
  "success": true,
  "count": 1,
  "documents": [
    {
      "documentId": "uuid",
      "documentName": "document.pdf",
      "chunkCount": 25,
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### DELETE /api/pdf/documents/:documentId
Delete a document and all its chunks.

**Example:**
```
curl -X DELETE http://localhost:4002/api/pdf/documents/uuid
```

### POST /api/query
Query the RAG system.

**Payload:**
```json
{
  "question": "What is the document about?",
  "documentId": "uuid" // optional
}
```

**Required keys:**
- `question` (string)

**Optional keys:**
- `documentId` (string) - filter by specific document

**Response:**
```json
{
  "success": true,
  "question": "What is the document about?",
  "answer": "The document discusses..."
}
```

## Evaluation Script

Run the evaluation script to interactively query the system:

```
npm run evaluate
```

The script will prompt you to enter a question. Make sure the server is running before executing this command.

