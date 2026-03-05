import { Doc } from "../../convex/_generated/dataModel";

export type HebergementDoc = Doc<"campings">;

export type HebergementFormData = Omit<HebergementDoc, "_id" | "_creationTime">

export type TerrainInput = NonNullable<HebergementFormData["terrains"]>[number];

export type Commodites = {
  eau: boolean;
  electricite: boolean;
};

export const defaultCampingInput: HebergementFormData = {
  nom: "",
  organisme: "privé",
  coordonnees: {
    latitude: 0,
    longitude: 0,
  },
  commodites: {
    eau: false,
    electricite: false,
  },
  terrains: [],
};

// hebergements.type.ts

const toArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (val) return [String(val)];
  return [];
};

const normalizeTerrain = (tr: unknown): TerrainInput => {
  const t = tr as Partial<TerrainInput>;
  return {
    nom: t.nom ?? '',
    acces: toArray(t.acces),
    services: t.services ?? [],
    equipementAdmissible: t.equipementAdmissible ?? [],
    capaciteMaximale: t.capaciteMaximale ?? '',
    selections: toArray(t.selections),
    description: toArray(t.description),
    important: toArray(t.important),
  };
};

export const normalizeHebergement = (camping: HebergementDoc): HebergementFormData => {
  const { _id, _creationTime, ...rest } = camping;
  return {
    ...rest,
    terrains: (rest.terrains ?? []).map(normalizeTerrain),
  };
};