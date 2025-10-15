// scripts/runMigration.ts
// 
// COMMENT UTILISER:
// 1. Place tes données JSON dans data/lacs.json
// 2. Exécute: npx tsx scripts/runMigration.ts
//
import { ConvexHttpClient } from "convex/browser";
import lacsData from "../convex/data/lacs.json";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL n'est pas défini dans .env.local");
}

const client = new ConvexHttpClient(CONVEX_URL);

async function runMigration() {
  console.log("🚀 Démarrage de la migration...\n");
  
  try {
    const result = await client.mutation(
      "migrations/populateTables:populateFromJSON" as any,
      { data: lacsData }
    );
    
    console.log("\n✅ Migration terminée avec succès!");
    console.log(result);
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

runMigration();