import { Doc, Id } from "../../convex/_generated/dataModel";

// export type { Doc } from "../../convex/_generated/dataModel";

import { CATEGORIES_ESPECES } from "@/convex/schemas/especes.schema";

export type EspeceDoc = Doc<"especes">;

export type EspeceFormData = Omit<EspeceDoc, "_id" | "_creationTime" | "categorie"> & {
  categorie?: typeof CATEGORIES_ESPECES[number] | '';
};

export const defaultEspeceInput: EspeceFormData = {
  nomCommun: "",
  nomScientifique: "",
  categorie: ""
};