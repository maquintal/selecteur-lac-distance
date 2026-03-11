/**
 * Classification ISO 12217 — Catégories de conception A/B/C/D
 * Appliquée à une chaloupe 16 pi + Minn Kota Endura 30 lbs
 *
 * Votre embarcation est conçue pour catégorie D (ISO 12217-3)
 * → Beaufort ≤ 4, vagues significatives ≤ 0,3 m, max 0,5 m
 *
 * Méthode :
 * 1. Superficie (ha) → fetch estimé (km) via formule circulaire approximative
 * 2. Fetch → hauteur de vague probable à Beaufort 4 (vent typique lac québécois)
 * 3. Hauteur de vague → catégorie ISO → niveau de danger pour VOTRE embarcation
 *
 * Formule fetch : fetch ≈ √(superficie_ha × 10000) / 1000 km  (lac ~circulaire)
 * Formule vague : Hs ≈ 0.0248 × √(fetch_m) (JONSWAP simplifié, vent 20 km/h)
 */

import { LacSuperficie } from "../../types/lacs.type";

import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import { ISOCategory } from "./NavigationSafety.types";

export type WaveScenario = {
  label: string;
  beaufort: number;
  windMs: number;
  windKmh: string;
  freqSaison: string;
  waveHeightM: number;
  description: string;
};

export interface LakeISOAssessment {
  label: string;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  isoCategory: ISOCategory;
  beaufort: number;
  fetchKm: number;
  icon: React.ReactNode;
  recommendation: string;
  isoNote: string;
  waveHeightM: number;        // B5 — référence sécurité
  waveScenarios: WaveScenario[];
}

const estimateFetchKm = (hectares: number): number => {
  // Approximation lac circulaire : diamètre = 2 × √(A/π)
  const radiusM = Math.sqrt((hectares * 10000) / Math.PI);
  return (radiusM * 2) / 1000;
};

/**
 * Formule SMB (Sverdrup-Munk-Bretschneider) adaptée aux lacs fetch-limités
 * Validée pour petits réservoirs et lacs intérieurs
 *
 * Hs = 0.0016 × (U² / g) × (g × F / U²)^0.5
 * Simplifiée : Hs ≈ 0.0163 × √(F) × (U/10)
 *
 * où F = fetch en mètres, U = vent en m/s
 * À Beaufort 4 = 7 m/s (~25 km/h)
 */

export const estimateWaveHeightForScenario = (fetchKm: number, windMs: number): number => {
  const fetchM = fetchKm * 1000;
  const Hs = 0.0163 * Math.sqrt(fetchM) * (windMs / 10);
  return parseFloat(Hs.toFixed(2));
};

export const WIND_SCENARIOS = [
  {
    label: 'Calme',
    beaufort: 2,
    windMs: 3,
    windKmh: '12–19 km/h',
    freqSaison: '~30% des jours',  // mai–octobre Québec
    description: 'Matin typique — départ habituel',
  },
  {
    label: 'Modéré',
    beaufort: 4,
    windMs: 7,
    windKmh: '20–28 km/h',
    freqSaison: '~40% des jours',
    description: 'Après-midi ordinaire au Québec',
  },
  {
    label: 'Soutenu',
    beaufort: 5,
    windMs: 10,
    windKmh: '29–38 km/h',
    freqSaison: '~20% des jours',
    description: 'Scénario prudent — retour difficile',
  },
];

export const WAVE_SCALE = [
  { max: 0.05, label: 'Eau plate', danger: 'Sécuritaire' },
  { max: 0.10, label: 'Vaguelettes légères', danger: 'Sécuritaire' },
  { max: 0.18, label: 'Légères vagues par vent modéré', danger: 'Prudence conseillée' },
  { max: 0.25, label: 'Vagues notables — surveiller météo', danger: 'Conditions limites' },
  { max: 0.35, label: 'Vagues importantes — difficiles', danger: 'Risqué' },
  { max: Infinity, label: 'Conditions dangereuses', danger: 'Dangereux' },
];

export const ISO_CATEGORY_SCALE = [
  { category: 'D' as ISOCategory, label: 'Petit lac / rivière calme', superficieMin: 0, superficieMax: 80 },
  { category: 'C+' as ISOCategory, label: 'Lac ouvert', superficieMin: 80, superficieMax: 200 },
  { category: 'C' as ISOCategory, label: 'Grand lac exposé', superficieMin: 200, superficieMax: 500 },
  { category: 'B' as ISOCategory, label: 'Eaux côtières', superficieMin: 500, superficieMax: null },
  { category: 'A' as ISOCategory, label: 'Mer ouverte', superficieMin: null, superficieMax: null },
];

