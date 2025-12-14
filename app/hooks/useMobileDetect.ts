'use client';

import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour détecter la taille de l'écran en mobile-first
 * Évite les problèmes d'hydratation avec useMediaQuery
 */
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Définir la taille initiale
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 960); // md breakpoint = 960px
    };

    // Vérifier immédiatement
    checkMobile();
    setIsLoaded(true);

    // Ajouter un listener pour les changements de taille
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Retourner false au SSR, puis la vraie valeur au client
  return { isMobile, isLoaded };
}
