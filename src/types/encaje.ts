/**
 * ENCAJE — Tipos de Contrato DSP y Analista de Voz vs Base
 */

export interface BandaRelSub {
  sub: number;
  low: number;
  low_mid: number;
  presence: number;
  air: number;
}

export interface NotaCritica {
  t: number;
  nota: string;
  cents: number;
}

export interface BaseMetrics {
  archivo: string;
  bpm: number;
  tonalidad: string;
  modo: string;
  confianza: number;
  lufs: number;
  pico_db: number;
  bandas_rel_sub?: BandaRelSub;
}

export interface VozMetrics {
  archivo: string;
  frames_afinados_pct: number;
  desviacion_media_cents: number;
  desviacion_max_cents: number;
  peores_notas: NotaCritica[];
  histograma_cents: Record<string, number>;
  desfase_onsets_ms: number;
  crest_db: number;
  lufs: number;
  sibilancia_db: number;
  cola_reverb_s: number;
  ancho: number;
}

export type AnalysisMode = 'base_sola' | 'base_y_voz';

export interface SeccionBase {
  seccion: string;
  tiempo: string;
  queSuena: string;
  energia: number;
  funcion: string;
}

export interface LineaLetra {
  texto: string;
  silabas: number;
  acento: string;
}

export interface SeccionLetra {
  seccion: string;
  compases: number;
  entrega: string;
  lineas: LineaLetra[];
}

export interface EncajeResult {
  mode: AnalysisMode;
  medidoKeys: string[];
  noMedidoKeys: string[];
  statusLine: string;
  rawMarkdown: string;
  bloqueA: {
    secciones: SeccionBase[];
    primeraEntradaVoz: string;
    gancho: string;
    cuartoLoop: string;
  };
  bloqueB: {
    esMedido: boolean;
    afinacion?: {
      medicion: string;
      brecha: string;
      accion: string;
      retuneSpeed?: number;
      flexTune?: number;
      humanize?: number;
      debeVolverACantar?: boolean;
    };
    tiempo?: {
      medicion: string;
      brecha: string;
      accion: string;
      nudgeMs?: number;
    };
    tonoEspacio?: {
      medicion: string;
      brecha: string;
      accion: string;
      deEsserDb?: number;
      compRatio?: string;
      reverbMatch?: string;
    };
    direccionProximaToma: string[];
  };
  bloqueC: {
    secciones: SeccionLetra[];
    observacion?: string;
  };
  jsonResumen: Record<string, unknown>;
}
