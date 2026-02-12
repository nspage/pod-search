import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SEGMENTS } from "../../convex/segments.ts";
import type { SegmentType } from "../../convex/segments.ts";

interface Props {
    segmentType: SegmentType;
    onClose: () => void;
}

export default function ResultsPanel({ segmentType, onClose }: Props) {
    const latestRun = useQuery(api.allium.getLatestRun, { segmentType });
    const segment = SEGMENTS.find((s) => s.type === segmentType)!;
    const [showSql, setShowSql] = useState(false);

    if (!latestRun) {
        return (
            <section className="results-panel">
                <div className="results-panel__header">
                    <h2>{segment.icon} {segment.label}</h2>
                    <button className="results-close" onClick={onClose}>✕</button>
                </div>
                <p className="results-empty">
                    Select your options above and click <strong>"Find Users →"</strong> to start.
                </p>
            </section>
        );
    }

    const rows = (latestRun.results ?? []) as Record<string, unknown>[];
    const selections = (latestRun.options ?? {}) as Record<string, string>;

    // Compute insight stats
    const rowCount = rows.length;
    const numericCol = segment.resultColumns.find(
        (c) =>
            c.format === "number" &&
            c.key !== "protocols_used" &&
            c.key !== "ltv_ratio"
    );
    let totalValue = 0;
    if (numericCol) {
        totalValue = rows.reduce(
            (sum, row) => sum + (Number(row[numericCol.key]) || 0),
            0
        );
    }

    // Build the SQL that was actually run
    const sqlPreview = segment.buildSql(selections);

    const formatCell = (value: unknown, format?: string, colKey?: string) => {
        if (value == null) return "—";
        if (format === "address") {
            const s = String(value);
            return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
        }
        if (format === "number") {
            const n = Number(value);
            if (isNaN(n)) return String(value);
            // Only add $ for USD-value columns
            const isUsd = colKey && /usd|volume|deposited|bridged/i.test(colKey);
            if (isUsd) {
                if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
                if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
                return `$${n.toFixed(2)}`;
            }
            // Plain count formatting
            return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
        }
        if (format === "date") {
            return new Date(String(value)).toLocaleDateString();
        }
        return String(value);
    };

    const handleExportCSV = () => {
        if (!rows.length) return;
        const cols = segment.resultColumns;
        const header = cols.map((c) => c.label).join(",");
        const body = rows
            .map((row) => cols.map((c) => String(row[c.key] ?? "")).join(","))
            .join("\n");
        const blob = new Blob([header + "\n" + body], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${segmentType}_base_users.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="results-panel">
            <div className="results-panel__header">
                <h2>{segment.icon} {segment.label}</h2>
                <button className="results-close" onClick={onClose}>✕</button>
            </div>

            {/* Status bar */}
            {(latestRun.status === "pending" || latestRun.status === "running") && (
                <div className="results-status results-status--loading">
                    <div className="status-pulse"></div>
                    <span>Querying Base blockchain data… ({latestRun.status})</span>
                </div>
            )}

            {latestRun.status === "failed" && (
                <div className="results-status results-status--error">
                    <span>Query failed: {latestRun.error ?? "Unknown error"}</span>
                </div>
            )}

            {latestRun.status === "success" && (
                <>
                    {/* Insight Card */}
                    <div className="insight-card">
                        <div className="insight-stat">
                            <span className="insight-stat__value">{rowCount}</span>
                            <span className="insight-stat__label">Users Found on Base</span>
                        </div>
                        {numericCol && totalValue > 0 && (
                            <div className="insight-stat">
                                <span className="insight-stat__value">
                                    ${totalValue >= 1_000_000
                                        ? `${(totalValue / 1_000_000).toFixed(1)}M`
                                        : `${(totalValue / 1_000).toFixed(0)}K`}
                                </span>
                                <span className="insight-stat__label">
                                    Total {numericCol.label}
                                </span>
                            </div>
                        )}
                        <button className="insight-export" onClick={handleExportCSV}>
                            ↓ Export CSV
                        </button>
                    </div>

                    {/* Data Table */}
                    <div className="results-table-wrap">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {segment.resultColumns.map((col) => (
                                        <th key={col.key}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i}>
                                        <td className="row-num">{i + 1}</td>
                                        {segment.resultColumns.map((col) => (
                                            <td key={col.key}>
                                                {formatCell(row[col.key], col.format, col.key)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Next Steps */}
                    <div className="next-steps">
                        <span className="next-steps__label">Next steps</span>
                        <div className="next-steps__actions">
                            <button className="next-step-btn" onClick={handleExportCSV}>
                                📋 Export to CRM
                            </button>
                            <button className="next-step-btn" onClick={() => navigator.clipboard.writeText(rows.map((r) => String(r[segment.resultColumns[0].key] ?? "")).join("\n"))}>
                                📎 Copy Wallets
                            </button>
                        </div>
                    </div>

                    {/* SQL Preview */}
                    <div className="sql-preview">
                        <button
                            className="sql-preview__toggle"
                            onClick={() => setShowSql(!showSql)}
                        >
                            {showSql ? "Hide" : "Show"} Query ▾
                        </button>
                        {showSql && (
                            <pre className="sql-preview__code">{sqlPreview}</pre>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
