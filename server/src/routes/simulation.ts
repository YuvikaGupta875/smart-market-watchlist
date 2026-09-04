import { Router } from 'express';
import { simulator } from '../services/providerSim';
import { marketHub } from '../services/marketHub';
import { saveUserCheckpoint, getUserCheckpoint } from '../db/database';

export const simulationRouter = Router();

// Time-Travel Simulator
simulationRouter.post('/time-travel', (req, res) => {
  const { userId, mode, customHours } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  let hoursAgo = 48; // default 2 days
  if (mode === '1h') hoursAgo = 1;
  else if (mode === '24h') hoursAgo = 24;
  else if (mode === '3d') hoursAgo = 72;
  else if (mode === '7d') hoursAgo = 168;
  else if (customHours) hoursAgo = Number(customHours);

  const now = Date.now();
  const targetCheckpointTime = now - hoursAgo * 3600 * 1000;

  // Retrieve existing checkpoint to preserve symbols, or build fresh
  const currentCheckpoint = getUserCheckpoint(userId);
  const symbols = currentCheckpoint 
    ? Object.keys(currentCheckpoint.snapshotPrices) 
    : marketHub.getAllWatchedSymbols();

  const adjustedSnapshots: Record<string, number> = {};

  for (const sym of symbols) {
    const quote = marketHub.getQuote(sym);
    // Find candles or simulate realistic price at that time
    const candles = marketHub.getCandles(sym);
    let historicalPrice = quote.price;

    if (candles.length > 0) {
      let closest = candles[0];
      let minDiff = Math.abs(candles[0].timestamp - targetCheckpointTime);
      for (const c of candles) {
        const diff = Math.abs(c.timestamp - targetCheckpointTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = c;
        }
      }
      historicalPrice = closest.close;
    } else {
      // Simulate historical drift
      const simulatedDrift = (hoursAgo / 24) * 0.015;
      historicalPrice = quote.price * (1 - simulatedDrift);
    }

    adjustedSnapshots[sym] = Number(historicalPrice.toFixed(2));
  }

  const updatedCheckpoint = saveUserCheckpoint(userId, targetCheckpointTime, adjustedSnapshots);

  res.json({
    success: true,
    message: `Time travel engaged: session rewinded to ${hoursAgo} hours ago.`,
    checkpoint: updatedCheckpoint
  });
});

// Inject Market Shock
simulationRouter.post('/shock', (req, res) => {
  const { symbol, shockType } = req.body;
  if (!symbol || !shockType) {
    return res.status(400).json({ error: 'symbol and shockType are required' });
  }

  simulator.injectShock(symbol, shockType);
  // Force update in marketHub
  const updatedQuote = simulator.getQuote(symbol);

  res.json({
    success: true,
    message: `Shock injected on ${symbol}: ${shockType}`,
    quote: updatedQuote
  });
});

// Toggle Simulated Outage / Circuit Breaker
simulationRouter.post('/outage', (req, res) => {
  const { enabled } = req.body;
  marketHub.setSimulatedOutage(Boolean(enabled));

  res.json({
    success: true,
    outageSimulated: Boolean(enabled),
    circuit: marketHub.getCircuitStatus()
  });
});

// Reset Simulation
simulationRouter.post('/reset', (req, res) => {
  simulator.resetShocks();
  marketHub.setSimulatedOutage(false);

  res.json({
    success: true,
    message: 'Simulation state reset to clean baseline.'
  });
});
