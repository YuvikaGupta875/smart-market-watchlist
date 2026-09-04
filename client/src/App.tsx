import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchUsers, 
  fetchWatchlists, 
  createWatchlist, 
  fetchAttentionAnalysis, 
  commitCheckpoint, 
  updateWatchlistItem, 
  removeWatchlistItem, 
  fetchCircuitStatus,
  subscribeToSSE 
} from './api';
import { 
  UserPersona, 
  Watchlist, 
  WatchlistItemAnalysis, 
  ExecutiveBriefing as BriefingType, 
  UserCheckpoint, 
  CircuitBreakerStatus, 
  AttentionTier 
} from './types';
import { Header } from './components/Header';
import { ExecutiveBriefing } from './components/ExecutiveBriefing';
import { TriageBar } from './components/TriageBar';
import { WatchlistCard } from './components/WatchlistCard';
import { WatchlistTable } from './components/WatchlistTable';
import { TickerDrawer } from './components/TickerDrawer';
import { AddTickerModal } from './components/AddTickerModal';
import { ScenarioSimulatorModal } from './components/ScenarioSimulatorModal';
import { Plus, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<UserPersona[]>([]);
  const [activeUser, setActiveUser] = useState<UserPersona | null>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<Watchlist | null>(null);

  const [checkpoint, setCheckpoint] = useState<UserCheckpoint | null>(null);
  const [briefing, setBriefing] = useState<BriefingType | null>(null);
  const [items, setItems] = useState<WatchlistItemAnalysis[]>([]);
  const [circuit, setCircuit] = useState<CircuitBreakerStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);

  // Filter & Triage state
  const [activeTier, setActiveTier] = useState<'ALL' | AttentionTier>('ALL');
  const [hideNoise, setHideNoise] = useState(false);
  const [sortBy, setSortBy] = useState<'attention' | 'sessionDelta' | 'todayDelta' | 'symbol'>('attention');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState<WatchlistItemAnalysis | null>(null);
  const [isAddTickerOpen, setIsAddTickerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isNewWatchlistOpen, setIsNewWatchlistOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  // 1. Load users & personas on initial mount
  useEffect(() => {
    fetchUsers().then((fetchedUsers) => {
      setUsers(fetchedUsers);
      if (fetchedUsers.length > 0) {
        setActiveUser(fetchedUsers[0]);
      }
    });

    fetchCircuitStatus().then(setCircuit).catch(() => {});
  }, []);

  // 2. Load watchlists when activeUser changes
  useEffect(() => {
    if (!activeUser) return;
    fetchWatchlists(activeUser.id).then((fetchedWls) => {
      setWatchlists(fetchedWls);
      if (fetchedWls.length > 0) {
        setActiveWatchlist(fetchedWls[0]);
      }
    });
  }, [activeUser]);

  // 3. Load attention analysis when activeWatchlist or activeUser changes
  const loadAnalysis = () => {
    if (!activeUser || !activeWatchlist) return;
    setLoading(true);
    fetchAttentionAnalysis(activeUser.id, activeWatchlist.id)
      .then((data) => {
        setCheckpoint(data.checkpoint);
        setBriefing(data.briefing);
        setItems(data.items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalysis();
  }, [activeUser, activeWatchlist]);

  // 4. Connect to SSE stream for live updates
  useEffect(() => {
    const unsubscribe = subscribeToSSE(
      (updatedQuotes) => {
        // Update item quotes in place
        const quoteMap = new Map(updatedQuotes.map(q => [q.symbol, q]));
        setItems((prevItems) => 
          prevItems.map((item) => {
            const freshQuote = quoteMap.get(item.symbol);
            if (!freshQuote) return item;
            
            // Recompute session delta with fresh quote
            const priceDelta = Number((freshQuote.price - item.sessionDelta.checkpointPrice).toFixed(2));
            const percentDelta = item.sessionDelta.checkpointPrice > 0 
              ? Number(((priceDelta / item.sessionDelta.checkpointPrice) * 100).toFixed(2)) 
              : 0;

            return {
              ...item,
              quote: freshQuote,
              sessionDelta: {
                ...item.sessionDelta,
                currentPrice: freshQuote.price,
                priceDelta,
                percentDelta
              }
            };
          })
        );
      },
      (freshCircuit) => {
        setCircuit(freshCircuit);
      }
    );

    return () => unsubscribe();
  }, []);

  // Commit Checkpoint ("Mark as Reviewed")
  const handleCommitCheckpoint = async () => {
    if (!activeUser || !activeWatchlist) return;
    setIsCommitting(true);
    try {
      await commitCheckpoint(activeUser.id, activeWatchlist.id);
      loadAnalysis();
    } finally {
      setIsCommitting(false);
    }
  };

  // Update Thesis Notes
  const handleUpdateNotes = async (symbol: string, notes: string, alertThreshold?: number) => {
    if (!activeWatchlist) return;
    await updateWatchlistItem(activeWatchlist.id, symbol, notes, alertThreshold);
    setItems((prev) =>
      prev.map(i => i.symbol === symbol ? { ...i, userNotes: notes, alertThreshold } : i)
    );
  };

  // Remove Item
  const handleRemoveItem = async (symbol: string) => {
    if (!activeWatchlist) return;
    await removeWatchlistItem(activeWatchlist.id, symbol);
    setItems(prev => prev.filter(i => i.symbol !== symbol));
    if (activeUser) {
      fetchWatchlists(activeUser.id).then(setWatchlists);
    }
  };

  // Create Watchlist
  const handleCreateNewWatchlist = async () => {
    if (!activeUser || !newWatchlistName.trim()) return;
    const newWl = await createWatchlist(activeUser.id, newWatchlistName.trim());
    setWatchlists(prev => [...prev, newWl]);
    setActiveWatchlist(newWl);
    setNewWatchlistName('');
    setIsNewWatchlistOpen(false);
  };

  // Filter & Sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        i => i.symbol.toLowerCase().includes(q) ||
             i.quote.name.toLowerCase().includes(q) ||
             i.quote.sector.toLowerCase().includes(q) ||
             i.signals.some(s => s.title.toLowerCase().includes(q))
      );
    }

    // Tier filter
    if (activeTier !== 'ALL') {
      result = result.filter(i => i.attentionTier === activeTier);
    }

    // Hide Noise filter
    if (hideNoise) {
      result = result.filter(i => i.attentionTier !== 'NOISE');
    }

    // Sector filter
    if (selectedSector !== 'ALL') {
      result = result.filter(i => i.quote.sector === selectedSector);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'attention':
          return b.attentionScore - a.attentionScore;
        case 'sessionDelta':
          return Math.abs(b.sessionDelta.percentDelta) - Math.abs(a.sessionDelta.percentDelta);
        case 'todayDelta':
          return Math.abs(b.quote.changePercent) - Math.abs(a.quote.changePercent);
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, activeTier, hideNoise, selectedSector, sortBy]);

  // Available unique sectors
  const sectors = useMemo(() => {
    const secSet = new Set(items.map(i => i.quote.sector));
    return Array.from(secSet);
  }, [items]);

  // Tier counts
  const counts = useMemo(() => {
    return {
      all: items.length,
      critical: items.filter(i => i.attentionTier === 'CRITICAL').length,
      notable: items.filter(i => i.attentionTier === 'NOTABLE').length,
      noise: items.filter(i => i.attentionTier === 'NOISE').length
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header
        users={users}
        activeUser={activeUser}
        onSelectUser={setActiveUser}
        watchlists={watchlists}
        activeWatchlist={activeWatchlist}
        onSelectWatchlist={setActiveWatchlist}
        circuit={circuit}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenAddTicker={() => setIsAddTickerOpen(true)}
        onOpenNewWatchlist={() => setIsNewWatchlistOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Executive Briefing Card */}
        {briefing && (
          <ExecutiveBriefing
            briefing={briefing}
            onCommitCheckpoint={handleCommitCheckpoint}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            isCommitting={isCommitting}
          />
        )}

        {/* Triage & Filter Bar */}
        <TriageBar
          activeTier={activeTier}
          onSelectTier={setActiveTier}
          counts={counts}
          hideNoise={hideNoise}
          onToggleHideNoise={() => setHideNoise(!hideNoise)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
          sectors={sectors}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Watchlist View Area */}
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Analyzing market signals and checkpoint deltas...</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No tickers match your current filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try resetting tier filters, clearing search query, or toggling off "Filter Noise".
            </p>
            <button
              onClick={() => {
                setActiveTier('ALL');
                setHideNoise(false);
                setSelectedSector('ALL');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedItems.map((item) => (
              <WatchlistCard
                key={item.symbol}
                item={item}
                onSelect={setSelectedItemForDrawer}
              />
            ))}
          </div>
        ) : (
          <WatchlistTable
            items={filteredAndSortedItems}
            onSelect={setSelectedItemForDrawer}
          />
        )}
      </main>

      {/* Slide-over Ticker Detail Drawer */}
      <TickerDrawer
        item={selectedItemForDrawer}
        onClose={() => setSelectedItemForDrawer(null)}
        onUpdateNotes={handleUpdateNotes}
        onRemoveItem={handleRemoveItem}
      />

      {/* Add Ticker Modal */}
      {isAddTickerOpen && activeWatchlist && (
        <AddTickerModal
          watchlistId={activeWatchlist.id}
          existingSymbols={items.map(i => i.symbol)}
          onClose={() => setIsAddTickerOpen(false)}
          onAdded={loadAnalysis}
        />
      )}

      {/* Scenario Simulator & Time Machine Modal */}
      {isSimulatorOpen && activeUser && (
        <ScenarioSimulatorModal
          userId={activeUser.id}
          onClose={() => setIsSimulatorOpen(false)}
          onRefreshData={loadAnalysis}
        />
      )}

      {/* Create Watchlist Modal */}
      {isNewWatchlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Watchlist</h3>
            <input
              type="text"
              autoFocus
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="e.g. Clean Energy, Small-Cap AI..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewWatchlistOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewWatchlist}
                disabled={!newWatchlistName.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
