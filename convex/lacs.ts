// ============================================
// QUERIES CONVEX
// ============================================

// convex/lacs.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.string(),
  },
  handler: async (ctx, args) => {
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
    commodites: v.object({
      eau: v.boolean(),
      electricite: v.boolean(),
    }),
    regionAdministrative: v.string(),
  },
  handler: async (ctx, args) => {
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
        const site = lac.siteId
          ? await ctx.db.get(lac.siteId)
          : null;

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
          site,
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
    siteId: v.optional(v.id("sites")),
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
      accessible: v.string(),
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
          v.literal("aucune")
        ),
        puissanceMin: v.optional(v.number()),
      }),
    }),

  },
  handler: async (ctx, args) => {
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
      accessible: v.string(),
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
          v.literal("aucune")
        ),
        puissanceMin: v.optional(v.number()),
      }),
    }),
    zone: v.optional(v.number()),
    siteId: v.optional(v.id("sites")),
    superficie: v.optional(
      v.object({
        hectares: v.number(),
        km2: v.number(),
      })
    ),
    especeIds: v.optional(v.array(v.id("especes"))),
  },
  handler: async (ctx, args) => {
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
    return await ctx.db.insert("especes", args);
  },
});

export const addEspeceToLac = mutation({
  args: {
    lacId: v.id("lacs"),
    especeId: v.id("especes"),
  },
  handler: async (ctx, args) => {
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