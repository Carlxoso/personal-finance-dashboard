import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import api from './routes/index.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 300, skip: () => env.NODE_ENV === 'test' }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
app.use('/api', api);
app.use(errorHandler);
