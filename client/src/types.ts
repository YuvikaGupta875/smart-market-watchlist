export type DataSourceType = 'live_market' | 'cached' | 'simulated';
export type FreshnessStatus = 'FRESH' | 'DELAYED' | 'STALE';
export type AttentionTier = 'CRITICAL' | 'NOTABLE' | 'NOISE';
export type SignalType = 
  | 'DELTA_SHOCK' 
  | 'RVOL_SURGE' 
  | 'BREAKOUT_52W_HIGH' 
  | 'BREAKOUT_52W_LOW' 
  | 'BREAKOUT_20D' 
  | 'RSI_OVERSOLD' 
  | 'RSI_OVERBOUGHT' 
  | 'EARNINGS_CATALYST' 
  | 'SECTOR_DIVERGENCE';

export type SignalSeverity = 'CRITICAL' | 'NOTABLE' | 'INFO';

export interface AttentionSignal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  description: string;
  timestamp: number;
}

export interface HistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  rvol: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector: string;
  sectorEtf: string;
  lastUpdated: number;
  source: DataSourceType;
  freshness: FreshnessStatus;
  latencyMs?: number;
}

export interface CatalystEvent {
  id: string;
  symbol: string;
  eventType: 'EARNINGS' | 'PRODUCT' | 'REGULATORY' | 'MACRO' | 'ANALYST';
  headline: string;
  summary: string;
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  eventDate: number;
  source: string;
}

export interface SessionDelta {
  checkpointPrice: number;
  checkpointTimestamp: number;
  currentPrice: number;
  priceDelta: number;
  percentDelta: number;
  elapsedHours: number;
}

export interface WatchlistItemAnalysis {
  symbol: string;
  quote: MarketQuote;
  sessionDelta: SessionDelta;
  attentionScore: number;
  attentionTier: AttentionTier;
  signals: AttentionSignal[];
  history: HistoricalCandle[];
  catalysts: CatalystEvent[];
  sectorDivergencePercent: number;
  userNotes?: string;
  alertThreshold?: number;
}

export interface ExecutiveBriefing {
  generatedAt: number;
  checkpointTimestamp: number;
  elapsedTimeString: string;
  totalWatched: number;
  criticalCount: number;
  notableCount: number;
  quietCount: number;
  topCatalysts: string[];
  keyTakeaways: string[];
  marketRegime: 'RISK_ON' | 'RISK_OFF' | 'ROTATION' | 'NEUTRAL';
  actionableRecommendation: string;
}

export interface UserPersona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  defaultWatchlistId: string;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  notes?: string;
  alertThreshold?: number;
  addedAt: number;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  items: WatchlistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface UserCheckpoint {
  userId: string;
  checkpointTime: number;
  snapshotPrices: Record<string, number>;
  updatedAt: number;
}

export interface CircuitBreakerStatus {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  activeProvider: DataSourceType;
}

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
