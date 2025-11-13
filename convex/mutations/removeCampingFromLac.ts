import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { checkReadOnlyModeConvex } from "../readOnlyMode";

export const removeCampingFromLac = mutation({
  args: {
    lacId: v.id("lacs"),
    campingId: v.id("campings"),
  },
  handler: async (ctx, args) => {
    checkReadOnlyModeConvex();
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