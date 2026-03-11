// Schéma optimisé pour tes données de lacs du Québec
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { especesSchema } from "@/convex/schemas/especes.schema";
import { hebergementsSchema } from "./schemas/hebergements.schema";
import { lacsSchema } from "./schemas/lacs.schema";

export default defineSchema({
  // ============================================
  // TABLE: campings
  // Stocke tous les campings une seule fois
  // ============================================
  campings: defineTable(hebergementsSchema)
    .index("by_nom", ["nom"])
    .searchIndex("search_nom", {
      searchField: "nom",
    }),

  // ============================================
  // TABLE: especes
  // Normalise les noms d'espèces
  // ============================================

  especes: defineTable(especesSchema)
    .index("by_nom", ["nomCommun"])
    .index("by_categorie", ["categorie"])
    .searchIndex("search_espece", {
      searchField: "nomCommun",
      filterFields: ["categorie"],
    }),

  // ============================================
  // TABLE: lacs (optimisée)
  // ============================================
  lacs: defineTable(lacsSchema)
    // .index("by_region", ["regionAdministrativeQuebec"])
    .index("by_site", ["site"])
    // .index("by_zone", ["zone"])
    // .index("by_coordonnees", ["coordonnees.latitude", "coordonnees.longitude"])
    // .index("by_hebergements_electrique", ["nbHebergements", "isMoteurisationElectrique"])
    .index("by_choix_interessant", ["isChoixInteressant"])
  // .searchIndex("search_nom", {
  //   searchField: "nomDuLac",
  //   // filterFields: ["regionAdministrativeQuebec", "site"],
  // }),
});