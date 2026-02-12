# Allium SQL Recipes for High-Intent Segmentation

Use these SQL patterns to generate marketing lists via the Allium Explorer API. 
**Note:** These queries use standard Allium schemas. Always verify table names using the `/docs/schemas/browse` endpoint if a query fails.

---

## 1. The "Power Swappers" (DEX Whales)
**Target:** Wallets with high trading frequency and significant volume.
**Marketing Use Case:** VIP loyalty programs, fee rebates, or early access to new trading features.

```sql
SELECT
    sender as wallet_address,
    COUNT(*) as total_swaps,
    SUM(amount_usd) as total_volume_usd,
    COUNT(DISTINCT protocol) as diversity_score
FROM ethereum.defi.swaps
WHERE block_timestamp > CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1
HAVING total_swaps > 10 AND total_volume_usd > 50000
ORDER BY total_volume_usd DESC
LIMIT 100```

## 2. The "Lending Whales" (DeFi VIPs)
Target: Users with substantial capital locked in lending protocols. Marketing Use Case: Acquisition for yield aggregators, stablecoin issuers, or insurance products.

```SQL
SELECT
    user_address,
    SUM(supplied_usd) as total_supplied,
    SUM(borrowed_usd) as total_borrowed,
    (SUM(borrowed_usd) / NULLIF(SUM(supplied_usd), 0)) as loan_to_value_ratio
FROM ethereum.defi.lending_positions
WHERE total_supplied > 100000
GROUP BY 1
ORDER BY total_supplied DESC
LIMIT 100```   

3. The "Lookalike" (Cross-Protocol Targeting)
Target: Users of a specific protocol (e.g., Uniswap) who also frequent other decentralized applications. Marketing Use Case: Partnership opportunities or competitive "conquesting" campaigns.

```SQL
WITH seed_users AS (
    SELECT DISTINCT sender 
    FROM ethereum.defi.swaps 
    WHERE protocol = 'uniswap' 
    AND block_timestamp > CURRENT_DATE - INTERVAL '30 days'
)
SELECT
    p.protocol as partner_candidate,
    COUNT(DISTINCT p.sender) as shared_user_count
FROM ethereum.defi.swaps p
JOIN seed_users s ON p.sender = s.sender
WHERE p.protocol != 'uniswap'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20```

4. The "Early Adopter" (L2 Vanguard)
Target: Wallets that bridged to a new network during its launch window. Marketing Use Case: Retrospective airdrops, "OG" roles in Discord/Telegram, or early liquidity incentives.

```SQL
SELECT
    depositor as wallet_address,
    MIN(block_timestamp) as first_bridge_time,
    SUM(amount_usd) as initial_liquidity
FROM base.raw.bridge_deposits
GROUP BY 1
HAVING first_bridge_time < '2023-08-15' -- Approximate Base public launch window
ORDER BY initial_liquidity DESC
LIMIT 100```