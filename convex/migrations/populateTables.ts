// convex/migrations/populateTables.ts
// 
// UTILISATION:
// 1. Place ce fichier dans convex/migrations/populateTables.ts
// 2. Exécute la migration avec le script runMigration.ts ci-dessous
//
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Fonction utilitaire pour normaliser les noms d'espèces
function normalizeEspeceName(name: string): string {
  return name.trim().toLowerCase();
}

// Fonction pour calculer la distance en minutes depuis un objet complexe
function getDistanceValue(distance: any): number | { temps: number; kilometrage: number } | undefined {
  if (typeof distance === 'number') return distance;
  if (distance && typeof distance.temps === 'number' && typeof distance.kilometrage === 'number') {
    return { temps: distance.temps, kilometrage: distance.kilometrage };
  }
  return undefined;
}

export const populateFromJSON = internalMutation({
  args: {
    data: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { data } = args;
    
    // Maps pour éviter les doublons
    const campingMap = new Map<string, any>();
    const especeMap = new Map<string, any>();
    
    console.log(`🚀 Début de la migration avec ${data.length} lacs...`);
    
    // ============================================
    // ÉTAPE 1: Collecter tous les campings uniques
    // ============================================
    console.log("📍 Étape 1: Collecte des campings...");
    
    for (const lac of data) {
      if (!lac.hebergement || !Array.isArray(lac.hebergement)) continue;
      
      for (const heb of lac.hebergement) {
        if (!heb.camping || !heb.coordonnees) continue;
        
        const key = `${heb.camping}-${heb.coordonnees.latitude}-${heb.coordonnees.longitude}`;
        
        if (!campingMap.has(key)) {
          campingMap.set(key, {
            nom: heb.camping,
            organisme: heb.organisme || "privé",
            coordonnees: {
              latitude: heb.coordonnees.latitude,
              longitude: heb.coordonnees.longitude,
            },
            commodites: {
              eau: heb.eau || false,
              electricite: heb.electricite || false,
            },
            regionAdministrative: lac.regionAdministrativeQuebec,
          });
        }
      }
    }
    
    console.log(`✅ ${campingMap.size} campings uniques trouvés`);
    
    // ============================================
    // ÉTAPE 2: Insérer les campings
    // ============================================
    console.log("📍 Étape 2: Insertion des campings...");
    
    const campingIdMap = new Map<string, any>();
    
    for (const [key, camping] of campingMap) {
      const id = await ctx.db.insert("campings", camping);
      campingIdMap.set(key, id);
    }
    
    console.log(`✅ ${campingIdMap.size} campings insérés`);
    
    // ============================================
    // ÉTAPE 3: Collecter toutes les espèces uniques
    // ============================================
    console.log("📍 Étape 3: Collecte des espèces...");
    
    for (const lac of data) {
      if (!lac.espece || !Array.isArray(lac.espece)) continue;
      
      for (const especeStr of lac.espece) {
        if (!especeStr) continue;
        
        // Séparer les espèces si elles sont listées ensemble
        const especes = especeStr.split(',').map((e: string) => e.trim());
        
        for (const espece of especes) {
          const normalized = normalizeEspeceName(espece);
          
          if (!especeMap.has(normalized)) {
            // Déterminer la catégorie
            let categorie: "salmonidés" | "carnassiers" | undefined;
            
            if (espece.toLowerCase().includes('truite') || 
                espece.toLowerCase().includes('omble') || 
                espece.toLowerCase().includes('touladi') ||
                espece.toLowerCase().includes('moulac')) {
              categorie = "salmonidés";
            } else if (espece.toLowerCase().includes('brochet') || 
                       espece.toLowerCase().includes('doré') || 
                       espece.toLowerCase().includes('maskinongé') ||
                       espece.toLowerCase().includes('achigan')) {
              categorie = "carnassiers";
            }
            
            especeMap.set(normalized, {
              nomCommun: espece,
              categorie,
            });
          }
        }
      }
    }
    
    console.log(`✅ ${especeMap.size} espèces uniques trouvées`);
    
    // ============================================
    // ÉTAPE 4: Insérer les espèces
    // ============================================
    console.log("📍 Étape 4: Insertion des espèces...");
    
    const especeIdMap = new Map<string, any>();
    
    for (const [key, espece] of especeMap) {
      const id = await ctx.db.insert("especes", espece);
      especeIdMap.set(key, id);
    }
    
    console.log(`✅ ${especeIdMap.size} espèces insérées`);
    
    // ============================================
    // ÉTAPE 5: Insérer les lacs
    // ============================================
    console.log("📍 Étape 5: Insertion des lacs...");
    
    let lacsInserted = 0;
    let lacsSkipped = 0;
    
    for (const lac of data) {
      try {
        // Vérifier les données minimales requises
        if (!lac.nomDuLac || !lac.coordonnees || !lac.regionAdministrativeQuebec) {
          console.warn(`⚠️  Lac ignoré (données incomplètes): ${lac.nomDuLac || 'inconnu'}`);
          lacsSkipped++;
          continue;
        }
        
        // Collecter les IDs des espèces
        const especeIds: any[] = [];
        if (lac.espece && Array.isArray(lac.espece)) {
          for (const especeStr of lac.espece) {
            if (!especeStr) continue;
            
            const especes = especeStr.split(',').map((e: string) => e.trim());
            for (const espece of especes) {
              const normalized = normalizeEspeceName(espece);
              const id = especeIdMap.get(normalized);
              if (id) especeIds.push(id);
            }
          }
        }
        
        // Collecter les hébergements avec leurs IDs
        const hebergements: any[] = [];
        if (lac.hebergement && Array.isArray(lac.hebergement)) {
          for (const heb of lac.hebergement) {
            if (!heb.camping || !heb.coordonnees) continue;
            
            const key = `${heb.camping}-${heb.coordonnees.latitude}-${heb.coordonnees.longitude}`;
            const campingId = campingIdMap.get(key);
            
            if (campingId) {
              hebergements.push({
                campingId,
                distanceDepuisAcceuil: getDistanceValue(heb.distanceCampingAcceuil),
                distanceDepuisLac: getDistanceValue(heb.distanceCampingLac),
              });
            }
          }
        }
        
        // Préparer la superficie
        let superficie: { hectares: number; km2: number } | undefined;
        if (lac.superficie && Array.isArray(lac.superficie)) {
          const haData = lac.superficie.find((s: any) => s.unite === 'ha');
          const km2Data = lac.superficie.find((s: any) => s.unite === 'km2');
          
          if (haData && km2Data) {
            superficie = {
              hectares: haData.valeur,
              km2: km2Data.valeur,
            };
          }
        }
        
        // Préparer l'objet lac
        const lacData = {
          nomDuLac: lac.nomDuLac,
          site: lac.juridiction?.site || undefined,
          zone: lac.juridiction?.zone || undefined,
          regionAdministrativeQuebec: lac.regionAdministrativeQuebec,
          coordonnees: {
            latitude: lac.coordonnees.latitude,
            longitude: lac.coordonnees.longitude,
          },
          acces: {
            portage: lac.acces?.portage || "Information non disponible",
            acceuil: lac.acces?.acceuil || "Non spécifié",
            distanceAcceuilLac: getDistanceValue(lac.acces?.distanceAcceuilLac) || { temps: 0, kilometrage: 0 },
            accessible: lac.acces?.accessible || "véhicule utilitaire sport (VUS)",
          },
          embarcation: {
            type: lac.embarcation?.type || "Location",
            motorisation: {
              type: lac.embarcation?.motorisation?.type || "electrique",
              puissanceMin: lac.embarcation?.motorisation?.puissanceMin,
            },
          },
          superficie,
          especeIds,
          hebergements,
          createdAt: Date.now(),
        };
        
        await ctx.db.insert("lacs", lacData);
        lacsInserted++;
        
        if (lacsInserted % 10 === 0) {
          console.log(`   ${lacsInserted} lacs insérés...`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion du lac ${lac.nomDuLac}:`, error);
        lacsSkipped++;
      }
    }
    
    console.log(`\n✨ Migration terminée!`);
    console.log(`   📊 Campings: ${campingIdMap.size}`);
    console.log(`   🐟 Espèces: ${especeIdMap.size}`);
    console.log(`   🏞️  Lacs: ${lacsInserted} insérés, ${lacsSkipped} ignorés`);
    
    return {
      success: true,
      stats: {
        campings: campingIdMap.size,
        especes: especeIdMap.size,
        lacsInserted,
        lacsSkipped,
      },
    };
  },
});