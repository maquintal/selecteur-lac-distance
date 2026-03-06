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

export type LacDistance = { temps: number; kilometrage: number };

export type LacEmbarcation = LacFormData["embarcation"];
export type LacMotorisation = LacFormData["embarcation"]["motorisation"];
export type LacAcces = LacFormData["acces"];

export interface LacEnriched extends Omit<LacDoc, "hebergements"> {
  especes: EspeceDoc[];
  hebergements: (HebergementDoc & {
    campingId: Id<"campings">;
    distanceDepuisLac?: LacDistance;
    distanceDepuisAcceuil?: LacDistance;
  })[];
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
  zone: undefined,
  site: "",
  superficie: undefined,
};