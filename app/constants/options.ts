export const EMBARCATION_TYPES = [ //todo doublon, + devrait etre defini par convex
  "Embarcation personnelle",
  "Embarcation Sépaq fournie",
  "Embarcation Pourvoirie fournie",
  "Location"
] as const;

export const MOTORISATION_TYPES = [
  "electrique",
  "essence",
  "a determiner"
] as const;

export const VEHICLE_TYPES = [
  "auto",
  "véhicule utilitaire sport (VUS)",
  "camion 4x4"
] as const;