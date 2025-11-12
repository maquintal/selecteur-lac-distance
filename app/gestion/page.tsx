'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Box, Container, Typography, Paper, Button,
  IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Snackbar, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LacDialog from '../components/LacDialog';
import GestionNavBar from '../components/GestionNavBar';
import { LacDoc, LacWithDetails } from '../types/schema.types';
import { useReadOnlyMode } from '../hooks/useReadOnlyMode';

export default function GestionLacs() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLac, setSelectedLac] = useState<LacDoc | LacWithDetails | undefined>(undefined);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const isReadOnly = useReadOnlyMode();

  // Queries Convex
  // const lacs = useQuery(api.lacs.getAllLacs) || [];
  const lacs = useQuery(api.lacs.getAllLacsSorted) || [];

  const handleOpenDialog = (mode: 'create' | 'edit', lac?: LacDoc | LacWithDetails) => {
    setDialogMode(mode);
    setSelectedLac(lac);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLac(undefined);
  };

  /* const handleDialogSuccess = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
    handleCloseDialog();
  }; */

  /* const handleDialogError = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }; */

  return (
    <>
      <GestionNavBar />
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Gestion des Lacs
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
              Ajouter un lac
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom du lac</TableCell>
                <TableCell>Région</TableCell>
                <TableCell>Coordonnées</TableCell>
                <TableCell>Superficie (ha)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lacs.map((lac: LacDoc) => (
                <TableRow key={lac._id}>
                  <TableCell>{lac.nomDuLac}</TableCell>
                  <TableCell>{lac.regionAdministrativeQuebec}</TableCell>
                  <TableCell>
                    {lac.coordonnees.latitude.toFixed(6)}, {lac.coordonnees.longitude.toFixed(6)}
                  </TableCell>
                  <TableCell>{lac.superficie?.hectares || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', lac)}
                      disabled={isReadOnly}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      disabled={isReadOnly}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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