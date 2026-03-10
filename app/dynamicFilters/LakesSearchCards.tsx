import React, { useState } from 'react';
import { Id } from "../../convex/_generated/dataModel";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Tooltip,
  CardActions,
  IconButton,
  Button,
} from '@mui/material';
import Image from 'next/image';
import ReactCardFlip from 'react-card-flip';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import Icon from '@mdi/react';
import { mdiFuel, mdiMapSearchOutline } from '@mdi/js';
import { ButtonBase } from '@mui/material';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import EditIcon from '@mui/icons-material/Edit';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import LacDialog from '../components/LacDialog';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useMobileDetect } from '../hooks/useMobileDetect';
import { formatTemps } from '../utils/utils.util';
import OtherHousesIcon from '@mui/icons-material/OtherHouses';
import WaterIcon from '@mui/icons-material/Water';
import { LacEnriched, LacHebergementItem } from '../types/lacs.type';
import { EspeceDoc } from '../types/especes.type';
import { assessISO12217NavigationSafety, getDangerLabel } from './NavigationSafetyAssessment';
import NavigationSafetyLegend from './NavigationSafetyLegend';

  const TOOLTIP_SX = {
    bgcolor: 'background.paper',
    color: 'text.primary',
    boxShadow: 3,
    border: '1px solid',
    borderColor: 'grey.200',
    p: 0,
  };

