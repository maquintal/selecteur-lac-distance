import { v } from "convex/values";

export const ESPECES_CATEGORIES = ["salmonidés", "carnassiers"] as const;

export const especesSchema = {
  nomCommun: v.string(),
  nomScientifique: v.optional(v.string()),
  categorie: v.optional(
    v.union(...ESPECES_CATEGORIES.map(item => v.literal(item)))
  ),
};