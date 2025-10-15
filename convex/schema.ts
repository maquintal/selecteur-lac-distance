// convex/schema.ts
// Schéma optimisé pour tes données de lacs du Québec
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // TABLE: campings
  // Stocke tous les campings une seule fois
  // ============================================
  campings: defineTable({
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
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.optional(v.string()),
  })
    .index("by_nom", ["nom"])
    .searchIndex("search_nom", {
      searchField: "nom",
    }),

  // ============================================
  // TABLE: especes
  // Normalise les noms d'espèces
  // ============================================
  especes: defineTable({
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  })
    .index("by_nom", ["nomCommun"])
    .index("by_categorie", ["categorie"])
    .searchIndex("search_espece", {
      searchField: "nomCommun",
      filterFields: ["categorie"],
    }),

  // ============================================
  // TABLE: lacs (optimisée)
  // ============================================
  lacs: defineTable({
    nomDuLac: v.string(),

    // Informations juridiques
    site: v.optional(v.string()),
    zone: v.optional(v.number()),

    regionAdministrativeQuebec: v.string(),

    coordonnees: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),

    acces: v.object({
      portage: v.string(),
      acceuil: v.string(),
      // Supporte à la fois les nombres simples (32) et les objets complexes
      distanceAcceuilLac: v.union(
        v.number(),
        v.object({
          temps: v.number(), // en minutes
          kilometrage: v.number(),
        })
      ),
      accessible: v.string(), // Plus flexible pour supporter toutes les variantes
    }),

    embarcation: v.object({
      type: v.string(), // Plus flexible pour tous les types
      motorisation: v.object({
        type: v.union(
          v.literal("electrique"),
          v.literal("essence"),
        ),
        puissanceMin: v.optional(v.number()),
      }),
    }),

    superficie: v.optional(
      v.object({
        hectares: v.number(),
        km2: v.number(),
      })
    ),

    // Références aux espèces
    especeIds: v.array(v.id("especes")),

    // Liens vers hébergements avec distances
    hebergements: v.array(
      v.object({
        campingId: v.id("campings"),
        distanceDepuisAcceuil: v.optional(
          v.union(
            v.number(),
            v.object({
              temps: v.number(),
              kilometrage: v.number(),
            })
          )
        ),
        distanceDepuisLac: v.optional(
          v.union(
            v.number(),
            v.object({
              temps: v.number(),
              kilometrage: v.number(),
            })
          )
        ),
      })
    ),

    // Métadonnées
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_region", ["regionAdministrativeQuebec"])
    .index("by_site", ["site"])
    .index("by_zone", ["zone"])
    .index("by_coordonnees", ["coordonnees.latitude", "coordonnees.longitude"])
    .searchIndex("search_nom", {
      searchField: "nomDuLac",
      filterFields: ["regionAdministrativeQuebec", "site"],
    }),

  // ============================================
  // TABLE: hebergement_lacs (table de jonction)
  // Alternative pour des requêtes plus flexibles
  // ============================================
  hebergement_lacs: defineTable({
    lacId: v.id("lacs"),
    campingId: v.id("campings"),
    distanceDepuisAcceuil: v.optional(
      v.union(
        v.number(),
        v.object({
          temps: v.number(),
          kilometrage: v.number(),
        })
      )
    ),
    distanceDepuisLac: v.optional(
      v.union(
        v.number(),
        v.object({
          temps: v.number(),
          kilometrage: v.number(),
        })
      )
    ),
  })
    .index("by_lac", ["lacId"])
    .index("by_camping", ["campingId"])
    .index("by_lac_camping", ["lacId", "campingId"]),
});