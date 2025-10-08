import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lake } from '@/app/types/lake';

interface LakeStats {
  global: {
    totalLacs: number;
    lacsAvecHebergement: number;
    lacsMoteurElectrique: number;
    lacsMoteurEssence: number;
    lacsSansMotorisation: number;
  };
  parRegion: Array<{
    region: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parSite: Array<{
    site: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parOrganisme: Array<{
    organisme: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parMotorisation: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parTypeEmbarcation: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parAccessibilite: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  especesPopulaires: Array<{
    espece: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  distancesMoyennes: {
    globale: number;
    parSite: Array<{
      site: string;
      distanceMoyenne: number;
    }>;
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("peche_plan_eau");
    const collection = db.collection<Lake>("peche_plan_eau");

    // Obtenir le total de lacs
    const totalLacs = await collection.countDocuments();

    // Stats globales
    const globalStats = await collection.aggregate([
      {
        $facet: {
          avecHebergement: [
            {
              $match: {
                hebergement: { 
                  $elemMatch: { 
                    camping: { $ne: null, $exists: true } 
                  } 
                }
              }
            },
            { $count: "count" }
          ],
          moteurElectrique: [
            {
              $match: {
                "embarcation.motorisation.type": "electrique"
              }
            },
            { $count: "count" }
          ],
          moteurEssence: [
            {
              $match: {
                "embarcation.motorisation.type": "essence"
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]).toArray();

    // Stats par région
    const parRegion = await collection.aggregate([
      {
        $group: {
          _id: "$regionAdministrativeQuebec",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          region: "$_id",
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Stats par site
    const parSite = await collection.aggregate([
      {
        $group: {
          _id: "$juridiction.site",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          site: "$_id",
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Stats par organisme
    const parOrganisme = await collection.aggregate([
      {
        $group: {
          _id: "$juridiction.organisme",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          organisme: "$_id",
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Stats par motorisation
    const parMotorisation = await collection.aggregate([
      {
        $group: {
          _id: "$embarcation.motorisation.type",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          type: { $ifNull: ["$_id", "Non spécifié"] },
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Stats par type d'embarcation
    const parTypeEmbarcation = await collection.aggregate([
      {
        $group: {
          _id: "$embarcation.type",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          type: { $ifNull: ["$_id", "Non spécifié"] },
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Stats par accessibilité
    const parAccessibilite = await collection.aggregate([
      {
        $group: {
          _id: "$acces.accessible",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $project: {
          _id: 0,
          type: { $ifNull: ["$_id", "Non spécifié"] },
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Espèces les plus populaires
    const especesPopulaires = await collection.aggregate([
      {
        $unwind: "$espece"
      },
      {
        $group: {
          _id: "$espece",
          nombreLacs: { $sum: 1 }
        }
      },
      {
        $sort: { nombreLacs: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          espece: "$_id",
          nombreLacs: 1,
          pourcentage: {
            $round: [
              { $multiply: [{ $divide: ["$nombreLacs", totalLacs] }, 100] },
              2
            ]
          }
        }
      }
    ]).toArray();

    // Distances moyennes
    const distancesMoyennes = await collection.aggregate([
      {
        $facet: {
          globale: [
            {
              $group: {
                _id: null,
                distanceMoyenne: { $avg: "$acces.distanceAcceuilLac" }
              }
            }
          ],
          parSite: [
            {
              $group: {
                _id: "$juridiction.site",
                distanceMoyenne: { $avg: "$acces.distanceAcceuilLac" }
              }
            },
            {
              $sort: { distanceMoyenne: 1 }
            },
            {
              $project: {
                _id: 0,
                site: "$_id",
                distanceMoyenne: { $round: ["$distanceMoyenne", 2] }
              }
            }
          ]
        }
      }
    ]).toArray();

    const stats: LakeStats = {
      global: {
        totalLacs,
        lacsAvecHebergement: globalStats[0].avecHebergement[0]?.count || 0,
        lacsMoteurElectrique: globalStats[0].moteurElectrique[0]?.count || 0,
        lacsMoteurEssence: globalStats[0].moteurEssence[0]?.count || 0,
        lacsSansMotorisation: totalLacs - 
          (globalStats[0].moteurElectrique[0]?.count || 0) - 
          (globalStats[0].moteurEssence[0]?.count || 0)
      },
      parRegion,
      parSite,
      parOrganisme,
      parMotorisation,
      parTypeEmbarcation,
      parAccessibilite,
      especesPopulaires,
      distancesMoyennes: {
        globale: Math.round((distancesMoyennes[0].globale[0]?.distanceMoyenne || 0) * 100) / 100,
        parSite: distancesMoyennes[0].parSite
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}