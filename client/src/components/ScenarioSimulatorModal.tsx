import React, { useState } from 'react';
import { 
  triggerTimeTravel, 
  injectMarketShock, 
  toggleSimulatedOutage, 
  resetSimulation 
} from '../api';
import { 
  X, 
  Clock, 
  Zap, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  WifiOff,
  Wifi
} from 'lucide-react';

interface ScenarioSimulatorModalProps {
  userId: string;
  onClose: () => void;
  onRefreshData: () => void;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  userId,
  onClose,
  onRefreshData
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isOutageActive, setIsOutageActive] = useState(false);

  const handleTimeTravel = async (mode: '1h' | '24h' | '3d' | '7d') => {
    setLoadingAction(`time-${mode}`);
    try {
      const res = await triggerTimeTravel(userId, mode);
      setStatusMsg(res.message);
      onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleShock = async (symbol: string, shockType: string) => {
    setLoadingAction(`shock-${symbol}-${shockType}`);
    try {
      const res = await injectMarketShock(symbol, shockType);
      setStatusMsg(res.message);
      onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOutageToggle = async () => {
    const nextState = !isOutageActive;
    setLoadingAction('outage');
    try {
      await toggleSimulatedOutage(nextState);
      setIsOutageActive(nextState);
      setStatusMsg(nextState ? 'Circuit breaker TRIPPED to OPEN. Upstream feeds marked STALE/CACHED.' : 'Circuit breaker restored to CLOSED.');
      onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('reset');
    try {
      const res = await resetSimulation();
      setIsOutageActive(false);
      setStatusMsg(res.message);
      onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Evaluator Testing Lab & Time Machine</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate temporal shifts, market shocks, and test resilience under failure conditions
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status feedback bar */}
          {statusMsg && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Section 1: Time Machine (Temporal Checkpoint Shifts) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>1. Time Machine: "What Happened Since I Left?"</span>
            </div>
            <p className="text-slate-400 text-xs">
              Rewinds your personal visit checkpoint so you can test how the watchlist detects cumulative deltas and surfaces meaningful changes across different absence intervals:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleTimeTravel('1h')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200">1 Hour Ago</div>
                <div className="text-[10px] text-slate-500 mt-1">Intraday drift</div>
              </button>

              <button
                onClick={() => handleTimeTravel('24h')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200">24 Hours Ago</div>
                <div className="text-[10px] text-slate-500 mt-1">Yesterday close</div>
              </button>

              <button
                onClick={() => handleTimeTravel('3d')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-blue-500/30 bg-blue-950/20 rounded-xl text-left transition"
              >
                <div className="font-bold text-blue-300">3 Days Ago</div>
                <div className="text-[10px] text-blue-400/80 mt-1">Weekend / Long trip</div>
              </button>

              <button
                onClick={() => handleTimeTravel('7d')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition"
              >
                <div className="font-bold text-slate-200">1 Week Ago</div>
                <div className="text-[10px] text-slate-500 mt-1">Macro shift</div>
              </button>
            </div>
          </div>

          {/* Section 2: Inject Market Shocks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>2. Inject Market Shocks & Anomaly Triggers</span>
            </div>
            <p className="text-slate-400 text-xs">
              Inject real-time volatility catalysts to see the Attention Scoring Engine triage them to the top:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleShock('NVDA', 'EARNINGS_BEAT')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200">NVDA: Earnings Blowout</div>
                  <div className="text-[10px] text-rose-400 mt-0.5">+12.5% Price Surge & 3.8x Volume</div>
                </div>
                <span className="text-[10px] px-2 py-1 bg-rose-500/20 text-rose-300 rounded font-semibold">Inject</span>
              </button>

              <button
                onClick={() => handleShock('TSLA', 'FLASH_CRASH')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200">TSLA: Sudden Flash Crash</div>
                  <div className="text-[10px] text-rose-400 mt-0.5">-6.5% Plunge on 2.9x RVOL</div>
                </div>
                <span className="text-[10px] px-2 py-1 bg-rose-500/20 text-rose-300 rounded font-semibold">Inject</span>
              </button>

              <button
                onClick={() => handleShock('PLTR', 'BREAKOUT_52W')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200">PLTR: 52-Week High Breakout</div>
                  <div className="text-[10px] text-purple-400 mt-0.5">Surges through annual resistance</div>
                </div>
                <span className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-semibold">Inject</span>
              </button>

              <button
                onClick={() => handleShock('AAPL', 'VOLUME_SPIKE')}
                disabled={Boolean(loadingAction)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200">AAPL: Institutional Volume Spike</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">4.5x Normal Volume Accumulation</div>
                </div>
                <span className="text-[10px] px-2 py-1 bg-amber-500/20 text-amber-300 rounded font-semibold">Inject</span>
              </button>
            </div>
          </div>

          {/* Section 3: Resilience & Circuit Breaker */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>3. Data Resilience & Circuit Breaker Evaluation</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Test how the architecture handles upstream provider outages, timeouts, and stale data. Toggling this forces the Circuit Breaker into <code className="text-amber-300">OPEN</code> state, switches to cached quotes with timestamp tagging, and verifies zero UI degradation:
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isOutageActive ? <WifiOff className="w-5 h-5 text-rose-400" /> : <Wifi className="w-5 h-5 text-emerald-400" />}
                <div>
                  <div className="font-bold text-slate-200">
                    {isOutageActive ? 'Upstream Outage Active (Circuit Breaker Tripped)' : 'Upstream Feeds Normal'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isOutageActive ? 'Serving cached quotes tagged with STALE indicator' : 'Live Yahoo Finance & SSE active'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleOutageToggle}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                  isOutageActive 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isOutageActive ? 'Restore Connection' : 'Simulate Outage'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Scenarios</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
