import React from 'react';
import { WatchlistItemAnalysis } from '../types';
import { Sparkline } from './Sparkline';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  AlertCircle, 
  Flame, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface WatchlistCardProps {
  item: WatchlistItemAnalysis;
  onSelect: (item: WatchlistItemAnalysis) => void;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ item, onSelect }) => {
  const { quote, sessionDelta, attentionScore, attentionTier, signals, history } = item;
  const isPositiveToday = quote.change >= 0;
  const isPositiveSession = sessionDelta.percentDelta >= 0;

  const getScoreTheme = (score: number, tier: string) => {
    if (tier === 'CRITICAL' || score >= 70) {
      return {
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        ring: 'border-rose-500/30 hover:border-rose-500/60',
        dot: 'bg-rose-500 animate-pulse'
      };
    }
    if (tier === 'NOTABLE' || score >= 40) {
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        ring: 'border-amber-500/30 hover:border-amber-500/60',
        dot: 'bg-amber-500'
      };
    }
    return {
      badge: 'bg-slate-800 text-slate-400 border-slate-700/50',
      ring: 'border-slate-800 hover:border-slate-700',
      dot: 'bg-slate-500'
    };
  };

  const theme = getScoreTheme(attentionScore, attentionTier);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative bg-slate-900/80 hover:bg-slate-850 border ${theme.ring} rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl flex flex-col justify-between overflow-hidden`}
    >
      {/* Top row: Symbol, Name, Attention Score Gauge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide group-hover:text-blue-400 transition">
                {quote.symbol}
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                {quote.sector}
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[170px] mt-0.5">
              {quote.name}
            </div>
          </div>

          {/* Attention Score Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${theme.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
            <span>{attentionScore}</span>
            <span className="text-[9px] font-normal opacity-70">ATTN</span>
          </div>
        </div>

        {/* Pricing & Temporal Delta Comparison */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
          {/* Current Price & Today */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Current Price</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              ${quote.price.toFixed(2)}
            </div>
            <div className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${isPositiveToday ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveToday ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositiveToday ? '+' : ''}{quote.changePercent}% today</span>
            </div>
          </div>

          {/* Δ Since Last Checkpoint */}
          <div className="border-l border-slate-800/80 pl-2.5">
            <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>Since Review</span>
            </div>
            <div className={`text-sm font-bold mt-0.5 ${isPositiveSession ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositiveSession ? '+' : ''}{sessionDelta.percentDelta}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              from ${sessionDelta.checkpointPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Signal Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
          {/* RVOL Badge */}
          {quote.rvol >= 1.5 && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${
              quote.rvol >= 2.5 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              <Activity className="w-2.5 h-2.5" />
              <span>{quote.rvol}x Vol</span>
            </span>
          )}

          {/* Sector Divergence */}
          {Math.abs(item.sectorDivergencePercent) >= 3.0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              <span>vs {quote.sectorEtf} {item.sectorDivergencePercent > 0 ? '+' : ''}{item.sectorDivergencePercent}%</span>
            </span>
          )}

          {/* Signal Highlight Badges */}
          {signals.slice(0, 2).map((sig, idx) => (
            <span 
              key={idx}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border truncate max-w-[180px] ${
                sig.severity === 'CRITICAL' 
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {sig.title}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom row: Sparkline chart with Checkpoint Reference */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-0.5 bg-blue-400 inline-block" />
            <span>Marker: Checkpoint</span>
          </span>
          <span className="text-[9px] text-slate-600">
            {quote.source === 'live_market' ? 'Live feed' : quote.source}
          </span>
        </div>

        <Sparkline
          candles={history}
          checkpointTime={sessionDelta.checkpointTimestamp}
          checkpointPrice={sessionDelta.checkpointPrice}
          width={140}
          height={42}
          isPositive={isPositiveSession}
        />
      </div>
    </div>
  );
};
