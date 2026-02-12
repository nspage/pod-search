# Allium Lookalike Audience Generator 🎯

**Turn On-Chain Data into High-Intent Growth Loops.**

This repository provides a production-ready showcase for Web3 Growth Managers and Marketing Leads to identify and export high-value user segments directly from the blockchain using Allium's Explorer API and Convex.

## 🚀 Key Features

- **High-Intent Personas:** One-click mining for Power Swappers, Lending Whales, and Protocol OGs.
- **Async SQL Engine:** Leverages Allium's asynchronous SQL execution for massive data handling.
- **Real-Time Status:** Live polling and progress tracking via Convex.
- **Export Ready:** Generate wallet lists for airdrops, loyalty programs, or custom audiences.

## 🛠 Tech Stack

- **Data:** [Allium Explorer API](https://allium.so/) (Standard SQL)
- **Backend:** [Convex](https://convex.dev/) (Asynchronous Actions & Real-time Persistence)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS

---

## 🏗 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/nspage/pod-search.git
cd pod-search
npm install
```

### 2. Configure Allium
You will need an Allium API Key and a Query ID.
1. Sign up at [Allium](https://allium.so/).
2. Generate an API Key.
3. Create a query object in the Allium Explorer to get your `QUERY_ID`.

### 3. Setup Convex
Initialize your Convex project:
```bash
npx convex dev
```

Set your secrets in the Convex dashboard or via CLI:
```bash
npx convex env set ALLIUM_API_KEY your_api_key_here
npx convex env set ALLIUM_QUERY_ID your_query_id_here
```

### 4. Run Locally
```bash
npm run dev
```

---

## 🚢 Production Deployment

### 1. Deploy Convex to Production
To transition from a dev instance to production:
1. Run `npx convex deploy` to push your schema and functions to a production deployment.
2. In the Convex Dashboard, ensure your `ALLIUM_API_KEY` and `ALLIUM_QUERY_ID` are set in the **Production** environment settings.

### 2. Deploy Frontend to Cloudflare Pages
1. Connect your GitHub repository to [Cloudflare Pages](https://pages.cloudflare.com/).
2. **Build Settings:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Environment Variables:**
   - Add `VITE_CONVEX_URL`: Your **Production** Convex URL (e.g., `https://your-app-name.convex.cloud`).

---

## 📂 Project Structure

- `convex/segments.ts`: Defines the SQL logic for each persona.
- `convex/alliumActions.ts`: Handles the async polling loop with Allium.
- `src/components/Dashboard.tsx`: Main UI for segment selection.

## ⚖️ License
MIT
