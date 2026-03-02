import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";

// ============================================
// QUERIES CONVEX
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
  args: {
    nom: v.string(),
    organisme: v.union(
      v.literal("privé"),
      v.literal("SEPAQ"),
      v.literal("Camping"),
      v.literal("Pourvoirie")
    ),
    coordonnees: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    terrains: v.optional(
      v.array(
        v.object({
          nom: v.string(),
          equipementAdmissible: v.optional(v.array(v.string())),
          services: v.optional(v.array(v.string())),
          capaciteMaximale: v.optional(v.string()),
          acces: v.optional(v.array(v.string())),
          selections: v.optional(v.array(v.string())),
          description: v.optional(v.array(v.string())),
          important: v.optional(v.array(v.string())),
        })
      )
    ),
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.optional(v.string()),
    distanceMaisonCamping: v.optional(
      v.object({
        temps: v.number(), // en minutes
        kilometrage: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    return await ctx.db.insert("campings", args);
  },
});

export const updateCamping = mutation({
  args: {
    id: v.id("campings"),
    nom: v.string(),
    organisme: v.union(
      v.literal("privé"),
      v.literal("SEPAQ"),
      v.literal("Camping"),
      v.literal("Pourvoirie")
    ),
    coordonnees: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    terrains: v.optional(
      v.array(
        v.object({
          nom: v.string(),
          equipementAdmissible: v.optional(v.array(v.string())),
          services: v.optional(v.array(v.string())),
          capaciteMaximale: v.optional(v.string()),
          acces: v.optional(v.array(v.string())),
          selections: v.optional(v.array(v.string())),
          description: v.optional(v.array(v.string())),
          important: v.optional(v.array(v.string())),
        })
      )
    ),
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.optional(v.string()),
    distanceMaisonCamping: v.optional(
      v.object({
        temps: v.number(), // en minutes
        kilometrage: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});