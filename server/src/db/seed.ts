import { db, initDatabase } from './database';

export function seedDatabase() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding DeltaWatch database with personas, watchlists, and catalysts...');

  const now = Date.now();
  const twoDaysAgo = now - 48 * 3600 * 1000;
  const threeDaysAgo = now - 72 * 3600 * 1000;

  // Insert Personas
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, title, avatar, description, default_watchlist_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'user-alex',
    'Alex Chen',
    'AI & Tech Growth PM',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Focused on enterprise AI infrastructure, semiconductor super-cycles, and platform monopolies.',
    'wl-tech-leaders',
    now
  );

  insertUser.run(
    'user-sarah',
    'Sarah Lin',
    'Macro & Dividend Strategist',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Focuses on cash-flow generative value, energy transition, defensive healthcare, and macro hedging.',
    'wl-macro-value',
    now
  );

  insertUser.run(
    'user-david',
    'David Ross',
    'Momentum & Crypto Equities',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Trades high-beta breakouts, crypto-adjacent tech, and aggressive liquidity shifts.',
    'wl-high-beta',
    now
  );

  // Insert Watchlists
  const insertWl = db.prepare(`
    INSERT INTO watchlists (id, user_id, name, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertWl.run('wl-tech-leaders', 'user-alex', 'AI & Mega-Cap Leaders', 1, now, now);
  insertWl.run('wl-cloud-saas', 'user-alex', 'High-Growth Cloud & Data', 0, now, now);

  insertWl.run('wl-macro-value', 'user-sarah', 'Defensive & Macro Core', 1, now, now);
  insertWl.run('wl-dividend-aristocrats', 'user-sarah', 'Cash Flow & Dividends', 0, now, now);

  insertWl.run('wl-high-beta', 'user-david', 'High-Beta Momentum & Crypto', 1, now, now);

  // Insert Watchlist Items
  const insertItem = db.prepare(`
    INSERT INTO watchlist_items (id, watchlist_id, symbol, notes, alert_threshold, added_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Alex's items
  insertItem.run('item-1', 'wl-tech-leaders', 'NVDA', 'Core AI infrastructure bet. Monitoring Blackwell production yields & data center capex.', 5.0, twoDaysAgo);
  insertItem.run('item-2', 'wl-tech-leaders', 'AAPL', 'Apple Intelligence cycle driver. Watching Services margin resilience.', 3.0, twoDaysAgo);
  insertItem.run('item-3', 'wl-tech-leaders', 'MSFT', 'Azure copilot enterprise seat conversions and OpenAI partner economics.', 3.0, twoDaysAgo);
  insertItem.run('item-4', 'wl-tech-leaders', 'TSLA', 'FSD unsupervised roadmap and Energy Megapack storage margin inflection.', 6.0, twoDaysAgo);
  insertItem.run('item-5', 'wl-tech-leaders', 'PLTR', 'US Commercial AIP customer acceleration. Defense Maven integration.', 5.0, twoDaysAgo);
  insertItem.run('item-6', 'wl-tech-leaders', 'AMD', 'MI325X & MI350 enterprise design wins vs H100/H200 market share.', 4.0, twoDaysAgo);
  insertItem.run('item-7', 'wl-tech-leaders', 'GOOGL', 'Search ad stability + Gemini API ecosystem monetization.', 3.0, twoDaysAgo);
  insertItem.run('item-8', 'wl-tech-leaders', 'META', 'Llama open weight ecosystem, AI recommendation efficiency on Reels ad loads.', 4.0, twoDaysAgo);

  insertItem.run('item-9', 'wl-cloud-saas', 'NOW', 'ServiceNow generative workflow expansions.', 4.0, twoDaysAgo);
  insertItem.run('item-10', 'wl-cloud-saas', 'CRWD', 'Falcon platform ARR retention and security consolidate.', 5.0, twoDaysAgo);
  insertItem.run('item-11', 'wl-cloud-saas', 'DDOG', 'Observability log volume acceleration.', 5.0, twoDaysAgo);

  // Sarah's items
  insertItem.run('item-12', 'wl-macro-value', 'JPM', 'Fortress balance sheet, net interest income resilience.', 2.5, twoDaysAgo);
  insertItem.run('item-13', 'wl-macro-value', 'XOM', 'Permian efficiency gains and capital return discipline.', 3.0, twoDaysAgo);
  insertItem.run('item-14', 'wl-macro-value', 'JNJ', 'MedTech robotics and steady pharmaceutical moat.', 2.0, twoDaysAgo);
  insertItem.run('item-15', 'wl-macro-value', 'SPY', 'Core S&P 500 benchmark anchor.', 1.5, twoDaysAgo);
  insertItem.run('item-16', 'wl-macro-value', 'QQQ', 'Nasdaq 100 tech hedge.', 2.0, twoDaysAgo);
  insertItem.run('item-17', 'wl-macro-value', 'GLD', 'Gold hedge against fiscal deficit expansion.', 2.0, twoDaysAgo);

  // David's items
  insertItem.run('item-18', 'wl-high-beta', 'COIN', 'Crypto spot & derivatives liquidity beneficiary.', 8.0, twoDaysAgo);
  insertItem.run('item-19', 'wl-high-beta', 'MSTR', 'Bitcoin treasury leverage ratio.', 10.0, twoDaysAgo);
  insertItem.run('item-20', 'wl-high-beta', 'ARM', 'Architecture royalty rate expansion from v9 to AI edge devices.', 6.0, twoDaysAgo);
  insertItem.run('item-21', 'wl-high-beta', 'SMCI', 'Liquid cooling server rack delivery cadence.', 8.0, twoDaysAgo);
  insertItem.run('item-22', 'wl-high-beta', 'UBER', 'Autonomous vehicle fleet partnership network.', 4.0, twoDaysAgo);

  // Insert Checkpoints (representing prices when user last visited 48h ago)
  const insertCheckpoint = db.prepare(`
    INSERT INTO user_checkpoints (user_id, checkpoint_time, snapshot_prices, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  const alexBaselinePrices = {
    NVDA: 212.50, // current ~228 (up +7.5% since visit)
    AAPL: 318.00, // current ~328 (up +3.1% since visit)
    MSFT: 418.50,
    TSLA: 238.20, // current ~252 (up +5.8% since visit)
    PLTR: 62.40,  // current ~68.50 (up +9.8% breakout!)
    AMD: 148.20,
    GOOGL: 172.50,
    META: 565.00,
    NOW: 940.00,
    CRWD: 320.00,
    DDOG: 125.00
  };

  const sarahBaselinePrices = {
    JPM: 215.00,
    XOM: 116.50,
    JNJ: 158.00,
    SPY: 565.00,
    QQQ: 485.00,
    GLD: 232.00
  };

  const davidBaselinePrices = {
    COIN: 285.00,
    MSTR: 260.00,
    ARM: 135.00,
    SMCI: 42.00,
    UBER: 74.50
  };

  insertCheckpoint.run('user-alex', twoDaysAgo, JSON.stringify(alexBaselinePrices), now);
  insertCheckpoint.run('user-sarah', twoDaysAgo, JSON.stringify(sarahBaselinePrices), now);
  insertCheckpoint.run('user-david', twoDaysAgo, JSON.stringify(davidBaselinePrices), now);

  // Insert Material Catalyst Events
  const insertCatalyst = db.prepare(`
    INSERT INTO catalyst_events (id, symbol, event_type, headline, summary, impact, event_date, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCatalyst.run(
    'cat-1',
    'NVDA',
    'EARNINGS',
    'NVIDIA Reports Record Q2 AI Data Center Revenue (+154% YoY)',
    'Management raised Q3 forward revenue guidance by $2.0B above consensus, citing insatiable demand for Blackwell and H200 architecture systems.',
    'BULLISH',
    now - 14 * 3600 * 1000,
    'SEC Form 8-K / Earnings Call'
  );

  insertCatalyst.run(
    'cat-2',
    'PLTR',
    'PRODUCT',
    'Palantir Secures $480M Multi-Year Expansion for Maven AI Defense',
    'Department of Defense awards prime contract expansion to deploy AIP platform across joint operational commands.',
    'BULLISH',
    now - 22 * 3600 * 1000,
    'Defense Logistics Agency'
  );

  insertCatalyst.run(
    'cat-3',
    'TSLA',
    'REGULATORY',
    'Tesla Obtains Commercial Robotaxi Testing Approvals in 3 Key States',
    'Department of Transportation approves autonomous fleet pilot testing with zero safety-driver interventions scheduled for Q4.',
    'BULLISH',
    now - 30 * 3600 * 1000,
    'State Transportation Regulatory Filings'
  );

  insertCatalyst.run(
    'cat-4',
    'AAPL',
    'PRODUCT',
    'Apple Intelligence EU Launch Finalized Under Digital Markets Act',
    'Apple announces full deployment timeline for Siri 2.0 with on-device generative models across European territories.',
    'BULLISH',
    now - 36 * 3600 * 1000,
    'Cupertino Press Wire'
  );

  insertCatalyst.run(
    'cat-5',
    'MSFT',
    'ANALYST',
    'Goldman Sachs Reaffirms Conviction Buy on Microsoft Azure Expansion',
    'Analyst team raises price target to $515, highlighting accelerating gross margin expansion on proprietary AI accelerator silicon (Maia).',
    'BULLISH',
    now - 40 * 3600 * 1000,
    'Equity Research Note'
  );

  insertCatalyst.run(
    'cat-6',
    'COIN',
    'REGULATORY',
    'SEC Issues Favorable Framework on Regulated Crypto Staking Pools',
    'Clarified custody guidelines remove regulatory overhang for Coinbase Prime staking operations.',
    'BULLISH',
    now - 18 * 3600 * 1000,
    'Regulatory Release'
  );

  insertCatalyst.run(
    'cat-7',
    'JPM',
    'MACRO',
    'Fed Rate Path Forecast Shows Steeper Yield Curve Supporting NII',
    'Revised Federal Reserve economic summary projects favorable lending spread conditions for tier-1 money center institutions.',
    'BULLISH',
    now - 28 * 3600 * 1000,
    'Federal Reserve Board'
  );

  console.log('Seed completed successfully.');
}
