import { Doc, Id } from "../../convex/_generated/dataModel";

// Types enrichis avec les champs Convex (_id, _creationTime)
export type { Doc } from "../../convex/_generated/dataModel";
export type LacDoc = Doc<"lacs">;
export type CampingDoc = Doc<"campings">;
export type EspeceDoc = Doc<"especes">;
export type SiteDoc = Doc<"sites">;
export type HebergementLacDoc = Doc<"hebergement_lacs">;

// Types pour les nouveaux documents (sans les champs système)
export type NewLacInput = Omit<LacDoc, "_id" | "_creationTime" | "createdAt" | "updatedAt">;
export type NewCampingInput = Omit<CampingDoc, "_id" | "_creationTime">;
export type NewEspeceInput = Omit<EspeceDoc, "_id" | "_creationTime">;
export type NewSiteInput = Omit<SiteDoc, "_id" | "_creationTime">;
export type NewHebergementLacInput = Omit<HebergementLacDoc, "_id" | "_creationTime">;

// Type pour les relations d'hébergement dans un lac
export type HebergementLac = {
  campingId: Id<"campings">;
  distanceDepuisAcceuil?: number | {
    temps: number;
    kilometrage: number;
  };
  distanceDepuisLac?: {
    temps: number;
    kilometrage: number;
  };
};

// Type enrichi pour un lac avec ses relations
export type LacWithDetails = LacDoc & {
  site: SiteDoc | null;
  especes: EspeceDoc[];
  hebergements: (CampingDoc & {
    distanceDepuisAcceuil?: number | {
      temps: number;
      kilometrage: number;
    };
    distanceDepuisLac?: {
      temps: number;
      kilometrage: number;
    };
  })[];
};

// Valeurs par défaut pour les nouveaux documents
export const defaultLacInput: NewLacInput = {
  nomDuLac: "",
  regionAdministrativeQuebec: "",
  coordonnees: {
    latitude: 0,
    longitude: 0,
  },
  acces: {
    portage: "",
    acceuil: "",
    distanceAcceuilLac: 0,
    accessible: "",
  },
  embarcation: {
    type: "",
    motorisation: {
      type: "aucune",
    },
  },
  especeIds: [],
  hebergements: [],
  zone: undefined,
  siteId: undefined,
  superficie: undefined,
};

export const defaultCampingInput: NewCampingInput = {
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
  regionAdministrative: "",
};

export const defaultEspeceInput: NewEspeceInput = {
  nomCommun: "",
  nomScientifique: undefined,
  aliases: [],
  categorie: undefined,
};

export const defaultSiteInput: NewSiteInput = {
  nom: "",
  organisme: "",
  type: "gouvernemental",
  regionAdministrative: "",
};