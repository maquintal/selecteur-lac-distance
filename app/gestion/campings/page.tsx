'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Box, Container, Typography, Paper, Button, 
  IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow,
  Snackbar, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import { CampingDoc } from '../../../app/types/schema.types';
import CampingDialog from '../../../app/components/CampingDialog';
import GestionNavBar from '../../../app/components/GestionNavBar';
import { useReadOnlyMode } from '../../../app/hooks/useReadOnlyMode';

export default function GestionCampings() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCamping, setSelectedCamping] = useState<CampingDoc | undefined>(undefined);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const isReadOnly = useReadOnlyMode();

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

  return (
    <>
      <GestionNavBar />
      <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Gestion des campings
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isReadOnly && (
              <Chip
                icon={<LockIcon />}
                label="Mode Read-Only (Production)"
                color="error"
                variant="outlined"
              />
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              disabled={isReadOnly}
            >
              Ajouter un camping
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Organisme</TableCell>
                <TableCell>Commodités</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campings.map((camping) => (
                <TableRow key={camping._id}>
                  <TableCell>{camping.nom}</TableCell>
                  <TableCell>{camping.organisme}</TableCell>
                  <TableCell>
                    {camping.commodites.eau && 'Eau '}
                    {camping.commodites.electricite && 'Électricité'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleOpenDialog('edit', camping)}
                      disabled={isReadOnly}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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