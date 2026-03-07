import { Doc } from "../../convex/_generated/dataModel";

import { ESPECES_CATEGORIES } from "@/convex/schemas/especes.schema";

export type EspeceDoc = Doc<"especes">;

export type EspeceFormData = Omit<EspeceDoc, "_id" | "_creationTime" | "categorie"> & {
  categorie?: typeof ESPECES_CATEGORIES[number] | '';
};

export const defaultEspeceInput: EspeceFormData = {
  nomCommun: "",
  nomScientifique: "",
  categorie: ""
};