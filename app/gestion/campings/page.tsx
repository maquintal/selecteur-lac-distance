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
import { CampingDoc } from '@/app/types/schema.types';
import CampingDialog from '@/app/components/CampingDialog';
import GestionNavBar from '@/app/components/GestionNavBar';
import { useMobileDetect } from '@/app/hooks/useMobileDetect';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatTemps } from '@/app/utils/utils.util';

export default function GestionCampings() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCamping, setSelectedCamping] = useState<CampingDoc | undefined>(undefined);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const { isMobile, isLoaded } = useMobileDetect();

  // Queries Convex
  const campings = useQuery(api.lacs.getAllCampings) || [];

  const handleOpenDialog = (mode: 'create' | 'edit', camping?: CampingDoc) => {
    setDialogMode(mode);
    setSelectedCamping(camping);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCamping(undefined);
  };

  /* const handleSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }; */

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
        <Box sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
              Gestion des campings
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

          {!isMobile && isLoaded && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Nom</strong></TableCell>
                    <TableCell><strong>Organisme</strong></TableCell>
                    <TableCell><strong>Région Administrative</strong></TableCell>
                    <TableCell><strong>Commodités</strong></TableCell>
                    <TableCell><strong>Distance & Temps</strong></TableCell>
                    <TableCell><strong>Coordonées Géographique</strong></TableCell>
                    {/* <TableCell><strong>map</strong></TableCell> */}
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campings.map((camping, index) => (
                    <TableRow key={camping._id} hover>
                      <TableCell>{camping.nom}</TableCell>
                      <TableCell>{camping.organisme}</TableCell>
                      <TableCell>{camping.regionAdministrative || 'N/A'}</TableCell>
                      <TableCell>
                        {camping.commodites.eau && 'Eau '}
                        {camping.commodites.electricite && 'Électricité'}
                      </TableCell>
                      <TableCell>
                        {camping.distanceMaisonCamping
                          ? `${camping.distanceMaisonCamping.kilometrage} km / ${formatTemps(camping.distanceMaisonCamping.temps)}`
                          : 'N/A'}
                      </TableCell>

                      <TableCell>
                        <IconButton
                          onClick={() => {
                            const lat = camping.coordonnees.latitude.toString().replace(',', '.');
                            const lng = camping.coordonnees.longitude.toString().replace(',', '.');
                            const coords = `${lat}, ${lng}`;
                            navigator.clipboard.writeText(coords);
                          }}
                          color="primary"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          ref={(el) => (buttonRefs.current[index] = el)}
                          onClick={(e) => handleButtonClick2(e, camping.coordonnees.latitude, camping.coordonnees.longitude, index)}
                        >
                          Voir sur OpenStreetMap
                        </Button>
                      </TableCell> */}
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', camping)}
                          disabled={isReadOnlyConvex()}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {isMobile && isLoaded && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {campings.map((camping) => (
                <Card key={camping._id} sx={{ boxShadow: 1, pb: 0 }}>
                  <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {camping.nom}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>Organisme</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>{camping.organisme}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>Region Administrative</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>{camping.regionAdministrative || 'N/A'}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>Commodités</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>
                          {camping.commodites.eau && 'Eau '}
                          {camping.commodites.electricite && 'Électricité'}
                        </Typography>
                      </Box>

                      {/* `typeEmplacement` removed; use `terrains` if needed */}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('edit', camping)}
                        disabled={isReadOnlyConvex()}
                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                      >
                        Éditer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        <CampingDialog
          open={openDialog}
          onClose={handleCloseDialog}
          camping={selectedCamping}
          mode={dialogMode}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}