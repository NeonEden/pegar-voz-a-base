import React from 'react';
import { Sliders, Activity, Sparkles } from 'lucide-react';

interface StudioHeaderProps {
  activePreset: string;
  onSelectPreset: (presetId: 'pausa_sola' | 'pausa_toma1' | 'pausa_toma2') => void;
  onReset: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activePreset,
  onSelectPreset,
  onReset
}) => {
  return (
    <header className="border-b border-white/10 bg-[#0e1419]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5a93c] shadow-[0_0_8px_rgba(229,169,60,0.8)] animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              ENCAJE
              <span className="text-xs font-normal text-[#9d8f7c] tracking-wider uppercase hidden md:inline">
                · Analista de Voz vs Base
              </span>
            </h1>
          </div>
          <span className="text-xs text-[#9d8f7c] hidden lg:inline">· TOMAS.WAV STUDIO</span>
        </div>

        {/* Zone 2: Preset selectors (Interactive segmented buttons) */}
        <nav className="flex items-center gap-1.5 p-1 bg-[#141a1f] border border-white/5 rounded-md overflow-x-auto">
          <button
            onClick={() => onSelectPreset('pausa_sola')}
            className={`px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
              activePreset === 'pausa_sola'
                ? 'bg-[#e5a93c] text-[#0b0f12] font-semibold shadow-sm'
                : 'text-[#d4c4b0] hover:text-white hover:bg-white/5'
            }`}
          >
            Pausa (Base sola)
          </button>
          <button
            onClick={() => onSelectPreset('pausa_toma1')}
            className={`px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
              activePreset === 'pausa_toma1'
                ? 'bg-[#e5a93c] text-[#0b0f12] font-semibold shadow-sm'
                : 'text-[#d4c4b0] hover:text-white hover:bg-white/5'
            }`}
          >
            Pausa + Toma 001
          </button>
          <button
            onClick={() => onSelectPreset('pausa_toma2')}
            className={`px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors ${
              activePreset === 'pausa_toma2'
                ? 'bg-[#ef4444] text-white font-semibold shadow-sm'
                : 'text-[#d4c4b0] hover:text-white hover:bg-white/5'
            }`}
          >
            Toma 002 (Re-cantar)
          </button>
        </nav>

        {/* Zone 3: Primary console telemetry & action */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-[#9d8f7c]">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#54ea7e]" />
              FIRMA: -19.6 LUFS
            </span>
          </div>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-mono rounded border border-white/10 text-[#d4c4b0] hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Limpiar sesión
          </button>
        </div>
      </div>
    </header>
  );
};
