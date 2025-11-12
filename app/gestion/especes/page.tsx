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
import { EspeceDoc } from '../../../app/types/schema.types';
import GestionNavBar from '../../../app/components/GestionNavBar';
import EspeceDialog from '@/app/components/EspeceDialog';
import { useReadOnlyMode } from '../../../app/hooks/useReadOnlyMode';

export default function GestionEspeces() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEspece, setSelectedEspece] = useState<EspeceDoc>();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const isReadOnly = useReadOnlyMode();

  // Queries Convex
  const especes = useQuery(api.lacs.getAllEspeces) || [];

  const handleOpenDialog = (mode: 'create' | 'edit', espece?: EspeceDoc) => {
    setDialogMode(mode);
    setSelectedEspece(espece);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEspece(undefined);
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
            Gestion des espèces
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
              Ajouter une espèce
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom commun</TableCell>
                <TableCell>Nom scientifique</TableCell>
                {/* <TableCell>Région administrative</TableCell> */}
                {/* <TableCell>Commodités</TableCell> */}
                {/* <TableCell>Actions</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {especes.map((espece) => (
                <TableRow key={espece._id}>
                  <TableCell>{espece.nomCommun}</TableCell>
                  {/* <TableCell>{espece.nomScientifique}</TableCell> */}
                  {/* <TableCell>{espece.regionAdministrative}</TableCell> */}
                  <TableCell>
                    <IconButton 
                      onClick={() => handleOpenDialog('edit', espece)}
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

      <EspeceDialog
        open={openDialog}
        onClose={handleCloseDialog}
        espece={selectedEspece}
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