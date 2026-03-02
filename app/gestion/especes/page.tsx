'use client';

import { useState } from 'react';
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
import { EspeceDoc } from '@/app/types/schema.types';
import GestionNavBar from '@/app/components/GestionNavBar';
import EspeceDialog from '@/app/components/EspeceDialog';
import { useMobileDetect } from '@/app/hooks/useMobileDetect';
import { isReadOnlyConvex } from '@/convex/checkReadOnlyMode';

export default function GestionEspeces() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEspece, setSelectedEspece] = useState<EspeceDoc>();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  // const isReadOnly = useReadOnlyMode();

  const { isMobile, isLoaded } = useMobileDetect();

  // Queries Convex
  const especes = useQuery(api.especes.getAllEspeces) || [];

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
      <Container maxWidth="xl" sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
            Gestion des espèces
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
            {/* isReadOnly && (
              <Chip
                icon={<LockIcon />}
                label="Mode Read-Only"
                color="error"
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            ) */}
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
                  <TableCell><strong>Nom commun</strong></TableCell>
                  <TableCell><strong>Nom scientifique</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {especes.map((espece) => (
                  <TableRow key={espece._id} hover>
                    <TableCell>{espece.nomCommun}</TableCell>
                    <TableCell>{espece.nomScientifique || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog('edit', espece)}
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
            {especes.map((espece) => (
              <Card key={espece._id} sx={{ boxShadow: 1, pb: 0 }}>
                <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {espece.nomCommun}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>Nom scientifique</Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem', display: 'block' }}>{espece.nomScientifique || 'N/A'}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog('edit', espece)}
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