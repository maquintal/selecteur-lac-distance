'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { EspeceDoc, NewEspeceInput, defaultEspeceInput } from '../types/schema.types';

type EspeceDialogProps = {
  open: boolean;
  onClose: () => void;
  espece?: EspeceDoc;
  mode: 'create' | 'edit';
};

export default function EspeceDialog({ open, onClose, espece, mode }: EspeceDialogProps) {
  const [formData, setFormData] = useState<NewEspeceInput>(espece || defaultEspeceInput);

  // Mutations Convex
  const createEspece = useMutation(api.lacs.addEspece);
  const updateEspece = useMutation(api.lacs.updateEspece);

  const handleInputChange = (field: keyof NewEspeceInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await createEspece(formData);
      } else if (mode === 'edit' && espece) {
        await updateEspece({
          id: espece._id,
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
        {mode === 'create' ? 'Ajouter une espèce' : 'Modifier l\'espèce'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Nom de l'espèce"
            value={formData.nomCommun}
            onChange={(e) => handleInputChange('nomCommun', e.target.value)}
          />
          <TextField
            fullWidth
            label="Nom scientifique"
            value={formData.nomScientifique}
            onChange={(e) => handleInputChange('nomScientifique', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel id="categorie-label">Catégorie</InputLabel>
            <Select
              labelId="categorie-label"
              value={formData.categorie}
              onChange={(e) => handleInputChange('categorie', e.target.value)}
            >
              <MenuItem value="poissons">Poissons</MenuItem>
              <MenuItem value="amphibiens">Amphibiens</MenuItem>
              <MenuItem value="reptiles">Reptiles</MenuItem>
              <MenuItem value="oiseaux">Oiseaux</MenuItem>
              <MenuItem value="mammiferes">Mammifères</MenuItem>
            </Select>
          </FormControl>
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