"use client";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let nextNoteTime = 0;
let isPlaying = false;
let tempo = 120;
let currentSoundType = "elec_1";

const lookahead = 25.0; 
const scheduleAheadTime = 0.1; 
let timerID: number | null = null;

// --- NOUVELLES SUBDIVISIONS ---
// On définit pour chaque ID le nombre de divisions du temps et quelles divisions déclenchent un son
export type Subdivision = 
  | "quarter" | "eighth" | "triplet" | "sixteenth" 
  | "1e2d" | "2d1e" | "shuffle" | "1-4-16" 
  | "offbeat" | "2-4-16" | "2-3-trip" | "3-4-16" 
  | "quintolet" | "sextolet" | "septolet" | "trinaire";

const SUBDIVISION_PATTERNS: Record<Subdivision, { divisions: number; pattern: number[] }> = {
  "quarter":    { divisions: 1, pattern: [1] },
  "eighth":     { divisions: 2, pattern: [1, 1] },
  "triplet":    { divisions: 3, pattern: [1, 1, 1] },
  "sixteenth":  { divisions: 4, pattern: [1, 1, 1, 1] },
  "1e2d":       { divisions: 4, pattern: [1, 0, 1, 1] }, // Croche deux doubles
  "2d1e":       { divisions: 4, pattern: [1, 1, 1, 0] }, // Deux doubles croche
  "shuffle":    { divisions: 3, pattern: [1, 0, 1] },    // Triolet de noires (1ere et 3eme)
  "1-4-16":     { divisions: 4, pattern: [1, 0, 0, 1] }, // 1ere et 4eme double
  "offbeat":    { divisions: 2, pattern: [0, 1] },       // Contretemps
  "2-4-16":     { divisions: 4, pattern: [0, 1, 0, 1] }, // 2eme et 4eme double
  "2-3-trip":   { divisions: 3, pattern: [0, 1, 1] },    // 2eme et 3eme du triolet
  "3-4-16":     { divisions: 4, pattern: [0, 0, 1, 1] }, // 3eme et 4eme double
  "quintolet":  { divisions: 5, pattern: [1, 1, 1, 1, 1] },
  "sextolet":   { divisions: 6, pattern: [1, 1, 1, 1, 1, 1] },
  "septolet":   { divisions: 7, pattern: [1, 1, 1, 1, 1, 1, 1] },
  "trinaire":   { divisions: 6, pattern: [1, 0, 1, 0, 1, 0] }, // 3 croches (binaire ressenti trinaire)
};

const settings = {
  beatsPerBar: 4,
  subdivision: "quarter" as Subdivision
};

let subdivisionIndex = 0;
let barCount = 0;
let currentBeat = 0;
let tempoRamp: { enabled: boolean; targetBpm: number; step: number; everyBars: number; } | null = null;

const beatListeners = new Set<(beat: number, isAccent: boolean, currentBpm: number) => void>();

function initAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioContext.destination);
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) initAudio();
  return audioContext!;
}

function playClick(time: number, type: "normal" | "accent" | "cue") {
  const ctx = getAudioContext();
  if (!masterGain) return;

  const osc = ctx.createOscillator();
  const clickGain = ctx.createGain();

  const synthPresets: Record<string, { freq: number; wave: OscillatorType; decay: number }> = {
    elec_1: { freq: 1000, wave: "sine", decay: 0.05 },
    elec_2: { freq: 880, wave: "square", decay: 0.03 },
    elec_3: { freq: 1200, wave: "sine", decay: 0.02 },
    elec_4: { freq: 600, wave: "triangle", decay: 0.08 },
    mech_1: { freq: 400, wave: "triangle", decay: 0.1 }, 
    mech_2: { freq: 350, wave: "sine", decay: 0.15 },
    cowbell: { freq: 800, wave: "square", decay: 0.2 },
    conga: { freq: 200, wave: "sine", decay: 0.2 },
    woodblock: { freq: 2200, wave: "sine", decay: 0.03 },
    clave: { freq: 3200, wave: "sine", decay: 0.02 },
    sticks: { freq: 4000, wave: "sine", decay: 0.01 },
    kick: { freq: 150, wave: "sine", decay: 0.2 },
  };

  const preset = synthPresets[currentSoundType] || synthPresets.elec_1;
  let finalFreq = preset.freq;
  
  if (type === "accent") finalFreq *= 1.5;
  if (type === "cue") finalFreq *= 0.8; 

  osc.type = preset.wave;
  
  if (currentSoundType === "kick") {
    osc.frequency.setValueAtTime(finalFreq * 2, time);
    osc.frequency.exponentialRampToValueAtTime(finalFreq, time + 0.05);
  } else {
    osc.frequency.setValueAtTime(finalFreq, time);
  }

  clickGain.gain.setValueAtTime(0, time);
  clickGain.gain.linearRampToValueAtTime(1, time + 0.002); 
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + preset.decay);

  osc.connect(clickGain);
  clickGain.connect(masterGain);
  osc.start(time);
  osc.stop(time + preset.decay + 0.01); 
}

