import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";

// ============================================
// QUERIES CONVEX
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
  args: {
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    // aliases: v.optional(v.array(v.string())),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    return await ctx.db.insert("especes", args);
  },
});

export const updateEspece = mutation({
  args: {
    id: v.id("especes"),
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    // aliases: v.optional(v.array(v.string())),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});