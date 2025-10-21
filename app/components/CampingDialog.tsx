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
        // Extraire seulement les champs modifiables (sans _id et _creationTime)
        const { _id, _creationTime, ...editableData } = camping;
        setFormData(editableData);
      } else {
        setFormData(defaultCampingInput);
      }
    }
  }, [open, mode, camping]);

  const handleInputChange = (field: keyof NewCampingInput, value: any) => {
    if (field === 'coordonnees') {
      setFormData(prev => ({
        ...prev,
        coordonnees: {
          ...prev.coordonnees,
          ...value,
        }
      }));
    } else if (field === 'commodites') {
      setFormData(prev => ({
        ...prev,
        commodites: {
          ...prev.commodites,
          ...value,
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