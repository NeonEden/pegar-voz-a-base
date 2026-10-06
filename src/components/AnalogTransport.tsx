import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, ShieldAlert } from 'lucide-react';
import { audioEngine, AudioEngineState } from '../services/audioEngine';

interface AnalogTransportProps {
  mode: 'base_sola' | 'base_y_voz';
}

export const AnalogTransport: React.FC<AnalogTransportProps> = ({ mode }) => {
  const [engineState, setEngineState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 30.0,
    baseVolume: 0.85,
    vozVolume: 0.9,
    baseSolo: false,
    vozSolo: false,
    phaseInverted: false,
    baseLoadedName: "pausa.aiff (DSP Preset)",
    vozLoadedName: "toma_001.aiff (DSP Preset)"
  });

  useEffect(() => {
    const unsub = audioEngine.subscribe(setEngineState);
    return unsub;
  }, []);

  const formatSMPTE = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-[#141a1f] border border-white/10 rounded-lg p-3 shadow-2xl space-y-3">
      {/* Top Header Row of the Transport Console */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/60">
        <div className="flex items-center gap-3">
          {/* SMPTE Timecode Display */}
          <div className="bg-[#090f14] px-3 py-1.5 rounded border border-black/80 shadow-inner flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-[#9d8f7c]">SMPTE</span>
            <span className="text-base font-mono font-bold text-[#ffc665] tracking-widest tabular-nums drop-shadow-[0_0_8px_rgba(229,169,60,0.4)]">
              {formatSMPTE(engineState.currentTime)}
            </span>
          </div>

          {/* Session parameters */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#d4c4b0]">
            <span className="px-2 py-0.5 bg-[#0b0f12] rounded border border-white/5">83.0 BPM</span>
            <span className="px-2 py-0.5 bg-[#0b0f12] rounded border border-white/5">C MAYOR</span>
            <span className="px-2 py-0.5 bg-[#0b0f12] rounded border border-white/5 text-[#54ea7e]">4/4 BOOM BAP</span>
          </div>
        </div>

        {/* Global Transport Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => audioEngine.seek(0)}
            title="Rebobinar al inicio"
            className="p-2 bg-[#1c242c] hover:bg-[#252b30] border border-white/10 rounded text-[#d4c4b0] hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => audioEngine.togglePlay()}
            className={`px-4 py-2 rounded font-semibold text-xs flex items-center gap-2 transition-all shadow-md active:translate-y-0.5 ${
              engineState.isPlaying
                ? 'bg-[#e5a93c] text-[#0b0f12] shadow-[0_0_12px_rgba(229,169,60,0.5)]'
                : 'bg-[#ffc665] text-[#432c00] hover:bg-[#fabc4d]'
            }`}
          >
            {engineState.isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSAR CONSOLA</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>AUDICIÓN DSP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrub bar */}
      <div className="w-full flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={engineState.duration}
          step="0.1"
          value={engineState.currentTime}
          onChange={(e) => audioEngine.seek(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#090f14] rounded-lg appearance-none cursor-pointer accent-[#e5a93c]"
        />
      </div>

      {/* Channel Strips Grid: CH 01 (Base) y CH 02 (Voz) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* CH 01: BASE */}
        <div className="bg-[#0b0f12] border border-black/80 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9d8f7c] font-semibold">CH 01</span>
              <span className="font-semibold text-white tracking-wide">PISTA BASE</span>
            </div>
            <span className="text-[10px] font-mono text-[#d4c4b0] truncate max-w-[140px]">
              {engineState.baseLoadedName}
            </span>
          </div>

          {/* VU Meter & Fader */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-[#9d8f7c]">
                <span>NIVEL RMS</span>
                <span>{(engineState.baseVolume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={engineState.baseVolume}
                onChange={(e) => audioEngine.setBaseVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#1a2025] rounded appearance-none cursor-pointer accent-[#22c55e]"
              />
            </div>

            {/* Segmented VU bar visual simulation */}
            <div className="flex items-center gap-0.5 h-5 px-1 bg-[#05080a] border border-black/90 rounded">
              {[...Array(12)].map((_, i) => {
                const active = engineState.isPlaying && i < Math.floor(engineState.baseVolume * 10);
                let color = 'bg-[#22c55e]';
                if (i >= 9) color = 'bg-[#fbbf24]';
                if (i >= 11) color = 'bg-[#ef4444]';
                return (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-[1px] transition-opacity ${
                      active ? `${color} opacity-100 shadow-[0_0_4px_currentColor]` : 'bg-[#1c242c] opacity-30'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Tactile buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => audioEngine.toggleBaseSolo()}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                engineState.baseSolo
                  ? 'bg-[#e5a93c] text-[#0b0f12] border-[#ffc665] shadow-[0_0_8px_rgba(229,169,60,0.4)]'
                  : 'bg-[#1c242c] text-[#d4c4b0] border-white/5 hover:border-white/20'
              }`}
            >
              SOLO
            </button>
            <span className="text-[10px] font-mono text-slate-500">Ref: -25.0 LUFS</span>
          </div>
        </div>

        {/* CH 02: VOZ */}
        <div className={`bg-[#0b0f12] border border-black/80 rounded p-2.5 space-y-2 ${mode === 'base_sola' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9d8f7c] font-semibold">CH 02</span>
              <span className="font-semibold text-white tracking-wide">PISTA VOZ</span>
            </div>
            <span className="text-[10px] font-mono text-[#ffc665] truncate max-w-[140px]">
              {mode === 'base_sola' ? '(Desactivado en Base Sola)' : engineState.vozLoadedName}
            </span>
          </div>

          {/* VU Meter & Fader */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-[#9d8f7c]">
                <span>NIVEL RMS</span>
                <span>{(engineState.vozVolume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={mode === 'base_sola'}
                value={engineState.vozVolume}
                onChange={(e) => audioEngine.setVozVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#1a2025] rounded appearance-none cursor-pointer accent-[#e5a93c]"
              />
            </div>

            {/* Segmented VU bar visual simulation */}
            <div className="flex items-center gap-0.5 h-5 px-1 bg-[#05080a] border border-black/90 rounded">
              {[...Array(12)].map((_, i) => {
                const active = engineState.isPlaying && mode === 'base_y_voz' && i < Math.floor(engineState.vozVolume * 11);
                let color = 'bg-[#22c55e]';
                if (i >= 8) color = 'bg-[#fbbf24]';
                if (i >= 11) color = 'bg-[#ef4444]';
                return (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-[1px] transition-opacity ${
                      active ? `${color} opacity-100 shadow-[0_0_4px_currentColor]` : 'bg-[#1c242c] opacity-30'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Tactile buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => audioEngine.toggleVozSolo()}
              disabled={mode === 'base_sola'}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-all ${
                engineState.vozSolo
                  ? 'bg-[#e5a93c] text-[#0b0f12] border-[#ffc665] shadow-[0_0_8px_rgba(229,169,60,0.4)]'
                  : 'bg-[#1c242c] text-[#d4c4b0] border-white/5 hover:border-white/20'
              }`}
            >
              SOLO
            </button>
            <button
              onClick={() => audioEngine.togglePhaseInvert()}
              disabled={mode === 'base_sola'}
              title="Invertir fase 180° para chequear cancelaciones destructivas"
              className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
                engineState.phaseInverted
                  ? 'bg-[#ef4444] text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-[#1c242c] text-[#9d8f7c] border-white/5 hover:border-white/20'
              }`}
            >
              Ø FASE {engineState.phaseInverted ? '180° INV' : '0°'}
            </button>
            <span className="text-[10px] font-mono text-amber-400/80">Ref: -19.6 LUFS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
