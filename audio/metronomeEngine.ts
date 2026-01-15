// audio/metronomeEngine.ts

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

const lookahead = 25.0; // ms
const scheduleAheadTime = 0.1; // secondes
let timerID: number | null = null;

export type Subdivision = "quarter" | "eighth" | "triplet";
let subdivision: Subdivision = "quarter";
let subdivisionIndex = 0;

let tempoRamp: {
  enabled: boolean;
  targetBpm: number;
  step: number;
  everyBars: number;
} | null = null;

let barCount = 0;
let currentBeat = 0;
let beatsPerBar = 4;

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
    elec_5: { freq: 1500, wave: "sine", decay: 0.01 },
    mech_1: { freq: 400, wave: "triangle", decay: 0.1 }, 
    mech_2: { freq: 350, wave: "sine", decay: 0.15 },
    mech_3: { freq: 450, wave: "triangle", decay: 0.12 },
    cowbell: { freq: 800, wave: "square", decay: 0.2 },
    conga: { freq: 200, wave: "sine", decay: 0.2 },
    woodblock: { freq: 2200, wave: "sine", decay: 0.03 },
    clave: { freq: 3200, wave: "sine", decay: 0.02 },
    sticks: { freq: 4000, wave: "sine", decay: 0.01 },
    cymbal: { freq: 8000, wave: "sine", decay: 0.05 },
    tambourine: { freq: 6000, wave: "sine", decay: 0.04 },
    kick: { freq: 200, wave: "sine", decay: 0.2 },
  };

  const preset = synthPresets[currentSoundType] || synthPresets.elec_1;
  
  let finalFreq = preset.freq;
  if (type === "accent") finalFreq *= 1.5;
  if (type === "cue") finalFreq *= 0.8; 

  osc.type = preset.wave;

  // Effet de "Pitch Drop" pour le Kick (indispensable pour la percussion)
  if (currentSoundType === "kick") {
    osc.frequency.setValueAtTime(finalFreq * 2, time);
    osc.frequency.exponentialRampToValueAtTime(finalFreq, time + 0.05);
  } else {
    osc.frequency.setValueAtTime(finalFreq, time);
  }

  // Enveloppe de volume
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
  const notesPerBeat = subdivision === "eighth" ? 2 : subdivision === "triplet" ? 3 : 1;
  const secondsPerNote = secondsPerBeat / notesPerBeat;

  nextNoteTime += secondsPerNote;
  subdivisionIndex++;

  if (subdivisionIndex >= notesPerBeat) {
    subdivisionIndex = 0;
    currentBeat++;
    
    if (currentBeat >= beatsPerBar) {
      currentBeat = 0;
      barCount++;
      
      if (tempoRamp?.enabled && barCount % tempoRamp.everyBars === 0) {
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
    let clickType: "normal" | "accent" | "cue" = "normal";
    const isAccent = currentBeat === 0 && subdivisionIndex === 0;
    const isChangeMeasure = tempoRamp?.enabled && (barCount + 1) % tempoRamp.everyBars === 0;
    const isCueBeat = isChangeMeasure && (beatsPerBar - currentBeat) <= 1 && subdivisionIndex === 0;

    if (isCueBeat) clickType = "cue";
    else if (isAccent) clickType = "accent";

    beatListeners.forEach((listener) => listener(currentBeat, isAccent, tempo));
    playClick(nextNoteTime, clickType);
    nextNote();
  }
}

// --- EXPORTS ---
export function setVolume(value: number) {
  initAudio();
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.015);
  }
}

export function setSoundType(type: string) {
  currentSoundType = type;
}

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
export function setTimeSignature(beats: number) { 
  beatsPerBar = beats; 
  if (currentBeat >= beats) currentBeat = 0;
}
export function setSubdivision(value: Subdivision) { subdivision = value; }
export function setTempoRamp(ramp: { enabled: boolean; targetBpm: number; step: number; everyBars: number; } | null) {
  tempoRamp = ramp;
}
export function onBeat(callback: (beat: number, isAccent: boolean, currentBpm: number) => void) {
  beatListeners.add(callback);
  return () => beatListeners.delete(callback);
}