import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  getWatchlistsForUser, 
  getWatchlistById, 
  createWatchlist, 
  deleteWatchlist, 
  addWatchlistItem, 
  removeWatchlistItem, 
  updateWatchlistItem 
} from '../db/database';
import { marketHub } from '../services/marketHub';

export const watchlistsRouter = Router();

// Get all personas
watchlistsRouter.get('/users', (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});

// Get user profile
watchlistsRouter.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Get watchlists for user
watchlistsRouter.get('/', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const watchlists = getWatchlistsForUser(userId);
  res.json({ watchlists });
});

// Get specific watchlist
watchlistsRouter.get('/:id', (req, res) => {
  const watchlist = getWatchlistById(req.params.id);
  if (!watchlist) return res.status(404).json({ error: 'Watchlist not found' });
  res.json({ watchlist });
});

// Create new watchlist
watchlistsRouter.post('/', (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) return res.status(400).json({ error: 'userId and name are required' });
  const id = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const watchlist = createWatchlist(id, userId, name, false);
  res.status(201).json({ watchlist });
});

// Delete watchlist
watchlistsRouter.delete('/:id', (req, res) => {
  const success = deleteWatchlist(req.params.id);
  if (!success) return res.status(400).json({ error: 'Cannot delete default watchlist or watchlist not found' });
  res.json({ success: true });
});

// Add item to watchlist
watchlistsRouter.post('/:id/items', async (req, res) => {
  const { symbol, notes, alertThreshold } = req.body;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  
  const sym = symbol.trim().toUpperCase();
  const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item = addWatchlistItem(itemId, req.params.id, sym, notes, alertThreshold);

  // Trigger immediate fetch/cache in marketHub
  try {
    await marketHub.fetchLiveQuote(sym);
  } catch {
    // Graceful fallback
  }

  res.status(201).json({ item });
});

// Remove item from watchlist
watchlistsRouter.delete('/:id/items/:symbol', (req, res) => {
  const success = removeWatchlistItem(req.params.id, req.params.symbol);
  res.json({ success });
});

// Update item (notes or threshold)
watchlistsRouter.patch('/:id/items/:symbol', (req, res) => {
  const { notes, alertThreshold } = req.body;
  const success = updateWatchlistItem(req.params.id, req.params.symbol, notes, alertThreshold);
  res.json({ success });
});
