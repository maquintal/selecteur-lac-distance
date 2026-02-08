// ============================================
// QUERIES CONVEX
// ============================================

// convex/lacs.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { checkReadOnlyModeConvex } from "./checkReadOnlyMode";

// ============================================
// MUTATIONS
// ============================================

export const createCamping = mutation({
  args: {
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
    terrains: v.optional(
      v.array(
        v.object({
          nom: v.string(),
          equipementAdmissible: v.optional(v.array(v.string())),
          capaciteMaximale: v.optional(v.string()),
          acces: v.optional(v.string()),
          terrain: v.optional(
            v.object({
              longueur: v.optional(v.string()),
              largeur: v.optional(v.string()),
            })
          ),
        })
      )
    ),
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    return await ctx.db.insert("campings", args);
  },
});

export const updateCamping = mutation({
  args: {
    id: v.id("campings"),
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
    terrains: v.optional(
      v.array(
        v.object({
          nom: v.string(),
          equipementAdmissible: v.optional(v.array(v.string())),
          capaciteMaximale: v.optional(v.string()),
          acces: v.optional(v.string()),
          terrain: v.optional(
            v.object({
              longueur: v.optional(v.string()),
              largeur: v.optional(v.string()),
            })
          ),
        })
      )
    ),
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});

export const updateEspece = mutation({
  args: {
    id: v.id("especes"),
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    // aliases: v.optional(v.array(v.string())),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});

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

// ❌ INCORRECT - Manque .collect() ou autre méthode finale
// const lacs = await ctx.db.query("lacs");

// ✅ CORRECT - Avec .collect()
export const getAllLacs = query({
  handler: async (ctx) => {
    return await ctx.db.query("lacs").collect();
  },
});

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

// ✅ CORRECT - Avec .first()
export const getFirstLac = query({
  handler: async (ctx) => {
    return await ctx.db.query("lacs").first();
  },
});

// ✅ CORRECT - Avec .unique() sur un index
export const getLacByName = query({
  args: { nom: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("lacs")
      .withSearchIndex("search_nom", (q) => q.search("nomDuLac", args.nom))
      .take(1);
    return results[0] || null;
  },
});

// ✅ CORRECT - Avec .take(n)
export const getRecentLacs = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lacs")
      .order("desc")
      .take(args.limit);
  },
});

// ✅ CORRECT - Pagination avec .paginate()
export const getLacsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lacs")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ✅ CORRECT - Filtrage conditionnel
export const searchLacsAdvanced = query({
  args: {
    region: v.optional(v.string()),
    hasSuperficie: v.optional(v.boolean()),
    minSuperficie: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Récupérer les lacs avec filtre de région si fourni
    let lacs;
    if (args.region !== undefined) {
      const region = args.region; // Capturer la valeur pour satisfaire TypeScript
      lacs = await ctx.db
        .query("lacs")
        .withIndex("by_region", (q) =>
          q.eq("regionAdministrativeQuebec", region)
        )
        .collect();
    } else {
      lacs = await ctx.db.query("lacs").collect();
    }

    // Filtrage en JavaScript pour conditions complexes
    return lacs.filter((lac) => {
      if (args.hasSuperficie && !lac.superficie) return false;
      if (args.minSuperficie && (!lac.superficie || lac.superficie.hectares < args.minSuperficie)) {
        return false;
      }
      return true;
    });
  },
});

// Obtenir tous les lacs avec leurs détails complets
export const getLacsWithDetails = query({
  args: {
    region: v.optional(v.string()),
    especeId: v.optional(v.id("especes")),
  },
  handler: async (ctx, args) => {
    // Récupérer les lacs avec filtre de région si fourni
    let lacs;
    if (args.region !== undefined) {
      const region = args.region; // Capturer la valeur pour satisfaire TypeScript
      lacs = await ctx.db
        .query("lacs")
        .withIndex("by_region", (q) =>
          q.eq("regionAdministrativeQuebec", region)
        )
        .collect();
    } else {
      lacs = await ctx.db.query("lacs").collect();
    }

    // Filtrer par espèce si nécessaire et s'assurer que especeId est défini
    const filteredLacs = args.especeId !== undefined
      ? lacs.filter((lac) => {
        const especeId = args.especeId;
        return especeId !== undefined && lac.especeIds.includes(especeId);
      })
      : lacs;

    // Enrichir avec les données liées
    return Promise.all(
      filteredLacs.map(async (lac) => {
        // Récupérer le site
        // const site = lac.siteId
        //   ? await ctx.db.get(lac.siteId)
        //   : null;

        // Récupérer les espèces
        const especes = await Promise.all(
          lac.especeIds.map((id) => ctx.db.get(id))
        );

        // Récupérer les campings
        const hebergements = await Promise.all(
          lac.hebergements.map(async (h) => {
            const camping = await ctx.db.get(h.campingId);
            return {
              ...camping,
              distanceDepuisAcceuil: h.distanceDepuisAcceuil,
              distanceDepuisLac: h.distanceDepuisLac,
            };
          })
        );

        return {
          ...lac,
          // site,
          especes: especes.filter((e) => e !== null),
          hebergements,
        };
      })
    );
  },
});

// Rechercher des lacs par nom
export const searchLacs = query({
  args: {
    searchTerm: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("lacs")
      .withSearchIndex("search_nom", (q) => {
        let search = q.search("nomDuLac", args.searchTerm);
        if (args.region) {
          search = search.eq("regionAdministrativeQuebec", args.region);
        }
        return search;
      })
      .take(20);

    return results;
  },
});

// Trouver les lacs à proximité (géospatial)
export const getLacsNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const allLacs = await ctx.db.query("lacs").collect();

    // Fonction pour calculer la distance
    const haversineDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const R = 6371; // Rayon de la Terre en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return allLacs
      .map((lac) => ({
        ...lac,
        distance: haversineDistance(
          args.latitude,
          args.longitude,
          lac.coordonnees.latitude,
          lac.coordonnees.longitude
        ),
      }))
      .filter((lac) => lac.distance <= args.radiusKm)
      .sort((a, b) => a.distance - b.distance);
  },
});

