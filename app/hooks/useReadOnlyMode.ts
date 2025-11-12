/**
 * Hook custom pour vérifier le mode read-only côté client
 * 
 * Utilisation:
 * const isReadOnly = useReadOnlyMode();
 * 
 * Si isReadOnly est true, les boutons de modification doivent être masqués/désactivés
 */

'use client';

import { useEffect, useState } from 'react';

export function useReadOnlyMode(): boolean {
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    // En production (npm run start), on détecte le mode read-only
    // On peut vérifier cela de deux façons:
    // 1. Via une API call
    // 2. Via une variable d'environnement exposée au client
    
    // Méthode simple: utiliser une API endpoint
    const checkReadOnlyMode = async () => {
      try {
        const response = await fetch('/api/readOnlyMode', { 
          method: 'GET',
          cache: 'force-cache' // Cache la réponse car elle ne change pas
        });
        const data = await response.json();
        setIsReadOnly(data.isReadOnly);
      } catch (error) {
        // En cas d'erreur, on assume qu'on est en mode normal
        console.warn('Impossible de vérifier le mode read-only', error);
        setIsReadOnly(false);
      }
    };

    checkReadOnlyMode();
  }, []);

  return isReadOnly;
}
