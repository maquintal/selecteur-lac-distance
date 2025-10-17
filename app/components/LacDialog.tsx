'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { NewLacInput, defaultLacInput, LacDoc } from '../../app/types/schema.types';
import { HebergementLac } from '../types/dynamicLake.type.';
import { Id } from "../../convex/_generated/dataModel";

type LacDialogProps = {
  open: boolean;
  onClose: () => void;
  lac?: LacDoc;
  mode: 'create' | 'edit';
};

export default function LacDialog({ open, onClose, lac, mode }: LacDialogProps) {
  const [formData, setFormData] = useState<NewLacInput>(lac || defaultLacInput);

  // ✅ Synchroniser formData avec le lac sélectionné
  useEffect(() => {
    if (open) {
      if (lac) {
        
        setFormData({
          nomDuLac: lac.nomDuLac,
          regionAdministrativeQuebec: lac.regionAdministrativeQuebec,
          coordonnees: lac.coordonnees,
          acces: lac.acces,
          embarcation: lac.embarcation,
          especeIds: lac.especeIds,
          hebergements: lac.hebergements,
          zone: lac.zone,
          site: lac.site,
          superficie: lac.superficie,
        });
      } else {
        // Réinitialiser pour le mode création
        setFormData(defaultLacInput);
      }
    }
  }, [open, lac]);

  const [hebergement, setHebergement] = useState<Omit<HebergementLac, 'campingId'> & { campingId: Id<"campings"> | null }>({
    campingId: null,
    distanceDepuisLac: {
      temps: 0,
      kilometrage: 0,
    },
  });

  const addLac = useMutation(api.lacs.addLac);
  const updateLac = useMutation(api.lacs.updateLac);
  const addHebergement = useMutation(api.lacs.addCampingToLac);
  const campings = useQuery(api.lacs.getAllCampings);
  const removeCampingFromLac = useMutation(api.lacs.removeCampingFromLac);
  const especes = useQuery(api.lacs.getAllEspeces);

  const handleInputChange = (field: keyof NewLacInput, value: any) => {
    if (field === 'superficie') {
      setFormData(prev => ({
        ...prev,
        superficie: value ? {
          hectares: parseFloat(value),
          km2: parseFloat(value) / 100
        } : undefined
      }));
    } else if (field === 'acces') {
      setFormData(prev => ({
        ...prev,
        acces: {
          ...prev.acces,
          ...value
        }
      }));
    } else if (field === 'embarcation') {
      setFormData(prev => ({
        ...prev,
        embarcation: {
          ...prev.embarcation,
          ...value
        }
      }));
    } else if (field === 'especeIds') {
      setFormData(prev => ({
        ...prev,
        especeIds: typeof value === 'string' ? [value] : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleHebergementChange = (field: keyof HebergementLac, value: any) => {
    if (field === 'distanceDepuisLac') {
      setHebergement(prev => ({
        ...prev,
        distanceDepuisLac: {
          ...prev.distanceDepuisLac,
          ...value
        }
      }));
    } else {
      setHebergement(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCoordChange = (field: 'latitude' | 'longitude', value: string) => {
    setFormData(prev => ({
      ...prev,
      coordonnees: {
        ...prev.coordonnees,
        [field]: value === '' ? 0 : parseFloat(value)
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await addLac({
          nomDuLac: formData.nomDuLac,
          regionAdministrativeQuebec: formData.regionAdministrativeQuebec,
          coordonnees: formData.coordonnees,
          zone: formData.zone,
          site: formData.site,
          superficie: formData.superficie,
          especeIds: formData.especeIds,
          acces: formData.acces,
          embarcation: formData.embarcation
        });
      }
      else if (mode === 'edit' && lac) { // ✅ Ajoutez cette condition
        await updateLac({
          lacId: lac._id,
          nomDuLac: formData.nomDuLac,
          regionAdministrativeQuebec: formData.regionAdministrativeQuebec,
          coordonnees: formData.coordonnees,
          acces: formData.acces,
          embarcation: formData.embarcation,
          zone: formData.zone,
          site: formData.site,
          superficie: formData.superficie,
          especeIds: formData.especeIds,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRemoveHebergement = async (campingId: Id<"campings">) => {
    if (!lac) return;
    try {
      await removeCampingFromLac({
        lacId: lac._id,
        campingId: campingId
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'hébergement:', error);
    }
  };

  const handleAddHebergement = async () => {
    if (!lac || !hebergement.campingId) return;

    try {
      await addHebergement({
        lacId: lac._id,
        campingId: hebergement.campingId,
        distanceDepuisLac: hebergement.distanceDepuisLac
      });

      // Réinitialiser le formulaire d'hébergement
      setHebergement({
        campingId: null,
        distanceDepuisLac: {
          kilometrage: 0,
          temps: 0
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'hébergement:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Ajouter un nouveau lac' : 'Modifier le lac'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="Nom du lac"
            value={formData.nomDuLac}
            onChange={(e) => handleInputChange('nomDuLac', e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Région Adiministrative du Québec</InputLabel>
              <Select
                value={formData.regionAdministrativeQuebec}
                onChange={(e) => handleInputChange('regionAdministrativeQuebec', e.target.value)}
              >
                <MenuItem value="Capitale-Nationale">Capitale-Nationale</MenuItem>
                <MenuItem value="Chaudière-Appalaches">Chaudière-Appalaches</MenuItem>
                <MenuItem value="Lanaudière">Lanaudière</MenuItem>
                <MenuItem value="Laurentides">Laurentides</MenuItem>
                <MenuItem value="Mauricie">Mauricie</MenuItem>
                <MenuItem value="Outaouais">Outaouais</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Site</InputLabel>
              <Select
                value={formData.site}
                onChange={(e) => handleInputChange('site', e.target.value)}
              >
                <MenuItem value="Mastigouche">Mastigouche</MenuItem>
                <MenuItem value="Rouge-Matawin">Rouge-Matawin</MenuItem>
                <MenuItem value="Papineau-Labelle">Papineau-Labelle</MenuItem>
                <MenuItem value="Saint-Maurice">Saint-Maurice</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Latitude"
              value={formData.coordonnees.latitude || ''}
              onChange={(e) => handleCoordChange('latitude', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Longitude"
              value={formData.coordonnees.longitude || ''}
              onChange={(e) => handleCoordChange('longitude', e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Zone"
              value={formData.zone || ''}
              onChange={(e) => handleInputChange('zone', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <TextField
              fullWidth
              type="number"
              label="Superficie (hectares)"
              value={formData.superficie?.hectares || ''}
              onChange={(e) => handleInputChange('superficie', e.target.value)}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Accès</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Portage"
              value={formData.acces.portage}
              onChange={(e) => handleInputChange('acces', { portage: e.target.value })}
            />
            <TextField
              fullWidth
              label="Accueil"
              value={formData.acces.acceuil}
              onChange={(e) => handleInputChange('acces', { acceuil: e.target.value })}
            />
            <TextField
              fullWidth
              label="Distance d'accueil au lac (m)"
              type="number"
              value={formData.acces.distanceAcceuilLac.kilometrage || 0}
              onChange={(e) => handleInputChange('acces', { distanceAcceuilLac: { kilometrage: e.target.value ? parseInt(e.target.value) : 0, temps: formData.acces.distanceAcceuilLac.temps } })}
            />
            <TextField
              fullWidth
              label="Temps d'accueil au lac (min)"
              type="number"
              value={formData.acces.distanceAcceuilLac.temps || 0}
              onChange={(e) => handleInputChange('acces', { distanceAcceuilLac: { kilometrage: formData.acces.distanceAcceuilLac.kilometrage, temps: e.target.value ? parseInt(e.target.value) : 0 } })}
            />
            <FormControl fullWidth>
              <InputLabel>Accessible</InputLabel>
              <Select
                value={formData.acces.accessible}
                onChange={(e) => handleInputChange('acces', { accessible: e.target.value })}
              >
                <MenuItem value="véhicule utilitaire sport (VUS)">Véhicule utilitaire sport (VUS)</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="camion 4x4">Camion 4x4</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="h6" sx={{ mt: 1 }}>Embarcation</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>

            <FormControl fullWidth>
              <InputLabel>Type d'embarcation</InputLabel>
              <Select
                value={formData.embarcation.type}
                onChange={(e) => handleInputChange('embarcation', { type: e.target.value })}
              >
                <MenuItem value="Embarcation Sépaq fournie">Embarcation Sépaq fournie</MenuItem>
                <MenuItem value="Embarcation Pourvoirie fournie">Embarcation Pourvoirie fournie</MenuItem>
                <MenuItem value="Location">Location</MenuItem>
                <MenuItem value="Embarcation personnelle">Embarcation personnelle</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Type de motorisation</InputLabel>
              <Select
                value={formData.embarcation.motorisation.necessaire}
                label="Type de motorisation"
                onChange={(e) => handleInputChange('embarcation', {
                  motorisation: { necessaire: e.target.value }
                })}
              >
                <MenuItem value="electrique">Électrique</MenuItem>
                <MenuItem value="essence">Essence</MenuItem>
                <MenuItem value="a determiner">À déterminer</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Espèces</Typography>
          <FormControl fullWidth>
            <InputLabel>Espèces présentes</InputLabel>
            <Select
              multiple
              value={formData.especeIds}
              label="Espèces présentes"
              onChange={(e) => handleInputChange('especeIds', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as Id<"especes">[]).map((id) => {
                    const espece = especes?.find(e => e._id === id);
                    return (
                      <Chip key={id} label={espece?.nomCommun || id} size="small" />
                    );
                  })}
                </Box>
              )}
            >
              {especes?.map((espece) => (
                <MenuItem key={espece._id} value={espece._id}>
                  {espece.nomCommun}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {mode === 'edit' && lac && (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>Hébergements</Typography>

              {/* Liste des hébergements existants */}
              <TableContainer component={Paper} sx={{ mt: 1, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom du camping</TableCell>
                      <TableCell>Distance (km)</TableCell>
                      <TableCell>Temps (min)</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lac.hebergements.map((h) => {
                      const camping = campings?.find(c => c._id === h.campingId);
                      return (
                        <TableRow key={h.campingId}>
                          <TableCell>{camping?.nom || 'N/A'}</TableCell>
                          <TableCell>{
                            h.distanceDepuisLac?.kilometrage || 'N/A'
                          }</TableCell>
                          <TableCell>{
                            h.distanceDepuisLac?.temps || 'N/A'
                          }</TableCell>
                          <TableCell>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveHebergement(h.campingId)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Formulaire d'ajout d'hébergement */}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Ajouter un hébergement</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel>Camping</InputLabel>
                  <Select
                    value={hebergement.campingId || ''}
                    label="Camping"
                    onChange={(e) => handleHebergementChange('campingId', e.target.value)}
                  >
                    {campings?.filter(camping =>
                      !lac.hebergements.some(h => h.campingId === camping._id)
                    ).map((camping) => (
                      <MenuItem key={camping._id} value={camping._id}>
                        {camping.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Distance (km)"
                  value={hebergement.distanceDepuisLac?.kilometrage || ''}
                  onChange={(e) => handleHebergementChange('distanceDepuisLac', {
                    kilometrage: parseFloat(e.target.value),
                    temps: hebergement.distanceDepuisLac?.temps || 0
                  })}
                  sx={{ width: '150px' }}
                />
                <TextField
                  type="number"
                  label="Temps (min)"
                  value={hebergement.distanceDepuisLac?.temps || ''}
                  onChange={(e) => handleHebergementChange('distanceDepuisLac', {
                    temps: parseFloat(e.target.value),
                    kilometrage: hebergement.distanceDepuisLac?.kilometrage || 0
                  })}
                  sx={{ width: '150px' }}
                />
                <Tooltip title="Ajouter l'hébergement">
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleAddHebergement}
                      disabled={!hebergement.campingId || hebergement.campingId === null}
                      startIcon={<AddIcon />}
                    >
                      Ajouter
                    </Button>
                  </span>
                </Tooltip>
              </Box>
              <Typography variant="h6" sx={{ mt: 2 }}>Espèces</Typography>
              <FormControl fullWidth>
                <InputLabel>Espèces présentes</InputLabel>
                <Select
                  multiple
                  value={formData.especeIds}
                  label="Espèces présentes"
                  onChange={(e) => handleInputChange('especeIds', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as Id<"especes">[]).map((id) => {
                        const espece = especes?.find(e => e._id === id);
                        return (
                          <Chip key={id} label={espece?.nomCommun || id} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {especes?.map((espece) => (
                    <MenuItem key={espece._id} value={espece._id}>
                      {espece.nomCommun}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained">
          {mode === 'create' ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}