import Database from 'better-sqlite3';
import path from 'path';
import { UserPersona, Watchlist, WatchlistItem, UserCheckpoint, CatalystEvent } from '../types';

const dbPath = path.join(__dirname, '../../deltawatch.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      avatar TEXT NOT NULL,
      description TEXT NOT NULL,
      default_watchlist_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id TEXT PRIMARY KEY,
      watchlist_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      notes TEXT,
      alert_threshold REAL,
      added_at INTEGER NOT NULL,
      UNIQUE(watchlist_id, symbol),
      FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_checkpoints (
      user_id TEXT PRIMARY KEY,
      checkpoint_time INTEGER NOT NULL,
      snapshot_prices TEXT NOT NULL, -- JSON string
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS catalyst_events (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      event_type TEXT NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT NOT NULL,
      impact TEXT NOT NULL,
      event_date INTEGER NOT NULL,
      source TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_watchlist_items_wl ON watchlist_items(watchlist_id);
    CREATE INDEX IF NOT EXISTS idx_catalyst_symbol ON catalyst_events(symbol);
  `);
}

// User repository
export function getAllUsers(): UserPersona[] {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    title: r.title,
    avatar: r.avatar,
    description: r.description,
    defaultWatchlistId: r.default_watchlist_id
  }));
}

export function getUserById(userId: string): UserPersona | null {
  const r = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    avatar: r.avatar,
    description: r.description,
    defaultWatchlistId: r.default_watchlist_id
  };
}

// Watchlist repository
export function getWatchlistsForUser(userId: string): Watchlist[] {
  const watchlists = db.prepare(`
    SELECT * FROM watchlists WHERE user_id = ? ORDER BY is_default DESC, created_at ASC
  `).all(userId) as any[];

  return watchlists.map(w => {
    const items = db.prepare(`
      SELECT * FROM watchlist_items WHERE watchlist_id = ? ORDER BY added_at ASC
    `).all(w.id) as any[];

    return {
      id: w.id,
      userId: w.user_id,
      name: w.name,
      isDefault: Boolean(w.is_default),
      itemCount: items.length,
      items: items.map(i => ({
        id: i.id,
        watchlistId: i.watchlist_id,
        symbol: i.symbol,
        notes: i.notes || undefined,
        alertThreshold: i.alert_threshold || undefined,
        addedAt: i.added_at
      })),
      createdAt: w.created_at,
      updatedAt: w.updated_at
    };
  });
}

export function getWatchlistById(watchlistId: string): Watchlist | null {
  const w = db.prepare('SELECT * FROM watchlists WHERE id = ?').get(watchlistId) as any;
  if (!w) return null;

  const items = db.prepare(`
    SELECT * FROM watchlist_items WHERE watchlist_id = ? ORDER BY added_at ASC
  `).all(w.id) as any[];

  return {
    id: w.id,
    userId: w.user_id,
    name: w.name,
    isDefault: Boolean(w.is_default),
    itemCount: items.length,
    items: items.map(i => ({
      id: i.id,
      watchlistId: i.watchlist_id,
      symbol: i.symbol,
      notes: i.notes || undefined,
      alertThreshold: i.alert_threshold || undefined,
      addedAt: i.added_at
    })),
    createdAt: w.created_at,
    updatedAt: w.updated_at
  };
}

export function createWatchlist(id: string, userId: string, name: string, isDefault = false): Watchlist {
  const now = Date.now();
  db.prepare(`
    INSERT INTO watchlists (id, user_id, name, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, name, isDefault ? 1 : 0, now, now);

  return {
    id,
    userId,
    name,
    isDefault,
    itemCount: 0,
    items: [],
    createdAt: now,
    updatedAt: now
  };
}

export function deleteWatchlist(watchlistId: string): boolean {
  const res = db.prepare('DELETE FROM watchlists WHERE id = ? AND is_default = 0').run(watchlistId);
  return res.changes > 0;
}

export function addWatchlistItem(id: string, watchlistId: string, symbol: string, notes?: string, alertThreshold?: number): WatchlistItem {
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO watchlist_items (id, watchlist_id, symbol, notes, alert_threshold, added_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, watchlistId, symbol.toUpperCase(), notes || null, alertThreshold || null, now);

  return {
    id,
    watchlistId,
    symbol: symbol.toUpperCase(),
    notes,
    alertThreshold,
    addedAt: now
  };
}

export function removeWatchlistItem(watchlistId: string, symbol: string): boolean {
  const res = db.prepare('DELETE FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?').run(watchlistId, symbol.toUpperCase());
  return res.changes > 0;
}

export function updateWatchlistItem(watchlistId: string, symbol: string, notes?: string, alertThreshold?: number): boolean {
  const res = db.prepare(`
    UPDATE watchlist_items 
    SET notes = COALESCE(?, notes), alert_threshold = COALESCE(?, alert_threshold)
    WHERE watchlist_id = ? AND symbol = ?
  `).run(notes !== undefined ? notes : null, alertThreshold !== undefined ? alertThreshold : null, watchlistId, symbol.toUpperCase());
  return res.changes > 0;
}

// Checkpoint repository
export function getUserCheckpoint(userId: string): UserCheckpoint | null {
  const row = db.prepare('SELECT * FROM user_checkpoints WHERE user_id = ?').get(userId) as any;
  if (!row) return null;
  return {
    userId: row.user_id,
    checkpointTime: row.checkpoint_time,
    snapshotPrices: JSON.parse(row.snapshot_prices),
    updatedAt: row.updated_at
  };
}

export function saveUserCheckpoint(userId: string, checkpointTime: number, snapshotPrices: Record<string, number>): UserCheckpoint {
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO user_checkpoints (user_id, checkpoint_time, snapshot_prices, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, checkpointTime, JSON.stringify(snapshotPrices), now);

  return {
    userId,
    checkpointTime,
    snapshotPrices,
    updatedAt: now
  };
}

// Catalyst repository
export function getCatalystsForSymbols(symbols: string[]): CatalystEvent[] {
  if (symbols.length === 0) return [];
  const placeholders = symbols.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM catalyst_events 
    WHERE symbol IN (${placeholders}) 
    ORDER BY event_date DESC
  `).all(...symbols.map(s => s.toUpperCase())) as any[];

  return rows.map(r => ({
    id: r.id,
    symbol: r.symbol,
    eventType: r.event_type,
    headline: r.headline,
    summary: r.summary,
    impact: r.impact,
    eventDate: r.event_date,
    source: r.source
  }));
}
