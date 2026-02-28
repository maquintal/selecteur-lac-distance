import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllLacsDynamicFilters = query({
  args: {
    search: v.string(),
    motorisation: v.optional(v.string()),
    typeEmbarcation: v.optional(v.string()),
    site: v.optional(v.string()),
  },

  handler: async (ctx, { search, motorisation, typeEmbarcation, site }) => {

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

    return enrichedLacs.filter((lac) => {
      // Filtre texte sur le nom
      if (search.trim() && !lac.nomDuLac?.toLowerCase().includes(search.toLowerCase())) {
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

      return true;
    });
  },
});