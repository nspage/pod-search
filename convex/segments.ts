// ── Segment Types & Interfaces ───────────────────────────────────────

export type SegmentType =
    | "power_swappers"
    | "lending_whales"
    | "cross_protocol"
    | "early_adopter";

export interface SegmentOption {
    key: string;
    label: string;
    choices: { value: string; label: string }[];
    defaultValue: string;
}

export interface SegmentDef {
    type: SegmentType;
    label: string;
    tagline: string;
    description: string;
    usefulFor: string[];
    icon: string;
    options: SegmentOption[];
    buildSql: (selections: Record<string, string>) => string;
    resultColumns: {
        key: string;
        label: string;
        format?: "address" | "number" | "date";
    }[];
}

// ── Protocol Constants ───────────────────────────────────────────────
// PROJECT column values in base.dex.trades (lowercase match via ILIKE)
const BASE_DEXS = [
    { value: "Aerodrome", label: "Aerodrome" },
    { value: "Uniswap", label: "Uniswap V3" },
    { value: "BaseSwap", label: "BaseSwap" },
];

// PROJECT column values in base.lending.deposits
const BASE_LENDING = [
    { value: "Morpho", label: "Morpho" },
    { value: "Aave", label: "Aave V3" },
    { value: "Moonwell", label: "Moonwell" },
];

const ALL_PROTOCOLS = [
    ...BASE_DEXS,
    ...BASE_LENDING,
    { value: "Compound", label: "Compound" },
];

// ── Segment Definitions ─────────────────────────────────────────────

export const SEGMENTS: SegmentDef[] = [
    {
        type: "power_swappers",
        label: "Power Swappers",
        tagline: "Top traders on Base DEXs",
        description:
            "Find the most active traders on Base's leading decentralized exchanges — Aerodrome, Uniswap V3, or BaseSwap. These are users with consistent swap volume in the last 7 days, signaling high engagement and spending power.",
        usefulFor: [
            "Loyalty & VIP programs",
            "Fee rebate campaigns",
            "Early access launches",
        ],
        icon: "⚡",
        options: [
            {
                key: "dex",
                label: "Target DEX",
                choices: BASE_DEXS,
                defaultValue: "Aerodrome",
            },
        ],
        buildSql: (sel) => `SELECT
    transaction_from_address AS wallet_address,
    COUNT(*) AS total_swaps,
    SUM(usd_amount) AS total_volume_usd
FROM base.dex.trades
WHERE block_timestamp > CURRENT_DATE - INTERVAL '7 days'
  AND project ILIKE '${sel.dex}%'
  AND usd_amount > 0
GROUP BY 1
HAVING total_swaps > 3 AND total_volume_usd > 1000
ORDER BY total_volume_usd DESC
LIMIT 10`,
        resultColumns: [
            { key: "wallet_address", label: "Wallet", format: "address" },
            { key: "total_swaps", label: "Swaps (7d)", format: "number" },
            { key: "total_volume_usd", label: "Volume (USD)", format: "number" },
        ],
    },

    {
        type: "lending_whales",
        label: "Lending Whales",
        tagline: "High-capital lenders on Base",
        description:
            "Identify users who have deposited significant capital into lending protocols on Base — Morpho, Aave V3, or Moonwell — in the last 7 days. These users actively manage DeFi positions and represent high-net-worth on-chain participants.",
        usefulFor: [
            "Yield aggregator user acquisition",
            "Stablecoin product marketing",
            "DeFi insurance cross-sell",
        ],
        icon: "🐋",
        options: [
            {
                key: "protocol",
                label: "Lending Protocol",
                choices: BASE_LENDING,
                defaultValue: "Morpho",
            },
        ],
        buildSql: (sel) => `SELECT
    depositor_address AS wallet_address,
    COUNT(*) AS deposit_count,
    SUM(usd_amount) AS total_deposited_usd
FROM base.lending.deposits
WHERE block_timestamp > CURRENT_DATE - INTERVAL '7 days'
  AND project ILIKE '${sel.protocol}%'
  AND usd_amount > 0
GROUP BY 1
HAVING total_deposited_usd > 1000
ORDER BY total_deposited_usd DESC
LIMIT 10`,
        resultColumns: [
            { key: "wallet_address", label: "Wallet", format: "address" },
            { key: "deposit_count", label: "Deposits (7d)", format: "number" },
            { key: "total_deposited_usd", label: "Deposited (USD)", format: "number" },
        ],
    },

    {
        type: "cross_protocol",
        label: "Cross-Protocol Users",
        tagline: "Users active across multiple Base protocols",
        description:
            "Discover users who are active on one Base protocol and also use another. Perfect for identifying partnership opportunities, cross-promotion targets, or competitive intelligence on Base.",
        usefulFor: [
            "Partnership & co-marketing",
            "Competitive conquesting",
            "Cross-sell campaigns",
        ],
        icon: "🎯",
        options: [
            {
                key: "seed_protocol",
                label: "Source Protocol (your users)",
                choices: ALL_PROTOCOLS,
                defaultValue: "Aerodrome",
            },
            {
                key: "target_protocol",
                label: "Target Protocol (where else they go)",
                choices: ALL_PROTOCOLS,
                defaultValue: "Uniswap",
            },
        ],
        buildSql: (sel) => `WITH seed_users AS (
    SELECT DISTINCT transaction_from_address AS wallet
    FROM base.dex.trades
    WHERE project ILIKE '${sel.seed_protocol}%'
      AND block_timestamp > CURRENT_DATE - INTERVAL '7 days'
      AND usd_amount > 0
    LIMIT 5000
)
SELECT
    t.transaction_from_address AS wallet_address,
    COUNT(*) AS activity_count,
    SUM(t.usd_amount) AS volume_usd
FROM base.dex.trades t
JOIN seed_users s ON t.transaction_from_address = s.wallet
WHERE t.project ILIKE '${sel.target_protocol}%'
  AND t.block_timestamp > CURRENT_DATE - INTERVAL '7 days'
  AND t.usd_amount > 0
GROUP BY 1
ORDER BY volume_usd DESC
LIMIT 10`,
        resultColumns: [
            { key: "wallet_address", label: "Wallet", format: "address" },
            { key: "activity_count", label: "Transactions", format: "number" },
            { key: "volume_usd", label: "Volume (USD)", format: "number" },
        ],
    },

    {
        type: "early_adopter",
        label: "Base OGs",
        tagline: "Early Base network adopters",
        description:
            "Find wallets that bridged assets to Base during its public launch window (before Aug 15, 2023). These early adopters demonstrated conviction in the Base ecosystem and are high-value targets for retroactive rewards.",
        usefulFor: [
            "Retroactive airdrops",
            "OG roles & community access",
            "Early liquidity incentives",
        ],
        icon: "🚀",
        options: [],
        buildSql: () => `SELECT
    sender_address AS wallet_address,
    MIN(block_timestamp) AS first_bridge_time,
    SUM(usd_amount) AS total_bridged_usd
FROM base.bridges.transfers
WHERE direction = 'inbound'
  AND block_timestamp < '2023-08-15'
  AND usd_amount > 0
GROUP BY 1
ORDER BY total_bridged_usd DESC
LIMIT 10`,
        resultColumns: [
            { key: "wallet_address", label: "Wallet", format: "address" },
            { key: "first_bridge_time", label: "First Bridge", format: "date" },
            { key: "total_bridged_usd", label: "Bridged (USD)", format: "number" },
        ],
    },
];
