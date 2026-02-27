// ============================================
// QUERIES CONVEX
// ============================================

// convex/lacs.ts
import { query } from "./_generated/server";
import { v } from "convex/values";
// import { paginationOptsValidator } from "convex/server";

export const getAllLacsDynamicFilters = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, { search }) => {  // ✅ ajout de { search }

    const allLacs = await ctx.db.query("lacs").collect();

    const allEspeceIds = [...new Set(allLacs.flatMap((lac) => lac.especeIds ?? []))];
    const allCampingIds = [...new Set(allLacs.flatMap((lac) => lac.hebergements?.map((h) => h.campingId) ?? []))];

    const [allEspeces, allCampings] = await Promise.all([
      Promise.all(allEspeceIds.map((id) => ctx.db.get(id))),
      Promise.all(allCampingIds.map((id) => ctx.db.get(id))),
    ]);

    const especesMap = new Map(
      allEspeceIds.map((id, i) => [id, allEspeces[i]])
    );
    const campingsMap = new Map(
      allCampingIds.map((id, i) => [id, allCampings[i]])
    );

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

    const filtered = search.trim()
      ? enrichedLacs.filter((lac) =>
        lac.nomDuLac?.toLowerCase().includes(search.toLowerCase())
      )
      : enrichedLacs;

    return filtered;
  },
});