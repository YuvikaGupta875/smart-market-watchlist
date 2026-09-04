import {
  UserPersona,
  Watchlist,
  WatchlistItemAnalysis,
  ExecutiveBriefing,
  UserCheckpoint,
  CircuitBreakerStatus,
  UniverseAsset,
  MarketQuote
} from './types';

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchUsers(): Promise<UserPersona[]> {
  const res = await fetch(`${BASE_URL}/watchlists/users`);
  const data = await res.json();
  return data.users || [];
}

export async function fetchWatchlists(userId: string): Promise<Watchlist[]> {
  const res = await fetch(`${BASE_URL}/watchlists?userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  return data.watchlists || [];
}

export async function createWatchlist(userId: string, name: string): Promise<Watchlist> {
  const res = await fetch(`${BASE_URL}/watchlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  const data = await res.json();
  return data.watchlist;
}

export async function deleteWatchlist(watchlistId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}`, { method: 'DELETE' });
  const data = await res.json();
  return data.success;
}

export async function addWatchlistItem(watchlistId: string, symbol: string, notes?: string, alertThreshold?: number) {
  const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, notes, alertThreshold })
  });
  return res.json();
}

export async function removeWatchlistItem(watchlistId: string, symbol: string) {
  const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items/${symbol}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function updateWatchlistItem(watchlistId: string, symbol: string, notes?: string, alertThreshold?: number) {
  const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items/${symbol}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, alertThreshold })
  });
  return res.json();
}

export async function fetchAttentionAnalysis(userId: string, watchlistId: string): Promise<{
  checkpoint: UserCheckpoint;
  briefing: ExecutiveBriefing;
  items: WatchlistItemAnalysis[];
}> {
  const res = await fetch(`${BASE_URL}/attention?userId=${encodeURIComponent(userId)}&watchlistId=${encodeURIComponent(watchlistId)}`);
  if (!res.ok) throw new Error('Failed to fetch attention data');
  return res.json();
}

export async function commitCheckpoint(userId: string, watchlistId?: string): Promise<UserCheckpoint> {
  const res = await fetch(`${BASE_URL}/attention/checkpoint/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, watchlistId })
  });
  const data = await res.json();
  return data.checkpoint;
}

export async function triggerTimeTravel(userId: string, mode: '1h' | '24h' | '3d' | '7d', customHours?: number) {
  const res = await fetch(`${BASE_URL}/simulation/time-travel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, mode, customHours })
  });
  return res.json();
}

export async function injectMarketShock(symbol: string, shockType: string) {
  const res = await fetch(`${BASE_URL}/simulation/shock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, shockType })
  });
  return res.json();
}

export async function toggleSimulatedOutage(enabled: boolean) {
  const res = await fetch(`${BASE_URL}/simulation/outage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function searchUniverse(query = ''): Promise<UniverseAsset[]> {
  const res = await fetch(`${BASE_URL}/market/universe?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.assets || [];
}

export async function fetchCircuitStatus(): Promise<CircuitBreakerStatus> {
  const res = await fetch(`${BASE_URL}/market/circuit`);
  const data = await res.json();
  return data.circuit;
}

export function subscribeToSSE(
  onQuotes: (quotes: MarketQuote[]) => void,
  onCircuit: (circuit: CircuitBreakerStatus) => void
): () => void {
  const eventSource = new EventSource(`${BASE_URL}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'QUOTES_UPDATE' && Array.isArray(data.quotes)) {
        onQuotes(data.quotes);
      } else if (data.type === 'CIRCUIT_UPDATE' && data.circuit) {
        onCircuit(data.circuit);
      } else if (data.type === 'CONNECTED' && data.circuit) {
        onCircuit(data.circuit);
      }
    } catch {
      // ignore parse error
    }
  };

  return () => {
    eventSource.close();
  };
}
