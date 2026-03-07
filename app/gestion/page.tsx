'use client';

import { useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Box, Container, Typography, Paper, Button,
  IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Snackbar, Alert, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LacDialog from '@/app/components/LacDialog';
import GestionNavBar from '@/app/components/GestionNavBar';
import { useMobileDetect } from '@/app/hooks/useMobileDetect';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import { LacDoc, LacEnriched } from "@/app/types/lacs.type"

export default function GestionLacs() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLac, setSelectedLac] = useState<LacDoc | LacEnriched | undefined>(undefined);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const { isMobile, isLoaded } = useMobileDetect();

  // Queries Convex
  // const lacs = useQuery(api.lacs.getAllLacs) || [];
  const lacs = useQuery(api.lacs.getAllLacs) || [];

  const handleOpenDialog = (mode: 'create' | 'edit', lac?: LacDoc | LacEnriched) => {
    setDialogMode(mode);
    setSelectedLac(lac);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLac(undefined);
  };

  const handleButtonClick2 = (e: React.MouseEvent, latitude: number, longitude: number, index: number) => {
    e.preventDefault();
    const googleMapsUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');

    const button = buttonRefs.current[index];

    // Exemples d'actions sur CE bouton spécifiquement
    button?.setAttribute("disabled", "true");
    button?.classList.add("active");

    // Ou via l'event directement (plus simple)
    const target = e.currentTarget as HTMLButtonElement;
    target.textContent = "Chargement...";
  };

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <>
      <GestionNavBar />
      <Container maxWidth="xl" sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
            Gestion des Lacs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              disabled={isReadOnlyConvex()}
              fullWidth={isMobile}
              size={isMobile ? "small" : "medium"}
            >
              Ajouter
            </Button>
          </Box>
        </Box>

        {/* Vue Desktop - Table */}
        {!isMobile && isLoaded && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Nom du lac</strong></TableCell>
                  <TableCell><strong>Région</strong></TableCell>
                  <TableCell><strong>Coordonnées</strong></TableCell>
                  <TableCell><strong>Superficie (ha)</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lacs.map((lac: LacDoc, index: number) => (
                  <TableRow key={lac._id} hover>
                    <TableCell>{lac.nomDuLac}</TableCell>
                    <TableCell>{lac.regionAdministrativeQuebec}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {lac.coordonnees.latitude.toFixed(4)}, {lac.coordonnees.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>{lac.superficie?.hectares || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        ref={(el) => { buttonRefs.current[index] = el; }}
                        onClick={(e) => handleButtonClick2(e, lac.coordonnees.latitude, lac.coordonnees.longitude, index)}
                      >
                        Voir sur OpenStreetMap
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', lac)}
                        disabled={isReadOnlyConvex()}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isReadOnlyConvex()}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Vue Mobile - Cartes (compact) */}
        {isMobile && isLoaded && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pb: 1 }}>
            {lacs.map((lac: LacDoc) => (
              <Card key={lac._id} sx={{ boxShadow: 0, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.6, px: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                    <Typography noWrap variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.25 }}>
                      {lac.nomDuLac}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.72rem' }}>{lac.regionAdministrativeQuebec}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.72rem' }}>
                        {lac.coordonnees.latitude.toFixed(3)}, {lac.coordonnees.longitude.toFixed(3)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.72rem' }}>
                        {lac.superficie?.hectares ? `${lac.superficie.hectares} ha` : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                      aria-label={`Éditer ${lac.nomDuLac}`}
                      size="small"
                      onClick={() => handleOpenDialog('edit', lac)}
                      disabled={isReadOnlyConvex()}
                      sx={{ width: 36, height: 36 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`Supprimer ${lac.nomDuLac}`}
                      size="small"
                      disabled={isReadOnlyConvex()}
                      sx={{ width: 36, height: 36, color: (theme) => theme.palette.error.main }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <LacDialog
          open={openDialog}
          onClose={handleCloseDialog}
          lac={selectedLac}
          mode={dialogMode}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container >
    </>
  )
}