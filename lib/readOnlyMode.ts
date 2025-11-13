/**
 * Utility pour gérer le mode read-only
 * 
 * En `npm run start` (production build):
 * - NODE_ENV = "production"
 * - Le mode read-only est ACTIVÉ
 * 
 * En `npm run dev` (development):
 * - NODE_ENV = "development"
 * - Modifications autorisées
 */

/**
 * Vérifie si l'application est en mode read-only
 * Retourne true pour les builds de production (npm run start)
 * Retourne false en développement (npm run dev)
 */
export function isReadOnlyMode(): boolean {
  // En production (npm run start), les modifications sont interdites
  return process.env.NODE_ENV === 'production';
}

/**
 * Vérifie si l'application est en mode développement
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Fonction pour lever une erreur si on est en mode read-only
 */
export function checkReadOnlyMode(): void {
  if (isReadOnlyMode()) {
    throw new Error(
      'Cette action est interdite. L\'application est en mode read-only (production).'
    );
  }
}