function nextNote() {
  const secondsPerBeat = 60.0 / tempo;
  const subConfig = SUBDIVISION_PATTERNS[settings.subdivision];
  
  // Le temps est divisé par le nombre de divisions de la subdivision choisie
  const secondsPerNote = secondsPerBeat / subConfig.divisions;

  nextNoteTime += secondsPerNote;
  subdivisionIndex++;

  if (subdivisionIndex >= subConfig.divisions) {
    subdivisionIndex = 0;
    currentBeat++;
    
    if (currentBeat >= settings.beatsPerBar) {
      currentBeat = 0;
      barCount++;
      
      // Gestion de l'automation du tempo
      if (tempoRamp?.enabled && barCount > 0 && barCount % tempoRamp.everyBars === 0) {
        if (tempo < tempoRamp.targetBpm) {
          tempo = Math.min(tempo + tempoRamp.step, tempoRamp.targetBpm);
        } else if (tempo > tempoRamp.targetBpm) {
          tempo = Math.max(tempo - tempoRamp.step, tempoRamp.targetBpm);
        }
      }
    }
  }
}

function scheduler() {
  const ctx = getAudioContext();
  while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
    const subConfig = SUBDIVISION_PATTERNS[settings.subdivision];
    
    // On ne joue le son que si le pattern à cet index vaut 1
    if (subConfig.pattern[subdivisionIndex] === 1) {
      let clickType: "normal" | "accent" | "cue" = "normal";
      
      const isFirstOfMeasure = currentBeat === 0 && subdivisionIndex === 0;
      const isChangeMeasureSoon = tempoRamp?.enabled && (barCount + 1) % tempoRamp.everyBars === 0;
      const isCueBeat = isChangeMeasureSoon && (settings.beatsPerBar - currentBeat) <= 1 && subdivisionIndex === 0;

      if (isCueBeat) clickType = "cue";
      else if (isFirstOfMeasure) clickType = "accent";

      // On notifie l'UI (le flash ne se déclenche que sur subdivisionIndex 0)
      beatListeners.forEach((listener) => listener(currentBeat, isFirstOfMeasure, tempo));
      playClick(nextNoteTime, clickType);
    }

    nextNote();
  }
}

// --- Fonctions d'export ---

export function setTimeSignature(beats: number) {
  settings.beatsPerBar = beats;
  if (currentBeat >= beats) currentBeat = 0;
}

export function setSubdivision(val: Subdivision) {
  settings.subdivision = val;
  subdivisionIndex = 0;
}

export function setVolume(value: number) {
  initAudio();
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.015);
  }
}

export function setSoundType(type: string) { currentSoundType = type; }

export async function startMetronome(bpm: number) {
  if (isPlaying) return;
  initAudio();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  tempo = bpm; 
  currentBeat = 0;
  subdivisionIndex = 0;
  barCount = 0;
  nextNoteTime = ctx.currentTime + 0.05;
  isPlaying = true;
  if (timerID) window.clearInterval(timerID);
  timerID = window.setInterval(() => scheduler(), lookahead);
}

export function stopMetronome() {
  isPlaying = false;
  if (timerID) {
    window.clearInterval(timerID);
    timerID = null;
  }
}

export function setTempo(bpm: number) { tempo = bpm; }

export function setTempoRamp(ramp: { enabled: boolean; targetBpm: number; step: number; everyBars: number; } | null) {
  tempoRamp = ramp;
}

export function onBeat(callback: (beat: number, isAccent: boolean, currentBpm: number) => void) {
  beatListeners.add(callback);
  return () => {
    beatListeners.delete(callback);
  };
}