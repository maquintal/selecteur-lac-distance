// import { NextResponse } from 'next/server';

// /**
//  * Route API pour vérifier le mode read-only
//  * GET /api/readOnlyMode
//  * 
//  * Retourne: { isReadOnly: boolean }
//  */
// export async function GET() {
//   try {
//     // Vérifier la variable d'environnement READONLY_MODE
//     // Si READONLY_MODE=false, le mode read-only est désactivé
//     // const readOnlyMode = process.env.READONLY_MODE;
//     // const isReadOnly = readOnlyMode !== 'false'; // Activé par défaut, sauf si explicitement désactivé
    
//     return NextResponse.json({ isReadOnly }, {
//       headers: {
//         'Cache-Control': 'public, max-age=3600', // Cache 1h
//       }
//     });
//   } catch (error) {
//     console.error('Erreur lors de la vérification du mode read-only:', error);
//     return NextResponse.json(
//       { error: 'Erreur lors de la vérification du mode' },
//       { status: 500 }
//     );
//   }
// }
