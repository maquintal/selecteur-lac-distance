'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { EspeceDoc, EspeceFormData, defaultEspeceInput } from '../types/especes.type';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import { ESPECES_CATEGORIES } from '@/convex/schemas/especes.schema';

type EspeceDialogProps = {
  open: boolean;
  onClose: () => void;
  espece?: EspeceDoc;
  mode: 'create' | 'edit';
};

export default function EspeceDialog({ open, onClose, espece, mode }: EspeceDialogProps) {

  const [formData, setFormData] = useState<EspeceFormData>(espece || defaultEspeceInput);

  useEffect(() => {
    if (open) {
      if (espece) {
        // Extraire seulement les champs de EspeceFormData
        const { ...especeData } = espece;
        setFormData(especeData);
      } else {
        setFormData(defaultEspeceInput);
      }
    }
  }, [open, espece]);

  // Mutations Convex
  const createEspece = useMutation(api.especes.addEspece);
  const updateEspece = useMutation(api.especes.updateEspece);

  const handleInputChange = (field: keyof EspeceFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        categorie: formData.categorie || undefined,
      };
      if (mode === 'create') {
        await createEspece(payload);
      } else if (mode === 'edit' && espece) {
        await updateEspece({
          id: espece._id,
          ...payload
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
              value={formData.categorie ?? ''}
              onChange={(e) => handleInputChange('categorie', e.target.value)}
            >
              {ESPECES_CATEGORIES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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