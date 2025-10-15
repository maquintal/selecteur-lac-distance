export type HebergementModification = {
  lacId: string;
  campingId: string;
  distanceDepuisLac?: {
    kilometrage: number;
    temps: number;
  };
};