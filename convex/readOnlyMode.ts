/**
 * Helper pour vérifier le mode read-only côté Convex
 * 
 * En `npm run start` (production build):
 * - process.env.NODE_ENV = "production"
 * - Les mutations sont bloquées
 */

export function checkReadOnlyModeConvex(): void {
  // Vérifier si on est en production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Mode read-only activé. Les modifications de données ne sont pas autorisées en production.'
    );
  }
}
