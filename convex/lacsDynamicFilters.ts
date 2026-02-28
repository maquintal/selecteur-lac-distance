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

      const hebergements = (lac.hebergements ?? []).map((h) => ({
        ...campingsMap.get(h.campingId),
        distanceDepuisAcceuil: h.distanceDepuisAcceuil,
        distanceDepuisLac: h.distanceDepuisLac,
      }));

      return { ...lac, especes, hebergements };
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
      if (site && lac.site !== site) {
        return false;
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

      return true;
    });

    const sortedLacs = filteredLacs.sort((a, b) => {
      if (scenario === "journee") {
        const tempsA = a.distanceMaisonLac?.temps ?? Infinity;
        const tempsB = b.distanceMaisonLac?.temps ?? Infinity;
        return tempsA - tempsB;
      }

      if (scenario === "sejour") {
        const tempsA = a.hebergements?.reduce(
          (min, h) => Math.min(min, h.distanceDepuisLac?.temps ?? Infinity),
          Infinity
        ) ?? Infinity;
        const tempsB = b.hebergements?.reduce(
          (min, h) => Math.min(min, h.distanceDepuisLac?.temps ?? Infinity),
          Infinity
        ) ?? Infinity;
        return tempsA - tempsB;
      }

      return 0;
    });

    return sortedLacs;
  },
});