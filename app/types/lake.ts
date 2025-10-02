export interface Lake {
    _id: string;
    nomDuLac: string;
    regionAdministrativeQuebec: string;
    juridiction: {
        organisme: string;
        site: string;
    };
    // Champ ajouté pour le filtrage
    reserveFaunique?: string;
}