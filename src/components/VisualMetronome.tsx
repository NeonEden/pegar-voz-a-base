import React, { useEffect, useState } from 'react';
import { Clock, Activity, Zap, Play, Pause } from 'lucide-react';

interface VisualMetronomeProps {
  bpm: number;
  tonalidad?: string;
  modo?: string;
  isPlaying?: boolean;
}

export const VisualMetronome: React.FC<VisualMetronomeProps> = ({
  bpm = 83.0,
  tonalidad = 'C',
  modo = 'mayor',
  isPlaying = false
}) => {
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [metronomeActive, setMetronomeActive] = useState<boolean>(true);

  // Intervalo en segundos y milisegundos por pulso
  const safeBpm = Math.max(30, Math.min(300, bpm || 83.0));
  const beatDurationSec = 60 / safeBpm;
  const beatDurationMs = Math.round(beatDurationSec * 1000);
  const sixteenthNoteMs = Math.round((beatDurationSec / 4) * 1000);

  // Sincronización del contador de pulsos (1 - 2 - 3 - 4)
  useEffect(() => {
    if (!metronomeActive) return;

    const interval = setInterval(() => {
      setCurrentBeat((prev) => (prev % 4) + 1);
    }, beatDurationMs);

    return () => clearInterval(interval);
  }, [beatDurationMs, metronomeActive]);

  return (
    <div className="w-full bg-[#141a1f] border border-white/10 rounded-lg p-3 sm:p-4 shadow-xl space-y-3">
      {/* Header del Metrónomo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/60 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#ffc665]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            METRÓNOMO VISUAL DE ESTUDIO
          </span>
          <span className="text-[10px] font-mono text-[#9d8f7c]">
            · SINCRONIZADO CON METADATOS DE BASE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMetronomeActive(!metronomeActive)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all flex items-center gap-1.5 ${
              metronomeActive
                ? 'bg-[#1c242c] text-[#ffc665] border-[#e5a93c]/40'
                : 'bg-[#0b0f12] text-[#9d8f7c] border-white/5 hover:text-white'
            }`}
          >
            {metronomeActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{metronomeActive ? 'PULSO ACTIVO' : 'PAUSAR VISUAL'}</span>
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0b0f12] rounded border border-white/5 text-[#54ea7e]">
            LOCK 4/4
          </span>
        </div>
      </div>

      {/* Grid Central: Lámpara de Pulso + Péndulo Analógico + 4 Pasos de Compás */}
      <div
        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#0b0f12] border border-black/80 rounded-md p-3"
        style={
          {
            '--metronome-speed': `${beatDurationSec}s`,
            '--metronome-bar-speed': `${beatDurationSec * 2}s`
          } as React.CSSProperties
        }
      >
        {/* 1. Lámpara de Pulso Central (CSS Pulse) */}
        <div className="md:col-span-3 flex items-center gap-3 border-b md:border-b-0 md:border-r border-white/5 pb-2 md:pb-0 pr-0 md:pr-3">
          <div className="relative flex items-center justify-center">
            {/* Lámpara analógica que parpadea exactamente al BPM */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                metronomeActive
                  ? currentBeat === 1
                    ? 'bg-[#e5a93c] animate-metronome-pulse shadow-[0_0_18px_rgba(229,169,60,0.95)]'
                    : 'bg-[#22c55e] animate-metronome-pulse shadow-[0_0_12px_rgba(34,197,94,0.7)]'
                  : 'bg-[#1c242c] opacity-40'
              }`}
            >
              <Zap
                className={`w-5 h-5 ${
                  currentBeat === 1 ? 'text-[#0b0f12]' : 'text-[#0b0f12]'
                }`}
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#9d8f7c] block">
              PULSO VISUAL
            </span>
            <span className="text-sm font-mono font-bold text-white">
              {metronomeActive ? `BEAT ${currentBeat} / 4` : 'INACTIVO'}
            </span>
            <span className="text-[10px] font-mono text-[#ffc665] block">
              {currentBeat === 1 ? '★ ACENTO DOWNBEAT' : 'PULSO DE PASO'}
            </span>
          </div>
        </div>

        {/* 2. Barra de 4 Pasos de Compás (4/4) */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-1.5 px-0 md:px-2">
          <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-[#9d8f7c]">
            <span>1 (BOMBO)</span>
            <span>2 (CAJA)</span>
            <span>3 (BOMBO)</span>
            <span>4 (CAJA)</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((beatNum) => {
              const isActive = metronomeActive && currentBeat === beatNum;
              const isAccent = beatNum === 1;

              return (
                <div
                  key={beatNum}
                  className={`h-7 rounded border flex items-center justify-center font-mono font-bold text-xs transition-all ${
                    isActive
                      ? isAccent
                        ? 'bg-[#e5a93c] text-[#0b0f12] border-[#ffc665] shadow-[0_0_12px_rgba(229,169,60,0.8)] scale-[1.03]'
                        : 'bg-[#22c55e] text-[#0b0f12] border-[#54ea7e] shadow-[0_0_10px_rgba(34,197,94,0.7)] scale-[1.02]'
                      : 'bg-[#141a1f] text-[#9d8f7c] border-white/5 opacity-60'
                  }`}
                >
                  <span>{beatNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Telemetría de Temporización del Groove */}
        <div className="md:col-span-4 flex flex-col justify-center gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 pl-0 md:pl-3 text-xs font-mono">
          <div className="flex items-center justify-between text-[#d4c4b0]">
            <span className="text-[#9d8f7c]">TEMPO BASE:</span>
            <span className="text-[#ffc665] font-bold">{safeBpm.toFixed(1)} BPM</span>
          </div>
          <div className="flex items-center justify-between text-[#d4c4b0]">
            <span className="text-[#9d8f7c]">INTERVALO 1/4:</span>
            <span>{beatDurationMs} ms</span>
          </div>
          <div className="flex items-center justify-between text-[#d4c4b0]">
            <span className="text-[#9d8f7c]">GRID 1/16 SWING:</span>
            <span className="text-[#54ea7e]">{sixteenthNoteMs} ms</span>
          </div>
          <div className="flex items-center justify-between text-[#d4c4b0]">
            <span className="text-[#9d8f7c]">TONO DETECTADO:</span>
            <span>{tonalidad} {modo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
