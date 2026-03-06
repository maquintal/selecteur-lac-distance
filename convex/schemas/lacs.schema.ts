import { v } from "convex/values";
import { ENUMS_REGION_ADMINISTRATIVE } from "./enums";

export const ENUMS_LACS_ACCESSIBLE = ["véhicule utilitaire sport (VUS)", "auto", "camion 4x4"] as const;

export const ENUMS_LACS_EMBARCATION = [
  "Embarcation Sépaq fournie",
  "Embarcation Pourvoirie fournie",
  "Location",
  "Embarcation personnelle",
  "À Gué",
] as const;

export const ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE = [
  "electrique",
  "essence",
  "a determiner",
  "à gué",
] as const;

export const ENUMS_LACS_SITE = [
  "Mastigouche",
  "Portneuf",
  "Rouge-Matawin",
  "Papineau-Labelle",
  "Saint-Maurice",
  "Jacques-Cartier",
  "Parc national du Mont-Tremblant",
];

export const lacsSchema = {
  nomDuLac: v.string(),
  regionAdministrativeQuebec: v.optional(
    v.union(
      ...ENUMS_REGION_ADMINISTRATIVE.map(item => v.literal(item)), v.null()
    )),
  coordonnees: v.object({
    latitude: v.number(),
    longitude: v.number(),
  }),
  acces: v.object({
    portage: v.string(),
    acceuil: v.string(),
    distanceAcceuilLac: v.union(
      v.object({
        temps: v.number(),
        kilometrage: v.number(),
      })
    ),
    accessible: v.optional(v.union(
      ...ENUMS_LACS_ACCESSIBLE.map(item => v.literal(item)),
      v.null()
    )),
  }),
  embarcation: v.object({
    type: v.optional(v.union(
      ...ENUMS_LACS_EMBARCATION.map(item => v.literal(item)),
      v.null()
    )),
    motorisation: v.object({
      puissance: v.optional(
        v.object({
          minimum: v.optional(v.union(v.number(), v.null())),
          maximum: v.optional(v.union(v.number(), v.null())),
        })
      ),
      necessaire:
        v.optional(v.union(
          ...ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE.map(item => v.literal(item)),
          v.null()
        ))
    }),
  }),
  zone: v.optional(v.number()),
  site: v.optional(v.union(...ENUMS_LACS_SITE.map(item => v.literal(item)), v.null())),
  superficie: v.optional(
    v.object({
      hectares: v.number(),
      km2: v.number(),
    })
  ),
  especeIds: v.optional(v.array(v.id("especes"))),

  // Liens vers hébergements avec distances
  hebergements: v.array(
    v.object({
      campingId: v.id("campings"),
      distanceDepuisAcceuil: v.optional(
        v.union(
          v.object({
            temps: v.number(),
            kilometrage: v.number(),
          })
        )
      ),
      distanceDepuisLac: v.optional(
        v.union(
          v.object({
            temps: v.number(),
            kilometrage: v.number(),
          })
        )
      ),
    })
  ),
  distanceMaisonLac: v.optional(v.object({
    temps: v.number(),
    kilometrage: v.number(),
  })),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  isChoixInteressant: v.optional(v.boolean()),
};