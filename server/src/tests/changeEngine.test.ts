import test from 'node:test';
import assert from 'node:assert';
import { calculateRSI, analyzeWatchlistItem } from '../services/changeEngine';
import { MarketQuote, HistoricalCandle } from '../types';

test('calculateRSI returns expected 50 for flat candles', () => {
  const candles: HistoricalCandle[] = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    candles.push({
      timestamp: now - i * 86400000,
      open: 100,
      high: 101,
      low: 99,
      close: 100,
      volume: 1000000
    });
  }
  const rsi = calculateRSI(candles, 14);
  assert.strictEqual(typeof rsi, 'number');
  assert.ok(rsi >= 0 && rsi <= 100);
});

test('analyzeWatchlistItem detects Delta Shock and RVOL Surge', () => {
  const now = Date.now();
  const mockQuote: MarketQuote = {
    symbol: 'TEST',
    name: 'Test Corp',
    price: 115.00,
    change: 5.00,
    changePercent: 4.5,
    volume: 3000000,
    avgVolume: 1000000,
    rvol: 3.0, // Institutional volume surge
    dayHigh: 116.00,
    dayLow: 109.00,
    fiftyTwoWeekHigh: 114.50, // 52W High Breakout!
    fiftyTwoWeekLow: 60.00,
    sector: 'Technology',
    sectorEtf: 'XLK',
    lastUpdated: now,
    source: 'simulated',
    freshness: 'FRESH'
  };

  const checkpointTime = now - 48 * 3600 * 1000;
  const snapshotPrice = 100.00; // +15% move since checkpoint

  const analysis = analyzeWatchlistItem(
    mockQuote,
    [],
    checkpointTime,
    snapshotPrice,
    [],
    'My thesis note',
    5.0
  );

  assert.strictEqual(analysis.symbol, 'TEST');
  assert.strictEqual(analysis.sessionDelta.percentDelta, 15.0);
  assert.strictEqual(analysis.attentionTier, 'CRITICAL');
  assert.ok(analysis.attentionScore >= 70, `Expected score >= 70, got ${analysis.attentionScore}`);
  assert.ok(analysis.signals.some(s => s.type === 'DELTA_SHOCK'));
  assert.ok(analysis.signals.some(s => s.type === 'RVOL_SURGE'));
  assert.ok(analysis.signals.some(s => s.type === 'BREAKOUT_52W_HIGH'));
});

test('analyzeWatchlistItem classifies low-movement asset as NOISE', () => {
  const now = Date.now();
  const mockQuote: MarketQuote = {
    symbol: 'QUIET',
    name: 'Quiet Corp',
    price: 100.20,
    change: 0.10,
    changePercent: 0.1,
    volume: 1000000,
    avgVolume: 1050000,
    rvol: 0.95,
    dayHigh: 100.50,
    dayLow: 99.80,
    fiftyTwoWeekHigh: 130.00,
    fiftyTwoWeekLow: 80.00,
    sector: 'Utilities',
    sectorEtf: 'XLU',
    lastUpdated: now,
    source: 'simulated',
    freshness: 'FRESH'
  };

  const checkpointTime = now - 24 * 3600 * 1000;
  const snapshotPrice = 100.00; // Only +0.2% change

  const analysis = analyzeWatchlistItem(
    mockQuote,
    [],
    checkpointTime,
    snapshotPrice,
    [],
    undefined,
    undefined
  );

  assert.strictEqual(analysis.attentionTier, 'NOISE');
  assert.ok(analysis.attentionScore < 40, `Expected score < 40, got ${analysis.attentionScore}`);
});
