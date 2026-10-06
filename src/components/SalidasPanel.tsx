import React, { useState } from 'react';
import {
  Copy,
  Check,
  AlertTriangle,
  Sliders,
  Clock,
  Layers,
  FileText,
  Volume2,
  Sparkles,
  Info
} from 'lucide-react';
import { EncajeResult } from '../types/encaje';

interface SalidasPanelProps {
  result: EncajeResult | null;
  rawMarkdownText?: string;
  sourceBadge?: string;
}

export const SalidasPanel: React.FC<SalidasPanelProps> = ({
  result,
  rawMarkdownText,
  sourceBadge
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'console' | 'markdown'>('console');

  if (!result) {
    return (
      <div className="bg-[#141a1f] border border-white/10 rounded-lg p-8 shadow-2xl flex flex-col items-center justify-center text-center min-h-[460px] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#0b0f12] border border-white/10 flex items-center justify-center text-[#ffc665] shadow-inner">
          <Sliders className="w-8 h-8 opacity-60" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-base font-mono font-semibold text-white uppercase tracking-wider">
            ESPERANDO SEÑAL DE ANÁLISIS
          </h3>
          <p className="text-xs text-[#9d8f7c] leading-relaxed">
            Presioná <strong className="text-[#ffc665] font-mono">[ ANALIZAR ]</strong> en el panel izquierdo para
            correr la medición de ENCAJE (AI Studio + DSP Afínómetro local).
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#d4c4b0]/70 pt-2">
          <span>Preset cargado: Pausa (83 BPM)</span>
          <span>·</span>
          <span>Regla dura: Cero números inventados</span>
        </div>
      </div>
    );
  }

  const { statusLine, medidoKeys, noMedidoKeys, bloqueA, bloqueB, bloqueC, jsonResumen, mode } = result;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonResumen, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(rawMarkdownText || result.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141a1f] border border-white/10 rounded-lg p-4 sm:p-5 shadow-2xl flex flex-col gap-5">
      {/* Salidas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#ffc665]">
            02 · SALIDAS DE ANÁLISIS
          </span>
          {sourceBadge && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0b0f12] rounded border border-white/10 text-[#54ea7e]">
              {sourceBadge}
            </span>
          )}
        </div>

        {/* Alternador de vista */}
        <div className="flex items-center gap-1 bg-[#0b0f12] p-1 rounded border border-black/80">
          <button
            onClick={() => setViewMode('console')}
            className={`px-3 py-1 text-[11px] font-mono rounded transition-colors ${
              viewMode === 'console'
                ? 'bg-[#1c242c] text-white font-medium border border-white/10'
                : 'text-[#9d8f7c] hover:text-white'
            }`}
          >
            Vista Consola
          </button>
          <button
            onClick={() => setViewMode('markdown')}
            className={`px-3 py-1 text-[11px] font-mono rounded transition-colors ${
              viewMode === 'markdown'
                ? 'bg-[#1c242c] text-white font-medium border border-white/10'
                : 'text-[#9d8f7c] hover:text-white'
            }`}
          >
            Markdown AI Studio
          </button>
        </div>
      </div>

      {/* PANEL DE ESTADO OBLIGATORIO */}
      <div className="bg-[#0b0f12] border border-black/90 rounded p-3 shadow-inner space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-[#9d8f7c]">
          <span>PANEL DE ESTADO DSP (OBLIGATORIO)</span>
          <span>{noMedidoKeys.length === 0 ? '✓ CONTRATO COMPLETO' : '! CON CAMPOS PENDIENTES'}</span>
        </div>
        <div className="text-xs font-mono break-all leading-relaxed">
          <span className="text-[#54ea7e] font-semibold">MEDIDO: </span>
          <span className="text-white">{medidoKeys.length > 0 ? medidoKeys.join(', ') : 'ninguna'}</span>
          <span className="text-[#9d8f7c]"> · </span>
          <span className="text-[#ef4444] font-semibold">NO MEDIDO: </span>
          <span className="text-[#ffb4ab]">{noMedidoKeys.length > 0 ? noMedidoKeys.join(', ') : 'ninguno'}</span>
        </div>
      </div>

      {viewMode === 'markdown' ? (
        /* VISTA MARKDOWN PURO SEGÚN SYSTEM INSTRUCTION */
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-[#1c242c] hover:bg-[#252b30] border border-white/10 rounded text-xs font-mono text-[#d4c4b0] flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#54ea7e]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Markdown'}</span>
            </button>
          </div>
          <pre className="p-4 bg-[#090f14] border border-black/80 rounded font-mono text-xs text-[#dde3ea] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px]">
            {rawMarkdownText || result.rawMarkdown}
          </pre>
        </div>
      ) : (
        /* VISTA MODULAR DE CONSOLA ANALÓGICA */
        <div className="space-y-6">
          {/* ── A · ESTRUCTURA DE LA BASE ── */}
          <section className="border border-white/10 bg-[#0e1419] rounded-lg p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffc665] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ffc665]" />
                <span>A · ESTRUCTURA DE LA BASE</span>
              </h4>
              <span className="text-[10px] font-mono text-[#54ea7e]">DERIVADA DE LA BASE</span>
            </div>

            {/* Tabla de Secciones */}
            <div className="overflow-x-auto border border-black/60 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141a1f] text-[#9d8f7c] border-b border-black/80 text-[10px] uppercase">
                    <th className="py-2 px-3">Sección</th>
                    <th className="py-2 px-3">Tiempo</th>
                    <th className="py-2 px-3">Qué suena</th>
                    <th className="py-2 px-3">Energía</th>
                    <th className="py-2 px-3">Función dramática</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/60">
                  {bloqueA.secciones.map((sec, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        {sec.seccion}
                      </td>
                      <td className="py-2.5 px-3 text-[#ffc665] whitespace-nowrap">
                        {sec.tiempo}
                      </td>
                      <td className="py-2.5 px-3 text-[#d4c4b0] max-w-[200px]">
                        {sec.queSuena}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-[#090f14] rounded-full overflow-hidden border border-black">
                            <div
                              className="h-full bg-gradient-to-r from-[#22c55e] to-[#ffc665]"
                              style={{ width: `${sec.energia * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#9d8f7c]">{sec.energia.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#d4c4b0]">
                        {sec.funcion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Puntos de Dirección de Base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
              <div className="bg-[#141a1f] p-2.5 rounded border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-[#ffc665] font-semibold block">
                  Primera entrada de voz
                </span>
                <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                  {bloqueA.primeraEntradaVoz}
                </p>
              </div>

              <div className="bg-[#141a1f] p-2.5 rounded border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-[#ffc665] font-semibold block">
                  Gancho (Hook)
                </span>
                <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                  {bloqueA.gancho}
                </p>
              </div>

              <div className="bg-[#141a1f] p-2.5 rounded border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-[#54ea7e] font-semibold block">
                  Cuarto del tema
                </span>
                <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                  {bloqueA.cuartoLoop}
                </p>
              </div>
            </div>
          </section>

          {/* ── B · ENCAJE DE LA VOZ ── */}
          <section className="border border-white/10 bg-[#0e1419] rounded-lg p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffc665] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#ffc665]" />
                <span>B · ENCAJE DE LA VOZ</span>
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${bloqueB.esMedido ? 'bg-[#54ea7e]/10 text-[#54ea7e]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                {bloqueB.esMedido ? 'MEDICIÓN DSP ACTIVA' : 'MODO BASE SOLA (NO MEDIDO)'}
              </span>
            </div>

            {!bloqueB.esMedido ? (
              /* En Base Sola: todo el bloque B se entrega con todo en NO MEDIDO y solo dirección de toma */
              <div className="space-y-3">
                <div className="bg-[#0b0f12] border border-black/80 rounded p-3 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 text-[#ef4444]">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">MÉTRICAS DE VOZ: NO MEDIDAS</span>
                  </div>
                  <p className="text-[#9d8f7c] leading-relaxed">
                    Al estar en <strong>Modo Base Sola</strong> sin pista de voz adjunta, afinación, tiempo y espacio permanecen en <code className="text-[#ffb4ab]">NO MEDIDO</code> para evitar inventar cifras. Se entregan únicamente recomendaciones cualitativas de toma.
                  </p>
                </div>

                {/* Dirección de toma cualitativa */}
                <div className="bg-[#141a1f] border border-white/5 rounded p-3 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffc665] block">
                    DIRECCIÓN DE LA PRÓXIMA TOMA (CÓMO CANTAR SOBRE ESTA BASE)
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#d4c4b0] font-mono">
                    {bloqueB.direccionProximaToma.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#ffc665]">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* En Base + Voz: Tres encajes MEDICIÓN -> BRECHA -> ACCIÓN + Dirección */
              <div className="space-y-4">
                {/* 1. AFINACIÓN */}
                <div className="bg-[#0b0f12] border border-black/80 rounded p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      1. AFINACIÓN
                    </span>
                    {bloqueB.afinacion?.debeVolverACantar && (
                      <span className="px-2 py-0.5 bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] text-[10px] font-mono font-bold rounded">
                        DISPARA RE-TOMA (SIN MAQUILLAR)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#9d8f7c] block">MEDICIÓN</span>
                      <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                        {bloqueB.afinacion?.medicion || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#fbbf24] block">BRECHA</span>
                      <p className="text-[#d4c4b0] text-[11px] leading-relaxed">
                        {bloqueB.afinacion?.brecha || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#ffc665] block">ACCIÓN</span>
                      <p className="text-white text-[11px] leading-relaxed font-semibold">
                        {bloqueB.afinacion?.accion || 'NO MEDIDO'}
                      </p>
                    </div>
                  </div>

                  {/* Parámetros de Auto-Tune Pro calculados */}
                  {bloqueB.afinacion?.retuneSpeed && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-[10px] text-[#9d8f7c]">AUTO-TUNE PRO INAUDIBLE:</span>
                      <span className="px-2 py-0.5 bg-[#141a1f] rounded border border-white/5 text-[#ffc665]">
                        Retune Speed: <strong>{bloqueB.afinacion.retuneSpeed} ms</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-[#141a1f] rounded border border-white/5 text-[#d4c4b0]">
                        Flex-Tune: <strong>{bloqueB.afinacion.flexTune}</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-[#141a1f] rounded border border-white/5 text-[#d4c4b0]">
                        Humanize: <strong>{bloqueB.afinacion.humanize}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. TIEMPO */}
                <div className="bg-[#0b0f12] border border-black/80 rounded p-3.5 space-y-2.5">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                    2. TIEMPO
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#9d8f7c] block">MEDICIÓN</span>
                      <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                        {bloqueB.tiempo?.medicion || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#fbbf24] block">BRECHA</span>
                      <p className="text-[#d4c4b0] text-[11px] leading-relaxed">
                        {bloqueB.tiempo?.brecha || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#ffc665] block">ACCIÓN</span>
                      <p className="text-white text-[11px] leading-relaxed font-semibold">
                        {bloqueB.tiempo?.accion || 'NO MEDIDO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. TONO Y ESPACIO */}
                <div className="bg-[#0b0f12] border border-black/80 rounded p-3.5 space-y-2.5">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                    3. TONO Y ESPACIO
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#9d8f7c] block">MEDICIÓN</span>
                      <p className="text-[#dde3ea] text-[11px] leading-relaxed">
                        {bloqueB.tonoEspacio?.medicion || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#fbbf24] block">BRECHA</span>
                      <p className="text-[#d4c4b0] text-[11px] leading-relaxed">
                        {bloqueB.tonoEspacio?.brecha || 'NO MEDIDO'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#ffc665] block">ACCIÓN</span>
                      <p className="text-white text-[11px] leading-relaxed whitespace-pre-line">
                        {bloqueB.tonoEspacio?.accion || 'NO MEDIDO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DIRECCIÓN DE LA PRÓXIMA TOMA */}
                <div className="bg-[#141a1f] border border-white/5 rounded p-3 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffc665] block">
                    DIRECCIÓN DE LA PRÓXIMA TOMA (5 INSTRUCCIONES ACCIONABLES)
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#d4c4b0] font-mono">
                    {bloqueB.direccionProximaToma.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#ffc665]">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* ── C · LETRA REESTRUCTURADA ── */}
          <section className="border border-white/10 bg-[#0e1419] rounded-lg p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#ffc665] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ffc665]" />
                <span>C · LETRA REESTRUCTURADA</span>
              </h4>
              <span className="text-[10px] font-mono text-[#9d8f7c]">
                Ajustada a la estructura de A
              </span>
            </div>

            <div className="space-y-3">
              {bloqueC.secciones.map((sec, idx) => (
                <div key={idx} className="bg-[#0b0f12] border border-black/80 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-1.5">
                    <span className="font-semibold text-white">{sec.seccion}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#9d8f7c]">{sec.compases} compases</span>
                      <span className="text-[#ffc665] italic">Entrega: {sec.entrega}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {sec.lineas.map((linea, lineIdx) => (
                      <div key={lineIdx} className="text-xs font-mono flex flex-wrap items-baseline justify-between gap-2 py-0.5">
                        <span className="text-[#dde3ea]">
                          &ldquo;{linea.texto}&rdquo;
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#9d8f7c]">
                          <span className="text-[#54ea7e] font-semibold">{linea.silabas} sílabas</span>
                          <span>·</span>
                          <span className="text-slate-400">{linea.acento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ▼ JSON RESUMEN (para el DSP) */}
          <section className="border border-white/10 bg-[#090f14] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9d8f7c]">
                ▼ JSON RESUMEN (PARA EL DSP)
              </span>
              <button
                onClick={handleCopyJson}
                className="px-2.5 py-1 bg-[#141a1f] hover:bg-[#1c242c] border border-white/10 rounded text-[11px] font-mono text-[#d4c4b0] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#54ea7e]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#05080a] border border-black rounded text-[11px] font-mono text-[#54ea7e] overflow-x-auto">
              {JSON.stringify(jsonResumen, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
};
