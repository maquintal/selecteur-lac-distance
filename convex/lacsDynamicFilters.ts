import { HebergementLacInput } from "@/app/types/schema.types";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllLacsDynamicFilters = query({
  args: {
    nomLac: v.string(),
    motorisation: v.optional(v.string()),
    typeEmbarcation: v.optional(v.string()),
    site: v.optional(v.string()),
    superficieMin: v.optional(v.number()),
    superficieMax: v.optional(v.number()),
    accessible: v.optional(v.string()),
    scenario: v.optional(v.string()),
  },

  handler: async (ctx, {
    nomLac,
    motorisation,
    typeEmbarcation,
    site,
    superficieMin,
    superficieMax,
    accessible,
    scenario,
  }) => {

    const allLacs = await ctx.db.query("lacs").collect();

    const allEspeceIds = [...new Set(allLacs.flatMap((lac) => lac.especeIds ?? []))];
    const allCampingIds = [...new Set(allLacs.flatMap((lac) => lac.hebergements?.map((h) => h.campingId) ?? []))];

    const [allEspeces, allCampings] = await Promise.all([
      Promise.all(allEspeceIds.map((id) => ctx.db.get(id))),
      Promise.all(allCampingIds.map((id) => ctx.db.get(id))),
    ]);

    const especesMap = new Map(allEspeceIds.map((id, i) => [id, allEspeces[i]]));
    const campingsMap = new Map(allCampingIds.map((id, i) => [id, allCampings[i]]));

    const enrichedLacs = allLacs.map((lac) => {
      const especes = (lac.especeIds ?? [])
        .map((id) => especesMap.get(id))
        .filter((e) => e != null);

      const hebergements = (lac.hebergements ?? [])
        .map((h) => ({
          ...campingsMap.get(h.campingId),
          distanceDepuisAcceuil: h.distanceDepuisAcceuil,
          distanceDepuisLac: h.distanceDepuisLac,
        }))
        .sort((a, b) => (a.distanceDepuisLac?.temps ?? Infinity) - (b.distanceDepuisLac?.temps ?? Infinity));

      const hebergementsNonSepaq = hebergements.filter((h) => h.organisme !== "SEPAQ");

      return { ...lac, especes, hebergements, hebergementsNonSepaq };
    });

    const filteredLacs = enrichedLacs.filter((lac) => {

      // Filtre texte sur le nom
      if (nomLac.trim() && !lac.nomDuLac?.toLowerCase().includes(nomLac.toLowerCase())) {
        return false;
      }

      // Filtre motorisation (objet, pas tableau)
      if (motorisation && lac.embarcation?.motorisation?.necessaire !== motorisation) {
        return false;
      }

      // Filtre type d'embarcation (objet, pas tableau)
      if (typeEmbarcation && lac.embarcation?.type !== typeEmbarcation) {
        return false;
      }

      // Filtre site
      if (site) {
        if (site === "__aucun__") {
          if (lac.site && lac.site.trim() !== "") return false;
        } else {
          if (lac.site !== site) return false;
        }
      }

      // Filtre superficie min
      if (superficieMin && lac.superficie?.hectares && lac.superficie.hectares < superficieMin) {
        return false;
      }

      // Filtre superficie max
      if (superficieMax && lac.superficie?.hectares && lac.superficie.hectares > superficieMax) {
        return false;
      }

      // Filtre accessibilité
      if (accessible) {
        if (accessible === "auto_vus") {
          if (!["auto", "véhicule utilitaire sport (VUS)"].includes(lac.acces?.accessible ?? "")) {
            return false;
          }
        } else if (accessible === "camion 4x4") {
          if (lac.acces?.accessible !== "camion 4x4") {
            return false;
          }
        }
      }

      if (scenario === "sejour2") {
        return lac.hebergements.map((h) => {
          if (h.organisme === "SEPAQ") //&& (h.distanceDepuisLac?.temps ?? Infinity) <= 65;
          return false
        })
      }

      return true;
    });

    // Helper
    // todo type devrait venir du schema convex
    type HebergementEnrichi = (typeof enrichedLacs)[number]["hebergements"][number];

    const tempsMin = (hebergements: HebergementEnrichi[] | undefined, filtre?: (h: HebergementEnrichi) => boolean) =>
      (filtre ? hebergements?.filter(filtre) : hebergements)
        ?.reduce((min, h) => Math.min(min, h.distanceDepuisLac?.temps ?? Infinity), Infinity) ?? Infinity;

    const countHebergements = (hebergements: HebergementEnrichi[] | undefined, maxTemps: number, filtre?: (h: HebergementEnrichi) => boolean) =>
      (filtre ? hebergements?.filter(filtre) : hebergements)
        ?.filter(h => (h.distanceDepuisLac?.temps ?? Infinity) <= maxTemps).length ?? 0;

    // Sort
    const sortedLacs = [...filteredLacs].sort((a, b) => {

      if (scenario === "journee") {
        return (a.distanceMaisonLac?.temps ?? Infinity) - (b.distanceMaisonLac?.temps ?? Infinity);
      }

      if (scenario === "sejour") {
        // N1 : nb hébergements <= 35 min
        // const diff35 = countHebergements(b.hebergements, 35) - countHebergements(a.hebergements, 35);
        // if (diff35 !== 0) return diff35;

        // // N2 : nb hébergements <= 65 min
        // const diff65 = countHebergements(b.hebergements, 65) - countHebergements(a.hebergements, 65);
        // if (diff65 !== 0) return diff65;

        // N3 : temps du camping le plus proche
        return tempsMin(a.hebergements) - tempsMin(b.hebergements);
      }

      return 0;
    });

    return sortedLacs;

  },
});