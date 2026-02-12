"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { SEGMENTS } from "./segments";
import type { SegmentType } from "./segments";
import type { Id } from "./_generated/dataModel";

// ── Allium API helper ────────────────────────────────────────────────

const ALLIUM_BASE = "https://api.allium.so/api/v1";

async function alliumFetch(
    path: string,
    apiKey: string,
    options?: RequestInit
): Promise<unknown> {
    const res = await fetch(`${ALLIUM_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            ...(options?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Allium API error ${res.status}: ${body}`);
    }
    const text = await res.text();
    try {
        return JSON.parse(text) as unknown;
    } catch {
        // Allium status endpoint returns raw strings like "success"
        return text.replace(/^"|"$/g, "");
    }
}

// ── Actions ──────────────────────────────────────────────────────────

export const startQuery = action({
    args: {
        segmentType: v.union(
            v.literal("power_swappers"),
            v.literal("lending_whales"),
            v.literal("cross_protocol"),
            v.literal("early_adopter")
        ),
        options: v.optional(v.any()),
    },
    handler: async (ctx, args): Promise<{ docId: string; runId: string }> => {
        const apiKey = process.env.ALLIUM_API_KEY;
        const queryId = process.env.ALLIUM_QUERY_ID;
        if (!apiKey || !queryId) {
            throw new Error("Missing ALLIUM_API_KEY or ALLIUM_QUERY_ID env vars");
        }

        const segment = SEGMENTS.find(
            (s) => s.type === (args.segmentType as SegmentType)
        );
        if (!segment) throw new Error(`Unknown segment: ${args.segmentType}`);

        // Build SQL with user selections
        const selections = (args.options ?? {}) as Record<string, string>;
        const sql = segment.buildSql(selections);

        // 1. Fire the async SQL query
        const runResult = await alliumFetch(
            `/explorer/queries/${queryId}/run-async`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify({
                    parameters: { sql_query: sql },
                }),
            }
        ) as Record<string, unknown>;

        const runId = runResult.run_id as string;

        // 2. Store the run in Convex
        const docId: Id<"marketing_lists"> = await ctx.runMutation(
            api.allium.storeRun,
            {
                segmentType: args.segmentType,
                segmentLabel: segment.label,
                runId,
                options: args.options,
            }
        );

        // 3. Schedule polling
        await ctx.scheduler.runAfter(0, api.alliumActions.pollStatus, {
            docId,
            runId,
            attempt: 0,
        });

        return { docId, runId };
    },
});

export const pollStatus = action({
    args: {
        docId: v.id("marketing_lists"),
        runId: v.string(),
        attempt: v.number(),
    },
    handler: async (ctx, args): Promise<void> => {
        const MAX_ATTEMPTS = 40;
        const apiKey = process.env.ALLIUM_API_KEY;
        if (!apiKey) throw new Error("Missing ALLIUM_API_KEY");

        // Check current status — Allium returns a raw string like "success"
        const statusRaw = await alliumFetch(
            `/explorer/query-runs/${args.runId}/status`,
            apiKey
        );

        const state = typeof statusRaw === "string"
            ? statusRaw
            : ((statusRaw as Record<string, unknown>).state ??
                (statusRaw as Record<string, unknown>).status) as string;

        if (state === "success") {
            // Fetch results
            const resultsRaw = await alliumFetch(
                `/explorer/query-runs/${args.runId}/results?f=json`,
                apiKey
            );

            const resultsData = resultsRaw as Record<string, unknown>;
            const rows = Array.isArray(resultsRaw)
                ? resultsRaw
                : ((resultsData.data ?? []) as unknown[]);

            await ctx.runMutation(api.allium.saveResults, {
                id: args.docId,
                results: rows,
            });
            return;
        }

        if (state === "failed" || state === "error") {
            const errorMsg = typeof statusRaw === "string"
                ? "Query execution failed"
                : ((statusRaw as Record<string, unknown>).error as string) ?? "Query execution failed";
            await ctx.runMutation(api.allium.updateStatus, {
                id: args.docId,
                status: "failed",
                error: errorMsg,
            });
            return;
        }

        // Still running — update status and schedule next poll
        if (state === "running" || state === "queued") {
            await ctx.runMutation(api.allium.updateStatus, {
                id: args.docId,
                status: "running",
            });
        }

        if (args.attempt < MAX_ATTEMPTS) {
            await ctx.scheduler.runAfter(3000, api.alliumActions.pollStatus, {
                docId: args.docId,
                runId: args.runId,
                attempt: args.attempt + 1,
            });
        } else {
            await ctx.runMutation(api.allium.updateStatus, {
                id: args.docId,
                status: "failed",
                error: "Query timed out after 2 minutes",
            });
        }
    },
});
