import { Doc, Id } from "../../convex/_generated/dataModel";
import { EspeceDoc } from "./especes.type";
import { HebergementDoc } from "./hebergements.type";

export type LacDoc = Doc<"lacs">;

export type LacFormData = Omit<LacDoc, "_id" | "_creationTime" | "createdAt" | "updatedAt">;

export type LacHebergementFormData = {
  campingId: Id<"campings"> | null;
  distanceDepuisLac?: { temps: number; kilometrage: number };
  distanceDepuisAcceuil?: { temps: number; kilometrage: number };
};

export type LacHebergementItem = Partial<Omit<HebergementDoc, "_id" | "nom">> & {
  _id?: Id<"campings">;
  campingId?: Id<"campings">;
  nom?: string,
  distanceDepuisLac?: LacDistance;
  distanceDepuisAcceuil?: LacDistance;
};

export type LacDistance = { temps: number; kilometrage: number };

export type LacEmbarcation = LacFormData["embarcation"];
export type LacMotorisation = LacFormData["embarcation"]["motorisation"];
export type LacAcces = LacFormData["acces"];
export type LacSuperficie = LacFormData["superficie"];

export interface LacEnriched extends Omit<LacDoc, "hebergements"> {
  especes: EspeceDoc[];
  hebergements: LacHebergementItem[];
  hebergementsNonSepaq: LacHebergementItem[];
}

export const defaultLacInput: LacFormData = {
  nomDuLac: "",
  regionAdministrativeQuebec: null,
  coordonnees: { latitude: 0, longitude: 0 },
  acces: {
    portage: "Aucune marche d'approche nécessaire",
    acceuil: "",
    distanceAcceuilLac: { temps: 0, kilometrage: 0 },
    accessible: "véhicule utilitaire sport (VUS)",
  },
  embarcation: {
    type: "Embarcation Sépaq fournie",
    motorisation: {
      puissance: { minimum: null, maximum: null },
      necessaire: "a determiner",
    },
  },
  especeIds: [],
  hebergements: [],
  zone: null,
  site: null,
  superficie: null,
};