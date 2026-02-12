import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    marketing_lists: defineTable({
        segmentType: v.union(
            v.literal("power_swappers"),
            v.literal("lending_whales"),
            v.literal("cross_protocol"),
            v.literal("early_adopter")
        ),
        segmentLabel: v.string(),
        runId: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("success"),
            v.literal("failed")
        ),
        options: v.optional(v.any()), // User selections (e.g., { dex: "aerodrome" })
        results: v.optional(v.any()),
        error: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_segment", ["segmentType"]),
});
