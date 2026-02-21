'use client';

import React, { useMemo, useState } from 'react';
import { Acces } from '../types/lake';
import { LacWithDetails, EspeceDoc } from '../types/schema.types';
import { Id } from "../../convex/_generated/dataModel";
import {
  Box,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  CircularProgress,
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
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import LacDialog from '../components/LacDialog';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useMobileDetect } from '../hooks/useMobileDetect';
import { formatTemps } from '../utils/utils.util';
import OtherHousesIcon from '@mui/icons-material/OtherHouses';
import WaterIcon from '@mui/icons-material/Water';

type Filters = {
  region: string;
  reserve: string;
  organisme: string;
  nom: string;
  motorisation: string;
};

export default function LakesSearchCards() {
  // Utilisation de la query Convex triée
  const queryResult = useQuery(api.lacs.getLacsSortedOptimized);
  console.log("Query result:", queryResult);
  const loading = queryResult === undefined;

  // Mémoiser les données de la requête
  const data = useMemo(() => {
    if (queryResult === undefined) return [];
    return queryResult;
  }, [queryResult]);

  const toggleChoixInteressant = useMutation(api.lacs.toggleChoixInteressant);

  const [filters, setFilters] = useState<Filters>({ region: '', reserve: '', organisme: '', nom: '', motorisation: '' });
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [highlightedLacId, setHighlightedLacId] = useState<string | null>(null);

  // État pour le dialog d'édition
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLac, setSelectedLac] = useState<LacWithDetails | undefined>(undefined);

  const { isMobile } = useMobileDetect();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(l => {
      const regionMatch = filters.region
        ? (l.regionAdministrativeQuebec || '').toLowerCase().includes(filters.region.toLowerCase())
        : true;
      const reserveSite = l.site || '';
      const reserveMatch = filters.reserve ? reserveSite.toLowerCase().includes(filters.reserve.toLowerCase()) : true;
      const organismeActuel = l.site ? 'SEPAQ' : 'privé';
      const organismeMatch = filters.organisme ? organismeActuel.toLowerCase().includes(filters.organisme.toLowerCase()) : true;
      const nomMatch = filters.nom ? (l.nomDuLac || '').toLowerCase().includes(filters.nom.toLowerCase()) : true;
      const motorisationType = l.embarcation?.motorisation?.necessaire || '';
      const motorisationMatch = filters.motorisation
        ? motorisationType.toLowerCase().includes(filters.motorisation.toLowerCase())
        : true;
      return regionMatch && organismeMatch && reserveMatch && nomMatch && motorisationMatch;
    });
  }, [data, filters]);

  const handleToggleInteressant = async (lacId: Id<"lacs">, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleChoixInteressant({ lacId });
    } catch (error) {
      console.error("Erreur lors du toggle:", error);
    }
  };

  // Fonction pour ouvrir le dialog d'édition
  const handleOpenEditDialog = (lac: LacWithDetails) => {
    setSelectedLac(lac);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLac(undefined);
  };

  // Helper getters
  const getLatitude = (l: LacWithDetails) => l.coordonnees.latitude ?? null;
  const getLongitude = (l: LacWithDetails) => l.coordonnees.longitude ?? null;
  const getEspeces = (l: LacWithDetails) => l.especes ?? [];
  const getSuperficieText = (l: LacWithDetails) => {
    const s = l.superficie;
    if (!s) return null;
    return `${s.hectares} ha`;
  };

  const getMotorisationChip = (l: LacWithDetails) => {
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

  interface Superficie {
    hectares: number;
  }

  const getLakeSizeCategory = (superficie: Superficie | null) => {
    if (!superficie || !superficie.hectares) {
      return {
        label: 'Superficie inconnue',
        level: 0,
        icon: null,
        recommendation: 'Données manquantes'
      };
    }

    const superficieHa = superficie.hectares;

    if (superficieHa < 3) return {
      label: 'Micro-lac',
      level: 1,
      icon: (
        <>
          <WaterDropOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />
        </>
      ),
      recommendation: 'Parfait pour exploration tranquille'
    };

    if (superficieHa < 15) return {
      label: 'Petit lac',
      level: 2,
      icon: (
        <>
          <WaterDropOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />
          <WaterDropOutlinedIcon sx={{ fontSize: 22, color: 'success.main' }} />
        </>
      ),
      recommendation: 'Très bon pour pêche et navigation'
    };

    if (superficieHa < 30) return {
      label: 'Lac modeste',
      level: 3,
      icon: (
        <>
          <WaterDropOutlinedIcon sx={{ fontSize: 22, color: 'success.main' }} />
          <WaterDropOutlinedIcon sx={{ fontSize: 26, color: 'success.main' }} />
        </>
      ),
      recommendation: 'Navigable avec autonomie raisonnable'
    };

    if (superficieHa < 45) return {
      label: 'Lac étendu',
      level: 4,
      icon: (
        <>
          <WarningAmberOutlinedIcon sx={{ fontSize: 22, color: 'warning.main' }} />
        </>
      ),
      recommendation: 'Faisable avec prudence (vent, retour anticipé)'
    };

    if (superficieHa < 80) return {
      label: 'Lac large',
      level: 5,
      icon: (
        <>
          <WarningAmberOutlinedIcon sx={{ fontSize: 24, color: 'warning.main' }} />
          <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: 'warning.main' }} />
        </>
      ),
      recommendation: 'Limite atteinte — attention à l’autonomie'
    };

    if (superficieHa < 300) return {
      label: 'Grand lac',
      level: 6,
      icon: (
        <>
          <DoNotDisturbAltOutlinedIcon sx={{ fontSize: 24, color: 'error.main' }} />
        </>
      ),
      recommendation: 'À éviter — trop vaste pour ton moteur'
    };

    return {
      label: 'Très grand lac / réservoir',
      level: 7,
      icon: (
        <>
          <ReportProblemOutlinedIcon sx={{ fontSize: 26, color: 'error.main' }} />
        </>
      ),
      recommendation: 'Dangereux — ne pas naviguer avec moteur électrique'
    };
  };

  const getHebergement = (
    acces: Acces | undefined,
    hebergement: Array<{
      nom?: string;
      camping?: string;
      organisme?: string;
      commodites?: {
        eau?: boolean;
        electricite?: boolean;
      };
      coordonnees?: {
        latitude: number;
        longitude: number;
      };
      distanceDepuisLac?: {
        kilometrage: number;
        temps: number;
      };
      terrains?: Array<{
        nom: string;
        equipementAdmissible?: string[];
      }>;
    }> | null) => {
    if (!hebergement || hebergement.length === 0) {
      return <Typography variant="body2" color="text.secondary">—</Typography>;
    }

    const sortedHebergement = [...hebergement].sort((a, b) => {

      const timeA = a.distanceDepuisLac?.temps ?? Infinity;
      const timeB = b.distanceDepuisLac?.temps ?? Infinity;

      return timeA - timeB;
    });

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {sortedHebergement.map((h, index) => {
          // h contient déjà les données du camping enrichies par getLacsSortedOptimized
          const campingNom = h.nom || h.camping || 'N/A';
          const organisme = h.organisme || 'privé';

          const terrainsCount = ((h as any).terrains || []).length;

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
                    {/* {h.distanceDepuisLac.kilometrage.toFixed(2)} km ( */}
                    {`camping -> lac ${formatTemps(h.distanceDepuisLac.temps)}`}
                    {/* ) */}
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
    const googleMapsUrl = `https://www.google.com/maps/search/camping/@${latitude},${longitude},13z`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  /*   const handleButtonClick2 = (e: React.MouseEvent, latitude: number, longitude: number) => {
      e.preventDefault();
      const googleMapsUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`;
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    };
   */
  if (loading) return <Box className="p-6"><CircularProgress /></Box>;

  const handleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRandomInteressant = () => {
    const interessants = filtered.filter((l) => l.isChoixInteressant);
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
        <Box display="flex" gap={1} mb={2} alignItems="center" sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button
            variant="contained"
            startIcon={<ShuffleIcon />}
            onClick={handleRandomInteressant}
            sx={{ minWidth: isMobile ? 120 : 200, mb: { xs: 1, sm: 0 } }}
          >
            Lac au hasard
          </Button>
          <Box sx={{ display: 'grid', gap: { xs: 1, sm: 2 }, flex: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(5,1fr)' } }}>
            <TextField
              label="Région"
              size="small"
              fullWidth
              value={filters.region}
              onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
            />
            <TextField
              label="Réserve / Site (SEPAQ)"
              size="small"
              fullWidth
              value={filters.reserve}
              onChange={e => setFilters(f => ({ ...f, reserve: e.target.value }))}
            />
            <TextField
              label="Organisme"
              size="small"
              fullWidth
              value={filters.organisme}
              onChange={e => setFilters(f => ({ ...f, organisme: e.target.value }))}
            />
            <TextField
              label="Nom du lac"
              size="small"
              fullWidth
              value={filters.nom}
              onChange={e => setFilters(f => ({ ...f, nom: e.target.value }))}
            />
            <TextField
              label="Motorisation"
              size="small"
              fullWidth
              value={filters.motorisation}
              onChange={e => setFilters(f => ({ ...f, motorisation: e.target.value }))}
            />
          </Box>
        </Box>

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
          {filtered.length === 0 && (
            <Box>
              <Typography>Aucun résultat</Typography>
            </Box>
          )}

          {filtered.map((l) => {
            const { icon } = getLakeSizeCategory(l.superficie || null);

            const cardHeader = (
              <CardHeader
                avatar={
                  l.site ? (
                    <Image src="/sepaq_logo2-transparent.png" alt="sepaq" width={isMobile ? 28 : 40} height={isMobile ? 28 : 40} />
                  ) : undefined
                }
                title={l.nomDuLac}
                titleTypographyProps={{ sx: { fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 600 } }}
                subheaderTypographyProps={{ sx: { fontSize: isMobile ? '0.7rem' : '0.85rem' } }}
                subheader={
                  <Box display="flex" flexDirection="column">
                    <Typography variant="subtitle2" color="text.secondary">
                      {l.regionAdministrativeQuebec}
                    </Typography>
                    {/* <Typography variant="caption" color="text.secondary">
                      {l.site || 'privé'} • {l.distanceMaisonLac?.kilometrage ? `${l.distanceMaisonLac.kilometrage.toFixed(2)} km` : 'Distance maison inconnue'} • {l.acces?.accessible || 'Accessibilité inconnue'}
                    </Typography> */}
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
                    borderRadius: 1
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
                              {l.acces?.acceuil ? `Accueil: ${l.acces.acceuil}` : ''}<br />
                              {l.acces?.accessible ? `${l.acces.accessible}` : ''}<br />
                              {l.acces?.portage ? `${l.acces.portage}` : ''}
                            </Typography>

                            <Typography variant="body2" sx={{ fontSize: '0.78rem', mt: 0.5 }}><strong>Distances & Temps</strong></Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1px 8px', alignItems: 'center' }}>
                              {


                                [
                                  { label: <><OtherHousesIcon sx={iconSx} />→<WaterIcon sx={iconSx} /></>, key: 'maison-lac', data: l.distanceMaisonLac },
                                  // { label: <><HomeIcon sx={iconSx} />→<HolidayVillageIcon sx={iconSx} /></>, key: 'maison-camping', data: l.distanceMaisonCamping },
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
                            <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>{getSuperficieText(l) ?? '—'}</Typography>
                            {icon}
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
                                    {l.hebergements.filter(h => h.distanceDepuisLac?.temps && h.distanceDepuisLac?.temps >= 0 && h.distanceDepuisLac?.temps <= 35).length} hébergements à moins de 30 min
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.68rem' }}>
                                    {l.hebergements.filter(h => h.distanceDepuisLac?.temps && h.distanceDepuisLac?.temps >= 30 && h.distanceDepuisLac?.temps <= 65).length} hébergements à moins de 1h
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
                      {getHebergement(l.acces, l.hebergements)}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', py: 0.25 }}>
                      <IconButton
                        aria-label="voir les campings sur Google Maps"
                        onClick={(e) => handleButtonClick(e, getLatitude(l), getLongitude(l))}
                        size="small"
                      >
                        <Icon path={mdiMapSearchOutline} size={0.9} />
                      </IconButton>
                      {/*                       <Button
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