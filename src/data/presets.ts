import { BaseMetrics, VozMetrics } from '../types/encaje';

export const SAMPLE_BASE_METRICS: BaseMetrics = {
  archivo: "pausa.aiff",
  bpm: 83.0,
  tonalidad: "C",
  modo: "mayor",
  confianza: 0.82,
  lufs: -25.0,
  pico_db: -10.0,
  bandas_rel_sub: {
    sub: 0.0,
    low: 7.2,
    low_mid: 14.3,
    presence: -16.6,
    air: -33.7
  }
};

export const SAMPLE_VOZ_METRICS_TOMA_001: VozMetrics = {
  archivo: "toma_001.aiff",
  frames_afinados_pct: 71.0,
  desviacion_media_cents: 34.0,
  desviacion_max_cents: 88.0,
  peores_notas: [
    { t: 12.4, nota: "G4", cents: -62 }
  ],
  histograma_cents: {
    "-100": 3,
    "-50": 9,
    "0": 41,
    "50": 14,
    "100": 4
  },
  desfase_onsets_ms: 22.0,
  crest_db: 11.4,
  lufs: -21.3,
  sibilancia_db: 4.1,
  cola_reverb_s: 0.09,
  ancho: 0.18
};

export const SAMPLE_VOZ_METRICS_TOMA_002: VozMetrics = {
  archivo: "toma_002.aiff",
  frames_afinados_pct: 44.0,
  desviacion_media_cents: 62.0,
  desviacion_max_cents: 112.0,
  peores_notas: [
    { t: 8.2, nota: "E4", cents: -78 },
    { t: 16.5, nota: "A4", cents: 94 }
  ],
  histograma_cents: {
    "-100": 18,
    "-50": 26,
    "0": 24,
    "50": 21,
    "100": 11
  },
  desfase_onsets_ms: 68.0,
  crest_db: 15.2,
  lufs: -26.4,
  sibilancia_db: 7.6,
  cola_reverb_s: 0.04,
  ancho: 0.09
};

export const DEFAULT_LETRA = `El humo sube lento contra el techo de chapa
pongo pausa al teléfono, la ciudad no me atrapa
la aguja toca el surco, no hay apuro esta noche
un acorde de Rhodes que disuelve el reproche.

Pausa en el ruido, pausa en el pecho
un compás sincopado bajo el mismo techo.
Nada que correr, nada que inventar
solo dejar que el bombo vuelva a respirar.`;

export const DEFAULT_INTENCION = `Hip-hop soul intimista y reflexivo. La voz debe flotar pesada en el pocket, cálida y sin brillo digital, como una confidencia en una habitación con poca luz.`;
