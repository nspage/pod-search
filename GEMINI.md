# Allium Lookalike Audience Generator

A showcase application demonstrating how to generate high-intent marketing segments from on-chain data using the Allium Explorer API and Convex.

## Project Overview

This project allows users to "mine" blockchain data for specific marketing personas (e.g., "Power Swappers", "Lending Whales"). It leverages Allium's SQL capabilities to query vast amounts of indexed blockchain data and uses Convex as a real-time state machine to manage the asynchronous nature of these queries.

### Tech Stack
- **Frontend:** React (Vite) + TypeScript
- **Backend:** [Convex](https://www.convex.dev/) (Schema, Mutations, Queries, Actions, Scheduling)
- **Data Source:** [Allium Explorer API](https://docs.allium.so/) (Asynchronous SQL)
- **Styling:** Tailwind CSS (Inferred)

### Key Architectural Pattern: Async Polling
Allium's SQL API is asynchronous. The project implements a robust polling pattern:
1.  **Trigger:** User clicks a segment card in the UI.
2.  **Action (`startQuery`):** Fires a `run-async` request to Allium with a dynamic SQL query.
3.  **Persistence:** The `run_id` is stored in the Convex `marketing_lists` table with a `pending` status.
4.  **Scheduling:** Convex schedules a background action (`pollStatus`) to check the status every few seconds.
5.  **Completion:** Once Allium returns `success`, the results are fetched and stored in Convex, updating the UI in real-time.

## Building and Running

### Prerequisites
- Node.js and npm
- Convex account/project
- Allium API Key

### Environment Variables
Ensure the following are set in your Convex environment (via `npx convex env set` or the dashboard):
- `ALLIUM_API_KEY`: Your Allium Explorer API key.
- `ALLIUM_QUERY_ID`: The ID of the Allium query object used to execute async runs.

### Development Commands
- **Start Frontend:** `npm run dev` (Starts Vite at http://localhost:5173)
- **Start Convex:** `npx convex dev` (Watches for changes in the `convex/` directory)
- **Build Production:** `npm run build`

## Development Conventions

### Segment Definitions
All segment logic, including SQL construction and UI display metadata, is consolidated in `convex/segments.ts`. To add a new segment:
1.  Define the segment type in the `SegmentType` union.
2.  Add a new entry to the `SEGMENTS` array with its `buildSql` function and `resultColumns`.

### Database Schema
The primary table is `marketing_lists`, which tracks every query run.
- `segmentType`: The ID of the segment (e.g., `power_swappers`).
- `status`: `pending`, `running`, `success`, or `failed`.
- `results`: The JSON output from Allium (stored upon success).

### Allium API Integration
- API calls are restricted to Convex **Actions** (`"use node"`) because they involve external fetch calls.
- Helper `alliumFetch` in `convex/alliumActions.ts` handles authentication and error parsing.

## Key Files
- `convex/schema.ts`: Database definition.
- `convex/segments.ts`: SQL recipes and segment metadata.
- `convex/alliumActions.ts`: Async logic for starting and polling Allium queries.
- `convex/allium.ts`: Mutations for updating the database state.
- `ARCHITECTURAL_GUIDE.md`: Deep dive into the polling pattern.
- `ALLIUM_SQL_RECIPES.md`: Reference for the raw SQL patterns used.
