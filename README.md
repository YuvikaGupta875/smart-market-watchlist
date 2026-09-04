# DeltaWatch — Smart Market Watchlist

> **Don't just track stocks. Know what changed.**

DeltaWatch is an executive-style market watchlist that helps users answer a simple question:

**“What has meaningfully changed since I last checked, and what deserves my attention now?”**

Traditional watchlists show prices and daily percentage changes. DeltaWatch adds a **temporal baseline**: whenever a user reviews their watchlist, the system stores a checkpoint. When they return later, the application compares the current market state against that checkpoint and highlights the stocks that have changed significantly.

---

## Problem

A conventional watchlist can tell you:

* AAPL is up 2.1%
* NVDA is down 1.8%
* TSLA has high volume

But it does not answer:

> **“What changed since the last time I actually looked?”**

This creates information overload, especially when tracking many stocks.

DeltaWatch solves this by combining **checkpoint-based change detection, market signals, and attention scoring** into a single triage system.

---

## Key Features

### 1. Smart Watchlists

Users can:

* Create multiple watchlists
* Add and remove stocks
* Switch between watchlists
* Search and filter stocks
* Sort stocks by importance
* Maintain notes and investment theses for individual stocks

---

### 2. Checkpoint-Based Change Detection

Instead of using only today's percentage change, DeltaWatch stores a **review checkpoint**.

When the user clicks **Mark Reviewed**, the current market state becomes their new baseline.

On their next visit, the application calculates:

```text
Current Market State
        |
Previous Checkpoint
        |
Meaningful Change
        |
Attention Score
        |
Triage
```

This makes the system personalized to the user's actual review history.

---

### 3. Attention Score

Each stock receives an **Attention Score from 0–100**.

The score combines multiple signals:

| Signal            | What it detects                            |
| ----------------- | ------------------------------------------ |
| Price Shock       | Large movement since the checkpoint        |
| Relative Volume   | Unusually high trading activity            |
| Technical Signals | 52-week highs/lows and RSI conditions      |
| Catalysts         | Recent company or market events            |
| Sector Divergence | Stock behaving differently from its sector |

The goal is not to predict whether a stock will rise or fall.

The goal is to determine:

> **“Is this worth investigating right now?”**

---

### 4. Triage

Stocks are grouped into attention levels:

* **Critical** — requires immediate attention
* **Notable** — worth investigating
* **Noise / Quiet Drift** — probably not worth interrupting the user for

Users can filter the dashboard to focus only on meaningful changes.

---

### 5. Relative Volume (RVOL)

DeltaWatch compares current trading volume against historical volume.

A high RVOL can indicate that a price movement is accompanied by unusually strong market participation.

This helps distinguish:

```text
Large price movement + normal volume
```

from:

```text
Large price movement + abnormal volume
```

---

### 6. Technical Signals

The system evaluates:

* 52-week high/low proximity
* RSI
* Price movement
* Relative volume

These signals are combined rather than shown as isolated indicators.

---

### 7. Sector Divergence

A stock's movement is compared against its sector ETF.

For example:

```text
Stock:       +6.2%
Sector ETF:  +1.1%

Divergence:  +5.1%
```

A large divergence can indicate stock-specific movement rather than a broad sector move.

---

### 8. Persistent State

Watchlists, checkpoints, snapshots, and notes are persisted using **SQLite**.

This means the user's baseline is not lost when the application restarts.

The checkpoint model is particularly important because:

```text
Session 1
   |
User reviews watchlist
   |
Checkpoint stored
   |
Application closes
   |
Session 2
   |
Current state compared against checkpoint
```

---

### 9. Market Data Resilience

Market data is an unreliable external dependency.

DeltaWatch therefore tracks data freshness:

* **FRESH**
* **DELAYED**
* **STALE**

The backend also includes a circuit-breaker mechanism.

If the upstream market-data provider repeatedly fails, the system can stop repeatedly hitting the dependency and serve cached information instead.

---

### 10. Live Updates

The frontend receives market updates using **Server-Sent Events (SSE)**.

This allows the server to push quote changes to connected clients without requiring the browser to repeatedly poll for every update.

---

### 11. Market Data Simulator

The project includes a market simulator.

This provides:

* Deterministic development data
* Simulated price movement
* Volume changes
* Relative-volume changes
* Synthetic market shocks
* Outage simulation

This makes it possible to demonstrate the application's behavior without depending entirely on live market conditions.

---

### 12. Scenario Simulator

The application includes a scenario mode for testing situations such as:

* Large price shocks
* Unusual volume
* Market-data outages
* Different user personas

This makes it easier to demonstrate how the triage engine behaves under specific scenarios.

---

## Architecture

```text
                         +---------------------+
                         |      React UI       |
                         |     TypeScript      |
                         +----------+----------+
                                    |
                           REST API | SSE
                                    |
                         +----------v----------+
                         |   Express Server    |
                         |     TypeScript      |
                         +----------+----------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
      +-------v-------+    +--------v---------+   +-------v-------+
      |  Market Hub   |    | Attention Engine |   |    Routes     |
      +-------+-------+    +------------------+   +---------------+
              |
       +------+--------+
       |               |
+------v------+ +------v------+
| Yahoo Data  | |  Simulator  |
+-------------+ +-------------+
              |
       +------v------+
       | SQLite / WAL|
       +-------------+
```

---

## Attention Engine

The core decision-making logic lives in:

```text
server/src/services/changeEngine.ts
```

The engine receives:

* Current quote
* Historical candles
* Previous checkpoint
* Previous snapshot price
* Recent catalysts
* User notes
* Optional user alert threshold

It then calculates:

```text
Price Delta
     +
Relative Volume
     +
Technical Signals
     +
Catalysts
     +
Sector Divergence
     |
Attention Score
     |
Triage Tier
```

