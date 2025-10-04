 'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Lake } from '../types/lake';
import {
    Box,
    TextField,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Chip,
    CircularProgress,
} from '@mui/material';
import Image from 'next/image';

type Filters = {
    region: string;
    reserve: string;
    nom: string;
};

function FlipCard({ content }: { content: any }) {
    const [flipped, setFlipped] = React.useState(false);
    const frontText = content?.camping ?? content?.nom ?? '—';
    const backLines: string[] = [];
    if (content?.distanceCampingAcceuil != null) backLines.push(`Distance: ${content.distanceCampingAcceuil} km`);
    if (content?.acceuil) backLines.push(`Accueil: ${content.acceuil}`);
    if (content?.details) backLines.push(content.details);

    return (
        <Box
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
            onClick={() => setFlipped(f => !f)}
            sx={{
                width: '100%',
                perspective: 800,
                mt: 0.5,
            }}
        >
            <Box sx={{ position: 'relative', width: '100%', height: 56 }}>
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        transition: 'transform 0.45s',
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                >
                    <Box
                        sx={{
                            backfaceVisibility: 'hidden',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            px: 1,
                        }}
                    >
                        <Typography variant="body2">{frontText}</Typography>
                    </Box>

                    <Box
                        sx={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            px: 1,
                        }}
                    >
                        <Box>
                            {backLines.length === 0 ? (
                                <Typography variant="caption">Aucun détail</Typography>
                            ) : (
                                backLines.map((ln, i) => (
                                    <Typography key={i} variant="caption" display="block">{ln}</Typography>
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default function LakesSearchCards() {
    const [data, setData] = useState<Lake[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ region: '', reserve: '', nom: '' });

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
    const getLatitude = (l: any) => l.latitude ?? l.coordonnees?.latitude ?? null;
    const getLongitude = (l: any) => l.longitude ?? l.coordonnees?.longitude ?? null;
    const getEspeces = (l: any) => l.especes ?? l.espece ?? [];
    const getSuperficieText = (l: any) => {
        const s = l.superficie;
        if (!s) return null;
        if (Array.isArray(s)) {
            const ha = s.find((x: any) => x.unite === 'ha' || x.unite === 'hectare');
            if (ha) return `${ha.valeur} ha`;
            const first = s[0];
            return first ? `${first.valeur} ${first.unite}` : null;
        }
        // if it's a string
        return String(s);
    };
    const getMotorisationText = (l: any) => {
        const m = l.embarcation?.motorisation ?? l.motorisation ?? null;
        if (!m) return '—';
        const type = m.type ?? '—';
        const puissance = m.puissanceMin ?? m.puissanceMax ?? m.puissance ?? null;
        return puissance ? `${type} (${puissance})` : String(type);
    };
    const getHebergement = (l: any) => {
        const h = l.hebergement ?? l.hebergements ?? null;
        if (!h) return null;
        if (Array.isArray(h) && h.length > 0) return h[0];
        return h;
    };

    if (loading) return <Box className="p-6"><CircularProgress /></Box>;

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
                    }
                }}
            >
                {filtered.length === 0 && (
                    <Box>
                        <Typography>Aucun résultat</Typography>
                    </Box>
                )}

                {filtered.map((l: any) => (
                    <Box key={l._id} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardHeader
                                avatar={
                                    l.juridiction?.organisme === 'SEPAQ' ? (
                                        <Image src="/sepaq_logo2.png" alt="sepaq" width={40} height={40} />
                                    ) : undefined
                                }
                                title={l.nomDuLac}
                                subheader={l.regionAdministrativeQuebec}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" justifyContent="space-between" gap={2}>
                                    <Box flex={1}>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                            {l.juridiction?.organisme === 'SEPAQ' ? `Site: ${l.juridiction.site || '—'}` : `Organisme: ${l.juridiction?.organisme || '—'}`}
                                        </Typography>

                                        <Box mt={0.5} display="flex" gap={1} flexWrap="wrap">
                                            {getEspeces(l).slice(0, 6).map((sp: string) => (
                                                <Chip key={sp} label={sp} size="small" />
                                            ))}
                                        </Box>

                                        <Box mt={2}>
                                            <Typography variant="body2"><strong>Accès</strong></Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {l.acces?.portage ? `${l.acces.portage}` : ''}
                                                {l.acces?.acceuil ? ` • Accueil: ${l.acces.acceuil}` : ''}
                                                {l.acces?.distanceAcceuilLac != null ? ` • ${l.acces.distanceAcceuilLac} km` : ''}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ width: 160, textAlign: 'right' }}>
                                        <Box>
                                            <Chip label={getMotorisationText(l)} size="small" />
                                        </Box>
                                        <Box mt={1}>
                                            <Typography variant="caption" color="textSecondary">Superficie</Typography>
                                            <Typography variant="body2">{getSuperficieText(l) ?? '—'}</Typography>
                                        </Box>
                                        <Box mt={1}>
                                            <Typography variant="caption" color="textSecondary">Hébergement</Typography>
                                            <FlipCard content={getHebergement(l)} />
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                            <Box sx={{ p: 1 }}>
                                <Typography variant="caption" color="textSecondary">Lat: {getLatitude(l) ?? '—'} • Lon: {getLongitude(l) ?? '—'}</Typography>
                            </Box>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
