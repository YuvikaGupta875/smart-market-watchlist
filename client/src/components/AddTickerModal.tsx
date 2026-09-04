import React, { useState, useEffect } from 'react';
import { searchUniverse, addWatchlistItem } from '../api';
import { UniverseAsset } from '../types';
import { X, Search, Plus, Check, TrendingUp } from 'lucide-react';

interface AddTickerModalProps {
  watchlistId: string;
  existingSymbols: string[];
  onClose: () => void;
  onAdded: () => void;
}

export const AddTickerModal: React.FC<AddTickerModalProps> = ({
  watchlistId,
  existingSymbols,
  onClose,
  onAdded
}) => {
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<UniverseAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<UniverseAsset | null>(null);
  const [notes, setNotes] = useState('');
  const [threshold, setThreshold] = useState('5.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    searchUniverse(query).then(setAssets).catch(() => {});
  }, [query]);

  const handleAdd = async (asset: UniverseAsset) => {
    setIsSubmitting(true);
    try {
      const thresh = threshold ? parseFloat(threshold) : undefined;
      await addWatchlistItem(watchlistId, asset.symbol, notes, thresh);
      onAdded();
      onClose();
    } catch {
      alert('Failed to add ticker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingSet = new Set(existingSymbols.map(s => s.toUpperCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h3 className="text-base font-bold text-white">Add Ticker to Watchlist</h3>
            <p className="text-xs text-slate-400 mt-0.5">Search equities, ETFs, and assets to track</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker or company name (e.g. NVDA, Tesla, XLK)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Asset List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 divide-y divide-slate-800/40">
          {assets.map((asset) => {
            const isAlreadyAdded = existingSet.has(asset.symbol.toUpperCase());
            return (
              <div
                key={asset.symbol}
                className="pt-2 flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{asset.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {asset.sector}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{asset.name}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    ${asset.basePrice.toFixed(2)}
                  </span>

                  {isAlreadyAdded ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium px-2 py-1 bg-slate-800/40 rounded">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(asset)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {assets.length === 0 && query && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400">No preset match for "{query}". You can add it as a custom symbol:</p>
              <button
                onClick={() => handleAdd({
                  symbol: query.toUpperCase(),
                  name: query.toUpperCase(),
                  basePrice: 100.0,
                  sector: 'Custom',
                  sectorEtf: 'SPY',
                  avgVolume: 10000000,
                  fiftyTwoWeekHigh: 120.0,
                  fiftyTwoWeekLow: 80.0,
                  beta: 1.0
                })}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow"
              >
                Add "{query.toUpperCase()}" Directly
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
