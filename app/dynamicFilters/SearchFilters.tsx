"use client";

import { useState } from "react";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "use-debounce";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
  CircularProgress,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import LakesSearchCards from "./LakesSearchCards";
import {
  ENUMS_LACS_EMBARCATION,
  ENUMS_LACS_SITE,
  ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE,
  ENUMS_LACS_ACCESSIBLE
} from "@/convex/schemas/lacs.schema";
import { ISOCategory } from "../components/NavigationSafety/NavigationSafety.types";

const ENUMS_SCENARIOS = [
  { label: "Tous les scénarios", value: "" },
  { label: "Pêche d'un jour", value: "journee" },
  { label: "Séjour de Pêche", value: "sejour" },
  { label: "Séjour de Pêche non Sepaq", value: "sejour2" },
]

// Source unique des seuils ISO 12217
const SUPERFICIE_THRESHOLDS: { value: number; isoCategory: ISOCategory }[] = [
  { value: 3, isoCategory: 'D' }, // Micro-lac
  { value: 15, isoCategory: 'D' }, // Petit lac
  { value: 40, isoCategory: 'D' }, // Lac modeste
  { value: 80, isoCategory: 'D' }, // Lac ouvert ⚠️
  { value: 200, isoCategory: 'C+' }, // Lac exposé 🔴
  { value: 500, isoCategory: 'C' }, // Grand lac 🚫
];

// Dérivés — seul l'opérateur change
const SUPERFICIE_MIN_OPTIONS = SUPERFICIE_THRESHOLDS.map(({ value, isoCategory }) => ({
  value,
  isoCategory,
  label: `≥ ${value} ha`,
}));

const SUPERFICIE_MAX_OPTIONS = SUPERFICIE_THRESHOLDS.map(({ value, isoCategory }) => ({
  value,
  isoCategory,
  label: `≤ ${value} ha`,
}));

const SearchFilters = () => {
  const [nomLac, setNomLac] = useState("");
  // setter defini, en attendant, mais devrait prevoir dans la query en amont
  const [motorisation, setMotorisation] = useState("electrique");
  const [typeEmbarcation, setTypeEmbarcation] = useState("Embarcation Sépaq fournie");
  const [site, setSite] = useState("Mastigouche");
  const [superficieMin, setSuperficieMin] = useState<number | undefined>(4);
  const [superficieMax, setSuperficieMax] = useState<number | undefined>(40);
  const [accessible, setAccessible] = useState("auto_vus");
  const [scenario, setScenario] = useState("");

  const [debouncedSearch] = useDebounce(nomLac, 300);

  const results = useQuery(api.lacs.getAllLacsDynamicFilters, {
    nomLac: debouncedSearch,
    motorisation,
    typeEmbarcation,
    site,
    superficieMin: superficieMin,
    superficieMax: superficieMax,
    accessible,
    scenario,
  });

  const isLoading = results === undefined;
  const hasActiveFilters = nomLac ||
    motorisation ||
    typeEmbarcation ||
    site ||
    superficieMax ||
    accessible ||
    scenario;

  const handleReset = () => {
    setNomLac("");
    setMotorisation("");
    setTypeEmbarcation("");
    setSite("");
    setSuperficieMin(undefined);
    setSuperficieMax(undefined);
    setAccessible("");
    setScenario("");
  };

  const resultLabel = `${results?.length} ${results?.length === 1 ? 'résultat' : 'résultats'}`;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>

      {/* Barre de filtres */}
      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">

        <TextField
          label="Rechercher un lac"
          variant="outlined"
          size="small"
          value={nomLac}
          onChange={(e) => setNomLac(e.target.value)}
          sx={{ width: 250 }}
        />

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Scénario</InputLabel>
          <Select
            value={scenario}
            label="Scénario"
            onChange={(e: SelectChangeEvent) => setScenario(e.target.value)}
          >
            {ENUMS_SCENARIOS.map((item) => {
              return <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Site</InputLabel>
          <Select
            value={site}
            label="Site"
            onChange={(e: SelectChangeEvent) => setSite(e.target.value)}
          >
            <MenuItem value="">Tous les Sites</MenuItem>
            <MenuItem value="__aucun__">Sans site assigné</MenuItem>
            {ENUMS_LACS_SITE.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Superficie minimum</InputLabel>
          <Select
            value={superficieMin ?? ""}
            onChange={(e: SelectChangeEvent<number | "">) => {
              const val = e.target.value;
              setSuperficieMin(val === "" ? undefined : Number(val));
            }}
          >
            <MenuItem value="">Toutes les superficies</MenuItem>
            {SUPERFICIE_MIN_OPTIONS.map(({ value, label, isoCategory }) => (
              <MenuItem key={value} value={value}>
                {label}
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ISO Cat. {isoCategory}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Superficie maximum</InputLabel>
          <Select
            value={superficieMax ?? ""}
            onChange={(e: SelectChangeEvent<number | "">) => {
              const val = e.target.value;
              setSuperficieMax(val === "" ? undefined : Number(val)); // ← bug corrigé : setSuperficieMax
            }}
          >
            <MenuItem value="">Toutes les superficies</MenuItem>
            {SUPERFICIE_MAX_OPTIONS.map(({ value, label, isoCategory }) => (
              <MenuItem key={value} value={value}>
                {label}
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  ISO Cat. {isoCategory}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Motorisation</InputLabel>
          <Select
            value={motorisation}
            label="Motorisation"
            onChange={(e: SelectChangeEvent) => setMotorisation(e.target.value)}
          >
            <MenuItem value="">{"Tous"}</MenuItem>
            {ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE.map((item) => {
              return <MenuItem key={item} value={item}>{item}</MenuItem>
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Accessibilité</InputLabel>
          <Select
            value={accessible}
            label="Accessibilité"
            onChange={(e: SelectChangeEvent) => setAccessible(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            {ENUMS_LACS_ACCESSIBLE.map((item) => {
              return <MenuItem key={item} value={item} >{item}</MenuItem>
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 250 }}>
          <InputLabel>{"Type d'embarcation"}</InputLabel>
          <Select
            value={typeEmbarcation}
            label="Type d'embarcation"
            onChange={(e: SelectChangeEvent) => setTypeEmbarcation(e.target.value)}
          >
            <MenuItem value="">{"Tous"}</MenuItem>
            {ENUMS_LACS_EMBARCATION.map((item) => {
              return <MenuItem key={item} value={item}>{item}</MenuItem>
            })}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <>
            <Button
              variant="text"
              color="error"
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={handleReset}
            >
              Réinitialiser
            </Button>
            {resultLabel}
          </>

        )}
      </Stack>

      {/* Résultats ou spinner centré */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <LakesSearchCards data={results} scenario={scenario} />
      )}

    </Box>
  );
}

export default SearchFilters;