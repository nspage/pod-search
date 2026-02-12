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
        label: "High-Velocity Traders",
        tagline: "Volume-dominant addresses on Base DEXs",
        description:
            "Target wallets with significant 7-day swap volume on major venues (Aerodrome, Uniswap). These actors exhibit high on-chain velocity and are prime candidates for incentive programs.",
        usefulFor: [
            "Volume Mining Programs",
            "VIP Trading Tiers",
            "Fee Rebate Targeting",
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
            { key: "total_swaps", label: "7d Swaps", format: "number" },
            { key: "total_volume_usd", label: "7d Volume (USD)", format: "number" },
        ],
    },

    {
        type: "lending_whales",
        label: "Deep Capital Allocators",
        tagline: "High-TVL liquidity providers",
        description:
            "Identify addresses deploying substantial capital into lending markets (Morpho, Aave). These are sophisticated DeFi actors managing yield-bearing positions.",
        usefulFor: [
            "Liquidity Mining Events",
            "Treasury Diversification",
            "Risk-Adjusted Yield Offers",
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
            { key: "deposit_count", label: "7d Deposits", format: "number" },
            { key: "total_deposited_usd", label: "Total Deposited (USD)", format: "number" },
        ],
    },

    {
        type: "cross_protocol",
        label: "Ecosystem Nomads",
        tagline: "Multi-protocol interoperability tracking",
        description:
            "Map user flow between protocols. Identify wallets that bridge activity from a source protocol (e.g., Aerodrome) to a target destination, revealing competitive overlap or partnership synergy.",
        usefulFor: [
            "Partnership Attribution",
            "Competitor Vampire Attacks",
            "Cross-Pollination Campaigns",
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
        tagline: "First-cohort network participants",
        description:
            "Isolate wallets with proven conviction during the Base mainnet launch window (Aug 2023). These addresses represent the backbone of the network's early retention curve.",
        usefulFor: [
            "Retroactive Governance",
            "Community Stewardship",
            "Loyalty Multipliers",
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