// Obtenir tous les campings
export const getAllCampings = query({
  handler: async (ctx) => {
    return await ctx.db.query("campings").collect();
  },
});

export const getAllEspeces = query({
  handler: async (ctx) => {
    return await ctx.db.query("especes").collect();
  },
});

// Obtenir les campings d'un lac spécifique
export const getCampingsForLac = query({
  args: { lacId: v.id("lacs") },
  handler: async (ctx, args) => {
    const lac = await ctx.db.get(args.lacId);
    if (!lac) return [];

    return Promise.all(
      lac.hebergements.map(async (h) => {
        const camping = await ctx.db.get(h.campingId);
        return {
          ...camping,
          distanceDepuisAcceuil: h.distanceDepuisAcceuil,
          distanceDepuisLac: h.distanceDepuisLac,
        };
      })
    );
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

  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()

    console.log(checkReadOnlyModeConvex())

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
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    console.log(checkReadOnlyModeConvex())
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

export const addEspece = mutation({
  args: {
    nomCommun: v.string(),
    nomScientifique: v.optional(v.string()),
    // aliases: v.optional(v.array(v.string())),
    categorie: v.optional(
      v.union(
        v.literal("salmonidés"),
        v.literal("carnassiers"),
      )
    ),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    
    return await ctx.db.insert("especes", args);
  },
});

export const addEspeceToLac = mutation({
  args: {
    lacId: v.id("lacs"),
    especeId: v.id("especes"),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex()
    
    const lac = await ctx.db.get(args.lacId);
    if (!lac) throw new Error("Lac non trouvé");

    // Vérifier si l'espèce n'est pas déjà liée
    if (lac.especeIds.includes(args.especeId)) {
      throw new Error("Cette espèce est déjà liée à ce lac");
    }

    return await ctx.db.patch(args.lacId, {
      especeIds: [...lac.especeIds, args.especeId],
      updatedAt: Date.now(),
    });
  },
});

// 🆕 NOUVELLE MUTATION À AJOUTER
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

// ============================================
// PARTIE 1: Query Convex optimisée
// Fichier: convex/lacs.ts
// ============================================

export const getLacsSortedOptimized = query({
  handler: async (ctx) => {

    // Récupérer tous les lacs
    const allLacs = await ctx.db.query("lacs").collect();

    // Enrichir avec les données liées
    const enrichedLacs = await Promise.all(
      allLacs.map(async (lac) => {
        // Récupérer les espèces
        const especes = await Promise.all(
          lac.especeIds.map((id) => ctx.db.get(id))
        );

        // Récupérer les campings avec leurs infos
        const hebergements = await Promise.all(
          lac.hebergements.map(async (h) => {
            const camping = await ctx.db.get(h.campingId);
            return {
              ...camping,
              distanceDepuisAcceuil: h.distanceDepuisAcceuil,
              distanceDepuisLac: h.distanceDepuisLac,
            };
          })
        );

        return {
          ...lac,
          especes: especes.filter((e) => e !== null),
          hebergements,
        };
      })
    );

    // 🎯 Tri modifié: Motorisation EN PREMIER, puis nombre d'hébergements
    return enrichedLacs.sort((a, b) => {
      // Priorité 1: Motorisation (électrique > essence > autre)
      const motorA = a.embarcation?.motorisation?.necessaire;
      const motorB = b.embarcation?.motorisation?.necessaire;
      const priorityA = motorA === 'electrique' ? 1 : motorA === 'essence' ? 2 : 3;
      const priorityB = motorB === 'electrique' ? 1 : motorB === 'essence' ? 2 : 3;

      if (priorityA !== priorityB) return priorityA - priorityB;

      // Priorité 2: Nombre d'hébergements (décroissant)
      const countA = a.hebergements?.length || 0;
      const countB = b.hebergements?.length || 0;
      return countB - countA;
    });
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