import React, { useState, useEffect } from 'react';
import { WatchlistItemAnalysis } from '../types';
import { Sparkline } from './Sparkline';
import { 
  X, 
  Clock, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Save, 
  Trash2, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Bell
} from 'lucide-react';

interface TickerDrawerProps {
  item: WatchlistItemAnalysis | null;
  onClose: () => void;
  onUpdateNotes: (symbol: string, notes: string, alertThreshold?: number) => void;
  onRemoveItem: (symbol: string) => void;
}

export const TickerDrawer: React.FC<TickerDrawerProps> = ({
  item,
  onClose,
  onUpdateNotes,
  onRemoveItem
}) => {
  if (!item) return null;

  const { quote, sessionDelta, attentionScore, attentionTier, signals, history, catalysts } = item;
  const [notes, setNotes] = useState(item.userNotes || '');
  const [alertThreshold, setAlertThreshold] = useState<string>(item.alertThreshold ? String(item.alertThreshold) : '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNotes(item.userNotes || '');
    setAlertThreshold(item.alertThreshold ? String(item.alertThreshold) : '');
    setIsSaved(false);
  }, [item]);

  const handleSaveNotes = () => {
    const thresh = alertThreshold ? parseFloat(alertThreshold) : undefined;
    onUpdateNotes(quote.symbol, notes, thresh);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isPositiveToday = quote.change >= 0;
  const isPositiveSession = sessionDelta.percentDelta >= 0;

  // 52-Week Range calculation
  const rangeSpan = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow || 1;
  const currentPos = Math.max(0, Math.min(100, ((quote.price - quote.fiftyTwoWeekLow) / rangeSpan) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{quote.symbol}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {quote.sector}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  attentionTier === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  attentionTier === 'NOTABLE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  Attn {attentionScore} / 100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{quote.name}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 flex-1">
            {/* Price & Delta Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Price</span>
                <div className="text-2xl font-black text-white mt-1">${quote.price.toFixed(2)}</div>
                <div className={`text-xs font-bold flex items-center gap-1 mt-1 ${isPositiveToday ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositiveToday ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isPositiveToday ? '+' : ''}{quote.changePercent}% (${isPositiveToday ? '+' : ''}{quote.change}) today</span>
                </div>
              </div>

              <div className="border-l border-slate-800/80 pl-4">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Δ Since Checkpoint</span>
                </span>
                <div className={`text-2xl font-black mt-1 ${isPositiveSession ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositiveSession ? '+' : ''}{sessionDelta.percentDelta}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  from ${sessionDelta.checkpointPrice.toFixed(2)} ({sessionDelta.elapsedHours}h ago)
                </div>
              </div>
            </div>

            {/* Sparkline Expanded with Checkpoint marker */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">30-Day Trajectory & Checkpoint</span>
                <span className="text-[11px] text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  <span>Dashed Line: Checkpoint</span>
                </span>
              </div>
              <Sparkline
                candles={history}
                checkpointTime={sessionDelta.checkpointTimestamp}
                checkpointPrice={sessionDelta.checkpointPrice}
                width={420}
                height={90}
                isPositive={isPositiveSession}
              />
            </div>

            {/* Audit Timeline of Signals & Anomalies */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Anomalies & Meaningful Changes Detected</span>
              </h3>

              {signals.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800 italic">
                  No abnormal catalysts or volatility breaches detected. Stock is moving within standard statistical drift.
                </div>
              ) : (
                <div className="space-y-2">
                  {signals.map((sig) => (
                    <div
                      key={sig.id}
                      className={`p-3 rounded-lg border text-xs ${
                        sig.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      }`}
                    >
                      <div className="font-bold text-slate-100 flex items-center justify-between">
                        <span>{sig.title}</span>
                        <span className="text-[10px] opacity-70">
                          {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                        {sig.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Factor Diagnostics: RVOL & 52-Week Range */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Factor Diagnostics</h3>
              
              {/* RVOL Bar */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Relative Volume (RVOL)</span>
                  <span className="font-bold text-slate-200">{quote.rvol}x (vs 20D Avg)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${quote.rvol >= 2.0 ? 'bg-purple-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (quote.rvol / 4) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 52-Week Range Progress */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">52-Week Range</span>
                  <span className="font-bold text-slate-200">${quote.fiftyTwoWeekLow.toFixed(2)} - ${quote.fiftyTwoWeekHigh.toFixed(2)}</span>
                </div>
                <div className="relative w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="absolute top-0 bottom-0 bg-blue-500 rounded-full"
                    style={{ left: '0%', width: `${currentPos}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow"
                    style={{ left: `calc(${currentPos}% - 7px)` }}
                  />
                </div>
              </div>
            </div>

            {/* Thesis Notes & Threshold Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>My Thesis & Alert Rules</span>
                </h3>
                {isSaved && <span className="text-xs text-emerald-400 font-semibold">Saved!</span>}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Document your investment thesis, catalysts to watch, stop-loss plan..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
              />

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Custom Alert (±%):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">
              Data source: {quote.source} ({quote.freshness})
            </span>

            <button
              onClick={() => {
                if (confirm(`Remove ${quote.symbol} from this watchlist?`)) {
                  onRemoveItem(quote.symbol);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Ticker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
