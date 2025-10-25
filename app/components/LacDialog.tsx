'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
  Chip,
  Autocomplete
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { NewLacInput, defaultLacInput, LacDoc, HebergementLac } from '../../app/types/schema.types';
import { Id } from "../../convex/_generated/dataModel";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type LacDialogProps = {
  open: boolean;
  onClose: () => void;
  lac?: LacDoc;
  mode: 'create' | 'edit';
};

// Options pour les autocomplete
const regionsOptions = [
  "Capitale-Nationale",
  "Chaudière-Appalaches",
  "Lanaudière",
  "Laurentides",
  "Mauricie",
  "Outaouais",
  "Portneuf"
];

const siteOptions = [
  "Mastigouche",
  "Rouge-Matawin",
  "Papineau-Labelle",
  "Saint-Maurice",
  "Portneuf",
  "Jacques-Cartier"
];

const accessibleOptions = [
  "véhicule utilitaire sport (VUS)",
  "auto",
  "camion 4x4"
];

const typeEmbarcationOptions = [
  "Embarcation Sépaq fournie",
  "Embarcation Pourvoirie fournie",
  "Location",
  "Embarcation personnelle"
];

const motorisationOptions = [
  { value: "electrique", label: "Électrique" },
  { value: "essence", label: "Essence" },
  { value: "a determiner", label: "À déterminer" }
];

