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
  Chip,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import { siteOptions } from "../components/LacDialog"; // todo ces valeurs devraient venir de la definition du schema convex
import LakesSearchCards from "./LakesSearchCards";

const MOTORISATION_OPTIONS = [ // ces valeurs devraient venir de la definition du schema convex
  { label: "Toutes motorisations", value: "" },
  { label: "Électrique seulement", value: "electrique" },
  { label: "Essence seulement", value: "essence" },
  { label: "Aucune motorisation", value: "aucune" },
];

const TYPE_EMBARCATION_OPTIONS = [ // ces valeurs devraient venir de la definition du schema convex
  { label: "Tous les types", value: "" },
  { label: "Embarcation Sépaq fournie", value: "Embarcation Sépaq fournie" },
  { label: "Embarcation personnelle", value: "Embarcation personnelle" },
  { label: "Location", value: "Location" },
];

const SearchFilters = () => {
  const [nomLac, setNomLac] = useState("");
  // setter defini, en attendant, mais devrait prevoir dans la query en amont
  const [motorisation, setMotorisation] = useState("electrique");
  const [typeEmbarcation, setTypeEmbarcation] = useState("Embarcation Sépaq fournie");
  const [site, setSite] = useState("Mastigouche");
  const [superficieMin, setSuperficieMin] = useState<number | "">(4);
  const [superficieMax, setSuperficieMax] = useState<number | "">(30);
  const [accessible, setAccessible] = useState("auto_vus");
  const [scenario, setScenario] = useState("");

  const [debouncedSearch] = useDebounce(nomLac, 300);

  const results = useQuery(api.lacsDynamicFilters.getAllLacsDynamicFilters, {
    nomLac: debouncedSearch,
    motorisation,
    typeEmbarcation,
    site,
    superficieMin: superficieMin === "" ? undefined : superficieMin,
    superficieMax: superficieMax === "" ? undefined : superficieMax,
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
    setSuperficieMin("");
    setSuperficieMax("");
    setAccessible("");
    setScenario("");
  };

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
            <MenuItem value="">Tous les scénarios</MenuItem>
            <MenuItem value="journee">Pêche d'un jour</MenuItem>
            <MenuItem value="sejour">Séjour de Pêche</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Site</InputLabel>
          <Select
            value={site}
            label="Site"
            onChange={(e: SelectChangeEvent) => setSite(e.target.value)}
          >
            {siteOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Superficie max</InputLabel>
          <Select
            value={superficieMin} // todo ajuster le type pour permettre "" ou number
            label="Superficie min"
            onChange={(e: SelectChangeEvent) => setSuperficieMin(e.target.value as number | "")}
          >
            <MenuItem value="">Tous les supercifies</MenuItem>
            <MenuItem value={4}>≥ 4 ha</MenuItem>
            <MenuItem value={10}>≥ 10 ha</MenuItem>
            <MenuItem value={30}>≥ 30 ha</MenuItem>
            <MenuItem value={50}>≥ 50 ha</MenuItem>
            <MenuItem value={100}>≥ 100 ha</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Superficie max</InputLabel>
          <Select
            value={superficieMax} // todo ajuster le type pour permettre "" ou number
            label="Superficie max"
            onChange={(e: SelectChangeEvent) => setSuperficieMax(e.target.value as number | "")}
          >
            <MenuItem value="">Tous les supercifies</MenuItem>
            <MenuItem value={4}>≤ 4 ha</MenuItem>
            <MenuItem value={10}>≤ 10 ha</MenuItem>
            <MenuItem value={30}>≤ 30 ha</MenuItem>
            <MenuItem value={50}>≤ 50 ha</MenuItem>
            <MenuItem value={100}>≤ 100 ha</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel>Motorisation</InputLabel>
          <Select
            value={motorisation}
            label="Motorisation"
            onChange={(e: SelectChangeEvent) => setMotorisation(e.target.value)}
          >
            {MOTORISATION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
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
            <MenuItem value="auto_vus">Auto / VUS</MenuItem>
            <MenuItem value="camion 4x4">Camion 4x4</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 250 }}>
          <InputLabel>Type d'embarcation</InputLabel>
          <Select
            value={typeEmbarcation}
            label="Type d'embarcation"
            onChange={(e: SelectChangeEvent) => setTypeEmbarcation(e.target.value)}
          >
            {TYPE_EMBARCATION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Button
            variant="text"
            color="error"
            size="small"
            startIcon={<FilterListOffIcon />}
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
        )}
      </Stack>

      {/* Chips des filtres actifs */}
      {hasActiveFilters && (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {scenario && (
            <Chip
              label={`Scénario : ${scenario === "journee" ? "Pêche d'un jour" : "Séjour de Pêche"}`}
              onDelete={() => setScenario("")}
              size="small"
              color="primary"
            />
          )}
          {nomLac && (
            <Chip
              label={`Nom : ${nomLac}`}
              onDelete={() => setNomLac("")}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {motorisation && (
            <Chip
              label={`Motorisation : ${motorisation}`}
              onDelete={() => setMotorisation("")}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {typeEmbarcation && (
            <Chip
              label={`Type : ${typeEmbarcation}`}
              onDelete={() => setTypeEmbarcation("")}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      )}

      {/* Résultats ou spinner centré */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        // todo ajuster le type des données passées à LakesSearchCards
        <LakesSearchCards data={results} />
      )}

    </Box>
  );
}

export default SearchFilters;