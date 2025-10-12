'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box,
  Container,
  Typography
} from '@mui/material';
import WaterIcon from '@mui/icons-material/Water';
import CampingIcon from '@mui/icons-material/Campaign';

export default function GestionNavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <AppBar position="static" color="default" sx={{ mb: 3 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h6" sx={{ mr: 4, display: { xs: 'none', md: 'flex' } }}>
            Gestion
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              href="/gestion"
              startIcon={<WaterIcon />}
              color={isActive('/gestion') ? 'primary' : 'inherit'}
              sx={{ 
                color: isActive('/gestion') ? 'primary.main' : 'text.primary',
                textDecoration: 'none'
              }}
            >
              Lacs
            </Button>

            <Button
              component={Link}
              href="/gestion/campings"
              startIcon={<CampingIcon />}
              color={isActive('/gestion/campings') ? 'primary' : 'inherit'}
              sx={{ 
                color: isActive('/gestion/campings') ? 'primary.main' : 'text.primary',
                textDecoration: 'none'
              }}
            >
              Campings
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}