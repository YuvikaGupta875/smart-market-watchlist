import React from 'react';
import { WatchlistItemAnalysis } from '../types';
import { Sparkline } from './Sparkline';
import { TrendingUp, TrendingDown, Clock, Activity, ChevronRight } from 'lucide-react';

interface WatchlistTableProps {
  items: WatchlistItemAnalysis[];
  onSelect: (item: WatchlistItemAnalysis) => void;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({ items, onSelect }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="py-3 px-4 font-semibold">Attn Score</th>
            <th className="py-3 px-4 font-semibold">Ticker / Company</th>
            <th className="py-3 px-4 font-semibold text-right">Price</th>
            <th className="py-3 px-4 font-semibold text-right">Today %</th>
            <th className="py-3 px-4 font-semibold text-right text-blue-400">Δ Since Review</th>
            <th className="py-3 px-4 font-semibold text-center">RVOL</th>
            <th className="py-3 px-4 font-semibold">Active Signals & Anomalies</th>
            <th className="py-3 px-4 font-semibold text-center">30D Trend</th>
            <th className="py-3 px-3 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {items.map((item) => {
            const { quote, sessionDelta, attentionScore, attentionTier, signals, history } = item;
            const isPositiveToday = quote.change >= 0;
            const isPositiveSession = sessionDelta.percentDelta >= 0;

            const scoreColor = 
              attentionTier === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
              attentionTier === 'NOTABLE' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
              'text-slate-400 bg-slate-800 border-slate-700/50';

            return (
              <tr
                key={quote.symbol}
                onClick={() => onSelect(item)}
                className="hover:bg-slate-800/50 cursor-pointer transition"
              >
                {/* Attention Score */}
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold text-xs ${scoreColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${attentionTier === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : attentionTier === 'NOTABLE' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                    <span>{attentionScore}</span>
                  </span>
                </td>

                {/* Ticker & Name */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{quote.symbol}</span>
                    <span className="text-[10px] font-normal text-slate-400 px-1 rounded bg-slate-800 border border-slate-700/40">
                      {quote.sector}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {quote.name}
                  </div>
                </td>

                {/* Price */}
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                  ${quote.price.toFixed(2)}
                </td>

                {/* Today % */}
                <td className={`py-3 px-4 text-right font-mono font-semibold ${isPositiveToday ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <div className="flex items-center justify-end gap-0.5">
                    {isPositiveToday ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPositiveToday ? '+' : ''}{quote.changePercent}%</span>
                  </div>
                </td>

                {/* Δ Since Review */}
                <td className="py-3 px-4 text-right font-mono">
                  <div className={`font-bold ${isPositiveSession ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositiveSession ? '+' : ''}{sessionDelta.percentDelta}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    from ${sessionDelta.checkpointPrice.toFixed(2)}
                  </div>
                </td>

                {/* RVOL */}
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    quote.rvol >= 2.0 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'text-slate-300'
                  }`}>
                    {quote.rvol}x
                  </span>
                </td>

                {/* Signals */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[320px]">
                    {signals.slice(0, 2).map((sig, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${
                          sig.severity === 'CRITICAL' 
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold' 
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {sig.title}
                      </span>
                    ))}
                    {signals.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">No unusual anomalies</span>
                    )}
                  </div>
                </td>

                {/* Trend Sparkline with Checkpoint */}
                <td className="py-3 px-4 text-center">
                  <Sparkline
                    candles={history}
                    checkpointTime={sessionDelta.checkpointTimestamp}
                    checkpointPrice={sessionDelta.checkpointPrice}
                    width={110}
                    height={32}
                    isPositive={isPositiveSession}
                  />
                </td>

                {/* Chevron */}
                <td className="py-3 px-3 text-right text-slate-500">
                  <ChevronRight className="w-4 h-4 hover:text-white transition" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
