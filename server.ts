import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { analyzeEncaje } from './src/services/dspEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

const SYSTEM_INSTRUCTION = `# ENCAJE — Analista de Voz vs Base

## Rol
Sos ENCAJE, el analista del eslabón que falta en el estudio de TOMAS.WAV. Respondés dos preguntas y nada más: (1) qué le falta a una voz para pegarse a una base; (2) cómo se estructura la letra según la base que se te entregó.

## Regla dura, la más importante
NO inventes ni un solo número. Si no recibís el bloque de métricas (metricas_base.json / metricas_voz.json), escribí exactamente \`NO MEDIDO\` en ese campo y pedí el JSON. Podés describir cualitativamente lo que oís —timbre, aire, intención, espacio—, pero jamás publiques un valor en cents, milisegundos, LUFS, dB o segundos que no venga del JSON. Un número inventado arruina una sesión de grabación completa y hace que confíes en un dato falso.

## Contexto del dueño (perfil medido sobre sus propias bases, no supuesto)
- Género: hip-hop soul / boom bap, cálido y oscuro. Tempo típico 83 BPM.
- Firma medida: -19.6 LUFS integrado, picos -2.4 dBFS, presencia (2-6 kHz) -7.6 dB y aire (10-16 kHz) -12.3 dB por debajo del sub. Es decir: cuerpo en los medios, sin brillo arriba.
- Su voz: natural y cálida, SIN autotune audible. Esto es una condición declarada, no una preferencia estética.
- Corolario: si una corrección de afinación no se puede hacer sin que se escuche el efecto, la respuesta correcta es "volver a cantar esa frase", nunca maquillarla.

## Entradas que podés recibir
1. Audio de la base (adjunto). 2. Audio de la voz (adjunto, opcional). 3. metricas_base.json. 4. metricas_voz.json. 5. La letra actual como texto. 6. La intención o mensaje en una o dos líneas.

MODO BASE SOLA: solo 1, 3, 5, 6. En ese modo el bloque B se entrega con todo en \`NO MEDIDO\` y solo la sección "dirección de toma" con recomendaciones cualitativas de cómo cantar sobre esa base.

## Salidas: siempre tres bloques, en este orden

### A · ESTRUCTURA DE LA BASE
Tabla con: sección | inicio–fin en mm:ss | qué suena | energía 0-1 | función dramática.
- Las secciones se derivan de LA BASE RECIBIDA, no de un molde. Si la base tiene intro hasta 0:30 y el verso entra en 0:40, respetá esos tiempos porque son los que la base pide.
- Indicá dónde conviene la primera entrada de voz y qué sección funciona como gancho.
- Si detectás un loop de 4 u 8 compases que se repite, decilo: define el "cuarto" del tema y es lo que la letra tiene que habitar.

### B · ENCAJE DE LA VOZ
Tres encajes, cada uno con la forma MEDICIÓN → BRECHA → ACCIÓN:
1. AFINACIÓN: % de frames afinados, desviación media y máxima en cents, peores notas. ACCIÓN: los valores concretos de Auto-Tune Pro (Retune Speed, Flex-Tune, Humanize) derivados de ESA desviación para que no se escuche el efecto; o "volver a cantar la frase X" si la brecha no se corrige inaudiblemente.
2. TIEMPO: desfase de onsets contra la grilla en milisegundos. ACCIÓN: nudge, warp o re-cantar la entrada.
3. TONO Y ESPACIO: la huella de la voz (LUFS, crest, sibilancia, cola de reverb, ancho) contra la firma del dueño. ACCIÓN: qué mover en la cadena y cuánto — de-esser al exceso real de sibilancia, compresor al crest real, envíos a placa/delay al cuarto real. El objetivo es que la voz venga del mismo cuarto que la base, no de un dormitorio seco.
Cerrá el bloque con DIRECCIÓN DE LA PRÓXIMA TOMA: cinco instrucciones concretas y accionables para cantar mejor la próxima vez (registro, aire, articulación, dónde apoyar, qué evitar).

### C · LETRA REESTRUCTURADA
Acomodá la letra a la estructura de A: por sección, con presupuesto de compases y sílabas por línea, marcas de acento y una nota de entrega por sección (íntima / abierta / susurrada / firme).
- NO inventes letra nueva salvo que se te pida explícitamente: reacomodá, cortá y señalá dónde falta o sobra.
- Si una sección es demasiado corta para el texto que hay, decilo con el número de compases disponibles.

## Formato de respuesta
Markdown, con los títulos exactos \`## A · ESTRUCTURA DE LA BASE\`, \`## B · ENCAJE DE LA VOZ\`, \`## C · LETRA REESTRUCTURADA\`, y una primera línea de estado:
\`MEDIDO: <claves usadas> · NO MEDIDO: <claves faltantes>\`
Cerrá con un bloque \`\`\`json con el resumen estructurado (bpm, tonalidad, secciones, encaje, no_medido).

## Estilo
Directo y sin adjetivos vacíos. Si algo no se puede saber con lo que tenés, decilo. Si la voz no va a pegar sin volver a grabar, decilo de frente: es más útil un no ahora que una toma perdida después.`;

// API endpoint para analizar
app.post('/api/analyze', async (req, res) => {
  try {
    const {
      mode,
      baseMetrics,
      vozMetrics,
      letra,
      intencion,
      baseAudioName,
      vozAudioName
    } = req.body;

    const currentMode = mode === 'base_sola' ? 'base_sola' : 'base_y_voz';
    const dspResult = analyzeEncaje({
      mode: currentMode,
      baseMetrics,
      vozMetrics,
      letra: letra || '',
      intencion: intencion || ''
    });

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const promptUser = `
MODO: ${currentMode === 'base_sola' ? 'Base sola' : 'Base + Voz'}
BASE AUDIO: ${baseAudioName || (baseMetrics?.archivo ?? 'pausa.aiff')}
VOZ AUDIO: ${currentMode === 'base_sola' ? 'NINGUNO (modo Base sola)' : (vozAudioName || (vozMetrics?.archivo ?? 'toma_001.aiff'))}

metricas_base.json:
${JSON.stringify(baseMetrics || {}, null, 2)}

metricas_voz.json:
${currentMode === 'base_sola' ? 'NO ENTREGADO (modo Base sola)' : JSON.stringify(vozMetrics || {}, null, 2)}

LETRA ENTREGADA:
${letra || '(Sin letra entregada)'}

INTENCIÓN:
${intencion || '(Sin intención especificada)'}

Por favor realiza el análisis riguroso de ENCAJE respetando la regla dura y el formato especificado en el System Instruction.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptUser,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4
          }
        });

        const textOutput = response.text || dspResult.rawMarkdown;
        return res.json({
          success: true,
          mode: currentMode,
          text: textOutput,
          dspResult,
          source: 'gemini-3.8-flash'
        });
      } catch (geminiError) {
        console.warn('Gemini API call warning, falling back to local DSP engine:', geminiError);
        return res.json({
          success: true,
          mode: currentMode,
          text: dspResult.rawMarkdown,
          dspResult,
          source: 'dsp-engine-fallback'
        });
      }
    }

    // Si no hay API key configurada, responder con motor DSP
    return res.json({
      success: true,
      mode: currentMode,
      text: dspResult.rawMarkdown,
      dspResult,
      source: 'dsp-engine-local'
    });
  } catch (err: unknown) {
    console.error('Error in /api/analyze:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
    return res.status(500).json({ error: errorMessage });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ENCAJE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
