'use client';

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
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  SelectChangeEvent,
} from "@mui/material";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import { siteOptions } from "../components/LacDialog"; // todo mettre dans un fichier de constantes partagé

const MOTORISATION_OPTIONS = [
  { label: "Toutes motorisations", value: "" },
  { label: "Électrique seulement", value: "electrique" },
  { label: "Essence seulement", value: "essence" },
  { label: "Aucune motorisation", value: "aucune" },
];

const TYPE_EMBARCATION_OPTIONS = [
  { label: "Tous les types", value: "" },
  { label: "Embarcation Sépaq fournie", value: "Embarcation Sépaq fournie" },
  { label: "Embarcation personnelle", value: "Embarcation personnelle" },
  { label: "Location", value: "Location" },
];

const SearchFilter = () => {
  const [search, setSearch] = useState("");
  const [motorisation, setMotorisation] = useState("");
  const [typeEmbarcation, setTypeEmbarcation] = useState("");
  const [site, setSite] = useState("");

  const [debouncedSearch] = useDebounce(search, 300);

  const results = useQuery(api.lacsCopy.getAllLacsDynamicFilters, {
    search: debouncedSearch,
    motorisation,
    typeEmbarcation,
    site,
  });

  const hasActiveFilters = search || motorisation || typeEmbarcation;

  const handleReset = () => {
    setSearch("");
    setMotorisation("");
    setTypeEmbarcation("");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>

      {/* Barre de filtres */}
      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">

        <TextField
          label="Rechercher un lac"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 250 }}
        />

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
          {search && (
            <Chip
              label={`Nom : ${search}`}
              onDelete={() => setSearch("")}
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

      {/* Compteur de résultats */}
      <Typography variant="body2" color="text.secondary">
        {results === undefined ? (
          <CircularProgress size={14} sx={{ mr: 1 }} />
        ) : (
          `${results.length} lac(s) trouvé(s)`
        )}
      </Typography>

      {/* Liste des résultats */}
      <Stack gap={2}>
        {results?.map((lac) => (
          <Card key={lac._id} variant="outlined">
            <CardContent>
              <Typography variant="h6">{lac.nomDuLac}</Typography>
              <Typography variant="body2" color="text.secondary">
                {lac.embarcation.motorisation.necessaire}
              </Typography>
            </CardContent>
          </Card>
        ))}

        {results?.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Aucun lac ne correspond à vos critères.
          </Typography>
        )}
      </Stack>

    </Box>
  );
}

export default SearchFilter;