import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface SpectralVisualizerProps {
  isPlaying: boolean;
  mode: 'base_sola' | 'base_y_voz';
}

export const SpectralCollisionVisualizer: React.FC<SpectralVisualizerProps> = ({ isPlaying, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Fondo del analizador: Recessed surface (#0b0f12) con sutil retícula de frecuencias
      ctx.fillStyle = '#0b0f12';
      ctx.fillRect(0, 0, width, height);

      // Grilla de frecuencias y decibelios de hardware analógico
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Líneas horizontales de dB (-48dB, -36dB, -24dB, -12dB, 0dB)
      const dBLines = [0.15, 0.35, 0.55, 0.75, 0.9];
      dBLines.forEach((yPct) => {
        const y = height * yPct;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Líneas verticales de frecuencia (Sub 60Hz, Low 250Hz, Mid 1kHz, High-Mid 4kHz, Air 12kHz)
      const freqMarkers = [
        { pct: 0.1, label: '60Hz' },
        { pct: 0.28, label: '250Hz' },
        { pct: 0.52, label: '1kHz' },
        { pct: 0.75, label: '4kHz' },
        { pct: 0.92, label: '12kHz' }
      ];

      ctx.fillStyle = 'rgba(212, 196, 176, 0.3)';
      ctx.font = '9px "JetBrains Mono", monospace';
      freqMarkers.forEach((m) => {
        const x = width * m.pct;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.fillText(m.label, x + 4, 12);
      });

      // Obtener datos FFT reales si el audio está sonando
      const { baseData, vozData } = audioEngine.getByteFrequencyData();
      const points = 64;
      const sliceWidth = width / points;

      // 1. BASE: Silueta en cold steel-slate outline (#64748b)
      ctx.beginPath();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      for (let i = 0; i < points; i++) {
        const rawVal = isPlaying ? baseData[i * 2] || 0 : Math.sin(i * 0.2 + Date.now() * 0.002) * 8 + 18;
        const val = rawVal / 255;
        const x = i * sliceWidth;
        const y = height - (val * (height - 24)) - 6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. VOZ (solo si no es base sola): Gradiente ámbar translúcido (rgba(229, 169, 60, 0.2))
      if (mode === 'base_y_voz') {
        const vozGradient = ctx.createLinearGradient(0, 0, 0, height);
        vozGradient.addColorStop(0, 'rgba(229, 169, 60, 0.35)');
        vozGradient.addColorStop(1, 'rgba(229, 169, 60, 0.03)');

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i < points; i++) {
          const rawVal = isPlaying ? vozData[i * 2] || 0 : Math.cos(i * 0.25 + Date.now() * 0.003) * 10 + 22;
          const val = rawVal / 255;
          const x = i * sliceWidth;
          const y = height - (val * (height - 24)) - 6;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = vozGradient;
        ctx.fill();

        // Contorno de la voz
        ctx.beginPath();
        ctx.strokeStyle = '#e5a93c';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < points; i++) {
          const rawVal = isPlaying ? vozData[i * 2] || 0 : Math.cos(i * 0.25 + Date.now() * 0.003) * 10 + 22;
          const val = rawVal / 255;
          const x = i * sliceWidth;
          const y = height - (val * (height - 24)) - 6;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 3. Detección de colisión espectral en rango 300Hz - 2kHz (puntos 12 a 32)
        // Zona de solapamiento en ámbar saturado
        for (let i = 12; i < 30; i++) {
          const bVal = isPlaying ? baseData[i * 2] : 20;
          const vVal = isPlaying ? vozData[i * 2] : 24;
          if (bVal > 30 && vVal > 30) {
            const x = i * sliceWidth;
            const collisionY = height - Math.min(bVal, vVal) / 255 * (height - 24);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(x, collisionY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, mode]);

  return (
    <div className="relative w-full overflow-hidden border border-black/80 bg-[#0b0f12] rounded-md shadow-inner">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#141a1f]/60 text-[10px] font-mono tracking-wider uppercase text-[#9d8f7c]">
        <div className="flex items-center gap-3">
          <span>ESPECTRO COMPARATIVO: VOZ VS BASE</span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-2.5 h-1 bg-[#64748b]"></span>
            <span className="text-slate-400">BASE</span>
          </span>
          {mode === 'base_y_voz' && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="inline-block w-2.5 h-1 bg-[#e5a93c]"></span>
              <span className="text-[#ffc665]">VOZ (ÁMBAR)</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'base_y_voz' ? (
            <span className="text-[#ffc665] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c] animate-pulse"></span>
              ZONAS DE ENCAJE ACTIVAS
            </span>
          ) : (
            <span className="text-slate-500">MODO BASE SOLA (MONO)</span>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={130}
        className="w-full h-[120px] block"
      />
    </div>
  );
};
