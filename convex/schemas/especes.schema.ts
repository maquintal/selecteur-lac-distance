import { v } from "convex/values";

export const CATEGORIES_ESPECES = ["salmonidés", "carnassiers"] as const;

export const especesSchema = {
  nomCommun: v.string(),
  nomScientifique: v.optional(v.string()),
  categorie: v.optional(
    v.union(...CATEGORIES_ESPECES.map(c => v.literal(c)))
  ),
};