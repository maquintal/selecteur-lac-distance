'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, IconButton, Autocomplete, Chip, Typography, Stack
} from '@mui/material';
import { CampingDoc, NewCampingInput, defaultCampingInput } from '../types/schema.types';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

type CampingDialogProps = {
  open: boolean;
  onClose: () => void;
  camping?: CampingDoc;
  mode: 'create' | 'edit';
};

export default function CampingDialog({ open, onClose, camping, mode }: CampingDialogProps) {
  const [formData, setFormData] = useState<NewCampingInput>(defaultCampingInput);

  // Mutations Convex
  const createCamping = useMutation(api.lacs.createCamping);
  const updateCamping = useMutation(api.lacs.updateCamping);

  // Synchroniser formData avec la prop camping
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && camping) {
        // Extraire seulement les champs modifiables (retirer champs système)
        const { _id, _creationTime, ...editableData } = camping as any;
        // ensure terrains array exists
        if (!(editableData as any).terrains) (editableData as any).terrains = [];
        setFormData(editableData as NewCampingInput);
      } else {
        setFormData(defaultCampingInput);
        // defaultCampingInput already contains terrains = []
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
      terrains: [ ...(prev as any).terrains || [], { nom: '', equipementAdmissible: [], capaciteMaximale: '', acces: '', terrain: { longueur: '', largeur: '' } } ]
    }));
  };

  const handleRemoveTerrain = (index: number) => {
    setFormData(prev => ({
      ...prev,
      terrains: (prev as any).terrains.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleTerrainChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const terrains = [ ...(prev as any).terrains || [] ];
      const t = { ...(terrains[index] || {}) };
      if (field === 'longueur' || field === 'largeur') {
        t.terrain = { ...(t.terrain || {}), [field]: value };
      } else {
        t[field] = value;
      }
      terrains[index] = t;
      return { ...prev, terrains };
    });
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
          terrains: (formData as any).terrains,
        });
      } else if (mode === 'edit' && camping) {
        await updateCamping({
          id: camping._id,
          nom: formData.nom,
          organisme: formData.organisme,
          coordonnees: formData.coordonnees,
          commodites: formData.commodites,
          regionAdministrative: formData.regionAdministrative,
          terrains: (formData as any).terrains,
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
            </Select>
          </FormControl>

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">Terrains</Typography>
              <Button startIcon={<AddCircleOutlineIcon />} size="small" onClick={handleAddTerrain} disabled={isReadOnlyConvex()}>
                Ajouter un terrain
              </Button>
            </Stack>

            {((formData as any).terrains || []).map((t: any, idx: number) => (
              <Box key={idx} sx={{ border: '1px solid rgba(0,0,0,0.08)', p: 2, borderRadius: 1, mb: 1 }}>
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
                    options={[]}
                    value={t.equipementAdmissible || []}
                    onChange={(_, newValue) => handleTerrainChange(idx, 'equipementAdmissible', newValue)}
                    renderTags={(value: string[], getTagProps) =>
                      value.map((option: string, index: number) => {
                        const tagProps = getTagProps({ index }) as any;
                        const { key, ...other } = tagProps;
                        return (
                          <Chip key={key} variant="outlined" label={option} {...other} />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Équipement admissible" placeholder="Ajouter un équipement" />
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
                  <TextField
                    label="Accès"
                    value={t.acces || ''}
                    onChange={(e) => handleTerrainChange(idx, 'acces', e.target.value)}
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Longueur du terrain"
                    value={(t.terrain && t.terrain.longueur) || ''}
                    onChange={(e) => handleTerrainChange(idx, 'longueur', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Largeur du terrain"
                    value={(t.terrain && t.terrain.largeur) || ''}
                    onChange={(e) => handleTerrainChange(idx, 'largeur', e.target.value)}
                    fullWidth
                  />
                </Stack>
              </Box>
            ))}
          </Box>

          {/* <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
          </Box> */}

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