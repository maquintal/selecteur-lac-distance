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
        puissanceMin: number; // en HP
    };
}

export interface Superficie {
    valeur: number;
    unite: "ha" | "km2";
}

export interface Hebergement {
    camping: string;
    distanceCampingAcceuil: number;
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
    coordonnees: {
        latitude: number;
        longitude: number;
    }
    superficie: Superficie[] | null
    hebergement: Hebergement[] | null
}