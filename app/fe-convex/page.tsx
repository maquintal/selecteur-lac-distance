'use client';

import React, { useMemo, useState } from 'react';
import { Acces, Hebergement, Lake, Superficie } from '../types/lake';
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
} from '@mui/material';
import Image from 'next/image';
import ReactCardFlip from 'react-card-flip';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import Icon from '@mdi/react';
import { mdiFuel, mdiMapSearchOutline } from '@mdi/js';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import { ButtonBase } from '@mui/material';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import LacDialog from '../components/LacDialog';
import { LacDoc } from '../types/schema.types';

type Filters = {
    region: string;
    reserve: string;
    organisme: string;
    nom: string;
};

export default function LakesSearchCards() {
    // Utilisation de la query Convex triée
    const data = useQuery(api.lacs.getLacsSortedOptimized) || [];
    const loading = data === undefined;
    
    const [filters, setFilters] = useState<Filters>({ region: '', reserve: '', organisme: '', nom: '' });
    const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
    
    // État pour le dialog d'édition
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLac, setSelectedLac] = useState<LacDoc | undefined>(undefined);

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
            return regionMatch && organismeMatch && reserveMatch && nomMatch;
        });
    }, [data, filters]);

    // Fonction pour ouvrir le dialog d'édition
    const handleOpenEditDialog = (lac: any) => {
        setSelectedLac(lac);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLac(undefined);
    };

    // Helper getters
    const getLatitude = (l: any) => l.coordonnees.latitude ?? null;
    const getLongitude = (l: any) => l.coordonnees.longitude ?? null;
    const getEspeces = (l: any) => l.especes ?? [];
    const getSuperficieText = (l: any) => {
        const s = l.superficie;
        if (!s) return null;
        return `${s.hectares} ha`;
    };

    const getMotorisationChip = (l: any) => {
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

    const getLakeSizeCategory = (superficie: any) => {
        if (!superficie) {
            return {
                label: 'Superficie inconnue',
                level: 0,
                icon: null
            };
        }

        const superficieHa = superficie.hectares;

        if (!superficieHa) {
            return {
                label: 'Superficie inconnue',
                level: 0,
                icon: null
            };
        }

        if (superficieHa < 10) return {
            label: 'Très petit lac',
            level: 1,
            icon: (
                <>
                    <WaterDropOutlinedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 20, color: 'action.disabled' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 24, color: 'action.disabled' }} />
                </>
            )
        };
        if (superficieHa < 100) return {
            label: 'Petit lac',
            level: 2,
            icon: (
                <>
                    <WaterDropOutlinedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 20, color: 'action.disabled' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 24, color: 'action.disabled' }} />
                </>
            )
        };
        if (superficieHa < 1000) return {
            label: 'Lac moyen',
            level: 3,
            icon: (
                <>
                    <WaterDropOutlinedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 24, color: 'action.disabled' }} />
                </>
            )
        };
        return {
            label: 'Grand lac',
            level: 4,
            icon: (
                <>
                    <WaterDropOutlinedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <WaterDropOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                </>
            )
        };
    };

    const getHebergement = (acces: Acces | undefined, hebergement: any[] | null) => {
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

    return (
        <>
            <Box className="p-4 bg-white rounded-lg shadow">
                <Box display="flex" gap={8} mb={3}>
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

                    {filtered.map((l: any) => {
                        const { icon } = getLakeSizeCategory(l.superficie);

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
                                    <Tooltip title="Modifier le lac">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenEditDialog(l)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
                            />
                        );

                        return (
                            <Box key={l._id} sx={{ display: 'flex', flexDirection: 'column' }}>
                                <ReactCardFlip isFlipped={!!flippedCards[l._id]} flipDirection="horizontal">
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {cardHeader}
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box display="flex" justifyContent="space-between" gap={2}>
                                                <Box flex={1}>
                                                    <Box mt={0.5} display="flex" gap={1} flexWrap="wrap">
                                                        {getEspeces(l).slice(0, 6).map((sp: any) => (
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