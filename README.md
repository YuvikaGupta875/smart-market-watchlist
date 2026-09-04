# DeltaWatch: The Smart Market Watchlist

> **An Executive-Grade Market Triage Engine that answers: *"What has meaningfully changed since I last checked, and what requires my attention now?"***

---

## 🌟 Why DeltaWatch Exists

Traditional stock watchlists (Yahoo Finance, Apple Stocks, TradingView) are fundamentally static:
1. **Zero Temporal Awareness**: They only display "Today's Change %" anchored to midnight or 9:30 AM market open. If you were away for 3 days or a week, a +0.2% intraday movement completely hides a +14% breakout that happened during your absence.
2. **Noise Masking Signal**: A +1.0% drift on low holiday volume is shown identically to a +1.0% gap on 4x average volume with record earnings beats.
3. **Scan Fatigue**: Investors are forced to scan through 30 ticker rows trying to spot anomalies manually.

**DeltaWatch re-imagines the market watchlist as an Executive Triage Engine.**

---

## 🧠 What Counts as a "Meaningful Change"?

DeltaWatch does not treat all price changes equally. It calculates a multi-factor **Attention Score ($0 - 100$)** across 5 mathematical dimensions:

| Dimension | Metric / Anomaly Trigger | Weight |
| :--- | :--- | :--- |
| **1. Temporal $\Delta$ Shock** | Percent movement since the user's specific checkpoint timestamp ($\Delta_{\text{session}} = \frac{P_{\text{current}} - P_{\text{checkpoint}}}{P_{\text{checkpoint}}} \times 100\%$) | $35\%$ |
| **2. Institutional Volume Footprint** | Relative Volume ($\text{RVOL} = \frac{\text{Current Volume}}{\text{20-Day Average Volume}}$). $\text{RVOL} \ge 2.0\text{x}$ signals institutional liquidity accumulation or distribution | $25\%$ |
| **3. Technical & Regime Breakouts** | Crossing 52-Week High / Low ($\pm 0.8\%$), 20-Day Range breaches, and RSI(14) momentum extremes ($<30$ oversold, $>70$ overbought) | $20\%$ |
| **4. Corporate Catalysts & Events** | Earnings reports released in the delta window, FDA/regulatory approvals, or high-urgency contract announcements | $15\%$ |
| **5. Sector Beta Divergence** | Decoupling from the stock's Sector ETF (e.g. NVDA vs XLK). Identifies idiosyncratic shocks vs general market beta | $10\%$ |

### Triage Tiers:
- **CRITICAL ($\ge 70$)**: Demands immediate triage; highlighted with pulsing indicators and surfaced in the top Executive Briefing.
- **NOTABLE ($40 - 69$)**: Notable technical shifts or elevated volume.
- **QUIET DRIFT ($< 40$)**: Routine market fluctuation. Filterable with 1-click using the "Filter Noise" button.

---

## 🏛️ System Architecture

DeltaWatch is built as a decoupled, resilient full-stack application:

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 + Vite Frontend                 │
│  - Executive Briefing Card ("Since you were last here...")   │
│  - Sparklines with interactive "You Were Here" markers      │
│  - Triage Filter Tabs (All / Critical / Notable / Noise)    │
│  - Ticker Drawer (Audit timeline, RVOL gauge, thesis notes) │
│  - Evaluator Lab (Time Machine & Shock Injector)            │
└──────────────┬──────────────────────────────▲───────────────┘
               │ REST API                     │ SSE Stream
┌──────────────▼──────────────────────────────┴───────────────┐
│                 Express + TypeScript Backend                │
│  - Centralized Market Data Hub (deduplicated ticker cache)  │
│  - Change & Attention Scoring Engine                        │
│  - Circuit Breaker & Freshness Watchdog (3-state machine)   │
│  - Server-Sent Events (SSE) live broadcaster                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     SQLite Database (WAL)   ││   Multi-Source Market Data   │
│  - Users / Personas         ││  - Live Yahoo Finance v8     │
│  - Multiple Watchlists      ││  - High-Fidelity Simulator   │
│  - Checkpoints & Snapshots  ││  - Synthetic Shock Injector  │
│  - Persistent Thesis Notes  ││                              │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 🛡️ Edge Cases & Resilience Engineering

1. **Handling Stale, Delayed, or Conflicting Data**:
   - Every price quote is tagged with `lastUpdated`, `source` (`live_market`, `cached`, `simulated`), and `freshness` (`FRESH`, `DELAYED`, `STALE`).
   - If downstream network drops or Yahoo Finance rate-limits, the in-memory **Circuit Breaker** trips to `OPEN`.
   - The UI never crashes or white-screens; it displays a clear `CIRCUIT OPEN (CACHED)` indicator with exact timestamp attribution.
2. **State Persistence Across Sessions & Devices**:
   - Backed by an embedded SQLite database running in **WAL (Write-Ahead Logging)** mode for zero disk contention and instant reads.
   - Saves `user_checkpoints` containing exact price snapshots at the time of user review.
   - When a user clicks **"Mark Reviewed"**, the current market state is committed as their new checkpoint baseline, smoothly resetting the temporal delta.
3. **Scalability for Large Watchlists**:
   - The `MarketDataHub` aggregates and deduplicates ticker requests so 1,000 active users tracking AAPL only generates a single upstream request.
   - Real-time updates are broadcast to connected clients via a single lightweight **Server-Sent Events (SSE)** connection.

---

## 🧪 Evaluator Testing Guide (Try These Features!)

Open the app at **http://localhost:5173** and test:

1. **The Executive Briefing**:
   - Note the top briefing card explaining what happened since the checkpoint.
   - Click **"Mark Reviewed"**: Notice how all deltas instantly reset to zero and the timer resets to "now".
2. **The Time Machine**:
   - Click **"Time Machine"** in the top bar.
   - Select **"3 Days Ago"** or **"1 Week Ago"**: Watch the entire watchlist recalibrate and surface what accumulated over that absence!
3. **Visual "You Were Here" Sparklines**:
   - Look at the sparkline charts on any card or table row. Notice the vertical blue dashed line showing exactly where the price was when you last visited.
4. **Market Shock Injection**:
   - In the Time Machine modal, click **"NVDA: Earnings Blowout (+12.5%, 3.8x RVOL)"**.
   - Watch NVDA jump to the top of the High Attention tier with `[Institutional Volume Surge]` and `[Surged 12.5% Since Review]` badges.
5. **Noise Filtering**:
   - Click **"Filter Noise"** in the triage bar. All calm tickers ($<40$ score) disappear, leaving only actionable positions.
6. **Circuit Breaker Outage Test**:
   - In the Time Machine modal, click **"Simulate Outage"**.
   - The status badge changes to `CIRCUIT OPEN (CACHED)`, proving resilience without UI degradation.
7. **Persona Switcher**:
   - Switch between **"Alex Chen (AI & Tech Growth)"**, **"Sarah Lin (Macro & Dividend)"**, and **"David Ross (High-Beta Momentum)"**.

---

## 🚀 Running Locally

```bash
# In smart-market-watchlist directory:
npm run dev:server   # Starts backend on http://localhost:4000
npm run dev:client   # Starts frontend on http://localhost:5173
```
