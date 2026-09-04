import { MarketQuote, HistoricalCandle } from '../types';

export interface UniverseAsset {
  symbol: string;
  name: string;
  basePrice: number;
  sector: string;
  sectorEtf: string;
  avgVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  beta: number;
}

export const UNIVERSE_ASSETS: Record<string, UniverseAsset> = {
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corporation', basePrice: 228.45, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 48500000, fiftyTwoWeekHigh: 235.00, fiftyTwoWeekLow: 110.00, beta: 1.85 },
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 328.21, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 42000000, fiftyTwoWeekHigh: 344.57, fiftyTwoWeekLow: 225.95, beta: 1.05 },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 426.80, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 21500000, fiftyTwoWeekHigh: 468.35, fiftyTwoWeekLow: 388.00, beta: 1.12 },
  TSLA: { symbol: 'TSLA', name: 'Tesla, Inc.', basePrice: 254.10, sector: 'Consumer Cyclical', sectorEtf: 'XLY', avgVolume: 65000000, fiftyTwoWeekHigh: 271.00, fiftyTwoWeekLow: 138.80, beta: 2.10 },
  PLTR: { symbol: 'PLTR', name: 'Palantir Technologies', basePrice: 68.90, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 55000000, fiftyTwoWeekHigh: 69.20, fiftyTwoWeekLow: 20.40, beta: 2.45 },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', basePrice: 152.30, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 38000000, fiftyTwoWeekHigh: 227.30, fiftyTwoWeekLow: 130.00, beta: 1.70 },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 174.60, sector: 'Communication Services', sectorEtf: 'XLC', avgVolume: 24000000, fiftyTwoWeekHigh: 193.30, fiftyTwoWeekLow: 130.00, beta: 1.08 },
  META: { symbol: 'META', name: 'Meta Platforms, Inc.', basePrice: 572.40, sector: 'Communication Services', sectorEtf: 'XLC', avgVolume: 16000000, fiftyTwoWeekHigh: 602.95, fiftyTwoWeekLow: 414.50, beta: 1.30 },
  NOW: { symbol: 'NOW', name: 'ServiceNow, Inc.', basePrice: 968.50, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 1200000, fiftyTwoWeekHigh: 1040.00, fiftyTwoWeekLow: 680.00, beta: 1.25 },
  CRWD: { symbol: 'CRWD', name: 'CrowdStrike Holdings', basePrice: 334.80, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 3500000, fiftyTwoWeekHigh: 398.30, fiftyTwoWeekLow: 200.80, beta: 1.65 },
  DDOG: { symbol: 'DDOG', name: 'Datadog, Inc.', basePrice: 132.10, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 4200000, fiftyTwoWeekHigh: 138.60, fiftyTwoWeekLow: 100.20, beta: 1.45 },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase & Co.', basePrice: 221.40, sector: 'Financial Services', sectorEtf: 'XLF', avgVolume: 9200000, fiftyTwoWeekHigh: 226.50, fiftyTwoWeekLow: 143.00, beta: 0.90 },
  XOM: { symbol: 'XOM', name: 'Exxon Mobil Corporation', basePrice: 118.80, sector: 'Energy', sectorEtf: 'XLE', avgVolume: 14000000, fiftyTwoWeekHigh: 126.34, fiftyTwoWeekLow: 97.48, beta: 0.75 },
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', basePrice: 161.20, sector: 'Healthcare', sectorEtf: 'XLV', avgVolume: 7100000, fiftyTwoWeekHigh: 168.96, fiftyTwoWeekLow: 143.16, beta: 0.55 },
  SPY: { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', basePrice: 574.50, sector: 'Index Benchmark', sectorEtf: 'SPY', avgVolume: 58000000, fiftyTwoWeekHigh: 578.00, fiftyTwoWeekLow: 410.00, beta: 1.00 },
  QQQ: { symbol: 'QQQ', name: 'Invesco QQQ Trust', basePrice: 492.30, sector: 'Index Benchmark', sectorEtf: 'QQQ', avgVolume: 42000000, fiftyTwoWeekHigh: 503.50, fiftyTwoWeekLow: 350.00, beta: 1.20 },
  GLD: { symbol: 'GLD', name: 'SPDR Gold Trust', basePrice: 236.40, sector: 'Commodities', sectorEtf: 'GLD', avgVolume: 6500000, fiftyTwoWeekHigh: 242.00, fiftyTwoWeekLow: 172.00, beta: 0.15 },
  COIN: { symbol: 'COIN', name: 'Coinbase Global, Inc.', basePrice: 312.80, sector: 'Financial Tech', sectorEtf: 'XLK', avgVolume: 11500000, fiftyTwoWeekHigh: 345.00, fiftyTwoWeekLow: 114.00, beta: 3.20 },
  MSTR: { symbol: 'MSTR', name: 'MicroStrategy Inc.', basePrice: 284.50, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 18000000, fiftyTwoWeekHigh: 310.00, fiftyTwoWeekLow: 45.00, beta: 3.80 },
  ARM: { symbol: 'ARM', name: 'Arm Holdings plc', basePrice: 144.20, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 12000000, fiftyTwoWeekHigh: 188.75, fiftyTwoWeekLow: 46.50, beta: 2.30 },
  SMCI: { symbol: 'SMCI', name: 'Super Micro Computer', basePrice: 44.90, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 32000000, fiftyTwoWeekHigh: 122.90, fiftyTwoWeekLow: 26.00, beta: 2.90 },
  UBER: { symbol: 'UBER', name: 'Uber Technologies, Inc.', basePrice: 77.30, sector: 'Technology', sectorEtf: 'XLK', avgVolume: 14500000, fiftyTwoWeekHigh: 87.00, fiftyTwoWeekLow: 56.00, beta: 1.35 },
  // Sector ETFs for benchmark comparison
  XLK: { symbol: 'XLK', name: 'Technology Select Sector SPDR', basePrice: 226.50, sector: 'Sector ETF', sectorEtf: 'XLK', avgVolume: 7500000, fiftyTwoWeekHigh: 232.00, fiftyTwoWeekLow: 160.00, beta: 1.15 },
  XLF: { symbol: 'XLF', name: 'Financial Select Sector SPDR', basePrice: 46.20, sector: 'Sector ETF', sectorEtf: 'XLF', avgVolume: 35000000, fiftyTwoWeekHigh: 47.10, fiftyTwoWeekLow: 33.00, beta: 0.85 },
  XLE: { symbol: 'XLE', name: 'Energy Select Sector SPDR', basePrice: 89.40, sector: 'Sector ETF', sectorEtf: 'XLE', avgVolume: 16000000, fiftyTwoWeekHigh: 98.00, fiftyTwoWeekLow: 76.00, beta: 0.80 },
  XLV: { symbol: 'XLV', name: 'Health Care Select Sector SPDR', basePrice: 148.90, sector: 'Sector ETF', sectorEtf: 'XLV', avgVolume: 8000000, fiftyTwoWeekHigh: 154.00, fiftyTwoWeekLow: 128.00, beta: 0.60 },
  XLY: { symbol: 'XLY', name: 'Consumer Discretionary SPDR', basePrice: 194.20, sector: 'Sector ETF', sectorEtf: 'XLY', avgVolume: 5000000, fiftyTwoWeekHigh: 202.00, fiftyTwoWeekLow: 150.00, beta: 1.25 }
};

