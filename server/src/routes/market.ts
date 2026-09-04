import { Router } from 'express';
import { marketHub } from '../services/marketHub';
import { UNIVERSE_ASSETS } from '../services/providerSim';

export const marketRouter = Router();

// Get quotes for comma-separated symbols
marketRouter.get('/quotes', async (req, res) => {
  const symbolsParam = req.query.symbols as string;
  if (!symbolsParam) {
    return res.status(400).json({ error: 'symbols query param required' });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const quotes = symbols.map(s => marketHub.getQuote(s));

  res.json({ quotes });
});

// Force refresh a single symbol live
marketRouter.post('/refresh/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const quote = await marketHub.fetchLiveQuote(symbol);
    res.json({ quote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get historical candles for charting
marketRouter.get('/history/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const candles = marketHub.getCandles(symbol);
  res.json({ symbol, candles });
});

// Search available ticker universe
marketRouter.get('/universe', (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase();
  const allAssets = Object.values(UNIVERSE_ASSETS);
  
  if (!query) {
    return res.json({ assets: allAssets });
  }

  const matches = allAssets.filter(
    a => a.symbol.toLowerCase().includes(query) || a.name.toLowerCase().includes(query) || a.sector.toLowerCase().includes(query)
  );

  res.json({ assets: matches });
});

// Get circuit breaker status
marketRouter.get('/circuit', (req, res) => {
  res.json({ circuit: marketHub.getCircuitStatus() });
});
