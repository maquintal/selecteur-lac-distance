import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";
import { hebergementsSchema } from "./schemas/hebergements.schema";

// ============================================
// QUERIES
// ============================================

export const getAllCampings = query({
  handler: async (ctx) => {
    return await ctx.db.query("campings").collect();
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createCamping = mutation({
  args: hebergementsSchema,
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    return await ctx.db.insert("campings", args);
  },
});

export const updateCamping = mutation({
  args: {
    id: v.id("campings"),
    ...hebergementsSchema
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});