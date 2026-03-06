import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";
import { lacsSchema } from "./schemas/lacs.schema";

// ============================================
// QUERIES
// ============================================

export const getAllLacs = query({
  handler: async (ctx) => {
    const lacs = await ctx.db
      .query("lacs")
      .collect();

    return lacs
  }
})

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
        .filter(h => !h.inactif)
        .sort((a, b) => (a.distanceDepuisLac?.temps ?? Infinity) - (b.distanceDepuisLac?.temps ?? Infinity));

      const hebergementsNonSepaq = hebergements.filter((h) => {
        return (
          h.organisme !== "SEPAQ" &&
          !h.inactif
        )
      });

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

      if (scenario === "sejour2") {
        return tempsMin(a.hebergementsNonSepaq) - tempsMin(b.hebergementsNonSepaq)
      }

      return 0;
    });

    return sortedLacs;

  },
});

// ============================================
// STATISTIQUES
// ============================================

export const getLakesStats = query({
  handler: async (ctx) => {
    const lacs = await ctx.db.query("lacs").collect();

    // Enrichir avec les espèces et campings
    const enrichedLacs = await Promise.all(
      lacs.map(async (lac) => {
        const especes = await Promise.all(
          lac.especeIds?.map((id) => ctx.db.get(id)) ?? []
        );
        const hebergements = await Promise.all(
          lac.hebergements.map(async (h) => {
            const camping = await ctx.db.get(h.campingId);
            return camping;
          })
        );
        return {
          ...lac,
          especes: especes.filter((e) => e !== null),
          hebergements: hebergements.filter((h) => h !== null),
        };
      })
    );

    const totalLacs = enrichedLacs.length;

    // Statistiques globales
    const lacsAvecHebergement = enrichedLacs.filter((l) => l.hebergements.length > 0).length;
    const lacsMoteurElectrique = enrichedLacs.filter(
      (l) => l.embarcation?.motorisation?.necessaire === "electrique"
    ).length;
    const lacsMoteurEssence = enrichedLacs.filter(
      (l) => l.embarcation?.motorisation?.necessaire === "essence"
    ).length;
    const lacsSansMotorisation = enrichedLacs.filter(
      (l) => l.embarcation?.motorisation?.necessaire === "a determiner" || !l.embarcation?.motorisation?.necessaire
    ).length;

    // Par région
    const regionMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      const region = l.regionAdministrativeQuebec || "Non défini";
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });
    const parRegion = Array.from(regionMap.entries())
      .map(([region, count]) => ({
        region,
        nombreLacs: count,
        pourcentage: (count / totalLacs) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs);

    // Par site
    const siteMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      const site = l.site || "Non défini";
      siteMap.set(site, (siteMap.get(site) || 0) + 1);
    });
    const parSite = Array.from(siteMap.entries())
      .map(([site, count]) => ({
        site,
        nombreLacs: count,
        pourcentage: (count / totalLacs) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs);

    // Par organisme
    const organismeMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      l.hebergements.forEach((h) => {
        const organisme = h.organisme || "Non défini";
        organismeMap.set(organisme, (organismeMap.get(organisme) || 0) + 1);
      });
    });
    const parOrganisme = Array.from(organismeMap.entries())
      .map(([organisme, count]) => ({
        organisme,
        nombreLacs: count,
        pourcentage: (count / lacsAvecHebergement) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs);

    // Par motorisation
    const parMotorisation = [
      {
        type: "Électrique",
        nombreLacs: lacsMoteurElectrique,
        pourcentage: (lacsMoteurElectrique / totalLacs) * 100,
      },
      {
        type: "Essence",
        nombreLacs: lacsMoteurEssence,
        pourcentage: (lacsMoteurEssence / totalLacs) * 100,
      },
      {
        type: "Sans motorisation",
        nombreLacs: lacsSansMotorisation,
        pourcentage: (lacsSansMotorisation / totalLacs) * 100,
      },
    ];

    // Par type d'embarcation
    const embarcationMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      const type = l.embarcation?.type || "Non défini";
      embarcationMap.set(type, (embarcationMap.get(type) || 0) + 1);
    });
    const parTypeEmbarcation = Array.from(embarcationMap.entries())
      .map(([type, count]) => ({
        type,
        nombreLacs: count,
        pourcentage: (count / totalLacs) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs);

    // Par accessibilité
    const accessibiliteMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      const type = l.acces?.accessible || "Non défini";
      accessibiliteMap.set(type, (accessibiliteMap.get(type) || 0) + 1);
    });
    const parAccessibilite = Array.from(accessibiliteMap.entries())
      .map(([type, count]) => ({
        type,
        nombreLacs: count,
        pourcentage: (count / totalLacs) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs);

    // Espèces populaires
    const especeMap = new Map<string, number>();
    enrichedLacs.forEach((l) => {
      l.especes.forEach((e) => {
        const nom = e?.nomCommun || "Non défini";
        especeMap.set(nom, (especeMap.get(nom) || 0) + 1);
      });
    });
    const especesPopulaires = Array.from(especeMap.entries())
      .map(([espece, count]) => ({
        espece,
        nombreLacs: count,
        pourcentage: (count / totalLacs) * 100,
      }))
      .sort((a, b) => b.nombreLacs - a.nombreLacs)
      .slice(0, 10);

    // Distances moyennes
    let totalDistance = 0;
    let countWithDistance = 0;
    enrichedLacs.forEach((l) => {
      if (l.acces?.distanceAcceuilLac?.kilometrage) {
        totalDistance += l.acces.distanceAcceuilLac.kilometrage;
        countWithDistance++;
      }
    });
    const distanceMoyenneGlobale = countWithDistance > 0 ? Math.round(totalDistance / countWithDistance) : 0;

    // Distances moyennes par site
    const siteDistanceMap = new Map<string, { total: number; count: number }>();
    enrichedLacs.forEach((l) => {
      if (l.acces?.distanceAcceuilLac?.kilometrage) {
        const site = l.site || "Non défini";
        const current = siteDistanceMap.get(site) || { total: 0, count: 0 };
        siteDistanceMap.set(site, {
          total: current.total + l.acces.distanceAcceuilLac.kilometrage,
          count: current.count + 1,
        });
      }
    });
    const distancesParSite = Array.from(siteDistanceMap.entries())
      .map(([site, data]) => ({
        site,
        distanceMoyenne: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.distanceMoyenne - b.distanceMoyenne);

    return {
      global: {
        totalLacs,
        lacsAvecHebergement,
        lacsMoteurElectrique,
        lacsMoteurEssence,
        lacsSansMotorisation,
      },
      parRegion,
      parSite,
      parOrganisme,
      parMotorisation,
      parTypeEmbarcation,
      parAccessibilite,
      especesPopulaires,
      distancesMoyennes: {
        globale: distanceMoyenneGlobale,
        parSite: distancesParSite,
      },
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

export const removeCampingFromLac = mutation({
  args: {
    lacId: v.id("lacs"),
    campingId: v.id("campings"),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const lac = await ctx.db.get(args.lacId);
    if (!lac) throw new Error("Lac non trouvé");

    // Filtrer l'hébergement à supprimer
    const newHebergements = lac.hebergements.filter(
      (h) => h.campingId !== args.campingId
    );

    // Vérifier si l'hébergement a été trouvé et retiré
    if (newHebergements.length === lac.hebergements.length) {
      throw new Error("Hébergement non trouvé dans ce lac");
    }

    // Mettre à jour le lac avec la nouvelle liste d'hébergements
    return await ctx.db.patch(args.lacId, {
      hebergements: newHebergements,
      updatedAt: Date.now(),
    });
  },
});

// // Ajouter un nouveau lac
// export const addLac = mutation({
//   args: lacsSchema,
//   handler: async (ctx, args) => {
//     checkReadOnlyModeConvex()

//     return await ctx.db.insert("lacs", {
//       ...args,
//       especeIds: args.especeIds || [],
//       hebergements: args.hebergements || [],
//       createdAt: Date.now(),
//     });
//   },
// });

export const addLac = mutation({
  args: lacsSchema,
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex();
    return await ctx.db.insert("lacs", {
      ...args,
      createdAt: Date.now(), // ✅ added here, not in schema
    });
  },
});

// export const updateLac = mutation({
//   args: {
//     lacId: v.id("lacs"),
//     ...lacsSchema
//   },
//   handler: async (ctx, args) => {
//     checkReadOnlyModeConvex()
//     const { lacId, ...updateData } = args;

//     await ctx.db.patch(lacId, {
//       ...updateData,
//       updatedAt: Date.now(),
//     });

//     return lacId;
//   },
// });

// Ajouter un camping à un lac

export const updateLac = mutation({
  args: {
    lacId: v.id("lacs"),
    ...lacsSchema,
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex();
    const { lacId, ...updateData } = args;
    await ctx.db.patch(lacId, {
      ...updateData,
      updatedAt: Date.now(), // ✅ added here, not in schema
    });
    return lacId;
  },
});

export const addCampingToLac = mutation({
  args: {
    lacId: v.id("lacs"),
    campingId: v.id("campings"),
    distanceDepuisLac: v.optional(
      v.object({
        temps: v.number(),
        kilometrage: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    const lac = await ctx.db.get(args.lacId);
    if (!lac) throw new Error("Lac non trouvé");

    // Vérifier si le camping n'est pas déjà lié
    const exists = lac.hebergements.some(
      (h) => h.campingId === args.campingId
    );
    if (exists) throw new Error("Ce camping est déjà lié à ce lac");

    return await ctx.db.patch(args.lacId, {
      hebergements: [
        ...lac.hebergements,
        {
          campingId: args.campingId,
          distanceDepuisLac: args.distanceDepuisLac,
        },
      ],
      updatedAt: Date.now(),
    });
  },
});

export const toggleChoixInteressant = mutation({
  args: {
    lacId: v.id("lacs"),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    const lac = await ctx.db.get(args.lacId);
    if (!lac) throw new Error("Lac non trouvé");

    const newValue = !lac.isChoixInteressant;

    await ctx.db.patch(args.lacId, {
      isChoixInteressant: newValue,
      updatedAt: Date.now(),
    });

    return { lacId: args.lacId, isChoixInteressant: newValue };
  },
});