import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import healthRoutes from './routes/health';
import apiRoutes from './routes/api';

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Server is running',
  });
});

export default app;

