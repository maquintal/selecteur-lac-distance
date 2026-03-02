

// convex/lacs.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";

// ============================================
// QUERIES CONVEX
// ============================================

export const getAllLacsSorted = query({
  handler: async (ctx) => {
    const lacs = await ctx.db
      .query("lacs")
      .withIndex("by_hebergements_electrique")
      .order("desc")
      .collect();

    // Tri secondaire en JS seulement pour les lacs avec même nb d'hébergements
    return lacs.sort((a, b) => {
      if (a.nbHebergements === b.nbHebergements) {
        return (b.isMoteurisationElectrique ? 1 : 0) - (a.isMoteurisationElectrique ? 1 : 0);
      }
      return 0; // Déjà trié par l'index
    });
  },
});

// export const getLacsSortedOptimized = query({
//   handler: async (ctx) => {

//     // Récupérer tous les lacs
//     const allLacs = await ctx.db.query("lacs").collect();

//     // const filteredLacs = allLacs.filter(lac => lac.site === "Papineau-Labelle"); //.filter(lac => lac.hebergements.length <= 0);
//     // const filteredLacs = allLacs.filter(lac => lac.site === "Mastigouche"); //.filter(lac => lac.hebergements.length <= 0);
//     // const filteredLacs = allLacs.filter(lac => lac.site === "Portneuf"); //.filter(lac => lac.hebergements.length <= 0);
//     // const filteredLacs = allLacs.filter(lac => lac.site === "Rouge-Matawin"); //.filter(lac => lac.hebergements.length <= 0);
//     const filteredLacs = allLacs.filter(lac => lac.embarcation.motorisation.necessaire === "electrique"); //.filter(lac => lac.hebergements.length <= 0);

//     // Collecter TOUS les IDs en une seule passe
//     const allEspeceIds = [...new Set(filteredLacs.flatMap((lac) => lac.especeIds ?? []))];
//     const allCampingIds = [...new Set(filteredLacs.flatMap((lac) => lac.hebergements?.map((h) => h.campingId) ?? []))];

//     // Charger TOUT en parallèle (2 Promise.all au lieu de N*M)
//     const [allEspeces, allCampings] = await Promise.all([
//       Promise.all(allEspeceIds.map((id) => ctx.db.get(id))),
//       Promise.all(allCampingIds.map((id) => ctx.db.get(id))),
//     ]);

//     // Construire des maps pour lookup O(1)
//     const especesMap = new Map(
//       allEspeceIds.map((id, i) => [id, allEspeces[i]])
//     );
//     const campingsMap = new Map(
//       allCampingIds.map((id, i) => [id, allCampings[i]])
//     );

//     // Enrichir sans aucune requête DB supplémentaire
//     const enrichedLacs = filteredLacs.map((lac) => {
//       const especes = (lac.especeIds ?? [])
//         .map((id) => especesMap.get(id))
//         .filter((e) => e != null);

//       const hebergements = (lac.hebergements ?? []).map((h) => ({
//         ...campingsMap.get(h.campingId),
//         distanceDepuisAcceuil: h.distanceDepuisAcceuil,
//         distanceDepuisLac: h.distanceDepuisLac,
//       }));

//       return { ...lac, especes, hebergements };
//     });

//     const sejour = enrichedLacs.sort((a, b) => {
//       // const motorA = a.embarcation?.motorisation?.necessaire;
//       // const motorB = b.embarcation?.motorisation?.necessaire;
//       // const priorityA = motorA === 'electrique' ? 1 : motorA === 'essence' ? 2 : 3;
//       // const priorityB = motorB === 'electrique' ? 1 : motorB === 'essence' ? 2 : 3;

//       // 1. Tri par type de motorisation (électrique > essence > reste)
//       // if (priorityA !== priorityB) return priorityA - priorityB;

//       // 2. Sous-tris uniquement dans le groupe électrique
//       // if (motorA === 'electrique' && motorB === 'electrique') {

//       // 2a. Accessibilité (auto|VUS en premier)
//       const getAccessPriority = (accessible: string | undefined) => {
//         if (accessible === "auto" || accessible === "véhicule utilitaire sport (VUS)") return 1;
//         if (accessible === "camion 4x4") return 2;
//         return 3;
//       };

//       const accessSort = getAccessPriority(a.acces?.accessible) - getAccessPriority(b.acces?.accessible);
//       if (accessSort !== 0) return accessSort;

//       // 2b. Superficie (3-45 ha d'abord, puis < 3, puis > 45)
//       const hectaresA = a.superficie?.hectares ?? 0;
//       const hectaresB = b.superficie?.hectares ?? 0;

//       const getSuperficiePriority = (ha: number) => {
//         if (ha >= 4 && ha <= 30) return 1;  // Idéal
//         if (ha >= 30 && ha <= 80) return 2; // Grand
//         if (ha > 80) return 4;              // Trop grand
//         if (ha < 4) return 3                // Trop petit
//         return 5;                           // Non défini
//       };

