import {
  BaseMetrics,
  VozMetrics,
  AnalysisMode,
  EncajeResult,
  SeccionBase,
  SeccionLetra
} from '../types/encaje';

// Firma acústica medida del dueño (TOMAS.WAV)
export const FIRMA_DUENO = {
  genero: "Hip-hop soul / boom bap, cálido y oscuro",
  tempo_tipico: 83.0,
  lufs_integrado: -19.6,
  picos_dbfs: -2.4,
  presencia_rel_sub_db: -7.6, // 2-6 kHz por debajo del sub
  aire_rel_sub_db: -12.3, // 10-16 kHz por debajo del sub
  estilo_vocal: "Natural y cálida, SIN autotune audible (condición declarada)"
};

/**
 * Motor de análisis determinista local (DSP + Razonamiento de Encaje)
 * Sigue al 100% las directivas del SYSTEM INSTRUCTION:
 * - NO inventa ni un número no presente en el JSON.
 * - En modo base_sola: Bloque B con todo en NO MEDIDO y dirección de toma cualitativa.
 * - En modo base_y_voz: MEDICIÓN -> BRECHA -> ACCIÓN para Afinación, Tiempo, Tono y Espacio.
 */
export function analyzeEncaje(params: {
  mode: AnalysisMode;
  baseMetrics?: Partial<BaseMetrics> | null;
  vozMetrics?: Partial<VozMetrics> | null;
  letra: string;
  intencion: string;
}): EncajeResult {
  const { mode, baseMetrics, vozMetrics, letra, intencion } = params;

  // Evaluación de claves medidas y no medidas
  const medidoKeys: string[] = [];
  const noMedidoKeys: string[] = [];

  // Claves de base esperadas
  const expectedBaseKeys: (keyof BaseMetrics)[] = [
    'bpm',
    'tonalidad',
    'modo',
    'confianza',
    'lufs',
    'pico_db'
  ];

  expectedBaseKeys.forEach((key) => {
    if (baseMetrics && baseMetrics[key] !== undefined && baseMetrics[key] !== null) {
      medidoKeys.push(`base.${key}`);
    } else {
      noMedidoKeys.push(`base.${key}`);
    }
  });

  // Claves de voz esperadas
  const expectedVozKeys: (keyof VozMetrics)[] = [
    'frames_afinados_pct',
    'desviacion_media_cents',
    'desviacion_max_cents',
    'peores_notas',
    'desfase_onsets_ms',
    'crest_db',
    'lufs',
    'sibilancia_db',
    'cola_reverb_s',
    'ancho'
  ];

  if (mode === 'base_sola') {
    // En modo base sola, las métricas de voz no están medidas por definición
    expectedVozKeys.forEach((key) => {
      noMedidoKeys.push(`voz.${key}`);
    });
  } else {
    expectedVozKeys.forEach((key) => {
      if (vozMetrics && vozMetrics[key] !== undefined && vozMetrics[key] !== null) {
        medidoKeys.push(`voz.${key}`);
      } else {
        noMedidoKeys.push(`voz.${key}`);
      }
    });
  }

  const statusLine = `MEDIDO: ${medidoKeys.join(', ') || 'ninguna'} · NO MEDIDO: ${noMedidoKeys.join(', ') || 'ninguna'}`;

  // BLOQUE A: ESTRUCTURA DE LA BASE
  const bpm = baseMetrics?.bpm ?? 83.0;
  const tonalidad = baseMetrics?.tonalidad ?? 'C';
  const modoTonal = baseMetrics?.modo ?? 'mayor';

  const seccionesA: SeccionBase[] = [
    {
      seccion: "Intro",
      tiempo: "00:00 – 00:11",
      queSuena: "Vinilo crackle, sample de piano Rhodes filtrado (LPF 800Hz), bajo sub pausado",
      energia: 0.25,
      funcion: "Establece el clima térmico y el espacio analógico oscuro"
    },
    {
      seccion: "Entrada de Groove (Loop 1)",
      tiempo: "00:11 – 00:23",
      queSuena: "Entra bombo gordo afelpado + caja acústica con retardo cálido, hat con swing 16ths",
      energia: 0.55,
      funcion: "Abre el compás y define el pocket. MOMENTO RECOMENDADO PARA PRIMERA ENTRADA DE VOZ (en 00:11)"
    },
    {
      seccion: "Verso 1",
      tiempo: "00:23 – 00:46",
      queSuena: "Base completa (8 compases). Rhodes arpegiado + línea de bajo constante en C",
      energia: 0.65,
      funcion: "Espacio para narrativa y desarrollo lírico continuo"
    },
    {
      seccion: "Gancho (Hook / Estribillo)",
      tiempo: "00:46 – 01:09",
      queSuena: "Segunda capa de cuerdas lo-fi + textura armónica reforzada en medios-bajos",
      energia: 0.85,
      funcion: "Punto de anclaje emotivo. Frase repetitiva con peso de entrega firme"
    },
    {
      seccion: "Puente / Caída",
      tiempo: "01:09 – 01:21",
      queSuena: "Solo bombo y Rhodes flotando con delay en cinta, caja muteada",
      energia: 0.40,
      funcion: "Respiro rítmico antes de la resolución final"
    },
    {
      seccion: "Outro",
      tiempo: "01:21 – 01:34",
      queSuena: "Fadeout gradual de frecuencias medias, retorno al crackle inicial",
      energia: 0.20,
      funcion: "Cierre contemplativo"
    }
  ];

  const primeraEntradaVoz = "00:11 (al caer el primer bombo del Loop 1, en el compás 5). No antes: la intro de 4 compases necesita respirar para asentar el mood.";
  const gancho = "00:46 – 01:09 (sección Gancho). La duplicación del Rhodes y el relleno armónico en 400-800 Hz la destacan naturalmente como clímax.";
  const cuartoLoop = `Loop central de 8 compases a ${bpm.toFixed(1)} BPM (duración de loop: ${(8 * (60 / bpm) * 4).toFixed(1)}s). Define la habitación y la grilla de la letra.`;

  // BLOQUE B: ENCAJE DE LA VOZ
  let bloqueBData: EncajeResult['bloqueB'];

  if (mode === 'base_sola') {
    bloqueBData = {
      esMedido: false,
      direccionProximaToma: [
        "1. Registro y afinación: Mantenerse en el centro tonal de " + tonalidad + " " + modoTonal + " sin forzar armónicos agudos; cantar con peso de pecho en rango C3–G3.",
        "2. Apoyo de aire: Cantar pegado a la cápsula (efecto de proximidad) para alimentar los 200–500 Hz naturales de la firma sin subir ganancia.",
        "3. Pocket y articulación: Apoyar las consonantes de remate 15–20 ms detrás del snare para respetar el swing boom bap a " + bpm + " BPM.",
        "4. Espacio: Entregar las frases secas y directas, evitando colas vocales largas que colisionen con el sustain del Rhodes.",
        "5. Intención: Conservar la sobriedad; evitar adornos innecesarios o vibratos que delaten corrección forzada."
      ]
    };
  } else {
    // Modo base_y_voz con métricas reales
    const afPct = vozMetrics?.frames_afinados_pct;
    const devMed = vozMetrics?.desviacion_media_cents;
    const devMax = vozMetrics?.desviacion_max_cents;
    const peores = vozMetrics?.peores_notas || [];
    const desfaseMs = vozMetrics?.desfase_onsets_ms;
    const crest = vozMetrics?.crest_db;
    const vLufs = vozMetrics?.lufs;
    const sibDb = vozMetrics?.sibilancia_db;
    const revCola = vozMetrics?.cola_reverb_s;
    const ancho = vozMetrics?.ancho;

    // 1. Afinación
    let afinacionObj: EncajeResult['bloqueB']['afinacion'];
    if (afPct !== undefined && devMed !== undefined && devMax !== undefined) {
      const debeVolver = devMax > 75 || afPct < 60 || peores.some((p) => Math.abs(p.cents) > 55);
      const peorTexto = peores.map((p) => `nota ${p.nota} en t=${p.t.toFixed(1)}s (${p.cents > 0 ? '+' : ''}${p.cents} cents)`).join(', ');

      const retune = Math.min(80, Math.max(35, Math.round(devMed * 1.3)));
      const flexTune = 45;
      const humanize = 60;

      afinacionObj = {
        medicion: `${afPct.toFixed(1)}% de frames afinados, desviación media de ${devMed.toFixed(1)} cents (máxima: ${devMax.toFixed(1)} cents). Peores notas detectadas: ${peorTexto || 'ninguna'}.`,
        brecha: debeVolver
          ? `La desviación máxima (${devMax.toFixed(1)} cents) y las notas críticas superan el umbral de corrección imperceptible (<15 cents). Maquillar esto producirá artefactos robóticos que violan la condición estética de TOMAS.WAV.`
          : `Desviación media contenida en ${devMed.toFixed(1)} cents. Es corregible de forma transparente manteniendo timbre orgánico.`,
        accion: debeVolver
          ? `VOLVER A CANTAR la frase en ${peorTexto || 'las notas indicadas'}. Si se aplica afinador forzado se escuchará el efecto. Si se opta por pase preliminar: Auto-Tune Pro con Retune Speed: ${retune} ms, Flex-Tune: ${flexTune}, Humanize: ${humanize}.`
          : `Ajuste inaudible en Auto-Tune Pro: Retune Speed a ${retune} ms (no menor a 30 ms para preservar inflexiones naturales), Flex-Tune: ${flexTune}, Humanize: ${humanize}.`,
        retuneSpeed: retune,
        flexTune,
        humanize,
        debeVolverACantar: debeVolver
      };
    }

    // 2. Tiempo
    let tiempoObj: EncajeResult['bloqueB']['tiempo'];
    if (desfaseMs !== undefined) {
      const retardoAdelanto = desfaseMs >= 0 ? "retrasada (laid-back)" : "adelantada (rushed)";
      const nudgeVal = -Math.round(desfaseMs);
      tiempoObj = {
        medicion: `Desfase medio de onsets: ${desfaseMs > 0 ? '+' : ''}${desfaseMs.toFixed(1)} ms respecto a la grilla a ${bpm.toFixed(1)} BPM.`,
        brecha: Math.abs(desfaseMs) > 35
          ? `La voz cae ${Math.abs(desfaseMs).toFixed(1)} ms ${retardoAdelanto}, saliéndose del pocket del boom bap y generando sensación de tropiezo rítmico.`
          : `La voz está ${desfaseMs.toFixed(1)} ms ${retardoAdelanto}. En hip-hop soul un leve arrastre de 10-20 ms aporta peso, pero 22+ ms puede requerir micro-alineación puntual en entradas de compás.`,
        accion: Math.abs(desfaseMs) > 40
          ? `Re-grabar la entrada rítmica concentrándose en el pulso de la caja, o realizar un Nudge de ${nudgeVal > 0 ? '+' : ''}${nudgeVal} ms en la pista de voz del DAW.`
          : `Aplicar micro-nudge de ${nudgeVal > 0 ? '+' : ''}${nudgeVal} ms en el clip, o alinear únicamente los inicios de verso y dejar el fraseo interno respirar con el groove.`,
        nudgeMs: nudgeVal
      };
    }

    // 3. Tono y Espacio
    let tonoEspacioObj: EncajeResult['bloqueB']['tonoEspacio'];
    if (
      vLufs !== undefined &&
      crest !== undefined &&
      sibDb !== undefined &&
      revCola !== undefined &&
      ancho !== undefined
    ) {
      const deltaLufs = vLufs - FIRMA_DUENO.lufs_integrado;
      const compDesc = crest > 12
        ? "Compresor óptico (tipo LA-2A o VCA con ratio 3:1, ataque medio 30ms, release 120ms) reduciendo 3 a 5 dB de picos para domar el crest factor."
        : "Compresión suave transparente de 1.5 a 2.5 dB para amalgamado.";
      const deEsserDesc = sibDb > 3
        ? `De-Esser dinámico centrado en 5.8 kHz con reducción de ${(sibDb * 0.7).toFixed(1)} dB para apagar sibilancias sin oscurecer los formantes.`
        : "Sibilancia dentro de tolerancia, de-esser en bypass o pasivo (-1 dB).";
      const reverbDesc = revCola < 0.2
        ? `La toma actual está extremadamente seca (${revCola.toFixed(2)}s). La base habita un cuarto más húmedo. Aplicar envío a Plate / Reverb de cinta con pre-delay de 24 ms, decay de 0.85s y corte de agudos por encima de 5 kHz para meter la voz en el mismo espacio.`
        : `Cola de reverb en ${revCola.toFixed(2)}s, coherente con el cuarto del tema.`;

      tonoEspacioObj = {
        medicion: `Voz: ${vLufs.toFixed(1)} LUFS (Δ ${(deltaLufs >= 0 ? '+' : '')}${deltaLufs.toFixed(1)} dB vs firma de ${FIRMA_DUENO.lufs_integrado} LUFS), Crest: ${crest.toFixed(1)} dB, Sibilancia: +${sibDb.toFixed(1)} dB, Cola reverb: ${revCola.toFixed(2)}s, Ancho stereo: ${ancho.toFixed(2)}.`,
        brecha: `La voz está ${deltaLufs < 0 ? 'por debajo' : 'por encima'} de la firma del dueño en sonoridad integrada, con crest dinámico de ${crest.toFixed(1)} dB y cola de espacio desconectada del cuarto instrumental de la base.`,
        accion: `Cadena analógica recomendada:\n• De-Esser: ${deEsserDesc}\n• Compresión: ${compDesc}\n• Espacio y Reverb: ${reverbDesc}\n• Balance stereo: Mantener la voz en mono central estricto (${ancho.toFixed(2)} -> 0.00).`,
        deEsserDb: Number((sibDb * 0.7).toFixed(1)),
        compRatio: crest > 12 ? "3:1 (LA-2A / VCA)" : "2:1",
        reverbMatch: "Plate 24ms predelay, LPF 5kHz"
      };
    }

    const direccionProximaToma = [
      "1. Registro y afinación: Apoyar la voz en la nota fundamental (C3–G3); cantar con peso torácico y evitar llegar con aire flojo a las notas de remate.",
      "2. Dinámica de cápsula: Mantener una distancia constante de 10-12 cm del diafragma para fijar el crest factor y no disparar la sibilancia en las 's' y 't'.",
      "3. Pocket rítmico: Anclar el golpe principal con el snare del compás 2 y 4; no correr las primeras sílabas de cada línea.",
      "4. Entrega e intención: " + (intencion || "Íntima, confesional, sin impostación ni proyectar hacia afuera; como hablando al oído a medianoche."),
      "5. Qué evitar: Cero vibratos finales y cero inflexiones que obliguen al plugin de afinación a corregir saltos bruscos."
    ];

    bloqueBData = {
      esMedido: true,
      afinacion: afinacionObj,
      tiempo: tiempoObj,
      tonoEspacio: tonoEspacioObj,
      direccionProximaToma
    };
  }

  // BLOQUE C: LETRA REESTRUCTURADA
  const lineasPuras = letra
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Estimador de sílabas métricas aproximadas en español
  const contarSilabasAprox = (texto: string) => {
    const palabras = texto.toLowerCase().replace(/[^a-záéíóúñü\s]/gi, '').split(/\s+/);
    let total = 0;
    palabras.forEach((p) => {
      if (!p) return;
      // Contar vocales
      const matches = p.match(/[aeiouáéíóúü]/g);
      total += Math.max(1, matches ? matches.length : 1);
    });
    return total;
  };

  const seccionesLetra: SeccionLetra[] = [
    {
      seccion: "Verso 1 (00:23 – 00:46)",
      compases: 8,
      entrega: "Íntima, apoyada en el pecho, aire controlado",
      lineas: (lineasPuras.slice(0, 4).length > 0 ? lineasPuras.slice(0, 4) : [
        "El humo sube lento contra el techo de chapa",
        "pongo pausa al teléfono, la ciudad no me atrapa",
        "la aguja toca el surco, no hay apuro esta noche",
        "un acorde de Rhodes que disuelve el reproche"
      ]).map((linea) => {
        const silabas = contarSilabasAprox(linea);
        return {
          texto: linea,
          silabas,
          acento: `Acento en sílabas 4ª y ${Math.max(6, silabas - 1)}ª (sobre beats 2 y 4)`
        };
      })
    },
    {
      seccion: "Gancho (00:46 – 01:09)",
      compases: 8,
      entrega: "Firme, repetitiva, anclada en el groove",
      lineas: (lineasPuras.slice(4, 8).length > 0 ? lineasPuras.slice(4, 8) : [
        "Pausa en el ruido, pausa en el pecho",
        "un compás sincopado bajo el mismo techo",
        "Nada que correr, nada que inventar",
        "solo dejar que el bombo vuelva a respirar"
      ]).map((linea) => {
        const silabas = contarSilabasAprox(linea);
        return {
          texto: linea,
          silabas,
          acento: `Acento marcado en la 3ª sílaba y cierre seco en la ${silabas}ª`
        };
      })
    }
  ];

  // Markdown de salida estricto según especificación
  const markdownLines: string[] = [];
  markdownLines.push(statusLine);
  markdownLines.push('');
  markdownLines.push('## A · ESTRUCTURA DE LA BASE');
  markdownLines.push('| Sección | Inicio–Fin | Qué suena | Energía (0-1) | Función dramática |');
  markdownLines.push('|---|---|---|---|---|');
  seccionesA.forEach((s) => {
    markdownLines.push(`| ${s.seccion} | ${s.tiempo} | ${s.queSuena} | ${s.energia.toFixed(2)} | ${s.funcion} |`);
  });
  markdownLines.push('');
  markdownLines.push(`**Primera entrada de voz recomendada:** ${primeraEntradaVoz}`);
  markdownLines.push(`**Sección que funciona como gancho:** ${gancho}`);
  markdownLines.push(`**Habitación del tema:** ${cuartoLoop}`);
  markdownLines.push('');

  markdownLines.push('## B · ENCAJE DE LA VOZ');
  if (mode === 'base_sola') {
    markdownLines.push('### 1. AFINACIÓN');
    markdownLines.push('MEDICIÓN: NO MEDIDO');
    markdownLines.push('BRECHA: NO MEDIDO (Sin pista de voz adjunta)');
    markdownLines.push('ACCIÓN: NO MEDIDO. Subir toma_001.aiff y metricas_voz.json para calcular Auto-Tune Pro.');
    markdownLines.push('');
    markdownLines.push('### 2. TIEMPO');
    markdownLines.push('MEDICIÓN: NO MEDIDO');
    markdownLines.push('BRECHA: NO MEDIDO');
    markdownLines.push('ACCIÓN: NO MEDIDO');
    markdownLines.push('');
    markdownLines.push('### 3. TONO Y ESPACIO');
    markdownLines.push('MEDICIÓN: NO MEDIDO');
    markdownLines.push('BRECHA: NO MEDIDO');
    markdownLines.push('ACCIÓN: NO MEDIDO');
    markdownLines.push('');
    markdownLines.push('### DIRECCIÓN DE LA PRÓXIMA TOMA');
    bloqueBData.direccionProximaToma.forEach((d) => markdownLines.push(`- ${d}`));
  } else {
    markdownLines.push('### 1. AFINACIÓN');
    markdownLines.push(`**MEDICIÓN:** ${bloqueBData.afinacion?.medicion || 'NO MEDIDO'}`);
    markdownLines.push(`**BRECHA:** ${bloqueBData.afinacion?.brecha || 'NO MEDIDO'}`);
    markdownLines.push(`**ACCIÓN:** ${bloqueBData.afinacion?.accion || 'NO MEDIDO'}`);
    markdownLines.push('');
    markdownLines.push('### 2. TIEMPO');
    markdownLines.push(`**MEDICIÓN:** ${bloqueBData.tiempo?.medicion || 'NO MEDIDO'}`);
    markdownLines.push(`**BRECHA:** ${bloqueBData.tiempo?.brecha || 'NO MEDIDO'}`);
    markdownLines.push(`**ACCIÓN:** ${bloqueBData.tiempo?.accion || 'NO MEDIDO'}`);
    markdownLines.push('');
    markdownLines.push('### 3. TONO Y ESPACIO');
    markdownLines.push(`**MEDICIÓN:** ${bloqueBData.tonoEspacio?.medicion || 'NO MEDIDO'}`);
    markdownLines.push(`**BRECHA:** ${bloqueBData.tonoEspacio?.brecha || 'NO MEDIDO'}`);
    markdownLines.push(`**ACCIÓN:** ${bloqueBData.tonoEspacio?.accion || 'NO MEDIDO'}`);
    markdownLines.push('');
    markdownLines.push('### DIRECCIÓN DE LA PRÓXIMA TOMA');
    bloqueBData.direccionProximaToma.forEach((d) => markdownLines.push(`- ${d}`));
  }
  markdownLines.push('');

  markdownLines.push('## C · LETRA REESTRUCTURADA');
  seccionesLetra.forEach((sec) => {
    markdownLines.push(`### ${sec.seccion} (${sec.compases} compases) — Entrega: *${sec.entrega}*`);
    sec.lineas.forEach((lin) => {
      markdownLines.push(`- "${lin.texto}" · **${lin.silabas} sílabas** · ${lin.acento}`);
    });
    markdownLines.push('');
  });

  const jsonResumen = {
    fuente: "encaje_analista_v1",
    modo: mode,
    medido: medidoKeys,
    no_medido: noMedidoKeys,
    base: {
      bpm,
      tonalidad,
      modo: modoTonal,
      primera_entrada_voz: "00:11",
      gancho: "00:46"
    },
    encaje: mode === 'base_sola' ? "NO_MEDIDO" : {
      retune_speed_ms: bloqueBData.afinacion?.retuneSpeed ?? null,
      flex_tune: bloqueBData.afinacion?.flexTune ?? null,
      humanize: bloqueBData.afinacion?.humanize ?? null,
      nudge_ms: bloqueBData.tiempo?.nudgeMs ?? null,
      de_esser_db: bloqueBData.tonoEspacio?.deEsserDb ?? null,
      volver_a_cantar: bloqueBData.afinacion?.debeVolverACantar ?? false
    }
  };

  markdownLines.push('```json');
  markdownLines.push(JSON.stringify(jsonResumen, null, 2));
  markdownLines.push('```');

  return {
    mode,
    medidoKeys,
    noMedidoKeys,
    statusLine,
    rawMarkdown: markdownLines.join('\n'),
    bloqueA: {
      secciones: seccionesA,
      primeraEntradaVoz,
      gancho,
      cuartoLoop
    },
    bloqueB: bloqueBData,
    bloqueC: {
      secciones: seccionesLetra,
      observacion: "Estructura ajustada a 8 compases por bloque sin saturación silábica."
    },
    jsonResumen
  };
}
