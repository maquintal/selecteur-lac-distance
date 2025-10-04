export interface Acces {
    portage: "Aucune marche d'approche nécessaire",
    acceuil: string,
    distanceAcceuilLac: number,
    accessible: "auto" | "véhicule utilitaire sport (VUS)" | "camion 4x4"
}

export interface Embarcation {
    type: string;
    motorisation: {
        type: "electrique" | "essence";
        puissanceMax: number; // en HP
    };
}

export interface Lake {
    _id: string;
    nomDuLac: string;
    regionAdministrativeQuebec: string;
    juridiction: {
        organisme: string;
        site: string;
    };
    reserveFaunique?: string;
    acces: Acces;
    embarcation: Embarcation
    especes: string[];
    camping: boolean;
    latitude: number;
    longitude: number;
}