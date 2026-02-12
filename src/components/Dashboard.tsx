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
                <div className="header-top">
                    <div className="header-badge">Powered by Allium · Base Network</div>
                    <a
                        href="https://github.com/nspage/pod-search.git"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link"
                        title="View on GitHub"
                    >
                        <svg height="24" viewBox="0 0 16 16" width="24" className="github-icon">
                            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                </div>
                <h1 className="header-title">
                    Pod
                    <span className="header-highlight"> Finder</span>
                </h1>
                <p className="header-subtitle">
                    Locate high-intent whale pods on the Base blockchain.
                    Target specific cohorts, scan on-chain behavior, and discover your next power users.
                </p>
            </header>

            {/* Methodology Card */}
            <div className="methodology-card">
                <div className="methodology-icon">🛰️</div>
                <div className="methodology-content">
                    <strong>Autonomous Scanning</strong>
                    <p>
                        We deploy sonar queries across Base blockchain via Allium to triangulate wallets matching
                        your exact criteria. Each ping deciphers public protocol interactions to find up to 10 targets.
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

            <footer className="dashboard-footer">
                deployed from the abyss by <a href="https://coolcoolcool.xyz/" target="_blank" rel="noopener noreferrer">Nicolas</a>
            </footer>
        </div>
    );
}
