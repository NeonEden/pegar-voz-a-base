/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { AnalogTransport } from './components/AnalogTransport';
import { VisualMetronome } from './components/VisualMetronome';
import { SpectralCollisionVisualizer } from './components/SpectralCollisionVisualizer';
import { EntradasPanel } from './components/EntradasPanel';
import { SalidasPanel } from './components/SalidasPanel';
import {
  BaseMetrics,
  VozMetrics,
  AnalysisMode,
  EncajeResult
} from './types/encaje';
import {
  SAMPLE_BASE_METRICS,
  SAMPLE_VOZ_METRICS_TOMA_001,
  SAMPLE_VOZ_METRICS_TOMA_002,
  DEFAULT_LETRA,
  DEFAULT_INTENCION
} from './data/presets';
import { analyzeEncaje } from './services/dspEngine';
import { audioEngine, AudioEngineState } from './services/audioEngine';
import gearImage from './assets/images/analog_studio_gear_1791304821283.jpg';

export default function App() {
  const [activePreset, setActivePreset] = useState<'pausa_sola' | 'pausa_toma1' | 'pausa_toma2'>('pausa_toma1');
  const [mode, setMode] = useState<AnalysisMode>('base_y_voz');
  const [baseMetrics, setBaseMetrics] = useState<BaseMetrics>(SAMPLE_BASE_METRICS);
  const [vozMetrics, setVozMetrics] = useState<VozMetrics>(SAMPLE_VOZ_METRICS_TOMA_001);
  const [letra, setLetra] = useState<string>(DEFAULT_LETRA);
  const [intencion, setIntencion] = useState<string>(DEFAULT_INTENCION);
  const [baseFileName, setBaseFileName] = useState<string>('pausa.aiff');
  const [vozFileName, setVozFileName] = useState<string>('toma_001.aiff');

  const [result, setResult] = useState<EncajeResult | null>(null);
  const [rawMarkdownText, setRawMarkdownText] = useState<string>('');
  const [sourceBadge, setSourceBadge] = useState<string>('DSP + Gemini AI');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [enginePlaying, setEnginePlaying] = useState<boolean>(false);

  useEffect(() => {
    const unsub = audioEngine.subscribe((st: AudioEngineState) => {
      setEnginePlaying(st.isPlaying);
    });
    // Correr análisis inicial con el preset por defecto
    const initial = analyzeEncaje({
      mode: 'base_y_voz',
      baseMetrics: SAMPLE_BASE_METRICS,
      vozMetrics: SAMPLE_VOZ_METRICS_TOMA_001,
      letra: DEFAULT_LETRA,
      intencion: DEFAULT_INTENCION
    });
    setResult(initial);
    setRawMarkdownText(initial.rawMarkdown);

    return unsub;
  }, []);

  const handleSelectPreset = (presetId: 'pausa_sola' | 'pausa_toma1' | 'pausa_toma2') => {
    setActivePreset(presetId);
    if (presetId === 'pausa_sola') {
      setMode('base_sola');
      setBaseFileName('pausa.aiff');
      setVozFileName('ninguna (base sola)');
      setBaseMetrics(SAMPLE_BASE_METRICS);
      audioEngine.setBasePreset();
      const res = analyzeEncaje({
        mode: 'base_sola',
        baseMetrics: SAMPLE_BASE_METRICS,
        vozMetrics: null,
        letra,
        intencion
      });
      setResult(res);
      setRawMarkdownText(res.rawMarkdown);
      setSourceBadge('DSP Local (Base sola)');
    } else if (presetId === 'pausa_toma1') {
      setMode('base_y_voz');
      setBaseFileName('pausa.aiff');
      setVozFileName('toma_001.aiff');
      setBaseMetrics(SAMPLE_BASE_METRICS);
      setVozMetrics(SAMPLE_VOZ_METRICS_TOMA_001);
      audioEngine.setBasePreset();
      audioEngine.setVozPreset('toma_001.aiff (DSP Preset)');
      const res = analyzeEncaje({
        mode: 'base_y_voz',
        baseMetrics: SAMPLE_BASE_METRICS,
        vozMetrics: SAMPLE_VOZ_METRICS_TOMA_001,
        letra,
        intencion
      });
      setResult(res);
      setRawMarkdownText(res.rawMarkdown);
      setSourceBadge('DSP Local (Toma 001)');
    } else if (presetId === 'pausa_toma2') {
      setMode('base_y_voz');
      setBaseFileName('pausa.aiff');
      setVozFileName('toma_002.aiff');
      setBaseMetrics(SAMPLE_BASE_METRICS);
      setVozMetrics(SAMPLE_VOZ_METRICS_TOMA_002);
      audioEngine.setBasePreset();
      audioEngine.setVozPreset('toma_002.aiff (Desafinada)');
      const res = analyzeEncaje({
        mode: 'base_y_voz',
        baseMetrics: SAMPLE_BASE_METRICS,
        vozMetrics: SAMPLE_VOZ_METRICS_TOMA_002,
        letra,
        intencion
      });
      setResult(res);
      setRawMarkdownText(res.rawMarkdown);
      setSourceBadge('DSP Local (Toma 002 Crítica)');
    }
  };

  const handleReset = () => {
    handleSelectPreset('pausa_sola');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Intento llamar al endpoint del backend
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          baseMetrics,
          vozMetrics: mode === 'base_sola' ? null : vozMetrics,
          letra,
          intencion,
          baseAudioName: baseFileName,
          vozAudioName: vozFileName
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dspResult) {
          setResult(data.dspResult);
        }
        setRawMarkdownText(data.text || '');
        setSourceBadge(data.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'DSP Engine');
      } else {
        // Fallback local
        const local = analyzeEncaje({
          mode,
          baseMetrics,
          vozMetrics: mode === 'base_sola' ? null : vozMetrics,
          letra,
          intencion
        });
        setResult(local);
        setRawMarkdownText(local.rawMarkdown);
        setSourceBadge('DSP Local Engine');
      }
    } catch {
      // Fallback local garantizado
      const local = analyzeEncaje({
        mode,
        baseMetrics,
        vozMetrics: mode === 'base_sola' ? null : vozMetrics,
        letra,
        intencion
      });
      setResult(local);
      setRawMarkdownText(local.rawMarkdown);
      setSourceBadge('DSP Local Engine');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1419] text-[#dde3ea] flex flex-col selection:bg-[#e5a93c] selection:text-[#0b0f12]">
      {/* 1. Header con Top Bar Contract */}
      <StudioHeader
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
      />

      {/* Main Studio Console Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner de hardware de estudio analógico */}
        <div className="relative w-full h-32 sm:h-36 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-[#0b0f12]">
          <img
            src={gearImage}
            alt="Hardware de estudio analógico vintage con indicadores ámbar y tubos de vacío"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1419] via-[#0e1419]/80 to-transparent flex flex-col justify-center px-6 sm:px-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffc665]">
              SISTEMA DE ANÁLISIS DE VOZ VS BASE · TOMAS.WAV
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
              ¿QUÉ LE FALTA A LA VOZ PARA PEGARSE A LA BASE?
            </h2>
            <p className="text-xs text-[#9d8f7c] font-mono mt-1 max-w-2xl">
              AI Studio razona · el DSP local (afínómetro) mide · se enchufan por contrato JSON estricto. Cero números inventados.
            </p>
          </div>
        </div>

        {/* Módulo de Transporte de Hardware + Metrónomo Visual + Visualizador Espectral */}
        <div className="space-y-3">
          <AnalogTransport mode={mode} />
          <VisualMetronome
            bpm={baseMetrics.bpm}
            tonalidad={baseMetrics.tonalidad}
            modo={baseMetrics.modo}
            isPlaying={enginePlaying}
          />
          <SpectralCollisionVisualizer isPlaying={enginePlaying} mode={mode} />
        </div>

        {/* Cuadrícula Principal de 2 Columnas (ENTRADAS vs SALIDAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: ENTRADAS (5 columnas en desktop) */}
          <div className="lg:col-span-5 w-full">
            <EntradasPanel
              mode={mode}
              setMode={(newMode) => {
                setMode(newMode);
                if (newMode === 'base_sola') {
                  handleSelectPreset('pausa_sola');
                } else {
                  handleSelectPreset('pausa_toma1');
                }
              }}
              baseMetrics={baseMetrics}
              setBaseMetrics={setBaseMetrics}
              vozMetrics={vozMetrics}
              setVozMetrics={setVozMetrics}
              letra={letra}
              setLetra={setLetra}
              intencion={intencion}
              setIntencion={setIntencion}
              baseFileName={baseFileName}
              setBaseFileName={setBaseFileName}
              vozFileName={vozFileName}
              setVozFileName={setVozFileName}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* COLUMNA DERECHA: SALIDAS (7 columnas en desktop) */}
          <div className="lg:col-span-7 w-full">
            <SalidasPanel
              result={result}
              rawMarkdownText={rawMarkdownText}
              sourceBadge={sourceBadge}
            />
          </div>
        </div>
      </main>

      {/* Footer minimalista de estudio */}
      <footer className="border-t border-white/5 bg-[#090f14] py-4 px-6 text-center text-xs font-mono text-[#9d8f7c]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>ENCAJE · Motor DSP y Analista de Acople Vocal</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Firma: -19.6 LUFS</span>
            <span>·</span>
            <span>Picos: -2.4 dBFS</span>
            <span>·</span>
            <span>Frecuencia Nyquist 48kHz</span>
          </div>
          <span>Google AI Studio Build</span>
        </div>
      </footer>
    </div>
  );
}
