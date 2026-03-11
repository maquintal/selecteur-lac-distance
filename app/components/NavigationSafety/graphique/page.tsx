'use client'

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ISOCategory } from '../NavigationSafety.types';
import GestionNavBar from '../../GestionNavBar';

interface DangerLevel {
  level: number;
  label: string;
  color: string;
  bg: string;
  border: string;
  isoCategory: ISOCategory;
}

// ─── Données (miroir de navigationSafetyAssessment.tsx) ───────────────────────

export const SUPERFICIE_THRESHOLDS = [
  { ha: 3, label: '3 ha', desc: 'Micro-lac' },
  { ha: 15, label: '15 ha', desc: 'Petit lac' },
  { ha: 40, label: '40 ha', desc: 'Lac modeste' },
  { ha: 80, label: '80 ha', desc: 'Lac ouvert' },
  { ha: 200, label: '200 ha', desc: 'Lac exposé' },
  { ha: 500, label: '500 ha', desc: 'Grand lac' },
  { ha: 1000, label: '> 500 ha', desc: 'Très grand' },
];

const WIND_SCENARIOS = [
  { beaufort: 1, windMs: 1.5, windKmh: '< 12 km/h', label: 'B1 — Calme', freqSaison: '~10%' },
  { beaufort: 2, windMs: 3, windKmh: '12–19 km/h', label: 'B2 — Légère brise', freqSaison: '~30%' },
  { beaufort: 3, windMs: 5, windKmh: '20–28 km/h', label: 'B3 — Petite brise', freqSaison: '~25%' },
  { beaufort: 4, windMs: 7, windKmh: '29–38 km/h', label: 'B4 — Jolie brise', freqSaison: '~20%' },
  { beaufort: 5, windMs: 10, windKmh: '39–49 km/h', label: 'B5 — Bonne brise', freqSaison: '~10%' },
  { beaufort: 6, windMs: 13, windKmh: '50–61 km/h', label: 'B6 — Vent frais', freqSaison: '~5%' },
  { beaufort: 7, windMs: 16, windKmh: '62–74 km/h', label: 'B7 — Grand frais', freqSaison: '~1%' },
  { beaufort: 8, windMs: 19, windKmh: '75–88 km/h', label: 'B8 — Coup de vent', freqSaison: '< 1%' },
];

