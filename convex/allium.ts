import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Mutations ────────────────────────────────────────────────────────

export const storeRun = mutation({
    args: {
        segmentType: v.union(
            v.literal("power_swappers"),
            v.literal("lending_whales"),
            v.literal("cross_protocol"),
            v.literal("early_adopter")
        ),
        segmentLabel: v.string(),
        runId: v.string(),
        options: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("marketing_lists", {
            segmentType: args.segmentType,
            segmentLabel: args.segmentLabel,
            runId: args.runId,
            status: "pending",
            options: args.options,
            createdAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("marketing_lists"),
        status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("success"),
            v.literal("failed")
        ),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status,
            ...(args.error ? { error: args.error } : {}),
        });
    },
});

export const saveResults = mutation({
    args: {
        id: v.id("marketing_lists"),
        results: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "success" as const,
            results: args.results,
        });
    },
});

// ── Queries ──────────────────────────────────────────────────────────

export const getLatestRun = query({
    args: {
        segmentType: v.union(
            v.literal("power_swappers"),
            v.literal("lending_whales"),
            v.literal("cross_protocol"),
            v.literal("early_adopter")
        ),
    },
    handler: async (ctx, args) => {
        const runs = await ctx.db
            .query("marketing_lists")
            .withIndex("by_segment", (q) => q.eq("segmentType", args.segmentType))
            .order("desc")
            .take(1);
        return runs[0] ?? null;
    },
});

export const listRuns = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("marketing_lists")
            .order("desc")
            .take(20);
    },
});
