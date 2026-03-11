import { v } from "convex/values";
import { ENUMS_REGION_ADMINISTRATIVE } from "./enums";

export const ENUMS_HEBERGEMENTS_ORGANISME = ["privé", "SEPAQ", "Camping", "Pourvoirie"] as const;

export const hebergementsSchema = {
  nom: v.string(),
  organisme: v.union(...ENUMS_HEBERGEMENTS_ORGANISME.map(item => v.literal(item))
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
  typeEmplacement: v.optional(
    v.union(v.string())
  ),
  commodites: v.object({
    eau: v.boolean(),
    electricite: v.boolean(),
  }),
  regionAdministrative: v.optional(v.union(...ENUMS_REGION_ADMINISTRATIVE.map(item => v.literal(item)))),
  distanceMaisonCamping: v.optional(
    v.object({
      temps: v.number(), // en minutes
      kilometrage: v.number(),
    }),
  ),
  inactif: v.optional(v.boolean())
};