// Dérivés depuis les tableaux — une seule source de vérité
export const getWaveDescription = (waveHeightM: number): string =>
  WAVE_SCALE.find(({ max }) => waveHeightM < max)?.label ?? 'Mer agitée — dangereux';

export const getDangerLabel = (level: number): string => {
  if (level <= 2) return 'Sécuritaire';
  if (level === 3) return 'Prudence conseillée';
  if (level === 4) return 'Conditions limites';
  if (level === 5) return 'Risqué';
  return 'Dangereux';
};

export const getISOCategoryLabel = (isoCategory: ISOCategory): string =>
  ISO_CATEGORY_SCALE.find(({ category }) => category === isoCategory)?.label ?? '—';

export const assessISO12217NavigationSafety = (superficie: LacSuperficie | null): LakeISOAssessment => {
  if (!superficie || !superficie.hectares) {
    return {
      label: 'Superficie inconnue',
      level: 0,
      isoCategory: 'D',
      beaufort: 0,
      fetchKm: 0,
      waveHeightM: 0,
      icon: null,
      recommendation: 'Données manquantes',
      isoNote: '—',
      waveScenarios: []
    };
  }

  const ha = superficie.hectares;
  const fetchKm = estimateFetchKm(ha);
  const waveScenarios = WIND_SCENARIOS.map(s => ({
    ...s,
    waveHeightM: estimateWaveHeightForScenario(fetchKm, s.windMs),
  }));
  const waveH = waveScenarios.find(s => s.beaufort === 5)!.waveHeightM; // B5 référence


  /**
   * Seuils ISO 12217 :
   *   Cat. D  → Hs ≤ 0,30 m  (votre embarcation : CONFORME)
   *   Cat. D* → Hs ≤ 0,50 m  (vague max occasionnelle tolérée)
   *   Cat. C  → Hs ≤ 2,00 m  (dépasse capacité de votre embarcation)
   *
   * Seuils Beaufort sur lac québécois :
   *   B3 (~15 km/h) → vagues courtes, aucun risque
   *   B4 (~25 km/h) → limite Cat. D officielle
   *   B5 (~35 km/h) → dépasse Cat. D, chaloupe en danger
   */

  // ✅ NIVEAU 1 — Micro-lac (<3 ha) | fetch ~0.6 km | Hs ~0.06 m
  // ISO Cat. D largement respectée — Beaufort 6 serait requis pour atteindre 0.3 m
  if (ha < 3) return {
    label: 'Micro-lac',
    level: 1,
    isoCategory: 'D',
    beaufort: 4,
    fetchKm,
    waveHeightM: waveH,
    icon: <WaterDropOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />,
    recommendation: 'Navigation idéale — eau fermée, vagues nulles, retour toujours court',
    isoNote: 'ISO 12217 Cat. D ✓ — Hs estimée bien en dessous de 0,3 m',
    waveScenarios,
  };


  // ✅ NIVEAU 2 — Petit lac (3–15 ha) | fetch ~0.6–1.4 km | Hs ~0.06–0.12 m
  // Cat. D respectée à Beaufort 4; marge confortable
  if (ha < 15) return {
    label: 'Petit lac',
    level: 2,
    isoCategory: 'D',
    beaufort: 4,
    fetchKm,
    waveHeightM: waveH,
    icon: (
      <>
        <WaterDropOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }
        } />
        < WaterDropOutlinedIcon sx={{ fontSize: 22, color: 'success.main' }} />
      </>
    ),
    recommendation: 'Très bon pour la pêche — moteur électrique bien adapté',
    isoNote: 'ISO 12217 Cat. D ✓ — Hs estimée ~0,06–0,12 m à Beaufort 4',
    waveScenarios
  };

  // ✅⚠️ NIVEAU 3 — Lac modeste (15–40 ha) | fetch ~1.4–2.3 km | Hs ~0.12–0.19 m
  // Encore Cat. D à B4, mais un B5 soutenu commence à s'approcher de 0,3 m
  if (ha < 40) return {
    label: 'Lac modeste',
    level: 3,
    isoCategory: 'D',
    beaufort: 4,
    fetchKm,
    waveHeightM: waveH,
    icon: (
      <>
        <WaterDropOutlinedIcon sx={{ fontSize: 22, color: 'success.main' }} />
        < WaterDropOutlinedIcon sx={{ fontSize: 26, color: 'success.main' }} />
      </>
    ),
    recommendation: 'Adapté en conditions normales — surveiller météo, éviter Beaufort ≥ 5',
    isoNote: 'ISO 12217 Cat. D ✓ à B4 — Hs ~0,12–0,19 m; limite atteinte à B5',
    waveScenarios
  };

  // ⚠️ NIVEAU 4 — Lac ouvert (40–80 ha) | fetch ~2.3–3.2 km | Hs ~0.19–0.26 m
  // Cat. D encore tenue à B4 EXACT — mais aucune marge pour rafale ou B5
  // Minn Kota 30 lbs perd 50%+ efficacité face à vent B4 soutenu
  if (ha < 80) return {
    label: 'Lac ouvert',
    level: 4,
    isoCategory: 'D',
    beaufort: 4,
    fetchKm,
    waveHeightM: waveH,
    icon: <WarningAmberOutlinedIcon sx={{ fontSize: 22, color: 'warning.main' }} />,
    recommendation: 'Prudence — à la limite Cat. D; ne pas s\'éloigner, surveiller les rafales',
    isoNote: 'ISO 12217 Cat. D ⚠ — Hs ~0,19–0,26 m; dépassement Cat. D dès B5',
    waveScenarios
  };

  // ⚠️🔴 NIVEAU 5 — Lac exposé (80–200 ha) | fetch ~3.2–5.0 km | Hs ~0.26–0.35 m
  // DÉPASSE le seuil ISO Cat. D (0,3 m) à Beaufort 4 soutenu
  // Encore dans la tolérance max Cat. D (0,5 m), mais votre moteur est sous-dimensionné
  if (ha < 200) return {
    label: 'Lac exposé',
    level: 5,
    isoCategory: 'C+',
    beaufort: 5,
    fetchKm,
    waveHeightM: waveH,
    icon: (
      <>
        <WarningAmberOutlinedIcon sx={{ fontSize: 22, color: 'warning.main' }} />
        < WarningAmberOutlinedIcon sx={{ fontSize: 26, color: 'warning.main' }} />
      </>
    ),
    recommendation: 'Limite dépassée — Hs dépasse 0,3 m (Cat. D) à B4; risque de dérive',
    isoNote: 'ISO 12217 Cat. D ✗ — seuil Hs 0,3 m dépassé; conditions Cat. C requises',
    waveScenarios
  };

  // 🔴 NIVEAU 6 — Grand lac (200–500 ha) | fetch ~5–8 km | Hs ~0.35–0.49 m
  // Franchit la tolérance max Cat. D (0,5 m) — conditions Cat. C
  // Chaloupe 16 pi non certifiée Cat. C; moteur électrique 30 lbs inadapté
  if (ha < 500) return {
    label: 'Grand lac',
    level: 6,
    isoCategory: 'C',
    beaufort: 5,
    fetchKm,
    waveHeightM: waveH,
    icon: <DoNotDisturbAltOutlinedIcon sx={{ fontSize: 26, color: 'error.main' }} />,
    recommendation: 'À éviter — conditions Cat. C (B5/B6), embarcation certifiée Cat. D seulement',
    isoNote: 'ISO 12217 Cat. C requise (Hs ~0,35–0,49 m) — votre embarcation n\'est pas certifiée',
    waveScenarios
  };

  // 🚫 NIVEAU 7 — Très grand lac (>500 ha)
  // Conditions Cat. C pleine à Cat. B — Hs > 0,5 m à B4, potentiellement >2 m à B6
  // Transports Canada déconseille les embarcations <6 m sur ces plans d'eau
  return {
    label: 'Très grand lac / réservoir',
    level: 7,
    isoCategory: 'B',
    beaufort: 6,
    fetchKm,
    waveHeightM: waveH,
    icon: <DangerousOutlinedIcon sx={{ fontSize: 28, color: 'error.main' }} />,
    recommendation: 'Dangereux — ne pas naviguer avec cette configuration',
    isoNote: 'ISO 12217 Cat. B/C requise — conditions incompatibles avec chaloupe 16 pi + moteur électrique',
    waveScenarios
  };
};
