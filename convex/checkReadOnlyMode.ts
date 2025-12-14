/** * Helpers pour vérifier le mode read-only côté Convex (runtime serveur). * * Comportement choisi: * - Si la variable d'environnement READONLY_MODE === 'true' -> bloquer (throw) * - Sinon -> autoriser (y compris en développement ou si non-configuré) * * Remarque: les variables NEXT_PUBLIC_* sont destinées au client Next.js et * peuvent être undefined dans l'environnement d'exécution Convex. Préférez * READONLY_MODE pour la configuration côté serveur. */
export function isReadOnlyConvex(): boolean {
  const readOnlyMode = process.env.READONLY_MODE ?? process.env.NEXT_PUBLIC_READ_ONLY_MODE ?? '';

  return readOnlyMode === 'true';
}

export function checkReadOnlyModeConvex(): boolean {
  if (isReadOnlyConvex()) { throw new Error('Mode read-only activé. Les modifications de données ne sont pas autorisées.'); }

  else { return isReadOnlyConvex() }
}