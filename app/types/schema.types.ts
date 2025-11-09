import { Doc, Id } from "../../convex/_generated/dataModel";

// Types enrichis avec les champs Convex (_id, _creationTime)
export type { Doc } from "../../convex/_generated/dataModel";
export type LacDoc = Doc<"lacs">;
export type CampingDoc = Doc<"campings">;
export type EspeceDoc = Doc<"especes">;
// export type SiteDoc = Doc<"sites">;
export type HebergementLacDoc = Doc<"hebergement_lacs">;

// Types pour les nouveaux documents (sans les champs système)
export type NewLacInput = Omit<LacDoc, "_id" | "_creationTime" | "createdAt" | "updatedAt">;
export type NewCampingInput = Omit<CampingDoc, "_id" | "_creationTime">;
export type NewEspeceInput = Omit<EspeceDoc, "_id" | "_creationTime">;
// export type NewSiteInput = Omit<SiteDoc, "_id" | "_creationTime">;
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
  especes: EspeceDoc[];
  hebergements: {
    campingId: Id<"campings">;
    distanceDepuisAcceuil?: {
      temps: number;
      kilometrage: number;
    };
    distanceDepuisLac?: {
      temps: number;
      kilometrage: number;
    };
  }[];
  isChoixInteressant?: boolean;
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
    portage: "Aucune marche d'approche nécessaire",
    acceuil: "",
    distanceAcceuilLac: {
      temps: 0,
      kilometrage: 0,
    },
    accessible: "véhicule utilitaire sport (VUS)",
  },
  embarcation: {
    type: "Location",
    motorisation: {
      puissance: {
        minimum: null,
        maximum: null,
      },
      necessaire: "a determiner",
    },
  },
  especeIds: [],
  hebergements: [],
  zone: undefined,
  site: "",
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
};

export const defaultEspeceInput: NewEspeceInput = {
  nomCommun: "",
  nomScientifique: "",
  // aliases: [],
  categorie: undefined,
};

// export const defaultSiteInput: NewSiteInput = {
//   nom: "",
//   organisme: "",
//   type: "gouvernemental",
//   regionAdministrative: "",
// };