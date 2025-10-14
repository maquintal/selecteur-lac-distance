// convex/schema.ts
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
    // .index("by_region", ["regionAdministrative"])
    .searchIndex("search_nom", {
      searchField: "nom",
      // filterFields: ["regionAdministrative"],
    }),

  // ============================================
  // TABLE: especes
  // Normalise les noms d'espèces
  // ============================================
  especes: defineTable({
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    // aliases: v.optional(v.array(v.string())),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  })
    .index("by_nom", ["nomCommun"])
    .searchIndex("search_espece", {
      searchField: "nomCommun",
      filterFields: ["categorie"],
    }),

  // // ============================================
  // // TABLE: sites
  // // Sites SEPAQ et autres organismes
  // // ============================================
  // sites: defineTable({
  //   nom: v.string(),
  //   organisme: v.string(),
  //   type: v.union(v.literal("gouvernemental"), v.literal("privé")),
  //   regionAdministrative: v.string(),
  // })
  //   .index("by_organisme", ["organisme"])
  //   .index("by_region", ["regionAdministrative"]),

  // ============================================
  // TABLE: lacs (optimisée)
  // ============================================
  lacs: defineTable({
    nomDuLac: v.string(),

    // Références au lieu de données répétées
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
      distanceAcceuilLac: v.union(
        v.object({
          temps: v.number(), // en minutes
          kilometrage: v.number(),
        })
      ),
      accessible: v.union(
        v.literal("véhicule utilitaire sport (VUS)"),
        v.literal("auto"),
        v.literal("camion 4x4")
      ),
    }),

    embarcation: v.object({
      type: v.union(
        v.literal("Embarcation Sépaq fournie"),
        v.literal("Embarcation Pourvoirie fournie"),
        v.literal("Location")
      ),
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
          v.object({
            temps: v.number(),
            kilometrage: v.number(),
          })
        ),
      })
    ),

    // Métadonnées
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_region", ["regionAdministrativeQuebec"])
    // .index("by_site", ["siteId"])
    .index("by_coordonnees", ["coordonnees.latitude", "coordonnees.longitude"])
    .searchIndex("search_nom", {
      searchField: "nomDuLac",
      filterFields: ["regionAdministrativeQuebec"],
    }),

  // ============================================
  // TABLE: hebergement_lacs (table de jonction)
  // Alternative si vous préférez une table de relation séparée
  // ============================================
  hebergement_lacs: defineTable({
    lacId: v.id("lacs"),
    campingId: v.id("campings"),
    distanceDepuisAcceuil: v.optional(v.number()),
    distanceDepuisLac: v.optional(
      v.object({
        temps: v.number(),
        kilometrage: v.number(),
      })
    ),
  })
    .index("by_lac", ["lacId"])
    .index("by_camping", ["campingId"])
    .index("by_lac_camping", ["lacId", "campingId"]),
});