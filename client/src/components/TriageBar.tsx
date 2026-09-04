import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  Search, 
  VolumeX, 
  Volume2, 
  ShieldAlert,
  Flame
} from 'lucide-react';
import { AttentionTier } from '../types';

interface TriageBarProps {
  activeTier: 'ALL' | AttentionTier;
  onSelectTier: (tier: 'ALL' | AttentionTier) => void;
  counts: { all: number; critical: number; notable: number; noise: number };
  hideNoise: boolean;
  onToggleHideNoise: () => void;
  sortBy: 'attention' | 'sessionDelta' | 'todayDelta' | 'symbol';
  onSortChange: (sort: 'attention' | 'sessionDelta' | 'todayDelta' | 'symbol') => void;
  selectedSector: string;
  onSectorChange: (sector: string) => void;
  sectors: string[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TriageBar: React.FC<TriageBarProps> = ({
  activeTier,
  onSelectTier,
  counts,
  hideNoise,
  onToggleHideNoise,
  sortBy,
  onSortChange,
  selectedSector,
  onSectorChange,
  sectors,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Top Row: Tier Tabs & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800/80">
          <button
            onClick={() => onSelectTier('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTier === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>All Items</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => onSelectTier('CRITICAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTier === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>High Attention</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold">
              {counts.critical}
            </span>
          </button>

          <button
            onClick={() => onSelectTier('NOTABLE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTier === 'NOTABLE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span>Notable Shifts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              {counts.notable}
            </span>
          </button>

          <button
            onClick={() => onSelectTier('NOISE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTier === 'NOISE'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Quiet Drift</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-400">
              {counts.noise}
            </span>
          </button>
        </div>

        {/* Right side toggles: Hide Noise, View Toggle */}
        <div className="flex items-center gap-2">
          {/* Hide Noise Button */}
          <button
            onClick={onToggleHideNoise}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              hideNoise
                ? 'bg-purple-900/40 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Filter out low-attention items (<40 attention score) to focus purely on material signals"
          >
            {hideNoise ? <VolumeX className="w-3.5 h-3.5 text-purple-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{hideNoise ? 'Noise Filtered' : 'Filter Noise'}</span>
          </button>

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-lg border border-slate-800">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded transition ${
                viewMode === 'table' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Terminal Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Search, Sort by, Sector filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by symbol, company, signal..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Sector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => onSectorChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Sectors</option>
              {sectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="attention">Attention Score (Highest First)</option>
              <option value="sessionDelta">Δ Since Review (Absolute %)</option>
              <option value="todayDelta">Today's % Change</option>
              <option value="symbol">Ticker (A - Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