const DANGER_LEVELS: DangerLevel[] = [
  { level: 1, label: 'Sécuritaire', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', isoCategory: 'D' },
  { level: 2, label: 'Bon', color: '#65a30d', bg: '#f7fee7', border: '#d9f99d', isoCategory: 'D' },
  { level: 3, label: 'Prudence', color: '#ca8a04', bg: '#fefce8', border: '#fef08a', isoCategory: 'D' },
  { level: 4, label: 'Limite Cat. D', color: '#d97706', bg: '#fffbeb', border: '#fde68a', isoCategory: 'D' },
  { level: 5, label: 'Risqué', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', isoCategory: 'C+' },
  { level: 6, label: 'Dangereux', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', isoCategory: 'C' },
  { level: 7, label: 'Très dangereux', color: '#7f1d1d', bg: '#450a0a', border: '#991b1b', isoCategory: 'B' },
];

// ─── Formule SMB fetch-limité ─────────────────────────────────────────────────

const estimateFetchKm = (ha: number): number => {
  const radiusM = Math.sqrt((ha * 10000) / Math.PI);
  return (radiusM * 2) / 1000;
};

const estimateWaveHeight = (fetchKm: number, windMs: number): number => {
  const fetchM = fetchKm * 1000;
  const Hs = 0.0163 * Math.sqrt(fetchM) * (windMs / 10);
  return parseFloat(Hs.toFixed(3));
};

const getDangerFromHs = (hs: number): DangerLevel => {
  if (hs < 0.05) return DANGER_LEVELS[0];
  if (hs < 0.10) return DANGER_LEVELS[1];
  if (hs < 0.18) return DANGER_LEVELS[2];
  if (hs < 0.25) return DANGER_LEVELS[3];
  if (hs < 0.35) return DANGER_LEVELS[4];
  if (hs < 0.50) return DANGER_LEVELS[5];
  return DANGER_LEVELS[6];
};

// ─── Données pour le graphique de courbes ────────────────────────────────────

const CHART_SUPERFICIES = [1, 3, 5, 10, 15, 25, 40, 60, 80, 120, 200, 300, 500, 800];

const curveData = CHART_SUPERFICIES.map(ha => {
  const fetch = estimateFetchKm(ha);
  const entry: Record<string, number | string> = { ha, label: `${ha} ha` };
  WIND_SCENARIOS.forEach(s => {
    entry[`B${s.beaufort}`] = estimateWaveHeight(fetch, s.windMs);
  });
  return entry;
});

// ─── Couleurs des courbes ─────────────────────────────────────────────────────

const CURVE_COLORS: Record<string, string> = {
  B1: '#94a3b8',
  B2: '#60a5fa',
  B3: '#34d399',
  B4: '#fbbf24',
  B5: '#f97316',
  B6: '#ef4444',
  B7: '#b91c1c',
  B8: '#7f1d1d',
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function NavigationSafetyChart() {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'curves'>('heatmap');
  const [hoveredCell, setHoveredCell] = useState<{ ha: number; beaufort: number } | null>(null);

  return (
    <><GestionNavBar />
      <div style={{
        fontFamily: "'DM Mono', 'Courier New', monospace",
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        minHeight: '100vh',
        padding: '2rem',
        color: '#e2e8f0',
      }}>

        {/* ── En-tête ── */}
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚓</span>
              <span style={{
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                color: '#7dd3fc',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Classification ISO 12217 — Navigation intérieure
              </span>
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: 0,
              color: '#f0f9ff',
              letterSpacing: '-0.02em',
            }}>
              Analyse de sécurité nautique
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
              Chaloupe 16 pi · Minn Kota Endura 30 lbs · Formule SMB fetch-limité
            </p>
          </div>

          {/* ── Onglets ── */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'heatmap', label: '⊞ Tableau croisé' },
              { id: 'curves', label: '∿ Courbes SMB' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'heatmap' | 'curves')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  border: activeTab === tab.id ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.15)',
                  background: activeTab === tab.id ? 'rgba(125, 211, 252, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === tab.id ? '#7dd3fc' : '#94a3b8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════
            ONGLET 1 — HEATMAP
        ════════════════════════════════════════════ */}
          {activeTab === 'heatmap' && (
            <div>
              {/* Légende des niveaux */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {DANGER_LEVELS.map(d => (
                  <div key={d.level} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.68rem',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: d.color }} />
                    <span style={{ color: '#cbd5e1' }}>N{d.level} — {d.label}</span>
                    <span style={{ color: '#64748b', fontSize: '0.6rem' }}>Cat.{d.isoCategory}</span>
                  </div>
                ))}
              </div>

              {/* Tableau heatmap */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.72rem' }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '0.6rem 0.75rem',
                        textAlign: 'left',
                        color: '#7dd3fc',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}>
                        Superficie ↓ / Beaufort →
                      </th>
                      {WIND_SCENARIOS.map(s => (
                        <th key={s.beaufort} style={{
                          padding: '0.6rem 0.5rem',
                          textAlign: 'center',
                          color: CURVE_COLORS[`B${s.beaufort}`],
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>
                          <div>B{s.beaufort}</div>
                          <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 400 }}>{s.windKmh}</div>
                          <div style={{ fontSize: '0.58rem', color: '#475569', fontWeight: 400 }}>{s.freqSaison}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SUPERFICIE_THRESHOLDS.map((sup, rowIdx) => (
                      <tr key={sup.ha} style={{
                        background: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      }}>
                        {/* En-tête ligne */}
                        <td style={{
                          padding: '0.5rem 0.75rem',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          whiteSpace: 'nowrap',
                        }}>
                          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{sup.label}</div>
                          <div style={{ color: '#64748b', fontSize: '0.62rem' }}>{sup.desc}</div>
                        </td>

                        {/* Cellules heatmap */}
                        {WIND_SCENARIOS.map(s => {
                          const fetch = estimateFetchKm(sup.ha);
                          const hs = estimateWaveHeight(fetch, s.windMs);
                          const danger = getDangerFromHs(hs);
                          const isHovered = hoveredCell?.ha === sup.ha && hoveredCell?.beaufort === s.beaufort;

                          return (
                            <td
                              key={s.beaufort}
                              onMouseEnter={() => setHoveredCell({ ha: sup.ha, beaufort: s.beaufort })}
                              onMouseLeave={() => setHoveredCell(null)}
                              style={{
                                padding: '0.4rem 0.5rem',
                                textAlign: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                borderLeft: '1px solid rgba(255,255,255,0.03)',
                                cursor: 'default',
                                transition: 'all 0.15s',
                                position: 'relative',
                              }}
                            >
                              <div style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                background: isHovered ? danger.color + '33' : danger.color + '18',
                                border: `1px solid ${isHovered ? danger.color : danger.color + '44'}`,
                                minWidth: 58,
                                transition: 'all 0.15s',
                                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                              }}>
                                <span style={{ color: danger.color, fontWeight: 700, fontSize: '0.72rem' }}>
                                  {hs.toFixed(2)} m
                                </span>
                                <span style={{ color: danger.color + 'cc', fontSize: '0.58rem', marginTop: 1 }}>
                                  N{danger.level}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seuils ISO */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#7dd3fc', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  Seuils ISO 12217
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { cat: 'Cat. D', hs: '≤ 0,30 m', wind: 'Beaufort ≤ 4', note: 'Votre embarcation — CONFORME', color: '#16a34a' },
                    { cat: 'Cat. D*', hs: '≤ 0,50 m', wind: 'Beaufort ≤ 4', note: 'Tolérance max Cat. D', color: '#ca8a04' },
                    { cat: 'Cat. C', hs: '≤ 2,00 m', wind: 'Beaufort ≤ 6', note: 'Dépasse votre embarcation', color: '#dc2626' },
                  ].map(iso => (
                    <div key={iso.cat} style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: iso.color + '15',
                      border: `1px solid ${iso.color}44`,
                    }}>
                      <div style={{ color: iso.color, fontWeight: 700, fontSize: '0.72rem' }}>{iso.cat}</div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.68rem', marginTop: 2 }}>Hs {iso.hs} · {iso.wind}</div>
                      <div style={{ color: '#64748b', fontSize: '0.62rem', marginTop: 2 }}>{iso.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
            ONGLET 2 — COURBES SMB
        ════════════════════════════════════════════ */}
          {activeTab === 'curves' && (
            <div>
              <div style={{ marginBottom: '1rem', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Hauteur de vague significative (Hs) calculée par la formule SMB fetch-limité selon la superficie du lac et le scénario de vent.
                La zone grisée indique la limite Cat. D (0,30 m) — au-delà, votre embarcation est hors de sa catégorie de conception.
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="ha"
                    scale="log"
                    domain={['auto', 'auto']}
                    type="number"
                    tickFormatter={(v) => `${v} ha`}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    tickFormatter={(v) => `${v} m`}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                    domain={[0, 1.2]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontFamily: 'inherit',
                    }}
                    labelFormatter={(v) => `Superficie : ${v} ha`}
                    formatter={(value: number, name: string) => [`${value.toFixed(3)} m`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '0.7rem', paddingTop: '1rem' }}
                  />

                  {/* Ligne seuil Cat. D */}
                  <ReferenceLine
                    y={0.30}
                    stroke="#dc2626"
                    strokeDasharray="6 3"
                    label={{ value: 'Limite Cat. D — 0,30 m', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                  />
                  {/* Ligne tolérance max Cat. D */}
                  <ReferenceLine
                    y={0.50}
                    stroke="#f97316"
                    strokeDasharray="4 4"
                    label={{ value: 'Max Cat. D — 0,50 m', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }}
                  />

                  {WIND_SCENARIOS.map(s => (
                    <Line
                      key={s.beaufort}
                      type="monotone"
                      dataKey={`B${s.beaufort}`}
                      stroke={CURVE_COLORS[`B${s.beaufort}`]}
                      strokeWidth={s.beaufort === 5 ? 2.5 : 1.5}
                      dot={false}
                      name={s.label}
                      strokeDasharray={s.beaufort === 5 ? undefined : s.beaufort >= 6 ? '4 2' : undefined}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Fréquences */}
              <div style={{
                marginTop: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.5rem',
              }}>
                {WIND_SCENARIOS.map(s => (
                  <div key={s.beaufort} style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${CURVE_COLORS[`B${s.beaufort}`]}33`,
                  }}>
                    <div style={{ color: CURVE_COLORS[`B${s.beaufort}`], fontWeight: 700, fontSize: '0.72rem' }}>
                      B{s.beaufort}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: 2 }}>{s.windKmh}</div>
                    <div style={{ color: '#64748b', fontSize: '0.62rem', marginTop: 2 }}>{s.freqSaison} des jours en saison</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.6rem',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}>
            <span>ISO 12217-3 — Stabilité et flottabilité des petits bâtiments</span>
            <span>Formule SMB (Sverdrup-Munk-Bretschneider) — fetch-limité lacs intérieurs</span>
            <span>Données météo : Environnement Canada — mai–octobre Québec</span>
          </div>
        </div>
      </div>
    </>
  );
}