export class MarketSimulator {
  private currentPrices: Map<string, number> = new Map();
  private currentVolumes: Map<string, number> = new Map();
  private dayOpens: Map<string, number> = new Map();
  private priceOffsets: Map<string, number> = new Map(); // For scenario shock injection
  private rvolMultipliers: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    for (const [sym, asset] of Object.entries(UNIVERSE_ASSETS)) {
      this.currentPrices.set(sym, asset.basePrice);
      this.dayOpens.set(sym, asset.basePrice * (1 + (Math.random() * 0.01 - 0.005)));
      this.currentVolumes.set(sym, Math.round(asset.avgVolume * (0.85 + Math.random() * 0.4)));
    }
  }

  public getQuote(symbol: string): MarketQuote {
    const sym = symbol.toUpperCase();
    const asset = UNIVERSE_ASSETS[sym] || {
      symbol: sym,
      name: sym,
      basePrice: 100.00,
      sector: 'General',
      sectorEtf: 'SPY',
      avgVolume: 10000000,
      fiftyTwoWeekHigh: 125.00,
      fiftyTwoWeekLow: 75.00,
      beta: 1.0
    };

    let base = this.currentPrices.get(sym) || asset.basePrice;
    const shockOffset = this.priceOffsets.get(sym) || 0;
    const price = Number((base * (1 + shockOffset)).toFixed(2));
    const open = this.dayOpens.get(sym) || (price * 0.99);
    const change = Number((price - open).toFixed(2));
    const changePercent = Number(((change / open) * 100).toFixed(2));

    const rvolMul = this.rvolMultipliers.get(sym) || 1.0;
    const volume = Math.round((this.currentVolumes.get(sym) || asset.avgVolume) * rvolMul);
    const rvol = Number((volume / asset.avgVolume).toFixed(2));

    return {
      symbol: sym,
      name: asset.name,
      price,
      change,
      changePercent,
      volume,
      avgVolume: asset.avgVolume,
      rvol,
      dayHigh: Number((Math.max(price, open) * 1.008).toFixed(2)),
      dayLow: Number((Math.min(price, open) * 0.992).toFixed(2)),
      fiftyTwoWeekHigh: Math.max(asset.fiftyTwoWeekHigh, price),
      fiftyTwoWeekLow: Math.min(asset.fiftyTwoWeekLow, price),
      sector: asset.sector,
      sectorEtf: asset.sectorEtf,
      lastUpdated: Date.now(),
      source: 'simulated',
      freshness: 'FRESH'
    };
  }

  public getCandles(symbol: string, days = 30): HistoricalCandle[] {
    const sym = symbol.toUpperCase();
    const quote = this.getQuote(sym);
    const candles: HistoricalCandle[] = [];
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;

    let walkPrice = quote.price * (1 - (days * 0.002));
    for (let i = days; i >= 1; i--) {
      const dayTime = now - i * dayMs;
      const dailyVolatility = 0.018;
      const change = (Math.random() - 0.48) * dailyVolatility;
      const open = walkPrice;
      walkPrice = walkPrice * (1 + change);
      const close = walkPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const vol = Math.round(quote.avgVolume * (0.7 + Math.random() * 0.6));

      candles.push({
        timestamp: dayTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: vol
      });
    }

    // Add current day candle
    candles.push({
      timestamp: now,
      open: quote.price - quote.change,
      high: quote.dayHigh,
      low: quote.dayLow,
      close: quote.price,
      volume: quote.volume
    });

    return candles;
  }

  public tickRandom() {
    for (const [sym, price] of this.currentPrices.entries()) {
      // 0.05% random walk
      const delta = (Math.random() - 0.495) * 0.002;
      this.currentPrices.set(sym, Number((price * (1 + delta)).toFixed(2)));
    }
  }

  public injectShock(symbol: string, shockType: 'EARNINGS_BEAT' | 'FLASH_CRASH' | 'VOLUME_SPIKE' | 'BREAKOUT_52W') {
    const sym = symbol.toUpperCase();
    switch (shockType) {
      case 'EARNINGS_BEAT':
        this.priceOffsets.set(sym, 0.125); // +12.5% jump
        this.rvolMultipliers.set(sym, 3.8); // 3.8x volume
        break;
      case 'FLASH_CRASH':
        this.priceOffsets.set(sym, -0.065); // -6.5% drop
        this.rvolMultipliers.set(sym, 2.9);
        break;
      case 'VOLUME_SPIKE':
        this.rvolMultipliers.set(sym, 4.5); // 4.5x volume without large price change
        break;
      case 'BREAKOUT_52W':
        const asset = UNIVERSE_ASSETS[sym];
        if (asset) {
          const targetPrice = asset.fiftyTwoWeekHigh * 1.03;
          this.priceOffsets.set(sym, (targetPrice - asset.basePrice) / asset.basePrice);
          this.rvolMultipliers.set(sym, 2.5);
        }
        break;
    }
  }

  public resetShocks() {
    this.priceOffsets.clear();
    this.rvolMultipliers.clear();
    this.init();
  }
}

export const simulator = new MarketSimulator();
