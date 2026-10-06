import React, { useState } from 'react';
import { Upload, FileCode, Music, Mic, ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react';
import { BaseMetrics, VozMetrics, AnalysisMode } from '../types/encaje';
import { audioEngine } from '../services/audioEngine';

interface EntradasPanelProps {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  baseMetrics: BaseMetrics;
  setBaseMetrics: (val: BaseMetrics) => void;
  vozMetrics: VozMetrics;
  setVozMetrics: (val: VozMetrics) => void;
  letra: string;
  setLetra: (val: string) => void;
  intencion: string;
  setIntencion: (val: string) => void;
  baseFileName: string;
  setBaseFileName: (val: string) => void;
  vozFileName: string;
  setVozFileName: (val: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const EntradasPanel: React.FC<EntradasPanelProps> = ({
  mode,
  setMode,
  baseMetrics,
  setBaseMetrics,
  vozMetrics,
  setVozMetrics,
  letra,
  setLetra,
  intencion,
  setIntencion,
  baseFileName,
  setBaseFileName,
  vozFileName,
  setVozFileName,
  onAnalyze,
  isAnalyzing
}) => {
  const [showBaseJson, setShowBaseJson] = useState(false);
  const [showVozJson, setShowVozJson] = useState(false);
  const [baseJsonText, setBaseJsonText] = useState(JSON.stringify(baseMetrics, null, 2));
  const [vozJsonText, setVozJsonText] = useState(JSON.stringify(vozMetrics, null, 2));
  const [baseJsonError, setBaseJsonError] = useState<string | null>(null);
  const [vozJsonError, setVozJsonError] = useState<string | null>(null);

  const handleBaseJsonChange = (text: string) => {
    setBaseJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setBaseMetrics(parsed);
      setBaseJsonError(null);
    } catch (err: unknown) {
      setBaseJsonError((err as Error).message);
    }
  };

  const handleVozJsonChange = (text: string) => {
    setVozJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setVozMetrics(parsed);
      setVozJsonError(null);
    } catch (err: unknown) {
      setVozJsonError((err as Error).message);
    }
  };

  const handleBaseAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseFileName(file.name);
      await audioEngine.loadBaseFile(file);
    }
  };

  const handleVozAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVozFileName(file.name);
      await audioEngine.loadVozFile(file);
    }
  };

  const handleBaseJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleBaseJsonChange(text);
    };
    reader.readAsText(file);
  };

  const handleVozJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleVozJsonChange(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#141a1f] border border-white/10 rounded-lg p-4 sm:p-5 shadow-2xl flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#ffc665]">
            01 · PANEL DE ENTRADAS
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#9d8f7c]">
          CONTRATO DSP v1.0
        </span>
      </div>

      {/* 1. SELECTOR DE MODO */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9d8f7c]">
          MODO DE ANÁLISIS
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0b0f12] border border-black/80 rounded-md">
          <button
            type="button"
            onClick={() => setMode('base_sola')}
            className={`py-2 px-3 text-xs font-mono font-medium rounded transition-all text-center flex items-center justify-center gap-2 ${
              mode === 'base_sola'
                ? 'bg-[#e5a93c] text-[#0b0f12] font-semibold shadow-[0_0_10px_rgba(229,169,60,0.3)]'
                : 'text-[#d4c4b0] hover:text-white hover:bg-[#1a2025]'
            }`}
          >
            <span>( ) Base sola</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('base_y_voz')}
            className={`py-2 px-3 text-xs font-mono font-medium rounded transition-all text-center flex items-center justify-center gap-2 ${
              mode === 'base_y_voz'
                ? 'bg-[#e5a93c] text-[#0b0f12] font-semibold shadow-[0_0_10px_rgba(229,169,60,0.3)]'
                : 'text-[#d4c4b0] hover:text-white hover:bg-[#1a2025]'
            }`}
          >
            <span>( ) Base + Voz</span>
          </button>
        </div>
        <p className="text-[11px] text-[#9d8f7c]">
          {mode === 'base_sola'
            ? 'Entrega el Bloque A (estructura) y marca todo el Bloque B como NO MEDIDO con dirección de toma.'
            : 'Mide acople completo de afinación (Auto-Tune), tiempo (onsets ms), sibilancia y espacio.'}
        </p>
      </div>

      {/* 2. ENTRADAS DE AUDIO: BASE Y VOZ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Entrada Base */}
        <div className="bg-[#0b0f12] border border-black/80 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9d8f7c]">
              [Base] Audio
            </span>
            <span className="text-[10px] font-mono text-[#54ea7e]">83 BPM · C</span>
          </div>

          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#ffc665] shrink-0" />
            <span className="text-xs font-mono text-white truncate flex-1" title={baseFileName}>
              {baseFileName}
            </span>
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-1.5 px-3 bg-[#1a2025] hover:bg-[#252b30] border border-white/5 rounded text-[11px] font-mono text-[#d4c4b0] hover:text-white cursor-pointer transition-colors">
            <Upload className="w-3 h-3 text-[#ffc665]" />
            <span>Subir audio base</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleBaseAudioUpload}
            />
          </label>
        </div>

        {/* Entrada Voz */}
        <div
          className={`bg-[#0b0f12] border border-black/80 rounded p-3 space-y-2 transition-opacity ${
            mode === 'base_sola' ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9d8f7c]">
              [Voz] Audio
            </span>
            <span className="text-[10px] font-mono text-[#ffc665]">
              {mode === 'base_sola' ? 'DESACTIVADO' : 'DSP ON'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#d97736] shrink-0" />
            <span className="text-xs font-mono text-white truncate flex-1" title={vozFileName}>
              {mode === 'base_sola' ? 'Sin voz (Modo Base Sola)' : vozFileName}
            </span>
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-1.5 px-3 bg-[#1a2025] hover:bg-[#252b30] border border-white/5 rounded text-[11px] font-mono text-[#d4c4b0] hover:text-white cursor-pointer transition-colors">
            <Upload className="w-3 h-3 text-[#d97736]" />
            <span>Subir toma vocal</span>
            <input
              type="file"
              accept="audio/*"
              disabled={mode === 'base_sola'}
              className="hidden"
              onChange={handleVozAudioUpload}
            />
          </label>
        </div>
      </div>

      {/* 3. ENTRADAS JSON DE MÉTRICAS DSP */}
      <div className="space-y-3">
        {/* metricas_base.json */}
        <div className="bg-[#0b0f12] border border-black/80 rounded overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#1a2025]/50 border-b border-black/60">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-[#54ea7e]" />
              <span className="text-xs font-mono font-medium text-white">
                metricas_base.json
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-[#9d8f7c] hover:text-white cursor-pointer flex items-center gap-1">
                <Upload className="w-2.5 h-2.5" />
                <span>Cargar</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleBaseJsonUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowBaseJson(!showBaseJson)}
                className="text-[10px] font-mono text-[#9d8f7c] hover:text-white p-1"
              >
                {showBaseJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Resumen rápido si está cerrado */}
          {!showBaseJson && (
            <div className="px-3 py-2 text-[11px] font-mono text-[#d4c4b0] flex flex-wrap gap-x-3 gap-y-1">
              <span>bpm: <strong className="text-white">{baseMetrics.bpm}</strong></span>
              <span>tono: <strong className="text-white">{baseMetrics.tonalidad} {baseMetrics.modo}</strong></span>
              <span>lufs: <strong className="text-white">{baseMetrics.lufs}</strong></span>
              <span>pico: <strong className="text-white">{baseMetrics.pico_db} dBFS</strong></span>
            </div>
          )}

          {/* Editor expandido */}
          {showBaseJson && (
            <div className="p-2 space-y-1">
              <textarea
                value={baseJsonText}
                onChange={(e) => handleBaseJsonChange(e.target.value)}
                rows={7}
                className="w-full bg-[#05080a] text-[#54ea7e] font-mono text-xs p-2 rounded border border-black focus:outline-none focus:border-[#e5a93c]"
                spellCheck={false}
              />
              {baseJsonError && (
                <div className="text-[10px] font-mono text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>JSON inválido: {baseJsonError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* metricas_voz.json */}
        <div
          className={`bg-[#0b0f12] border border-black/80 rounded overflow-hidden transition-opacity ${
            mode === 'base_sola' ? 'opacity-40' : ''
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-[#1a2025]/50 border-b border-black/60">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-[#ffc665]" />
              <span className="text-xs font-mono font-medium text-white">
                metricas_voz.json
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mode !== 'base_sola' && (
                <label className="text-[10px] font-mono text-[#9d8f7c] hover:text-white cursor-pointer flex items-center gap-1">
                  <Upload className="w-2.5 h-2.5" />
                  <span>Cargar</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleVozJsonUpload}
                  />
                </label>
              )}
              <button
                type="button"
                onClick={() => setShowVozJson(!showVozJson)}
                className="text-[10px] font-mono text-[#9d8f7c] hover:text-white p-1"
              >
                {showVozJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Resumen rápido si está cerrado */}
          {!showVozJson && (
            <div className="px-3 py-2 text-[11px] font-mono text-[#d4c4b0] flex flex-wrap gap-x-3 gap-y-1">
              {mode === 'base_sola' ? (
                <span className="text-slate-500 italic">No requerido en modo Base sola (Bloque B -&gt; NO MEDIDO)</span>
              ) : (
                <>
                  <span>afinados: <strong className="text-white">{vozMetrics.frames_afinados_pct}%</strong></span>
                  <span>desvío: <strong className="text-white">{vozMetrics.desviacion_media_cents}c</strong></span>
                  <span>desfase: <strong className="text-white">{vozMetrics.desfase_onsets_ms}ms</strong></span>
                  <span>lufs: <strong className="text-white">{vozMetrics.lufs}</strong></span>
                </>
              )}
            </div>
          )}

          {/* Editor expandido */}
          {showVozJson && (
            <div className="p-2 space-y-1">
              <textarea
                value={vozJsonText}
                disabled={mode === 'base_sola'}
                onChange={(e) => handleVozJsonChange(e.target.value)}
                rows={8}
                className="w-full bg-[#05080a] text-[#ffc665] font-mono text-xs p-2 rounded border border-black focus:outline-none focus:border-[#e5a93c]"
                spellCheck={false}
              />
              {vozJsonError && (
                <div className="text-[10px] font-mono text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>JSON inválido: {vozJsonError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. LETRA */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9d8f7c]">
            LETRA (TEXTO DE LA CANCIÓN)
          </label>
          <span className="text-[10px] font-mono text-[#9d8f7c]">
            {letra.split('\n').filter((l) => l.trim().length > 0).length} LÍNEAS
          </span>
        </div>
        <textarea
          value={letra}
          onChange={(e) => setLetra(e.target.value)}
          rows={6}
          placeholder="Pegar la letra completa aquí para estructurarla según las secciones de la base..."
          className="w-full bg-[#0b0f12] text-white font-mono text-xs p-3 rounded border border-black/80 focus:outline-none focus:border-[#e5a93c] placeholder:text-slate-600 resize-y leading-relaxed"
        />
      </div>

      {/* 5. INTENCIÓN */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#9d8f7c]">
          INTENCIÓN O MENSAJE (1-2 LÍNEAS)
        </label>
        <input
          type="text"
          value={intencion}
          onChange={(e) => setIntencion(e.target.value)}
          placeholder="Ej: Hip-hop soul intimista y oscuro, voz arrastrada detrás del beat sin brillo estridente."
          className="w-full bg-[#0b0f12] text-white font-mono text-xs px-3 py-2.5 rounded border border-black/80 focus:outline-none focus:border-[#e5a93c] placeholder:text-slate-600"
        />
      </div>

      {/* 6. BOTÓN [ ANALIZAR ] */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-3.5 px-6 rounded-md font-mono font-bold text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 active:translate-y-0.5 ${
            isAnalyzing
              ? 'bg-[#252b30] text-[#9d8f7c] cursor-wait'
              : 'bg-[#e5a93c] hover:bg-[#ffc665] text-[#0b0f12] shadow-[0_0_20px_rgba(229,169,60,0.35)]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-[#0b0f12] border-t-transparent rounded-full animate-spin" />
              <span>PROCESANDO ENCAJE...</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0b0f12]" />
              <span>[ ANALIZAR ]</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
