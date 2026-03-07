// import { Doc, Id } from "../../convex/_generated/dataModel";
// import { EspeceDoc } from "./especes.type";
// import { HebergementDoc } from "./hebergements.type";

// Types enrichis avec les champs Convex (_id, _creationTime)
// export type { Doc } from "../../convex/_generated/dataModel";
// export type LacDoc = Doc<"lacs">;
// export type CampingDoc = Doc<"campings">;

// export type SiteDoc = Doc<"sites">;

// Types pour les nouveaux documents (sans les champs système)
// export type NewLacInput = Omit<LacDoc, "_id" | "_creationTime" | "createdAt" | "updatedAt">;
// export type NewCampingInput = Omit<CampingDoc, "_id" | "_creationTime">;

// export type HebergementLacInput = Omit<LacDoc, "_id" | "_creationTime"> & { campingId: Id<"campings"> };

// export interface LacWithDetails extends Omit<LacDoc, "hebergements"> {
//   especes: EspeceDoc[];
//   hebergements: HebergementDoc[]
// };

// Valeurs par défaut pour les nouveaux documents
// export const defaultLacInput: NewLacInput = {
//   nomDuLac: "",
//   regionAdministrativeQuebec: "",
//   coordonnees: {
//     latitude: 0,
//     longitude: 0,
//   },
//   acces: {
//     portage: "Aucune marche d'approche nécessaire",
//     acceuil: "",
//     distanceAcceuilLac: {
//       temps: 0,
//       kilometrage: 0,
//     },
//     accessible: "véhicule utilitaire sport (VUS)",
//   },
//   embarcation: {
//     type: "Location",
//     motorisation: {
//       puissance: {
//         minimum: null,
//         maximum: null,
//       },
//       necessaire: "a determiner",
//     },
//   },
//   especeIds: [],
//   hebergements: [],
//   zone: undefined,
//   site: "",
//   superficie: undefined,
// };

// export const defaultCampingInput: NewCampingInput = {
//   nom: "",
//   organisme: "privé",
//   coordonnees: {
//     latitude: 0,
//     longitude: 0,
//   },
//   commodites: {
//     eau: false,
//     electricite: false,
//   },
//   terrains: [],
// };