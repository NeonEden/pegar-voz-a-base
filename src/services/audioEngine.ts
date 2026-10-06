/**
 * Web Audio Engine para ENCAJE
 * Sintetizador Lo-Fi Boom-Bap (83 BPM) + Pista Vocal con Analizadores FFT en tiempo real
 */

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  baseVolume: number;
  vozVolume: number;
  baseSolo: boolean;
  vozSolo: boolean;
  phaseInverted: boolean;
  baseLoadedName: string;
  vozLoadedName: string;
}

export class EncajeAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private duration = 30.0; // 30s loop demo
  private timerId: number | null = null;

  // Nodes
  private baseGainNode: GainNode | null = null;
  private vozGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  public baseAnalyser: AnalyserNode | null = null;
  public vozAnalyser: AnalyserNode | null = null;

  // Custom audio buffers if uploaded
  private customBaseBuffer: AudioBuffer | null = null;
  private customVozBuffer: AudioBuffer | null = null;
  private baseSourceNode: AudioBufferSourceNode | null = null;
  private vozSourceNode: AudioBufferSourceNode | null = null;

  // Synthesizer active nodes
  private synthNodes: (AudioNode | number)[] = [];

  // State
  private state: AudioEngineState = {
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
  };

  private listeners: ((state: AudioEngineState) => void)[] = [];

  constructor() {
    // Lazy AudioContext on user interaction
  }

  public subscribe(cb: (state: AudioEngineState) => void) {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 1.0;
      this.masterGainNode.connect(this.ctx.destination);

      this.baseGainNode = this.ctx.createGain();
      this.baseGainNode.gain.value = this.state.baseVolume;
      this.baseAnalyser = this.ctx.createAnalyser();
      this.baseAnalyser.fftSize = 512;
      this.baseGainNode.connect(this.baseAnalyser);
      this.baseAnalyser.connect(this.masterGainNode);

      this.vozGainNode = this.ctx.createGain();
      this.vozGainNode.gain.value = this.state.vozVolume;
      this.vozAnalyser = this.ctx.createAnalyser();
      this.vozAnalyser.fftSize = 512;
      this.vozGainNode.connect(this.vozAnalyser);
      this.vozAnalyser.connect(this.masterGainNode);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async loadBaseFile(file: File) {
    this.initContext();
    if (!this.ctx) return;
    const arrayBuffer = await file.arrayBuffer();
    this.customBaseBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.state.baseLoadedName = file.name;
    this.duration = Math.max(this.duration, this.customBaseBuffer.duration);
    this.state.duration = this.duration;
    this.notify();
  }

  public async loadVozFile(file: File) {
    this.initContext();
    if (!this.ctx) return;
    const arrayBuffer = await file.arrayBuffer();
    this.customVozBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.state.vozLoadedName = file.name;
    this.duration = Math.max(this.duration, this.customVozBuffer.duration);
    this.state.duration = this.duration;
    this.notify();
  }

  public setBasePreset() {
    this.customBaseBuffer = null;
    this.state.baseLoadedName = "pausa.aiff (DSP Preset)";
    this.notify();
  }

  public setVozPreset(name = "toma_001.aiff (DSP Preset)") {
    this.customVozBuffer = null;
    this.state.vozLoadedName = name;
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.initContext();
    if (!this.ctx) return;

    this.stopPlaybackNodes();
    this.isPlaying = true;
    this.state.isPlaying = true;
    this.startTime = this.ctx.currentTime - this.pauseTime;

    if (this.customBaseBuffer) {
      this.baseSourceNode = this.ctx.createBufferSource();
      this.baseSourceNode.buffer = this.customBaseBuffer;
      this.baseSourceNode.loop = true;
      if (this.baseGainNode) this.baseSourceNode.connect(this.baseGainNode);
      this.baseSourceNode.start(0, this.pauseTime % this.customBaseBuffer.duration);
    } else {
      this.startSynthesizedBase();
    }

    if (this.customVozBuffer) {
      this.vozSourceNode = this.ctx.createBufferSource();
      this.vozSourceNode.buffer = this.customVozBuffer;
      this.vozSourceNode.loop = true;
      if (this.vozGainNode) this.vozSourceNode.connect(this.vozGainNode);
      this.vozSourceNode.start(0, this.pauseTime % this.customVozBuffer.duration);
    } else {
      this.startSynthesizedVoz();
    }

    this.startTracking();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying || !this.ctx) return;
    this.isPlaying = false;
    this.state.isPlaying = false;
    this.pauseTime = (this.ctx.currentTime - this.startTime) % this.duration;
    this.state.currentTime = this.pauseTime;
    this.stopPlaybackNodes();
    if (this.timerId) window.clearInterval(this.timerId);
    this.notify();
  }

  public seek(timeSeconds: number) {
    this.pauseTime = Math.max(0, Math.min(this.duration, timeSeconds));
    this.state.currentTime = this.pauseTime;
    if (this.isPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  private stopPlaybackNodes() {
    if (this.baseSourceNode) {
      try { this.baseSourceNode.stop(); } catch { /* noop */ }
      this.baseSourceNode.disconnect();
      this.baseSourceNode = null;
    }
    if (this.vozSourceNode) {
      try { this.vozSourceNode.stop(); } catch { /* noop */ }
      this.vozSourceNode.disconnect();
      this.vozSourceNode = null;
    }
    this.synthNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearTimeout(node);
      } else {
        try { (node as AudioScheduledSourceNode).stop?.(); } catch { /* noop */ }
        node.disconnect();
      }
    });
    this.synthNodes = [];
  }

  private startTracking() {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      if (this.ctx && this.isPlaying) {
        this.state.currentTime = (this.ctx.currentTime - this.startTime) % this.duration;
        this.notify();
      }
    }, 100);
  }

  // Sintetizador Lo-Fi Boom Bap a 83 BPM
  private startSynthesizedBase() {
    if (!this.ctx || !this.baseGainNode) return;
    const bpm = 83;
    const beatSec = 60 / bpm; // 0.723s por beat

    // Programar bucle rítmico con Web Audio API
    const scheduleBar = (barTime: number) => {
      if (!this.ctx || !this.isPlaying || !this.baseGainNode) return;

      // Kick en beats 1 y 3 (con ghost en 2.5)
      this.triggerKick(barTime);
      this.triggerKick(barTime + beatSec * 2);
      this.triggerKick(barTime + beatSec * 2.75, 0.4);

      // Warm Snare en beats 2 y 4 (con retardo analógico y LPF)
      this.triggerSnare(barTime + beatSec);
      this.triggerSnare(barTime + beatSec * 3);

      // Lo-fi Hi-Hats con swing
      for (let i = 0; i < 8; i++) {
        const swing = i % 2 === 1 ? 0.03 : 0;
        this.triggerHat(barTime + i * (beatSec / 2) + swing);
      }

      // Acordes de Rhodes lo-fi en C mayor (Cmaj7 -> Am7 -> Dm7 -> G7)
      this.triggerRhodesChord(barTime, [261.63, 329.63, 392.0, 493.88]); // Cmaj7
      this.triggerRhodesChord(barTime + beatSec * 2, [220.0, 261.63, 329.63, 392.0]); // Am7
    };

    const scheduleLoop = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const barDuration = beatSec * 4; // 2.89s
      for (let bar = 0; bar < 4; bar++) {
        scheduleBar(now + bar * barDuration);
      }
      const nextTimer = window.setTimeout(scheduleLoop, (barDuration * 4 - 0.2) * 1000);
      this.synthNodes.push(nextTimer);
    };

    scheduleLoop();
  }

  private triggerKick(time: number, gainMul = 1.0) {
    if (!this.ctx || !this.baseGainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(0.9 * gainMul, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(gain);
    gain.connect(this.baseGainNode);
    osc.start(time);
    osc.stop(time + 0.36);
    this.synthNodes.push(osc, gain);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.baseGainNode) return;
    // Ruido filtrado cálido
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.baseGainNode);
    noise.start(time);
    noise.stop(time + 0.23);
    this.synthNodes.push(noise, filter, gain);
  }

  private triggerHat(time: number) {
    if (!this.ctx || !this.baseGainNode) return;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(8000, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
    osc.connect(gain);
    gain.connect(this.baseGainNode);
    osc.start(time);
    osc.stop(time + 0.05);
    this.synthNodes.push(osc, gain);
  }

  private triggerRhodesChord(time: number, freqs: number[]) {
    if (!this.ctx || !this.baseGainNode) return;
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, time);
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
      osc.connect(gain);
      gain.connect(this.baseGainNode!);
      osc.start(time);
      osc.stop(time + 1.85);
      this.synthNodes.push(osc, gain);
    });
  }

  // Simulación vocal cálida armónica
  private startSynthesizedVoz() {
    if (!this.ctx || !this.vozGainNode) return;
    const bpm = 83;
    const beatSec = 60 / bpm;

    const phrases = [
      { t: 0.5, dur: 1.2, note: 261.63 * Math.pow(2, 34 / 1200) }, // C4 con +34 cents medidos
      { t: 2.0, dur: 1.4, note: 293.66 * Math.pow(2, 28 / 1200) }, // D4
      { t: 3.6, dur: 1.8, note: 392.00 * Math.pow(2, -62 / 1200) }, // G4 con peor nota -62c
      { t: 5.8, dur: 1.6, note: 329.63 * Math.pow(2, 18 / 1200) }  // E4
    ];

    const scheduleVoz = () => {
      if (!this.ctx || !this.isPlaying || !this.vozGainNode) return;
      const now = this.ctx.currentTime;
      phrases.forEach((p) => {
        const time = now + p.t;
        const osc = this.ctx!.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(p.note, time);

        // Formante vocal
        const formant = this.ctx!.createBiquadFilter();
        formant.type = "bandpass";
        formant.frequency.setValueAtTime(850, time);
        formant.Q.setValueAtTime(3.0, time);

        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.28, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + p.dur);

        osc.connect(formant);
        formant.connect(gain);
        gain.connect(this.vozGainNode!);

        osc.start(time);
        osc.stop(time + p.dur + 0.05);
        this.synthNodes.push(osc, formant, gain);
      });

      const nextLoop = window.setTimeout(scheduleVoz, (beatSec * 16 - 0.2) * 1000);
      this.synthNodes.push(nextLoop);
    };

    scheduleVoz();
  }

  // Controles de consola y mezcla
  public setBaseVolume(val: number) {
    this.state.baseVolume = val;
    if (this.baseGainNode) {
      this.baseGainNode.gain.value = this.state.baseSolo ? val : (this.state.vozSolo ? 0 : val);
    }
    this.notify();
  }

  public setVozVolume(val: number) {
    this.state.vozVolume = val;
    if (this.vozGainNode) {
      this.vozGainNode.gain.value = this.state.vozSolo ? val : (this.state.baseSolo ? 0 : val);
    }
    this.notify();
  }

  public toggleBaseSolo() {
    this.state.baseSolo = !this.state.baseSolo;
    if (this.state.baseSolo) this.state.vozSolo = false;
    this.updateSoloMuteGains();
    this.notify();
  }

  public toggleVozSolo() {
    this.state.vozSolo = !this.state.vozSolo;
    if (this.state.vozSolo) this.state.baseSolo = false;
    this.updateSoloMuteGains();
    this.notify();
  }

  public togglePhaseInvert() {
    this.state.phaseInverted = !this.state.phaseInverted;
    if (this.vozGainNode) {
      this.vozGainNode.gain.value = this.state.phaseInverted ? -Math.abs(this.state.vozVolume) : Math.abs(this.state.vozVolume);
    }
    this.notify();
  }

  private updateSoloMuteGains() {
    if (!this.baseGainNode || !this.vozGainNode) return;
    if (this.state.baseSolo) {
      this.baseGainNode.gain.value = this.state.baseVolume;
      this.vozGainNode.gain.value = 0;
    } else if (this.state.vozSolo) {
      this.baseGainNode.gain.value = 0;
      this.vozGainNode.gain.value = this.state.vozVolume;
    } else {
      this.baseGainNode.gain.value = this.state.baseVolume;
      this.vozGainNode.gain.value = this.state.vozVolume;
    }
  }

  public getByteFrequencyData(): { baseData: Uint8Array; vozData: Uint8Array } {
    const baseData = new Uint8Array(256);
    const vozData = new Uint8Array(256);
    if (this.baseAnalyser) this.baseAnalyser.getByteFrequencyData(baseData);
    if (this.vozAnalyser) this.vozAnalyser.getByteFrequencyData(vozData);
    return { baseData, vozData };
  }
}

export const audioEngine = new EncajeAudioEngine();
