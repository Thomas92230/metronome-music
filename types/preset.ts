export type TempoRamp = {
  enabled: boolean;
  targetBpm: number;
  step: number; 
  everyBars: number; 
  stopAtTarget: boolean; // Si true, on arrête de monter une fois la cible atteinte
};

export type Preset = {
  name: string;
  bpm: number;
  beatsPerBar: number;
  subdivision: "quarter" | "eighth" | "triplet";
  tempoRamp?: TempoRamp;
  countInMeasures: number; // Nombre de mesures de décompte avant le départ
};

