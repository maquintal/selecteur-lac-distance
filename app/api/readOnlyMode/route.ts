import { NextResponse } from 'next/server';

/**
 * Route API pour vérifier le mode read-only
 * GET /api/readOnlyMode
 * 
 * Retourne: { isReadOnly: boolean }
 */
export async function GET() {
  try {
    // En production (npm run start), NODE_ENV = "production"
    const isReadOnly = process.env.NODE_ENV === 'production';
    
    return NextResponse.json({ isReadOnly }, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache 1h
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du mode read-only:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du mode' },
      { status: 500 }
    );
  }
}
