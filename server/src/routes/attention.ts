import { Router } from 'express';
import { 
  getWatchlistById, 
  getUserCheckpoint, 
  saveUserCheckpoint, 
  getCatalystsForSymbols 
} from '../db/database';
import { marketHub } from '../services/marketHub';
import { analyzeWatchlistItem } from '../services/changeEngine';
import { generateExecutiveBriefing } from '../services/briefing';
import { WatchlistItemAnalysis } from '../types';

export const attentionRouter = Router();

attentionRouter.get('/', (req, res) => {
  const userId = req.query.userId as string;
  const watchlistId = req.query.watchlistId as string;

  if (!userId || !watchlistId) {
    return res.status(400).json({ error: 'userId and watchlistId are required' });
  }

  const watchlist = getWatchlistById(watchlistId);
  if (!watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  // Retrieve user checkpoint
  let checkpoint = getUserCheckpoint(userId);
  const now = Date.now();
  if (!checkpoint) {
    // Default to 48 hours ago checkpoint if none found
    const defaultTime = now - 48 * 3600 * 1000;
    const initialSnapshots: Record<string, number> = {};
    for (const item of watchlist.items) {
      const q = marketHub.getQuote(item.symbol);
      initialSnapshots[item.symbol] = Number((q.price * 0.96).toFixed(2));
    }
    checkpoint = saveUserCheckpoint(userId, defaultTime, initialSnapshots);
  }

  const symbols = watchlist.items.map(i => i.symbol);
  const allCatalysts = getCatalystsForSymbols(symbols);

  // Analyze each item
  const analyzedItems: WatchlistItemAnalysis[] = [];

  for (const item of watchlist.items) {
    const sym = item.symbol.toUpperCase();
    const quote = marketHub.getQuote(sym);
    const candles = marketHub.getCandles(sym);
    const itemCatalysts = allCatalysts.filter(c => c.symbol.toUpperCase() === sym);
    const snapshotPrice = checkpoint.snapshotPrices[sym];

    const analysis = analyzeWatchlistItem(
      quote,
      candles,
      checkpoint.checkpointTime,
      snapshotPrice,
      itemCatalysts,
      item.notes,
      item.alertThreshold
    );

    analyzedItems.push(analysis);
  }

  // Sort by Attention Score descending
  analyzedItems.sort((a, b) => b.attentionScore - a.attentionScore);

  // Generate Executive Briefing
  const briefing = generateExecutiveBriefing(analyzedItems, checkpoint.checkpointTime);

  res.json({
    checkpoint,
    briefing,
    items: analyzedItems
  });
});

// Commit review / update checkpoint to NOW
attentionRouter.post('/checkpoint/commit', (req, res) => {
  const { userId, watchlistId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const now = Date.now();
  const snapshotPrices: Record<string, number> = {};

  // If watchlistId provided, capture its symbols; otherwise capture all watched symbols
  let symbolsToSnapshot: string[] = [];
  if (watchlistId) {
    const wl = getWatchlistById(watchlistId);
    if (wl) {
      symbolsToSnapshot = wl.items.map(i => i.symbol);
    }
  }

  if (symbolsToSnapshot.length === 0) {
    symbolsToSnapshot = marketHub.getAllWatchedSymbols();
  }

  for (const sym of symbolsToSnapshot) {
    const q = marketHub.getQuote(sym);
    snapshotPrices[sym] = q.price;
  }

  const updatedCheckpoint = saveUserCheckpoint(userId, now, snapshotPrices);
  res.json({
    checkpoint: updatedCheckpoint,
    message: 'Checkpoint successfully updated to current market time.'
  });
});
