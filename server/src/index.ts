import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedDatabase } from './db/seed';
import { watchlistsRouter } from './routes/watchlists';
import { marketRouter } from './routes/market';
import { attentionRouter } from './routes/attention';
import { simulationRouter } from './routes/simulation';
import { sseRouter } from './routes/sse';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Initialize & seed DB
seedDatabase();

// Middleware - allow all origins and headers
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/watchlists', watchlistsRouter);
app.use('/api/market', marketRouter);
app.use('/api/attention', attentionRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api', sseRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[DeltaWatch Server] Running at http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
});