const LakesSearchCards = ({ data, scenario }: {
  data: LacEnriched[],
  scenario: string
}) => {

  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [highlightedLacId, setHighlightedLacId] = useState<string | null>(null);

  // État pour le dialog d'édition
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLac, setSelectedLac] = useState<LacEnriched | undefined>(undefined);

  const { isMobile } = useMobileDetect();

  const toggleChoixInteressant = useMutation(api.lacs.toggleChoixInteressant);

  const handleToggleInteressant = async (lacId: Id<"lacs">, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleChoixInteressant({ lacId });
    } catch (error) {
      console.error("Erreur lors du toggle:", error);
    }
  };

  // Fonction pour ouvrir le dialog d'édition
  const handleOpenEditDialog = (lac: LacEnriched) => {
    setSelectedLac(lac);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLac(undefined);
  };

  // Helper getters
  const getLatitude = (l: LacEnriched) => l.coordonnees.latitude ?? null;
  const getLongitude = (l: LacEnriched) => l.coordonnees.longitude ?? null;
  const getEspeces = (l: LacEnriched) => l.especes ?? [];
  const getSuperficieText = (l: LacEnriched) => {
    const s = l.superficie;
    if (!s) return null;
    return `${s.hectares} ha`;
  };

  const getMotorisationChip = (l: LacEnriched) => {
    const m = l.embarcation?.motorisation ?? null;
    if (!m) return <Chip label="—" size="small" />;

    const type = m.necessaire?.toLowerCase() ?? '';
    const puissance = m.puissance?.minimum ?? null;

    return (
      type === "electrique" ?
        <BoltOutlinedIcon />
        : <>
          <Tooltip title={`Puissance minimale en HP: ${puissance ?? '—'}`}>
            <Icon path={mdiFuel} size={1} />
          </Tooltip>
        </>
    );
  };

  const getHebergement = (hebergement: LacHebergementItem[] | null) => {
    if (!Array.isArray(hebergement) || hebergement.length === 0) {
      return <Typography variant="body2" color="text.secondary">—</Typography>;
    }

    // const sortedHebergement = [...hebergement].sort((a, b) => {

    //   const timeA = a.distanceDepuisLac?.temps ?? Infinity;
    //   const timeB = b.distanceDepuisLac?.temps ?? Infinity;

    //   return timeA - timeB;

    const sortedHebergement = hebergement

    //});

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {sortedHebergement.map((h, index) => {
          // h contient déjà les données du camping enrichies par getLacsSortedOptimized
          const campingNom = h.nom || 'N/A';
          const organisme = h.organisme || 'privé';

          const terrainsCount = (h.terrains || []).length;

          return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <CardHeader
                  title={<>{campingNom}{organisme === 'SEPAQ' && terrainsCount > 0 ? ` (${terrainsCount})` : ''}</>}
                  subheader={h.distanceMaisonCamping ? `Maison -> Camping: ${formatTemps(h.distanceMaisonCamping.temps)}` : 'Distance maison inconnue'}
                  avatar={
                    organisme === 'SEPAQ' ? (
                      <Image src="/sepaq_logo2-transparent.png" alt="sepaq" width={15} height={15} />
                    ) : (
                      organisme === 'Pourvoirie' ? (
                        <Image src="/fpq2.png" alt="pourvoirie" width={15} height={15} />
                      ) : (
                        organisme === 'Camping' ? (
                          <Image src="/campingquebec.png" alt="camping" width={15} height={15} />
                        ) : undefined
                      )
                    )
                  }
                />
              </Box>

              <Box sx={{ textAlign: 'right', minWidth: '150px' }}>
                {h.distanceDepuisLac && (
                  <Typography variant="body2" color="primary.main" fontWeight="500">
                    {`camping -> lac ${formatTemps(h.distanceDepuisLac.temps)}`}
                  </Typography>
                )}
                {(h.commodites?.eau || h.commodites?.electricite) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {[h.commodites.eau && 'Eau', h.commodites.electricite && 'Électricité'].filter(Boolean).join(' • ')}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const handleButtonClick = (e: React.MouseEvent, latitude: number, longitude: number) => {
    e.preventDefault();
    // const googleMapsUrl = `https://www.google.com/maps/search/camping/@${latitude},${longitude},13z`;
    const googleMapsUrl = `https://www.google.com/maps/search/Terrains+de+camping/@${latitude},${longitude},13z`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  // const handleButtonClick2 = (e: React.MouseEvent, latitude: number, longitude: number) => {
  //   e.preventDefault();
  //   const googleMapsUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`;
  //   window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  // };

  const handleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRandomInteressant = () => {
    const interessants = data.filter((l) => l.isChoixInteressant);
    if (interessants.length === 0) {
      alert('Aucun lac marqué comme intéressant trouvé!');
      return;
    }
    const randomLac = interessants[Math.floor(Math.random() * interessants.length)];
    setHighlightedLacId(randomLac._id);

    // Scroll vers la carte
    setTimeout(() => {
      const element = document.getElementById(`lac-card-${randomLac._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Retirer le highlight après 3 secondes
    setTimeout(() => setHighlightedLacId(null), 3000);
  };

  return (
    <>
      <Box className="p-3 bg-white rounded-lg shadow-sm">
        <Button
          variant="contained"
          startIcon={<ShuffleIcon />}
          onClick={handleRandomInteressant}
          sx={{ minWidth: isMobile ? 120 : 200, mb: { xs: 1, sm: 0 } }}
        >
          Lac au hasard
        </Button>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)'
            },
          }}
        >
          {data.length === 0 && (
            <Box>
              <Typography>Aucun résultat</Typography>
            </Box>
          )}

          {data.map((l) => {
            const { icon, recommendation, isoNote, isoCategory, waveHeightM, level, waveScenarios } = assessISO12217NavigationSafety(l.superficie || null);

            const cardHeader = (
              <CardHeader
                avatar={
                  l.site ? (
                    <Image
                      src="/sepaq_logo2-transparent.png"
                      alt="sepaq" width={isMobile ? 28 : 40} height={isMobile ? 28 : 40}
                    />
                  ) : undefined
                }
                title={l.nomDuLac}
                titleTypographyProps={{ sx: { fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 600 } }}
                subheaderTypographyProps={{ sx: { fontSize: isMobile ? '0.7rem' : '0.85rem' } }}
                subheader={
                  <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle2" color="text.secondary">
                      {l.site || l.acces.acceuil}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {l.regionAdministrativeQuebec}
                    </Typography>
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={l.isChoixInteressant ? "Retirer des favoris" : "Marquer comme intéressant"}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleToggleInteressant(l._id, e)}
                        sx={{
                          color: l.isChoixInteressant ? 'warning.main' : 'action.active',
                          '&:hover': {
                            color: 'warning.main',
                          }
                        }}
                      >
                        {l.isChoixInteressant ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copier les coordonnées">
                      <IconButton
                        onClick={() => {
                          const lat = l.coordonnees.latitude.toString().replace(',', '.');
                          const lng = l.coordonnees.longitude.toString().replace(',', '.');
                          const coords = `${lat}, ${lng}`;
                          navigator.clipboard.writeText(coords);
                        }}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Modifier le lac">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(l)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }

              />
            );

            const iconSx = { fontSize: '0.85rem', verticalAlign: 'middle' };

            return (
              <Box
                key={l._id}
                id={`lac-card-${l._id}`}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  ...(highlightedLacId === l._id && {
                    transform: 'scale(1.02)',
                    boxShadow: '0 0 20px rgba(25, 118, 210, 0.5)',
                    borderRadius: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  })
                }}
              >
                <ReactCardFlip isFlipped={!!flippedCards[l._id]} flipDirection="horizontal">
                  {/* FRONT */}
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 0.4, px: 0.6, border: '1px solid #eaeaea' }}>
                    {cardHeader}
                    <CardContent sx={{ flexGrow: 1, py: 0.6, px: 0.5 }}>
                      <Box display="flex" justifyContent="space-between" gap={1}>
                        <Box flex={1}>
                          <Box mt={0.4} display="flex" gap={0.5} flexWrap="wrap">
                            {getEspeces(l).slice(0, isMobile ? 3 : 5).map((sp: EspeceDoc) => (
                              <Chip key={sp.nomCommun} label={sp.nomCommun} size="small" sx={{ fontSize: '0.68rem', height: 22 }} />
                            ))}
                          </Box>

                          <Box mt={0.8}>
                            <Typography variant="body2" sx={{ fontSize: '0.78rem' }}><strong>Accès</strong></Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>
                              {l.acces?.acceuil ? `Accueil: ${l.acces.acceuil}` : ''}{` Distance ${l.acces.distanceAcceuilLac.kilometrage} km`}<br />
                              {l.acces?.accessible ? `${l.acces.accessible}` : ''}<br />
                              {l.acces?.portage ? `${l.acces.portage}` : ''}
                            </Typography>

                            <Typography variant="body2" sx={{ fontSize: '0.78rem', mt: 0.5 }}><strong>Distances & Temps</strong></Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1px 8px', alignItems: 'center' }}>
                              {
                                [
                                  { label: <><OtherHousesIcon sx={iconSx} />→<WaterIcon sx={iconSx} /></>, key: 'maison-lac', data: l.distanceMaisonLac },
                                ].map(({ label, key, data }) =>
                                  data?.kilometrage && data?.temps ? (
                                    <React.Fragment key={key}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                          {label}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>
                                        {data.kilometrage.toFixed(1)} km • {formatTemps(data.temps)}
                                      </Typography>
                                    </React.Fragment>
                                  ) : null
                                )}
                            </Box>
                            {!l.distanceMaisonLac?.kilometrage && (
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>Distance inconnue</Typography>
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ width: isMobile ? 90 : 140, textAlign: 'right' }}>
                          <Box mt={0.6}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>
                              Superficie
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
                              {getSuperficieText(l) ?? '—'}
                            </Typography>

                            {/* ISO 12217 */}

                            {/* Tooltip 1 — icône */}
                            <Tooltip
                              title={`${recommendation} — ${isoNote}`}
                              componentsProps={{ tooltip: { sx: TOOLTIP_SX } }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                {icon}
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                  ISO Cat. {isoCategory}
                                </Typography>
                              </Box>
                            </Tooltip>

                            {/* Tooltip 2 — légende complète */}
                            <Tooltip
                              title={<NavigationSafetyLegend waveHeightM={waveHeightM} waveScenarios={waveScenarios} />}
                              componentsProps={{ tooltip: { sx: TOOLTIP_SX } }}
                            >
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', cursor: 'help' }}>
                                {getDangerLabel(level)} — Hs {waveHeightM.toFixed(2)} m
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>
                            Motorisation
                          </Typography>
                          <Box>
                            {getMotorisationChip(l)}
                          </Box>
                          <Box mt={0.6}>
                            <Tooltip title={"voir les hébergements"}>
                              <ButtonBase
                                onClick={() => { handleFlip(l._id) }}
                                sx={{
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  transition: 'all 0.12s'
                                }}
                              >
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.68rem' }}>
                                    Hébergement ({l.hebergements?.length ?? 0})
                                  </Typography>
                                  <KeyboardArrowRightIcon fontSize="small" />
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.68rem' }}>
                                    {(scenario === "sejour2" ? l.hebergementsNonSepaq : l.hebergements)
                                      .filter(h => (h.distanceDepuisLac?.temps ?? Infinity) <= 35).length
                                    } hébergements à moins de 30 min
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.68rem' }}>
                                    {(scenario === "sejour2" ? l.hebergementsNonSepaq : l.hebergements)
                                      .filter(h => (h.distanceDepuisLac?.temps ?? Infinity) <= 65).length
                                    } hébergements à moins de 1h
                                  </Typography>
                                </Box>
                              </ButtonBase>
                            </Tooltip>
                          </Box>
                        </Box>

                      </Box>
                    </CardContent>
                    <Box sx={{ p: 0.6 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.62rem' }}>Lat: {getLatitude(l) ?? '—'} • Lon: {getLongitude(l) ?? '—'}</Typography>
                    </Box>
                  </Card>

                  {/* BACK */}
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 0.4, px: 0.6, border: '1px solid #eaeaea' }}>
                    {cardHeader}
                    <CardContent sx={{ flexGrow: 1, py: 0.6 }}>
                      {getHebergement(scenario === "sejour2" ? l.hebergementsNonSepaq : l.hebergements)}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', py: 0.25 }}>
                      <IconButton
                        aria-label="voir les campings sur Google Maps"
                        onClick={(e) => handleButtonClick(e, getLatitude(l), getLongitude(l))}
                        size="small"
                      >
                        <Icon path={mdiMapSearchOutline} size={0.9} />
                      </IconButton>
                      {/* <Button
                        onClick={(e) => handleButtonClick2(e, getLatitude(l), getLongitude(l))}>
                        Voir sur OpenStreetMap
                      </Button> */}
                      <IconButton
                        aria-label="retour à la recherche"
                        onClick={() => handleFlip(l._id)}
                        size="small"
                      >
                        <ReplyOutlinedIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </ReactCardFlip>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Dialog d'édition */}
      <LacDialog
        open={openDialog}
        onClose={handleCloseDialog}
        lac={selectedLac}
        mode="edit"
      />
    </>
  );
}

export default LakesSearchCards;