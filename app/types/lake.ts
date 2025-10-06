export interface Acces {
    portage: "Aucune marche d'approche nécessaire",
    acceuil: string,
    distanceAcceuilLac: {
        temps?: number, // en minutes
        kilometrage?: number // en km
    },
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
    camping: "Camping Manoir Lac Caché",
    organisme: string,
    distanceCampingAcceuil: {
        temps: number, // en minutes
        kilometrage: number // en km
    },
    distanceCampingLac: {
        temps: number, // en minutes
        kilometrage: number // en km
    },
    eau: boolean,
    electricite: boolean,
    coordonnees: {
        latitude: number,
        longitude: number
    }
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
    acces: Acces | undefined;
    embarcation: Embarcation;
    especes: string[];
    camping: boolean;
    coordonnees: {
        latitude: number;
        longitude: number;
    }
    superficie: Superficie[] | null
    hebergement: Hebergement[] | null
}