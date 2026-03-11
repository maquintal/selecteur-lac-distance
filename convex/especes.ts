import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";
import { especesSchema } from "./schemas/especes.schema";

// ============================================
// QUERIES
// ============================================

export const getAllEspeces = query({
  handler: async (ctx) => {
    return await ctx.db.query("especes").collect();
  },
});

// ============================================
// MUTATIONS
// ============================================

export const addEspece = mutation({
  args: especesSchema,
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    return await ctx.db.insert("especes", args);
  },
});

export const updateEspece = mutation({
  args: {
    id: v.id("especes"),
    ...especesSchema
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});