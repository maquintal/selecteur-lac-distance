'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, IconButton, Autocomplete, Chip, Typography, Stack,
  Accordion, AccordionSummary, AccordionDetails,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CampingDoc, NewCampingInput, defaultCampingInput } from '../types/schema.types';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type CampingDialogProps = {
  open: boolean;
  onClose: () => void;
  camping?: CampingDoc;
  mode: 'create' | 'edit';
};

export default function CampingDialog({ open, onClose, camping, mode }: CampingDialogProps) {
  const [formData, setFormData] = useState<NewCampingInput>(defaultCampingInput);
  const [expandedSet, setExpandedSet] = useState<Record<number, boolean>>({});

  const ACCESS_OPTIONS: readonly string[] = [
    'Accessible en automobile',
  ];

  const SERVICES_OPTIONS: readonly string[] = [
    // 'Eau potable',
    // 'Électricité',
    // 'Toilettes',
    // 'Douches',
    // 'Stationnement',
    // 'Réception',
    // 'Wi-Fi',
  ];

  const TERRAIN_OPTIONS: readonly string[] = [
    // 'Longueur du terrain : 70 pieds (21,3 mètres)',
    // 'Largeur du terrain : 20 pieds (6,1 mètres)',
    // 'Longueur du terrain incluant le stationnement : 70 pieds (21,3 mètres)',
  ];

  const DESCRIPTION_OPTIONS: readonly string[] = [
    'Stationnement sur l\'emplacement',
    'Trou à feu',
    // 'Proche des commodités',
    // 'Ombre partielle',
  ];

  const IMPORTANT_OPTIONS: readonly string[] = [
    // 'Sans fumée',
    // 'Animaux interdits',
    // 'Accessible PMR',
    // 'Zone calme',
  ];

  const EQUIPEMENT_ADMISSIBLE_OPTIONS: readonly string[] = [
    'Tous les types de tentes-roulottes',
    'Tente-roulotte de moins de 6 mètres (20 pieds)',
    'Tente-roulotte de moins de 8 mètres (25 pieds)',
    'Roulotte de moins de 6 mètres (20 pieds)',
    'Roulotte de moins de 8 mètres (25 pieds)'
  ];

  // devrait etre le schema...
  type TerrainInput = {
    nom: string;
    equipementAdmissible?: string[];
    services?: string[];
    capaciteMaximale?: string;
    acces?: string[];
    selections?: string[];
    description?: string[];
    important?: string[];
  };

  // Mutations Convex
  const createCamping = useMutation(api.lacs.createCamping);
  const updateCamping = useMutation(api.lacs.updateCamping);

  // Synchroniser formData avec la prop camping
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && camping) {
        // Extraire seulement les champs modifiables (retirer champs système)
        const { _id, _creationTime, ...rest } = camping;
        const editableData = { ...(rest as unknown as NewCampingInput) };
        // ensure terrains array exists
        if (!editableData.terrains) editableData.terrains = [];
        // normalize terrains fields to expected shapes (arrays, nested terrain fields)
        editableData.terrains = (editableData.terrains || []).map((tr) => {
          const t = tr as unknown as TerrainInput;
          const legacy = tr as unknown as { description?: string | string[]; important?: string | string[] };
          return {
            nom: t.nom ?? '',
            acces: Array.isArray(t?.acces) ? t.acces : (t?.acces ? [String(t.acces)] : []),
            services: t?.services || [],
            equipementAdmissible: t?.equipementAdmissible || [],
            capaciteMaximale: t?.capaciteMaximale || '',
            selections: Array.isArray(t?.selections) ? t.selections : (t?.selections ? [String(t.selections)] : []),
            description: Array.isArray(t?.description) ? t.description : (legacy.description ? (Array.isArray(legacy.description) ? legacy.description : [legacy.description]) : []),
            important: Array.isArray(t?.important) ? t.important : (legacy.important ? (Array.isArray(legacy.important) ? legacy.important : [legacy.important]) : []),
          } as TerrainInput;
        });
        setFormData(editableData as NewCampingInput);
      } else {
        setFormData(defaultCampingInput);
      }
    }
  }, [open, mode, camping]);

  type Coordonnees = {
    latitude: number;
    longitude: number;
  };

  // Terrains helpers (add / remove / update)
  const handleAddTerrain = () => {
    setFormData(prev => ({
      ...prev,
      terrains: [...(prev.terrains ?? []), {
        nom: '',
        equipementAdmissible: [],
        services: [],
        capaciteMaximale: '',
        acces: [],
        selections: [],
        description: [],
        important: []
      }]
    }));
    // expand the newly added terrain (will be last index)
    setExpandedSet(prev => {
      const next = { ...prev };
      const idx = (formData.terrains ?? []).length; // previous length
      next[idx] = true;
      return next;
    });
  };

  const handleRemoveTerrain = (index: number) => {
    setFormData(prev => ({
      ...prev,
      terrains: (prev.terrains ?? []).filter((_: unknown, i: number) => i !== index)
    }));
    // adjust expanded set to shift indexes after removal
    setExpandedSet(prev => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).map(k => parseInt(k, 10)).forEach(i => {
        if (i < index && prev[i]) next[i] = true;
        if (i > index && prev[i]) next[i - 1] = true;
      });
      return next;
    });
  };

  const handleTerrainChange = (index: number, field: string, value: unknown) => {
    setFormData(prev => {
      const terrains = [...(prev.terrains ?? [])];
      const t = { ...(terrains[index] || {}) } as TerrainInput & Record<string, unknown>;
      // if (field.startsWith('terrain.')) {
      //   t.terrain = { ...(t.terrain || {}), ["longueur"]: undefined, ["largeur"]: undefined, ["longueurAvecStationnement"]: undefined };
      // } else {
      (t as Record<string, unknown>)[field] = value;
      // }
      terrains[index] = t;
      return { ...prev, terrains };
    });
  };

  const toggleExpanded = (index: number) => {
    setExpandedSet(prev => ({ ...prev, [index]: !prev[index] }));
  };

  type Commodites = {
    eau: boolean;
    electricite: boolean;
  };

  const handleInputChange = (field: keyof NewCampingInput, value: string | number | boolean | Partial<Coordonnees> | Partial<Commodites>) => {
    if (field === 'coordonnees') {
      setFormData(prev => ({
        ...prev,
        coordonnees: {
          ...prev.coordonnees,
          ...(value as Partial<Coordonnees>),
        }
      }));
    } else if (field === 'commodites') {
      setFormData(prev => ({
        ...prev,
        commodites: {
          ...prev.commodites,
          ...(value as Partial<Commodites>),
        }
      }));
    } else if (field === 'distanceMaisonCamping') {
      setFormData(prev => ({
        ...prev,
        distanceMaisonCamping: {
          ...prev.distanceMaisonCamping,
          ...(value as Partial<{ temps: number; kilometrage: number }>),
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await createCamping({
          nom: formData.nom,
          organisme: formData.organisme,
          coordonnees: formData.coordonnees,
          commodites: formData.commodites,
          regionAdministrative: formData.regionAdministrative,
          distanceMaisonCamping: formData.distanceMaisonCamping,
          terrains: formData.terrains,
        });
      } else if (mode === 'edit' && camping) {
        await updateCamping({
          id: camping._id,
          nom: formData.nom,
          organisme: formData.organisme,
          coordonnees: formData.coordonnees,
          commodites: formData.commodites,
          regionAdministrative: formData.regionAdministrative,
          terrains: formData.terrains,
          distanceMaisonCamping: formData.distanceMaisonCamping,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Ajouter un camping' : 'Modifier le camping'}
        <Tooltip title="Copier les coordonnées">
          <IconButton
            onClick={() => {
              const lat = formData.coordonnees.latitude.toString().replace(',', '.');
              const lng = formData.coordonnees.longitude.toString().replace(',', '.');
              const coords = `${lat}, ${lng}`;
              navigator.clipboard.writeText(coords);
            }}
            color="primary"
          >
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>

      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Nom du camping"
            value={formData.nom}
            onChange={(e) => handleInputChange('nom', e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Organisme</InputLabel>
            <Select
              value={formData.organisme}
              label="Organisme"
              onChange={(e) => handleInputChange('organisme', e.target.value)}
            >
              <MenuItem value="privé">Privé</MenuItem>
              <MenuItem value="SEPAQ">SEPAQ</MenuItem>
              <MenuItem value="Camping">Camping</MenuItem>
              <MenuItem value="Pourvoirie">Pourvoirie</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Région Administrative</InputLabel>
            <Select
              value={formData.regionAdministrative || ''}
              label="Région Administrative"
              onChange={(e) => handleInputChange('regionAdministrative', e.target.value)}
            >
              <MenuItem value="Capitale-Nationale">Capitale-Nationale</MenuItem>
              <MenuItem value="Chaudière-Appalaches">Chaudière-Appalaches</MenuItem>
              <MenuItem value="Lanaudiere">Lanaudière</MenuItem>
              <MenuItem value="Laurentides">Laurentides</MenuItem>
              <MenuItem value="Mauricie">Mauricie</MenuItem>
              <MenuItem value="Outaouais">Outaouais</MenuItem>
              <MenuItem value="Portneuf">Portneuf</MenuItem>
              <MenuItem value="Centre-du-Québec">Centre-du-Québec</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">Terrains</Typography>
              <Button startIcon={<AddCircleOutlineIcon />} size="small" onClick={handleAddTerrain} disabled={isReadOnlyConvex()}>
                Ajouter un terrain
              </Button>
            </Stack>

            {(formData.terrains ?? []).map((t: TerrainInput, idx: number) => (
              <Accordion key={idx} expanded={!!expandedSet[idx]} onChange={() => toggleExpanded(idx)} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{t.nom || `Terrain ${idx + 1}`}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ border: '1px solid rgba(0,0,0,0.04)', p: 2, borderRadius: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                      <TextField
                        label="Nom"
                        value={t.nom || ''}
                        onChange={(e) => handleTerrainChange(idx, 'nom', e.target.value)}
                        fullWidth
                      />
                      <IconButton onClick={() => handleRemoveTerrain(idx)} aria-label="Supprimer" size="small">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={SERVICES_OPTIONS}
                        value={t.services || []}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'services', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Services" placeholder="Ajouter un service" />
                        )}
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={ACCESS_OPTIONS}
                        value={Array.isArray(t.acces) ? t.acces : (t.acces ? [t.acces] : [])}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'acces', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Accès"
                            placeholder="Ajouter un accès (ex: Accessible en automobile)"
                          />
                        )}
                        fullWidth
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={DESCRIPTION_OPTIONS}
                        value={(t && t.description) || []}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'description', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Description" placeholder="Ajouter une description" />
                        )}
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={EQUIPEMENT_ADMISSIBLE_OPTIONS}
                        value={t.equipementAdmissible || []}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'equipementAdmissible', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Équipement admissible" placeholder="Ajouter un équipement" />
                        )}
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={TERRAIN_OPTIONS}
                        value={(t && t.selections) || []}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'selections', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Terrain (sélection multiple)" placeholder="Choisir dimensions/option" />
                        )}
                      />
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                      <TextField
                        label="Capacité maximale"
                        value={t.capaciteMaximale || ''}
                        onChange={(e) => handleTerrainChange(idx, 'capaciteMaximale', e.target.value)}
                        fullWidth
                      />
                    </Stack>

                    <Box sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={IMPORTANT_OPTIONS}
                        value={(t && t.important) || []}
                        onChange={(_, newValue) => handleTerrainChange(idx, 'important', newValue)}
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <Chip {...getTagProps({ index })} key={`${option}-${index}`} variant="outlined" label={option} />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Important" placeholder="Ajouter un élément important" />
                        )}
                      />
                    </Box>

                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Champ de collage rapide */}
            <TextField
              fullWidth
              label="Coordonnées (coller: latitude, longitude)"
              placeholder="Ex: 47.08109460151344, -72.21619023692226"
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                const coords = pastedText.split(',').map(s => s.trim());
                if (coords.length === 2) {
                  const lat = parseFloat(coords[0]);
                  const lng = parseFloat(coords[1]);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    e.preventDefault();
                    handleInputChange('coordonnees', {
                      latitude: lat,
                      longitude: lng
                    });
                  }
                }
              }}
              helperText="Collez vos coordonnées au format: latitude, longitude"
            />

            {/* Champs individuels */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                type="number"
                label="Latitude"
                value={formData.coordonnees.latitude}
                onChange={(e) => handleInputChange('coordonnees', { latitude: parseFloat(e.target.value) })}
              />
              <TextField
                type="number"
                label="Longitude"
                value={formData.coordonnees.longitude}
                onChange={(e) => handleInputChange('coordonnees', { longitude: parseFloat(e.target.value) })}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.commodites.eau}
                  onChange={(e) => handleInputChange('commodites', { eau: e.target.checked })}
                />
              }
              label="Eau"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.commodites.electricite}
                  onChange={(e) => handleInputChange('commodites', { electricite: e.target.checked })}
                />
              }
              label="Électricité"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="subtitle1">Transport Maison Camping</Typography>
            <TextField
              type="number"
              label="Distance (en km)"
              value={formData.distanceMaisonCamping?.kilometrage}
              onChange={(e) => handleInputChange('distanceMaisonCamping', { kilometrage: parseFloat(e.target.value) || 0 })}
            />
            <TextField
              type="number"
              label="Distance (en minutes)"
              value={formData.distanceMaisonCamping?.temps || ''}
              onChange={(e) => handleInputChange('distanceMaisonCamping', { temps: parseInt(e.target.value) || 0 })}
            />
          </Box>

        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isReadOnlyConvex()}
        >
          {mode === 'create' ? 'Ajouter' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}