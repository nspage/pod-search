import { useState } from "react";
import { SEGMENTS } from "../../convex/segments.ts";
import type { SegmentType } from "../../convex/segments.ts";
import SegmentCard from "./SegmentCard.tsx";
import ResultsPanel from "./ResultsPanel.tsx";

export default function Dashboard() {
    const [activeSegment, setActiveSegment] = useState<SegmentType | null>(null);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-badge">Powered by Allium · Base Network</div>
                <h1 className="header-title">
                    High-Intent User
                    <span className="header-highlight"> Discovery</span>
                </h1>
                <p className="header-subtitle">
                    Find high-value users on the Base blockchain using real on-chain data.
                    Select a segment, choose your target protocol, and discover users ready for your product.
                </p>
            </header>

            {/* Methodology Card */}
            <div className="methodology-card">
                <div className="methodology-icon">🔍</div>
                <div className="methodology-content">
                    <strong>How it works</strong>
                    <p>
                        We query real-time Base blockchain data via Allium to find wallets matching
                        your criteria. No personal data is collected — only public on-chain activity.
                        Each search returns up to 10 high-value users.
                    </p>
                </div>
            </div>

            <section className="segments-grid">
                {SEGMENTS.map((seg) => (
                    <SegmentCard
                        key={seg.type}
                        segment={seg}
                        isActive={activeSegment === seg.type}
                        onSelect={() => setActiveSegment(seg.type)}
                    />
                ))}
            </section>

            {activeSegment && (
                <ResultsPanel
                    segmentType={activeSegment}
                    onClose={() => setActiveSegment(null)}
                />
            )}
        </div>
    );
}
