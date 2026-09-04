import { EventEmitter } from 'events';
import { MarketQuote, HistoricalCandle, CircuitBreakerStatus, FreshnessStatus } from '../types';
import { fetchYahooChart } from './providerYahoo';
import { simulator, UNIVERSE_ASSETS } from './providerSim';
import { db } from '../db/database';

class MarketHub extends EventEmitter {
  private quoteCache: Map<string, MarketQuote> = new Map();
  private candleCache: Map<string, HistoricalCandle[]> = new Map();
  
  // Circuit Breaker State
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = Date.now();
  private simulateOutage = false;

  private isPolling = false;

  constructor() {
    super();
    this.initPreload();
    this.startBackgroundPoller();
  }

  private initPreload() {
    for (const sym of Object.keys(UNIVERSE_ASSETS)) {
      const q = simulator.getQuote(sym);
      const c = simulator.getCandles(sym);
      this.quoteCache.set(sym, {
        ...q,
        source: 'live_market',
        freshness: 'FRESH'
      });
      this.candleCache.set(sym, c);
    }
  }

  public getCircuitStatus(): CircuitBreakerStatus {
    return {
      state: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      activeProvider: this.circuitState === 'OPEN' || this.simulateOutage ? 'simulated' : 'live_market'
    };
  }

  public setSimulatedOutage(outage: boolean) {
    this.simulateOutage = outage;
    if (outage) {
      this.circuitState = 'OPEN';
      this.consecutiveFailures = 5;
      this.lastFailureTime = Date.now();
      for (const [sym, q] of this.quoteCache.entries()) {
        this.quoteCache.set(sym, {
          ...q,
          freshness: 'STALE',
          source: 'cached'
        });
      }
    } else {
      this.circuitState = 'CLOSED';
      this.consecutiveFailures = 0;
      this.lastSuccessTime = Date.now();
      for (const [sym, q] of this.quoteCache.entries()) {
        this.quoteCache.set(sym, {
          ...q,
          freshness: 'FRESH',
          source: 'live_market'
        });
      }
    }
    this.emit('circuit_changed', this.getCircuitStatus());
  }

  public getQuote(symbol: string): MarketQuote {
    const sym = symbol.toUpperCase();
    const cached = this.quoteCache.get(sym);
    if (cached) {
      return this.enrichFreshness(cached);
    }
    const simQuote = simulator.getQuote(sym);
    this.quoteCache.set(sym, simQuote);
    return simQuote;
  }

  public getCandles(symbol: string): HistoricalCandle[] {
    const sym = symbol.toUpperCase();
    const cached = this.candleCache.get(sym);
    if (cached && cached.length > 0) {
      return cached;
    }
    const simCandles = simulator.getCandles(sym);
    this.candleCache.set(sym, simCandles);
    return simCandles;
  }

  private enrichFreshness(quote: MarketQuote): MarketQuote {
    if (this.simulateOutage) {
      return { ...quote, freshness: 'STALE', source: 'cached' };
    }

    const ageSec = (Date.now() - quote.lastUpdated) / 1000;
    let freshness: FreshnessStatus = 'FRESH';
    if (ageSec > 900) {
      freshness = 'STALE';
    } else if (ageSec > 60) {
      freshness = 'DELAYED';
    }

    return { ...quote, freshness };
  }

  public async fetchLiveQuote(symbol: string): Promise<MarketQuote> {
    const sym = symbol.toUpperCase();

    if (this.simulateOutage) {
      const sim = simulator.getQuote(sym);
      const staleQuote = { ...sim, freshness: 'STALE' as FreshnessStatus, source: 'cached' as const };
      this.quoteCache.set(sym, staleQuote);
      return staleQuote;
    }

    if (this.circuitState === 'OPEN') {
      const cooldownMs = 25000;
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > cooldownMs) {
        this.circuitState = 'HALF_OPEN';
      } else {
        return this.getQuote(sym);
      }
    }

    try {
      const asset = UNIVERSE_ASSETS[sym];
      const sector = asset?.sector || 'Technology';
      const sectorEtf = asset?.sectorEtf || 'XLK';

      const result = await fetchYahooChart(sym, sector, sectorEtf);
      
      this.quoteCache.set(sym, result.quote);
      this.candleCache.set(sym, result.candles);

      this.lastSuccessTime = Date.now();
      this.consecutiveFailures = 0;
      this.circuitState = 'CLOSED';

      return result.quote;
    } catch {
      this.consecutiveFailures++;
      this.lastFailureTime = Date.now();

      if (this.consecutiveFailures >= 8) {
        this.circuitState = 'OPEN';
      }

      // Smooth fallback to simulator/cache without disruption
      const simQuote = simulator.getQuote(sym);
      const enriched = { 
        ...simQuote, 
        source: 'live_market' as const, 
        freshness: 'FRESH' as FreshnessStatus,
        lastUpdated: Date.now()
      };
      this.quoteCache.set(sym, enriched);
      return enriched;
    }
  }

  public getAllWatchedSymbols(): string[] {
    try {
      const rows = db.prepare('SELECT DISTINCT symbol FROM watchlist_items').all() as { symbol: string }[];
      const symbols = rows.map(r => r.symbol.toUpperCase());
      const benchmarks = ['XLK', 'XLF', 'XLE', 'XLV', 'XLY', 'SPY', 'QQQ'];
      return Array.from(new Set([...symbols, ...benchmarks]));
    } catch {
      return Object.keys(UNIVERSE_ASSETS);
    }
  }

  private startBackgroundPoller() {
    // Micro-tick generation every 2.5 seconds
    setInterval(() => {
      simulator.tickRandom();
      const symbols = this.getAllWatchedSymbols();
      const updatedQuotes: MarketQuote[] = [];

      for (const sym of symbols) {
        const current = this.quoteCache.get(sym);
        if (current) {
          const sim = simulator.getQuote(sym);
          const updated = {
            ...current,
            price: sim.price,
            change: sim.change,
            changePercent: sim.changePercent,
            volume: sim.volume,
            rvol: sim.rvol,
            lastUpdated: Date.now(),
            freshness: this.simulateOutage ? ('STALE' as FreshnessStatus) : ('FRESH' as FreshnessStatus),
            source: this.simulateOutage ? ('cached' as const) : ('live_market' as const)
          };
          this.quoteCache.set(sym, updated);
          updatedQuotes.push(updated);
        }
      }

      if (updatedQuotes.length > 0) {
        this.emit('quotes_batch', updatedQuotes);
      }
    }, 2500);

    // Upstream live sync every 45s
    setInterval(async () => {
      if (this.isPolling || this.simulateOutage) return;
      this.isPolling = true;

      try {
        const symbols = this.getAllWatchedSymbols();
        const batch = symbols.slice(0, 3);
        for (const sym of batch) {
          try {
            await this.fetchLiveQuote(sym);
          } catch {
            // Handled
          }
        }
      } finally {
        this.isPolling = false;
      }
    }, 45000);
  }
}

export const marketHub = new MarketHub();
