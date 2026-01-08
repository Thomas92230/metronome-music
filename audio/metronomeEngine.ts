let audioContext: AudioContext | null = null;
let nextNoteTime = 0;
let isPlaying = false;
let tempo = 120;

// Scheduler timing
const lookahead = 25; // ms
const scheduleAheadTime = 0.1; // secondes
let timerID: number | null = null;

type Subdivision = "quarter" | "eighth" | "triplet";

let subdivision: Subdivision = "quarter";
let subdivisionIndex = 0;

// ✅ tempoRamp est maintenant utilisé pour calculer le tempo effectif
let tempoRamp: {
  enabled: boolean;
  targetBpm: number;
  step: number;
  everyBars: number;
} | null = null;

let barCount = 0;

// Rythme
let currentBeat = 0;
let beatsPerBar = 4;

// Count-in
const COUNT_IN_BEATS = 4;
let countInRemaining = 0;

// ✅ MULTI LISTENERS SAFE
const beatListeners = new Set<
  (beat: number, isAccent: boolean) => void
>();

/**
 * AudioContext (créé après interaction utilisateur)
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Joue un clic selon le type
 */
function playClick(
  time: number,
  type: "normal" | "accent" | "count-in"
) {
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (type === "accent") {
    osc.frequency.value = 1500;
    gain.gain.setValueAtTime(1, time);
  } else if (type === "count-in") {
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.9, time);
  } else {
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.6, time);
  }

  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.05);
}

/**
 * Passe au temps suivant
 */
function nextNote() {
  // ✅ UTILISATION DE TEMPORAMP : 
  // On calcule si le tempo doit augmenter en fonction de la rampe
  if (tempoRamp?.enabled && barCount > 0 && barCount % tempoRamp.everyBars === 0 && currentBeat === 0 && subdivisionIndex === 0) {
      if (tempo < tempoRamp.targetBpm) {
          tempo = Math.min(tempo + tempoRamp.step, tempoRamp.targetBpm);
      }
  }

  const effectiveTempo = tempo;
  const beatsPerSecond = effectiveTempo / 60;
  const secondsPerBeat = 1 / beatsPerSecond;

  let notesPerBeat = 1;
  if (subdivision === "eighth") notesPerBeat = 2;
  if (subdivision === "triplet") notesPerBeat = 3;

  const secondsPerNote = secondsPerBeat / notesPerBeat;

  nextNoteTime += secondsPerNote;
  subdivisionIndex++;

  if (subdivisionIndex >= notesPerBeat) {
    subdivisionIndex = 0;
    const nextBeat = (currentBeat + 1) % beatsPerBar;
    
    if (nextBeat === 0) {
      barCount++;
    }
    
    currentBeat = nextBeat;
  }
}

/**
 * Faut-il jouer le count-in ?
 */
function shouldPlayCountIn() {
  return countInRemaining > 0;
}

/**
 * Scheduler précis (cœur du moteur)
 */
function scheduler() {
  const ctx = getAudioContext();

  while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
    let clickType: "normal" | "accent" | "count-in" = "normal";

    const isAccent = currentBeat === 0 && subdivisionIndex === 0;

    if (isAccent) clickType = "accent";

    if (
      shouldPlayCountIn() &&
      currentBeat >= beatsPerBar - COUNT_IN_BEATS
    ) {
      clickType = "count-in";
      countInRemaining--;
    }

    beatListeners.forEach((listener) => {
      listener(currentBeat, isAccent);
    });

    playClick(nextNoteTime, clickType);
    nextNote();
  }
}

/**
 * Démarrer le métronome
 */
export function startMetronome(bpm: number) {
  if (isPlaying) return;

  tempo = bpm;
  const ctx = getAudioContext();

  currentBeat = 0;
  subdivisionIndex = 0;
  barCount = 0;
  nextNoteTime = ctx.currentTime + 0.05;
  countInRemaining = COUNT_IN_BEATS;

  isPlaying = true;
  timerID = window.setInterval(scheduler, lookahead);
}

/**
 * Arrêter le métronome
 */
export function stopMetronome() {
  if (!isPlaying) return;

  isPlaying = false;

  if (timerID) {
    clearInterval(timerID);
    timerID = null;
  }
}

export function setTempo(bpm: number) {
  tempo = bpm;
}

export function setTimeSignature(beats: number) {
  beatsPerBar = beats;
}

export function onBeat(
  callback: (beat: number, isAccent: boolean) => void
) {
  beatListeners.add(callback);
  return () => {
    beatListeners.delete(callback);
  };
}

export function setSubdivision(value: Subdivision) {
  subdivision = value;
}

export function setTempoRamp(ramp: {
    enabled: boolean;
    targetBpm: number;
    step: number;
    everyBars: number;
} | null) {
  tempoRamp = ramp;
  barCount = 0;
}