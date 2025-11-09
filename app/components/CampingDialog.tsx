'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox
} from '@mui/material';
import { CampingDoc, NewCampingInput, defaultCampingInput } from '../types/schema.types';

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
        // Extraire seulement les champs modifiables
        const { ...editableData } = camping;
        setFormData(editableData);
      } else {
        setFormData(defaultCampingInput);
      }
    }
  }, [open, mode, camping]);

  type Coordonnees = {
    latitude: number;
    longitude: number;
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
        await createCamping(formData);
      } else if (mode === 'edit' && camping) {
        await updateCamping({
          id: camping._id,
          ...formData
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
        <Button variant="contained" onClick={handleSubmit}>
          {mode === 'create' ? 'Ajouter' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}