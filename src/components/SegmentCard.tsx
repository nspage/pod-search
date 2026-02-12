import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SegmentDef, SegmentType } from "../../convex/segments.ts";

interface Props {
    segment: SegmentDef;
    isActive: boolean;
    onSelect: () => void;
}

export default function SegmentCard({ segment, isActive, onSelect }: Props) {
    const startQuery = useAction(api.alliumActions.startQuery);
    const latestRun = useQuery(api.allium.getLatestRun, {
        segmentType: segment.type as SegmentType,
    });

    // Track user selections for each option
    const [selections, setSelections] = useState<Record<string, string>>(() => {
        const defaults: Record<string, string> = {};
        for (const opt of segment.options) {
            defaults[opt.key] = opt.defaultValue;
        }
        return defaults;
    });

    const isLoading =
        latestRun?.status === "pending" || latestRun?.status === "running";

    const handleFindUsers = async (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
        if (!isLoading) {
            try {
                await startQuery({
                    segmentType: segment.type as SegmentType,
                    options: selections,
                });
            } catch (err) {
                console.error("Failed to start query:", err);
            }
        }
    };

    const handleOptionChange = (key: string, value: string) => {
        setSelections((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div
            className={`segment-card ${isActive ? "segment-card--active" : ""} ${isLoading ? "segment-card--loading" : ""}`}
        >
            {/* HUD Target Corners */}
            <div className="target-corner corner-tl"></div>
            <div className="target-corner corner-tr"></div>
            <div className="target-corner corner-bl"></div>
            <div className="target-corner corner-br"></div>

            <div className="segment-card__top">
                <div className="segment-card__icon">{segment.icon}</div>
                <h3 className="segment-card__title">{segment.label}</h3>
                <span className="segment-card__tagline">{segment.tagline}</span>
            </div>

            <p className="segment-card__desc">{segment.description}</p>

            {/* Interactive selectors */}
            {segment.options.length > 0 && (
                <div className="segment-card__options">
                    {segment.options.map((opt) => (
                        <label key={opt.key} className="option-group">
                            <span className="option-label">{opt.label}</span>
                            <select
                                className="option-select"
                                value={selections[opt.key]}
                                onChange={(e) => handleOptionChange(opt.key, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {opt.choices.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            )}

            {/* Useful for */}
            <div className="segment-card__useful">
                <span className="useful-label">Operational Utility</span>
                <div className="useful-tags">
                    {segment.usefulFor.map((u) => (
                        <span key={u} className="useful-tag">{u}</span>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <button
                className="segment-card__cta"
                onClick={handleFindUsers}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <div className="sonar-container">
                            <div className="sonar-ping"></div>
                            <div className="radar-sweep"></div>
                        </div>
                        <span style={{ marginLeft: "12px" }}>Scanning Abyss…</span>
                    </>
                ) : (
                    "Initialize Scan →"
                )}
            </button>

            {/* Status badges */}
            {latestRun?.status === "success" && (
                <div className="segment-card__badge">✓ Pod Identified</div>
            )}
            {latestRun?.status === "failed" && (
                <div className="segment-card__badge segment-card__badge--error">
                    ✕ Signal Lost
                </div>
            )}

            <span className="segment-card__preview">Typically finds 5–10 users</span>
        </div>
    );
}
