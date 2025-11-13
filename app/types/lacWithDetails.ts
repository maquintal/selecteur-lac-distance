import { Id } from "../../convex/_generated/dataModel";

export interface LacWithDetails {
    _id: Id<"lacs">;
    _creationTime: number;
    nomDuLac: string;
    site?: string;
    zone?: number;
    regionAdministrativeQuebec: string;
    coordonnees: {
        latitude: number;
        longitude: number;
    };
    acces: {
        portage: string;
        acceuil: string;
        distanceAcceuilLac: {
            temps: number;
            kilometrage: number;
        };
        accessible: "auto" | "véhicule utilitaire sport (VUS)" | "camion 4x4";
    };
    embarcation: {
        type: "Embarcation personnelle" | "Embarcation Sépaq fournie" | "Embarcation Pourvoirie fournie" | "Location";
        motorisation: {
            puissance?: {
                minimum?: number | null;
                maximum?: number | null;
            };
            necessaire?: "electrique" | "essence" | "a determiner";
        };
    };
    superficie?: {
        hectares: number;
        km2: number;
    };
    especeIds: Id<"especes">[];
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
    createdAt: number;
    updatedAt?: number;
    isChoixInteressant?: boolean;
    especes: {
        _id: Id<"especes">;
        _creationTime: number;
        nomScientifique?: string;
        categorie?: "salmonidés" | "carnassiers";
        nomCommun: string;
    }[];
}