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
import { Id } from "../../convex/_generated/dataModel";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import { ENUMS_REGION_ADMINISTRATIVE } from '@/convex/schemas/enums';
import { ENUMS_LACS_ACCESSIBLE, ENUMS_LACS_EMBARCATION, ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE, ENUMS_LACS_SITE } from '@/convex/schemas/lacs.schema';
import { defaultLacInput, LacAcces, LacDistance, LacDoc, LacEmbarcation, LacEnriched, LacFormData, LacHebergementFormData, LacHebergementItem, LacMotorisation } from '../types/lacs.type';

type LacDialogProps = {
  open: boolean;
  onClose: () => void;
  lac?: LacDoc | LacEnriched;
  mode: 'create' | 'edit';
};

function mapHebergements(lac: LacDoc | LacEnriched): LacFormData["hebergements"] {
  const hebergements = lac.hebergements ?? [];
  return (hebergements as LacHebergementItem[])
    .map(h => {
      const campingId = h.campingId ?? null;
      if (!campingId) return null;
      return {
        campingId,
        distanceDepuisLac: h.distanceDepuisLac,
        distanceDepuisAcceuil: h.distanceDepuisAcceuil,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
}

export default function LacDialog({ open, onClose, lac, mode }: LacDialogProps) {
  const [formData, setFormData] = useState<LacFormData>(defaultLacInput);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && lac) {

      const {
        ...lacData
      } = lac as LacDoc & {
        hebergements: LacHebergementItem[];
        createdAt?: unknown;
        updatedAt?: unknown
      };

      setFormData({
        ...lacData,
        especeIds: lac.especeIds ?? [],
        hebergements: mapHebergements(lac),
      });
    } else {
      setFormData(defaultLacInput);
    }
  }, [open, mode, lac]);

  // Ajoute un useEffect séparé pour sync les hebergements quand lac change
  useEffect(() => {
    if (!lac || !open) return;
    setFormData(prev => ({ ...prev, hebergements: mapHebergements(lac) }));
  }, [lac, lac?.hebergements, open]);

  const [hebergement, setHebergement] = useState<LacHebergementFormData>({
    campingId: null,
    distanceDepuisLac: {
      temps: 0,
      kilometrage: 0,
    },
  });

  const addLac = useMutation(api.lacs.addLac);
  const updateLac = useMutation(api.lacs.updateLac);
  const addHebergement = useMutation(api.lacs.addCampingToLac);
  const campings = useQuery(api.heberements.getAllCampings);
  const removeCampingFromLac = useMutation(api.lacs.removeCampingFromLac);
  const especes = useQuery(api.especes.getAllEspeces);

  const setHebergementCamping = (campingId: Id<"campings"> | null) => {
    setHebergement(prev => ({ ...prev, campingId }));
  };

  const setHebergementDistance = (partial: Partial<LacDistance>) => {
    setHebergement(prev => ({
      ...prev,
      distanceDepuisLac: { temps: 0, kilometrage: 0, ...prev.distanceDepuisLac, ...partial }
    }));
  };

  const setField = <K extends keyof LacFormData>(field: K, value: LacFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sections imbriquées
  const setAcces = (partial: Partial<LacAcces>) => {
    setFormData(prev => ({ ...prev, acces: { ...prev.acces, ...partial } }));
  };

  const setEmbarcation = (partial: Partial<LacEmbarcation>) => {
    setFormData(prev => ({ ...prev, embarcation: { ...prev.embarcation, ...partial } }));
  };

  const setMotorisation = (partial: Partial<LacMotorisation>) => {
    setFormData(prev => ({
      ...prev,
      embarcation: { ...prev.embarcation, motorisation: { ...prev.embarcation.motorisation, ...partial } }
    }));
  };

  const setCoord = (field: 'latitude' | 'longitude', value: number) => {
    setFormData(prev => ({ ...prev, coordonnees: { ...prev.coordonnees, [field]: value } }));
  };

  const setDistanceAcceuilLac = (partial: Partial<LacDistance>) => {
    setFormData(prev => ({
      ...prev,
      acces: { ...prev.acces, distanceAcceuilLac: { ...prev.acces.distanceAcceuilLac, ...partial } }
    }));
  };

  const setDistanceMaisonLac = (partial: Partial<LacDistance>) => {
    setFormData(prev => ({
      ...prev,
      distanceMaisonLac: { temps: 0, kilometrage: 0, ...prev.distanceMaisonLac, ...partial }
    }));
  };

  const setSuperficie = (hectares: number) => {
    setFormData(prev => ({ ...prev, superficie: { hectares, km2: hectares / 100 } }));
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        await addLac(formData);
      } else if (mode === 'edit' && lac) {
        const { _id, _creationTime, createdAt, updatedAt, ...cleanFormData } = {
          ...formData,
          _id: lac._id,
          _creationTime: (lac as LacDoc)._creationTime,
          createdAt: (lac as LacDoc & { createdAt?: unknown }).createdAt,
          updatedAt: (lac as LacDoc & { updatedAt?: unknown }).updatedAt,
        };
        void _id; void _creationTime; void createdAt; void updatedAt;
        await updateLac({ lacId: lac._id, ...cleanFormData });
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

      // ✅ Sync local state immédiatement
      setFormData(prev => ({
        ...prev,
        hebergements: prev.hebergements.filter(h => h.campingId !== campingId)
      }));
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

      // ✅ Sync local state immédiatement
      setFormData(prev => ({
        ...prev,
        hebergements: [...prev.hebergements, {
          campingId: hebergement.campingId!,
          distanceDepuisLac: hebergement.distanceDepuisLac,
        }]
      }));

      setHebergement({ campingId: null, distanceDepuisLac: { kilometrage: 0, temps: 0 } });
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
            onChange={(e) => setField('nomDuLac', e.target.value)}
            disabled={isReadOnlyConvex()}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Autocomplete
              fullWidth
              options={ENUMS_REGION_ADMINISTRATIVE}
              value={formData.regionAdministrativeQuebec ?? null}
              onChange={(_, val) => setField('regionAdministrativeQuebec', val)}
              disabled={isReadOnlyConvex()}
              renderInput={(params) => (
                <TextField {...params} label="Région Administrative du Québec" />
              )}
              freeSolo={false}
            />

            <Autocomplete
              fullWidth
              options={ENUMS_LACS_SITE}
              value={formData.site ?? null}
              onChange={(_, val) => setField('site', val)}
              disabled={isReadOnlyConvex()}
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
                onChange={(e) => setCoord('latitude', parseFloat(e.target.value) || 0)}
                disabled={isReadOnlyConvex()}
              />
              <TextField
                type="number"
                label="Longitude"
                value={formData.coordonnees.longitude || ''}
                onChange={(e) => setCoord('longitude', parseFloat(e.target.value) || 0)}
                disabled={isReadOnlyConvex()}
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
              onChange={(e) => setField('zone', parseInt(e.target.value) || 0)}
            />
            <TextField
              fullWidth
              type="number"
              label="Superficie (hectares)"
              value={formData.superficie?.hectares || ''}
              onChange={(e) => setSuperficie(parseFloat(e.target.value) || 0)}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 2 }}>Accès</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Portage"
              value={formData.acces.portage}
              onChange={(e) => setAcces({ portage: e.target.value })}
            />
            <TextField
              fullWidth
              label="Accueil"
              value={formData.acces.acceuil}
              onChange={(e) => setAcces({ acceuil: e.target.value })}
            />
            <TextField
              fullWidth
              label="Distance d'accueil au lac (m)"
              type="number"
              value={formData.acces.distanceAcceuilLac.kilometrage || 0}
              onChange={(e) => setDistanceAcceuilLac({ kilometrage: parseInt(e.target.value) || 0 })}
            />
            <TextField
              fullWidth
              label="Temps d'accueil au lac (min)"
              type="number"
              value={formData.acces.distanceAcceuilLac.temps || 0}
              onChange={(e) => setDistanceAcceuilLac({ temps: parseInt(e.target.value) || 0 })}
            />
            <Autocomplete
              fullWidth
              options={ENUMS_LACS_ACCESSIBLE}
              value={formData.acces.accessible ?? null}
              onChange={(_, val) => setAcces({ accessible: val })}
              renderInput={(params) => (
                <TextField {...params} label="Accessible" />
              )}
              freeSolo={false}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 1 }}>Embarcation</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                fullWidth
                options={ENUMS_LACS_EMBARCATION}
                value={formData.embarcation.type ?? null}
                onChange={(_, val) => setEmbarcation({ type: val })}
                renderInput={(params) => (
                  <TextField {...params} label="Type d'embarcation" />
                )}
                freeSolo={false}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                fullWidth
                options={ENUMS_LACS_EMBARCATION_MOTORISATION_NECESSAIRE}
                value={formData.embarcation.motorisation.necessaire ?? null}
                onChange={(_, val) => setMotorisation({ necessaire: val })}
                renderInput={(params) => (
                  <TextField {...params} label="Type de motorisation" />
                )}
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
                  onChange={(e) => setMotorisation({
                    puissance: { minimum: parseInt(e.target.value) || undefined, maximum: formData.embarcation.motorisation.puissance?.maximum }
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
            value={especes?.filter(e => formData.especeIds?.includes(e._id)) || []}
            onChange={(_, newValue) => setField('especeIds', newValue.map(e => e._id))}
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
                    {formData.hebergements.map((h, index) => {
                      const camping = campings?.find(c => c._id === h.campingId);
                      return (
                        <TableRow key={`${h.campingId}-${index}`}>
                          <TableCell>{camping?.nom ?? 'Chargement...'}</TableCell>
                          <TableCell>{h.distanceDepuisLac?.kilometrage ?? 'N/A'}</TableCell>
                          <TableCell>{h.distanceDepuisLac?.temps ?? 'N/A'}</TableCell>
                          <TableCell>
                            <Tooltip title="Supprimer">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => h.campingId && handleRemoveHebergement(h.campingId)}
                                  disabled={isReadOnlyConvex()}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
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
                    !lac.hebergements.some(h => ((h as { _id?: Id<"campings"> })._id ?? (h as { campingId?: Id<"campings"> }).campingId) === camping._id)
                  ) || []}
                  value={campings?.find(c => c._id === hebergement.campingId) || null}
                  onChange={(_, newValue) => setHebergementCamping(newValue?._id ?? null)}
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
                  onChange={(e) => setHebergementDistance({ kilometrage: parseFloat(e.target.value) })}
                  sx={{ width: '150px' }}
                />
                <TextField
                  type="number"
                  label="Temps (min)"
                  value={hebergement.distanceDepuisLac?.temps || ''}
                  onChange={(e) => setHebergementDistance({ temps: parseFloat(e.target.value) })}
                  sx={{ width: '150px' }}
                />
                <Tooltip title={"Ajouter l'hébergement"}>
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleAddHebergement}
                      disabled={!hebergement.campingId || hebergement.campingId === null || isReadOnlyConvex()}
                      startIcon={<AddIcon />}
                    >
                      Ajouter
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              <Typography variant="h6" sx={{ mt: 2 }}>Distance/Temps depuis Maison</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="distance (km)"
                  value={formData.distanceMaisonLac?.kilometrage || ''}
                  onChange={(e) => setDistanceMaisonLac({ kilometrage: parseFloat(e.target.value) || 0 })}
                />
                <TextField
                  fullWidth
                  label="temps (min)"
                  value={formData.distanceMaisonLac?.temps || ''}
                  onChange={(e) => setDistanceMaisonLac({ temps: parseFloat(e.target.value) || 0 })}
                />
              </Box>
            </>
          )}
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isReadOnlyConvex()}
        >
          {mode === 'create' ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}