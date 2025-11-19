import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { uploadPDF, listDocuments, deleteDocument } from '../controllers/pdfController';
import { query } from '../controllers/queryController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: { mimetype: string }, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.post('/pdf/upload', upload.single('pdf'), uploadPDF);
router.get('/pdf/documents', listDocuments);
router.delete('/pdf/documents/:documentId', deleteDocument);

router.post('/query', query);

router.get('/', (_req, res) => {
  res.json({
    message: 'API is working',
    endpoints: {
      'POST /api/pdf/upload': 'Upload and process a PDF',
      'GET /api/pdf/documents': 'List all processed documents',
      'DELETE /api/pdf/documents/:documentId': 'Delete a document',
      'POST /api/query': 'Query the RAG system',
    },
  });
});

export default router;