//       const supPriorityA = getSuperficiePriority(hectaresA);
//       const supPriorityB = getSuperficiePriority(hectaresB);

//       if (supPriorityA !== supPriorityB) return supPriorityA - supPriorityB;

//       // 2c. Temps minimum depuis le lac (croissant), dans le sous-groupe auto|VUS
//       const minTempsA = Math.min(
//         ...(a.hebergements?.map((h) => h.distanceDepuisLac?.temps ?? Infinity) ?? [Infinity])
//       );
//       const minTempsB = Math.min(
//         ...(b.hebergements?.map((h) => h.distanceDepuisLac?.temps ?? Infinity) ?? [Infinity])
//       );

//       if (minTempsA !== minTempsB) return minTempsA - minTempsB;

//       // }

//       return 0;
//     });


//     let journeeEnrichedLacs = enrichedLacs.filter((lac) => {
//       return (
//         lac.embarcation.type === "Embarcation Sépaq fournie" &&
//         lac?.superficie?.hectares <= 30 &&
//         lac.acces?.accessible !== "camion 4x4"
//       )
//     })

//     journeeEnrichedLacs = journeeEnrichedLacs.sort((a, b) => {

//       // Temps minimum depuis le lac (croissant)
//       const minTempsA = Math.min(
//         ...(a.distanceMaisonLac ? [a.distanceMaisonLac.temps] : [Infinity])
//       );
//       const minTempsB = Math.min(
//         ...(b.distanceMaisonLac ? [b.distanceMaisonLac.temps] : [Infinity])
//       );

//       if (minTempsA !== minTempsB) return minTempsA - minTempsB;

//       return 0;
//     });

//     // return sejour

//     return journeeEnrichedLacs;

//   },
// });

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
          lac.especeIds.map((id) => ctx.db.get(id))
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

// ============================================
// MUTATIONS CONVEX
// ============================================

// Ajouter un nouveau lac
export const addLac = mutation({
  args: {
    nomDuLac: v.string(),
    regionAdministrativeQuebec: v.string(),
    coordonnees: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    zone: v.optional(v.number()),
    site: v.optional(v.string()),
    superficie: v.optional(v.object({
      hectares: v.number(),
      km2: v.number(),
    })),
    especeIds: v.optional(v.array(v.id("especes"))),
    hebergements: v.optional(v.array(v.object({
      campingId: v.id("campings"),
      distanceDepuisLac: v.optional(v.object({
        temps: v.number(),
        kilometrage: v.number(),
      })),
    }))),
    acces: v.object({
      portage: v.string(),
      acceuil: v.string(),
      distanceAcceuilLac: v.union(
        v.object({
          temps: v.number(),
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
        v.literal("Location"),
        v.literal("Embarcation personnelle")
      ),
      motorisation: v.object({
        puissance: v.optional(
          v.object({
            minimum: v.optional(v.union(v.number(), v.null())),
            maximum: v.optional(v.union(v.number(), v.null())),
          })
        ),
        necessaire: v.optional(
          v.union(
            v.literal("electrique"),
            v.literal("essence"),
            v.literal("a determiner"),
          )
        )
      }),
    }),
    distanceMaisonLac: v.optional(v.object({
      temps: v.number(),
      kilometrage: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    // console.log(checkReadOnlyModeConvex())

    return await ctx.db.insert("lacs", {
      ...args,
      especeIds: args.especeIds || [],
      hebergements: args.hebergements || [],
      createdAt: Date.now(),
    });
  },
});

export const updateLac = mutation({
  args: {
    lacId: v.id("lacs"),
    nomDuLac: v.string(),
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
          temps: v.number(),
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
        v.literal("Location"),
        v.literal("Embarcation personnelle")
      ),
      motorisation: v.object({
        puissance: v.optional(
          v.object({
            minimum: v.optional(v.union(v.number(), v.null())),
            maximum: v.optional(v.union(v.number(), v.null())),
          })
        ),
        necessaire: v.optional(
          v.union(
            v.literal("electrique"),
            v.literal("essence"),
            v.literal("a determiner"),
          )
        )
      }),
    }),
    zone: v.optional(v.number()),
    site: v.optional(v.string()),
    superficie: v.optional(
      v.object({
        hectares: v.number(),
        km2: v.number(),
      })
    ),
    especeIds: v.optional(v.array(v.id("especes"))),
    distanceMaisonLac: v.optional(v.object({
      temps: v.number(),
      kilometrage: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    // console.log(checkReadOnlyModeConvex())
    const { lacId, ...updateData } = args;

    await ctx.db.patch(lacId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return lacId;
  },
});

// Ajouter un camping à un lac
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