---

## Persistence Model

SQLite stores application state including:

* Users and personas
* Watchlists
* Watchlist items
* Checkpoints
* Snapshots
* Notes

The database uses **WAL (Write-Ahead Logging)** mode.

This helps SQLite handle concurrent reads and writes more effectively.

---

## Scalability Approach

A naive implementation could request market data independently for every user:

```text
User A -> AAPL
User B -> AAPL
User C -> AAPL
User D -> AAPL
```

DeltaWatch instead centralizes market-data access through the **MarketHub**:

```text
                  +-- User A
                  |
MarketHub -------+-- User B
                  |
                  +-- User C
                  |
                  +-- User D
```

The MarketHub maintains an in-memory cache and deduplicates watched symbols.

For example, if many users are watching AAPL, the architecture avoids treating those as independent market-data requests.

SSE is then used to distribute updates to connected clients.

---

## Failure Handling

The application considers several failure cases.

### Stale Data

Every quote contains freshness information:

```text
FRESH
DELAYED
STALE
```

### Upstream Failure

If the market-data provider fails repeatedly, the circuit breaker can enter an **OPEN** state.

The system can then fall back to cached information instead of continuously hitting the failing dependency.

### Market Outage Simulation

The evaluator can intentionally simulate an outage to verify the resilience behavior.

---

## Testing

The backend includes tests for the change and attention engine.

Run:

```bash
npm test
```

The application can also be manually evaluated through:

* Executive Briefing
* Mark Reviewed
* Time Machine
* Triage filters
* Scenario Simulator
* Market outage simulation
* Persona switching

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* CSS

### Backend

* Node.js
* Express
* TypeScript

### Database

* SQLite
* SQLite WAL

### Market Data

* Yahoo Finance
* Market simulator

### Communication

* REST APIs
* Server-Sent Events (SSE)

### Testing

* Jest

---

## Project Structure

```text
smart-market-watchlist/
|
+-- client/
|   +-- src/
|       +-- components/
|       |   +-- AddTickerModal.tsx
|       |   +-- ExecutiveBriefing.tsx
|       |   +-- Header.tsx
|       |   +-- ScenarioSimulatorModal.tsx
|       |   +-- Sparkline.tsx
|       |   +-- TickerDrawer.tsx
|       |   +-- TriageBar.tsx
|       |   +-- WatchlistCard.tsx
|       |   +-- WatchlistTable.tsx
|       |
|       +-- App.tsx
|       +-- api.ts
|       +-- types.ts
|       +-- ...
|
+-- server/
|   +-- src/
|       +-- db/
|       |   +-- database.ts
|       |   +-- seed.ts
|       |
|       +-- routes/
|       |   +-- attention.ts
|       |   +-- market.ts
|       |   +-- simulation.ts
|       |   +-- sse.ts
|       |   +-- watchlists.ts
|       |
|       +-- services/
|       |   +-- briefing.ts
|       |   +-- changeEngine.ts
|       |   +-- marketHub.ts
|       |   +-- providerSim.ts
|       |   +-- providerYahoo.ts
|       |
|       +-- tests/
|           +-- changeEngine.test.ts
|       |
|       +-- index.ts
|
+-- README.md
+-- package.json
```

---

## Running Locally

### Prerequisites

* Node.js 18+
* npm

### Install Dependencies

```bash
npm install
```

If the client and server have separate dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

### Start Backend

```bash
npm run dev:server
```

### Start Frontend

In another terminal:

```bash
npm run dev:client
```

Then open the Vite URL shown in the terminal.

---

## Example User Flow

```text
1. User opens DeltaWatch
            |
2. Selects a watchlist
            |
3. Reviews current market state
            |
4. Clicks "Mark Reviewed"
            |
5. Checkpoint is persisted
            |
6. User leaves
            |
7. Market changes
            |
8. User returns
            |
9. Current state is compared against checkpoint
            |
10. Attention Engine scores each stock
            |
11. User sees Critical / Notable / Noise
            |
12. User investigates meaningful changes
```

---

## Design Philosophy

DeltaWatch intentionally focuses on **triage rather than prediction**.

It does not attempt to tell users:

> “Buy this stock.”

Instead, it answers:

> **“Something changed. Here's why it may deserve your attention.”**

The most important design decision is the **checkpoint-based temporal baseline**. This transforms the application from a passive stock list into a system that remembers what the user has already seen.

---

## Future Improvements

Possible future extensions include:

* Multiple market-data providers with conflict reconciliation
* Authentication and multi-device synchronization
* PostgreSQL for larger deployments
* Redis for distributed market-data caching
* Background job queues for market-data ingestion
* More sophisticated anomaly detection
* Configurable attention-score weights
* Notifications for critical changes
* Portfolio-level risk analysis
* Historical attention-score analytics

---

## Assignment Coverage

| Requirement                | Implementation            |
| -------------------------- | ------------------------- |
| Create/manage watchlist    | Yes                       |
| Latest market information  | Yes                       |
| See what changed later     | Yes, checkpoints          |
| Define meaningful change   | Yes, Attention Engine     |
| Frontend                   | React + TypeScript        |
| Backend                    | Express + TypeScript      |
| Persistent state           | SQLite                    |
| Stale/delayed data         | Yes                       |
| Dependency failure         | Circuit breaker + cache   |
| Scalability considerations | MarketHub + caching + SSE |
| Edge-case handling         | Yes                       |
| Automated tests            | Yes                       |

---

## Author

**Yuvika Gupta**

Built as a full-stack engineering project focused on market-data processing, temporal state, resilience, and intelligent information triage.

---

## License

This project is intended for educational and demonstration purposes.

