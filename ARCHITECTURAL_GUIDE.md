# Architectural Guide: High-Intent Showcase

## Core Stack
- **Frontend:** React (Vite) + Tailwind
- **Backend:** Convex
- **Data Source:** Allium Explorer API (SQL)

## The Async Polling Pattern (CRITICAL)
Allium's SQL API is asynchronous. Do not attempt to await the result in a single HTTP call.

### 1. Action: `startQuery(sql)`
- **Input:** SQL string from `ALLIUM_SQL_RECIPES.md`.
- **Logic:**
  1. Call `POST /api/v1/explorer/queries` to create a query object (if needed) or use a static one.
  2. Call `POST /api/v1/explorer/queries/{query_id}/run-async` with the SQL parameter.
  3. **Return:** `run_id` to the client.

### 2. Mutation: `storeRun(runId, type)`
- Store the `runId` and the segment type (e.g., "Power Swappers") in a Convex table `marketing_lists`.
- Status: `pending`.

### 3. Action: `pollStatus(runId)`
- **Logic:**
  1. Loop every 2-3 seconds.
  2. Call `GET /api/v1/explorer/query-runs/{run_id}/status`.
  3. If `state` is `success` -> Call `GET /api/v1/explorer/query-runs/{run_id}/results`.
  4. Return data.

### 4. UI State
- **Idle:** Show segment cards (Power Swappers, Lending Whales, etc.).
- **Loading:** User clicks a card -> Show "Mining Blockchain Data..." with a progress bar.
- **Success:** Display table of wallets + "Insight Card" (e.g., "Found 400 Whales").