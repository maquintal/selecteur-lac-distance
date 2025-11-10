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
import { LacDoc } from '../types/schema.types';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ShuffleIcon from '@mui/icons-material/Shuffle';

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
    console.log('queryResult structure:', JSON.stringify(queryResult?.[0], null, 2));
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


    const getHebergement = (acces: Acces | undefined, hebergement: Array<{
        nom?: string;
        camping?: string;
        organisme?: string;
        commodites?: {
            eau?: boolean;
            electricite?: boolean;
        };
        distanceDepuisLac?: {
            kilometrage: number;
            temps: number;
        };
    }> | null) => {
        if (!hebergement || hebergement.length === 0) {
            return <Typography variant="body2" color="text.secondary">—</Typography>;
        }

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {hebergement.map((h, index) => {
                    // h contient déjà les données du camping enrichies par getLacsSortedOptimized
                    const campingNom = h.nom || h.camping || 'N/A';
                    const organisme = h.organisme || 'privé';

                    return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <CardHeader
                                    title={campingNom}
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
                                        {h.distanceDepuisLac.kilometrage.toFixed(2)} km ({h.distanceDepuisLac.temps} min)
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
            <Box className="p-4 bg-white rounded-lg shadow">
                <Box display="flex" gap={2} mb={3} alignItems="center">
                    <Button
                        variant="contained"
                        startIcon={<ShuffleIcon />}
                        onClick={handleRandomInteressant}
                        sx={{ minWidth: 200 }}
                    >
                        Lac au hasard
                    </Button>
                    <Box display="flex" gap={8} flex={1}>
                        <TextField
                            label="Région"
                            size="small"
                            value={filters.region}
                            onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
                        />
                        <TextField
                            label="Réserve / Site (SEPAQ)"
                            size="small"
                            value={filters.reserve}
                            onChange={e => setFilters(f => ({ ...f, reserve: e.target.value }))}
                        />
                        <TextField
                            label="Organisme"
                            size="small"
                            value={filters.organisme}
                            onChange={e => setFilters(f => ({ ...f, organisme: e.target.value }))}
                        />
                        <TextField
                            label="Nom du lac"
                            size="small"
                            value={filters.nom}
                            onChange={e => setFilters(f => ({ ...f, nom: e.target.value }))}
                        />
                        <TextField
                            label="Motorisation"
                            size="small"
                            value={filters.motorisation}
                            onChange={e => setFilters(f => ({ ...f, motorisation: e.target.value }))}
                        />
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
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
                                        <Image src="/sepaq_logo2-transparent.png" alt="sepaq" width={40} height={40} />
                                    ) : undefined
                                }
                                title={l.nomDuLac}
                                subheader={
                                    <Box display="flex" flexDirection="column">
                                        <Typography variant="subtitle1" color="text.secondary">
                                            {l.regionAdministrativeQuebec}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {l.site || 'privé'}
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
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {cardHeader}
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box display="flex" justifyContent="space-between" gap={2}>
                                                <Box flex={1}>
                                                    <Box mt={0.5} display="flex" gap={1} flexWrap="wrap">
                                                        {getEspeces(l).slice(0, 6).map((sp: EspeceDoc) => (
                                                            <Chip key={sp.nomCommun} label={sp.nomCommun} size="small" />
                                                        ))}
                                                    </Box>

                                                    <Box mt={2}>
                                                        <Typography variant="body2"><strong>Accès</strong></Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {l.acces?.acceuil ? `Accueil: ${l.acces.acceuil}` : ''}
                                                            {l.acces?.distanceAcceuilLac != null ?
                                                                ` • ${l.acces.distanceAcceuilLac.kilometrage} km (${l.acces.distanceAcceuilLac.temps} min)`
                                                                : ''}<br />
                                                            {l.acces?.accessible ? `${l.acces.accessible}` : ''}<br />
                                                            {l.acces?.portage ? `${l.acces.portage}` : ''}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ width: 160, textAlign: 'right' }}>
                                                    <Box mt={1}>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Superficie
                                                        </Typography>
                                                        <Typography variant="body2">{getSuperficieText(l) ?? '—'}</Typography>
                                                        {icon}
                                                    </Box>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Motorisation
                                                    </Typography>
                                                    <Box>
                                                        {getMotorisationChip(l)}
                                                    </Box>
                                                    <Box mt={1}>
                                                        <Tooltip title={"voir les hébergements"}>
                                                            <ButtonBase
                                                                onClick={() => { handleFlip(l._id) }}
                                                                sx={{
                                                                    width: '100%',
                                                                    display: 'flex',
                                                                    justifyContent: 'flex-end',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <Box sx={{ textAlign: 'right' }}>
                                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                                        Hébergement ({l.hebergements?.length ?? 0})
                                                                    </Typography>
                                                                </Box>
                                                                <KeyboardArrowRightIcon />
                                                            </ButtonBase>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                        <Box sx={{ p: 1 }}>
                                            <Typography variant="caption" color="textSecondary">Lat: {getLatitude(l) ?? '—'} • Lon: {getLongitude(l) ?? '—'}</Typography>
                                        </Box>

                                    </Card>

                                    {/* BACK */}
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {cardHeader}
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            {getHebergement(l.acces, l.hebergements)}
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'space-between' }}>
                                            <IconButton
                                                aria-label="voir les campings sur Google Maps"
                                                onClick={(e) => handleButtonClick(e, getLatitude(l), getLongitude(l))}
                                            >
                                                <Icon path={mdiMapSearchOutline} size={1} />
                                            </IconButton>
                                            <IconButton
                                                aria-label="retour à la recherche"
                                                onClick={() => handleFlip(l._id)}
                                            >
                                                <ReplyOutlinedIcon />
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