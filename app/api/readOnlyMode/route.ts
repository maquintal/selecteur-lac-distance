// import { NextResponse } from 'next/server';

// /**
//  * GET /api/readOnlyMode
//  * Retourne un objet JSON { isReadOnly: boolean }
//  * Détermine le mode à partir de `READONLY_MODE` puis `NEXT_PUBLIC_READ_ONLY_MODE`.
//  */
// export async function GET() {
// 	try {
// 		const readOnlyMode =
// 			process.env.READONLY_MODE ?? process.env.NEXT_PUBLIC_READ_ONLY_MODE ?? 'false';
// 		const isReadOnly = readOnlyMode === 'true';

// 		return NextResponse.json(
// 			{ isReadOnly },
// 			{
// 				headers: {
// 					'Cache-Control': 'public, max-age=3600',
// 				},
// 			}
// 		);
// 	} catch (error) {
// 		console.error('Erreur lors de la vérification du mode read-only:', error);
// 		return NextResponse.json(
// 			{ error: 'Erreur lors de la vérification du mode' },
// 			{ status: 500 }
// 		);
// 	}
// }
