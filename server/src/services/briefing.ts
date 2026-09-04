import { WatchlistItemAnalysis, ExecutiveBriefing } from '../types';

export function generateExecutiveBriefing(
  items: WatchlistItemAnalysis[],
  checkpointTime: number
): ExecutiveBriefing {
  const now = Date.now();
  const elapsedHours = Math.max(0.1, (now - checkpointTime) / (3600 * 1000));
  
  let elapsedTimeString = '';
  if (elapsedHours < 1) {
    elapsedTimeString = `${Math.round(elapsedHours * 60)} minutes ago`;
  } else if (elapsedHours < 24) {
    elapsedTimeString = `${Math.round(elapsedHours)} hours ago`;
  } else {
    const days = (elapsedHours / 24).toFixed(1);
    elapsedTimeString = `${days} days ago`;
  }

  const criticalItems = items.filter(i => i.attentionTier === 'CRITICAL');
  const notableItems = items.filter(i => i.attentionTier === 'NOTABLE');
  const quietItems = items.filter(i => i.attentionTier === 'NOISE');

  // Extract top catalysts & signals
  const topCatalysts: string[] = [];
  for (const item of criticalItems) {
    const cat = item.catalysts[0];
    if (cat) {
      topCatalysts.push(`[${item.symbol}] ${cat.headline}`);
    } else if (item.signals.length > 0) {
      topCatalysts.push(`[${item.symbol}] ${item.signals[0].title}`);
    }
  }

  // Key takeaways
  const keyTakeaways: string[] = [];
  if (criticalItems.length > 0) {
    const symbols = criticalItems.map(i => i.symbol).join(', ');
    keyTakeaways.push(`High attention required on ${symbols} due to breakout momentum and volume divergence.`);
  }

  const bigGainers = items.filter(i => i.sessionDelta.percentDelta >= 4.0);
  const bigLosers = items.filter(i => i.sessionDelta.percentDelta <= -4.0);

  if (bigGainers.length > 0) {
    keyTakeaways.push(`Gaining leaders since review: ${bigGainers.map(g => `${g.symbol} (+${g.sessionDelta.percentDelta}%)`).join(', ')}.`);
  }
  if (bigLosers.length > 0) {
    keyTakeaways.push(`Notable pullbacks: ${bigLosers.map(l => `${l.symbol} (${l.sessionDelta.percentDelta}%)`).join(', ')}.`);
  }

  if (keyTakeaways.length === 0) {
    keyTakeaways.push('Watchlist is trading within normal statistical ranges with no critical regime deviations.');
  }

  // Market Regime calculation
  let avgDelta = 0;
  if (items.length > 0) {
    avgDelta = items.reduce((acc, i) => acc + i.sessionDelta.percentDelta, 0) / items.length;
  }

  let marketRegime: 'RISK_ON' | 'RISK_OFF' | 'ROTATION' | 'NEUTRAL' = 'NEUTRAL';
  if (avgDelta >= 2.5) marketRegime = 'RISK_ON';
  else if (avgDelta <= -2.5) marketRegime = 'RISK_OFF';
  else if (criticalItems.length >= 2) marketRegime = 'ROTATION';

  let actionableRecommendation = '';
  if (criticalItems.length > 0) {
    actionableRecommendation = `Prioritize triage on ${criticalItems.length} flagged positions. Check thesis notes for stop-loss and trim targets.`;
  } else {
    actionableRecommendation = 'Positions remain calm and within expected volatility channels. No emergency intervention needed.';
  }

  return {
    generatedAt: now,
    checkpointTimestamp: checkpointTime,
    elapsedTimeString,
    totalWatched: items.length,
    criticalCount: criticalItems.length,
    notableCount: notableItems.length,
    quietCount: quietItems.length,
    topCatalysts,
    keyTakeaways,
    marketRegime,
    actionableRecommendation
  };
}