export default function LacDialog({ open, onClose, lac, mode }: LacDialogProps) {
  const [formData, setFormData] = useState<NewLacInput>(defaultLacInput);

  // ✅ Synchroniser formData avec le lac sélectionné
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && lac) {
        const lacData = lac as any;

        // Convertir les espèces enrichies en IDs si nécessaire
        const especeIds = lacData.especeIds || (lacData.especes?.map((e: any) => e._id) || []);

        // Convertir les hébergements enrichis en format simple pour formData
        const hebergementsSimples = (lacData.hebergements || []).map((h: any) => ({
          campingId: h.campingId || h._id,
          distanceDepuisLac: h.distanceDepuisLac,
          distanceDepuisAcceuil: h.distanceDepuisAcceuil,
        }));

        setFormData({
          nomDuLac: lacData.nomDuLac,
          regionAdministrativeQuebec: lacData.regionAdministrativeQuebec,
          coordonnees: lacData.coordonnees,
          acces: lacData.acces,
          embarcation: lacData.embarcation,
          especeIds,
          hebergements: hebergementsSimples,
          zone: lacData.zone,
          site: lacData.site,
          superficie: lacData.superficie,
        });
      } else {
        // Réinitialiser pour le mode création
        setFormData(defaultLacInput);
      }
    }
  }, [open, mode, lac]);

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
      } else if (mode === 'edit' && lac) {
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
            <Autocomplete
              fullWidth
              options={regionsOptions}
              value={formData.regionAdministrativeQuebec}
              onChange={(_, newValue) => handleInputChange('regionAdministrativeQuebec', newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Région Administrative du Québec" />
              )}
              freeSolo={false}
            />

            <Autocomplete
              fullWidth
              options={siteOptions}
              value={formData.site}
              onChange={(_, newValue) => handleInputChange('site', newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Site" />
              )}
              freeSolo={false}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Champs individuels avec bouton de copie */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, alignItems: 'center' }}>
              <TextField
                type="number"
                label="Latitude"
                value={formData.coordonnees.latitude || ''}
                onChange={(e) => handleCoordChange('latitude', e.target.value)}
              />
              <TextField
                type="number"
                label="Longitude"
                value={formData.coordonnees.longitude || ''}
                onChange={(e) => handleCoordChange('longitude', e.target.value)}
              />
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
            </Box>
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
            <Autocomplete
              fullWidth
              options={accessibleOptions}
              value={formData.acces.accessible}
              onChange={(_, newValue) => handleInputChange('acces', { accessible: newValue || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Accessible" />
              )}
              freeSolo={false}
            />
          </Box>

          {/* <Typography variant="h6" sx={{ mt: 1 }}>Embarcation</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              fullWidth
              options={typeEmbarcationOptions}
              value={formData.embarcation.type}
              onChange={(_, newValue) => handleInputChange('embarcation', { type: newValue || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Type d'embarcation" />
              )}
              freeSolo={false}
            />

            <Autocomplete
              fullWidth
              options={motorisationOptions}
              value={motorisationOptions.find(opt => opt.value === formData.embarcation.motorisation.necessaire) || null}
              onChange={(_, newValue) => handleInputChange('embarcation', {
                motorisation: { necessaire: newValue?.value || '' }
              })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField {...params} label="Type de motorisation" />
              )}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              freeSolo={false}
            />

            {formData.embarcation.motorisation.necessaire === "essence" && (
              <TextField
                fullWidth
                label="Puissance minimale (CV)"
                type="number"
                value={formData.embarcation.motorisation.puissance?.minimum || 0}
                onChange={(e) => handleInputChange('embarcation', {
                  motorisation: { puissance: { minimum: e.target.value ? parseInt(e.target.value) : 0 } }
                })}
              />
            )}
          </Box> */}

          <Typography variant="h6" sx={{ mt: 1 }}>Embarcation</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                fullWidth
                options={typeEmbarcationOptions}
                value={formData.embarcation.type}
                onChange={(_, newValue) => handleInputChange('embarcation', { type: newValue || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Type d'embarcation" />
                )}
                freeSolo={false}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                fullWidth
                options={motorisationOptions}
                value={motorisationOptions.find(opt => opt.value === formData.embarcation.motorisation.necessaire) || null}
                onChange={(_, newValue) => handleInputChange('embarcation', {
                  motorisation: {
                    necessaire: newValue?.value || '',
                    puissance: formData.embarcation.motorisation.puissance // Conserver la puissance existante
                  }
                })}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField {...params} label="Type de motorisation" />
                )}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                freeSolo={false}
              />
            </Box>

            {formData.embarcation.motorisation.necessaire === "essence" && (
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Puissance minimale (CV)"
                  type="number"
                  value={formData.embarcation.motorisation.puissance?.minimum || ''}
                  onChange={(e) => handleInputChange('embarcation', {
                    motorisation: {
                      necessaire: formData.embarcation.motorisation.necessaire, // Conserver le type de motorisation
                      puissance: { minimum: e.target.value ? parseInt(e.target.value) : 0 }
                    }
                  })}
                />
              </Box>
            )}
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Espèces</Typography>
          <Autocomplete
            multiple
            fullWidth
            options={especes || []}
            value={especes?.filter(e => formData.especeIds.includes(e._id)) || []}
            onChange={(_, newValue) => {
              handleInputChange('especeIds', newValue.map(e => e._id));
            }}
            getOptionLabel={(option) => option.nomCommun}
            renderInput={(params) => (
              <TextField {...params} label="Espèces présentes" placeholder="Sélectionner les espèces..." />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option._id}
                  label={option.nomCommun}
                  size="small"
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option._id === value._id}
          />

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
                    {lac.hebergements.map((h: any, index) => {
                      // h contient déjà les données enrichies du camping (nom, organisme, etc.)
                      const campingNom = h.nom || 'N/A';
                      const campingId = h.campingId || h._id;

                      return (
                        <TableRow key={`${campingId}-${index}`}>
                          <TableCell>{campingNom}</TableCell>
                          <TableCell>{h.distanceDepuisLac?.kilometrage || 'N/A'}</TableCell>
                          <TableCell>{h.distanceDepuisLac?.temps || 'N/A'}</TableCell>
                          <TableCell>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveHebergement(campingId)}
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
                <Autocomplete
                  fullWidth
                  options={campings?.filter(camping =>
                    !lac.hebergements.some((h: any) => (h.campingId || h._id) === camping._id)
                  ) || []}
                  value={campings?.find(c => c._id === hebergement.campingId) || null}
                  onChange={(_, newValue) => {
                    handleHebergementChange('campingId', newValue?._id || null);
                  }}
                  getOptionLabel={(option) => option.nom}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Camping"
                      placeholder="Rechercher un camping..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option._id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.nom}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.organisme} • {option.regionAdministrative || 'N/A'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="Aucun camping disponible"
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                />
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