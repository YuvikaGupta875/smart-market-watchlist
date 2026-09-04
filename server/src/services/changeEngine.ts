import { 
  MarketQuote, 
  HistoricalCandle, 
  AttentionSignal, 
  AttentionTier, 
  SessionDelta, 
  WatchlistItemAnalysis, 
  CatalystEvent 
} from '../types';
import { marketHub } from './marketHub';

export function calculateRSI(candles: HistoricalCandle[], period = 14): number {
  if (!candles || candles.length <= period) return 50;

  const closes = candles.map(c => c.close);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(1));
}

export function analyzeWatchlistItem(
  quote: MarketQuote,
  candles: HistoricalCandle[],
  checkpointTime: number,
  snapshotPrice: number | undefined,
  catalysts: CatalystEvent[],
  userNotes?: string,
  alertThreshold?: number
): WatchlistItemAnalysis {
  const currentPrice = quote.price;
  const now = Date.now();
  const elapsedHours = Number(Math.max(0.1, (now - checkpointTime) / (3600 * 1000)).toFixed(1));

  // Determine baseline checkpoint price
  let basePrice = snapshotPrice;
  if (!basePrice || isNaN(basePrice)) {
    // If no snapshot in record, find the candle closest to checkpointTime
    if (candles.length > 0) {
      let closestCandle = candles[0];
      let minDiff = Math.abs(candles[0].timestamp - checkpointTime);
      for (const c of candles) {
        const diff = Math.abs(c.timestamp - checkpointTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestCandle = c;
        }
      }
      basePrice = closestCandle.close;
    } else {
      basePrice = quote.price - quote.change;
    }
  }

  const priceDelta = Number((currentPrice - basePrice).toFixed(2));
  const percentDelta = basePrice > 0 ? Number(((priceDelta / basePrice) * 100).toFixed(2)) : 0;

  const sessionDelta: SessionDelta = {
    checkpointPrice: Number(basePrice.toFixed(2)),
    checkpointTimestamp: checkpointTime,
    currentPrice,
    priceDelta,
    percentDelta,
    elapsedHours
  };

  const signals: AttentionSignal[] = [];

  // 1. Session Delta Signal
  const absDelta = Math.abs(percentDelta);
  if (absDelta >= 7.0) {
    signals.push({
      id: `sig-delta-${quote.symbol}`,
      type: 'DELTA_SHOCK',
      severity: 'CRITICAL',
      title: `${percentDelta > 0 ? 'Surged' : 'Plunged'} ${Math.abs(percentDelta)}% Since Review`,
      description: `Moved from $${basePrice.toFixed(2)} to $${currentPrice.toFixed(2)} over the past ${elapsedHours}h`,
      timestamp: now
    });
  } else if (absDelta >= 3.0) {
    signals.push({
      id: `sig-delta-${quote.symbol}`,
      type: 'DELTA_SHOCK',
      severity: 'NOTABLE',
      title: `${percentDelta > 0 ? 'Up' : 'Down'} ${Math.abs(percentDelta)}% Since Last Visit`,
      description: `Shifted from $${basePrice.toFixed(2)} to $${currentPrice.toFixed(2)}`,
      timestamp: now
    });
  }

  // 2. Volume Spike / RVOL
  if (quote.rvol >= 2.5) {
    signals.push({
      id: `sig-vol-${quote.symbol}`,
      type: 'RVOL_SURGE',
      severity: 'CRITICAL',
      title: `Institutional Volume Surge (${quote.rvol}x)`,
      description: `Trading volume is running ${quote.rvol}x above 20-day historical average`,
      timestamp: now
    });
  } else if (quote.rvol >= 1.75) {
    signals.push({
      id: `sig-vol-${quote.symbol}`,
      type: 'RVOL_SURGE',
      severity: 'NOTABLE',
      title: `Elevated Relative Volume (${quote.rvol}x)`,
      description: `Volume is ${Math.round((quote.rvol - 1) * 100)}% above normal baseline`,
      timestamp: now
    });
  }

  // 3. Technical Breakouts
  if (quote.fiftyTwoWeekHigh > 0 && currentPrice >= quote.fiftyTwoWeekHigh * 0.992) {
    signals.push({
      id: `sig-52wh-${quote.symbol}`,
      type: 'BREAKOUT_52W_HIGH',
      severity: 'CRITICAL',
      title: 'Testing / Breaking 52-Week High',
      description: `Trading at $${currentPrice.toFixed(2)} near annual peak of $${quote.fiftyTwoWeekHigh.toFixed(2)}`,
      timestamp: now
    });
  } else if (quote.fiftyTwoWeekLow > 0 && currentPrice <= quote.fiftyTwoWeekLow * 1.008) {
    signals.push({
      id: `sig-52wl-${quote.symbol}`,
      type: 'BREAKOUT_52W_LOW',
      severity: 'CRITICAL',
      title: 'Testing / Breaking 52-Week Low',
      description: `Trading at $${currentPrice.toFixed(2)} near annual trough of $${quote.fiftyTwoWeekLow.toFixed(2)}`,
      timestamp: now
    });
  }

  // 4. RSI Extreme
  const rsi = calculateRSI(candles);
  if (rsi <= 30) {
    signals.push({
      id: `sig-rsi-${quote.symbol}`,
      type: 'RSI_OVERSOLD',
      severity: 'NOTABLE',
      title: `RSI Oversold (${rsi})`,
      description: `Technical momentum indicator dipped into oversold territory (<30)`,
      timestamp: now
    });
  } else if (rsi >= 72) {
    signals.push({
      id: `sig-rsi-${quote.symbol}`,
      type: 'RSI_OVERBOUGHT',
      severity: 'NOTABLE',
      title: `RSI Overbought (${rsi})`,
      description: `Technical momentum indicator is extended into overbought territory (>70)`,
      timestamp: now
    });
  }

  // 5. Catalyst Events in Delta Window
  const recentCatalysts = catalysts.filter(c => c.eventDate >= checkpointTime - 12 * 3600 * 1000);
  for (const cat of recentCatalysts) {
    signals.push({
      id: `sig-cat-${cat.id}`,
      type: 'EARNINGS_CATALYST',
      severity: 'CRITICAL',
      title: `${cat.eventType}: ${cat.headline}`,
      description: cat.summary,
      timestamp: cat.eventDate
    });
  }

  // 6. Sector Divergence
  const sectorEtfQuote = marketHub.getQuote(quote.sectorEtf);
  const sectorDelta = sectorEtfQuote.changePercent || 0;
  const stockDeltaToday = quote.changePercent || 0;
  const sectorDivergencePercent = Number((stockDeltaToday - sectorDelta).toFixed(2));

  if (Math.abs(sectorDivergencePercent) >= 3.5) {
    signals.push({
      id: `sig-div-${quote.symbol}`,
      type: 'SECTOR_DIVERGENCE',
      severity: 'NOTABLE',
      title: `Decoupled from ${quote.sectorEtf} (${sectorDivergencePercent > 0 ? '+' : ''}${sectorDivergencePercent}%)`,
      description: `Stock is moving independently of its broader sector ETF (${quote.sectorEtf})`,
      timestamp: now
    });
  }

  // 7. Custom User Alert Threshold Trigger
  if (alertThreshold && absDelta >= alertThreshold) {
    signals.push({
      id: `sig-thresh-${quote.symbol}`,
      type: 'DELTA_SHOCK',
      severity: 'CRITICAL',
      title: `User Alert Threshold Exceeded (±${alertThreshold}%)`,
      description: `Movement of ${percentDelta}% exceeded your custom alert limit of ${alertThreshold}%`,
      timestamp: now
    });
  }

  // --- Compute Composite Attention Score (0 - 100) ---
  const deltaScore = Math.min(35, absDelta * 3.5);
  const volScore = Math.min(25, Math.max(0, (quote.rvol - 1.0) * 14));
  let techScore = 0;
  if (currentPrice >= quote.fiftyTwoWeekHigh * 0.992 || currentPrice <= quote.fiftyTwoWeekLow * 1.008) {
    techScore += 18;
  }
  if (rsi <= 30 || rsi >= 72) {
    techScore += 10;
  }
  const catScore = Math.min(30, recentCatalysts.length * 15);
  const divScore = Math.min(12, Math.abs(sectorDivergencePercent) * 2.2);

  const rawScore = deltaScore + volScore + techScore + catScore + divScore;
  const attentionScore = Math.min(100, Math.round(rawScore));

  let attentionTier: AttentionTier = 'NOISE';
  if (attentionScore >= 68 || signals.some(s => s.severity === 'CRITICAL')) {
    attentionTier = 'CRITICAL';
  } else if (attentionScore >= 38 || signals.length > 0) {
    attentionTier = 'NOTABLE';
  }

  return {
    symbol: quote.symbol,
    quote,
    sessionDelta,
    attentionScore,
    attentionTier,
    signals,
    history: candles,
    catalysts: recentCatalysts,
    sectorDivergencePercent,
    userNotes,
    alertThreshold
  };
}
