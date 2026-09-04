import React, { useState } from 'react';
import { ExecutiveBriefing as BriefingType } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ExecutiveBriefingProps {
  briefing: BriefingType;
  onCommitCheckpoint: () => void;
  onOpenSimulator: () => void;
  isCommitting: boolean;
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  briefing,
  onCommitCheckpoint,
  onOpenSimulator,
  isCommitting
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'RISK_ON': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'RISK_OFF': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ROTATION': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 rounded-xl p-5 shadow-2xl backdrop-blur relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Executive Market Briefing</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRegimeColor(briefing.marketRegime)}`}>
                {briefing.marketRegime.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Changes accrued since your last review <span className="font-medium text-slate-200">{briefing.elapsedTimeString}</span> ({new Date(briefing.checkpointTimestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
            </p>
          </div>
        </div>

        {/* Quick Triage Counts & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {briefing.criticalCount} Critical
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md font-semibold">
              {briefing.notableCount} Notable
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 text-slate-400 border border-slate-700/40 px-2.5 py-1 rounded-md">
              {briefing.quietCount} Quiet
            </div>
          </div>

          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
            title="Open Time Machine & Scenario Simulator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Time Machine</span>
          </button>

          <button
            onClick={onCommitCheckpoint}
            disabled={isCommitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-lg shadow-blue-500/20 border border-blue-400/30 transition transform active:scale-95"
            title="Save current market prices as your new checkpoint baseline"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCommitting ? 'Updating...' : 'Mark Reviewed'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Briefing Content */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Key Takeaways */}
          <div className="lg:col-span-2 space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">High-Priority Takeaways</h3>
            <ul className="space-y-1.5">
              {briefing.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-blue-400 font-bold mt-0.5">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Advice & Catalysts */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Triage Recommendation</h3>
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200">
              <p className="leading-relaxed font-medium">
                {briefing.actionableRecommendation}
              </p>
            </div>

            {briefing.topCatalysts.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recent Catalysts in Delta Window</div>
                <div className="space-y-1">
                  {briefing.topCatalysts.slice(0, 2).map((cat, i) => (
                    <div key={i} className="text-[11px] text-slate-300 truncate bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
