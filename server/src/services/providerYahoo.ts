import { MarketQuote, HistoricalCandle } from '../types';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

export interface YahooFetchResult {
  quote: MarketQuote;
  candles: HistoricalCandle[];
}

export async function fetchYahooChart(symbol: string, sector = 'Technology', sectorEtf = 'XLK'): Promise<YahooFetchResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
  const controller = new AbortController();
  // Quick 3.5s timeout: if Yahoo is slow/throttling, fail fast to simulator fallback
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  const startTime = Date.now();

  try {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.meta) {
      throw new Error(`Invalid response structure for symbol ${symbol}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.chartPreviousClose || 100;
    const prevClose = meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    const volume = meta.regularMarketVolume || 10000000;
    
    // Parse historical candles
    const timestamps: number[] = result.timestamp || [];
    const quoteData = result.indicators?.quote?.[0] || {};
    const opens: number[] = quoteData.open || [];
    const highs: number[] = quoteData.high || [];
    const lows: number[] = quoteData.low || [];
    const closes: number[] = quoteData.close || [];
    const volumes: number[] = quoteData.volume || [];

    const candles: HistoricalCandle[] = [];
    let volumeSum = 0;
    let volumeCount = 0;

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c !== null && c !== undefined) {
        const v = volumes[i] || volume;
        candles.push({
          timestamp: timestamps[i] * 1000,
          open: opens[i] || c,
          high: highs[i] || c,
          low: lows[i] || c,
          close: c,
          volume: v
        });
        volumeSum += v;
        volumeCount++;
      }
    }

    const avgVolume = volumeCount > 0 ? Math.round(volumeSum / volumeCount) : volume;
    const rvol = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 1.0;
    const latencyMs = Date.now() - startTime;

    const quote: MarketQuote = {
      symbol: meta.symbol.toUpperCase(),
      name: meta.longName || meta.shortName || meta.symbol,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume,
      avgVolume,
      rvol,
      dayHigh: meta.regularMarketDayHigh || price * 1.01,
      dayLow: meta.regularMarketDayLow || price * 0.99,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price * 1.25,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price * 0.75,
      sector,
      sectorEtf,
      lastUpdated: Date.now(),
      source: 'live_market',
      freshness: 'FRESH',
      latencyMs
    };

    return { quote, candles };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
