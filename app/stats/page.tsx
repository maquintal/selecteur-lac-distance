'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Droplet,
  TrendingUp,
  Map,
  Fish,
  Zap,
  Fuel,
  MapPin,
  Navigation
} from 'lucide-react';

interface LakeStats {
  global: {
    totalLacs: number;
    lacsAvecHebergement: number;
    lacsMoteurElectrique: number;
    lacsMoteurEssence: number;
    lacsSansMotorisation: number;
  };
  parRegion: Array<{
    region: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parSite: Array<{
    site: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parOrganisme: Array<{
    organisme: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parMotorisation: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parTypeEmbarcation: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  parAccessibilite: Array<{
    type: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  especesPopulaires: Array<{
    espece: string;
    nombreLacs: number;
    pourcentage: number;
  }>;
  distancesMoyennes: {
    globale: number;
    parSite: Array<{
      site: string;
      distanceMoyenne: number;
    }>;
  };
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = '#1976d2',
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  color?: string;
  subtitle?: string;
}) => (
  <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Icon size={40} color={color} />
        <Typography variant="h3" fontWeight="bold" color={color}>
          {value}
        </Typography>
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const ProgressBar = ({ 
  value, 
  max, 
  label, 
  color = '#1976d2' 
}: { 
  value: number; 
  max: number; 
  label: string; 
  color?: string 
}) => {
  const percentage = (value / max) * 100;
  
  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value} ({percentage.toFixed(1)}%)
        </Typography>
      </Box>
      <Box 
        sx={{ 
          width: '100%', 
          height: 8, 
          bgcolor: 'grey.200', 
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            width: `${percentage}%`, 
            height: '100%', 
            bgcolor: color,
            transition: 'width 0.3s ease'
          }} 
        />
      </Box>
    </Box>
  );
};

export default function LakeStatsDashboard() {
  const [stats, setStats] = useState<LakeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lakesStats')
      .then(res => {
        if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!stats) return null;

  const maxRegion = Math.max(...stats.parRegion.map(r => r.nombreLacs));
  const maxSite = Math.max(...stats.parSite.map(s => s.nombreLacs));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom mb={4}>
        📊 {`Statistiques des Plans d'Eau`}
      </Typography>

      {/* Statistiques Globales */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        <StatCard
          title="Total des Lacs"
          value={stats.global.totalLacs}
          icon={Droplet}
          color="#1976d2"
        />
        <StatCard
          title="Avec Hébergement"
          value={stats.global.lacsAvecHebergement}
          icon={MapPin}
          color="#2e7d32"
          subtitle={`${((stats.global.lacsAvecHebergement / stats.global.totalLacs) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Moteur Électrique"
          value={stats.global.lacsMoteurElectrique}
          icon={Zap}
          color="#ed6c02"
          subtitle={`${((stats.global.lacsMoteurElectrique / stats.global.totalLacs) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Moteur Essence"
          value={stats.global.lacsMoteurEssence}
          icon={Fuel}
          color="#9c27b0"
          subtitle={`${((stats.global.lacsMoteurEssence / stats.global.totalLacs) * 100).toFixed(1)}%`}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)'
          },
          gap: 3
        }}
      >
        {/* Par Région */}
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Map size={28} color="#1976d2" />
            <Typography variant="h5" fontWeight="bold">
              Par Région Administrative
            </Typography>
          </Box>
          {stats.parRegion.map((region, index) => (
            <ProgressBar
              key={index}
              label={region.region}
              value={region.nombreLacs}
              max={maxRegion}
              color="#1976d2"
            />
          ))}
        </Paper>

        {/* Par Site */}
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <MapPin size={28} color="#2e7d32" />
            <Typography variant="h5" fontWeight="bold">
              Par Site SEPAQ
            </Typography>
          </Box>
          {stats.parSite.map((site, index) => (
            <ProgressBar
              key={index}
              label={site.site}
              value={site.nombreLacs}
              max={maxSite}
              color="#2e7d32"
            />
          ))}
        </Paper>

        {/* Espèces Populaires */}
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Fish size={28} color="#0288d1" />
            <Typography variant="h5" fontWeight="bold">
              Top 10 Espèces de Poissons
            </Typography>
          </Box>
          <List dense>
            {stats.especesPopulaires.map((espece, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1" fontWeight={index < 3 ? 'bold' : 'regular'}>
                          {index + 1}. {espece.espece}
                        </Typography>
                        <Chip 
                          label={`${espece.nombreLacs} lacs`} 
                          size="small" 
                          color={index < 3 ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box 
                        component="span"
                        sx={{ 
                          display: 'block',
                          width: '100%', 
                          height: 4, 
                          bgcolor: 'grey.200', 
                          borderRadius: 2,
                          mt: 0.5,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          component="span"
                          sx={{ 
                            display: 'block',
                            width: `${espece.pourcentage}%`, 
                            height: '100%', 
                            bgcolor: index < 3 ? '#0288d1' : '#90caf9'
                          }} 
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < stats.especesPopulaires.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Accessibilité */}
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Navigation size={28} color="#ed6c02" />
            <Typography variant="h5" fontWeight="bold">
              {`Par Type d'Accessibilité`}
            </Typography>
          </Box>
          {stats.parAccessibilite.map((acces, index) => (
            <ProgressBar
              key={index}
              label={acces.type}
              value={acces.nombreLacs}
              max={stats.global.totalLacs}
              color="#ed6c02"
            />
          ))}

          <Divider sx={{ my: 3 }} />

          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingUp size={24} color="#9c27b0" />
            <Typography variant="h6" fontWeight="bold">
              Distance Moyenne
            </Typography>
          </Box>
          <Typography variant="h4" color="primary" fontWeight="bold" mb={2}>
            {stats.distancesMoyennes.globale} km
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {`Distance moyenne entre l'accueil et les lacs`}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Par site (plus proche au plus éloigné):
          </Typography>
          {stats.distancesMoyennes.parSite.slice(0, 5).map((site, index) => (
            <Box key={index} display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2">{site.site}</Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {site.distanceMoyenne} km
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    </Container>
  );
}