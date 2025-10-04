'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Lake, Superficie } from '../types/lake';
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

type Filters = {
    region: string;
    reserve: string;
    nom: string;
};

export default function LakesSearchCards() {
    const [data, setData] = useState<Lake[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ region: '', reserve: '', nom: '' });
    const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const fetchLakes = async () => {
            try {
                const res = await fetch('/api/lakes');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Failed to fetch lakes', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLakes();
    }, []);

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter(l => {
            const regionMatch = filters.region
                ? (l.regionAdministrativeQuebec || '').toLowerCase().includes(filters.region.toLowerCase())
                : true;
            const reserveSite = l.juridiction?.organisme === 'SEPAQ' ? (l.juridiction.site || '') : '';
            const reserveMatch = filters.reserve ? reserveSite.toLowerCase().includes(filters.reserve.toLowerCase()) : true;
            const nomMatch = filters.nom ? (l.nomDuLac || '').toLowerCase().includes(filters.nom.toLowerCase()) : true;
            return regionMatch && reserveMatch && nomMatch;
        });
    }, [data, filters]);

    // Helper getters that tolerate both shapes in JSON
    const getLatitude = (l: Lake) => l.coordonnees.latitude ?? l.coordonnees?.latitude ?? null;
    const getLongitude = (l: Lake) => l.coordonnees.longitude ?? l.coordonnees?.longitude ?? null;
    const getEspeces = (l: Lake) => l.especes ?? [];
    const getSuperficieText = (l: Lake) => {
        const s = l.superficie;
        if (!s) return null;
        if (Array.isArray(s)) {
            const ha = s.find((x: Superficie) => x.unite === 'ha');
            if (ha) return `${ha.valeur} ha`;
            const first = s[0];
            return first ? `${first.valeur} ${first.unite}` : null;
        }
        // if it's a string
        return String(s);
    };

    const getMotorisationChip = (l: Lake) => {
        const m = l.embarcation?.motorisation ?? null;
        if (!m) return <Chip label="—" size="small" />;

        const type = m.type?.toLowerCase() ?? '';
        const puissance = m.puissanceMin ?? null;

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

    const getLakeSizeCategory = (superficie: Array<{ valeur: number, unite: string }> | null) => {
        // Gérer les cas null ou undefined
        if (!superficie || !Array.isArray(superficie)) {
            return {
                label: 'Superficie inconnue',
                level: 0,
                icon: null
            };
        }

        // Trouver la valeur en hectares
        const superficieHa = superficie.find(s => s.unite === 'ha')?.valeur;

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

    const getHebergement = (hebergement: Array<{ camping: string, distanceCampingAcceuil: number }> | null) => {
        if (!hebergement || hebergement.length === 0) {
            return <Typography variant="body2" color="text.secondary">—</Typography>;
        }

        return (
            hebergement.map((h, index) => (
                <Box key={index} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">{h.camping} • {h.distanceCampingAcceuil} min</Typography>
                </Box>
            ))

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

                {filtered.map((l: Lake) => {
                    const { icon } = getLakeSizeCategory(l.superficie);

                    // Header commun pour ce lac spécifique
                    const cardHeader = (
                        <CardHeader
                            avatar={
                                l.juridiction?.organisme === 'SEPAQ' ? (
                                    <Image src="/sepaq_logo2.png" alt="sepaq" width={40} height={40} />
                                ) : undefined
                            }
                            title={l.nomDuLac}
                            subheader={
                                <Box display="flex" flexDirection="column">
                                    <Typography variant="subtitle1" color="text.secondary">
                                        {l.regionAdministrativeQuebec}
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {l.juridiction?.organisme === 'SEPAQ'
                                            ? `${l.juridiction.site}`
                                            : `${l.juridiction?.organisme}`
                                        }
                                    </Typography>
                                </Box>
                            }
                        />
                    );
                    return (

                        <Box key={l._id} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <ReactCardFlip isFlipped={!!flippedCards[l._id]} flipDirection="horizontal">
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {cardHeader}
                                    {/* FRONT */}
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box display="flex" justifyContent="space-between" gap={2}>
                                            <Box flex={1}>
                                                <Box mt={0.5} display="flex" gap={1} flexWrap="wrap">
                                                    {getEspeces(l).slice(0, 6).map((sp: string) => (
                                                        <Chip key={sp} label={sp} size="small" />
                                                    ))}
                                                </Box>

                                                <Box mt={2}>
                                                    <Typography variant="body2"><strong>Accès</strong></Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {l.acces?.acceuil ? `Accueil: ${l.acces.acceuil}` : ''}
                                                        {l.acces?.distanceAcceuilLac != null ? ` • ${l.acces.distanceAcceuilLac} km` : ''}<br />
                                                        {l.acces?.portage ? `${l.acces.portage}` : ''}
                                                    </Typography>
                                                </Box>
                                                {/* This is the front of the card.
                                            <button onClick={() => handleFlip(l._id)}>Click to flip</button> */}
                                            </Box>

                                            <Box sx={{ width: 160, textAlign: 'right' }}>
                                                <Box>
                                                    {getMotorisationChip(l)}
                                                </Box>
                                                <Box mt={1}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Superficie
                                                    </Typography>
                                                    <Typography variant="body2">{getSuperficieText(l) ?? '—'}</Typography>
                                                    {/* <Typography variant="body2"> */}
                                                    {icon}
                                                    {/* </Typography> */}
                                                </Box>
                                                <Box mt={1}>
                                                    <Tooltip title={"voir les hébergements"}>
                                                        <ButtonBase
                                                            onClick={() => { handleFlip(l._id) }}
                                                            sx={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                justifyContent: 'flex-end',
                                                                // '&:hover': {
                                                                //     backgroundColor: 'action.hover',
                                                                //     borderColor: 'primary.main'
                                                                // },
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <Box sx={{ textAlign: 'right' }}>
                                                                <Typography variant="caption" color="textSecondary" display="block">
                                                                    Hébergement
                                                                </Typography>
                                                            </Box>
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
                                        {getHebergement(l.hebergement)}
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
        </Box >
    );
}
