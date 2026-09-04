import React from 'react';
import { UserPersona, Watchlist, CircuitBreakerStatus } from '../types';
import { 
  Activity, 
  Layers, 
  Plus, 
  SlidersHorizontal, 
  Wifi, 
  WifiOff, 
  Radio, 
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  users: UserPersona[];
  activeUser: UserPersona | null;
  onSelectUser: (user: UserPersona) => void;
  watchlists: Watchlist[];
  activeWatchlist: Watchlist | null;
  onSelectWatchlist: (wl: Watchlist) => void;
  circuit: CircuitBreakerStatus | null;
  onOpenSimulator: () => void;
  onOpenAddTicker: () => void;
  onOpenNewWatchlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  users,
  activeUser,
  onSelectUser,
  watchlists,
  activeWatchlist,
  onSelectWatchlist,
  circuit,
  onOpenSimulator,
  onOpenAddTicker,
  onOpenNewWatchlist
}) => {
  const isLive = circuit?.state === 'CLOSED' && circuit?.activeProvider === 'live_market';
  const isOutage = circuit?.state === 'OPEN';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm">
            Δ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">DeltaWatch</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Market Watchlist & Meaningful Change Triage</p>
          </div>
        </div>

        {/* Center: Watchlist Switcher & Add Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>List:</span>
            </span>

            <select
              value={activeWatchlist?.id || ''}
              onChange={(e) => {
                const target = watchlists.find(w => w.id === e.target.value);
                if (target) onSelectWatchlist(target);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {watchlists.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.itemCount})
                </option>
              ))}
            </select>

            <button
              onClick={onOpenNewWatchlist}
              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="Create new watchlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenAddTicker}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Symbol</span>
          </button>
        </div>

        {/* Right: Data Health Badge, Time Machine & User Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Data Connection & Circuit Status */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOutage 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : isLive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
            title={`Upstream Provider: ${circuit?.activeProvider || 'live_market'} (Circuit: ${circuit?.state || 'CLOSED'})`}
          >
            <span className={`w-2 h-2 rounded-full ${isOutage ? 'bg-rose-500 animate-pulse' : isLive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>{isOutage ? 'CIRCUIT OPEN (CACHED)' : isLive ? 'LIVE FEED' : 'SIMULATED SSE'}</span>
          </div>

          {/* Time Machine trigger button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
            title="Time Machine & Shock Simulator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Time Machine</span>
          </button>

          {/* Persona Switcher Dropdown */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {activeUser && (
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
            )}
            <select
              value={activeUser?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value);
                if (user) onSelectUser(user);
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer max-w-[130px] truncate"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
