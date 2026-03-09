import { Box, Typography, Divider } from '@mui/material';
import { WAVE_SCALE, ISO_CATEGORY_SCALE } from './NavigationSafetyAssessment';
import { ISOCategory } from './NavigationSafetyAssessment';

const NavigationSafetyLegend = ({
  waveHeightM,
  isoCategory,
  waveScenarios,
}: {
  waveHeightM: number;
  isoCategory: ISOCategory;
  waveScenarios: {
    label: string;
    beaufort: number;
    waveHeightM: number;
    description: string;
  }[]
}) => {
  return (
    <Box sx={{ px: 0.6, pb: 0.6, pt: 0.5, borderTop: '1px solid', borderColor: 'grey.200' }}>

      {/* Échelle Hs */}
      <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
        Hauteur de vague (Hs) à Beaufort 5 — référence sécurité
      </Typography>
      {WAVE_SCALE.map(({ max, label }, i) => {
        const isActive = waveHeightM < max && (i === 0 || waveHeightM >= WAVE_SCALE[i - 1].max);
        return (
          <Box key={i} sx={{ display: 'flex', gap: 1, opacity: isActive ? 1 : 0.35 }}>
            <Typography variant="caption" sx={{ fontSize: '0.60rem', minWidth: 55, fontWeight: isActive ? 700 : 400 }}>
              {max === Infinity ? `> ${WAVE_SCALE[i - 1].max.toFixed(2)} m` : `< ${max.toFixed(2)} m`}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.60rem', fontWeight: isActive ? 700 : 400 }}>
              {label}
            </Typography>
          </Box>
        );
      })}

      <Divider sx={{ my: 0.5 }} />

      {/* Échelle ISO */}
      {/* <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
        Catégorie ISO 12217
      </Typography>
      {ISO_CATEGORY_SCALE.map(({ category, label, superficieMin, superficieMax }) => {
        const isActive = isoCategory === category;
        const superficieLabel = superficieMin === null
          ? '—'
          : superficieMax === null
            ? `> ${superficieMin} ha`
            : `${superficieMin}–${superficieMax} ha`;

        return (
          <Box key={category} sx={{ display: 'flex', gap: 1, opacity: isActive ? 1 : 0.4 }}>
            <Typography variant="caption" sx={{ minWidth: 30, fontWeight: isActive ? 700 : 400 }}>
              Cat. {category}
            </Typography>
            <Typography variant="caption" sx={{ minWidth: 60, fontWeight: isActive ? 700 : 400, color: 'grey.400' }}>
              {superficieLabel}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 400 }}>
              {label}
            </Typography>
          </Box>
        );
      })}

      <Divider sx={{ my: 0.5 }} /> */}

      {/* Scénarios de vent — nouveau bloc */}
      <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
        Vagues estimées selon conditions
      </Typography>
      {waveScenarios.map(({ label, beaufort, waveHeightM: hs, description }) => {
        const isReference = beaufort === 5;
        return (
          <Box key={label} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.60rem', minWidth: 55, fontWeight: isReference ? 700 : 400 }}>
              B{beaufort} — {hs.toFixed(2)} m
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.60rem', color: 'text.secondary', fontWeight: isReference ? 700 : 400 }}>
              {description}
            </Typography>
            {isReference && (
              <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'warning.main', fontWeight: 700 }}>
                ← réf.
              </Typography>
            )}
          </Box>
        );
      })}

      <Divider sx={{ my: 0.5 }} />
      <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'grey.400', fontStyle: 'italic' }}>
        Chaloupe 16 pi + Minn Kota Endura 30 lbs
      </Typography>

    </Box>
  );
};

export default NavigationSafetyLegend;